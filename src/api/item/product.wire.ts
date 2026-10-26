import { z } from 'zod';

/** What the item service actually sends. Changes when the backend changes, never for business reasons. */
export const RawVariant = z.object({
  id: z.string(),
  title: z.string(),
  price: z.string(), // paise as a decimal string
  compare_at_price: z.string().nullable().optional(),
  cost_per_item: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  option1: z.string().nullable().optional(),
  option2: z.string().nullable().optional(),
  option3: z.string().nullable().optional(),
  taxable: z.boolean().optional(),
  requires_shipping: z.boolean().optional(),
  inventory_management: z.string().nullable().optional(), // 'shopify' = tracked
  continue_selling_out_of_stock: z.boolean().optional(),
  inventory_quantity: z.number().optional(),
  weight: z.union([z.string(), z.number()]).nullable().optional(),
  weight_unit: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const RawOption = z.object({ id: z.string(), name: z.string(), position: z.number(), values: z.array(z.string()) });

export const RawProduct = z.object({
  id: z.string(),
  title: z.string(),
  handle: z.string(),
  body_html: z.string().nullable().optional(),
  vendor: z.string().nullable().optional(),
  product_type: z.string().nullable().optional(),
  status: z.string(),
  tags: z.string().nullable().optional(), // ", "-joined
  created_at: z.string(),
  updated_at: z.string(),
  published_at: z.string().nullable().optional(),
  charge_tax: z.boolean().optional(),
  hs_code: z.string().nullable().optional(),
  seo_title: z.string().nullable().optional(),
  seo_description: z.string().nullable().optional(),
  options: z.array(RawOption).optional(),
  images: z
    .array(z.object({ id: z.string(), src: z.string(), alt: z.string().nullable().optional(), position: z.number().optional() }))
    .optional(),
  variants: z.array(RawVariant).optional(),
  variants_count: z.number().optional(),
  template_suffix: z.string().nullable().optional(),
  sales_channel: z
    .union([z.array(z.string()), z.object({ online: z.boolean(), pos: z.boolean() })])
    .nullable()
    .optional(),
  is_physical_product: z.boolean().nullable().optional(),
  weight: z.union([z.string(), z.number()]).nullable().optional(),
  weight_unit: z.string().nullable().optional(),
  country_of_origin: z.string().nullable().optional(),
  has_sku_or_barcode: z.boolean().nullable().optional(),
  product_category: z
    .object({ product_taxonomy_node_id: z.string().optional(), name: z.string().optional(), full_name: z.string().optional() })
    .nullable()
    .optional(),
  collectionIds: z.array(z.string()).nullable().optional(),
});
export type RawProduct = z.infer<typeof RawProduct>;

export const RawPagination = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrevious: z.boolean(),
});

export const RawProductList = z.object({ products: z.array(RawProduct), pagination: RawPagination });
export const RawProductDetail = z.object({ product: RawProduct });
export const RawProductCreated = z.object({ product: z.object({ id: z.string() }) });

/** Write shape (item is mixed: product top level snake_case, nested variants camelCase). */
export interface ProductWrite {
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  handle: string;
  status: 'active' | 'draft' | 'archived';
  tags: string;
  price: number;
  compare_at_price: number | null;
  cost_per_item: number | null; // integer paise
  charge_tax: boolean;
  hs_code: string;
  sku: string;
  seo_title: string;
  seo_description: string;
  seo_url_handle: string;
  template_suffix: string | null;
  sales_channel: string[];
  is_physical_product: boolean;
  has_sku_or_barcode: boolean;
  weight: number;
  weight_unit: string;
  country_of_origin: string;
  collectionIds: string[];
  product_category?: { product_taxonomy_node_id: string };
  variants: {
    id?: string;
    title: string;
    price: number;
    compareAtPrice: number | null;
    costPerItem: number | null;
    sku: string;
    taxable: boolean;
  }[];
}

/** PUT /variants/:id body (gateway/item.md VariantUpdate). Money is paise as a string here, unlike the product PUT. */
export interface VariantWrite {
  title: string;
  price: string;
  compare_at_price: string | null;
  cost_per_item: number;
  position: 1;
  sku: string;
  barcode: string;
  taxable: boolean;
  requires_shipping: true;
  fulfillment_service: 'manual';
  inventory_policy: 'continue' | 'deny';
  inventory_management: 'shopify' | null;
  continue_selling_out_of_stock: boolean;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  weight: number;
  weight_unit: string;
}
export const RawVariantResponse = z.union([z.object({ data: RawVariant }), RawVariant]);

/** One entry of POST /product-operations/bulk-update: the full product, so replace* flags never drop variants. */
export interface BulkProductWrite {
  id: string;
  data: Omit<ProductWrite, 'variants'> & {
    replaceVariants: true;
    replaceOptionValues: true;
    replaceImages: true;
    variants: {
      id: string;
      title: string;
      price: number;
      compareAtPrice: number | null;
      costPerItem: number | null;
      sku: string;
      barcode: string;
      taxable: boolean;
      option1: string | null;
      option2: string | null;
      option3: string | null;
      inventoryQuantity: number;
    }[];
  };
}
export const RawBulkUpdate = z.object({ updatedCount: z.number().optional(), updated: z.number().optional() }).passthrough();

export const RawContent = z.object({
  requestId: z.string(),
  generatedTitle: z.string(),
  generatedDescription: z.string(),
  processingTime: z.number().optional(),
});
export const RawContentResponse = z.union([z.object({ data: RawContent }), RawContent]);

export const RawStorefront = z
  .object({ storefront_url: z.string().optional(), routeForProducts: z.string().optional(), routeForCollections: z.string().optional() })
  .passthrough();
