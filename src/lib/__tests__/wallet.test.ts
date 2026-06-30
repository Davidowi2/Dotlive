import { describe, it, expect } from 'vitest';
import { formatDot, dotToNaira, nairaToDot } from '../constants';

describe('Wallet utilities', () => {
  describe('formatDot', () => {
    it('formats whole numbers correctly', () => {
      expect(formatDot(1000)).toBe('1,000');
      expect(formatDot(50000)).toBe('50,000');
    });

    it('handles zero', () => {
      expect(formatDot(0)).toBe('0');
    });

    it('handles decimals', () => {
      expect(formatDot(1234.56)).toBe('1,234.56');
    });
  });

  describe('Currency conversion', () => {
    it('converts DOT to Naira at correct rate', () => {
      // Rate is 15 NGN per DOT
      expect(dotToNaira(100)).toBe(1500);
      expect(dotToNaira(2000)).toBe(30000);
    });

    it('converts Naira to DOT at correct rate', () => {
      expect(nairaToDot(1500)).toBe(100);
      expect(nairaToDot(30000)).toBe(2000);
    });

    it('handles rounding correctly', () => {
      expect(nairaToDot(17)).toBeCloseTo(1.13, 2);
    });
  });
});
