import type { CustomFields } from './schema';

export const titleOf = (r: CustomFields): string => {
  const x = r as { title?: string; name?: string; id: string };
  return x.title ?? x.name ?? x.id;
};
