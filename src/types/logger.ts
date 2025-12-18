// src/types/logger.ts
// Tipos para funciones de logging

/**
 * Tipo para metadata de logs
 */
export type LogMetadata = Record<string, unknown>

/**
 * Tipo para argumentos de funciones de log
 */
export type LogArgs = [string, LogMetadata?]

/**
 * Interface para funciones de logging
 */
export interface LoggerFunction {
  (message: string, meta?: LogMetadata): void
}

/**
 * Interface para logger con múltiples niveles
 */
export interface Logger {
  debug: LoggerFunction
  info: LoggerFunction
  warn: LoggerFunction
  error: LoggerFunction
  http?: LoggerFunction
}
