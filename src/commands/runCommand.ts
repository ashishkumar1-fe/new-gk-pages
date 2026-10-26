import { api } from '@/api';
import { toResult } from '@/api/_shared/errors';
import { ApiError, newIdempotencyKey } from '@/platform/http/client';
import { flags } from '@/platform/flags';
import { queryClient } from '@/platform/query/queryClient';
import { addBreadcrumb, track } from '@/platform/telemetry';
import { getCommandHost } from './host';
import { commandById } from './registry';
import type {
  Actor,
  AnyCommand,
  CacheUpdate,
  CommandContext,
  CommandDeps,
  CommandId,
  CommandResult,
  ConfirmSpec,
  StepResults,
} from './define';

/** Bulk selections above this many items confirm by default, with the count in the label (proposed default, open question 23). */
export const BULK_CONFIRM_ABOVE = 25;
/** Idempotent commands retry network errors and 5xx this many times, with backoff, as reads do. */
export const MAX_RETRIES = 2;
export const retryDelayMs = { base: 250 };

const running = new Set<string>();
const labelOf = (def: AnyCommand, ctx: CommandContext) => (typeof def.label === 'string' ? def.label : def.label(ctx));
const isOff = (def: AnyCommand) => !!def.capability && !flags.isOn(def.capability);

const targetIds = (input: unknown): string[] => {
  if (!input || typeof input !== 'object') return [];
  const i = input as Record<string, unknown>;
  if (Array.isArray(i.ids)) return i.ids as string[];
  return ['id', 'productId', 'orderId'].flatMap((k) => (typeof i[k] === 'string' ? [i[k] as string] : []));
};
const scopes = (def: AnyCommand) => (Array.isArray(def.scope) ? def.scope : [def.scope]);
const itemsOf = (def: AnyCommand, input: unknown) =>
  def.bulk ? def.bulk.toItems(input) : scopes(def).includes('selection') ? targetIds(input) : [];

/** Policy (docs/architecture/commands/execution.md): definition, then effect flags, then bulk size. */
export const confirmSpecFor = (def: AnyCommand, input: unknown, ctx: CommandContext): ConfirmSpec | false => {
  const label = labelOf(def, ctx);
  if (typeof def.confirm === 'function') return def.confirm(input, ctx);
  if (def.confirm === 'always') return { title: `${label}?`, confirmLabel: 'Continue', tone: 'default' };
  if (def.effect.destructive) return { title: `${label}?`, body: 'This can’t be undone.', confirmLabel: label, tone: 'critical' };
  if (def.effect.external) return { title: `${label}?`, confirmLabel: 'Continue', tone: 'default' };
  const n = itemsOf(def, input).length;
  if (!def.effect.readOnly && n > BULK_CONFIRM_ABOVE)
    return { title: `${label} for ${n} items?`, confirmLabel: `${label} (${n})`, tone: 'default' };
  return false;
};

const retryable = (e: unknown) => !(e instanceof ApiError) || e.status >= 500;
const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(t);
        reject(signal.reason);
      },
      { once: true },
    );
  });

/** Apply cache writes; returns a function that puts every touched entry back exactly. */
const applyCache = (updates: CacheUpdate[]) => {
  const before = updates.map((u) => ({ key: u.key, data: queryClient.getQueryData(u.key) }));
  updates.forEach((u) => queryClient.setQueryData(u.key, (old: unknown) => u.update(old)));
  return () => before.forEach((b) => queryClient.setQueryData(b.key, b.data));
};

/** A step output that names failed items turns a bulk success into `partial`. */
const failedOf = (out: unknown): { id: string; reason: string }[] => {
  const f = (out as { failed?: unknown } | undefined)?.failed;
  return Array.isArray(f) ? (f as { id: string; reason: string }[]) : [];
};

