import { useParams, useRouterState } from '@tanstack/react-router';
import type { CommandContext, Surface } from '@/commands/define';
import { getStoreId } from '@/platform/merchant';
import { useMerchant } from '@/platform/useSession';

/** Builds the context every command run needs: staff and permissions from user/details; scopes pass while enforcement is off (v1). */
export function useCommandContext(partial: {
  surface: Surface;
  record?: unknown;
  selection?: CommandContext['selection'];
}): CommandContext {
  const params = useParams({ strict: false }) as { storeId?: string };
  const route = useRouterState({ select: (s) => s.location.pathname });
  const m = useMerchant();
  return {
    storeId: params.storeId ?? getStoreId(),
    staff: m.staff ?? { id: 'staff_demo', name: 'Demo staff' },
    can: m.can,
    route,
    ...partial,
  };
}
