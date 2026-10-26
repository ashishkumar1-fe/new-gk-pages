import { z } from 'zod';
/** What the inventory service actually sends. Build each schema from a recorded sandbox response in fixtures/. See docs/architecture/gateway/inventory.md */
export const Envelope = z.object({}).passthrough();
