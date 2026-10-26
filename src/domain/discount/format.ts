import type { Discount } from './schema';

export const titleOf = (r: Discount): string => {
  const x = r as { title?: string; name?: string; id: string };
  return x.title ?? x.name ?? x.id;
};
