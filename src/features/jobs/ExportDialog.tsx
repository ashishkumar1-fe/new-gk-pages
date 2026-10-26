import { useEffect, useState } from 'react';
import { useExportFlow } from '@/machines/exportFlow';
import type { CommandContext } from '@/commands/define';
import { Banner, Button, Dialog, Field, Select, TextField } from '@/ui';

/** Export: format and date range → server estimate → "Start export" → the file is emailed; the Jobs indicator follows it. */
export const ExportDialog = ({
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
  const f = useExportFlow({ resource, label: `${label} export`, ctx });
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  useEffect(() => {
    if (f.state === 'Started' || f.state === 'Closed') onClose();
  }, [f.state, onClose]);
  const configuring = f.state === 'Configuring' || f.state === 'Previewing';
  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) f.cancel();
      }}
      title={`Export ${label.toLowerCase()}`}
      footer={
        <>
          <Button onClick={f.cancel}>Cancel</Button>
          {configuring ? (
            <Button
              variant="primary"
              loading={f.state === 'Previewing'}
              onClick={() =>
                f.previewWith({ format, dateRange: from || to ? { from: from || undefined, to: to || undefined } : undefined })
              }
            >
              Continue
            </Button>
          ) : (
            <Button variant="primary" loading={f.state === 'Starting'} onClick={f.start}>
              Start export
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Field label="Format" htmlFor="export-format">
          <Select
            id="export-format"
            value={format}
            disabled={!configuring}
            onChange={(e) => setFormat(e.target.value as 'csv' | 'xlsx')}
            options={[
              { value: 'csv', label: 'CSV' },
              { value: 'xlsx', label: 'Excel' },
            ]}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Created from" htmlFor="export-from">
            <TextField id="export-from" type="date" value={from} readOnly={!configuring} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="Created to" htmlFor="export-to">
            <TextField id="export-to" type="date" value={to} readOnly={!configuring} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
        {f.error && <Banner tone="critical">{f.error}</Banner>}
        {f.state === 'Ready' && f.preview && (
          <Banner tone="info">
            <p>
              The {f.preview.fileFormat.toUpperCase()} file will be emailed to {ctx.staff.email ?? 'you'}.
            </p>
            {f.preview.estimatedTime && <p>Estimated time: {f.preview.estimatedTime}</p>}
            <div>
              <Button size="sm" variant="ghost" onClick={f.change}>
                Change options
              </Button>
            </div>
          </Banner>
        )}
      </div>
    </Dialog>
  );
};
