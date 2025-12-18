import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock de Next.js
global.fetch = vi.fn()

// Mock de window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
  writable: true,
})

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock de sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// Mock de console para evitar spam en tests
const originalConsoleError = console.error
const originalConsoleWarn = console.warn
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning:') || args[0].includes('Error:'))
  ) {
    return
  }
  originalConsoleError.call(console, ...args)
}
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning:')
  ) {
    return
  }
  originalConsoleWarn.call(console, ...args)
}
