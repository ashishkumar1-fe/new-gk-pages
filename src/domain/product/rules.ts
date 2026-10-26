import type { Product, ProductOption, Variant } from './schema';
import { money, type Money } from '@/domain/shared/money';
import type { WeightUnit } from '@/domain/shared/entity';

/** One variant titled "Default Title" means the product has no options. (gk-pages ProductForm.tsx:280) */
export const isDefaultVariant = (p: Pick<Product, 'variants'>) => p.variants.length === 1 && p.variants[0]?.title === 'Default Title';

/** Every combination of option values, by position; title "A / B / C". (VariantsCard/utils.ts:9) */
export const generateVariantTitles = (options: ProductOption[]): string[] => {
  const sorted = [...options].sort((a, b) => a.position - b.position).filter((o) => o.values.length > 0);
  if (sorted.length === 0) return ['Default Title'];
  return sorted.reduce<string[]>((acc, o) => acc.flatMap((t) => o.values.map((v) => (t ? `${t} / ${v}` : v))), ['']);
};

/** profit = price − cost; margin = 0 when price ≤ 0 else profit ÷ price × 100; both 2 dp. (utils/calculationFunctions.ts:2) */
export const profit = (price: Money, cost?: Money): Money => ({ minor: price.minor - (cost?.minor ?? 0), currency: price.currency });
export const margin = (price: Money, cost?: Money): number =>
  price.minor <= 0 ? 0 : Math.round(((price.minor - (cost?.minor ?? 0)) / price.minor) * 10000) / 100;

/** Trimmed SEO handle, else title lowercased with spaces as hyphens. (products.request.transformer.ts:177) */
export const deriveHandle = (title: string, seoHandle?: string): string => {
  const h = seoHandle?.trim();
  if (h) return h;
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
};

/** Can this product be deleted from the UI? (always today; kept as a rule so the answer has one home) */
export const canDelete = (_p: Pick<Product, 'status'>) => true;

export const defaultVariantFor = (p: Product): Variant | undefined => p.variants[0];

/** The doc and spec name for the combination rule. Same function; kept so both names resolve. (VariantsCard/utils.ts:9) */
export const generateVariants = generateVariantTitles;

