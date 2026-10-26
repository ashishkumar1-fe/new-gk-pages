import type { ProductStatus, ProductListItem } from './schema';

export const statusLabel = (s: ProductStatus) => ({ active: 'Active', draft: 'Draft', archived: 'Archived' })[s];
export const statusTone = (s: ProductStatus): 'success' | 'warning' | 'neutral' =>
  (({ active: 'success', draft: 'warning', archived: 'neutral' }) as const)[s];
/** "50 in stock for 5 variants" (design); display only. */
export const inventorySummary = (p: Pick<ProductListItem, 'inventoryQuantity' | 'variantsCount'>) =>
  `${p.inventoryQuantity} in stock for ${p.variantsCount} variant${p.variantsCount === 1 ? '' : 's'}`;
