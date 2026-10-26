import type { Collection } from './schema';

export const titleOf = (r: Collection): string => {
  const x = r as { title?: string; name?: string; id: string };
  return x.title ?? x.name ?? x.id;
};
