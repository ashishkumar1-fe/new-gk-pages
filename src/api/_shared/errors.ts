import { ApiError } from '@/platform/http/client';
import type { CommandResult } from '@/domain/shared/result';

/** Version conflicts: the record changed elsewhere and the editor offers reload. */
const CONFLICT_CODES = new Set(['COMPARE_AND_SET_CONFLICT', 'SESSION_STATE_VERSION_STALE', 'VERSION_CONFLICT']);
/** Business codes that mean "already done": success with a warning, never an error. */
const HARMLESS_CODES: Record<string, string> = {
  ALREADY_ARCHIVED: 'Already archived',
  ALREADY_UNARCHIVED: 'Already open',
  ALREADY_CANCELLED: 'Already cancelled',
};

/**
 * A 2xx body with `success: false` is a failure (mistakes.md: fake success in the gk-pages discount wizard).
 * Service modules call this on every envelope that carries a success flag; it throws the same ApiError a non-2xx would.
 */
export const assertSuccess = <T>(body: T, status = 200, requestId?: string): T => {
  const b = body as { success?: unknown; message?: unknown; code?: unknown; error_code?: unknown } | undefined;
  if (b && typeof b === 'object' && b.success === false) {
    const message = Array.isArray(b.message)
      ? b.message.join(', ')
      : typeof b.message === 'string'
        ? b.message
        : 'The request was not successful';
    throw new ApiError(status, message, (b.code ?? b.error_code) as string | undefined, body, requestId);
  }
  return body;
};

/** Generic ApiError → CommandResult mapping (docs/architecture/commands/execution.md#errors). Service modules extend it with their own codes. */
export const toResult = <T>(e: unknown, fieldMap: Record<string, string> = {}): CommandResult<T> => {
  if (!(e instanceof ApiError))
    return { status: 'error', message: e instanceof Error ? e.message : 'Something went wrong', retryable: true };
  if (e.code && HARMLESS_CODES[e.code]) return { status: 'success', data: undefined as T, warnings: [HARMLESS_CODES[e.code]!] };
  if (e.status === 401) return { status: 'error', message: 'Session expired', retryable: false };
  if (e.status === 403) return { status: 'denied', reason: 'You do not have permission to do this' };
  if (e.status === 404) return { status: 'error', message: 'Not found', retryable: false };
  if (e.status === 409) {
    const versioned = (e.code && CONFLICT_CODES.has(e.code)) || /version/i.test(e.message);
    return versioned || !e.message
      ? { status: 'error', message: 'This record changed elsewhere. Reload and try again.', retryable: false, conflict: true }
      : { status: 'error', message: e.message, retryable: false };
  }
  if (e.status === 400 || e.status === 422) {
    const raw = (e.raw ?? {}) as { field?: string; errors?: { field?: string; message?: string }[] };
    const errs = raw.errors?.filter((x) => x.field).length
      ? raw.errors!.filter((x) => x.field)
      : raw.field
        ? [{ field: raw.field, message: e.message }]
        : [];
    if (errs.length)
      return {
        status: 'invalid',
        fieldErrors: Object.fromEntries(errs.map((x) => [fieldMap[x.field ?? ''] ?? x.field ?? '', x.message ?? e.message])),
      };
    return { status: 'error', message: e.message, retryable: false };
  }
  return { status: 'error', message: e.message, retryable: e.status >= 500 };
};
