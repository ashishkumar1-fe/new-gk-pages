import type { PriceSchedule } from './schema';

export const titleOf = (r: PriceSchedule): string => {
  const x = r as { title?: string; name?: string; id: string };
  return x.title ?? x.name ?? x.id;
};
