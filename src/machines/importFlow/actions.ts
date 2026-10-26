import type { ImportPreview } from '@/domain/job/schema';

/** Row errors or missing columns make a preview invalid even if the server's flag says otherwise. */
export const previewIsValid = (p: ImportPreview) => p.isValid && p.errors.length === 0 && p.missingRequiredFields.length === 0;
