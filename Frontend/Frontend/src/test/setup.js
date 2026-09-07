import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Without Vitest globals, @testing-library/react cannot auto-register its
// cleanup hook, so we register it explicitly to keep each test isolated.
afterEach(() => {
  cleanup()
})
