import type { DraftOrder } from './schema';

// Pure rules, ported as today. Each cites the gk-pages source it came from (docs/architecture/domain/orders.md#draft-order).
// Unused-type guard for entities whose rules take narrower inputs:
export type { DraftOrder as _DraftOrder };

/** modules/draft-order; status alone is not enough */
export const hasLiveInvoice = (d: Pick<DraftOrder, 'invoiceUrl'>) => Boolean(d.invoiceUrl);

/** components/orders/DraftOrder.tsx */
export const canComplete = (d: Pick<DraftOrder, 'status' | 'lineItems'>) => d.status !== 'completed' && d.lineItems.length > 0;

// ---- Validation (form values are the strings the merchant typed) ----

type Errors<K extends string> = Partial<Record<K, string>>;

/** Upper bound on a line's quantity. library/utilities/constants/constants.ts:129 */
export const QUANTITY_MAX_VALUE = 1_000_000;
export const QUANTITY_MAX_MESSAGE = 'Quantity must be less than or equal to 1,000,000';

/** A line quantity above 1,000,000 is flagged. components/orders/ProductSection.tsx:1003 */
export const lineQuantityError = (quantity: number): string | undefined =>
  quantity <= QUANTITY_MAX_VALUE ? undefined : QUANTITY_MAX_MESSAGE;

/**
 * Custom item: name required (trimmed); price required and > 0; quantity required and at least 1. The custom item
 * form itself does not apply the 1,000,000 cap (that is lineQuantityError, on the added line).
 * components/orders/DraftOrder.tsx:1127 (isFormValid), :1146; components/orders/orderHelperFunctions.ts:633 (validateForm);
 * messages components/orders/ProductSection.tsx:774, :793, :843
 */
export const customItemErrors = (i: { name: string; price: string; quantity: string }): Errors<'name' | 'price' | 'quantity'> => {
  const e: Errors<'name' | 'price' | 'quantity'> = {};
  if (!i.name.trim()) e.name = 'Item name is required';
  if (!i.price.trim() || Number(i.price) <= 0) e.price = 'Price must be greater than ₹0';
  if (!i.quantity.trim() || Number(i.quantity) < 1) e.quantity = 'Quantity must be at least 1';
  return e;
};

type NewCustomerField = 'firstName' | 'lastName' | 'email' | 'phone' | 'address1' | 'city' | 'state' | 'pinCode';

/**
 * New customer: every field required; email shaped like a@b.c; phone 10–15 digits and PIN 6 digits after
 * stripping non-digits. components/orders/CreateCustomerModal.tsx:73
 */
export const newCustomerErrors = (c: Record<NewCustomerField, string>): Errors<NewCustomerField> => {
  const e: Errors<NewCustomerField> = {};
  if (!c.firstName.trim()) e.firstName = 'First name is required';
  if (!c.lastName.trim()) e.lastName = 'Last name is required';
  if (!c.email.trim()) e.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) e.email = 'Please enter a valid email address';
  if (!c.phone.trim()) e.phone = 'Phone number is required';
  else if (!/^\d{10,15}$/.test(c.phone.replace(/\D/g, ''))) e.phone = 'Please enter a valid phone number (10-15 digits)';
  if (!c.address1.trim()) e.address1 = 'Address is required';
  if (!c.city.trim()) e.city = 'City is required';
  if (!c.state.trim()) e.state = 'State is required';
  if (!c.pinCode.trim()) e.pinCode = 'PIN code is required';
  else if (!/^\d{6}$/.test(c.pinCode.replace(/\D/g, ''))) e.pinCode = 'Please enter a valid PIN code';
  return e;
};

type ShippingAddressField = 'firstName' | 'lastName' | 'line1' | 'city' | 'state' | 'postalCode' | 'phone';

const LETTERS_ONLY = /^[A-Za-z\s]+$/;

/**
 * Shipping address modal: names and city required and letters / spaces only; address required, at most 255
 * characters; state required; PIN 6 digits and phone 10 digits after stripping non-digits. All values trimmed.
 * components/orders/EditShippingAddressModal.tsx:113 (validateForm)
 */
export const shippingAddressErrors = (a: Partial<Record<ShippingAddressField, string | null>>): Errors<ShippingAddressField> => {
  const v = (k: ShippingAddressField) => String(a[k] || '').trim();
  const e: Errors<ShippingAddressField> = {};
  const firstName = v('firstName'),
    lastName = v('lastName'),
    line1 = v('line1'),
    city = v('city'),
    state = v('state'),
    postalCode = v('postalCode'),
    phone = v('phone');
  if (!firstName) e.firstName = 'First name is required';
  else if (!LETTERS_ONLY.test(firstName)) e.firstName = 'First name should contain only alphabets';
  if (!lastName) e.lastName = 'Last name is required';
  else if (!LETTERS_ONLY.test(lastName)) e.lastName = 'Last name should contain only alphabets';
  if (!line1) e.line1 = 'Address is required';
  else if (line1.length > 255) e.line1 = 'Address should not exceed 255 characters';
  if (!city) e.city = 'City is required';
  else if (!LETTERS_ONLY.test(city)) e.city = 'City should contain only alphabets';
  if (!state) e.state = 'State is required';
  if (!postalCode) e.postalCode = 'PIN code is required';
  else if (!/^\d{6}$/.test(postalCode.replace(/\D/g, ''))) e.postalCode = 'Please enter a valid 6-digit PIN code';
  if (!phone) e.phone = 'Phone number is required';
  else if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) e.phone = 'Please enter a valid 10-digit phone number';
  return e;
};

/** The draft-order form rules, grouped (docs/architecture/domain/orders.md `draftValidation`). */
export const draftValidation = {
  customItem: customItemErrors,
  lineQuantity: lineQuantityError,
  newCustomer: newCustomerErrors,
  shippingAddress: shippingAddressErrors,
} as const;
