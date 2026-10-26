import { useParams } from '@tanstack/react-router';
import { Card, PageLayout } from '@/ui';
/** /apps/$handle/*: embedded app in an iframe with the app bridge (docs/architecture/docs/extensions.md). */
export const AppPage = () => {
  const { handle } = useParams({ strict: false }) as { handle: string };
  return (
    <PageLayout>
      <Card title={`App: ${handle}`}>
        <p className="text-sm text-muted">Iframe + bridge host mounts here.</p>
      </Card>
    </PageLayout>
  );
};
