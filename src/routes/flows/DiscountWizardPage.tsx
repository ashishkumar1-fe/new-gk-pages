import { useDiscountWizard } from '@/machines/discountWizard';
import { Card, PageHeader, PageLayout } from '@/ui';

/** Hand-written flow route: /discounts/new and /discounts/$id run the five-step wizard machine; the finish dialog is the confirm. */
export const DiscountWizardPage = () => {
  const m = useDiscountWizard();
  return (
    <PageLayout>
      <PageHeader title="Discount" />
      <Card title="Wizard">
        <p className="text-sm text-muted">Step: {m.state}. Offer type · offer and code · eligibility · usage and stacking · review.</p>
      </Card>
    </PageLayout>
  );
};
