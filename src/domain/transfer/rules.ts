import type { Transfer } from './schema';

// Pure rules, ported as today. Each cites the gk-pages source it came from (docs/architecture/domain/inventory.md#transfer).
// Unused-type guard for entities whose rules take narrower inputs:
export type { Transfer as _Transfer };

/** TransferForm/ValidationSchemas.ts:22 */
export const transferValidate = (t: Pick<Transfer, 'originLocationId' | 'destinationLocationId' | 'lines'>) =>
  t.originLocationId !== t.destinationLocationId && t.lines.length > 0 && t.lines.every((l) => l.quantityOrdered >= 1);

type TransferStatus = Transfer['status'];

const TRANSFER_STATUS: Record<string, TransferStatus> = {
  Draft: 'draft',
  Pending: 'pending',
  Partial: 'partially_received',
  Partially_Received: 'partially_received',
  Received: 'received',
  Completed: 'received',
};

/**
 * interfaces/transfers.ts:6 (status union) and store/transfers/index.ts:14 (missing → Draft).
 * Partial / Partially_Received → partially received; Received / Completed → received.
 * TransferDetailsForm.tsx:532 also treats any status containing "partially" (case-insensitive) as partial. Unknown → draft.
 */
export const transferStatus = (wire: unknown): TransferStatus => {
  if (typeof wire !== 'string' || !wire) return 'draft';
  if (Object.prototype.hasOwnProperty.call(TRANSFER_STATUS, wire)) return TRANSFER_STATUS[wire] as TransferStatus;
  if (wire.toLowerCase().includes('partially')) return 'partially_received';
  return 'draft';
};

export interface TransferActions {
  primary?: string;
  more: string[];
}

/**
 * components/transfers/TransferDetailsForm.tsx:522 / :529 (primary) and :322 (More actions).
 * draft: Mark as pending; more delete. pending / partially received: Receive; more edit, delete.
 * received (incl. Completed): no primary; more edit. Duplicate has no command and is left out.
 */
export const transferActions = (t: Pick<Transfer, 'status'>): TransferActions => {
  switch (t.status) {
    case 'draft':
      return { primary: 'transfer.markPending', more: ['transfer.delete'] };
    case 'pending':
    case 'partially_received':
      return { primary: 'transfer.openReceive', more: ['transfer.update', 'transfer.delete'] };
    case 'received':
      return { more: ['transfer.update'] };
  }
};

export interface TransferDraft {
  originLocationId?: string;
  destinationLocationId?: string;
  lines: { quantityOrdered: number }[];
}

/**
 * components/transfers/TransferForm/ValidationSchemas.ts:22-35 with messages verbatim. Field errors; empty = valid.
 * Same-location error sits on destination (:34).
 */
export const transferValidateErrors = (d: TransferDraft): Record<string, string> => {
  const e: Record<string, string> = {};
  if (!d.originLocationId) e.originLocationId = 'Source warehouse is required';
  if (!d.destinationLocationId) e.destinationLocationId = 'Destination warehouse is required';
  if (d.lines.length < 1) e.lines = 'At least one item is required';
  d.lines.forEach((l, i) => {
    if (!(l.quantityOrdered >= 1)) e[`lines.${i}.quantityOrdered`] = 'Quantity must be at least 1';
  });
  if (Object.keys(e).length === 0 && d.originLocationId === d.destinationLocationId)
    e.destinationLocationId = 'Source and destination warehouses cannot be the same';
  return e;
};
