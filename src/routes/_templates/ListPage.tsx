import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { AnyResource, CellSpec, Column, Filter, Option } from '@/resources/define';
import { flags } from '@/platform/flags';
import { staleTimeFor } from '@/platform/query/cachePolicy';
import { formatDate, formatMoney } from '@/domain/shared/format';
import {
  Badge,
  Banner,
  Chip,
  DataTable,
  EmptyState,
  ErrorState,
  PageHeader,
  PageLayout,
  SearchBox,
  Select,
  TableLoader,
  Tabs,
  Thumb,
} from '@/ui';
import { useListParams } from '../_hooks/useListParams';
import { useCommandContext } from '../_hooks/useCommandContext';
import { useGo } from '../_hooks/useGo';
import { CommandButtons } from './CommandButtons';
import { resolveComponent } from '@/features/components';
import { navIconFor } from '@/features/nav';

/** A cell spec → the kit. Money and dates format here (domain/shared/format); status tones come from the card. */
const Cell = ({ spec }: { spec: CellSpec }) => {
  if ('component' in spec) {
    const C = resolveComponent(spec.component);
    return C ? <C /> : <span className="text-a-danger">?</span>;
  }
  switch (spec.kind) {
    case 'money':
      return <span className="tabular-nums">{formatMoney(spec.value)}</span>;
    case 'date':
      return <span className="text-a-ink-600">{formatDate(spec.value)}</span>;
    case 'status':
      return <Badge tone={spec.tone}>{spec.value}</Badge>;
    case 'count':
      return <span className="tabular-nums">{spec.value ?? '—'}</span>;
    case 'image_title':
      return (
        <span className="flex items-center gap-3">
          <Thumb src={spec.image} />
          <span className="line-clamp-2 min-w-0 leading-4">{spec.value}</span>
        </span>
      );
    default:
      return <span className="block truncate">{spec.value ?? '—'}</span>;
  }
};

