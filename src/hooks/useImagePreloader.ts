"use client"
import { useEffect, useState } from 'react'

interface UseImagePreloaderProps {
  images: string[]
}

export function useImagePreloader({ images }: UseImagePreloaderProps) {
  const [loadedImages, setLoadedImages] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadImages = async () => {
      const promises = images.map((src) => {
        return new Promise<string>((resolve, reject) => {
          const img = new Image()
          img.onload = () => resolve(src)
          img.onerror = () => reject(src)
          img.src = src
        })
      })

      try {
        await Promise.all(promises)
        setLoadedImages(images)
        setIsLoading(false)
      } catch (error) {
        console.warn('Some images failed to load:', error)
        setIsLoading(false)
      }
    }

    loadImages()
  }, [images])

  return { loadedImages, isLoading }
}
