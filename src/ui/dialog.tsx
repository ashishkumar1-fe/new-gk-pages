import * as RD from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './icons';
import { Button } from './primitives';

/** Modal (design: ui.tsx Modal): 56px header with close, padded body, footer with a top rule. */
export const Dialog = ({
  open,
  onOpenChange,
  title,
  children,
  footer,
  width = 'md',
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  children?: ReactNode;
  footer?: ReactNode;
  width?: 'sm' | 'md' | 'lg';
}) => (
  <RD.Root open={open} onOpenChange={onOpenChange}>
    <RD.Portal>
      <RD.Overlay className="fixed inset-0 z-[80] animate-pagein bg-a-ink-900/40" />
      <RD.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-[81] w-[calc(100%-32px)] -translate-x-1/2 -translate-y-1/2 animate-up rounded-md bg-white shadow-modal focus:outline-none',
          width === 'sm' ? 'max-w-[440px]' : width === 'lg' ? 'max-w-[720px]' : 'max-w-[520px]',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-a-line-100 px-4">
          <RD.Title className="text-md font-semibold text-a-ink-900">{title}</RD.Title>
          <RD.Close className="flex h-7 w-7 items-center justify-center rounded text-a-ink-500 hover:bg-a-line-100" aria-label="Close">
            <Icon name="x" />
          </RD.Close>
        </div>
        <RD.Description className="sr-only">{title}</RD.Description>
        <div className="p-4 text-base text-a-ink-800">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-a-line-100 px-4 py-3">{footer}</div>}
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
    width="sm"
    footer={
      <>
        <Button onClick={onCancel}>{dismissLabel ?? 'Cancel'}</Button>
        <Button variant={tone === 'critical' ? 'critical' : 'primary'} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </>
    }
  >
    {body && <p className="text-a-ink-700">{body}</p>}
  </Dialog>
);

/** Bottom sheet that covers the page (design: settings sheet). The caller fills the two panes. */
export const Sheet = ({
  open,
  onOpenChange,
  title,
  side,
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  side: ReactNode;
  children: ReactNode;
}) => (
  <RD.Root open={open} onOpenChange={onOpenChange}>
    <RD.Portal>
      <RD.Overlay className="fixed inset-0 z-[70] animate-pagein bg-a-ink-900/55" />
      <RD.Content className="fixed inset-x-0 bottom-0 top-[max(24px,12vh)] z-[71] flex animate-up overflow-hidden rounded-t-2xl bg-white outline-none max-md:flex-col">
        <RD.Description className="sr-only">{title}</RD.Description>
        <div className="flex shrink-0 flex-col border-a-line-100 md:w-[260px] md:border-r">{side}</div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-a-line-100 px-5 md:px-8">
            <RD.Title className="text-md font-semibold text-a-ink-900">{title}</RD.Title>
            <RD.Close aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded text-a-ink-600 hover:bg-a-line-100">
              <Icon name="x" />
            </RD.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 md:px-8">{children}</div>
        </div>
      </RD.Content>
    </RD.Portal>
  </RD.Root>
);
