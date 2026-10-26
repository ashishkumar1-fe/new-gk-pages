/** Sent with each message so "refund these" works: route, resource, filters (from the URL), selected ids, open record id. A chip shows what is shared. */
export interface ScreenContext {
  route: string;
  resource?: string;
  filters?: Record<string, unknown>;
  selectedIds?: string[];
  recordId?: string;
}
export const collectScreenContext = (input: ScreenContext): ScreenContext => input;
