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
})
