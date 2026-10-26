import { useEffect } from 'react';
import { useImportFlow } from '@/machines/importFlow';
import type { CommandContext } from '@/commands/define';
import { Banner, Button, Dialog, FileInput } from '@/ui';

/** Import: choose a file → server preview (row errors) → "Start import" is the confirm → the Jobs indicator takes over. */
export const ImportDialog = ({
  resource,
  label,
  ctx,
  onClose,
}: {
  resource: string;
  label: string;
  ctx: CommandContext;
  onClose: () => void;
}) => {
  const f = useImportFlow({ resource, label: `${label} import`, ctx });
  useEffect(() => {
    if (f.state === 'Started' || f.state === 'Closed') onClose();
  }, [f.state, onClose]);
  const p = f.preview;
  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) f.cancel();
      }}
      title={`Import ${label.toLowerCase()}`}
      footer={
        <>
          <Button onClick={f.cancel}>Cancel</Button>
          <Button variant="primary" disabled={f.state !== 'Ready'} loading={f.state === 'Starting'} onClick={f.start}>
            {p ? `Start import (${p.totalRows} rows)` : 'Start import'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <FileInput id="import-file" accept=".csv,.xlsx" label="CSV or Excel file" fileName={f.fileName} onFile={f.choose} />
        {f.state === 'Previewing' && <p className="text-muted">Checking the file…</p>}
        {f.error && <Banner tone="critical">{f.error}</Banner>}
        {f.state === 'Invalid' && p && (
          <Banner tone="critical">
            {p.missingRequiredFields.length > 0 && <p>Missing columns: {p.missingRequiredFields.join(', ')}</p>}
            {p.errors.map((e) => (
              <p key={e}>{e}</p>
            ))}
          </Banner>
        )}
        {f.state === 'Ready' && p && (
          <Banner tone="info">
            <p>
              {p.totalRows} rows in {p.fileName}. Existing {label.toLowerCase()} may be updated.
            </p>
            {p.estimatedTime && <p>Estimated time: {p.estimatedTime}</p>}
            {p.warnings.map((w) => (
              <p key={w}>{w}</p>
            ))}
          </Banner>
        )}
      </div>
    </Dialog>
  );
};
