"use client"
import { useScrollOptimization, useFastScrollDetection } from "@/hooks/useScrollOptimization"


export function ScrollOptimization() {
  useScrollOptimization()
  useFastScrollDetection()
  
  return null // Este componente no renderiza nada, solo ejecuta hooks
}
