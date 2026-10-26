import { useBlocker } from '@tanstack/react-router';
import { ConfirmDialog } from '@/ui';

/**
 * Every editor, the order edit and the wizard: a router blocker plus beforeunload while there are unsaved changes.
 * Returns the dialog to render (docs/architecture/docs/machines.md#other-orchestration).
 */
export function useLeaveGuard(unsaved: boolean) {
  const blocker = useBlocker({ shouldBlockFn: () => unsaved, enableBeforeUnload: () => unsaved, disabled: !unsaved, withResolver: true });
  return blocker.status === 'blocked' ? (
    <ConfirmDialog
      open
      title="Discard unsaved changes?"
      body="Your changes on this page will be lost."
      confirmLabel="Discard"
      dismissLabel="Keep editing"
      tone="critical"
      onConfirm={() => blocker.proceed?.()}
      onCancel={() => blocker.reset?.()}
    />
  ) : null;
}
