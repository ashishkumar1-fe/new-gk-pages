import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { handlers } from '@/mocks/handlers';
import { createAppRouter } from '@/routes/router';

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterAll(() => server.close());
const mount = (path: string) => {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
};
/** Flow routes render inside the chrome: login (no store) and home (store index, product data via MSW). */
describe('flow routes', () => {
  it('/login renders the sign-in form', async () => {
    mount('/login');
    expect(await screen.findByText('Sign in', {}, { timeout: 4000 })).toBeInTheDocument();
  });
  it('/store/:id renders Home with the Arya hero', async () => {
    mount('/store/demo-store');
    expect(await screen.findByText(/continue growing/, {}, { timeout: 4000 })).toBeInTheDocument();
  });
});
