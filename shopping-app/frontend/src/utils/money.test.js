// it create a test, expect check if the result is correct 

import { it, expect, describe } from 'vitest'
import { formatMoney } from './money'

describe('formatMoney', () => {
    it('formats a decimal RM amount', () => {
        expect(formatMoney(19.99)).toBe('RM19.99')
    });

    it('display two decimals', () => {
        expect(formatMoney(10.9)).toBe('RM10.90')
        expect(formatMoney(10)).toBe('RM10.00')
    })
})
