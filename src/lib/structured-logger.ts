// ============================================
// STRUCTURED LOGGER
// Sistema de logging estructurado para mejor monitoreo
// ============================================

export interface LogContext {
  userId?: string
  sessionId?: string
  requestId?: string
  component?: string
  action?: string
  metadata?: Record<string, any>
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  timestamp: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  performance?: {
    duration: number
    operation: string
  }
  user?: {
    id: string
    email?: string
    role?: string
  }
  request?: {
    method: string
    url: string
    userAgent?: string
    ip?: string
  }
}

class StructuredLogger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      }
    }

    return entry
  }

  private formatLogEntry(entry: LogEntry): string {
    const baseInfo = `[${entry.level.toUpperCase()}] ${entry.timestamp} - ${entry.message}`
    
    if (this.isDevelopment) {
      return `${baseInfo}${entry.context ? ` | Context: ${JSON.stringify(entry.context)}` : ''}`
    }
    
    return JSON.stringify(entry)
  }

  private log(entry: LogEntry) {
    const formattedMessage = this.formatLogEntry(entry)

    switch (entry.level) {
      case 'error':
        console.error(formattedMessage)
        break
      case 'warn':
        console.warn(formattedMessage)
        break
      case 'info':
        console.info(formattedMessage)
        break
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formattedMessage)
        }
        break
    }

    // En producción, aquí podrías enviar a un servicio de logging
    if (this.isProduction) {
      this.sendToExternalService(entry)
    }
  }

  private async sendToExternalService(entry: LogEntry) {
    try {
      // Aquí podrías integrar con servicios como:
      // - Sentry para errores
      // - LogRocket para sesiones
      // - DataDog para métricas
      // - Tu propio servicio de logging
      
      // Ejemplo de envío a un endpoint personalizado
      if (entry.level === 'error') {
        await fetch('/api/logs/error', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry)
        })
      }
    } catch (error) {
      // No loggeamos errores del sistema de logging para evitar loops
      console.error('Failed to send log to external service:', error)
    }
  }

  // Métodos públicos
  debug(message: string, context?: LogContext) {
    this.log(this.createLogEntry('debug', message, context))
  }

  info(message: string, context?: LogContext) {
    this.log(this.createLogEntry('info', message, context))
  }

  warn(message: string, context?: LogContext, error?: Error) {
    this.log(this.createLogEntry('warn', message, context, error))
  }

  error(message: string, context?: LogContext, error?: Error) {
    this.log(this.createLogEntry('error', message, context, error))
  }

  // Métodos específicos para diferentes tipos de eventos
  userAction(action: string, context?: LogContext) {
    this.info(`User action: ${action}`, {
      ...context,
      action,
      component: context?.component || 'unknown'
    })
  }

  apiCall(method: string, url: string, duration: number, context?: LogContext) {
    const entry = this.createLogEntry('info', `API call: ${method} ${url}`, context)
    entry.performance = {
      duration,
      operation: `${method} ${url}`
    }
    this.log(entry)
  }

  authentication(event: string, userId?: string, context?: LogContext) {
    this.info(`Authentication: ${event}`, {
      ...context,
      action: `auth_${event}`,
      userId
    })
  }

  businessLogic(event: string, context?: LogContext) {
    this.info(`Business logic: ${event}`, {
      ...context,
      action: `business_${event}`
    })
  }

  performance(operation: string, duration: number, context?: LogContext) {
    const entry = this.createLogEntry('info', `Performance: ${operation}`, context)
    entry.performance = {
      duration,
      operation
    }
    this.log(entry)
  }

  security(event: string, context?: LogContext) {
    this.warn(`Security event: ${event}`, {
      ...context,
      action: `security_${event}`
    })
  }
}

// Instancia singleton
export const structuredLogger = new StructuredLogger()

// Hook para usar en componentes React
export const useLogger = (componentName: string) => {
  return {
    debug: (message: string, context?: Omit<LogContext, 'component'>) =>
      structuredLogger.debug(message, { ...context, component: componentName }),
    
    info: (message: string, context?: Omit<LogContext, 'component'>) =>
      structuredLogger.info(message, { ...context, component: componentName }),
    
    warn: (message: string, context?: Omit<LogContext, 'component'>, error?: Error) =>
      structuredLogger.warn(message, { ...context, component: componentName }, error),
    
    error: (message: string, context?: Omit<LogContext, 'component'>, error?: Error) =>
      structuredLogger.error(message, { ...context, component: componentName }, error),
    
    userAction: (action: string, context?: Omit<LogContext, 'component'>) =>
      structuredLogger.userAction(action, { ...context, component: componentName })
  }
}

export default structuredLogger
