import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatNumber,
  truncate,
  capitalize,
  toTitleCase,
  debounce,
  isEmpty,
  getInitials,
  formatFileSize,
  cn,
  sleep,
} from '@/lib/utils'

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    it('formats positive numbers correctly', () => {
      expect(formatCurrency(1000)).toMatch(/1,000/)
      expect(formatCurrency(1234.56)).toMatch(/1,234\.56/)
    })

    it('formats zero correctly', () => {
      expect(formatCurrency(0)).toMatch(/0/)
    })

    it('handles undefined/null by defaulting to 0', () => {
      expect(formatCurrency(null as unknown as number)).toMatch(/0/)
      expect(formatCurrency(undefined as unknown as number)).toMatch(/0/)
    })
  })

  describe('formatDate', () => {
    it('formats valid date strings', () => {
      const date = '2024-01-15'
      const formatted = formatDate(date)
      expect(formatted).toBeTruthy()
      expect(typeof formatted).toBe('string')
    })

    it('handles invalid dates gracefully', () => {
      const invalidDate = 'invalid-date'
      expect(formatDate(invalidDate)).toBe('')
    })

    it('handles Date objects', () => {
      const date = new Date('2024-01-15')
      const formatted = formatDate(date)
      expect(formatted).toBeTruthy()
    })
  })

  describe('formatDateTime', () => {
    it('formats dates with time', () => {
      const date = new Date('2024-01-15T14:30:00')
      const formatted = formatDateTime(date)
      expect(formatted).toBeTruthy()
      expect(typeof formatted).toBe('string')
    })
  })

  describe('formatRelativeTime', () => {
    it('returns "just now" for very recent dates', () => {
      const date = new Date()
      expect(formatRelativeTime(date)).toBe('just now')
    })

    it('returns minutes ago for recent dates', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      expect(formatRelativeTime(date)).toMatch(/minute/)
    })

    it('returns hours ago for dates within 24 hours', () => {
      const date = new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
      expect(formatRelativeTime(date)).toMatch(/hour/)
    })

    it('returns days ago for dates within 30 days', () => {
      const date = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      expect(formatRelativeTime(date)).toMatch(/day/)
    })

    it('returns months ago for dates within 12 months', () => {
      const date = new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000) // ~3 months ago
      expect(formatRelativeTime(date)).toMatch(/month/)
    })

    it('returns years ago for dates over 12 months', () => {
      const date = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000) // ~2 years ago
      expect(formatRelativeTime(date)).toMatch(/year/)
    })

    it('handles invalid dates gracefully', () => {
      expect(formatRelativeTime('invalid-date')).toBe('')
    })

    it('handles Date objects', () => {
      const date = new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      expect(formatRelativeTime(date)).toMatch(/hour/)
    })
  })

  describe('formatNumber', () => {
    it('formats numbers with decimals', () => {
      expect(formatNumber(1234.567, 2)).toMatch(/1,234\.57/)
    })

    it('formats whole numbers', () => {
      expect(formatNumber(1000)).toMatch(/1,000/)
    })
  })

  describe('truncate', () => {
    it('truncates long strings', () => {
      const longString = 'This is a very long string'
      expect(truncate(longString, 10)).toBe('This is a ...')
    })

    it('does not truncate short strings', () => {
      const shortString = 'Short'
      expect(truncate(shortString, 10)).toBe('Short')
    })

    it('uses custom suffix', () => {
      expect(truncate('Long string', 4, '…')).toBe('Long…')
    })
  })

  describe('capitalize', () => {
    it('capitalizes first letter', () => {
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('HELLO')).toBe('Hello')
    })
  })

  describe('toTitleCase', () => {
    it('converts to title case', () => {
      expect(toTitleCase('hello world')).toBe('Hello World')
    })
  })

  describe('debounce', () => {
    jest.useFakeTimers()

    it('delays function execution', () => {
      const func = jest.fn()
      const debounced = debounce(func, 100)

      debounced()
      expect(func).not.toHaveBeenCalled()

      jest.advanceTimersByTime(100)
      expect(func).toHaveBeenCalledTimes(1)
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })
  })

  describe('isEmpty', () => {
    it('returns true for null/undefined', () => {
      expect(isEmpty(null)).toBe(true)
      expect(isEmpty(undefined)).toBe(true)
    })

    it('returns true for empty string', () => {
      expect(isEmpty('')).toBe(true)
      expect(isEmpty('   ')).toBe(true)
    })

    it('returns true for empty array', () => {
      expect(isEmpty([])).toBe(true)
    })

    it('returns true for empty object', () => {
      expect(isEmpty({})).toBe(true)
    })

    it('returns false for non-empty values', () => {
      expect(isEmpty('text')).toBe(false)
      expect(isEmpty([1])).toBe(false)
      expect(isEmpty({ key: 'value' })).toBe(false)
    })
  })

  describe('getInitials', () => {
    it('returns initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD')
    })

    it('returns first two letters for single name', () => {
      expect(getInitials('John')).toBe('JO')
    })

    it('handles empty string', () => {
      expect(getInitials('')).toBe('?')
    })
  })

  describe('formatFileSize', () => {
    it('formats bytes', () => {
      expect(formatFileSize(1024)).toMatch(/KB/)
      expect(formatFileSize(1048576)).toMatch(/MB/)
    })

    it('handles zero bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
    })
  })

  describe('sleep', () => {
    it('returns a promise', () => {
      const result = sleep(10)
      expect(result).toBeInstanceOf(Promise)
    })

    it('resolves after the specified time', async () => {
      const start = Date.now()
      await sleep(50)
      const duration = Date.now() - start
      expect(duration).toBeGreaterThanOrEqual(45) // Allow some variance
      expect(duration).toBeLessThan(150) // Increased tolerance for CI/parallel test environments
    })
  })

  describe('cn (className utility)', () => {
    it('merges class names correctly', () => {
      const result = cn('class1', 'class2')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
    })

    it('handles conditional classes', () => {
      const result = cn('base', true && 'conditional', false && 'hidden')
      expect(result).toContain('base')
      expect(result).toContain('conditional')
      expect(result).not.toContain('hidden')
    })

    it('handles undefined and null', () => {
      const result = cn('base', undefined, null)
      expect(result).toBe('base')
    })
  })
})
