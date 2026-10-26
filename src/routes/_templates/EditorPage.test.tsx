import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { handlers } from '@/mocks/handlers';
import { createAppRouter } from '@/routes/router';
import { configureCommandHost } from '@/commands/host';

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const mount = (path: string) => {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
};

describe('EditorPage (product) save through runCommand', () => {
  it('loads the record into the form, saves through the command and toasts', async () => {
    const toast = vi.fn();
    configureCommandHost({ toast, confirm: async () => true, navigate: () => {} });
    mount('/store/demo-store/products/p_1001');
    const title = (await screen.findByLabelText('Title', {}, { timeout: 4000 })) as HTMLInputElement;
    expect(title.value).toBe('Blue Cotton Shirt');
    expect(screen.getByText('BCS-M')).toBeInTheDocument(); // variantsCard custom component rendered

    fireEvent.input(title, { target: { value: 'Blue Cotton Shirt v2' } });
    fireEvent.blur(title);
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith('Product saved', 'default'), { timeout: 4000 });
  });

  it('shows the field error when the schema rejects the draft', async () => {
    configureCommandHost({ toast: () => {}, confirm: async () => true, navigate: () => {} });
    mount('/store/demo-store/products/p_1002');
    const title = (await screen.findByLabelText('Title', {}, { timeout: 4000 })) as HTMLInputElement;
    fireEvent.input(title, { target: { value: '   ' } });
    fireEvent.blur(title);
    expect(await screen.findByText('Title is required')).toBeInTheDocument();
  });
});

describe('EditorPage create with a source (product.duplicate prefill)', () => {
  it('prefills "(Copy)", draft status and a "-copy" handle from the source product', async () => {
    configureCommandHost({ toast: () => {}, confirm: async () => true, navigate: () => {} });
    mount('/store/demo-store/products/new?sourceId=p_1001');
    const title = (await screen.findByLabelText('Title', {}, { timeout: 4000 })) as HTMLInputElement;
    expect(title.value).toMatch(/^Blue Cotton Shirt.* \(Copy\)$/); // the mock store keeps earlier saves in this file
    expect((screen.getByLabelText('Status') as HTMLSelectElement).value).toBe('draft');
    fireEvent.click(screen.getByRole('button', { name: 'Edit' })); // Search engine listing is collapsed by default
    expect((screen.getByLabelText('URL handle') as HTMLInputElement).value).toMatch(/-copy$/);
  });
});
