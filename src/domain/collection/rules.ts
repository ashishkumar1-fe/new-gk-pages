import type { Collection } from './schema';

// Pure rules, ported as today. Each cites the gk-pages source it came from (docs/architecture/domain/catalog.md#collection).

export type RuleField =
  'title' | 'product_type' | 'vendor' | 'tag' | 'category' | 'price' | 'compare_at_price' | 'weight' | 'variant_title' | 'custom_field';
export type RuleOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty';

/**
 * Operators offered per smart-collection field, in today's order, and the input kind.
 * (collections/collectionFormComponents/ConditionsCard.tsx:136-210; custom field (Metafield) offers equals only)
 */
export const ruleOperators: Record<RuleField, { operators: RuleOperator[]; input: 'text' | 'number' }> = {
  title: { operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with'], input: 'text' },
  product_type: { operators: ['equals', 'not_equals', 'starts_with', 'ends_with', 'contains', 'not_contains'], input: 'text' },
  tag: { operators: ['equals'], input: 'text' },
  category: { operators: ['equals', 'not_equals'], input: 'text' },
  price: { operators: ['equals', 'not_equals', 'greater_than', 'less_than'], input: 'number' },
  compare_at_price: { operators: ['equals', 'not_equals', 'is_not_empty', 'is_empty', 'less_than', 'greater_than'], input: 'number' },
  weight: { operators: ['equals', 'not_equals', 'greater_than', 'less_than'], input: 'number' },
  vendor: { operators: ['equals', 'not_equals', 'starts_with', 'ends_with', 'contains', 'not_contains'], input: 'text' },
  variant_title: { operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with'], input: 'text' },
  custom_field: { operators: ['equals'], input: 'text' },
};

/**
 * Smart needs ≥ 1 rule (create and edit); manual create needs ≥ 1 product. Returns the message today shows, or undefined.
 * (collections/CollectionsForm.tsx:278 edit; CreateCollectionsForm.tsx:207, :214 create)
 */
export const collectionValidation = (
  c: Pick<Collection, 'kind' | 'rules'>,
  mode: 'create' | 'edit',
  productIds: string[] = [],
): string | undefined => {
  if (c.kind === 'smart' && (c.rules?.rules.length ?? 0) === 0)
    return mode === 'create' ? 'Please add the condition to the smart collection.' : 'A smart collection must have at least one condition.';
  if (c.kind === 'manual' && mode === 'create' && productIds.length === 0) return 'Please add at least one product to the collection.';
  return undefined;
};
