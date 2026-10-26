import { z } from 'zod';

/** What the bulk-ops service sends (docs/architecture/gateway/bulk-ops.md). camelCase; preview has PascalCase keys. */
const ExportGroup = z.object({
  name: z.string(),
  include: z.boolean(),
  columns: z.array(z.object({ name: z.string(), group: z.string(), include: z.boolean() })),
});
export const WireExportEntity = z.object({
  entityType: z.string(),
  configuration: z.object({ groups: z.record(ExportGroup) }),
  filters: z
    .object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      productType: z.string().optional(),
      tags: z.string().optional(),
    })
    .optional(),
});
export type WireExportEntity = z.infer<typeof WireExportEntity>;

export const WireExportTemplate = z.object({
  success: z.boolean().optional(),
  entityTypes: z.array(z.string()),
  template: z.object({ entities: z.array(WireExportEntity) }),
});
export const WireExportPreview = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  jobId: z.string(),
  estimatedTime: z.string().nullable().optional(),
  fileFormat: z.enum(['csv', 'xlsx']).optional(),
});
export const WireExportProcess = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  jobId: z.string(),
  status: z.string().optional(),
});

export const WireImportPreview = z
  .object({
    success: z.boolean(),
    isValid: z.boolean(),
    fileInfo: z.object({ fileName: z.string(), totalRows: z.number() }).passthrough(),
    Estimation: z.object({ estimatedInsertTime: z.string() }).partial().optional(),
    validation: z.object({ missingRequiredFields: z.array(z.string()), extraFields: z.array(z.string()) }),
    errors: z.array(z.string()),
    warnings: z.array(z.string()),
    jobId: z.string(),
  })
  .passthrough();
export const WireImportProcess = z.object({ success: z.boolean().optional(), message: z.string().optional(), jobId: z.string() });

export const WireJobProgress = z.object({
  jobId: z.string(),
  status: z.string(),
  totalRows: z.number().nullable(),
  completedRows: z.number().nullable(),
  progressPercentage: z.number().nullable(),
  isCompleted: z.boolean(),
});
export const WireCancel = z.object({ message: z.string().optional(), jobId: z.string(), status: z.string() });
