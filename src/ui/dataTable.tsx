import { useMemo } from 'react';
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { Checkbox } from './primitives';

export interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
}

/** Headless TanStack Table underneath; the kit only draws rows, selection and a sideways scroll. */
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  selectable,
  selected,
  onSelect,
  onRowClick,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  selectable?: boolean;
  selected?: string[];
  onSelect?: (ids: string[]) => void;
  onRowClick?: (row: T) => void;
}) {
  const defs = useMemo<ColumnDef<T>[]>(
    () => columns.map((c) => ({ id: c.id, header: c.header, cell: (ctx) => c.cell(ctx.row.original) })),
    [columns],
  );
  const table = useReactTable({ data: rows, columns: defs, getCoreRowModel: getCoreRowModel(), getRowId: (r) => r.id });
  const sel = new Set(selected ?? []);
  const all = rows.length > 0 && rows.every((r) => sel.has(r.id));
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full text-sm">
        <thead className="bg-neutral-soft text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            {selectable && (
              <th className="w-10 px-3 py-2">
                <Checkbox
                  checked={all}
                  aria-label="Select all"
                  onChange={(e) => onSelect?.(e.target.checked ? rows.map((r) => r.id) : [])}
                />
              </th>
            )}
            {table.getFlatHeaders().map((h) => (
              <th key={h.id} className="px-3 py-2 font-medium">
                {flexRender(h.column.columnDef.header, h.getContext())}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.getRowModel().rows.map((r) => (
            <tr key={r.id} className="border-t border-line hover:bg-bg" onClick={() => onRowClick?.(r.original)}>
              {selectable && (
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={sel.has(r.id)}
                    aria-label="Select row"
                    onChange={(e) => onSelect?.(e.target.checked ? [...sel, r.id] : [...sel].filter((x) => x !== r.id))}
                  />
                </td>
              )}
              {r.getVisibleCells().map((c) => (
                <td key={c.id} className="px-3 py-2 align-middle">
                  {flexRender(c.column.columnDef.cell, c.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
