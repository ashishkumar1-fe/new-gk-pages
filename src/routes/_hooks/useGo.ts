import { useParams, useRouter } from '@tanstack/react-router';

/** Navigate inside the current store: go('/products/123'), go('/products', { view: 'draft' }). */
export function useGo() {
  const router = useRouter();
  const params = useParams({ strict: false }) as { storeId?: string };
  const storeId = params.storeId ?? 'demo-store';
  return (path: string, search?: Record<string, string | number | undefined>) => {
    const qs = search
      ? Object.entries(search)
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join('&')
      : '';
    router.history.push(`/store/${storeId}${path}${qs ? `?${qs}` : ''}`);
  };
}
