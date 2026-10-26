import type { Store } from './schema';

export const titleOf = (r: Store): string => {
  const x = r as { title?: string; name?: string; id: string };
  return x.title ?? x.name ?? x.id;
};
