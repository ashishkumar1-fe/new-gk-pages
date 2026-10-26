export type Permission = `${'read' | 'write'}_${string}`;

/** Our scopes map to backend permission strings in one table. Unmapped scopes pass while enforcement is off (v1). */
export const ENFORCE = false; // ← one switch once roles are defined (d08)

const scopeToBackend: Partial<Record<Permission, string>> = {
  read_orders: 'view_order',
  write_refunds: 'refund',
  read_reports: 'view_reports', // gk-pages RatioReportsHome.tsx:31 (PermissionValues.reports.view)
  read_unmasked_reports: 'view_unmasked_report', // gk-pages GenerateReportsTab.tsx:135 (reports.viewUnmaskedReport)
};

/** The two checks that carry over from gk-pages main: they apply even while ENFORCE is off (TRD 3.5). */
const ALWAYS_ENFORCED = new Set<Permission>(['read_reports', 'read_unmasked_reports']);

export const makeCan =
  (backendPermissions: string[]) =>
  (scope: Permission): boolean => {
    if (!ENFORCE && !ALWAYS_ENFORCED.has(scope)) return true;
    const b = scopeToBackend[scope];
    return b ? backendPermissions.includes(b) : true;
  };

/** Entitlement: the per-merchant flag is the single source of truth (d03, d04). */
export const hasPages = (selectedProducts: Record<string, boolean> | undefined) => selectedProducts?.pages === true;
