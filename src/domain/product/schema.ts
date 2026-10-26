import { z } from 'zod';
import { EntitySchema, DateTime, WeightSchema } from '@/domain/shared/entity';
import { MoneySchema } from '@/domain/shared/money';

export const ProductStatus = z.enum(['active', 'draft', 'archived']);
export type ProductStatus = z.infer<typeof ProductStatus>;

export const ProductOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.number().int().min(1).max(3),
  values: z.array(z.string()),
});
export type ProductOption = z.infer<typeof ProductOptionSchema>;

export const VariantSchema = EntitySchema.extend({
  productId: z.string(),
  title: z.string(), // "M / Blue"; "Default Title" = no options
  selectedOptions: z.array(z.object({ name: z.string(), value: z.string() })),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  price: MoneySchema,
  compareAtPrice: MoneySchema.optional(),
  costPerItem: MoneySchema.optional(),
  taxable: z.boolean(),
  requiresShipping: z.boolean(),
  weight: WeightSchema.optional(),
  inventoryTracked: z.boolean(),
  inventoryPolicy: z.enum(['deny', 'continue']),
  inventoryQuantity: z.number().int(),
});
export type Variant = z.infer<typeof VariantSchema>;

export const ProductImageSchema = z.object({ id: z.string(), url: z.string(), altText: z.string().optional(), position: z.number().int() });
export type ProductImage = z.infer<typeof ProductImageSchema>;

export const ProductSchema = EntitySchema.extend({
  title: z.string(),
  handle: z.string(),
  descriptionHtml: z.string(),
  status: ProductStatus,
  vendor: z.string().optional(),
  productType: z.string().optional(),
  tags: z.array(z.string()),
  options: z.array(ProductOptionSchema).max(3),
  variants: z.array(VariantSchema).min(1), // every product has at least one variant
  images: z.array(ProductImageSchema),
  seo: z.object({ title: z.string().optional(), description: z.string().optional() }),
  tax: z.object({ taxable: z.boolean(), hsnCode: z.string().optional() }),
  publishedAt: DateTime.optional(),
  category: z.object({ id: z.string(), name: z.string(), fullName: z.string() }).optional(),
  channels: z.array(z.enum(['online', 'pos'])), // wire: string[] or { online, pos }
  templateSuffix: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  isPhysical: z.boolean(),
  hasSkuOrBarcode: z.boolean(),
  collectionIds: z.array(z.string()),
});
export type Product = z.infer<typeof ProductSchema>;

/** List row: a slimmer shape than detail. */
export const ProductListItemSchema = ProductSchema.pick({
  id: true,
  title: true,
  status: true,
  vendor: true,
  productType: true,
  createdAt: true,
  updatedAt: true,
  category: true,
  channels: true,
}).extend({ variantsCount: z.number().int(), inventoryQuantity: z.number().int(), imageUrl: z.string().optional() });
export type ProductListItem = z.infer<typeof ProductListItemSchema>;

/** Editor draft: what the form holds and what create/update send (domain names). */
export const ProductInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, 'Title is required'),
  descriptionHtml: z.string().default(''),
  status: ProductStatus.default('active'),
  vendor: z.string().optional(),
  productType: z.string().optional(),
  tags: z.array(z.string().max(50, 'Tags are limited to 50 characters')).default([]),
  price: MoneySchema, // default variant price (single-variant products)
  compareAtPrice: MoneySchema.optional(),
  costPerItem: MoneySchema.optional(),
  sku: z.string().optional(),
  taxable: z.boolean().default(false),
  hsnCode: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  handle: z.string().optional(),
  templateSuffix: z.string().optional(),
  channels: z.array(z.enum(['online', 'pos'])).default(['online']),
  isPhysical: z.boolean().default(false),
  weight: WeightSchema.optional(),
  countryOfOrigin: z.string().default('US'),
  categoryId: z.string().optional(),
  collectionIds: z.array(z.string()).default([]),
  hasOptions: z.boolean().optional(), // derived on load: pricing, SKU and stock sections hide when true
});
export type ProductInput = z.infer<typeof ProductInputSchema>;
