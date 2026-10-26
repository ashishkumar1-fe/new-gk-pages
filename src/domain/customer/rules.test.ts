import { describe, it, expect } from 'vitest';
import {
  customerValidation,
  customerSearch,
  isValidIndianPhone,
  customerFormDefaults,
  customerReadDefaults,
  CUSTOMER_SEARCH_FIELDS,
} from './rules';
import { CustomerSchema } from './schema';

const valid = {
  firstName: 'Asha',
  lastName: 'Rao Kumar',
  email: 'asha@example.com',
  countryCode: '+91',
  phone: '9876543210',
  taxSetting: 'COLLECT_TAX',
};

describe('isValidIndianPhone (customerSchema.ts:28)', () => {
  it('accepts 10 digits starting 6-9', () => {
    expect(isValidIndianPhone('6000000000')).toBe(true);
    expect(isValidIndianPhone('9876543210')).toBe(true);
  });
  it('rejects 5-start, 9 or 11 digits, +91 prefix', () => {
    for (const p of ['5876543210', '987654321', '98765432101', '+919876543210']) expect(isValidIndianPhone(p)).toBe(false);
  });
});

describe('customerValidation (customerSchema.ts:6)', () => {
  it('valid input has no errors', () => {
    expect(customerValidation(valid)).toEqual({});
  });
  it('blank form: every required message, verbatim', () => {
    expect(customerValidation({})).toEqual({
      firstName: 'First name is required',
      lastName: 'Last name is required',
      email: 'Email is required',
      countryCode: 'Country code is required',
      phone: 'Phone number is required',
      taxSetting: 'Tax setting is required',
    });
  });
  it('whitespace-only counts as blank (trimmed)', () => {
    expect(customerValidation({ ...valid, firstName: '   ' }).firstName).toBe('First name is required');
  });
  it('names allow only letters and spaces', () => {
    const e = customerValidation({ ...valid, firstName: 'Asha1', lastName: "O'Neil" });
    expect(e.firstName).toBe('First name should only contain letters');
    expect(e.lastName).toBe('Last name should only contain letters');
  });
  it('invalid email', () => {
    expect(customerValidation({ ...valid, email: 'nope' }).email).toBe('Please enter a valid email');
  });
  it('only +91', () => {
    expect(customerValidation({ ...valid, countryCode: '+1' }).countryCode).toBe('Only Indian ISD code (+91) is supported');
  });
  it('invalid phone', () => {
    expect(customerValidation({ ...valid, phone: '12345' }).phone).toBe('Please enter a valid 10-digit Indian mobile number');
  });
  it('notes at most 5000', () => {
    expect(customerValidation({ ...valid, notes: 'a'.repeat(5000) })).toEqual({});
    expect(customerValidation({ ...valid, notes: 'a'.repeat(5001) }).notes).toBe('Notes cannot exceed 5000 characters');
  });
});

describe('known conflicts kept as today', () => {
  it('form defaults DONT_COLLECT_TAX + English [Default] (CreateCustomerForm.tsx:100, customerSchema.ts:17)', () => {
    expect(customerFormDefaults.taxSetting).toBe('DONT_COLLECT_TAX');
    expect(customerFormDefaults.language).toBe('English [Default]');
  });
  it('reader defaults COLLECT_TAX + en (transformer.ts:49, :52)', () => {
    expect(customerReadDefaults).toEqual({ taxSetting: 'COLLECT_TAX', language: 'en' });
  });
});

describe('customerSearch (CustomerHome.tsx:94)', () => {
  it('no filters: no conditions, AND', () => {
    expect(customerSearch({})).toEqual({ conditionLogic: 'AND' });
    expect(customerSearch({ search: '  ' })).toEqual({ conditionLogic: 'AND' });
  });
  it('term only: trimmed contains OR-ed across 8 fields', () => {
    const r = customerSearch({ search: ' asha ' });
    expect(r.conditionLogic).toBe('OR');
    expect(r.conditions).toEqual(CUSTOMER_SEARCH_FIELDS.map((field) => ({ field, operator: 'contains', value: 'asha' })));
    expect(CUSTOMER_SEARCH_FIELDS).toEqual(['email', 'firstName', 'lastName', 'name', 'phone', 'company', 'tags', 'address']);
  });
  it('term + tags: AND-ed (as today, every condition must match)', () => {
    const r = customerSearch({ search: 'asha', tags: ['vip'] });
    expect(r.conditionLogic).toBe('AND');
    expect(r.conditions?.at(-1)).toEqual({ field: 'tags', operator: 'contains_any', value: ['vip'] });
    expect(r.conditions).toHaveLength(9);
  });
  it('emailSubscribed false still counts as a filter', () => {
    expect(customerSearch({ emailSubscribed: false })).toEqual({
      conditions: [{ field: 'hasEmailSubscription', operator: 'equals', value: false }],
      conditionLogic: 'AND',
    });
    expect(customerSearch({ search: 'x', emailSubscribed: true }).conditionLogic).toBe('AND');
  });
});

describe('CustomerSchema optional fields', () => {
  it('accepts emailDomain, defaultAddress, anniversaryDate and extended stats', () => {
    const c = {
      id: '1',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      status: 'active',
      isDeleted: false,
      tags: [],
      language: 'en',
      taxSetting: 'COLLECT_TAX',
      marketing: { email: false, sms: false, push: false },
      emailDomain: 'example.com',
      anniversaryDate: '2026-10-14',
      defaultAddress: { address1: '1 MG Rd', city: 'Pune', zip: '411001', country: 'India', countryCode: 'IN' },
      stats: {
        ordersCount: 0,
        amountSpent: { minor: 0, currency: 'INR' },
        averageOrderValue: { minor: 0, currency: 'INR' },
        firstOrderAt: '2026-01-01T00:00:00Z',
        abandonedCheckoutAt: '2026-01-02T00:00:00Z',
      },
    };
    expect(CustomerSchema.safeParse(c).success).toBe(true);
    expect(CustomerSchema.safeParse({ ...c, anniversaryDate: '14/10/2026' }).success).toBe(false);
  });
});
