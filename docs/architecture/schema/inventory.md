# Inventory

[← Schema](README.md)

Service: inventory service (`/v1/admin/inventory`, `/warehouses`, `/locations`, `/purchase-orders`, `/transfers`, `/suppliers`). snake_case.

## Location

The backend calls it a warehouse; each warehouse has a location (address).

```ts
interface Location extends Entity {
  name: string;
  address: Address;                // location.address_1, pincode, state …
  phone?: string;
  coordinates?: { lat: number; lng: number };
  active: boolean;
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

HSN, country of origin and weight live on the product/variant in this backend (see [catalog.md](catalog.md)), not on the inventory item.

## Stock at a location

```ts
interface InventoryLevel {
  inventoryItemId: Id;
  locationId: Id;
  available: number;
  committed: number;               // tied to orders; read-only
  onHand: number;
  unavailable: {
    damaged: number;
    qualityControl: number;
    safetyStock: number;
    other: number;
  };
  incoming: {
    total: number;
    purchaseOrders: Id[];
    transfers: Id[];
  };
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

`onHand = available + committed + unavailable total`. No `reserved` state; the current UI's "Reserved" writes to `safetyStock`.

## Editing stock

Same as today: stock is set as absolute values per location through `bulk-edit` (and `bulk-edit/multi-warehouse` from the product editor). Moving units to unavailable follows today's mapping (Damaged, Quality control, Reserved → safety stock, Other).

The backend also has `adjust-quantities`, `move-quantities` and `adjustments` (history) endpoints that nothing uses yet. Switching to them changes inventory behaviour, so it is a product decision. Until then there is no adjustment history. See [deferred.md](deferred.md).

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
