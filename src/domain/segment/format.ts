import type { Segment } from './schema';

export const titleOf = (r: Segment): string => {
  const x = r as { title?: string; name?: string; id: string };
  return x.title ?? x.name ?? x.id;
};
