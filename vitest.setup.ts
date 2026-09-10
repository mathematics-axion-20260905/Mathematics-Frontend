import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
  }),
}))

// Node versions that disable jsdom's origin-backed storage should still use
// the same browser storage contract as the live writer bridge.
if (typeof window !== 'undefined' && !window.localStorage) {
  const values = new Map<string, string>()
  const storage: Storage = {
    get length() {
      return values.size
    },
    clear() {
      values.clear()
    },
    getItem(key) {
      return values.get(key) ?? null
    },
    key(index) {
      return Array.from(values.keys())[index] ?? null
    },
    removeItem(key) {
      values.delete(key)
    },
    setItem(key, value) {
      values.set(key, String(value))
    },
  }
  Object.defineProperty(window, 'localStorage', { configurable: true, value: storage })
}
