# Catalog

[← Domain](README.md) · Wire: [gateway › item](../gateway/item.md)

## Product

Holds content and grouping; price and stock live on variants. Product-level price, SKU and inventory fields on the wire are copies of the default variant; the domain reads the variant.

```ts
type ProductStatus = 'active' | 'draft' | 'archived';
type WeightUnit = 'kg' | 'g' | 'lb' | 'oz';     // aliases (grams, lbs…) normalised

interface Product extends Entity {
  title: string;
  handle: Handle;
  descriptionHtml: string;
  status: ProductStatus;
  vendor?: string;
  productType?: string;
  category?: { id: Id; name: string; fullName: string };
  tags: string[];
  options: ProductOption[];          // ≤ 3
  variants: Variant[];               // ≥ 1
  variantsCount?: number;
  defaultVariantId?: Id;
  images: ProductImage[];
  collectionIds: Id[];
  seo: { title?: string; description?: string };
  templateSuffix?: string;
  channels: ('online' | 'pos')[];    // wire: string[] or { online, pos }
  publishedAt?: DateTime;
  tax: ProductTax;                   // pricing-tax.md
  countryOfOrigin?: string;
  isPhysical: boolean;
  hasSkuOrBarcode: boolean;
  customFields: FieldValue[];
}

interface ProductOption {
  id: Id;
  name: string;                      // "Size"
  position: 1 | 2 | 3;
  values: string[];
}

interface Variant extends Entity {
  productId: Id;
  title: string;                     // "M / Blue"; "Default Title" = no options
  selectedOptions: { name: string; value: string }[];
  sku?: string;
  barcode?: string;
  price: Money;
  compareAtPrice?: Money;
  costPerItem?: Money;
  taxable: boolean;
  requiresShipping: boolean;
  weight?: Weight;
  inventoryTracked: boolean;         // derived: inventory_management === 'shopify'
  inventoryPolicy: 'deny' | 'continue';   // derived: continue_selling_out_of_stock
  inventoryQuantity: number;         // total across locations; per location in inventory.md
  imageUrl?: string;
}

interface ProductImage {
  id: Id;                            // generated client-side (UUID); backend upserts on it
  url: string;
  altText?: string;
  width?: number; height?: number;
  position: number;                  // main image = position 0
}
```

## Collection

```ts
type RuleField = 'title' | 'product_type' | 'vendor' | 'tag' | 'category' | 'price'
               | 'compare_at_price' | 'weight' | 'variant_title' | 'custom_field';
type RuleOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains'
                  | 'not_contains' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty';

interface Collection extends Entity {
  title: string;
  handle: Handle;
  description: string;
  imageUrl?: string;
  kind: 'manual' | 'smart';
  rules?: { match: 'all' | 'any'; rules: { field: RuleField; operator: RuleOperator; value: string; fieldDefinitionId?: Id; fieldKey?: string }[] };
  sortOrder: 'manual' | 'web' | '';  // create default 'manual'
  productsCount: number;
  published: boolean;
  publishedAt?: DateTime;
  seo: { title?: string; description?: string };
  templateSuffix?: string;
  customFields: FieldValue[];
}

interface TaxonomyNode {             // Shopify standard taxonomy
  id: Id;
  name: string;
  fullName: string;                  // "Apparel > Shirts"
  parentId?: Id;
  isLeaf: boolean;
}
```

## Rules

As today. Source paths are in gk-pages `src/`.

| Rule | What | gk-pages source |
|---|---|---|
| `isDefaultVariant` | one variant titled "Default Title" = product has no options | `components/products/ProductForm.tsx:280` |
| `generateVariants` | every combination of option values, by position; title "A / B / C" | `ProductFormComponents/VariantsCard/utils.ts:9` |
| `matchExistingVariants` | on option change, keep ids and prices of variants whose titles still match | `VariantsCard/utils.ts:98`, `:259` |
| `newVariantDefaults` | price, compare-at, cost 0; kg; taxable; tracked; policy deny. On edit, new variants reuse the first non-zero price | `VariantsCard/utils.ts:211`, `:259` |
| `optionPresets` | Size, Color, Material, Style, Weight, with preset values | `VariantsCard/constants.ts:2` |
| `profit` / `margin` | profit = price − cost; margin = price ≤ 0 → 0, else profit ÷ price × 100; both 2 dp; computed on the client, sent on write | `utils/calculationFunctions.ts:2` |
| `deriveHandle` | trimmed SEO handle, else title lowercased, spaces → "-" | `modules/products/transformers/products.request.transformer.ts:177` |
| `productValidation` | title required; each option ≥ 1 value; variant price required; image source required; tags ≤ 50 chars; SKU optional | `ProductForm.tsx:90`, `:125`, `:140`, `:149`, `:213` |
| `normalizeWeightUnit` | grams, lbs… → kg, g, lb, oz | `modules/products/constants.ts` |
| `productDefaults` | status active, charge tax off, country of origin `US`, weight unit kg | `ProductForm.tsx:94` |
| `tagsJoin` | tags joined and split on ", " | `products.request.transformer.ts:93` |
| `ruleOperators` | tag: equals; category: equals, not equals; price, weight: equals, not equals, greater, less; compare-at: those plus is empty, is not empty; text: equals, not equals, contains, not contains, starts with, ends with; custom field: equals | `collectionFormComponents/ConditionsCard.tsx:136` |
| `collectionValidation` | smart needs ≥ 1 rule; manual create needs ≥ 1 product | `collections/CollectionsForm.tsx:278`, `CreateCollectionsForm.tsx:214` |
