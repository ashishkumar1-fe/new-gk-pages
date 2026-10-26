import { z } from 'zod';
/** What the discount service actually sends. Build each schema from a recorded sandbox response in fixtures/. See docs/architecture/gateway/discount.md */
export const Envelope = z.object({}).passthrough();
