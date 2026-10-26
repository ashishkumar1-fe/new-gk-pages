import { Card, PageLayout } from '@/ui';
/** /no-access: selected_products.pages is false for this merchant (d03, d04). */
export const NoAccessPage = () => (
  <PageLayout>
    <Card title="You don’t have access">
      <p className="text-sm text-muted">Talk to sales to enable Ratio for this store.</p>
    </Card>
  </PageLayout>
);
