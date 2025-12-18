import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  registerNaturalSchema,
  registerEmpresaSchema,
  createOrderSchema,
  addToCartSchema,
  updateCartItemSchema,
  ORDER_STATUS_CONFIG
} from '@/lib/validations'

describe('Validaciones Críticas', () => {
  describe('Login Schema', () => {
    it('debe validar un login correcto', () => {
      const validLogin = {
        email: 'test@example.com',
        password: 'password123'
      }
      
      const result = loginSchema.safeParse(validLogin)
      expect(result.success).toBe(true)
    })

    it('debe rechazar email inválido', () => {
      const invalidLogin = {
        email: 'invalid-email',
        password: 'password123'
      }
      
      const result = loginSchema.safeParse(invalidLogin)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['email'])
      }
    })

    it('debe rechazar contraseña muy corta', () => {
      const invalidLogin = {
        email: 'test@example.com',
        password: '123'
      }
      
      const result = loginSchema.safeParse(invalidLogin)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['password'])
      }
    })
  })

  describe('Registro Persona Natural', () => {
    it('debe validar un registro correcto', () => {
      const validRegistration = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Juan Pérez',
        rut: '12345678-9',
        shippingAddress: 'Av. Principal 123, Santiago',
        phone: '987654321'
      }
      
      const result = registerNaturalSchema.safeParse(validRegistration)
      expect(result.success).toBe(true)
    })

    it('debe rechazar RUT inválido', () => {
      const invalidRegistration = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Juan Pérez',
        rut: '12345678-X',
        shippingAddress: 'Av. Principal 123, Santiago',
        phone: '987654321'
      }
      
      const result = registerNaturalSchema.safeParse(invalidRegistration)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['rut'])
      }
    })

    it('debe rechazar dirección muy corta', () => {
      const invalidRegistration = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Juan Pérez',
        rut: '12345678-9',
        shippingAddress: 'Corta',
        phone: '987654321'
      }
      
      const result = registerNaturalSchema.safeParse(invalidRegistration)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['shippingAddress'])
      }
    })
  })

  describe('Registro Empresa', () => {
    it('debe validar un registro de empresa correcto', () => {
      const validRegistration = {
        email: 'empresa@example.com',
        password: 'password123',
        name: 'Juan Pérez',
        rut: '76123456-7',
        phone: '987654321',
        company: 'Empresa Test S.A.',
        businessType: 'Comercial',
        billingAddress: 'Av. Empresa 456, Santiago',
        shippingAddress: 'Av. Despacho 789, Santiago'
      }
      
      const result = registerEmpresaSchema.safeParse(validRegistration)
      expect(result.success).toBe(true)
    })

    it('debe rechazar RUT inválido', () => {
      const invalidRegistration = {
        email: 'empresa@example.com',
        password: 'password123',
        name: 'Juan Pérez',
        rut: '12345678-X', // RUT con dígito verificador inválido
        phone: '987654321',
        company: 'Empresa Test S.A.',
        businessType: 'Comercial',
        billingAddress: 'Av. Empresa 456, Santiago',
        shippingAddress: 'Av. Despacho 789, Santiago'
      }
      
      const result = registerEmpresaSchema.safeParse(invalidRegistration)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['rut'])
      }
    })
  })

  describe('Crear Pedido', () => {
    it('debe validar un pedido correcto', () => {
      const validOrder = {
        type: 'COMPRA',
        shippingAddress: 'Av. Principal 123, Santiago',
        shippingMethod: 'DESPACHO_GRATIS',
        shippingCity: 'Santiago',
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            unitPrice: 10000,
            discount: 0
          }
        ]
      }
      
      const result = createOrderSchema.safeParse(validOrder)
      expect(result.success).toBe(true)
    })

    it('debe rechazar pedido sin items', () => {
      const invalidOrder = {
        type: 'COMPRA',
        shippingAddress: 'Av. Principal 123, Santiago',
        shippingMethod: 'DESPACHO_GRATIS',
        items: []
      }
      
      const result = createOrderSchema.safeParse(invalidOrder)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['items'])
      }
    })

    it('debe rechazar tipo de pedido inválido', () => {
      const invalidOrder = {
        type: 'INVALID_TYPE',
        shippingAddress: 'Av. Principal 123, Santiago',
        shippingMethod: 'DESPACHO_GRATIS',
        items: [
          {
            productId: 'product-1',
            quantity: 1,
            unitPrice: 10000,
            discount: 0
          }
        ]
      }
      
      const result = createOrderSchema.safeParse(invalidOrder)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['type'])
      }
    })
  })

  describe('Carrito', () => {
    it('debe validar agregar item al carrito', () => {
      const validAddToCart = {
        productId: 'product-1',
        quantity: 2
      }
      
      const result = addToCartSchema.safeParse(validAddToCart)
      expect(result.success).toBe(true)
    })

    it('debe rechazar cantidad negativa', () => {
      const invalidAddToCart = {
        productId: 'product-1',
        quantity: -1
      }
      
      const result = addToCartSchema.safeParse(invalidAddToCart)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['quantity'])
      }
    })

    it('debe rechazar cantidad muy alta', () => {
      const invalidAddToCart = {
        productId: 'product-1',
        quantity: 1000
      }
      
      const result = addToCartSchema.safeParse(invalidAddToCart)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['quantity'])
      }
    })

    it('debe validar actualizar item del carrito', () => {
      const validUpdate = {
        productId: 'product-1',
        quantity: 5
      }
      
      const result = updateCartItemSchema.safeParse(validUpdate)
      expect(result.success).toBe(true)
    })

    it('debe permitir cantidad 0 para eliminar item', () => {
      const validUpdate = {
        productId: 'product-1',
        quantity: 0
      }
      
      const result = updateCartItemSchema.safeParse(validUpdate)
      expect(result.success).toBe(true)
    })
  })

  describe('Configuración de Estados', () => {
    it('debe tener configuración para todos los estados', () => {
      const expectedStates = [
        'RECIBIDO', 'VALIDANDO', 'APROBADO', 'PREPARANDO',
        'LISTO', 'EN_RUTA', 'ENTREGADO', 'COTIZACION',
        'CANCELADO', 'RECHAZADO', 'EN_ESPERA'
      ]
      
      expectedStates.forEach(state => {
        expect(ORDER_STATUS_CONFIG[state]).toBeDefined()
        expect(ORDER_STATUS_CONFIG[state].status).toBe(state)
        expect(ORDER_STATUS_CONFIG[state].label).toBeDefined()
        expect(ORDER_STATUS_CONFIG[state].description).toBeDefined()
        expect(ORDER_STATUS_CONFIG[state].color).toBeDefined()
        expect(ORDER_STATUS_CONFIG[state].icon).toBeDefined()
      })
    })

    it('debe tener estados terminales configurados correctamente', () => {
      const terminalStates = ['ENTREGADO', 'CANCELADO', 'RECHAZADO']
      
      terminalStates.forEach(state => {
        expect(ORDER_STATUS_CONFIG[state].isTerminal).toBe(true)
        expect(ORDER_STATUS_CONFIG[state].canCancel).toBe(false)
        expect(ORDER_STATUS_CONFIG[state].allowedNextStates).toEqual([])
      })
    })

    it('debe permitir cancelación en estados apropiados', () => {
      const cancellableStates = ['RECIBIDO', 'VALIDANDO', 'APROBADO', 'COTIZACION', 'EN_ESPERA']
      
      cancellableStates.forEach(state => {
        expect(ORDER_STATUS_CONFIG[state].canCancel).toBe(true)
      })
    })
  })
})
