import { useCallback } from 'react';
import { useUi } from '@/store/ui';
import { useCommandContext } from '@/routes/_hooks/useCommandContext';
import { ImportDialog } from './ImportDialog';
import { ExportDialog } from './ExportDialog';

/** The one place the import and export dialogs mount, driven by the UI store's active dialog. */
export const JobFlows = () => {
  const dialog = useUi((s) => s.dialog);
  const close = useUi((s) => s.closeDialog);
  const ctx = useCommandContext({ surface: 'button' });
  const onClose = useCallback(() => close(), [close]);
  if (!dialog) return null;
  return dialog.kind === 'import' ? (
    <ImportDialog key={`i-${dialog.resource}`} resource={dialog.resource} label={dialog.label} ctx={ctx} onClose={onClose} />
  ) : (
    <ExportDialog key={`e-${dialog.resource}`} resource={dialog.resource} label={dialog.label} ctx={ctx} onClose={onClose} />
  );
};
