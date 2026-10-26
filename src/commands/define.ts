import type { QueryKey } from '@tanstack/react-query';
import type { ApiModules } from '@/api';
import type { PollPolicy } from '@/platform/query/pollPolicy';
import type { CommandId, Permission, FieldSpec, Schema } from '@/resources/define';
import type { CommandResult } from '@/domain/shared/result';
export type { CommandResult, CommandId };

export type Scope = 'record' | 'selection' | 'page' | 'global';
export type Surface = 'button' | 'row' | 'bulk' | 'palette' | 'shortcut' | 'assistant' | 'extension';

export interface CommandContext {
  storeId: string;
  staff: { id: string; name: string; email?: string };
  can: (scope: Permission) => boolean; // unmapped scopes pass while enforcement is off
  route: string;
  record?: unknown;
  selection?: { resource: string; ids: string[]; rows: unknown[] };
  surface: Surface;
  actor?: Actor; // defaults to the staff member; set for assistant and app runs
  conversationId?: string; // assistant runs: recorded in the audit event
  confirmed?: boolean; // a flow's review step or an approved proposal already confirmed
}

export interface ConfirmSpec {
  title: string;
  body?: string;
  confirmLabel: string;
  dismissLabel?: string;
  tone: 'default' | 'critical';
}

/** Who ran a command, for the audit event (docs/architecture/commands/execution.md). */
export interface Actor {
  type: 'staff' | 'app' | 'assistant' | 'system';
  id?: string;
  name?: string;
}

/** A direct write to one cache entry: set from a response (`updates`) or applied before the call (`optimistic`). */
export interface CacheUpdate {
  key: QueryKey;
  update: (old: unknown) => unknown;
}

/** Bulk: one call carrying every id. `maxItems` is a hard cap; above it the command is denied. */
export interface BulkSpec<TInput> {
  maxItems?: number;
  toItems: (input: TInput) => string[];
}

export type JobStatus<TResult> =
  | { state: 'queued' | 'running'; progress?: { done: number; total: number } }
  | { state: 'completed'; result: TResult }
  | { state: 'failed'; error: string; rows?: { row: number; error: string }[] }
  | { state: 'cancelled' };

/**
 * Long work: the command returns when the job starts; the Jobs machine follows it with `poll` under `policy`.
 * `poll` and `cancel` close over the api module themselves, so the machine (which may not import api/) only passes a signal.
 */
export interface JobSpec<TResult> {
  poll: (jobId: string, opts: { signal: AbortSignal }) => Promise<JobStatus<TResult>>;
  policy: PollPolicy;
  cancel?: (jobId: string, opts: { signal: AbortSignal }) => Promise<void>;
  jobId: (result: TResult) => string;
}

export interface CommandDeps {
  api: ApiModules;
  session: { staff: { id: string; name: string; email?: string }; storeId: string };
  signal: AbortSignal;
  idempotencyKey?: string;
  copy: (text: string) => Promise<void>; // clipboard, provided by the surface host
}
export type StepResults = Record<string, unknown>;
export interface Step<TInput> {
  id: string;
  run: (input: TInput, prev: StepResults, deps: CommandDeps) => Promise<unknown>;
  compensate?: (input: TInput, output: unknown, deps: CommandDeps) => Promise<void>;
  onFailure: 'abort' | 'continue-with-warning';
}

export interface CommandDefinition<TInput, TResult> {
  id: CommandId;
  resource: string;
  label: string | ((ctx: CommandContext) => string);
  description: string;
  icon?: string;
  keywords?: string[]; // ⌘K matching
  shortcut?: string;
  input: Schema<TInput>;
  fromContext?: (ctx: CommandContext) => Partial<TInput>;
  form?: FieldSpec<TInput>[];
  scope: Scope | Scope[];
  visible?: (ctx: CommandContext) => boolean;
  enabled?: (ctx: CommandContext) => true | string;
  permission: Permission;
  capability?: string;
  effect: { readOnly: boolean; destructive: boolean; idempotent: boolean; external: boolean };
  confirm: 'never' | 'always' | ((input: TInput, ctx: CommandContext) => ConfirmSpec | false);
  preview?: (input: TInput, deps: CommandDeps) => Promise<unknown>; // server dry run shown before the confirm
  mode?: 'pessimistic' | 'optimistic' | 'undoable';
  steps: Step<TInput>[];
  idempotencyKey?: boolean;
  timeoutMs?: number;
  invalidates: (input: TInput, result: TResult) => QueryKey[];
  updates?: (input: TInput, result: TResult) => CacheUpdate[]; // set the detail from the response, no refetch
  optimistic?: (input: TInput) => CacheUpdate[]; // optimistic | undoable; rolled back on failure
  undo?: { command: CommandId; input: (input: TInput, result: TResult) => Record<string, unknown> };
  bulk?: BulkSpec<TInput>;
  job?: JobSpec<TResult>;
  poll?: PollPolicy & { query: (result: TResult, opts: { signal: AbortSignal }) => Promise<unknown>; done: (status: unknown) => boolean };
  onSuccess?: {
    toast?: (result: TResult, input: TInput, ctx: CommandContext) => string | false;
    navigate?: (result: TResult, input: TInput) => string;
  };
  expose: {
    palette: boolean;
    assistant: false | { topic: string; instructions?: string };
    extensions: false | { targets: ('record' | 'selection')[] };
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyCommand = CommandDefinition<any, any>;
export const defineCommand = <TInput, TResult>(def: CommandDefinition<TInput, TResult>) => def;
