/** The rules for asking the server "done yet?", not the job's data. Used by command `poll` and `JobSpec`. */
export interface PollPolicy {
  intervalMs: number;
  maxAttempts?: number;
  maxDurationMs?: number;
  maxConsecutiveErrors: number; // default 5
  pauseWhenHidden: boolean; // default true; checks at once on return
}
export const polls = {
  refundStatus: { intervalMs: 5_000, maxAttempts: 24, maxConsecutiveErrors: 5, pauseWhenHidden: true },
  bulkOpsJob: { intervalMs: 5_000, maxConsecutiveErrors: 5, pauseWhenHidden: true },
  customerExport: { intervalMs: 3_000, maxAttempts: 20, maxConsecutiveErrors: 5, pauseWhenHidden: true },
  draftPayment: { intervalMs: 8_000, maxDurationMs: 30 * 60_000, maxConsecutiveErrors: 5, pauseWhenHidden: true },
  editStale: { intervalMs: 15_000, maxDurationMs: 6 * 60_000, maxConsecutiveErrors: 5, pauseWhenHidden: true },
} satisfies Record<string, PollPolicy>;
