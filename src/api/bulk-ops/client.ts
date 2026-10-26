import { request } from '@/platform/http/client';
import { BULK_OPS } from '@/platform/config';
import { reportDrift } from '@/platform/telemetry';
import { assertSuccess } from '@/api/_shared/errors';
import { notImplemented } from '@/lib/notImplemented';
import type { BulkEntity, ExportInput, ExportPreview, ImportPreview, JobProgress } from '@/domain/job/schema';
import {
  WireCancel,
  WireExportPreview,
  WireExportProcess,
  WireExportTemplate,
  WireImportPreview,
  WireImportProcess,
  WireJobProgress,
} from './wire';
import { toExportEntity, toExportPreview, toImportPreview, toJobProgress } from './transformer';

/** bulk-ops service. docs/architecture/gateway/bulk-ops.md */
const ROOT = `${BULK_OPS}/api/v1/admin/bulk-ops`;
export interface Opts {
  signal?: AbortSignal;
}
export interface Requester {
  email?: string;
  name: string;
  storeId: string;
}
const who = (u: Requester) => ({ 'user-email': u.email ?? '', 'user-name': u.name, 'store-id': u.storeId });

const parse = <S extends { safeParse: (b: unknown) => { success: boolean; data?: unknown; error?: { issues: unknown } } }>(
  schema: S,
  body: unknown,
  endpoint: string,
) => {
  const r = schema.safeParse(assertSuccess(body));
  if (!r.success) reportDrift('bulk-ops', endpoint, r.error?.issues);
  return (r.success ? r.data : body) as S extends { parse: (b: unknown) => infer T } ? T : never;
};

/** Export is two calls: the template (column groups), then preview, which creates the job and returns its id. */
export async function previewExport(i: ExportInput, u: Requester, { signal }: Opts = {}): Promise<ExportPreview> {
  const plural = `${i.entity}s`;
  const t = parse(
    WireExportTemplate,
    (await request(`${ROOT}/export/template/${plural}`, { signal })).body,
    'GET /export/template/:entityTypes',
  );
  const template = t.template.entities.find((e) => e.entityType === plural) ?? { entityType: plural, configuration: { groups: {} } };
  const { body } = await request(`${ROOT}/export/preview`, {
    method: 'POST',
    params: who(u),
    body: { entities: [toExportEntity(template, i)], fileFormat: i.format },
    signal,
  });
  return toExportPreview(parse(WireExportPreview, body, 'POST /export/preview'), i.format);
}
export async function processExport(jobId: string, { signal }: Opts = {}): Promise<{ jobId: string }> {
  const { body } = await request(`${ROOT}/export/process/${jobId}`, { method: 'POST', signal });
  return { jobId: parse(WireExportProcess, body, 'POST /export/process/:jobId').jobId };
}

/** Import preview is multipart, so it skips the JSON client body and sends FormData through the same request(). */
export async function previewImport(entity: BulkEntity, file: File, u: Requester, { signal }: Opts = {}): Promise<ImportPreview> {
  const form = new FormData();
  form.append('file', file);
  form.append('entityType', entity);
  const { body } = await request(`${ROOT}/preview/import`, { method: 'POST', params: who(u), formData: form, signal });
  return toImportPreview(parse(WireImportPreview, body, 'POST /preview/import'));
}
export async function processImport(jobId: string, { signal }: Opts = {}): Promise<{ jobId: string }> {
  const { body } = await request(`${ROOT}/import/${jobId}`, { method: 'POST', signal });
  return { jobId: parse(WireImportProcess, body, 'POST /import/:jobId').jobId };
}

export async function getJobProgress(jobId: string, { signal }: Opts = {}): Promise<JobProgress> {
  const { body } = await request(`${ROOT}/job/${jobId}/progress`, { signal });
  return toJobProgress(parse(WireJobProgress, body, 'GET /job/:jobId/progress'));
}
export async function cancelJob(jobId: string, { signal }: Opts = {}): Promise<{ jobId: string; status: string }> {
  const { body } = await request(`${ROOT}/job/${jobId}/cancel`, { method: 'POST', signal });
  const w = parse(WireCancel, body, 'POST /job/:jobId/cancel');
  return { jobId: w.jobId, status: w.status.toLowerCase() };
}

export const getExportTemplate = (..._args: unknown[]) =>
  notImplemented('bulk-ops GET /export/template/:entity (used inside previewExport)');
export const getSampleUrl = (..._args: unknown[]) => notImplemented('bulk-ops GET /s3/sample-url?pathType=');
export const listJobs = (..._args: unknown[]) => notImplemented('bulk-ops GET /job');
