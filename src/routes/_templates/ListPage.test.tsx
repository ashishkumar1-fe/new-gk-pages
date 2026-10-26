import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { handlers } from '@/mocks/handlers';
import { createAppRouter } from '@/routes/router';

/** Integration: the same fixtures MSW serves in the browser render the generated list page. No backend. */
const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ListPage (products) through all layers', () => {
  it('renders the products list from the recorded fixture', async () => {
    const router = createAppRouter(createMemoryHistory({ initialEntries: ['/store/demo-store/products'] }));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );
    expect(await screen.findByText('Blue Cotton Shirt', {}, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getByText('50 in stock for 3 variants')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Products' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('1 – 6 of 6 results')).toBeInTheDocument());
  });

  it('applies the view from the URL (draft tab shows only drafts)', async () => {
    const router = createAppRouter(createMemoryHistory({ initialEntries: ['/store/demo-store/products?view=draft'] }));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );
    expect(await screen.findByText('Yoga Mat Pro', {}, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.queryByText('Blue Cotton Shirt')).not.toBeInTheDocument();
  });
});
