import type { Order } from './schema';

export const titleOf = (r: Order): string => {
  const x = r as { title?: string; name?: string; id: string };
  return x.title ?? x.name ?? x.id;
};
