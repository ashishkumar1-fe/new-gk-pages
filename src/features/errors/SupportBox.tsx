import { useState } from 'react';
import { useRouterState, useParams } from '@tanstack/react-router';
import { getLastApiBreadcrumb } from '@/platform/telemetry';
import { APP_VERSION } from '@/platform/config';
import { getStoreId } from '@/platform/merchant';
import { Button, TextArea } from '@/ui';

/** d44: everything a reporter needs on one screen, nothing sensitive. One screenshot is enough. */
export const SupportBox = ({ eventId }: { eventId?: string }) => {
  const route = useRouterState({ select: (s) => s.location });
  const params = useParams({ strict: false }) as Record<string, string | undefined>;
  const lastApi = getLastApiBreadcrumb();
  const [steps, setSteps] = useState('');
  const [copied, setCopied] = useState(false);
  const template = route.pathname.replace(/\/store\/[^/]+/, '/store/$storeId').replace(/\/(p_[^/]+)/, '/$id');
  const lines = [
    eventId && `Error ID: ${eventId}`,
    `Page: ${template}${params.id ? ` (${params.id})` : ''}`,
    `Filters: ${route.searchStr || '—'}`,
    `Time: ${new Date().toISOString()}`,
    `Version: ratio@${APP_VERSION}`,
    `Store: ${getStoreId()}`,
    lastApi && `Last API: ${lastApi.message} → ${String(lastApi.data?.status)} · req …${String(lastApi.data?.requestId ?? '').slice(-8)}`,
    steps && `Steps: ${steps}`,
  ]
    .filter(Boolean)
    .join('\n');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lines);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* fall back to selecting */
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <pre className="whitespace-pre-wrap rounded bg-neutral-soft p-3 font-mono text-xs text-ink">{lines}</pre>
      <TextArea placeholder="What were you doing? (optional)" value={steps} onChange={(e) => setSteps(e.target.value)} rows={2} />
      <div className="flex justify-end">
        <Button size="sm" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  );
};
