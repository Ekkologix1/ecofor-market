"use client"


import { useState, useEffect } from 'react'
import Image from 'next/image'

interface ImageDebuggerProps {
  productName: string
  mainImage?: string
}

export function ImageDebugger({ productName, mainImage }: ImageDebuggerProps) {
  const [imageStatus, setImageStatus] = useState<Record<string, boolean>>({})
  const [testUrls, setTestUrls] = useState<string[]>([])

  useEffect(() => {
    if (!productName) return

    // Función para normalizar nombres de archivo
    const normalizeFileName = (name: string) => {
      return name
        .toLowerCase()
        .replace(/\s+/g, '-') // Espacios por guiones
        .replace(/[áàäâ]/g, 'a')
        .replace(/[éèëê]/g, 'e')
        .replace(/[íìïî]/g, 'i')
        .replace(/[óòöô]/g, 'o')
        .replace(/[úùüû]/g, 'u')
        .replace(/ñ/g, 'n')
        .replace(/[^a-z0-9-]/g, '') // Solo letras, números y guiones
        .replace(/-+/g, '-') // Múltiples guiones por uno solo
        .replace(/^-|-$/g, '') // Eliminar guiones al inicio y final
    }

    // Generar posibles URLs de imagen basadas en el nombre del producto
    const possibleUrls = [
      // URL original si existe
      mainImage || '',
      // Construir basado en el nombre del producto normalizado
      `/images/products/${normalizeFileName(productName)}-1.jpg`,
      `/images/products/${normalizeFileName(productName)}-1.png`,
      `/images/products/${normalizeFileName(productName)}-1.jpeg`,
      // Intentar con nombres simplificados (primeras palabras)
      `/images/products/${normalizeFileName(productName.split(' ').slice(0, 2).join(' '))}-1.jpg`,
      `/images/products/${normalizeFileName(productName.split(' ').slice(0, 2).join(' '))}-1.png`,
    ].filter(url => url && url !== '')

    setTestUrls(possibleUrls)
  }, [productName, mainImage])

  const testImage = (url: string) => {
    const img = new window.Image()
    img.onload = () => {
      setImageStatus(prev => ({ ...prev, [url]: true }))
    }
    img.onerror = () => {
      setImageStatus(prev => ({ ...prev, [url]: false }))
    }
    img.src = url
  }

  useEffect(() => {
    testUrls.forEach(url => {
      testImage(url)
    })
  }, [testUrls])

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
      <h3 className="font-bold text-sm mb-2">🔍 Debug de Imágenes</h3>
      <p className="text-xs text-gray-600 mb-2">Producto: {productName}</p>
      <p className="text-xs text-gray-600 mb-3">mainImage original: {mainImage || 'undefined'}</p>
      
      <div className="space-y-2">
        {testUrls.map((url, index) => (
          <div key={`${productName}-${index}`} className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${imageStatus[url] === true ? 'bg-green-500' : imageStatus[url] === false ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
            <span className="text-xs font-mono">{url}</span>
            {imageStatus[url] === true && (
              <span className="text-xs text-green-600">✅</span>
            )}
            {imageStatus[url] === false && (
              <span className="text-xs text-red-600">❌</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
