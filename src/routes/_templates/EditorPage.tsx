import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import { Controller, useForm, type FieldValues, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { AnyResource, CreateContext, FieldSpec, Section } from '@/resources/define';
import { staleTimeFor } from '@/platform/query/cachePolicy';
import { runCommand } from '@/commands/runCommand';
import { useRecordSave } from '@/machines/recordSave';
import { money, toRupees, type Money } from '@/domain/shared/money';
import {
  Badge,
  Banner,
  Button,
  Card,
  Checkbox,
  ErrorState,
  Field,
  PageHeader,
  PageLayout,
  SaveBar,
  Select,
  Skeleton,
  TextArea,
  TextField,
  TwoColumn,
} from '@/ui';
import { useCommandContext } from '../_hooks/useCommandContext';
import { useGo } from '../_hooks/useGo';
import { useLeaveGuard } from '../_hooks/useLeaveGuard';
import { useShortcut } from '../_hooks/useShortcut';
import { CommandButtons } from './CommandButtons';
import { resolveComponent } from '@/features/components';

type Draft = Record<string, unknown>;
type Form = ReturnType<typeof useForm<Draft>>;

const isReadOnly = (f: FieldSpec<Draft>, d: Draft, locked: boolean) =>
  locked || (typeof f.readOnly === 'function' ? f.readOnly(d) : !!f.readOnly);

function FieldInput({ f, form, draft, locked }: { f: FieldSpec<Draft>; form: Form; draft: Draft; locked: boolean }) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const err = errors[f.path]?.message as string | undefined;
  const id = `f-${f.path}`;
  const name = f.path as Path<FieldValues>;
  const readOnly = isReadOnly(f, draft, locked);
  const wrap = (child: React.ReactNode, help = f.help) => (
    <Field label={f.label} help={help} error={err} htmlFor={id}>
      {child}
    </Field>
  );
  switch (f.type) {
    case 'textarea':
    case 'rich_text':
      return wrap(<TextArea id={id} invalid={!!err} readOnly={readOnly} {...register(name)} />);
    case 'select':
      return wrap(<Select id={id} options={f.options ?? []} disabled={readOnly} {...register(name)} />);
    case 'boolean':
      return (
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <Checkbox
              id={id}
              label={f.label}
              disabled={readOnly}
              checked={Boolean(field.value)}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
      );
    case 'money':
      return (
        <Controller
          name={name}
          control={control}
          render={({ field }) =>
            wrap(
              <TextField
                id={id}
                type="number"
                step="0.01"
                min={0}
                invalid={!!err}
                readOnly={readOnly}
                placeholder="₹0.00"
                value={field.value ? String(toRupees(field.value as Money)) : ''}
                onChange={(e) => field.onChange(e.target.value === '' ? undefined : money(Number(e.target.value) * 100))}
              />,
            )
          }
        />
      );
    case 'tags':
    case 'multi_select':
      return (
        <Controller
          name={name}
          control={control}
          render={({ field }) =>
            wrap(
              <TextField
                id={id}
                readOnly={readOnly}
                value={((field.value as string[] | undefined) ?? []).join(', ')}
                onChange={(e) =>
                  field.onChange(
                    e.target.value
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean),
                  )
                }
              />,
              f.help ?? 'Comma-separated',
            )
          }
        />
      );
    case 'number':
    case 'percent':
      return wrap(
        <TextField
          id={id}
          type="number"
          step={f.type === 'percent' ? '0.01' : undefined}
          invalid={!!err}
          readOnly={readOnly}
          {...register(name, { valueAsNumber: true })}
        />,
      );
    case 'date':
      return wrap(<TextField id={id} type="date" invalid={!!err} readOnly={readOnly} {...register(name)} />);
    case 'phone':
      return wrap(<TextField id={id} type="tel" inputMode="tel" invalid={!!err} readOnly={readOnly} {...register(name)} />);
    default: // text, image, media_list and reference fall back to text until their pickers land in the kit
      return wrap(<TextField id={id} invalid={!!err} readOnly={readOnly} {...register(name)} />);
  }
}

