import { z } from 'zod';

export type Id = string; // opaque; never parse or build ids in the UI
export type Handle = string; // URL-safe slug
export const DateTime = z.string(); // ISO 8601, UTC
export type DateTime = string;

export const EntitySchema = z.object({ id: z.string(), createdAt: DateTime, updatedAt: DateTime });
export type Entity = z.infer<typeof EntitySchema>;

export interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
}

/** "2026-10-14": a calendar day with no time zone. */
export const DateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export type DateOnly = string;

/** ISO 4217; INR in v1 (no wire field carries a currency). */
export type CurrencyCode = 'INR' | string;

export const AddressSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  company: z.string().optional(),
  address1: z.string(),
  address2: z.string().optional(),
  city: z.string(),
  province: z.string().optional(),
  provinceCode: z.string().optional(), // state; "MH"
  zip: z.string(), // pincode
  country: z.string(),
  countryCode: z.string(), // "IN"
  phone: z.string().optional(),
});
export type Address = z.infer<typeof AddressSchema>;

export const ImageSchema = z.object({
  id: z.string(),
  url: z.string(),
  altText: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});
export type Image = z.infer<typeof ImageSchema>;

export const WeightUnit = z.enum(['g', 'kg', 'lb', 'oz']);
export type WeightUnit = z.infer<typeof WeightUnit>;
export const WeightSchema = z.object({ value: z.number(), unit: WeightUnit });
export type Weight = z.infer<typeof WeightSchema>;
