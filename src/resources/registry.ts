import type { AnyResource } from './define';
import { product } from './product';
import { order } from './order';
import { draftOrder } from './draftOrder';
import { collection } from './collection';
import { inventory } from './inventory';
import { location } from './location';
import { purchaseOrder } from './purchaseOrder';
import { transfer } from './transfer';
import { customer } from './customer';
import { segment } from './segment';
import { discount } from './discount';
import { discountSet } from './discountSet';
/* plop:imports */

/** Every resource in the admin, in nav order. Routes, sidebar, ⌘K and assistant read tools are generated from this list. */
export const resources: AnyResource[] = [
  product,
  order,
  draftOrder,
  collection,
  inventory,
  location,
  purchaseOrder,
  transfer,
  customer,
  segment,
  discount,
  discountSet,
  /* plop:resources */
];

export const resourceByName = (name: string) => resources.find((r) => r.name === name);
