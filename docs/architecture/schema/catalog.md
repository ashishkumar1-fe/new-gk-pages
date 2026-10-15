# Catalog

[← Schema](README.md)

Service: item service (`/api/v1/admin/products`, `/variants`, `/options`, `/collections`, `/product-taxonomy`).

## Product

The thing a customer browses. Holds content and grouping; price and stock live on variants.

```ts
type ProductStatus = 'active' | 'draft' | 'archived';

interface Product extends Entity {
  title: string;
  handle: Handle;
  descriptionHtml: string;          // body_html
  status: ProductStatus;
  vendor?: string;
  productType?: string;
  category?: TaxonomyNode;          // product_category
  tags: string[];                   // backend: comma-joined string
  options: ProductOption[];         // max 3
  variants: Variant[];              // ≥ 1; paged for large products
  variantsCount: number;
  images: ProductImage[];
  collectionIds: Id[];
  seo: { title?: string; description?: string };
  templateSuffix?: string;
  channels: { channelId: string; published: boolean }[];   // from sales_channel ["online","pos"]
  publishedAt?: DateTime;
  tax: ProductTax;                  // { taxable (charge_tax), hsnCode (hs_code) }; see pricing-tax.md
  countryOfOrigin?: string;
  isPhysical: boolean;
  customFields: FieldValue[];       // metafields
}
```

Backend also returns product-level `price`, `compare_at_price`, `cost_per_item`, `profit`, `margin`, `sku`, `barcode` (copies of the first variant). The domain model drops them and reads the variant.

## Option and variant

```ts
interface ProductOption {
  id: Id;
  name: string;                     // "Size"
  position: 1 | 2 | 3;
  values: string[];
}

interface Variant extends Entity {
  productId: Id;
  title: string;                    // "M / Blue"
  selectedOptions: { name: string; value: string }[];   // from option1..option3
  position: number;
  sku?: string;
  barcode?: string;                 // EAN / GTIN
  price: Money;
  compareAtPrice?: Money;           // compare_at_price; labelled as today
  costPerItem?: Money;
  taxable: boolean;
  requiresShipping: boolean;
  weight?: Weight;
  inventoryTracked: boolean;        // track_inventory / inventory_management
  inventoryPolicy: 'deny' | 'continue';
  inventoryQuantity: number;        // total across locations; per-location in inventory.md
  imageId?: Id;
  customFields: FieldValue[];
}
```

- Variants are combinations of option values, generated in the UI (domain rule) and saved as a full set (`replaceVariants: true`).
- Large products: the variant endpoint is offset-paged (`limit` 10 today). The editor shows the first few and opens a variants view for the rest, as in the design.

## Images

```ts
interface ProductImage {
  id: Id;                           // generated client-side (UUID); backend upserts on it
  url: string;
  altText?: string;
  width?: number; height?: number;
  position: number;
  isMain: boolean;
}
```

Files come from the media library (see [store.md](store.md#media-library)). Images only for v1; video and 3D are not supported by the backend.

## Collection

```ts
interface Collection extends Entity {
  title: string;
  handle: Handle;
  description: string;
  imageUrl?: string;
  kind: 'manual' | 'smart';         // collectionType
  rules?: CollectionRules;          // smart only
  sortOrder: string;
  productsCount: number;
  published: boolean;
  publishedAt?: DateTime;
  seo: { title?: string; description?: string };
  templateSuffix?: string;
  customFields: FieldValue[];
}

interface CollectionRules {
  match: 'all' | 'any';
  rules: {
    field: 'title' | 'product_type' | 'vendor' | 'tag' | 'category' | 'price'
         | 'compare_at_price' | 'weight' | 'variant_title' | 'custom_field';
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains'
            | 'not_contains' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty';
    value: string;
    fieldDefinitionId?: Id;         // when field = custom_field (equals only)
  }[];
}
```

Backend sends display strings (`"Product Type"`, `"is equal to"`); the transformer maps them to these codes. Manual membership changes are sent as `addProducts` / `removedProducts`.

## Taxonomy

```ts
interface TaxonomyNode {
  id: Id;                           // Shopify standard taxonomy IDs
  name: string;
  fullName: string;                 // "Apparel > Shirts"
  parentId?: Id;
  isLeaf: boolean;
  level: number;
}
```

## Lookups

Vendors and product types are plain string lists (`/products/vendors`, `/products/product-types`); tags come from `/filters`.
