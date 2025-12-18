// src/types/prisma.ts
// Tipos para manejar campos Decimal de Prisma

import { Decimal } from '@prisma/client/runtime/library'

/**
 * Tipo para campos Decimal de Prisma
 * Representa un valor decimal que puede ser serializado como number o Decimal
 */
export type PrismaDecimal = Decimal | number

/**
 * Convierte un PrismaDecimal a number
 * @param value - Valor decimal de Prisma
 * @returns Número convertido
 */
export function toNumber(value: PrismaDecimal): number {
  if (typeof value === 'number') {
    return value
  }
  return Number(value)
}

/**
 * Convierte un array de objetos con campos Decimal a number
 * @param items - Array de objetos con campos decimales
 * @param decimalFields - Campos que son Decimal y deben convertirse
 * @returns Array con campos decimales convertidos a number
 */
export function convertDecimalFields<T extends Record<string, any>>(
  items: T[],
  decimalFields: (keyof T)[]
): T[] {
  return items.map(item => {
    const converted = { ...item }
    decimalFields.forEach(field => {
      if (converted[field] !== null && converted[field] !== undefined) {
        converted[field] = toNumber(converted[field]) as any
      }
    })
    return converted
  })
}

/**
 * Convierte un objeto con campos Decimal a number
 * @param item - Objeto con campos decimales
 * @param decimalFields - Campos que son Decimal y deben convertirse
 * @returns Objeto con campos decimales convertidos a number
 */
export function convertDecimalFieldsSingle<T extends Record<string, any>>(
  item: T,
  decimalFields: (keyof T)[]
): T {
  const converted = { ...item }
  decimalFields.forEach(field => {
    if (converted[field] !== null && converted[field] !== undefined) {
      converted[field] = toNumber(converted[field]) as any
    }
  })
  return converted 
}
