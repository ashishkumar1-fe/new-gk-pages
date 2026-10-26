import type { z } from 'zod';
import type { ExportInput, ExportPreview, ImportPreview, JobProgress } from '@/domain/job/schema';
import type { WireExportEntity, WireExportPreview, WireImportPreview, WireJobProgress } from './wire';

/** Transform once into a new object; nothing above mutates it (ADR 0003). */
export const toImportPreview = (w: z.infer<typeof WireImportPreview>): ImportPreview => ({
  jobId: w.jobId,
  isValid: w.isValid,
  totalRows: w.fileInfo.totalRows,
  fileName: w.fileInfo.fileName,
  missingRequiredFields: w.validation.missingRequiredFields,
  extraFields: w.validation.extraFields,
  errors: w.errors,
  warnings: w.warnings,
  estimatedTime: w.Estimation?.estimatedInsertTime,
});
export const toExportPreview = (w: z.infer<typeof WireExportPreview>, fallback: 'csv' | 'xlsx'): ExportPreview => ({
  jobId: w.jobId,
  estimatedTime: w.estimatedTime ?? undefined,
  fileFormat: w.fileFormat ?? fallback,
});
export const toJobProgress = (w: z.infer<typeof WireJobProgress>): JobProgress => ({
  jobId: w.jobId,
  status: w.status.toLowerCase(),
  totalRows: w.totalRows ?? undefined,
  completedRows: w.completedRows ?? undefined,
  percent: w.progressPercentage ?? undefined,
  isCompleted: w.isCompleted,
});

/**
 * Export input → the template entity with columns switched on or off. Empty `groups` keeps the template's defaults.
 * A group is included when any of its columns is (as today's client does).
 */
export const toExportEntity = (template: WireExportEntity, i: ExportInput): WireExportEntity => {
  const picked = Object.keys(i.groups).length > 0;
  const groups = Object.fromEntries(
    Object.entries(template.configuration.groups).map(([key, g]) => {
      const columns = g.columns.map((c) => ({ ...c, include: picked ? (i.groups[key] ?? []).includes(c.name) : c.include }));
      return [key, { ...g, columns, include: columns.some((c) => c.include) }];
    }),
  );
  const filters = i.dateRange?.from || i.dateRange?.to ? { dateFrom: i.dateRange.from, dateTo: i.dateRange.to } : undefined;
  return { entityType: template.entityType, configuration: { groups }, ...(filters ? { filters } : {}) };
};
