import type { ExportChoices } from './types';

/** A date range must run forwards when both ends are set. */
export const choicesError = (c: ExportChoices): string | undefined =>
  c.dateRange?.from && c.dateRange?.to && c.dateRange.from > c.dateRange.to ? 'The start date must be before the end date.' : undefined;
