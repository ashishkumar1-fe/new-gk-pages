import type { Customer } from './schema';

export const titleOf = (r: Customer): string => {
  const x = r as { title?: string; name?: string; id: string };
  return x.title ?? x.name ?? x.id;
};
