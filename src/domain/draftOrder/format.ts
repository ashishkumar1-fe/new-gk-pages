import type { DraftOrder } from './schema';

export const titleOf = (r: DraftOrder): string => {
  const x = r as { title?: string; name?: string; id: string };
  return x.title ?? x.name ?? x.id;
};
