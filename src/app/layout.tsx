import { Providers } from "./providers"
import { ErrorBoundary } from "@/components"
import { ScrollOptimization } from "../components/ui/scroll-optimization"
import { HydrationCleanup } from "@/components/hydration-cleanup"
import type { Metadata } from "next"

import "./globals.css"
import "@/lib/suppress-hydration-warnings"

export const metadata: Metadata = {
  title: "ECOFOR Market",
  description: "Insumos de aseo para empresas e instituciones",
}

// Preload de imágenes críticas
export const preloadImages = () => {
  return (
    <>
      <link rel="preload" as="image" href="/images/ecofor.png" />
      <link rel="preload" as="image" href="/images/logo-ecofor.png" />
    </>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning={true}>
      <head>
        <link rel="preload" as="image" href="/images/ecofor.png" />
        <link rel="preload" as="image" href="/images/logo-ecofor.png" />
      </head>
      <body suppressHydrationWarning={true}>
        <HydrationCleanup />
        <ScrollOptimization />
        <ErrorBoundary>
          <Providers>
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}