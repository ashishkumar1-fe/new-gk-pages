import { z } from 'zod';
import { EntitySchema } from '@/domain/shared/entity';

/** What the app means by a customFields. Fields from docs/architecture/domain/custom-fields.md; wire shapes live in api/. Verify against a real sandbox response before freezing. */
export const CustomFieldsSchema = EntitySchema.extend({
  ownerType: z.enum([
    'product',
    'variant',
    'collection',
    'customer',
    'order',
    'draft_order',
    'location',
    'page',
    'blog',
    'blog_post',
    'market',
    'shop',
    'company',
    'company_location',
    'metaobject',
  ]),
  namespace: z.string(),
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.string(), // Shopify-compatible type names (FieldType)
  list: z.boolean(),
  validation: z.record(z.unknown()).optional(),
  required: z.boolean(),
  pinned: z.boolean(),
  categoryIds: z.array(z.string()),
  referenceId: z.string().optional(),
});
export type CustomFields = z.infer<typeof CustomFieldsSchema>;
export const CustomFieldsListItemSchema = CustomFieldsSchema;
export type CustomFieldsListItem = CustomFields;
export const CustomFieldsInputSchema = CustomFieldsSchema.partial().extend({ id: z.string().optional() });
export type CustomFieldsInput = z.infer<typeof CustomFieldsInputSchema>;

export type OwnerType = CustomFields['ownerType'];
export const FieldType = z.enum([
  'single_line_text_field',
  'multi_line_text_field',
  'rich_text_field',
  'number_integer',
  'number_decimal',
  'boolean',
  'date',
  'date_time',
  'url',
  'link',
  'color',
  'json',
  'id',
  'rating',
  'money',
  'weight',
  'dimension',
  'volume',
  'file_reference',
  'product_reference',
  'variant_reference',
  'collection_reference',
  'customer_reference',
  'company_reference',
  'page_reference',
  'metaobject_reference',
  'mixed_reference',
]);
export type FieldType = z.infer<typeof FieldType>;

/** One value on a record. `value` is parsed by type; non-strings are JSON on the wire. */
export const FieldValueSchema = z.object({
  id: z.string().optional(),
  definitionId: z.string().optional(),
  namespace: z.string(),
  key: z.string(),
  type: z.string(),
  value: z.unknown(),
});
export type FieldValue = z.infer<typeof FieldValueSchema>;
