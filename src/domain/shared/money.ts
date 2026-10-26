import { z } from 'zod';

/** Money is never a float, never a string: integer minor units (paise) plus a currency. */
export const MoneySchema = z.object({ minor: z.number().int(), currency: z.string().default('INR') });
export type Money = z.infer<typeof MoneySchema>;

export const money = (minor: number, currency = 'INR'): Money => ({ minor: Math.round(minor), currency });
export const fromRupees = (rupees: number): Money => money(rupees * 100);
export const toRupees = (m: Money): number => m.minor / 100;
export const add = (a: Money, b: Money): Money => money(a.minor + b.minor, a.currency);
export const subtract = (a: Money, b: Money): Money => money(a.minor - b.minor, a.currency);
export const multiply = (m: Money, qty: number): Money => money(m.minor * qty, m.currency);
export const isZero = (m: Money) => m.minor === 0;
