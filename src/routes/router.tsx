import { createRootRoute, createRoute, createRouter, Outlet, redirect, useParams, type RouterHistory } from '@tanstack/react-router';
import { resources } from '@/resources/registry';
import { getStoreId, setStoreId } from '@/platform/merchant';
import { queryClient } from '@/platform/query/queryClient';
import { stopAllJobs } from '@/machines/jobs';
import { StoreLayout } from './StoreLayout';
import { ListPage } from './_templates/ListPage';
import { EditorPage } from './_templates/EditorPage';
import { DetailPage } from './_templates/DetailPage';
import { RouteErrorCard } from '@/features/errors/RouteErrorCard';
import { OrderEditPage } from './flows/OrderEditPage';
import { DiscountWizardPage } from './flows/DiscountWizardPage';
import { LoginPage } from './flows/LoginPage';
import { PickStorePage } from './flows/PickStorePage';
import { NoAccessPage } from './flows/NoAccessPage';
import { AppPage } from './flows/AppPage';

const rootRoute = createRootRoute({ component: () => <Outlet />, errorComponent: RouteErrorCard });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ href: '/store/demo-store/products' });
  },
});

const storeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/store/$storeId',
  /** Opening another store's link switches first: stop merchant-scoped actors and clear the cache, so stores never mix (d31). */
  beforeLoad: ({ params }) => {
    if (getStoreId() !== params.storeId) {
      stopAllJobs();
      queryClient.clear();
    }
    setStoreId(params.storeId);
  },
  component: StoreLayout,
  errorComponent: RouteErrorCard,
});
const storeIndex = createRoute({
  getParentRoute: () => storeRoute,
  path: '/',
  beforeLoad: ({ params }) => {
    throw redirect({ href: `/store/${params.storeId}/products` });
  },
});

/** List, editor and create routes are generated from the registry. Flow routes are written by hand beside them. */
const search = (s: Record<string, unknown>) => s as Record<string, string | undefined>;
/** Resources whose create/detail screens are hand-written flow routes below (wizard), not the editor template. */
const handWritten = new Set(['discount']);
const generated = resources.flatMap((r) => {
  const rel = (p: string) => p.replace(/^\//, '');
  const out = [
    createRoute({
      getParentRoute: () => storeRoute,
      path: rel(r.routes.list),
      validateSearch: search,
      component: () => <ListPage resource={r} />,
    }),
  ];
  if (r.routes.create && r.editor && !handWritten.has(r.name))
    out.push(
      createRoute({
        getParentRoute: () => storeRoute,
        path: rel(r.routes.create),
        validateSearch: search,
        component: () => <EditorPage resource={r} />,
      }),
    );
  if (r.routes.detail && (r.editor || r.detail) && !handWritten.has(r.name)) {
    const Detail = () => {
      const { id } = useParams({ strict: false }) as { id: string };
      return r.editor ? <EditorPage key={id} resource={r} id={id} /> : <DetailPage key={id} resource={r} id={id} />;
    };
    out.push(createRoute({ getParentRoute: () => storeRoute, path: rel(r.routes.detail), component: Detail }));
  }
  return out;
});

/** Flow routes, written by hand. */
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: LoginPage });
const pickStoreRoute = createRoute({ getParentRoute: () => rootRoute, path: '/pick-store', component: PickStorePage });
const noAccessRoute = createRoute({ getParentRoute: () => rootRoute, path: '/no-access', component: NoAccessPage });
const orderEditRoute = createRoute({ getParentRoute: () => storeRoute, path: 'orders/$id/edit', component: OrderEditPage });
const discountNewRoute = createRoute({ getParentRoute: () => storeRoute, path: 'discounts/new', component: DiscountWizardPage });
const discountEditRoute = createRoute({ getParentRoute: () => storeRoute, path: 'discounts/$id', component: DiscountWizardPage });
const appRoute = createRoute({ getParentRoute: () => storeRoute, path: 'apps/$handle', component: AppPage });

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  pickStoreRoute,
  noAccessRoute,
  storeRoute.addChildren([storeIndex, ...generated, orderEditRoute, discountNewRoute, discountEditRoute, appRoute]),
]);
export const createAppRouter = (history?: RouterHistory) => createRouter({ routeTree, defaultPreload: 'intent', history });
export const router = createAppRouter();
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
