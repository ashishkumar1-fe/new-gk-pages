import { z } from 'zod';
/** What the dashboard service actually sends. Build each schema from a recorded sandbox response in fixtures/. See docs/architecture/gateway/dashboard.md */
export const Envelope = z.object({}).passthrough();
