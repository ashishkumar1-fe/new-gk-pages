import type { PriceSchedule } from './schema';

// Pure rules, ported as today. Each cites the gk-pages source it came from (docs/architecture/domain/pricing-tax.md#price-schedules).
// gk-pages paths are relative to gk-pages/src/. Messages are verbatim.
// Unused-type guard for entities whose rules take narrower inputs:
export type { PriceSchedule as _PriceSchedule };

/** pages/products/PriceScheduleList.tsx:385 */
export const scheduleCancellable = (s: Pick<PriceSchedule, 'status'>) => s.status.toLowerCase() === 'pending';

export interface ScheduleTimingInput {
  name?: string | null;
  action?: PriceSchedule['action']['kind'] | null;
  /** The amount as typed: undefined/null/NaN = not entered. 0 is accepted (gk-pages checks the string, and '0' is truthy). */
  amount?: number | null;
  pattern: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  /** "Set end date" toggle for a one-off schedule. */
  hasEndAt?: boolean;
  /** Start and end with the time of day already applied, ISO 8601. */
  startAt?: string | null;
  endAt?: string | null;
  /** The current time, ISO 8601 (passed in to keep the rule pure). */
  now: string;
}

/**
 * The first blocking problem when scheduling a price change, or null. Checked in this order, as today:
 * name (trimmed) — pages/products/PriceSchedule.tsx:266; action and amount — :271; start — :276;
 * recurring needs an end — :284, a one-off with "set end date" needs one — :287;
 * start not in the past — :342; end not in the past — :348.
 */
export const scheduleTiming = (s: ScheduleTimingInput): string | null => {
  if (!(s.name ?? '').trim()) return 'Please enter a title before scheduling.';
  if (!s.action || s.amount == null || Number.isNaN(s.amount)) return 'Please select price action and amount';
  if (!s.startAt) return 'Please select a start date';
  const recurring = s.pattern !== 'once';
  if (recurring && !s.endAt) return 'Please select an end date for the recurring schedule';
  if (s.hasEndAt && !s.endAt) return 'Please select an end date';
  const now = Date.parse(s.now);
  if (Date.parse(s.startAt) < now) return 'Start time cannot be before the current time';
  const needsEnd = s.hasEndAt || recurring;
  if (needsEnd && s.endAt && Date.parse(s.endAt) < now) return 'End time cannot be before the current time';
  return null;
};
