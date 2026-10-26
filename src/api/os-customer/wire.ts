import { z } from 'zod';
/** What the os-customer service actually sends. Build each schema from a recorded sandbox response in fixtures/. See docs/architecture/gateway/os-customer.md */
export const Envelope = z.object({}).passthrough();
