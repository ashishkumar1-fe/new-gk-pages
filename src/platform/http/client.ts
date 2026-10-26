import { getStoreId } from '@/platform/merchant';
import { emit } from '@/platform/events';
import { addBreadcrumb } from '@/platform/telemetry';
import { uuid } from '@/lib/id';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  formData?: FormData; // multipart (imports, image upload): the browser sets content-type with the boundary
  headers?: Record<string, string>; // only idempotency headers belong here; anything else fails the gateway preflight
  signal?: AbortSignal;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public raw?: unknown,
    public requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const clean = (p: RequestOptions['params'] = {}) =>
  Object.fromEntries(
    Object.entries(p)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)]),
  );

const parseBody = async (res: Response): Promise<unknown> => {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const codeOf = (body: unknown): string | undefined => {
  if (!body || typeof body !== 'object') return undefined;
  const b = body as Record<string, unknown>;
  const first = Array.isArray(b.errors) ? (b.errors[0] as Record<string, unknown> | undefined)?.code : undefined;
  return (b.code ?? b.error_code ?? first) as string | undefined;
};
const messageOf = (body: unknown, fallback: string): string => {
  if (!body || typeof body !== 'object') return fallback;
  const m = (body as Record<string, unknown>).message;
  return Array.isArray(m) ? m.join(', ') : typeof m === 'string' ? m : fallback;
};

/** One client for every service call: cookie, merchant headers, request id breadcrumb, throws on non-2xx. */
export async function request<T = unknown>(
  url: string,
  opts: RequestOptions = {},
): Promise<{ status: number; body: T; requestId?: string }> {
  const storeId = getStoreId();
  const qs = opts.params ? '?' + new URLSearchParams(clean(opts.params)).toString() : '';
  const method = opts.method ?? 'GET';
  const res = await fetch(url + qs, {
    method,
    credentials: 'include',
    headers: {
      ...(opts.formData ? {} : { 'content-type': 'application/json' }),
      'merchant-mid': storeId,
      'gk-merchant-id': storeId,
      ...opts.headers,
    },
    body: opts.formData ?? (opts.body === undefined ? undefined : JSON.stringify(opts.body)),
    signal: opts.signal,
  });
  const requestId = res.headers.get('x-request-id') ?? undefined;
  addBreadcrumb({ category: 'api', message: `${method} ${url}`, data: { status: res.status, requestId } });
  const body = await parseBody(res);
  if (res.status === 401) emit('session-expired');
  if (!res.ok) throw new ApiError(res.status, messageOf(body, `${method} ${url} failed with ${res.status}`), codeOf(body), body, requestId);
  return { status: res.status, body: body as T, requestId };
}

export const newIdempotencyKey = () => uuid();
/** Presigned storage PUTs bypass the client: no cookie, no merchant headers (gateway/media-apps.md). */
export const uploadToPresignedUrl = (url: string, file: Blob) =>
  fetch(url, { method: 'PUT', body: file, headers: { 'content-type': file.type } });
