# Contract

[← Commands](README.md)

```ts
type CommandId = `${string}.${string}`;          // "order.cancel"

interface CommandDefinition<TInput, TResult> {
  // ── Identity ────────────────────────────────────────────
  id: CommandId;
  resource: string;                              // groups commands in ⌘K, permissions, assistant topics
  label: string | ((ctx: CommandContext) => string);   // copy key; may depend on context
  description: string;                           // one line; ⌘K and assistant
  icon?: IconName;
  keywords?: string[];                           // ⌘K matching
  shortcut?: string;                             // "mod+s"; scoped to screens where the command is visible

  // ── Input ───────────────────────────────────────────────
  input: ZodType<TInput>;                        // validated before every run, from every surface
  fromContext?: (ctx: CommandContext) => Partial<TInput>;   // selected IDs, current record
  form?: InputFormSpec<TInput>;                  // fields the user still has to give (cancel reason, tags)

  // ── Availability ────────────────────────────────────────
  scope: Scope | Scope[];                        // order.archive works on a record and a selection
  visible?: (ctx: CommandContext) => boolean;    // shown at all ("when")
  enabled?: (ctx: CommandContext) => true | string;   // true, or why not (shown as tooltip)
  permission: Permission;
  capability?: string;                           // feature flag; off = command does not exist

  // ── Safety ──────────────────────────────────────────────
  effect: {
    readOnly: boolean;                           // export, view in store: no data change
    destructive: boolean;                        // delete, cancel: can't be undone
    idempotent: boolean;                         // safe to retry with the same input
    external: boolean;                           // reaches customers, money or other systems (refund, notify)
  };
  confirm: 'never' | 'always' | ((input: TInput, ctx: CommandContext) => ConfirmSpec | false);

  // ── Execution ───────────────────────────────────────────
  mode?: 'pessimistic' | 'optimistic' | 'undoable';   // required unless effect.readOnly (navigate, copy, download)
  steps: Step<TInput>[];                         // one step for most commands; navigate commands have a navigate step
  idempotencyKey?: 'per-attempt' | 'per-input';  // header when the API supports it
  timeoutMs?: number;

  // ── After ───────────────────────────────────────────────
  invalidates: (input: TInput, result: TResult) => QueryKey[];
  updates?: (input: TInput, result: TResult) => CacheUpdate[];   // set detail from the response
  optimistic?: (input: TInput) => CacheUpdate[];                 // optimistic | undoable
  undo?: { command: CommandId; input: (input: TInput, result: TResult) => unknown };
  onSuccess?: {
    toast?: (result: TResult, input: TInput) => string | false;
    navigate?: (result: TResult, input: TInput) => string;       // create → open new record
  };

  // ── Bulk and long-running ───────────────────────────────
  bulk?: BulkSpec<TInput>;                       // bulk-and-jobs.md
  job?: JobSpec<TResult>;                        // import / export: command returns when the job starts
  poll?: { query: (result: TResult) => Promise<unknown>; intervalMs: number; maxAttempts: number; done: (status: unknown) => boolean };

  // ── Exposure ────────────────────────────────────────────
  expose: {
    palette: boolean;
    shortcut: boolean;
    assistant: false | { topic: string; instructions?: string };   // grouped like Agentforce topics
    extensions: false | { targets: ('record' | 'selection')[] };
  };
}

type Scope = 'record' | 'selection' | 'page' | 'global';

interface Step<TInput> {
  id: string;                                    // "createOrder", "redeemDiscount", "markDraftCompleted"
  run: (input: TInput, prev: StepResults, deps: CommandDeps) => Promise<unknown>;
  compensate?: (input: TInput, output: unknown, deps: CommandDeps) => Promise<void>;
  onFailure: 'abort' | 'continue-with-warning';  // abort → compensate earlier steps in reverse
}

interface CommandContext {
  merchantId: Id;
  staff: { id: Id; name: string; permissions: Permission[] };
  route: string;
  record?: unknown;
  selection?: { resource: string; ids: Id[]; rows: unknown[] };
  surface: 'button' | 'row' | 'bulk' | 'palette' | 'shortcut' | 'assistant' | 'extension';
}

interface ConfirmSpec {
  title: string;
  body?: string;
  confirmLabel: string;                          // the verb: "Cancel order", "Delete 12 products"
  tone: 'default' | 'critical';
  typeToConfirm?: string;                        // reserved: no v1 command uses it
}

type CommandResult<TResult> =
  | { status: 'success'; data: TResult; warnings?: string[] }
  | { status: 'partial'; data: TResult; failed: { id: Id; reason: string }[] }   // bulk
  | { status: 'invalid'; fieldErrors: Record<string, string> }                   // userErrors
  | { status: 'denied'; reason: string }
  | { status: 'cancelled' }                                                      // user dismissed confirm
  | { status: 'error'; message: string; retryable: boolean };
```

## Notes

- **`visible` vs `enabled`.** Hide what makes no sense here (Unarchive on an open order). Disable, with a reason, what makes sense but can't run now (Refund on a COD order).
- **`effect` sets defaults.** Destructive → critical confirm. External → confirm and audit. Non-idempotent → never retried automatically. The same flags become the assistant tool annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`).
- **`fromContext` + `form`.** If context gives complete input, the command runs (after confirm, if any). If not, its form opens. The assistant fills the same form; the user sees it before approving.
- **Steps.** Most commands have one step. Multi-call writes (save with children, complete a draft) list their calls in order, with compensation where an undo exists. Where it doesn't (an order can't be un-created), the step is marked and the result reports what succeeded.
- **Endpoints live only in steps.** Surfaces know IDs and inputs, never URLs.
- **One result type** for every command, so every surface handles success, field errors, partial bulk results and failures the same way.
