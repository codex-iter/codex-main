import { describe, expect, it } from 'vitest';
import { monthRange, toISTDate } from '../src/utils/time.js';
describe('time utilities', () => {
    it('formats UTC timestamps to IST dates', () => {
        expect(toISTDate('2024-03-10T18:30:00.000Z')).toBe('2024-03-11');
    });
    it('calculates the month range for a given month', () => {
        const { start, end } = monthRange('2024-09');
        expect(start).toBe('2024-09-01');
        expect(end).toBe('2024-09-30');
    });
});
