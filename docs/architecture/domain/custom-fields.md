# Custom fields

[← Domain](README.md) · Wire: [gateway › inventory › custom fields](../gateway/inventory.md)

Industry name: metafields. Shopify-compatible type names.

## Definition

```ts
type OwnerType =                     // wire: title case ('Product', 'Draft Order', 'Blog Post'), mapped in the transformer
  | 'product' | 'variant' | 'collection' | 'customer' | 'order' | 'draft_order'
  | 'location' | 'page' | 'blog' | 'blog_post' | 'market' | 'shop'
  | 'company' | 'company_location' | 'metaobject';

type FieldType =
  | 'single_line_text_field' | 'multi_line_text_field' | 'rich_text_field'
  | 'number_integer' | 'number_decimal' | 'boolean'
  | 'date' | 'date_time' | 'url' | 'link' | 'color' | 'json' | 'id' | 'rating'
  | 'money' | 'weight' | 'dimension' | 'volume'
  | 'file_reference' | 'product_reference' | 'variant_reference' | 'collection_reference'
  | 'customer_reference' | 'company_reference' | 'page_reference'
  | 'metaobject_reference' | 'mixed_reference';

interface FieldDefinition extends Entity {
  ownerType: OwnerType;
  namespace: string;                 // "custom"
  key: string;
  name: string;
  description?: string;
  type: FieldType;
  list: boolean;                     // wire: boolean or 0 / 1
  validation?: Record<string, unknown>;
  required: boolean;                 // validation.required is what the value check reads
  pinned: boolean;                   // wire: boolean or 0 / 1
  categoryIds: Id[];                 // only for these product categories
  referenceId?: Id;                  // metaobject definition for metaobject_reference
}
```

## Value

```ts
interface FieldValue {
  id?: Id;
  definitionId?: Id;
  namespace: string;
  key: string;
  type: FieldType;
  value: unknown;                    // parsed by type; non-strings are JSON on the wire
}
```

## Metaobjects

Reusable structured content (size charts, ingredients, FAQs).

```ts
interface MetaobjectDefinition extends Entity {
  type: string;                      // "size_chart"
  name: string;
  description?: string;
  fields: { key: string; name: string; type: FieldType; list: boolean; required: boolean; referenceId?: Id }[];
  entriesCount?: number;             // only from the with-counts list
}

interface Metaobject extends Entity {
  definitionId: Id;
  handle: Handle;
  fields: { key: string; value: unknown }[];
}
```

## Runtime schema

Definitions come from the server, so the editor builds a Zod schema at runtime and merges it with the static one:

```ts
const schema = ProductInputSchema.extend({ customFields: fieldsSchema(definitions) });
```

## Rules

| Rule | What | gk-pages source |
|---|---|---|
| `fieldsSchema` | one validator per definition: required, min / max length, pattern, choices, min / max (unit-aware), date range, URL domains | `components/common/ResourceMetafieldCard.tsx:290` |
| `isListSupported` | no list for id, money, json, rich text, boolean, multi-line text | `library/utilities/constants/metaData.ts:330` |
| `isReferenceType` | `*_reference` types | `metaData.ts:350` |
| `maxPinned` | ≤ 20 pinned definitions per owner type | `pages/settings/MetaFieldsSettings/CreateMetaField.tsx:63` |
| `mergeValues` | match a value to its definition by id, then namespace:key, then key | `utils/metafields.ts:188` |
