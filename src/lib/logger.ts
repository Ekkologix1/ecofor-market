import * as winston from 'winston'
import { LogMetadata } from '@/types'

// Niveles de logging personalizados
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

// Colores para los niveles
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

winston.addColors(logColors)

// Formato personalizado para desarrollo
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
)

// Formato para producción (sin colores)
const prodFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

// Configuración de transports
const transports: winston.transport[] = [
  // Console transport - único transport en producción (Vercel no permite escribir archivos)
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  }),
]

// En desarrollo local, escribir a archivos
if (process.env.NODE_ENV === 'development') {
  // Log de errores
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: prodFormat,
    })
  )

  // Log general
  transports.push(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: prodFormat,
    })
  )
}

// Crear el logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels: logLevels,
  transports,
  // No salir en caso de error
  exitOnError: false,
})

// Función helper para logging de autenticación
export const authLogger = {
  loginAttempt: (email: string) => {
    logger.info(`Intento de login para: ${email}`)
  },
  loginSuccess: (userId: string, email: string) => {
    logger.info(`Login exitoso - Usuario: ${email} (ID: ${userId})`)
  },
  loginFailed: (email: string, reason: string) => {
    logger.warn(`Login fallido para: ${email} - Razón: ${reason}`)
  },
  userNotFound: (email: string) => {
    logger.warn(`Usuario no encontrado: ${email}`)
  },
  userNotValidated: (email: string) => {
    logger.warn(`Usuario no validado intentó login: ${email}`)
  },
  redirect: (from: string, to: string) => {
    logger.debug(`Redirect: ${from} -> ${to}`)
  },
}

// Función helper para logging de hooks
export const hookLogger = {
  authStatus: (status: string, hasSession: boolean, email?: string) => {
    logger.debug(`useAuth - Status: ${status}, HasSession: ${hasSession}, Email: ${email || 'N/A'}`)
  },
}

// Función helper para logging de API
export const apiLogger = {
  request: (method: string, url: string, userId?: string) => {
    logger.http(`API Request: ${method} ${url}${userId ? ` - User: ${userId}` : ''}`)
  },
  response: (method: string, url: string, status: number, duration: number) => {
    logger.http(`API Response: ${method} ${url} - ${status} (${duration}ms)`)
  },
  error: (method: string, url: string, error: string) => {
    logger.error(`API Error: ${method} ${url} - ${error}`)
  },
}

// Exportar el logger principal
export default logger

// Función para crear un logger con contexto específico
export const createContextLogger = (context: string) => {
  return {
    error: (message: string, meta?: LogMetadata) => logger.error(`[${context}] ${message}`, meta),
    warn: (message: string, meta?: LogMetadata) => logger.warn(`[${context}] ${message}`, meta),
    info: (message: string, meta?: LogMetadata) => logger.info(`[${context}] ${message}`, meta),
    http: (message: string, meta?: LogMetadata) => logger.http(`[${context}] ${message}`, meta),
    debug: (message: string, meta?: LogMetadata) => logger.debug(`[${context}] ${message}`, meta),
  }
}
