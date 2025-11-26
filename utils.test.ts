import { describe, it, expect, vi } from 'vitest';
import { formatSmartDuration, getBusinessMinutes } from './utils';

// Cast getBusinessMinutes to its mocked type
const mockedGetBusinessMinutes = getBusinessMinutes as vi.Mock<[Date | string, Date | string], number>;

describe('formatSmartDuration', () => {
    it('should format durations less than 60 minutes correctly', () => {
        mockedGetBusinessMinutes.mockReturnValue(45);
        const result = formatSmartDuration(new Date());
        expect(result).toBe('45m');
        expect(mockedGetBusinessMinutes).toHaveBeenCalled();
    });

    it('should format durations in hours and minutes correctly', () => {
        mockedGetBusinessMinutes.mockReturnValue(150); // 2h 30m
        const result = formatSmartDuration(new Date());
        expect(result).toBe('2h 30m');
    });

    it('should format 24 business hours as "1d 0h"', () => {
        mockedGetBusinessMinutes.mockReturnValue(24 * 60);
        const result = formatSmartDuration(new Date());
        expect(result).toBe('1d 0h');
    });

    it('should format 30 business hours as "1d 6h"', () => {
        mockedGetBusinessMinutes.mockReturnValue(30 * 60);
        const result = formatSmartDuration(new Date());
        expect(result).toBe('1d 6h');
    });
});
