import { useEffect, useState, type ReactNode } from 'react';
import { configureCommandHost } from '@/commands/host';
import type { ConfirmSpec } from '@/commands/define';
import type { FieldSpec } from '@/resources/define';
import { ConfirmDialog, Dialog, Button, Field, Select, TextField, toast } from '@/ui';
import { getStoreId } from '@/platform/merchant';
import { router } from './router';

type Pending =
  | { kind: 'confirm'; spec: ConfirmSpec; resolve: (ok: boolean) => void }
  | {
      kind: 'form';
      title: string;
      fields: FieldSpec<Record<string, unknown>>[];
      values: Record<string, unknown>;
      resolve: (v: Record<string, unknown> | undefined) => void;
    };

/** Registers the real dialogs runCommand uses. Mounted once at the root, outside RouterProvider, so it navigates through the router instance. */
export const CommandHost = ({ children }: { children: ReactNode }) => {
  const [pending, setPending] = useState<Pending | undefined>();
  useEffect(() => {
    configureCommandHost({
      confirm: (spec) => new Promise((resolve) => setPending({ kind: 'confirm', spec, resolve })),
      openForm: (title, fields, initial) =>
        new Promise((resolve) =>
          setPending({
            kind: 'form',
            title,
            fields: fields as FieldSpec<Record<string, unknown>>[],
            values: { ...initial } as Record<string, unknown>,
            resolve: resolve as (v: Record<string, unknown> | undefined) => void,
          }),
        ),
      toast,
      navigate: (to) => router.history.push(to.startsWith('/store') ? to : `/store/${getStoreId()}${to}`),
    });
  }, []);
  const close = () => setPending(undefined);
  return (
    <>
      {children}
      {pending?.kind === 'confirm' && (
        <ConfirmDialog
          open
          title={pending.spec.title}
          body={pending.spec.body}
          confirmLabel={pending.spec.confirmLabel}
          dismissLabel={pending.spec.dismissLabel}
          tone={pending.spec.tone}
          onConfirm={() => {
            pending.resolve(true);
            close();
          }}
          onCancel={() => {
            pending.resolve(false);
            close();
          }}
        />
      )}
      {pending?.kind === 'form' && (
        <Dialog
          open
          onOpenChange={(o) => {
            if (!o) {
              pending.resolve(undefined);
              close();
            }
          }}
          title={pending.title}
          footer={
            <>
              <Button
                onClick={() => {
                  pending.resolve(undefined);
                  close();
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  pending.resolve(pending.values);
                  close();
                }}
              >
                Continue
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-3">
            {pending.fields.map((f) => (
              <Field key={f.path} label={f.label} help={f.help} htmlFor={`cmd-${f.path}`}>
                {f.type === 'select' ? (
                  <Select
                    id={`cmd-${f.path}`}
                    options={f.options ?? []}
                    placeholder="Choose…"
                    defaultValue={String(pending.values[f.path] ?? '')}
                    onChange={(e) => {
                      pending.values[f.path] = e.target.value;
                    }}
                  />
                ) : (
                  <TextField
                    id={`cmd-${f.path}`}
                    defaultValue={String(pending.values[f.path] ?? '')}
                    onChange={(e) => {
                      pending.values[f.path] = e.target.value;
                    }}
                  />
                )}
              </Field>
            ))}
          </div>
        </Dialog>
      )}
    </>
  );
};
