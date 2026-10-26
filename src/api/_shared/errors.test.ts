import { describe, it, expect } from 'vitest';
import { assertSuccess, toResult } from './errors';
import { ApiError } from '@/platform/http/client';

describe('server error mapping (commands/execution.md#errors)', () => {
  it('a 2xx body with success:false is a failure, never shown as success (mistakes.md)', () => {
    expect(() => assertSuccess({ success: false, message: 'Code already exists' })).toThrow('Code already exists');
    expect(assertSuccess({ success: true, data: 1 })).toEqual({ success: true, data: 1 });
  });
  it('maps 409 version conflicts to "changed elsewhere" and other 409s to the server message', () => {
    expect(toResult(new ApiError(409, 'x', 'COMPARE_AND_SET_CONFLICT'))).toMatchObject({
      status: 'error',
      message: 'This record changed elsewhere. Reload and try again.',
    });
    expect(toResult(new ApiError(409, 'Location has stock; move it first', 'LOCATION_HAS_STOCK_MOVE_FIRST'))).toMatchObject({
      status: 'error',
      message: 'Location has stock; move it first',
    });
  });
  it('maps a harmless business code to success with a warning', () => {
    expect(toResult(new ApiError(422, 'already archived', 'ALREADY_ARCHIVED'))).toEqual({
      status: 'success',
      data: undefined,
      warnings: ['Already archived'],
    });
  });
  it('maps field errors to invalid in domain names, 403 to denied, 5xx to retryable', () => {
    expect(
      toResult(new ApiError(400, 'bad', undefined, { errors: [{ field: 'body_html', message: 'too long' }] }), {
        body_html: 'descriptionHtml',
      }),
    ).toEqual({ status: 'invalid', fieldErrors: { descriptionHtml: 'too long' } });
    expect(toResult(new ApiError(403, 'no'))).toMatchObject({ status: 'denied' });
    expect(toResult(new ApiError(503, 'down'))).toMatchObject({ status: 'error', retryable: true });
    expect(toResult(new Error('network'))).toMatchObject({ status: 'error', retryable: true });
  });
});
