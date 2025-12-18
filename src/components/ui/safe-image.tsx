"use client"


import { useState } from "react"
import { Package } from "lucide-react"
import Image from "next/image"


interface SafeImageProps {
  src?: string
  alt: string
  fill?: boolean
  className?: string
  sizes?: string
  width?: number
  height?: number
  priority?: boolean
}

export function SafeImage({ src, alt, fill, className, sizes, width, height, priority }: SafeImageProps) {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return (
      <div className={`flex items-center justify-center text-gray-400 ${className}`}>
        <Package className="w-12 h-12" />
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      priority={priority}
      style={width && height ? { width: "auto", height: "auto" } : undefined}
      onError={() => setHasError(true)}
    />
  )
}