const SectionView = ({
  s,
  form,
  draft,
  record,
  calc,
  locked,
}: {
  s: Section<Draft>;
  form: Form;
  draft: Draft;
  record?: unknown;
  calc?: unknown;
  locked: boolean;
}) => {
  const [open, setOpen] = useState(!('collapsible' in s && s.collapsible));
  if (s.visibleWhen && !s.visibleWhen(draft)) return null;
  if ('component' in s) {
    const C = resolveComponent(s.component);
    return (
      <Card title={s.title}>
        {C ? <C record={record} draft={draft} calc={calc} /> : <p className="text-critical">Unknown component {s.component}</p>}
      </Card>
    );
  }
  const fields = s.fields.filter((f) => !f.visibleWhen || f.visibleWhen(draft));
  return (
    <Card title={s.title}>
      {'collapsible' in s && s.collapsible && (
        <button type="button" className="mb-3 text-sm text-muted hover:text-ink" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? 'Hide' : 'Edit'}
        </button>
      )}
      {open && (
        <div className="flex flex-col gap-4">
          {fields.map((f) => (
            <FieldInput key={f.path} f={f} form={form} draft={draft} locked={locked} />
          ))}
        </div>
      )}
    </Card>
  );
};

/** Server totals (draft calculate): debounced; the shown value is always the server's, a stale response is dropped by the key. */
function useCalculate(resource: AnyResource, draft: Draft) {
  const calc = resource.editor?.calculate;
  const [debounced, setDebounced] = useState(draft);
  const serialized = JSON.stringify(draft);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(JSON.parse(serialized) as Draft), calc?.debounceMs ?? 500);
    return () => clearTimeout(t);
  }, [serialized, calc?.debounceMs]);
  return useQuery({
    queryKey: resource.keys.calc(debounced),
    queryFn: () => calc!.query(debounced),
    enabled: !!calc && !(calc.skipWhen?.(debounced) ?? false),
    staleTime: staleTimeFor('calc'),
  }).data;
}

