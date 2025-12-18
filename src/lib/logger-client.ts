"use client"
// ============================================
// CLIENT LOGGER
// Logger simple para el lado del cliente
// ============================================


import { LogArgs } from '@/types'

export const clientLogger = {
  info: (...args: LogArgs) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[CLIENT INFO]', ...args);
    }
  },
  warn: (...args: LogArgs) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[CLIENT WARN]', ...args);
    }
  },
  error: (...args: LogArgs) => {
    console.error('[CLIENT ERROR]', ...args);
  },
  debug: (...args: LogArgs) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[CLIENT DEBUG]', ...args);
    }
  },
  // Métodos específicos de authLogger para compatibilidad
  loginAttempt: (email: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CLIENT AUTH] Intento de login para: ${email}`);
    }
  },
  loginFailed: (email: string, reason: string) => {
    console.warn(`[CLIENT AUTH] Login fallido para: ${email}. Razón: ${reason}`);
  },
  userNotFound: (email: string) => {
    console.warn(`[CLIENT AUTH] Usuario no encontrado: ${email}`);
  },
  userNotValidated: (email: string) => {
    console.warn(`[CLIENT AUTH] Usuario no validado: ${email}`);
  },
  loginSuccess: (userId: string, email: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CLIENT AUTH] Login exitoso para: ${email} (ID: ${userId})`);
    }
  },
  logout: (userId: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CLIENT AUTH] Logout de usuario: ${userId}`);
    }
  },
  redirect: (from: string, to: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CLIENT AUTH] Redirect de ${from} a ${to}`);
    }
  }
};

export default clientLogger;