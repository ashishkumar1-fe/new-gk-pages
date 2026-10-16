# Inventory

[← Domain](README.md) · Wire: [gateway › inventory](../gateway/inventory.md)

## Ids

```ts
type InventoryItemId = Id;   // invi_…
type LocationId = Id;        // iloc_…; v1 warehouse_id is the same id
type LevelId = Id;           // invl_…
```

## Location

Legacy screens call them warehouses.

```ts
interface Location extends Entity {
  id: LocationId;
  name: string;
  address: Address;
  phone?: string;
  active: boolean;
  isDefault: boolean;                // wire optional, default false
  fulfillsOnlineOrders: boolean;
  inventorySource: 'ratio' | 'shopify' | 'oms';
  omsProvider?: string;              // set on create, fixed after
  facilityCode?: string;             // set on create, fixed after
  gstin?: string;
}
```

## Inventory item and level

One item per variant (SKU); one level per item per location.

```ts
interface InventoryItem {
  id: InventoryItemId;
  variantId: Id;
  productId?: Id;
  sku?: string;
  tracked: boolean;
  requiresShipping: boolean;
  cost?: Money;
  hsnCode?: string;
  harmonizedSystemCode?: string;
  countryCodeOfOrigin?: string;
  active: boolean;                   // from deleted_at
}

interface InventoryLevel {
  id: LevelId;
  inventoryItemId: InventoryItemId;
  locationId: LocationId;
  available: number;
  committed: number;                 // order-driven; never set by the admin
  codCommitted: number;
  onHand: number;                    // server value; see onHand rule
  unavailable: { reserved: number; damaged: number; qualityControl: number; safetyStock: number };
  incoming: number;                  // total only; no PO / transfer ids
  reorderPoint?: number;
  version: number;
  updatedAt: DateTime;
}

interface InventoryRow extends InventoryLevel {   // inventory list row
  variantId: Id;
  productId?: Id;
  sku?: string;
  title: string;                     // product name, else SKU
  variantTitle?: string;
  tracked: boolean;
}

type QuantityName = 'available' | 'committed' | 'incoming' | 'reserved' | 'damaged' | 'safetyStock' | 'qualityControl';
type MutableQuantityName = Exclude<QuantityName, 'committed'> | 'onHand';   // what the adjust popover can set

type AdjustReason = 'correction' | 'received' | 'damaged' | 'safetyStockSet' | 'import' | 'other';   // admin writes; history also shows order, return, QC and sync reasons

interface Adjustment {
  id: Id;
  quantityName: QuantityName | 'onHand';
  delta: number;
  before: number;
  after: number;
  reason: string;
  note?: string;
  actorType?: string;
  createdAt: DateTime;
}
```

## Supplier

```ts
interface Supplier extends Entity {
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
}
```

## Purchase order

```ts
type PurchaseOrderStatus = 'draft' | 'ordered' | 'partially_received' | 'received' | 'closed';

interface PurchaseOrder extends Entity {
  referenceNumber?: string;          // empty → auto PO-… number
  supplier: { id: Id; companyName: string };   // wire: string or object
  destinationLocationId: LocationId;
  status: PurchaseOrderStatus;
  expectedAt?: DateOnly;
  receivedAt?: DateTime;
  paymentTerms?: string;
  supplierCurrency?: CurrencyCode;
  shipping?: { carrier?: string; trackingNumber?: string; trackingUrl?: string };
  noteToSupplier?: string;
  tags: string[];
  quantityOrdered: number;
  quantityReceived: number;
  lines: {
    id: Id;
    inventoryItemId: InventoryItemId;
    variantId?: Id;
    productId?: Id;
    title: string;
    sku?: string;
    supplierSku?: string;
    quantityOrdered: number;
    quantityReceived: number;
    quantityRejected: number;
    costPerUnit: Money;
    lineTotal: Money;
    tax: string;                     // rupee decimal string as sent; display only, not in totals
  }[];
  totalCost: Money;
}
```

## Transfer

