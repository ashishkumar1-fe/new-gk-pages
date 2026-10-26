import { z } from 'zod';
/** What the os-order service actually sends. Build each schema from a recorded sandbox response in fixtures/. See docs/architecture/gateway/os-order.md */
export const Envelope = z.object({}).passthrough();
