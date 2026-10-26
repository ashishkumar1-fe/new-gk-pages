import { useQuery } from '@tanstack/react-query';
import { getUserDetails, type UserDetails } from './session';
import { getStoreId } from './merchant';
import { makeCan } from './permissions';
import { staleTimeFor } from './query/cachePolicy';

/** React Query is the source of truth for user and merchant data (d12); sessionStorage only mirrors the store id. */
export const userDetailsKey = ['session', 'userDetails'] as const;
export function useUserDetails() {
  return useQuery<UserDetails>({
    queryKey: userDetailsKey,
    queryFn: ({ signal }) => getUserDetails(signal),
    staleTime: staleTimeFor('lookup'),
    retry: false,
  });
}

/** The selected merchant: storeId from the route (mirrored for non-React code), details from user/details. */
export function useMerchant() {
  const q = useUserDetails();
  const storeId = getStoreId();
  const allowed = q.data?.user_details.allowed_merchants ?? [];
  const merchant = allowed.find((m) => m.m_id === storeId);
  return {
    storeId,
    name: merchant?.business_name,
    numericId: merchant?.id, // only for POST /team/switch-merchant
    allowed,
    staff: q.data
      ? { id: q.data.user_details.email, name: q.data.user_details.name ?? q.data.user_details.email, email: q.data.user_details.email }
      : undefined,
    can: makeCan(q.data?.user_details.role.permissions ?? []),
    isLoading: q.isPending,
  };
}
