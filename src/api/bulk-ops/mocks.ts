import { http, HttpResponse, delay } from 'msw';
import template from './fixtures/export-template.products.json';
import importPreview from './fixtures/import-preview.product.json';

/** In-memory bulk-ops: jobs advance one step per progress poll. Same shapes the real service sends (fixtures/). */
const jobs = new Map<string, { status: string; total: number; done: number }>();
let seq = 0;
const reqId = () => ({ 'x-request-id': `bulk${String(++seq).padStart(12, '0')}` });

export const bulkopsHandlers = [
  http.get('*/api/v1/admin/bulk-ops/export/template/:entityTypes', async () => {
    await delay(150);
    return HttpResponse.json(template, { headers: reqId() });
  }),
  http.post('*/api/v1/admin/bulk-ops/export/preview', async ({ request }) => {
    await delay(200);
    const u = new URL(request.url);
    if (!u.searchParams.get('store-id')) return HttpResponse.json({ message: 'store-id is required' }, { status: 400, headers: reqId() });
    const b = (await request.json()) as { fileFormat: 'csv' | 'xlsx' };
    const jobId = `job_export_${++seq}`;
    jobs.set(jobId, { status: 'PENDING', total: 6, done: 0 });
    return HttpResponse.json(
      { success: true, message: 'Preview created', jobId, exportBody: {}, estimatedTime: 'about 1 minute', fileFormat: b.fileFormat },
      { headers: reqId() },
    );
  }),
  http.post('*/api/v1/admin/bulk-ops/export/process/:jobId', async ({ params }) => {
    const j = jobs.get(String(params.jobId));
    if (!j) return HttpResponse.json({ message: 'Job not found' }, { status: 404, headers: reqId() });
    j.status = 'RUNNING';
    return HttpResponse.json(
      {
        success: true,
        message: 'Export started',
        jobId: params.jobId,
        downloadUrl: null,
        status: j.status,
        estimatedTime: 'about 1 minute',
      },
      { headers: reqId() },
    );
  }),
  http.post('*/api/v1/admin/bulk-ops/preview/import', async () => {
    await delay(300);
    jobs.set(importPreview.jobId, { status: 'PENDING', total: importPreview.fileInfo.totalRows, done: 0 });
    return HttpResponse.json(importPreview, { headers: reqId() });
  }),
  http.post('*/api/v1/admin/bulk-ops/import/:jobId', async ({ params }) => {
    const j = jobs.get(String(params.jobId));
    if (!j) return HttpResponse.json({ message: 'Job not found' }, { status: 404, headers: reqId() });
    j.status = 'RUNNING';
    return HttpResponse.json({ success: true, message: 'Import started', jobId: params.jobId }, { headers: reqId() });
  }),
  http.get('*/api/v1/admin/bulk-ops/job/:jobId/progress', async ({ params }) => {
    const j = jobs.get(String(params.jobId));
    if (!j) return HttpResponse.json({ message: 'Job not found' }, { status: 404, headers: reqId() });
    if (j.status === 'RUNNING') {
      j.done = Math.min(j.total, j.done + Math.ceil(j.total / 3));
      if (j.done === j.total) j.status = 'COMPLETED';
    }
    return HttpResponse.json(
      {
        jobId: params.jobId,
        status: j.status,
        totalRows: j.total,
        completedRows: j.done,
        progressPercentage: Math.round((j.done / j.total) * 100),
        isCompleted: j.status === 'COMPLETED',
      },
      { headers: reqId() },
    );
  }),
  http.post('*/api/v1/admin/bulk-ops/job/:jobId/cancel', async ({ params }) => {
    const j = jobs.get(String(params.jobId));
    if (!j) return HttpResponse.json({ message: 'Job not found' }, { status: 404, headers: reqId() });
    j.status = 'CANCELLED';
    return HttpResponse.json({ message: 'Cancelled', jobId: params.jobId, status: j.status }, { headers: reqId() });
  }),
];
