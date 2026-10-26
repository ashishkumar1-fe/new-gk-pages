import { useQuery } from '@tanstack/react-query';
import type { AnyResource } from '@/resources/define';
import { staleTimeFor } from '@/platform/query/cachePolicy';
import { Button, Card, ErrorState, PageHeader, PageLayout, Skeleton } from '@/ui';
import { useCommandContext } from '../_hooks/useCommandContext';
import { useGo } from '../_hooks/useGo';
import { useShortcut } from '../_hooks/useShortcut';
import { CommandButtons } from './CommandButtons';
import { resolveComponent } from '@/features/components';

/** Read view with record actions (orders). Previous/next come from the pager, bound to j / k on this screen only. */
export function DetailPage({ resource, id }: { resource: AnyResource; id: string }) {
  const go = useGo();
  const query = useQuery({
    queryKey: resource.keys.detail(id),
    queryFn: ({ signal }) => resource.data.getOne(id, { signal }),
    staleTime: staleTimeFor('detail'),
  });
  const ctx = useCommandContext({ surface: 'button', record: query.data });
  const pager = query.data && resource.detail?.pager ? resource.detail.pager(query.data) : undefined;
  const toRecord = (rid?: string) => {
    if (rid && resource.routes.detail) go(resource.routes.detail.replace('$id', rid));
  };
  useShortcut('k', () => toRecord(pager?.previous), !!pager?.previous);
  useShortcut('j', () => toRecord(pager?.next), !!pager?.next);
  if (query.isPending)
    return (
      <PageLayout>
        <Skeleton lines={10} />
      </PageLayout>
    );
  if (query.isError)
    return (
      <PageLayout>
        <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />
      </PageLayout>
    );
  const more = resource.commands?.more ? resource.commands.more(query.data) : [];
  const primary = resource.commands?.primary?.(query.data);
  const edit = resource.detail?.editRoute?.(query.data);
  return (
    <PageLayout>
      <PageHeader
        title={resource.title(query.data)}
        back={{ label: resource.label.plural, onClick: () => go(resource.routes.list) }}
        actions={
          <>
            {pager && (
              <>
                <Button size="sm" variant="ghost" disabled={!pager.previous} title="Previous (k)" onClick={() => toRecord(pager.previous)}>
                  Previous
                </Button>
                <Button size="sm" variant="ghost" disabled={!pager.next} title="Next (j)" onClick={() => toRecord(pager.next)}>
                  Next
                </Button>
              </>
            )}
            {edit && <Button onClick={() => go(edit)}>Edit</Button>}
            <CommandButtons ids={primary ? [...more, primary] : more} ctx={ctx} primaryLast={!!primary} />
          </>
        }
      />
      {resource.detail?.layout.main.map((s) => {
        if (s.visibleWhen && !s.visibleWhen(query.data)) return null;
        const C = 'component' in s ? resolveComponent(s.component) : undefined;
        return (
          <Card key={s.id} title={s.title}>
            {C ? <C record={query.data} /> : <pre className="text-xs">{JSON.stringify(query.data, null, 2)}</pre>}
          </Card>
        );
      })}
    </PageLayout>
  );
}
