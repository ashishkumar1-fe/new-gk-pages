import type { Inventory } from './schema';

export const titleOf = (r: Inventory): string => {
  const x = r as { title?: string; name?: string; id: string };
  return x.title ?? x.name ?? x.id;
};
