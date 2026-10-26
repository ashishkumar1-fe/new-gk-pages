/** The current storeId (merchant m_id). React Query is the source of truth in the full app; the demo mirrors it in sessionStorage. */
const KEY = 'merchant-mid';
export const getStoreId = (): string => {
  try {
    return sessionStorage.getItem(KEY) ?? 'demo-store';
  } catch {
    return 'demo-store';
  }
};
export const setStoreId = (id: string) => {
  try {
    sessionStorage.setItem(KEY, id);
  } catch {
    /* private mode */
  }
};
