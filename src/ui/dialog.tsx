import * as RD from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { Button } from './primitives';

export const Dialog = ({
  open,
  onOpenChange,
  title,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  children?: ReactNode;
  footer?: ReactNode;
}) => (
  <RD.Root open={open} onOpenChange={onOpenChange}>
    <RD.Portal>
      <RD.Overlay className="fixed inset-0 z-40 bg-ink/40" />
      <RD.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,480px)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-line bg-surface p-5 shadow-lg focus:outline-none">
        <RD.Title className="text-lg font-semibold text-ink">{title}</RD.Title>
        <div className="mt-3 text-sm text-ink">{children}</div>
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </RD.Content>
    </RD.Portal>
  </RD.Root>
);

export const ConfirmDialog = ({
  open,
  title,
  body,
  confirmLabel,
  dismissLabel,
  tone,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  dismissLabel?: string;
  tone: 'default' | 'critical';
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <Dialog
    open={open}
    onOpenChange={(o) => !o && onCancel()}
    title={title}
    footer={
      <>
        <Button onClick={onCancel}>{dismissLabel ?? 'Keep'}</Button>
        <Button variant={tone === 'critical' ? 'critical' : 'primary'} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </>
    }
  >
    {body && <p className="text-muted">{body}</p>}
  </Dialog>
);