// ── Option presets ────────────────────────────────────────
/** Size, Color, Material, Style, Weight with preset values. (VariantsCard/constants.ts:2, :11) */
export const optionPresets: { name: string; values: string[] }[] = [
  { name: 'Size', values: ['Small', 'Medium', 'Large', 'X-Large', 'XX-Large'] },
  { name: 'Color', values: ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Purple', 'Orange'] },
  { name: 'Material', values: ['Cotton', 'Polyester', 'Wool', 'Silk', 'Linen', 'Leather', 'Denim'] },
  { name: 'Style', values: ['Casual', 'Formal', 'Sportswear', 'Vintage', 'Modern', 'Classic'] },
  { name: 'Weight', values: ['Light', 'Medium', 'Heavy', 'Ultra-Light', 'Extra-Heavy'] },
];

// ── Weight units ──────────────────────────────────────────
const WEIGHT_UNIT_ALIASES: Record<string, WeightUnit> = {
  kg: 'kg',
  kgs: 'kg',
  kilo: 'kg',
  kilos: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  kilogramme: 'kg',
  kilogrammes: 'kg',
  g: 'g',
  gm: 'g',
  gms: 'g',
  gram: 'g',
  grams: 'g',
  gramme: 'g',
  grammes: 'g',
  lb: 'lb',
  lbs: 'lb',
  pound: 'lb',
  pounds: 'lb',
  oz: 'oz',
  ozs: 'oz',
  ounce: 'oz',
  ounces: 'oz',
};
/** grams, KILOGRAMS, Pounds, ozs… → kg | g | lb | oz; anything else → fallback. (modules/products/constants.ts:39) */
export const normalizeWeightUnit = (value: unknown, fallback: WeightUnit = 'kg'): WeightUnit =>
  typeof value === 'string' ? (WEIGHT_UNIT_ALIASES[value.trim().toLowerCase()] ?? fallback) : fallback;

// ── Defaults ──────────────────────────────────────────────
/** Status active, charge tax off, country of origin US, weight unit kg. (ProductForm.tsx:94, :133-136) */
export const productDefaults = { status: 'active' as const, taxable: false, countryOfOrigin: 'US', weightUnit: 'kg' as WeightUnit };

/** Values a newly generated variant starts with. (VariantsCard/utils.ts:211 create; :259 edit) */
export interface NewVariantDefaults {
  price: Money;
  compareAtPrice: Money;
  costPerItem: Money;
  weight: { value: number; unit: WeightUnit };
  taxable: boolean;
  requiresShipping: boolean;
  inventoryTracked: boolean;
  inventoryPolicy: 'deny';
}
/**
 * Create: price, compare-at and cost 0; 0 kg; taxable; tracked; policy deny.
 * Edit: each money field reuses the first non-zero value found among existing variants.
 */
export const newVariantDefaults = (
  existing: Pick<Variant, 'price' | 'compareAtPrice' | 'costPerItem'>[] = [],
  currency = 'INR',
): NewVariantDefaults => {
  const firstNonZero = (pick: (v: (typeof existing)[number]) => Money | undefined): Money =>
    existing.map(pick).find((m): m is Money => !!m && m.minor !== 0) ?? money(0, currency);
  return {
    price: firstNonZero((v) => v.price),
    compareAtPrice: firstNonZero((v) => v.compareAtPrice),
    costPerItem: firstNonZero((v) => v.costPerItem),
    weight: { value: 0, unit: 'kg' },
    taxable: true,
    requiresShipping: true,
    inventoryTracked: true,
    inventoryPolicy: 'deny',
  };
};

// ── Matching variants after an option change ──────────────
type Matchable = { id: string; title: string; selectedOptions: { value: string }[] };
/** Keys an existing variant is findable by: full title, each option value, each ordered pair of option values. (VariantsCard/utils.ts:98-143) */
const variantKeys = (v: Matchable): string[] => {
  const opts = v.selectedOptions.map((o) => o.value).filter(Boolean);
  const keys = [v.title || opts.join(' / '), ...opts];
  for (let i = 0; i < opts.length; i++) for (let j = i + 1; j < opts.length; j++) keys.push(`${opts[i]} / ${opts[j]}`);
  return keys;
};
/**
 * For each newly generated title, the existing variant whose id (and prices) it keeps, or undefined.
 * Order as today: exact title → a key that contains the title (option added) → the title contains a key (option removed)
 * → a pair of its option values → a single option value. An id is assigned at most once. (VariantsCard/utils.ts:259-395)
 */
export const matchExistingVariants = <V extends Matchable>(titles: string[], existing: V[]): (V | undefined)[] => {
  const map = new Map<string, V>();
  for (const v of existing) for (const k of variantKeys(v)) map.set(k, v);
  const keys = [...map.keys()];
  const used = new Set<string>();
  return titles.map((title) => {
    const parts = title.split(' / ');
    let hit =
      map.get(title) ??
      keys
        .filter((k) => k.includes(title))
        .map((k) => map.get(k))
        .find(Boolean) ??
      keys
        .filter((k) => title.includes(k))
        .map((k) => map.get(k))
        .find(Boolean);
    if (!hit && parts.length >= 2) {
      outer: for (let i = 0; i < parts.length - 1; i++)
        for (let j = i + 1; j < parts.length; j++) {
          hit = map.get(`${parts[i]} / ${parts[j]}`);
          if (hit) break outer;
        }
    }
    if (!hit) hit = parts.map((p) => map.get(p)).find(Boolean);
    if (!hit || used.has(hit.id)) return undefined;
    used.add(hit.id);
    return hit;
  });
};

// ── Tags ──────────────────────────────────────────────────
/** Tags are joined and split on ", " on the wire. (products.request.transformer.ts:93) */
export const tagsJoin = (tags: string[]): string => tags.join(', ');
export const tagsSplit = (wire: string | null | undefined): string[] =>
  (wire ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

// ── Validation ────────────────────────────────────────────
export interface ProductDraftForValidation {
  title: string;
  tags?: string[];
  options?: { name: string; values: string[] }[];
  variants?: { price?: Money | string }[];
  images?: { url?: string }[];
}
/**
 * Title required; each option at least one value; each variant needs a price; each image needs a source; tags ≤ 50 chars; SKU optional.
 * Returns field path → message, empty when valid. (ProductForm.tsx:90, :125, :140, :149, :213)
 */
export const productValidation = (d: ProductDraftForValidation): Record<string, string> => {
  const e: Record<string, string> = {};
  if (!d.title?.trim()) e.title = 'Title is required';
  d.tags?.forEach((t, i) => {
    if (t.length > 50) e[`tags.${i}`] = 'Tags are limited to 50 characters';
  });
  d.options?.forEach((o, i) => {
    if (o.values.length < 1) e[`options.${i}.values`] = 'Select atleast 1 value for each variant option';
  });
  d.variants?.forEach((v, i) => {
    if (v.price === undefined || v.price === '') e[`variants.${i}.price`] = 'Price is required';
  });
  d.images?.forEach((img, i) => {
    if (!img.url) e[`images.${i}.url`] = 'Image URL is required';
  });
  return e;
};
