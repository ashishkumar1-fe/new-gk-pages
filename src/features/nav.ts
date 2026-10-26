import type { IconName } from '@/ui';
import { iconFor } from '@/ui';

/** Design icons per resource (design: shell.tsx Sidebar). Falls back to the resource's own icon name, then a box. */
const BY_RESOURCE: Record<string, IconName> = {
  product: 'products',
  order: 'orders',
  draftOrder: 'content',
  customer: 'customers',
  segment: 'segment',
  discount: 'discounts',
  discountSet: 'tag',
  collection: 'layers',
  inventory: 'boxes',
  purchaseOrder: 'clipboard',
  transfer: 'switch',
  location: 'pin',
};
export const navIconFor = (resource: string, fallback?: string): IconName => BY_RESOURCE[resource] ?? iconFor(fallback);

/** Nav entries the design shows that have no resource yet. They render as "Coming soon". */
export const COMING_SOON: { after: string; label: string; icon: IconName; children?: string[] }[] = [
  { after: 'customer', label: 'Reviews', icon: 'star' },
  { after: 'customer', label: 'Growth', icon: 'growth', children: ['Scheduled events', 'Personalization'] },
  { after: 'discount', label: 'Content', icon: 'content' },
  { after: 'discount', label: 'Markets', icon: 'markets' },
  { after: 'discount', label: 'Analytics', icon: 'analytics', children: ['Reports'] },
];
export const CHILD_PLACEHOLDERS: Record<string, string[]> = {
  order: ['Abandoned checkouts'],
  product: ['Gift cards'],
};
