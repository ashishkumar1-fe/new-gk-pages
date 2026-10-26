import type { Money } from './money';

const inr = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const formatMoney = (m: Money | undefined): string => (m ? `₹${inr.format(m.minor / 100)}` : '—');
export const formatDate = (iso: string | undefined): string =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '—';