```ts
type TransferStatus = 'draft' | 'pending' | 'partially_received' | 'received';

interface Transfer extends Entity {
  referenceNumber?: string;
  originLocationId: LocationId;
  destinationLocationId: LocationId;
  status: TransferStatus;
  expectedAt?: DateOnly;
  completedAt?: DateTime;
  shipping?: { carrier?: string; trackingNumber?: string; trackingUrl?: string };
  note?: string;
  tags: string[];
  lines: {
    id: Id;
    inventoryItemId: InventoryItemId;
    variantId?: Id;
    productId?: Id;
    title: string;
    sku?: string;
    quantityOrdered: number;
    quantityReceived: number;
    quantityRejected: number;
  }[];
}
```

## Rules

As today. Source paths are in gk-pages `src/`.

| Rule | What | gk-pages source |
|---|---|---|
| `onHand` | available + committed + reserved + damaged + safetyStock + qualityControl; incoming excluded | `components/inventory/VariantAdjustPopover.tsx:64` |
| `unavailableTotal` | reserved + damaged + safetyStock + qualityControl | `store/inventory/index.ts:161` |
| `bulkEditDerive` | buffer = onHand₀ − available₀; edit available → onHand = value + buffer; edit onHand → available = value − buffer; last touched wins; negatives allowed | `ui/Modals/BulkInventoryEditModal.tsx:36` |
| `bulkEditWrite` | row with available → set-quantities with `compare_quantity`; on-hand only → set-on-hand; reason `correction` | `store/inventory/index.ts:644` |
| `adjustPreview` | add / remove → delta; set → absolute; on-hand add / remove becomes a set-on-hand target | `VariantAdjustPopover.tsx:113` |
| `adjustValidate` | whole number; add / remove > 0; negative targets left to the backend | `VariantAdjustPopover.tsx:125` |
| `activeLocations` | pickers show `active` locations only | `store/inventory/index.ts:282` |
| `receiveRemaining` | ordered − previously received − previously rejected − accept − reject, floor 0 | `pages/purchase-orders/ReceiveInventory.tsx:250` |
| `receiveCaps` | accept ≤ remaining − reject and reject ≤ remaining − accept; changing one clamps the other | `ReceiveInventory.tsx:43` |
| `receivePayload` | PO sends this session's deltas; transfer sends cumulative totals | `ReceiveInventory.tsx:139`, `pages/transfers/ReceiveTransferInventory.tsx:145` |
| `poLineTotal` / `poTotals` | quantity × cost; total = Σ line totals; tax excluded | `components/purchase-orders/PurchaseOrderDetails.tsx:167` |
| `poStatus` | `Draft`, `Ordered`, `Partially_Received`, `Received`, `Closed`; unknown → draft | `store/purchase-orders/index.ts:154` |
| `poActions` | draft: primary Mark as ordered, more edit, delete; ordered / partial: primary Receive, more close; received: primary Receive, more falls back to the draft menu (a gk-pages bug; v1 offers close, needs sign-off); closed: more reopen (→ draft) | `PurchaseOrderDetails.tsx:687`, `:804` |
| `transferStatus` | `Partial` / `Partially_Received` → partially received; `Received` / `Completed` → received | `interfaces/transfers.ts:6` |
| `transferActions` | draft: primary Mark as pending; pending / partial: primary Receive; delete unless received | `components/transfers/TransferDetailsForm.tsx:328`, `:522` |
| `poValidate` | supplier, destination required; reference optional (auto number `PO-…` used when empty); ≥ 1 line; quantity ≥ 1; cost ≥ 0 | `purchase-order-form-components/ValidationSchemas.ts` |
| `transferValidate` | origin ≠ destination; ≥ 1 line; quantity ≥ 1 | `TransferForm/ValidationSchemas.ts:22` |

Known defects, kept as today ([defects](../commands/README.md#defects-in-todays-writes)): PO update sends the header `totalCost` in rupees; close and reopen convert already-paise line costs again (×100). Create and mark as ordered are correct.
