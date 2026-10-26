import { z } from 'zod';
import { EntitySchema } from '@/domain/shared/entity';

/** What the app means by a job. Fields from docs/architecture/resources/registry.md (job); wire shapes live in api/. Verify against a real sandbox response before freezing. */
export const JobSchema = EntitySchema.extend({
  action: z.enum(['IMPORT', 'EXPORT']),
  status: z.string(),
  entity: z.string().optional(),
  totalRows: z.number().int().optional(),
  completedRows: z.number().int().optional(),
  resultFileUrl: z.string().optional(),
  errorMessage: z.string().optional(),
});
export type Job = z.infer<typeof JobSchema>;
export const JobListItemSchema = JobSchema;
export type JobListItem = Job;
export const JobInputSchema = JobSchema.partial().extend({ id: z.string().optional() });
export type JobInput = z.infer<typeof JobInputSchema>;

/** Import and export run on bulk-ops for products and orders. Import uses the singular entity, export the plural (gateway/bulk-ops.md). */
export const BulkEntity = z.enum(['product', 'order']);
export type BulkEntity = z.infer<typeof BulkEntity>;

export interface ImportPreview {
  jobId: string;
  isValid: boolean;
  totalRows: number;
  fileName: string;
  missingRequiredFields: string[];
  extraFields: string[];
  errors: string[];
  warnings: string[];
  estimatedTime?: string;
}
export interface ExportPreview {
  jobId: string;
  estimatedTime?: string;
  fileFormat: 'csv' | 'xlsx';
}
export interface JobProgress {
  jobId: string;
  status: string;
  totalRows?: number;
  completedRows?: number;
  percent?: number;
  isCompleted: boolean;
}

export const ExportInput = z.object({
  entity: BulkEntity,
  groups: z.record(z.array(z.string())).default({}), // group name → included column names; empty = template defaults
  dateRange: z.object({ from: z.string().optional(), to: z.string().optional() }).optional(),
  format: z.enum(['csv', 'xlsx']).default('csv'),
});
export type ExportInput = z.infer<typeof ExportInput>;
