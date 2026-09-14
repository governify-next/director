import { describe, expect, it } from 'vitest';
import { getAnchoredRunLimit, getNextAnchoredRunDate } from '../src/utils/recurrence.js';

describe('getNextAnchoredRunDate', () => {
    it('aligns the next run to the anchor date instead of the scheduling time', () => {
        const nextRunDate = getNextAnchoredRunDate({
            anchorDate: new Date('2026-04-02T00:00:00.000Z'),
            startDate: new Date('2026-04-02T00:00:00.000Z'),
            interval: 60_000,
            now: new Date('2026-04-02T21:45:30.300Z'),
        });

        expect(nextRunDate.toISOString()).toBe('2026-04-02T21:46:00.000Z');
    });

    it('uses startDate as a lower bound when it falls between anchored windows', () => {
        const nextRunDate = getNextAnchoredRunDate({
            anchorDate: new Date('2026-04-02T10:00:15.000Z'),
            startDate: new Date('2026-04-02T10:01:00.000Z'),
            interval: 60_000,
            now: new Date('2026-04-02T10:00:00.000Z'),
        });

        expect(nextRunDate.toISOString()).toBe('2026-04-02T10:01:15.000Z');
    });

    it('keeps exact anchored window boundaries', () => {
        const nextRunDate = getNextAnchoredRunDate({
            anchorDate: new Date('2026-04-02T00:00:00.000Z'),
            startDate: new Date('2026-04-02T00:00:00.000Z'),
            interval: 60_000,
            now: new Date('2026-04-02T21:46:00.000Z'),
        });

        expect(nextRunDate.toISOString()).toBe('2026-04-02T21:46:00.000Z');
    });

    it('falls back to startDate as the anchor when anchorDate is omitted', () => {
        const nextRunDate = getNextAnchoredRunDate({
            startDate: new Date('2026-04-02T10:00:30.000Z'),
            interval: 60_000,
            now: new Date('2026-04-02T10:05:00.000Z'),
        });

        expect(nextRunDate.toISOString()).toBe('2026-04-02T10:05:30.000Z');
    });

    it('calculates a run limit that excludes the first run after endDate', () => {
        const firstRunDate = getNextAnchoredRunDate({
            anchorDate: new Date('2026-05-22T10:00:30.000Z'),
            startDate: new Date('2026-04-02T10:00:00.000Z'),
            interval: 60_000,
            now: new Date('2026-05-24T21:49:00.000Z'),
        });

        const limit = getAnchoredRunLimit({
            firstRunDate,
            endDate: new Date('2026-05-24T21:50:00.000Z'),
            interval: 60_000,
        });

        expect(firstRunDate.toISOString()).toBe('2026-05-24T21:49:30.000Z');
        expect(limit).toBe(1);
    });

    it('returns zero when no anchored run is available before endDate', () => {
        const limit = getAnchoredRunLimit({
            firstRunDate: new Date('2026-05-24T21:50:30.000Z'),
            endDate: new Date('2026-05-24T21:50:00.000Z'),
            interval: 60_000,
        });

        expect(limit).toBe(0);
    });
});
