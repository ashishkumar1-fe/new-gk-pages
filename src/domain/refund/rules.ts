import type { Refund } from './schema';
import { money, type Money } from '@/domain/shared/money';

// Pure rules, ported as today. Each cites the gk-pages source it came from (docs/architecture/domain/orders.md#refund).
// Unused-type guard for entities whose rules take narrower inputs:
export type { Refund as _Refund };

/** modules/refunds/utils.ts:24 */
export const isSettled = (r: Pick<Refund, 'status'>) => r.status === 'success' || r.status === 'failed';

/**
 * What the order page shows under the total: money already back with the customer (success) and money on its way
 * (pending / processing). Failed refunds count in neither. modules/refunds/utils.ts:24 (summarizeCustomerRefunds)
 */
export const summarizeRefunds = (
  refunds: Pick<Refund, 'status' | 'amounts'>[],
  currency = 'INR',
): { refunded: Money; inProgress: Money } => {
  let refunded = 0;
  let inProgress = 0;
  for (const r of refunds) {
    const amount = r.amounts.total.minor || 0;
    if (r.status === 'success') refunded += amount;
    else if (r.status === 'pending' || r.status === 'processing') inProgress += amount;
  }
  return { refunded: money(refunded, currency), inProgress: money(inProgress, currency) };
};
