import type { JobChildContext, PollOutcome } from './types';

/** Pure helpers for the job child. */
export const outOfAttempts = (c: JobChildContext, now: number) => {
  const p = c.spec.policy;
  return (
    (p.maxAttempts !== undefined && c.attempts >= p.maxAttempts) || (p.maxDurationMs !== undefined && now - c.startedAt >= p.maxDurationMs)
  );
};
export const tooManyErrors = (c: JobChildContext) => c.consecutiveErrors + 1 >= c.spec.policy.maxConsecutiveErrors;
export const stateOf = (o: PollOutcome) => o.state;