/** One template for every editor. Dirty/valid live in the form; the save runs the record save machine → runCommand. */
export function EditorPage({ resource, id }: { resource: AnyResource; id?: string }) {
  const editor = resource.editor!;
  const create = !id;
  const go = useGo();
  const search = useSearch({ strict: false }) as { sourceId?: string; customerId?: string };
  const query = useQuery({
    queryKey: resource.keys.detail(id ?? 'new'),
    queryFn: ({ signal }) => resource.data.getOne(id!, { signal }),
    enabled: !create,
    staleTime: staleTimeFor('detail'),
  });
  const source = useQuery({
    queryKey: resource.keys.detail(search.sourceId ?? 'none'),
    queryFn: ({ signal }) => resource.data.getOne(search.sourceId!, { signal }),
    enabled: create && !!search.sourceId,
    staleTime: staleTimeFor('detail'),
  });
  const record = query.data;
  const createCtx: CreateContext = { sourceId: search.sourceId, source: source.data, customerId: search.customerId };
  const values = useMemo<Draft | undefined>(
    () =>
      create
        ? search.sourceId && !source.data
          ? undefined
          : editor.create!.initial(createCtx)
        : record
          ? editor.toInput(record)
          : undefined,
    [create, record, source.data, search.sourceId],
  );
  const locked = !create && !!record && !!editor.readOnlyWhen?.(record);

  const form = useForm<Draft>({ resolver: zodResolver(resource.schema.input!), values, mode: 'onBlur' });
  const ctx = useCommandContext({ surface: 'button', record });
  const saver = useRecordSave(async (v) => {
    const r = await runCommand(create ? editor.create!.command : editor.save, create ? v : { ...v, id }, ctx);
    if (r.status === 'invalid') Object.entries(r.fieldErrors).forEach(([k, m]) => form.setError(k as Path<FieldValues>, { message: m }));
    return r;
  });
  useEffect(() => {
    if (saver.state === 'saved' && !create) form.reset(form.getValues());
  }, [saver.state]);

  const dirty = form.formState.isDirty && !locked;
  const leaveDialog = useLeaveGuard(dirty && !saver.busy && saver.state !== 'saved');
  const onSave = form.handleSubmit((v) => saver.save(v));
  useShortcut(
    'mod+s',
    () => {
      if (dirty) void onSave();
    },
    !locked,
  );
  const draft = form.watch();
  const calc = useCalculate(resource, draft);
  /** A command may hand back a `draftPatch` (AI content): it fills the form as unsaved changes, never saves. */
  const applyResult = (_id: string, data: unknown) => {
    const patch = (data as { draftPatch?: Draft } | undefined)?.draftPatch;
    if (patch) Object.entries(patch).forEach(([k, v]) => form.setValue(k as Path<FieldValues>, v, { shouldDirty: true }));
  };

  if (!create && query.isPending)
    return (
      <PageLayout>
        <Skeleton lines={10} />
      </PageLayout>
    );
  if (!create && query.isError)
    return (
      <PageLayout>
        <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />
      </PageLayout>
    );
  if (create && search.sourceId && source.isPending)
    return (
      <PageLayout>
        <Skeleton lines={10} />
      </PageLayout>
    );

  const status = editor.header?.status?.(draft);
  const title = create ? `New ${resource.label.singular.toLowerCase()}` : resource.title(record);
  const more = !create && record && resource.commands?.more ? resource.commands.more(record) : [];
  const primary = !create && record ? resource.commands?.primary?.(record) : undefined;

  return (
    <PageLayout>
      {!locked && (
        <SaveBar
          dirty={dirty}
          saving={saver.busy}
          onSave={() => void onSave()}
          onDiscard={() => form.reset(values)}
          status={
            saver.state === 'saved'
              ? 'Saved'
              : saver.state === 'failed' && saver.result?.status === 'error'
                ? saver.result.message
                : undefined
          }
        />
      )}
      <PageHeader
        title={title}
        subtitle={status && <Badge tone={status.tone}>{status.label}</Badge>}
        back={{ label: resource.label.plural, onClick: () => go(resource.routes.list) }}
        actions={<CommandButtons ids={primary ? [...more, primary] : more} ctx={ctx} primaryLast={!!primary} onResult={applyResult} />}
      />
      {saver.state === 'conflict' && (
        <Banner tone="warning">
          <p>
            This {resource.label.singular.toLowerCase()} changed elsewhere. Reload to see the latest version; your unsaved changes will be
            lost.
          </p>
          <div>
            <Button
              size="sm"
              onClick={async () => {
                const r = await query.refetch();
                if (r.data) form.reset(editor.toInput(r.data));
                saver.reset();
              }}
            >
              Reload
            </Button>
          </div>
        </Banner>
      )}
      {saver.state === 'partial' && saver.result?.status === 'partial' && (
        <Banner tone="warning">
          <p>
            Saved, but {saver.result.failed.length} part(s) failed: {saver.result.failed.map((f) => f.reason).join('; ')}
          </p>
          <div>
            <Button size="sm" onClick={saver.retry}>
              Retry the rest
            </Button>
          </div>
        </Banner>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSave();
        }}
      >
        <TwoColumn
          main={editor.layout.main.map((s) => (
            <SectionView key={s.id} s={s} form={form} draft={draft} record={record} calc={calc} locked={locked} />
          ))}
          aside={editor.layout.aside?.map((s) => (
            <SectionView key={s.id} s={s} form={form} draft={draft} record={record} calc={calc} locked={locked} />
          ))}
        />
        <button type="submit" hidden aria-hidden />
      </form>
      {leaveDialog}
    </PageLayout>
  );
}
