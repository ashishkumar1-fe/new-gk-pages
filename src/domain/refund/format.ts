import type { Refund } from './schema';

export const titleOf = (r: Refund): string => {
  const x = r as { title?: string; name?: string; id: string };
  return x.title ?? x.name ?? x.id;
};
