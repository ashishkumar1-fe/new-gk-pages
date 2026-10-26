import { itemHandlers } from '@/api/item/mocks';
import { dashboardHandlers } from '@/api/dashboard/mocks';
import { osorderHandlers } from '@/api/os-order/mocks';
import { inventoryHandlers } from '@/api/inventory/mocks';
import { oscustomerHandlers } from '@/api/os-customer/mocks';
import { discountHandlers } from '@/api/discount/mocks';
import { bulkopsHandlers } from '@/api/bulk-ops/mocks';
import { mediaappsHandlers } from '@/api/media-apps/mocks';
/* plop:imports */

export const handlers = [
  ...itemHandlers,
  ...dashboardHandlers,
  ...osorderHandlers,
  ...inventoryHandlers,
  ...oscustomerHandlers,
  ...discountHandlers,
  ...bulkopsHandlers,
  ...mediaappsHandlers,
  /* plop:handlers */
];
