import type { PurchaseOrder } from './schema';

export const titleOf = (r: PurchaseOrder): string => {
  const x = r as { title?: string; name?: string; id: string };
  return x.title ?? x.name ?? x.id;
};
