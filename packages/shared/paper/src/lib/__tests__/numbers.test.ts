import { describe, expect, test } from 'bun:test'
import { formatNumber } from '../numbers'

describe('formatNumber (D104)', () => {
  test('plain groups, percent reads a ratio, a currency code reads money', () => {
    expect(formatNumber(3550000, 'en-US')).toBe('3,550,000')
    expect(formatNumber(0.255, 'en-US', 'percent')).toBe('25.5%')
    expect(formatNumber(1500, 'en-US', 'USD')).toBe('$1,500.00')
    expect(formatNumber(1500, 'de-DE', 'EUR')).toBe('1.500,00\u00a0€')
    expect(formatNumber(1500, 'en-US', 'JPY')).toBe('¥1,500')
  })

  test('a huge or a tiny number reads in scientific notation, never hundreds of digits', () => {
    expect(formatNumber(1e308, 'en-US')).toBe('1E308')
    expect(formatNumber(-1.2345e17, 'en-US')).toBe('-1.23E17')
    expect(formatNumber(1e308, 'en-US', 'USD')).toBe('$1E308')
    expect(formatNumber(3e-9, 'en-US')).toBe('3E-9')
    expect(formatNumber(999_999_999_999_999, 'en-US')).toBe('999,999,999,999,999')
    expect(formatNumber(0, 'en-US')).toBe('0')
    expect(formatNumber(Number.POSITIVE_INFINITY, 'en-US')).toBe('∞')
  })
})
