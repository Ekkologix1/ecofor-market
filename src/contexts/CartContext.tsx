"use client"

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useCSRF } from '@/hooks/useCSRF'
import { SHIPPING, calculateShippingCost, isFreeShipping, getDeliveryTime, formatPrice } from '@/lib/constants/business'

// Interfaz para Product - corrige el tipo any en addItem
interface Product {
  id: string
  name: string
  sku: string
  basePrice: number
  wholesalePrice?: number
  stock: number
  unit: string
  brand?: string
  mainImage?: string // Agregar la imagen del producto
  category: {
    name: string
    slug: string
  }
}

// Interfaz para ServerCartItem - corrige el tipo any en transformServerItem
interface ServerCartItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  discount?: number
  product?: {
    id?: string
    name?: string
    sku?: string
    mainImage?: string | null
    unit?: string
    brand?: string
    stock?: number
    active?: boolean
    category?: {
      name?: string
      slug?: string
    }
  }
}

interface CartItem {
  id: string
  productId: string
  name: string
  sku: string
  basePrice: number
  finalPrice: number
  quantity: number
  stock: number
  unit: string
  brand?: string
  category: {
    name: string
    slug: string
  }
  discount?: {
    percentage: number
    amount: number
    reason: string
  }
  product: {
    id: string
    name: string
    sku: string
    mainImage?: string | null
    unit: string
    brand?: string
    stock: number
    active: boolean
    category: {
      name: string
      slug: string
    }
  }
}

interface CartSummary {
  subtotal: number
  totalDiscount: number
  total: number
  totalItems: number
  freeShipping: boolean
  remainingForFreeShipping: number
  estimatedDelivery: string
}

interface CartContextType {
  items: CartItem[]
  summary: CartSummary
  loading: boolean
  itemOperationsLoading: boolean
  error: string | null
  addItem: (product: Product, quantity?: number) => Promise<boolean> // Corregido: Product en lugar de any
  removeItem: (itemId: string) => Promise<boolean>
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>
  clearCart: () => Promise<boolean>
  refreshCart: () => Promise<void>
  getTotalItems: () => number
  getTotalPrice: () => number
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  canUseCart: boolean
  // Toast para notificaciones
  showToast: boolean
  toastProduct: string
  showAddToast: (productName: string) => void
  hideToast: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)


