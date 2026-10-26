import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { queryClient } from '@/platform/query/queryClient';
import { MOCKS } from '@/platform/config';
import { router } from '@/routes/router';
import { CommandHost } from '@/routes/CommandHost';
import { Toaster } from '@/ui';
import './main.css';

async function start() {
  if (MOCKS) {
    const { worker } = await import('@/mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass', quiet: true });
  }
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <CommandHost>
          <RouterProvider router={router} />
        </CommandHost>
        <Toaster />
      </QueryClientProvider>
    </React.StrictMode>,
  );
}
void start();