/** Column widths from the kind of cell; the first column is the wide primary one (design: products/orders lists). */
const widthFor = (c: Column<unknown>, first: boolean, sample?: CellSpec) => {
  if (first) return 'minmax(260px,2.4fr)';
  if (!sample || 'component' in sample) return 'minmax(120px,1fr)';
  switch (sample.kind) {
    case 'status':
      return '120px';
    case 'money':
      return '110px';
    case 'date':
      return '150px';
    case 'count':
      return '80px';
    default:
      return 'minmax(120px,1fr)';
  }
};
const alignFor = (sample?: CellSpec): 'right' | undefined =>
  sample && !('component' in sample) && (sample.kind === 'money' || sample.kind === 'count') ? 'right' : undefined;

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
  return (
    <div className="w-44">
      <Select aria-label={f.label} placeholder={f.label} value={value} options={options} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** One template for every list (design: ListView). Reads the resource card; writes go through commands. */
export function ListPage({ resource }: { resource: AnyResource }) {
  const list = resource.list!;
  const { params, set } = useListParams(resource);
  const go = useGo();
  const [selected, setSelected] = useState<string[]>([]);
  const key = resource.keys.list(params);

  useEffect(() => {
    setSelected([]);
  }, [JSON.stringify(params)]); // selection clears when the URL changes

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
  const visible = list.columns.filter((c) => !c.hidden);
  const sample = rows[0];
  const columns = visible.map((c, i) => {
    const spec = sample && c.cell ? c.cell(sample) : undefined;
    return {
      id: c.id,
      header: c.header,
      width: widthFor(c as Column<unknown>, i === 0, spec),
      align: alignFor(spec),
      cell: (row: unknown) => (
        <Cell spec={c.cell ? c.cell(row) : { kind: 'text', value: String((row as Record<string, unknown>)[c.id] ?? '') }} />
      ),
    };
  });
  const activeFilters = Object.entries(params.filters).filter(([, v]) => (Array.isArray(v) ? v.length : v !== undefined && v !== ''));
  const filtered = Boolean(params.search) || activeFilters.length > 0;
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
  const views = list.views?.items.map((v) => ({ id: v.id, label: v.label }));

  return (
    <PageLayout>
      <PageHeader
        title={resource.label.plural}
        icon={navIconFor(resource.name, resource.icon)}
        actions={<CommandButtons ids={resource.commands?.page ?? []} ctx={pageCtx} />}
      />
      {Insights && <Insights />}
      <div className="flex flex-col gap-2">
        {views && <Tabs items={views} value={params.view ?? ''} onChange={(view) => set({ view })} />}
        <div className="flex flex-wrap items-center gap-2">
          {list.search && (
            <SearchBox
              value={params.search ?? ''}
              onChange={(q) => set({ q })}
              placeholder={list.search.placeholder}
              debounceMs={list.search.debounceMs}
              label={`Search and filter ${resource.label.plural.toLowerCase()}`}
            />
          )}
          {list.filters?.map((f) => (
            <FilterSelect
              key={f.id}
              resource={resource}
              f={f}
              value={
                f.type === 'multi_enum' ? ((params.filters[f.id] as string[] | undefined)?.[0] ?? '') : String(params.filters[f.id] ?? '')
              }
              onChange={(v) => set({ filters: { [f.id]: f.type === 'multi_enum' ? (v ? [v] : []) : v } })}
            />
          ))}
          {query.isFetching && !query.isPending && <span className="text-xs text-a-ink-450">Refreshing…</span>}
        </div>
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-a-ink-500">
            <span className="font-medium">Filtered by</span>
            {activeFilters.map(([id, v]) => {
              const f = list.filters?.find((x) => x.id === id);
              return (
                <Chip key={id} onRemove={() => set({ filters: { [id]: f?.type === 'multi_enum' ? [] : '' } })}>
                  {f?.label ?? id}: {Array.isArray(v) ? v.join(', ') : String(v)}
                </Chip>
              );
            })}
            <button
              type="button"
              onClick={() =>
                set({
                  filters: Object.fromEntries(
                    activeFilters.map(([id]) => [id, list.filters?.find((x) => x.id === id)?.type === 'multi_enum' ? [] : '']),
                  ),
                })
              }
              className="ml-1 text-a-blue hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
      {capped && <Banner tone="warning">You can act on at most {max} at a time.</Banner>}
      {query.isPending && (
        <TableLoader
          entity={resource.name + 's'}
          cols={visible.slice(0, 4).map((c) => c.header)}
          thumb={resource.name === 'customer' ? 'circle' : 'square'}
        />
      )}
      {query.isError && <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />}
      {query.data && (
        <DataTable
          columns={columns}
          rows={rows}
          selectable={list.selection?.enabled}
          selected={selected}
          onSelect={select}
          bulk={<CommandButtons ids={resource.commands?.bulk ?? []} ctx={bulkCtx} primaryLast={false} size="sm" />}
          minWidth={Math.max(860, 300 + visible.length * 120)}
          pagination={{ page: params.page, pageSize: list.pageSize, total: query.data.total, onChange: (page) => set({ page }) }}
          onRowClick={(r) => {
            const h = rowHref(r);
            if (h) go(h);
          }}
          empty={
            filtered ? (
              <EmptyState
                title={`No ${resource.label.plural.toLowerCase()} match these filters.`}
                action={
                  <button
                    type="button"
                    onClick={() =>
                      set({
                        q: '',
                        filters: Object.fromEntries((list.filters ?? []).map((f) => [f.id, f.type === 'multi_enum' ? [] : ''])),
                      })
                    }
                    className="text-sm text-a-blue hover:underline"
                  >
                    Clear filters
                  </button>
                }
              />
            ) : (
              <EmptyState
                title={list.empty.title}
                body={list.empty.body}
                action={list.empty.action ? <CommandButtons ids={[list.empty.action]} ctx={pageCtx} /> : undefined}
              />
            )
          }
        />
      )}
    </PageLayout>
  );
}
