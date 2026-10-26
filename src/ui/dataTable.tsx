import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Checkbox } from './primitives';
import { Pagination } from './patterns';

export interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** CSS grid track, e.g. "minmax(300px,2.6fr)" or "90px". Default "minmax(120px,1fr)". */
  width?: string;
  align?: 'right' | 'center';
}

/**
 * The one list frame (design: Admin List Views). CSS grid rows, selection column, bulk actions replacing the header
 * while anything is selected, row click, and the pager in the footer. Sorting and column choice come later.
 */
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  selectable,
  selected,
  onSelect,
  onRowClick,
  bulk,
  minWidth = 860,
  pagination,
  empty,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  selectable?: boolean;
  selected?: string[];
  onSelect?: (ids: string[]) => void;
  onRowClick?: (row: T) => void;
  /** rendered in the header while rows are selected */
  bulk?: ReactNode;
  minWidth?: number;
  pagination?: { page: number; pageSize: number; total: number; onChange: (p: number) => void };
  empty?: ReactNode;
}) {
  const sel = new Set(selected ?? []);
  const allOn = rows.length > 0 && rows.every((r) => sel.has(r.id));
  const grid = `${selectable ? '40px ' : ''}${columns.map((c) => c.width ?? 'minmax(120px,1fr)').join(' ')}`;
  const toggleAll = () => {
    const s = new Set(sel);
    rows.forEach((r) => (allOn ? s.delete(r.id) : s.add(r.id)));
    onSelect?.([...s]);
  };
  const toggle = (id: string) => {
    const s = new Set(sel);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    onSelect?.([...s]);
  };
  return (
    <div className="a-card overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ minWidth }}>
          <div className="grid h-10 items-center gap-3 border-b border-a-line-100 px-3" style={{ gridTemplateColumns: grid }}>
            {selectable && <Checkbox checked={allOn} onChange={toggleAll} aria-label="Select all on this page" />}
            {sel.size > 0 ? (
              <div className="col-span-full col-start-2 flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-a-ink-800">{sel.size} selected</span>
                {bulk}
                <button type="button" onClick={() => onSelect?.([])} className="text-sm text-a-ink-500 hover:text-a-ink-800">
                  Clear
                </button>
              </div>
            ) : (
              columns.map((c) => (
                <span
                  key={c.id}
                  className={cn(
                    'truncate text-xs font-medium uppercase tracking-[0.2px] text-a-ink-500',
                    c.align === 'right' && 'text-right',
                    c.align === 'center' && 'text-center',
                  )}
                >
                  {c.header}
                </span>
              ))
            )}
          </div>
          {rows.length === 0 && empty}
          {rows.map((r) => (
            <div
              key={r.id}
              role={onRowClick ? 'link' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={() => onRowClick?.(r)}
              onKeyDown={(e) => e.key === 'Enter' && onRowClick?.(r)}
              className={cn(
                'grid min-h-12 items-center gap-3 border-b border-a-line-100 px-3 py-1.5 text-sm text-a-ink-800 transition-colors duration-120 last:border-0',
                onRowClick && 'cursor-pointer hover:bg-[#F9FAFC]',
                sel.has(r.id) && 'bg-[#F5F6FF]',
              )}
              style={{ gridTemplateColumns: grid }}
            >
              {selectable && (
                <span onClick={(e) => e.stopPropagation()} className="flex">
                  <Checkbox checked={sel.has(r.id)} onChange={() => toggle(r.id)} aria-label="Select row" />
                </span>
              )}
              {columns.map((c) => (
                <div key={c.id} className={cn('min-w-0', c.align === 'right' && 'text-right', c.align === 'center' && 'text-center')}>
                  {c.cell(r)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {pagination && <Pagination {...pagination} />}
    </div>
  );
}
