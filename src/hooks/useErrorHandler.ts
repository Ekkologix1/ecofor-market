"use client"
// ============================================
// USE ERROR HANDLER HOOK
// Hook para manejo de errores en componentes React
// ============================================


import { useCallback } from 'react'
import { useErrorHandler as useErrorHandlerBase } from '@/components/ErrorBoundary'
import { useLogger } from '@/lib/structured-logger'

interface UseErrorHandlerOptions {
  componentName?: string
  onError?: (error: Error) => void
  logErrors?: boolean
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  const { componentName = 'Unknown', onError, logErrors = true } = options
  const { throwError, handleAsyncError } = useErrorHandlerBase()
  const logger = useLogger(componentName)

  const handleError = useCallback((error: Error, context?: Record<string, any>) => {
    if (logErrors) {
      logger.error('Component error handled', {
        action: 'handleError',
        metadata: context
      }, error)
    }

    if (onError) {
      onError(error)
    }

    // Re-lanzar el error para que sea capturado por Error Boundary
    throwError(error)
  }, [throwError, onError, logErrors, logger])

  const handleAsyncErrorWrapper = useCallback((error: Error, context?: Record<string, any>) => {
    if (logErrors) {
      logger.error('Async error handled', {
        action: 'handleAsyncError',
        metadata: context
      }, error)
    }

    if (onError) {
      onError(error)
    }

    handleAsyncError(error)
  }, [handleAsyncError, onError, logErrors, logger])

  const handlePromise = useCallback(async <T>(
    promise: Promise<T>,
    context?: Record<string, any>
  ): Promise<T | null> => {
    try {
      return await promise
    } catch (error) {
      if (error instanceof Error) {
        handleAsyncErrorWrapper(error, context)
      } else {
        const unknownError = new Error('Unknown error occurred')
        handleAsyncErrorWrapper(unknownError, { ...context, originalError: error })
      }
      return null
    }
  }, [handleAsyncErrorWrapper])

  const withErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => R,
    context?: Record<string, any>
  ) => {
    return (...args: T): R | null => {
      try {
        return fn(...args)
      } catch (error) {
        if (error instanceof Error) {
          handleError(error, context)
        } else {
          const unknownError = new Error('Unknown error occurred')
          handleError(unknownError, { ...context, originalError: error })
        }
        return null
      }
    }
  }, [handleError])

  const withAsyncErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: Record<string, any>
  ) => {
    return async (...args: T): Promise<R | null> => {
      try {
        return await fn(...args)
      } catch (error) {
        if (error instanceof Error) {
          handleAsyncErrorWrapper(error, context)
        } else {
          const unknownError = new Error('Unknown error occurred')
          handleAsyncErrorWrapper(unknownError, { ...context, originalError: error })
        }
        return null
      }
    }
  }, [handleAsyncErrorWrapper])

  return {
    handleError,
    handleAsyncError: handleAsyncErrorWrapper,
    handlePromise,
    withErrorHandling,
    withAsyncErrorHandling,
    logger
  }
}

export default useErrorHandler
