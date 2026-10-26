import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { AnyResource, CellSpec, Filter, Option } from '@/resources/define';
import { flags } from '@/platform/flags';
import { staleTimeFor } from '@/platform/query/cachePolicy';
import { formatDate, formatMoney } from '@/domain/shared/format';
import {
  Badge,
  Banner,
  BulkBar,
  DataTable,
  EmptyState,
  ErrorState,
  PageHeader,
  PageLayout,
  Pagination,
  Select,
  Skeleton,
  Tabs,
  TextField,
} from '@/ui';
import { useListParams } from '../_hooks/useListParams';
import { useCommandContext } from '../_hooks/useCommandContext';
import { useGo } from '../_hooks/useGo';
import { CommandButtons } from './CommandButtons';
import { resolveComponent } from '@/features/components';

const Cell = ({ spec }: { spec: CellSpec }) => {
  if ('component' in spec) {
    const C = resolveComponent(spec.component);
    return C ? <C /> : <span className="text-critical">?</span>;
  }
  switch (spec.kind) {
    case 'money':
      return <span className="tabular-nums">{formatMoney(spec.value)}</span>;
    case 'date':
      return <span>{formatDate(spec.value)}</span>;
    case 'status':
      return <Badge tone={spec.tone}>{spec.value}</Badge>;
    case 'image_title':
      return (
        <span className="flex items-center gap-2">
          {spec.image ? (
            <img src={spec.image} alt="" className="h-8 w-8 rounded object-cover" />
          ) : (
            <span className="h-8 w-8 rounded bg-neutral-soft" />
          )}
          <span className="font-medium">{spec.value}</span>
        </span>
      );
    default:
      return <span>{spec.value ?? '—'}</span>;
  }
};

/** A filter's options: a fixed list, or a lookup fetched once per store and cached as 'lookup'. */
function FilterSelect({
  resource,
  f,
  value,
  onChange,
}: {
  resource: AnyResource;
  f: Filter;
  value: string;
  onChange: (v: string) => void;
}) {
  const fixed = 'options' in f && Array.isArray(f.options) ? f.options : undefined;
  const loader = 'options' in f && typeof f.options === 'function' ? f.options : undefined;
  const q = useQuery({
    queryKey: [...resource.keys.all(), 'filterOptions', f.id],
    queryFn: () => loader!(),
    enabled: !!loader,
    staleTime: staleTimeFor('lookup'),
  });
  const options: Option[] = fixed ?? q.data ?? [];
  return <Select aria-label={f.label} placeholder={f.label} value={value} options={options} onChange={(e) => onChange(e.target.value)} />;
}

/** One template for every list. Reads the resource config; writes go through commands. */
export function ListPage({ resource }: { resource: AnyResource }) {
  const list = resource.list!;
  const { params, set } = useListParams(resource);
  const go = useGo();
  const [q, setQ] = useState(params.search ?? '');
  const [selected, setSelected] = useState<string[]>([]);
  const key = resource.keys.list(params);

  useEffect(() => {
    setSelected([]);
  }, [JSON.stringify(params)]); // selection clears when the URL changes
  useEffect(() => {
    const t = setTimeout(() => {
      if ((q || undefined) !== params.search) set({ q });
    }, list.search?.debounceMs ?? 500);
    return () => clearTimeout(t);
  }, [q]);

  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => resource.data.getList(params, { signal }),
    staleTime: staleTimeFor(resource.data.cache),
    placeholderData: keepPreviousData,
  });

  const rows = (query.data?.items ?? []) as { id: string }[];
  const pageCtx = useCommandContext({ surface: 'button' });
  const bulkCtx = useCommandContext({
    surface: 'bulk',
    selection: { resource: resource.name, ids: selected, rows: rows.filter((r) => selected.includes(r.id)) },
  });
  const columns = list.columns
    .filter((c) => !c.hidden)
    .map((c) => ({
      id: c.id,
      header: c.header,
      cell: (row: unknown) => (
        <Cell spec={c.cell ? c.cell(row) : { kind: 'text', value: String((row as Record<string, unknown>)[c.id] ?? '') }} />
      ),
    }));
  const filtered = Boolean(params.search) || Object.keys(params.filters).length > 0;
  const max = list.selection?.max;
  /** Selection is per page; an optional cap keeps bulk calls inside what the API accepts (orders: 100), with a warning. */
  const select = (ids: string[]) => setSelected(max ? ids.slice(0, max) : ids);
  const capped = !!max && selected.length >= max;
  const Insights = list.insights && flags.isOn(list.insights.capability) ? resolveComponent(list.insights.component) : undefined;
  const rowHref = (r: { id: string }) =>
    list.rowLink === false
      ? undefined
      : typeof list.rowLink === 'function'
        ? list.rowLink(r as never)
        : resource.routes.detail?.replace('$id', r.id);

  return (
    <PageLayout>
      <PageHeader title={resource.label.plural} actions={<CommandButtons ids={resource.commands?.page ?? []} ctx={pageCtx} />} />
      {Insights && <Insights />}
      {list.views && <Tabs items={list.views.items} value={params.view ?? ''} onChange={(view) => set({ view })} />}
      <div className="flex flex-wrap items-center gap-2">
        {list.search && (
          <div className="w-72">
            <TextField placeholder={list.search.placeholder} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
          </div>
        )}
        {list.filters?.map((f) => (
          <div key={f.id} className="w-44">
            <FilterSelect
              resource={resource}
              f={f}
              value={
                f.type === 'multi_enum' ? ((params.filters[f.id] as string[] | undefined)?.[0] ?? '') : String(params.filters[f.id] ?? '')
              }
              onChange={(v) => set({ filters: { [f.id]: f.type === 'multi_enum' ? (v ? [v] : []) : v } })}
            />
          </div>
        ))}
        {query.isFetching && !query.isPending && <span className="text-xs text-muted">Refreshing…</span>}
      </div>
      {selected.length > 0 && (
        <BulkBar count={selected.length} onClear={() => setSelected([])}>
          {capped && <Banner tone="warning">You can act on at most {max} at a time.</Banner>}
          <CommandButtons ids={resource.commands?.bulk ?? []} ctx={bulkCtx} primaryLast={false} size="sm" />
        </BulkBar>
      )}
      {query.isPending && <Skeleton lines={8} />}
      {query.isError && <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />}
      {query.data &&
        rows.length === 0 &&
        (filtered ? (
          <EmptyState title="No results" body="Try clearing the search or filters." />
        ) : (
          <EmptyState
            title={list.empty.title}
            body={list.empty.body}
            action={list.empty.action ? <CommandButtons ids={[list.empty.action]} ctx={pageCtx} /> : undefined}
          />
        ))}
      {query.data && rows.length > 0 && (
        <DataTable
          columns={columns}
          rows={rows}
          selectable={list.selection?.enabled}
          selected={selected}
          onSelect={select}
          onRowClick={(r) => {
            const h = rowHref(r);
            if (h) go(h);
          }}
        />
      )}
      {query.data && <Pagination page={params.page} pageSize={list.pageSize} total={query.data.total} onChange={(page) => set({ page })} />}
    </PageLayout>
  );
}
