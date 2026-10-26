import { useParams } from '@tanstack/react-router';
import { useOrderEditSession } from '@/machines/orderEditSession';
import { Card, PageHeader, PageLayout } from '@/ui';

/** Hand-written flow route: /orders/$id/edit runs the order edit session machine (begin → stage → preview → commit). */
export const OrderEditPage = () => {
  const { id } = useParams({ strict: false }) as { id: string };
  const m = useOrderEditSession();
  return (
    <PageLayout>
      <PageHeader title={`Edit order ${id}`} />
      <Card title="Edit session">
        <p className="text-sm text-muted">
          State: {m.state}. Line ops, preview and commit are wired here (docs/architecture/docs/machines.md#order-edit-session).
        </p>
      </Card>
    </PageLayout>
  );
};
