# Custom fields

[← Schema](README.md)

Service: inventory service (`/v1/admin/metafield-definitions`, `/metafields`, `/metaobject-definitions`, `/metaobjects`). Industry name: metafields. Shopify-compatible type names.

## Definition

```ts
type OwnerType =
  | 'product' | 'variant' | 'collection' | 'customer' | 'order' | 'draft_order'
  | 'location' | 'page' | 'blog' | 'article' | 'market' | 'shop'
  | 'company' | 'company_location';

type FieldType =
  | 'single_line_text_field' | 'multi_line_text_field' | 'rich_text_field'
  | 'number_integer' | 'number_decimal' | 'boolean'
  | 'date' | 'date_time' | 'url' | 'link' | 'color' | 'json' | 'id' | 'rating'
  | 'money' | 'weight' | 'dimension' | 'volume'
  | 'file_reference' | 'product_reference' | 'variant_reference' | 'collection_reference'
  | 'customer_reference' | 'company_reference' | 'page_reference'
  | 'metaobject_reference' | 'mixed_reference';

interface FieldDefinition extends Entity {
  ownerType: OwnerType;              // resource_type
  namespace: string;                 // "custom"
  key: string;
  name: string;
  description?: string;
  type: FieldType;                   // data_type
  list: boolean;                     // multiple_value
  validation?: Record<string, unknown>;   // validation_schema
  required: boolean;
  filterable: boolean;               // is_indexed
  pinned: boolean;                   // max 20 pinned per owner type
  categoryIds: Id[];                 // assignedCategories: only for these product categories
  referenceId?: Id;                  // metaobject definition for metaobject_reference
}
```

## Value

Embedded in the record's payload and saved with it.

```ts
interface FieldValue {
  id?: Id;                           // metafield_id
  definitionId?: Id;
  namespace: string;
  key: string;
  type: FieldType;
  value: string;                     // serialized; parsed by type
}
```

## Metaobjects

Reusable structured content (size charts, ingredients, FAQs). Already in the backend.

```ts
interface MetaobjectDefinition extends Entity {
  type: string;                      // "size_chart"
  name: string;
  description?: string;
  fields: { key: string; name: string; type: FieldType; list: boolean; validation?: unknown; referenceId?: Id }[];
  entriesCount: number;
}

interface Metaobject extends Entity {
  definitionId: Id;
  handle: Handle;
  status: 'active' | 'draft';
  fields: { key: string; value: string }[];
}
```

## How the UI uses it

- The editor loads definitions for the owner type (and the product's category) and builds a runtime Zod schema (see [../docs/domain.md](../docs/domain.md)).
- Pinned definitions and filled values show by default; others are one click away.
- "Create definition" from the editor is a command; the new field appears without a reload.
