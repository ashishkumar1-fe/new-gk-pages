import { Card, PageLayout } from '@/ui';
/** /pick-store: the Session machine lands here when the user has more than one merchant. */
export const PickStorePage = () => (
  <PageLayout>
    <Card title="Choose a store">
      <p className="text-sm text-muted">Merchants from user_details.allowed_merchants; internal users search.</p>
    </Card>
  </PageLayout>
);
