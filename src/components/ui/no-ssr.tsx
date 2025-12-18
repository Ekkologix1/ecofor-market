"use client"
import { useClient } from "@/hooks/useClient"



interface NoSSRProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function NoSSR({ children, fallback = null }: NoSSRProps) {
  const isClient = useClient()

  if (!isClient) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
