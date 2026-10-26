import { describe, it, expect } from 'vitest';
import * as rules from './rules';
import type { ScheduleTimingInput } from './rules';

const now = '2026-10-22T10:00:00Z';
const ok: ScheduleTimingInput = {
  name: 'Diwali',
  action: 'decrease_percent',
  amount: 10,
  pattern: 'once',
  startAt: '2026-10-23T00:00:00Z',
  now,
};
const t = (p: Partial<ScheduleTimingInput>) => rules.scheduleTiming({ ...ok, ...p });

describe('scheduleCancellable', () => {
  it('only pending, any case', () => {
    expect(rules.scheduleCancellable({ status: 'PENDING' })).toBe(true);
    expect(rules.scheduleCancellable({ status: 'completed' })).toBe(false);
  });
});

describe('scheduleTiming', () => {
  it('a valid one-off passes', () => {
    expect(t({})).toBeNull();
  });
  it('name, action and amount are required', () => {
    expect(t({ name: '  ' })).toBe('Please enter a title before scheduling.');
    expect(t({ action: null })).toBe('Please select price action and amount');
    expect(t({ amount: undefined })).toBe('Please select price action and amount');
    expect(t({ amount: 0 })).toBeNull();
  });
  it('start is required and not in the past', () => {
    expect(t({ startAt: null })).toBe('Please select a start date');
    expect(t({ startAt: '2026-10-22T09:59:59Z' })).toBe('Start time cannot be before the current time');
  });
  it('recurring needs an end, not in the past', () => {
    expect(t({ pattern: 'weekly' })).toBe('Please select an end date for the recurring schedule');
    expect(t({ pattern: 'weekly', endAt: '2026-10-21T00:00:00Z' })).toBe('End time cannot be before the current time');
    expect(t({ pattern: 'daily', endAt: '2026-11-01T00:00:00Z' })).toBeNull();
  });
  it('a one-off with "set end date" needs one', () => {
    expect(t({ hasEndAt: true })).toBe('Please select an end date');
    expect(t({ hasEndAt: false, endAt: '2020-01-01T00:00:00Z' })).toBeNull();
  });
});
