/** One result shape for every command, so every surface handles success, field errors, partial bulk results and failures the same way. */
export type CommandResult<T> =
  | { status: 'success'; data: T; warnings?: string[] }
  | { status: 'partial'; data: T; failed: { id: string; reason: string }[] } // bulk
  | { status: 'invalid'; fieldErrors: Record<string, string> } // userErrors
  | { status: 'denied'; reason: string }
  | { status: 'cancelled' } // user dismissed confirm
  | { status: 'error'; message: string; retryable: boolean; conflict?: boolean }; // conflict: changed elsewhere, reload only
