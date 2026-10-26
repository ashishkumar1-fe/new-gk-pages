/** The api modules, injected into commands as deps.api so tests can swap them. One module per backend service. */
import * as product from './item/product.client';
import * as collection from './item/collection.client';
import * as dashboard from './dashboard/client';
import * as osOrder from './os-order/client';
import * as inventory from './inventory/client';
import * as osCustomer from './os-customer/client';
import * as discount from './discount/client';
import * as bulkOps from './bulk-ops/client';
import * as mediaApps from './media-apps/client';

export const api = {
  item: { ...product, ...collection },
  dashboard: { ...dashboard },
  osOrder: { ...osOrder },
  inventory: { ...inventory },
  osCustomer: { ...osCustomer },
  discount: { ...discount },
  bulkOps: { ...bulkOps },
  mediaApps: { ...mediaApps },
}; // plain objects so tests can spy on any endpoint function
export type ApiModules = typeof api;
