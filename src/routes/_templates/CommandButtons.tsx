import { useState } from 'react';
import { runCommand, describeCommand } from '@/commands/runCommand';
import type { CommandContext, CommandId } from '@/commands/define';
import { resourceByName } from '@/resources/registry';
import { useUi } from '@/store/ui';
import { Button } from '@/ui';

/** `<resource>.import` / `.export` with a JobSpec open their flow dialog (preview first); everything else runs directly. */
const flowOf = (id: CommandId, hasJob: boolean): 'import' | 'export' | undefined =>
  !hasJob ? undefined : id.endsWith('.import') ? 'import' : id.endsWith('.export') ? 'export' : undefined;

/**
 * Any surface renders commands this way: ask the registry what applies, call runCommand. No write logic here.
 * `onResult` lets the host apply a result to local state, e.g. an editor taking a `draftPatch`.
 */
export const CommandButtons = ({
  ids,
  ctx,
  primaryLast = true,
  size = 'md',
  onResult,
}: {
  ids: CommandId[];
  ctx: CommandContext;
  primaryLast?: boolean;
  size?: 'sm' | 'md';
  onResult?: (id: CommandId, data: unknown) => void;
}) => {
  const [busy, setBusy] = useState<CommandId | undefined>();
  const openDialog = useUi((s) => s.openDialog);
  const items = ids.map((id) => ({ id, d: describeCommand(id, ctx) })).filter((x) => x.d);
  return (
    <>
      {items.map(({ id, d }, i) => (
        <Button
          key={id}
          size={size}
          variant={d!.def.effect.destructive ? 'critical' : primaryLast && i === items.length - 1 ? 'primary' : 'secondary'}
          disabled={!d!.enabled}
          title={d!.reason}
          loading={busy === id}
          onClick={async () => {
            const flow = flowOf(id, !!d!.def.job);
            if (flow) {
              openDialog({
                kind: flow,
                resource: d!.def.resource,
                label: resourceByName(d!.def.resource)?.label.plural ?? d!.def.resource,
              });
              return;
            }
            setBusy(id);
            try {
              const r = await runCommand(id, undefined, ctx);
              if (r.status === 'success' || r.status === 'partial') onResult?.(id, r.data);
            } finally {
              setBusy(undefined);
            }
          }}
        >
          {d!.label}
        </Button>
      ))}
    </>
  );
};
