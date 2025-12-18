"use client"

import React, { createContext, useContext, useState } from 'react'

interface CatalogContextType {
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined)

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)

  const value = {
    isLoading,
    setIsLoading
  }

  return (
    <CatalogContext.Provider value={value}>
      {children}
    </CatalogContext.Provider>
  )
}

export function useCatalog() {
  const context = useContext(CatalogContext)
  if (context === undefined) {
    throw new Error('useCatalog must be used within a CatalogProvider')
  }
  return context
}
