import { z } from 'zod';
/** What the media-apps service actually sends. Build each schema from a recorded sandbox response in fixtures/. See docs/architecture/gateway/media-apps.md */
export const Envelope = z.object({}).passthrough();