/** The one execution path for writes, from every surface. Nine steps (docs/architecture/commands/execution.md). */
export async function runCommand<R = unknown>(
  id: CommandId,
  input: Record<string, unknown> | undefined,
  ctx: CommandContext,
): Promise<CommandResult<R>> {
  const host = getCommandHost();
  // 1 resolve
  const def = commandById(id);
  if (!def || isOff(def)) return { status: 'error', message: `Unknown command ${id}`, retryable: false };

  // 2 availability
  if (def.visible && !def.visible(ctx)) return { status: 'denied', reason: 'Not available here' };
  if (!ctx.can(def.permission)) return { status: 'denied', reason: 'You don’t have permission' };
  const enabled = def.enabled?.(ctx) ?? true;
  if (enabled !== true) {
    host.toast(enabled, 'warning');
    return { status: 'denied', reason: enabled };
  }

  // 3 input
  const merged = { ...(def.fromContext?.(ctx) ?? {}), ...(input ?? {}) } as Record<string, unknown>;
  const needsForm = def.form && def.form.some((f) => merged[f.path] === undefined);
  const complete = needsForm ? await host.openForm(labelOf(def, ctx), def.form!, merged) : merged;
  if (complete === undefined) return { status: 'cancelled' };
  const parsed = def.input.safeParse(complete);
  if (!parsed.success)
    return { status: 'invalid', fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), i.message])) };
  const data = parsed.data;
  const items = itemsOf(def, data);
  if (def.bulk?.maxItems && items.length > def.bulk.maxItems) {
    const reason = `Select at most ${def.bulk.maxItems} items.`;
    host.toast(reason, 'warning');
    return { status: 'denied', reason };
  }

  // 4 confirm
  if (!ctx.confirmed) {
    const spec = confirmSpecFor(def, data, ctx);
    if (spec && !(await host.confirm(spec))) return { status: 'cancelled' };
  }

  // concurrency: the same command for the same target never runs twice at once; the second call is ignored
  const lock = `${def.id}:${targetIds(data).join(',')}`;
  if (running.has(lock)) return { status: 'cancelled' };
  running.add(lock);

  const key = def.idempotencyKey ? newIdempotencyKey() : undefined; // one key per attempt, reused by its retries
  const controller = new AbortController();
  const timer = def.timeoutMs ? setTimeout(() => controller.abort(), def.timeoutMs) : undefined;
  const deps: CommandDeps = {
    api,
    session: { staff: ctx.staff, storeId: ctx.storeId },
    signal: controller.signal,
    idempotencyKey: key,
    copy: host.copy,
  };
  const actor: Actor =
    ctx.actor ?? (ctx.surface === 'assistant' ? { type: 'assistant' } : { type: 'staff', id: ctx.staff.id, name: ctx.staff.name });
  const started = performance.now();
  addBreadcrumb({ category: 'command', message: `command.start ${def.id}`, data: { surface: ctx.surface, targets: targetIds(data) } }); // passbook

  // 5 optimistic
  const rollback = (def.mode === 'optimistic' || def.mode === 'undoable') && def.optimistic ? applyCache(def.optimistic(data)) : undefined;

  // 6 run
  const runStep = async (step: AnyCommand['steps'][number], prev: StepResults) => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await step.run(data, prev, deps);
      } catch (e) {
        if (!def.effect.idempotent || attempt >= MAX_RETRIES || !retryable(e) || controller.signal.aborted) throw e;
        await sleep(retryDelayMs.base * 2 ** attempt, controller.signal);
      }
    }
  };
  const done: { step: AnyCommand['steps'][number]; out: unknown }[] = [];
  const warnings: string[] = [];
  let result: CommandResult<R>;
  try {
    const prev: StepResults = {};
    for (const step of def.steps) {
      try {
        prev[step.id] = await runStep(step, prev);
        done.push({ step, out: prev[step.id] });
      } catch (e) {
        if (step.onFailure === 'continue-with-warning') {
          warnings.push(e instanceof Error ? e.message : String(e));
          continue;
        }
        for (const d of [...done].reverse()) await d.step.compensate?.(data, d.out, deps);
        throw e;
      }
    }
    const last = done[done.length - 1]?.out as R;
    const failed = done.flatMap((d) => failedOf(d.out));
    result = failed.length
      ? { status: 'partial', data: last, failed }
      : warnings.length
        ? { status: 'success', data: last, warnings }
        : { status: 'success', data: last };
    // 7 settle
    if (def.updates) applyCache(def.updates(data, last));
    await Promise.all(def.invalidates(data, last).map((k) => queryClient.invalidateQueries({ queryKey: k })));
    // 8 feedback
    if (result.status === 'partial') host.toast(`${items.length - failed.length} done, ${failed.length} failed`, 'warning');
    else {
      const toast = def.onSuccess?.toast?.(last, data, ctx);
      if (toast) host.toast(warnings.length ? `${toast} (${warnings.join('; ')})` : toast, warnings.length ? 'warning' : 'default');
    }
    const to = def.onSuccess?.navigate?.(last, data);
    if (to) host.navigate(to);
  } catch (e) {
    rollback?.();
    result = toResult<R>(e);
    if (result.status === 'error') host.toast(result.message, 'critical');
    if (result.status === 'denied') host.toast(result.reason, 'warning');
    if (result.status === 'success' && result.warnings) host.toast(result.warnings.join('; '), 'warning');
  } finally {
    if (timer) clearTimeout(timer);
    running.delete(lock);
  }
  // 9 audit
  const ms = Math.round(performance.now() - started);
  addBreadcrumb({ category: 'command', message: `command.end ${def.id}`, data: { status: result.status, ms } });
  track('command_run', {
    command: def.id,
    resource: def.resource,
    targets: targetIds(data),
    surface: ctx.surface,
    status: result.status,
    ms,
    actor,
    ...(ctx.conversationId ? { conversationId: ctx.conversationId } : {}),
  });
  return result;
}

/** Availability for menus: which of these ids should render, and with what state. Off, invisible or unpermitted → not shown. */
export const describeCommand = (id: CommandId, ctx: CommandContext) => {
  const def = commandById(id);
  if (!def || isOff(def)) return undefined;
  if (def.visible && !def.visible(ctx)) return undefined;
  if (!ctx.can(def.permission)) return undefined;
  const enabled = def.enabled?.(ctx) ?? true;
  return { def, label: labelOf(def, ctx), enabled: enabled === true, reason: enabled === true ? undefined : enabled };
};
