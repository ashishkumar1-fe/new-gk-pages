import type { Transfer } from './schema';

export const titleOf = (r: Transfer): string => {
  const x = r as { title?: string; name?: string; id: string };
  return x.title ?? x.name ?? x.id;
};
