import { describe, it, expect } from 'vitest';
import {
  hasLiveInvoice,
  canComplete,
  customItemErrors,
  lineQuantityError,
  newCustomerErrors,
  shippingAddressErrors,
  draftValidation,
} from './rules';

describe('draftOrder rules', () => {
  it('hasLiveInvoice: invoiceUrl set, status alone is not enough', () => {
    expect(hasLiveInvoice({ invoiceUrl: 'https://pay.example/x' })).toBe(true);
    expect(hasLiveInvoice({})).toBe(false);
  });
  it('canComplete: not completed and has lines', () => {
    expect(canComplete({ status: 'open', lineItems: [] })).toBe(false);
    expect(
      canComplete({ status: 'completed', lineItems: [{ id: '1', title: 't', quantity: 1, unitPrice: { minor: 1, currency: 'INR' } }] }),
    ).toBe(false);
  });
});

describe('customItemErrors (DraftOrder.tsx:1127, orderHelperFunctions.ts:633)', () => {
  it('valid item → no errors', () => {
    expect(customItemErrors({ name: 'Gift wrap', price: '49', quantity: '1' })).toEqual({});
  });
  it('messages verbatim', () => {
    expect(customItemErrors({ name: '  ', price: '0', quantity: '0' })).toEqual({
      name: 'Item name is required',
      price: 'Price must be greater than ₹0',
      quantity: 'Quantity must be at least 1',
    });
    expect(customItemErrors({ name: 'x', price: '', quantity: '' })).toEqual({
      price: 'Price must be greater than ₹0',
      quantity: 'Quantity must be at least 1',
    });
  });
});

describe('lineQuantityError (ProductSection.tsx:1003)', () => {
  it('caps at 1,000,000', () => {
    expect(lineQuantityError(1_000_000)).toBeUndefined();
    expect(lineQuantityError(1_000_001)).toBe('Quantity must be less than or equal to 1,000,000');
  });
});

describe('newCustomerErrors (CreateCustomerModal.tsx:73)', () => {
  const ok = {
    firstName: 'Asha',
    lastName: 'Rao',
    email: 'a@b.co',
    phone: '+91 98765 43210',
    address1: '1 MG Road',
    city: 'Pune',
    state: 'MH',
    pinCode: '411001',
  };
  it('valid → no errors', () => {
    expect(newCustomerErrors(ok)).toEqual({});
  });
  it('required messages', () => {
    expect(
      newCustomerErrors({ firstName: '', lastName: '', email: '', phone: '', address1: '', city: '', state: '', pinCode: '' }),
    ).toEqual({
      firstName: 'First name is required',
      lastName: 'Last name is required',
      email: 'Email is required',
      phone: 'Phone number is required',
      address1: 'Address is required',
      city: 'City is required',
      state: 'State is required',
      pinCode: 'PIN code is required',
    });
  });
  it('format messages: email, phone 10–15 digits, PIN 6 digits', () => {
    expect(newCustomerErrors({ ...ok, email: 'nope', phone: '12345', pinCode: '4110' })).toEqual({
      email: 'Please enter a valid email address',
      phone: 'Please enter a valid phone number (10-15 digits)',
      pinCode: 'Please enter a valid PIN code',
    });
    expect(newCustomerErrors({ ...ok, phone: '1234567890123456' }).phone).toBe('Please enter a valid phone number (10-15 digits)');
  });
});

describe('shippingAddressErrors (EditShippingAddressModal.tsx:113)', () => {
  const ok = {
    firstName: 'Asha',
    lastName: 'Rao',
    line1: '1 MG Road',
    city: 'Navi Mumbai',
    state: 'MH',
    postalCode: '400703',
    phone: '9876543210',
  };
  it('valid → no errors', () => {
    expect(shippingAddressErrors(ok)).toEqual({});
  });
  it('required messages', () => {
    expect(shippingAddressErrors({})).toEqual({
      firstName: 'First name is required',
      lastName: 'Last name is required',
      line1: 'Address is required',
      city: 'City is required',
      state: 'State is required',
      postalCode: 'PIN code is required',
      phone: 'Phone number is required',
    });
  });
  it('letters-only names and city, 255-char address, 6-digit PIN, 10-digit phone', () => {
    expect(
      shippingAddressErrors({
        ...ok,
        firstName: 'Asha1',
        lastName: "O'Neil",
        city: 'Pune-2',
        line1: 'x'.repeat(256),
        postalCode: '40070',
        phone: '+91 9876543210',
      }),
    ).toEqual({
      firstName: 'First name should contain only alphabets',
      lastName: 'Last name should contain only alphabets',
      city: 'City should contain only alphabets',
      line1: 'Address should not exceed 255 characters',
      postalCode: 'Please enter a valid 6-digit PIN code',
      phone: 'Please enter a valid 10-digit phone number',
    });
  });
  it('is grouped under draftValidation', () => {
    expect(draftValidation.shippingAddress).toBe(shippingAddressErrors);
  });
});
