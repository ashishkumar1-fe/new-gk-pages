import { useMemo } from 'react';
import { captureException } from '@/platform/telemetry';
import { Button, Card } from '@/ui';
import { SupportBox } from './SupportBox';

/** Route-level boundary: the rest of the app keeps working; never a blank screen (d26). */
export const RouteErrorCard = ({ error, reset }: { error: unknown; reset: () => void }) => {
  const eventId = useMemo(() => captureException(error, { boundary: 'route' }), [error]);
  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card tone="critical" title="Something went wrong here">
        <p className="mb-3 text-sm text-muted">{error instanceof Error ? error.message : 'Unexpected error'}</p>
        <div className="mb-4">
          <Button variant="primary" onClick={reset}>
            Retry
          </Button>
        </div>
        <SupportBox eventId={eventId} />
      </Card>
    </div>
  );
};