export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const { token: csrfToken, isLoading: csrfLoading, error: csrfError, refreshToken: refreshCSRFToken } = useCSRF()
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [itemOperationsLoading, setItemOperationsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para el toast
  const [showToast, setShowToast] = useState(false)
  const [toastProduct, setToastProduct] = useState("")

  // Permitir usar el carrito si el usuario está autenticado (no requiere validación)
  // Usar useMemo para estabilizar el valor y evitar cambios en el array de dependencias
  const canUseCart = useMemo(() => Boolean(session?.user), [session?.user])

  // Helper function para obtener token CSRF fresco
  const getFreshCSRFToken = async (): Promise<string> => {
    const response = await fetch("/api/csrf-token", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      }
    })
    
    if (!response.ok) {
      throw new Error('No se pudo obtener nuevo token CSRF')
    }
    
    const data = await response.json()
    return data.token
  }

  // Helper function para hacer llamadas API con token CSRF fresco
  const apiCallWithFreshToken = async (url: string, options: RequestInit = {}) => {
    const freshToken = await getFreshCSRFToken()
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-CSRF-Token': freshToken,
      ...options.headers,
    }

    const response = await fetch(url, {
      headers,
      ...options,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Error en la solicitud')
    }

    return data
  }

  // Helper para detectar IDs temporales
  const isTemporaryId = (id: string): boolean => {
    return id.startsWith('temp-')
  }

  // Helper para obtener el ID real del servidor para un item temporal
  const getRealItemId = (temporaryId: string): string | null => {
    // Extraer el productId del ID temporal (formato: temp-productId-timestamp)
    const productId = temporaryId.split('-')[1]
    const item = items.find(item => item.productId === productId && !isTemporaryId(item.id))
    return item ? item.id : null
  }

  // API helper functions
  // Usar useCallback para estabilizar la función y evitar cambios en el array de dependencias
  const apiCall = useCallback(async (url: string, options: RequestInit = {}) => {
    // Verificar autenticación antes de hacer llamadas a APIs protegidas
    if (url.includes('/api/cart') && !canUseCart) {
      throw new Error('Usuario no autenticado')
    }

    // Verificar que tenemos token CSRF para operaciones que lo requieren
    const requiresCSRF = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || 'GET')
    
    // Esperar a que el token CSRF esté disponible si está cargando
    if (requiresCSRF && csrfLoading) {
      // Esperar hasta que el token esté disponible (máximo 5 segundos)
      let waited = 0
      while (csrfLoading && waited < 5000) {
        await new Promise(resolve => setTimeout(resolve, 100))
        waited += 100
      }
    }
    
    if (requiresCSRF && !csrfToken) {
      console.error('Token CSRF no disponible para operación:', options.method, url)
      throw new Error('Token CSRF requerido')
    }

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      }

      // Agregar token CSRF si está disponible y es necesario
      if (requiresCSRF && csrfToken) {
        (headers as Record<string, string>)['X-CSRF-Token'] = csrfToken
        console.log('Token CSRF agregado al header:', csrfToken.substring(0, 10) + '...')
      } else if (requiresCSRF) {
        console.error('Token CSRF requerido pero no disponible para:', options.method, url)
      }

      const response = await fetch(url, {
        headers,
        credentials: 'include', // Importante: incluir cookies de sesión
        ...options,
      })

      const data = await response.json()

      if (!response.ok) {
        // Para errores 401 (no autenticado), verificar si el usuario realmente está autenticado
        // Si el usuario está autenticado según el cliente pero el servidor devuelve 401,
        // puede ser un problema de sesión/token, no un error de autenticación real
        if (response.status === 401) {
          const errorMessage = data.error || 'Usuario no autorizado'
          
          // Si el usuario está autenticado según el cliente, NO lanzar error
          // Simplemente retornar un objeto vacío o null para que el código que llama pueda manejar esto
          if (canUseCart && session?.user) {
            console.warn('⚠️ Error 401 pero usuario está autenticado. Puede ser problema de sesión/token. No se lanzará error.', errorMessage)
            // Retornar un objeto vacío en lugar de lanzar error
            // Esto permite que el código que llama maneje el caso sin romper
            return { cart: { items: [] }, item: null }
          }
          
          // Solo lanzar error de autenticación si el usuario realmente no está autenticado
          const isRealAuthError = errorMessage.includes('no autenticado') || 
                                  errorMessage.includes('no autorizado') ||
                                  errorMessage.includes('Sesión inválida') ||
                                  errorMessage.includes('INVALID_SESSION')
          
          if (isRealAuthError) {
            const authError = new Error(errorMessage)
            ;(authError as any).isAuthError = true
            throw authError
          } else {
            // Si es un 401 pero no es claramente un error de autenticación, tratarlo como error genérico
            throw new Error(errorMessage || 'Error en la solicitud')
          }
        }
        // Para errores 403 (no validado o CSRF), también crear un error especial pero diferente
        if (response.status === 403) {
          if (data.error?.includes('validado')) {
            const validationError = new Error(data.error || 'Usuario no validado')
            ;(validationError as any).isValidationError = true
            throw validationError
          } else if (data.error?.includes('CSRF') || data.error?.includes('Token')) {
            // Error de CSRF, no es un error de autenticación real
            throw new Error(data.error || 'Error de token de seguridad')
          }
        }
        throw new Error(data.error || 'Error en la solicitud')
      }

      return data
    } catch (err) {
      // No loguear errores de autenticación (401) - son esperados cuando el usuario no está autenticado
      if (err instanceof Error && (err as any).isAuthError) {
        throw err
      }
      // Si el usuario está autenticado pero hay un error, loguear con advertencia
      if (canUseCart && session?.user) {
        console.warn('⚠️ Error en API pero usuario está autenticado:', err)
      } else {
        console.error('❌ API Error:', err)
      }
      throw err
    }
  }, [canUseCart, csrfToken, csrfLoading, session?.user])

  // Transformar datos del servidor al formato del contexto
  const transformServerItem = (serverItem: ServerCartItem): CartItem => { // Corregido: ServerCartItem en lugar de any
    const basePrice = serverItem.unitPrice
    const finalPrice = serverItem.unitPrice * (1 - (serverItem.discount || 0) / 100)
    
    return {
      id: serverItem.id,
      productId: serverItem.productId,
      name: serverItem.product?.name || 'Producto sin nombre',
      sku: serverItem.product?.sku || '',
      basePrice: basePrice,
      finalPrice: finalPrice,
      quantity: serverItem.quantity,
      stock: serverItem.product?.stock || 0,
      unit: serverItem.product?.unit || 'unidad',
      brand: serverItem.product?.brand || '',
      category: {
        name: serverItem.product?.category?.name || 'Sin categoría',
        slug: serverItem.product?.category?.slug || 'sin-categoria'
      },
      discount: serverItem.discount && serverItem.discount > 0 ? {
        percentage: serverItem.discount,
        amount: (basePrice * serverItem.quantity * serverItem.discount) / 100,
        reason: `${serverItem.discount}% descuento aplicado`
      } : undefined,
      product: {
        id: serverItem.product?.id || serverItem.productId,
        name: serverItem.product?.name || 'Producto sin nombre',
        sku: serverItem.product?.sku || '',
        mainImage: serverItem.product?.mainImage || null,
        unit: serverItem.product?.unit || 'unidad',
        brand: serverItem.product?.brand || '',
        stock: serverItem.product?.stock || 0,
        active: serverItem.product?.active !== false,
        category: {
          name: serverItem.product?.category?.name || 'Sin categoría',
          slug: serverItem.product?.category?.slug || 'sin-categoria'
        }
      }
    }
  }

  // Cargar carrito desde el servidor
  // Usar useCallback para estabilizar la función y evitar cambios en el array de dependencias
  const refreshCart = useCallback(async (): Promise<void> => {
    console.log('🔄 refreshCart llamado, canUseCart:', canUseCart)
    
    if (!canUseCart) {
      console.log('⚠️ No se puede usar el carrito, limpiando items')
      setItems([])
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      console.log('📡 Llamando a /api/cart...')
      const response = await apiCall('/api/cart')
      console.log('✅ Respuesta recibida:', response)
      
      // Si la respuesta es vacía (porque hubo un 401 pero el usuario está autenticado), mantener items actuales
      if (!response || (!response.cart && !response.item)) {
        console.warn('⚠️ Respuesta vacía del servidor (posible problema de sesión). Manteniendo items locales.')
        // NO limpiar el carrito, mantener los items que ya están
        return
      }
      
      if (response.cart && response.cart.items) {
        const transformedItems = response.cart.items.map(transformServerItem)
        console.log('📦 Items transformados:', transformedItems.length, transformedItems.map(i => ({ id: i.id, productId: i.productId, name: i.name })))
        
        // Si hay items temporales en el estado local, mantenerlos y agregar los del servidor
        const tempItems = items.filter(item => isTemporaryId(item.id))
        if (tempItems.length > 0) {
          console.log('📦 Manteniendo items temporales y agregando items del servidor')
          // Combinar items temporales con items del servidor
          // Si hay un item temporal y uno del servidor con el mismo productId, usar el del servidor
          const combinedItems = [...transformedItems]
          tempItems.forEach(tempItem => {
            const existsInServer = transformedItems.some(item => item.productId === tempItem.productId)
            if (!existsInServer) {
              combinedItems.push(tempItem)
            }
          })
          setItems(combinedItems)
        } else {
          setItems(transformedItems)
        }
      } else if (response.cart && Array.isArray(response.cart.items) && response.cart.items.length === 0) {
        // Si el carrito está vacío en el servidor, SIEMPRE mantener items temporales si existen
        const tempItems = items.filter(item => isTemporaryId(item.id))
        if (tempItems.length > 0) {
          console.log('📦 Carrito vacío en el servidor pero hay items temporales, manteniéndolos')
          // Mantener solo los items temporales - NO limpiar
          setItems(tempItems)
        } else {
          console.log('📦 Carrito vacío en el servidor y no hay items temporales')
          // Solo limpiar si realmente no hay items temporales
          // Pero verificar primero si hay items en el estado actual antes de limpiar
          if (items.length === 0) {
            setItems([])
          } else {
            console.log('⚠️ Hay items en el estado pero no son temporales, manteniéndolos')
            // Mantener los items que ya están
          }
        }
      } else {
        console.warn('⚠️ Respuesta del servidor no tiene la estructura esperada:', response)
        // NO limpiar el carrito si hay un problema con la respuesta
        // Mantener los items que ya están (incluyendo temporales)
      }
    } catch (err) {
      // Detectar errores de autenticación (401)
      const isAuthError = err instanceof Error && (
        (err as any).isAuthError || 
        err.message.includes('Usuario no autorizado') || 
        err.message.includes('no autorizado') ||
        err.message.includes('Usuario no autenticado')
      )
      
      console.error('❌ Error al cargar carrito:', err, 'isAuthError:', isAuthError, 'session?.user:', !!session?.user)
      
      // Si el usuario está autenticado según el cliente, NO limpiar el carrito
      // Puede ser un problema temporal de sesión/token que se resolverá
      if (session?.user) {
        // Mostrar error pero mantener los items del carrito
        setError(err instanceof Error ? err.message : 'Error al cargar el carrito. Los items locales se mantienen.')
        console.warn('⚠️ Error loading cart pero usuario está autenticado. Manteniendo items locales:', err)
        // NO limpiar el carrito - mantener los items que ya están en el estado local
      } else {
        // Si realmente no está autenticado, limpiar el carrito
        console.log('⚠️ Usuario no autenticado, limpiando carrito')
        setItems([])
        setError(null)
      }
    } finally {
      setLoading(false)
    }
  }, [canUseCart, session?.user, apiCall])

  // Calcular resumen del carrito
  const calculateSummary = (): CartSummary => {
    const subtotal = items.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0)
    const totalDiscount = items.reduce((sum, item) => sum + (item.discount?.amount || 0), 0)
    const total = items.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0)
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    
    const freeShipping = isFreeShipping(total)
    const remainingForFreeShipping = Math.max(0, SHIPPING.FREE_SHIPPING_MINIMUM - total)

    const estimatedDelivery = getDeliveryTime('Gran Concepción') // Por defecto
    
    return {
      subtotal,
      totalDiscount,
      total,
      totalItems,
      freeShipping,
      remainingForFreeShipping,
      estimatedDelivery
    }
  }

  const summary = calculateSummary()

  // Cargar carrito inicial cuando el usuario puede usarlo
  const pathname = usePathname()
  
  // Estabilizar el userId para evitar cambios en el array de dependencias
  const userId = useMemo(() => session?.user?.id ?? null, [session?.user?.id])
  
  // Usar un ref para rastrear si hay items temporales sin causar re-renders
  const hasTempItemsRef = useRef(false)
  const clearedCartRef = useRef(false)
  
  useEffect(() => {
    // Actualizar el ref cuando cambian los items
    hasTempItemsRef.current = items.some(item => isTemporaryId(item.id))
    // Resetear el flag de limpieza si hay items
    if (items.length > 0) {
      clearedCartRef.current = false
    }
  }, [items])
  
  useEffect(() => {
    // Solo cargar el carrito si estamos en una página que lo necesita
    const cartPages = ['/catalogo', '/checkout', '/dashboard']
    const isCartPage = cartPages.some(page => pathname.startsWith(page))
    const isCheckoutPage = pathname.startsWith('/checkout')
    
    console.log('🔍 useEffect carrito:', { canUseCart, isCartPage, isCheckoutPage, pathname, userId })
    
    if (canUseCart && isCartPage) {
      // Si estamos en checkout y hay items temporales, NO refrescar el carrito
      // para evitar que se limpien los items temporales
      if (isCheckoutPage && hasTempItemsRef.current) {
        console.log('⚠️ En checkout con items temporales, NO refrescando carrito para evitar pérdida de items')
        return
      }
      
      // Agregar un pequeño delay para evitar múltiples llamadas
      const timeoutId = setTimeout(() => {
        console.log('⏰ Ejecutando refreshCart desde useEffect')
        refreshCart()
      }, 100)
      
      return () => {
        console.log('🧹 Limpiando timeout de refreshCart')
        clearTimeout(timeoutId)
      }
    } else if (!canUseCart) {
      // Solo limpiar el carrito si el usuario no puede usarlo (no autenticado)
      // NO limpiar si solo no estás en una página de carrito
      // Usar un ref para evitar loops infinitos
      if (!clearedCartRef.current) {
        console.log('⚠️ Usuario no puede usar carrito, limpiando items')
        setItems([])
        setIsOpen(false)
        setError(null)
        clearedCartRef.current = true
      }
    } else {
      console.log('ℹ️ Manteniendo items del carrito (no en página de carrito pero usuario autenticado)')
    }
    // Si canUseCart es true pero no estás en una página de carrito, mantener los items
  }, [canUseCart, userId, pathname, refreshCart])

  // Agregar producto al carrito
  const addItem = async (product: Product, quantity: number = 1): Promise<boolean> => { // Corregido: Product en lugar de any
    if (!canUseCart) return false
    
    // Esperar a que el token CSRF esté disponible
    if (csrfLoading) {
      setError('Cargando token de seguridad...')
      return false
    }
    
    if (!csrfToken) {
      setError('Token de seguridad no disponible')
      return false
    }
    
    // Actualización optimista: agregar inmediatamente al estado local
    const optimisticItem: CartItem = {
      id: `temp-${product.id}-${Date.now()}`, // ID temporal
      productId: product.id,
      name: product.name,
      sku: product.sku,
      basePrice: product.basePrice,
      finalPrice: product.basePrice,
      quantity: quantity,
      stock: product.stock,
      unit: product.unit || 'unidad',
      brand: product.brand,
      category: product.category,
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        mainImage: product.mainImage || '',
        unit: product.unit || 'unidad',
        brand: product.brand || '',
        stock: product.stock,
        active: true,
        category: product.category
      }
    }

    // Agregar optimistamente al carrito local
    setItems(prevItems => {
      // Verificar si el producto ya existe
      const existingItemIndex = prevItems.findIndex(item => item.productId === product.id)
      
      if (existingItemIndex >= 0) {
        // Si existe, actualizar cantidad
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity
        }
        return updatedItems
      } else {
        // Si no existe, agregar nuevo item
        return [...prevItems, optimisticItem]
      }
    })

    // Limpiar toasts anteriores y mostrar nuevo toast
    hideToast()
    setTimeout(() => {
      showAddToast(product.name)
    }, 100) // Pequeño delay para evitar conflictos
    
    try {
      setError(null)

      console.log('📤 Agregando producto al carrito:', { productId: product.id, quantity, productName: product.name })
      
      // Llamada a la API en segundo plano
      const response = await apiCall('/api/cart', {
        method: 'POST',
        body: JSON.stringify({
          productId: product.id,
          quantity: quantity
        })
      })
      
      console.log('📥 Respuesta completa del servidor:', response)

      // Si la respuesta es vacía (porque hubo un 401 pero el usuario está autenticado), mantener el item optimista
      if (!response || !response.item) {
        console.warn('⚠️ No hay respuesta del servidor (posible problema de sesión). Manteniendo item optimista.')
        // Mantener el item optimista que ya agregamos
        // NO llamar refreshCart porque podría limpiar el carrito
        return true
      }
      
      // Actualizar el item temporal con el ID real del servidor
      if (response.item) {
        // La respuesta del servidor tiene una estructura diferente, necesitamos adaptarla
        const serverItem: ServerCartItem = {
          id: response.item.id,
          productId: response.item.productId,
          quantity: response.item.quantity,
          unitPrice: response.item.unitPrice,
          discount: response.item.discount || 0,
          product: response.item.product
        }
        
        const transformedItem = transformServerItem(serverItem)
        
        console.log('✅ Respuesta del servidor recibida:', {
          optimisticId: optimisticItem.id,
          realId: transformedItem.id,
          productId: product.id,
          quantity: transformedItem.quantity
        })
        
        setItems(prevItems => {
          console.log('📦 Items antes de actualizar:', prevItems.length, prevItems.map(i => ({ id: i.id, productId: i.productId, name: i.name })))
          
          // Buscar el item temporal por productId en lugar de id temporal
          const tempItemIndex = prevItems.findIndex(item => 
            item.id === optimisticItem.id || item.productId === product.id
          )
          
          console.log('🔍 Índice encontrado:', tempItemIndex)
          
          if (tempItemIndex >= 0) {
            // Reemplazar el item temporal con el real
            const updatedItems = [...prevItems]
            updatedItems[tempItemIndex] = transformedItem
            console.log('✅ Item actualizado, total items:', updatedItems.length, updatedItems.map(i => ({ id: i.id, productId: i.productId, name: i.name })))
            return updatedItems
          } else {
            // Si no encontramos el item temporal, agregar el nuevo
            console.log('⚠️ Item temporal no encontrado, agregando nuevo item')
            const newItems = [...prevItems, transformedItem]
            console.log('✅ Nuevo item agregado, total items:', newItems.length)
            return newItems
          }
        })
      }
      
      return true

    } catch (err) {
      // En caso de error, revertir el cambio optimista
      setItems(prevItems => {
        const existingItemIndex = prevItems.findIndex(item => item.productId === product.id)
        
        if (existingItemIndex >= 0) {
          const updatedItems = [...prevItems]
          const newQuantity = updatedItems[existingItemIndex].quantity - quantity
          
          if (newQuantity <= 0) {
            // Remover item si la cantidad queda en 0 o menos
            return updatedItems.filter((_, index) => index !== existingItemIndex)
          } else {
            // Actualizar cantidad
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: newQuantity
            }
            return updatedItems
          }
        }
        
        // Remover item temporal si no existía antes
        return prevItems.filter(item => item.id !== optimisticItem.id)
      })

      // Si es error de autenticación, propagarlo para que se maneje en el componente
      if (err instanceof Error && (err as any).isAuthError) {
        throw err
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Error al agregar producto'
      
      // Si es error de CSRF, intentar renovar el token y reintentar
      if (errorMessage.includes('CSRF') || errorMessage.includes('Token') || errorMessage.includes('403')) {
        console.log('Error de CSRF detectado, renovando token...')
        try {
          // Renovar token CSRF en el contexto
          await refreshCSRFToken()
          
          // Esperar un poco para asegurar que el token se haya actualizado
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Usar la función helper que obtiene un token fresco
          const response = await apiCallWithFreshToken('/api/cart', {
            method: 'POST',
            body: JSON.stringify({
              productId: product.id,
              quantity: quantity
            })
          })

          // Recargar carrito para obtener datos actualizados
          await refreshCart()
          
          return true
        } catch (retryErr) {
          setError(retryErr instanceof Error ? retryErr.message : 'Error al agregar producto después de reintentar')
          console.error('Error adding item after retry:', retryErr)
          return false
        }
      }
      
      setError(errorMessage)
      console.error('Error adding item:', err)
      return false
    }
  }

  // Eliminar producto del carrito
  const removeItem = async (itemId: string): Promise<boolean> => {
    if (!canUseCart) return false
    
    // Verificar token CSRF
    if (csrfLoading || !csrfToken) {
      setError('Token de seguridad no disponible')
      return false
    }

    // Si es un ID temporal, solo remover del estado local
    if (isTemporaryId(itemId)) {
      console.log('⚠️ Removiendo item temporal del estado local')
      setItems(prevItems => prevItems.filter(item => item.id !== itemId))
      return true
    }
    
    try {
      // Mostrar loading solo por un tiempo mínimo para feedback visual
      setItemOperationsLoading(true)
      setError(null)

      // Actualización optimista inmediata del estado local
      setItems(prevItems => prevItems.filter(item => item.id !== itemId))

      // Promesa para llamada API en segundo plano
      const apiPromise = apiCall(`/api/cart/${itemId}`, {
        method: 'DELETE'
      })

      // Timeout mínimo para feedback visual (150ms)
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 150))
      
      // Esperar tanto la API como el tiempo mínimo
      await Promise.all([apiPromise, minLoadingTime])

      return true

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar producto'
      
      // Si es error de CSRF, intentar renovar el token y reintentar
      if (errorMessage.includes('CSRF') || errorMessage.includes('Token') || errorMessage.includes('403')) {
        console.log('Error de CSRF detectado al eliminar, renovando token...')
        try {
          // Renovar token CSRF en el contexto
          await refreshCSRFToken()
          
          // Esperar un poco para asegurar que el token se haya actualizado
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Usar la función helper que obtiene un token fresco
          await apiCallWithFreshToken(`/api/cart/${itemId}`, {
            method: 'DELETE'
          })

          // Actualizar estado local inmediatamente
          setItems(prevItems => prevItems.filter(item => item.id !== itemId))
          return true
        } catch (retryErr) {
          setError(retryErr instanceof Error ? retryErr.message : 'Error al eliminar producto después de reintentar')
          console.error('Error removing item after retry:', retryErr)
          
          // Recargar carrito en caso de error para mantener consistencia
          await refreshCart()
          return false
        }
      }
      
      setError(errorMessage)
      console.error('Error removing item:', err)
      
      // Recargar carrito en caso de error para mantener consistencia
      await refreshCart()
      return false
    } finally {
      setItemOperationsLoading(false)
    }
  }

  // Actualizar cantidad de un producto
  const updateQuantity = async (itemId: string, quantity: number): Promise<boolean> => {
    if (!canUseCart) return false
    
    if (quantity <= 0) {
      return await removeItem(itemId)
    }

    // Verificar token CSRF
    if (csrfLoading || !csrfToken) {
      setError('Token de seguridad no disponible')
      return false
    }

    // Activar loading inmediatamente para feedback visual consistente
    setItemOperationsLoading(true)
    setError(null)

    // Si es un ID temporal, NO intentar sincronizar - solo actualizar localmente
    // La sincronización se hará cuando el usuario agregue el producto o cuando se recargue la página
    if (isTemporaryId(itemId)) {
      console.log('⚠️ Actualizando item temporal localmente (sin sincronizar con servidor)')
      
      // Verificar si el item temporal existe
      const tempItem = items.find(item => item.id === itemId)
      if (!tempItem) {
        console.warn('⚠️ Item temporal no encontrado en el estado local')
        setItemOperationsLoading(false)
        return false
      }
      
      // Actualizar el item temporal localmente sin llamar al servidor
      setItems(prevItems =>
        prevItems.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              quantity: quantity
            }
          }
          return item
        })
      )
      
      setItemOperationsLoading(false)
      return true
    }

    try {

      // Actualización optimista inmediata del estado local
      setItems(prevItems =>
        prevItems.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              quantity: quantity
            }
          }
          return item
        })
      )

      // Promesa para llamada API en segundo plano
      const apiPromise = apiCall(`/api/cart/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity })
      })

      // Timeout mínimo más corto para mejor UX (100ms)
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 100))
      
      // Esperar tanto la API como el tiempo mínimo
      const [response] = await Promise.all([apiPromise, minLoadingTime])

      // Actualizar con datos reales del servidor
      setItems(prevItems =>
        prevItems.map(item => {
          if (item.id === itemId) {
            const serverItem = response.item
            return {
              ...item,
              quantity: serverItem.quantity,
              basePrice: serverItem.unitPrice,
              finalPrice: serverItem.unitPrice * (1 - (serverItem.discount || 0) / 100),
              discount: serverItem.discount && serverItem.discount > 0 ? {
                percentage: serverItem.discount,
                amount: (serverItem.unitPrice * serverItem.quantity * serverItem.discount) / 100,
                reason: `${serverItem.discount}% descuento aplicado`
              } : undefined,
              product: {
                ...item.product,
                stock: serverItem.product?.stock || item.product.stock,
                mainImage: serverItem.product?.mainImage || item.product.mainImage
              }
            }
          }
          return item
        })
      )

      return true

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar cantidad'
      
      // Si es error de CSRF, intentar renovar el token y reintentar
      if (errorMessage.includes('CSRF') || errorMessage.includes('Token') || errorMessage.includes('403')) {
        console.log('Error de CSRF detectado al actualizar cantidad, renovando token...')
        try {
          // Renovar token CSRF en el contexto
          await refreshCSRFToken()
          
          // Esperar un poco para asegurar que el token se haya actualizado
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Usar la función helper que obtiene un token fresco
          const response = await apiCallWithFreshToken(`/api/cart/${itemId}`, {
            method: 'PATCH',
            body: JSON.stringify({ quantity })
          })

          // Actualizar item específico en el estado local (optimizado)
          setItems(prevItems =>
            prevItems.map(item => {
              if (item.id === itemId) {
                const serverItem = response.item
                return {
                  ...item,
                  quantity: serverItem.quantity,
                  basePrice: serverItem.unitPrice,
                  finalPrice: serverItem.unitPrice * (1 - (serverItem.discount || 0) / 100),
                  discount: serverItem.discount && serverItem.discount > 0 ? {
                    percentage: serverItem.discount,
                    amount: (serverItem.unitPrice * serverItem.quantity * serverItem.discount) / 100,
                    reason: `${serverItem.discount}% descuento aplicado`
                  } : undefined,
                  product: {
                    ...item.product,
                    stock: serverItem.product?.stock || item.product.stock,
                    mainImage: serverItem.product?.mainImage || item.product.mainImage
                  }
                }
              }
              return item
            })
          )

          return true
        } catch (retryErr) {
          setError(retryErr instanceof Error ? retryErr.message : 'Error al actualizar cantidad después de reintentar')
          console.error('Error updating quantity after retry:', retryErr)
          
          // Recargar carrito en caso de error
          await refreshCart()
          return false
        }
      }
      
      setError(errorMessage)
      console.error('Error updating quantity:', err)
      
      // Recargar carrito en caso de error
      await refreshCart()
      return false
    } finally {
      setItemOperationsLoading(false)
    }
  }

  // Limpiar carrito completamente
  const clearCart = async (): Promise<boolean> => {
    if (!canUseCart) return false
    
    // Verificar token CSRF - si está cargando, esperar un poco
    if (csrfLoading) {
      setError('Cargando token de seguridad...')
      return false
    }
    
    if (!csrfToken) {
      setError('Token de seguridad no disponible')
      return false
    }
    
    try {
      setLoading(true)
      setError(null)
      
      // Limpiar toasts existentes antes de vaciar el carrito
      hideToast()

      await apiCall('/api/cart', {
        method: 'DELETE'
      })

      setItems([])
      setIsOpen(false)
      return true

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al limpiar carrito'
      
      // Si es error de CSRF, intentar renovar el token y reintentar
      if (errorMessage.includes('CSRF') || errorMessage.includes('Token') || errorMessage.includes('403')) {
        console.log('Error de CSRF detectado al limpiar carrito, renovando token...')
        try {
          // Renovar token CSRF en el contexto
          await refreshCSRFToken()
          
          // Esperar un poco para asegurar que el token se haya actualizado
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Usar la función helper que obtiene un token fresco
          await apiCallWithFreshToken('/api/cart', {
            method: 'DELETE'
          })

          setItems([])
          setIsOpen(false)
          return true
        } catch (retryErr) {
          setError(retryErr instanceof Error ? retryErr.message : 'Error al limpiar carrito después de reintentar')
          console.error('Error clearing cart after retry:', retryErr)
          return false
        }
      }
      
      setError(errorMessage)
      console.error('Error clearing cart:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  const getTotalItems = (): number => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = (): number => {
    return items.reduce((total, item) => total + (item.finalPrice * item.quantity), 0)
  }

  const openCart = () => {
    if (canUseCart) {
      setIsOpen(true)
    }
  }

  const closeCart = () => {
    setIsOpen(false)
    // Limpiar errores al cerrar
    setError(null)
  }

  // Funciones del toast
  const showAddToast = (productName: string) => {
    setToastProduct(productName)
    setShowToast(true)
  }

  const hideToast = () => {
    setShowToast(false)
    setToastProduct("")
  }

  const value: CartContextType = {
    items,
    summary,
    loading,
    itemOperationsLoading,
    error,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    refreshCart,
    getTotalItems,
    getTotalPrice,
    isOpen,
    openCart,
    closeCart,
    canUseCart,
    showToast,
    toastProduct,
    showAddToast,
    hideToast
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}