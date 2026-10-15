# Inventory

[← Schema](README.md)

Service: inventory service (`/v3/admin/inventory`, `/v3/admin/locations`; v1 for `/inventory/import`, `/inventory/export-csv`, `/purchase-orders`, `/transfers`, `/suppliers`). snake_case.

## Location

v3 locations (`/v3/admin/locations`, ids `iloc_*`); legacy screens still call them warehouses. The list returns inactive locations too; pickers show active ones.

```ts
interface Location extends Entity {
  name: string;
  address: Address;                // address_line_1/2, city, state, state_code, zip, country
  phone?: string;
  active: boolean;
  isDefault: boolean;
  fulfillsOnlineOrders: boolean;
  inventorySource: 'ratio' | 'shopify' | 'oms';
  gstin?: string;
}
```

## Inventory item

One row per variant (SKU).

```ts
interface InventoryItem {
  id: Id;
  variantId: Id;
  productId: Id;
  sku?: string;
  tracked: boolean;
  requiresShipping: boolean;
  cost?: Money;
  lowStockThreshold?: number;
}
```

The v3 inventory item also carries HSN, HS code, country of origin and cost (paise); today's UI edits HSN and origin on the product/variant only (see [catalog.md](catalog.md)). Weight is product/variant only.

## Stock at a location

```ts
interface InventoryLevel {
  inventoryItemId: Id;
  locationId: Id;
  available: number;
  committed: number;               // tied to orders; read-only
  onHand: number;
  unavailable: {
    reserved: number;
    damaged: number;
    qualityControl: number;
    safetyStock: number;
  };
  incoming: number;                // v3 gives a total only; no PO / transfer ids
  updatedAt: DateTime;
}
```

## Inventory row

What the inventory list returns: one row per variant per location, combining the item and its level.

```ts
interface InventoryRow extends InventoryLevel {
  id: Id;                          // row id used by bulk-edit
  inventoryItemId: Id;
  variantId: Id;
  productId: Id;
  sku?: string;
  title: string;                   // product / variant title
  imageUrl?: string;
  cost?: Money;
  tracked: boolean;
  options: { name: string; value: string }[];   // option1..3
}
```

`onHand = available + committed + reserved + damaged + safetyStock + qualityControl` (incoming excluded; server-derived).

## Editing stock

Same as today, through v3 ([deferred.md](deferred.md)):

| Endpoint | Kind | Used by |
|---|---|---|
| `set-on-hand`, `set-quantities` | absolute, with `compare_quantity` | inventory list, bulk edit, variant page |
| `adjust-quantities` | delta | adjust popover |
| `move-quantities`, `bulk-adjust` | — | exist, unused |
| `bulk-edit/multi-warehouse` (v1) | absolute | product editor's variant quantity bulk edit only |

- Every write carries a `reason` (correction, received, damaged, safety_stock_set, import, other) and an optional note.
- Every write is logged, readable through `GET /v3/admin/inventory/adjustments` (today: the variant adjustment history page).

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
interface PurchaseOrder extends Entity {
  referenceNumber?: string;
  supplierId: Id;
  supplier: { id: Id; companyName: string };
  destinationLocationId: Id;
  status: 'draft' | 'ordered' | 'partially_received' | 'received' | 'closed';
  expectedAt?: DateOnly;
  receivedAt?: DateTime;
  paymentTerms?: string;
  supplierCurrency?: CurrencyCode;
  shipping?: { carrier?: string; trackingNumber?: string; trackingUrl?: string };
  noteToSupplier?: string;
  tags: string[];
  lines: {
    id: Id;
    inventoryItemId: Id;
    variantId: Id;
    title: string;
    supplierSku?: string;
    quantityOrdered: number;
    quantityReceived: number;
    quantityRejected: number;
    costPerUnit: Money;
    tax: Money;
  }[];
  totalCost: Money;
}
```

Receiving sends per-line `quantityReceived` and `quantityRejected`.

Backend status values are PascalCase (`Draft`, `Ordered`, `Partially_Received`, `Received`, `Closed`); the transformer maps them to and from the lowercase domain values. Commands take domain values.

## Transfer

```ts
interface Transfer extends Entity {
  referenceNumber?: string;
  originLocationId: Id;
  destinationLocationId: Id;
  status: 'draft' | 'pending' | 'partially_received' | 'received';
  expectedAt?: DateOnly;
  completedAt?: DateTime;
  shipping?: { carrier?: string; trackingNumber?: string; trackingUrl?: string };
  note?: string;
  tags: string[];
  lines: {
    id: Id;
    inventoryItemId: Id;
    variantId: Id;
    title: string;
    quantityOrdered: number;
    quantityReceived: number;
    quantityRejected: number;
  }[];
}
```

Backend status values `Partial` and `Completed` map to `partially_received` and `received`.
