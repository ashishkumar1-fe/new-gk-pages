import type { DiscountSet } from './schema';

export const titleOf = (r: DiscountSet): string => {
  const x = r as { title?: string; name?: string; id: string };
  return x.title ?? x.name ?? x.id;
};
