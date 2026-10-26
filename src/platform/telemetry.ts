/** Sentry/PostHog wiring. In the demo it keeps breadcrumbs in memory and logs; the shape is what the real wiring will send. */
export interface Breadcrumb {
  category: 'api' | 'command' | 'nav';
  message: string;
  data?: Record<string, unknown>;
  at: number;
}
const crumbs: Breadcrumb[] = [];
export const addBreadcrumb = (b: Omit<Breadcrumb, 'at'>) => {
  crumbs.push({ ...b, at: Date.now() });
  if (crumbs.length > 100) crumbs.shift();
};
export const getBreadcrumbs = () => crumbs.slice();
export const getLastApiBreadcrumb = () => [...crumbs].reverse().find((c) => c.category === 'api');
export const captureException = (e: unknown, ctx?: Record<string, unknown>): string => {
  const id = Math.random().toString(16).slice(2, 10);
  console.error('[sentry]', id, e, ctx);
  return id;
};
export const reportDrift = (service: string, endpoint: string, issue: unknown) => console.warn('[schema drift]', service, endpoint, issue);
export const track = (event: string, props: Record<string, unknown>) => console.info('[posthog]', event, props);
