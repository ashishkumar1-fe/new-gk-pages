import type { Location } from './schema';

export const titleOf = (r: Location): string => {
  const x = r as { title?: string; name?: string; id: string };
  return x.title ?? x.name ?? x.id;
};
