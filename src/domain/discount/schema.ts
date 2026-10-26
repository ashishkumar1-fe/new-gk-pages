import { z } from 'zod';
import { EntitySchema } from '@/domain/shared/entity';
import { MoneySchema } from '@/domain/shared/money';

/** What the app means by a discount. Fields from docs/architecture/domain/discounts.md; wire shapes live in api/. Verify against a real sandbox response before freezing.
 *  Money is integer paise ({ minor }) everywhere; transformers convert at the boundary only (mistakes.md: prices sent in rupees). */

export const DiscountValueSchema = z.union([
  z.object({ type: z.literal('percentage'), percent: z.number(), maxDiscount: MoneySchema.optional() }),
  z.object({ type: z.literal('fixed'), amount: MoneySchema }),
]);
export type DiscountValue = z.infer<typeof DiscountValueSchema>;

export const MatcherSchema = z.object({
  by: z.enum(['product', 'variant', 'collection', 'tag']),
  ids: z.array(z.string()),
  minQuantity: z.number().int().optional(),
});
export type Matcher = z.infer<typeof MatcherSchema>;

export const GiftProductSchema = z.object({
  productId: z.string(),
  variantId: z.string(),
  name: z.string(),
  unitPrice: MoneySchema,
  imageUrl: z.string().optional(),
  quantity: z.number().int(),
});
export type GiftProduct = z.infer<typeof GiftProductSchema>;

/** `{ all: true }` or a specific selection of products and/or collections. */
export const ScopeSchema = z.union([
  z.object({ all: z.literal(true) }),
  z.object({ productIds: z.array(z.string()).optional(), collectionIds: z.array(z.string()).optional() }),
]);
export type Scope = z.infer<typeof ScopeSchema>;

export const BuyXGetYSchema = z.object({
  buy: z.array(MatcherSchema),
  get: MatcherSchema,
  getQuantity: z.number().int(),
  reward: z.union([z.literal('free'), DiscountValueSchema]),
  autoAddFreebie: z.boolean(),
});
export const BundleSchema = z.object({ scope: ScopeSchema, tiers: z.array(z.object({ quantity: z.number(), fixedPrice: MoneySchema })) });
/** `min`/`max` are paise when basis is amount, item counts when quantity; `amount` is a percent or paise per `method`. */
export const DynamicTierSchema = z.object({
  basis: z.enum(['amount', 'quantity']),
  method: z.enum(['percentage', 'fixed']),
  tiers: z.array(z.object({ min: z.number(), max: z.number().optional(), amount: z.number(), maxDiscount: MoneySchema.optional() })),
});
export const FreeGiftSchema = z.union([
  z.object({ gift: GiftProductSchema }),
  z.object({ get: MatcherSchema, getQuantity: z.number().int(), autoAddFreebie: z.boolean() }),
]);

export const EligibilitySchema = z.union([
  z.object({ type: z.literal('all') }),
  z.object({ type: z.literal('new') }),
  z.object({ type: z.literal('returning') }),
  z.object({ type: z.literal('customers'), ids: z.array(z.string()), exclude: z.boolean().optional() }),
  z.object({ type: z.literal('segments'), ids: z.array(z.string()) }),
]);
export type Eligibility = z.infer<typeof EligibilitySchema>;

/** Engine behaviour; round-tripped, not edited in today's wizard. */
export const StackingConfigSchema = z
  .object({
    enabled: z.boolean(),
    maxStackCount: z.number().optional(),
    basis: z.enum(['subtotal', 'to_pay']).optional(),
    rules: z
      .array(
        z.object({
          by: z.enum(['mode', 'type', 'discount']),
          allowed: z.array(z.array(z.string())).optional(),
          blocked: z.array(z.array(z.string())).optional(),
        }),
      )
      .optional(),
    maxDiscountCap: z
      .object({
        enabled: z.boolean(),
        type: z.enum(['percentage', 'fixed']),
        value: z.number(),
        basis: z.enum(['subtotal', 'to_pay']).optional(),
      })
      .optional(),
  })
  .passthrough();
export type StackingConfig = z.infer<typeof StackingConfigSchema>;

export const CrossDomainEffectSchema = z
  .object({
    domain: z.enum(['discount', 'shipping', 'rewards', 'payment']),
    effect: z.enum(['block', 'allow', 'exclude', 'set_value', 'add_value']),
    value: z.object({ value: z.number(), unit: z.string(), label: z.string().optional() }).optional(),
    filter: z.record(z.unknown()).optional(),
    reason: z.string().optional(),
    priority: z.number().optional(),
  })
  .passthrough();
export type CrossDomainEffect = z.infer<typeof CrossDomainEffectSchema>;

export const BulkCodeCampaignSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  codeLength: z.number().int(),
  totalCodes: z.number().int(),
  usesPerCode: z.number().int(),
  status: z.string(), // 'initiated' | 'completed' | job_status
  codesFileKey: z.string().optional(),
  endsAt: z.string().optional(),
  createdAt: z.string(),
});
export type BulkCodeCampaign = z.infer<typeof BulkCodeCampaignSchema>;

export const DiscountSchema = EntitySchema.extend({
  title: z.string(),
  displayName: z.string().optional(),
  description: z.string().optional(),
  terms: z.array(z.string()),
  kind: z.enum(['cart', 'buy_x_get_y', 'bundle', 'dynamic_tier', 'free_gift']),
  method: z.enum(['code', 'automatic']), // fixed after create
  code: z.string().optional(),
  status: z.enum(['draft', 'published', 'inactive', 'deleted']),
  effectiveStatus: z.string().optional(),
  priority: z.number().optional(),
  // offer, by kind
  value: DiscountValueSchema.optional(),
  discountBase: z.enum(['cart', 'product']).optional(),
  appliesTo: ScopeSchema.optional(),
  buyXGetY: BuyXGetYSchema.optional(),
  bundle: BundleSchema.optional(),
  dynamicTier: DynamicTierSchema.optional(),
  freeGift: FreeGiftSchema.optional(),
  giftTopUp: z.array(GiftProductSchema).optional(),
  // conditions
  minimum: z
    .union([z.object({ subtotal: MoneySchema, reference: z.enum(['subtotal', 'to_pay']) }), z.object({ quantity: z.number().int() })])
    .optional(),
  eligibility: EligibilitySchema.optional(), // required in the doc; optional until the transformer fills it
  limits: z.object({ total: z.number().int().optional(), perCustomer: z.number().int().optional(), perOrder: z.number().int().optional() }), // undefined = unlimited
  devices: z.array(z.enum(['website', 'app'])),
  visibility: z.enum(['always', 'hidden', 'eligible']),
  startsAt: z.string(),
  endsAt: z.string().optional(), // undefined = no end date
  // engine behaviour, round-tripped
  stacking: StackingConfigSchema.optional(),
  crossDomainEffects: z.array(CrossDomainEffectSchema).optional(),
  payment: z.object({ disableForCod: z.boolean(), disableForPrepaid: z.boolean() }),
  mustApply: z.boolean().optional(), // v1 only
  bulkCampaign: BulkCodeCampaignSchema.optional(), // discount sets only
});
export type Discount = z.infer<typeof DiscountSchema>;
export const DiscountListItemSchema = DiscountSchema;
export type DiscountListItem = Discount;
export const DiscountInputSchema = DiscountSchema.partial().extend({ id: z.string().optional() });
export type DiscountInput = z.infer<typeof DiscountInputSchema>;
