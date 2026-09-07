import { describe, it, expect } from 'vitest'
import { formatDate } from './format'

describe('formatDate', () => {
  it('returns an em dash for falsy values', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate('')).toBe('—')
    expect(formatDate(undefined)).toBe('—')
  })

  it('returns the original value for an invalid date', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })

  it('formats a valid date string with the year', () => {
    expect(formatDate('2026-09-15')).toContain('2026')
  })
})
