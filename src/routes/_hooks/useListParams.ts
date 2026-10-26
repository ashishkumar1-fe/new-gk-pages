import { useSearch } from '@tanstack/react-router';
import type { AnyResource, ListParams } from '@/resources/define';
import { useGo } from './useGo';

/** View state lives in the URL: ?view=active&q=shirt&vendor=Nike,Puma&page=2. Changing anything but page resets page. */
export function useListParams(resource: AnyResource) {
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const go = useGo();
  const list = resource.list!;
  const str = (k: string) => (search[k] === undefined ? undefined : String(search[k]));
  const filters: Record<string, unknown> = {};
  for (const f of list.filters ?? []) {
    const v = str(f.id);
    if (v) filters[f.id] = f.type === 'multi_enum' ? v.split(',') : v;
  }
  const params: ListParams = {
    view: str('view') ?? list.views?.items[0]?.id,
    search: str('q') || undefined,
    filters,
    page: Math.max(1, Number(str('page') ?? 1) || 1),
    limit: list.pageSize,
  };
  const set = (patch: { view?: string; q?: string; page?: number; filters?: Record<string, unknown> }) => {
    const next: Record<string, string | number | undefined> = {
      view: patch.view ?? params.view,
      q: patch.q ?? params.search,
      page: patch.page ?? 1,
    };
    const f = { ...filters, ...(patch.filters ?? {}) };
    for (const [k, v] of Object.entries(f)) next[k] = Array.isArray(v) ? (v.length ? v.join(',') : undefined) : (v as string | undefined);
    if (next.page === 1) next.page = undefined;
    if (next.view === list.views?.items[0]?.id) next.view = undefined;
    go(resource.routes.list, next);
  };
  return { params, set };
}
