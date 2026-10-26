import { useState } from 'react';
import { Outlet, useParams, useRouterState } from '@tanstack/react-router';
import { resources } from '@/resources/registry';
import { AppFrame, Button, Dialog, Sidebar, TopBar, type NavGroup } from '@/ui';
import { useGo } from './_hooks/useGo';
import { SupportBox } from '@/features/errors/SupportBox';
import { JobsIndicator } from '@/features/jobs/JobsIndicator';
import { JobFlows } from '@/features/jobs/JobFlows';

/** Chrome: sidebar from resource nav, top bar, settings/assistant slots. Frames from the kit, filled here. */
export const StoreLayout = () => {
  const go = useGo();
  const { storeId } = useParams({ strict: false }) as { storeId?: string };
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [report, setReport] = useState(false);
  const groups: NavGroup[] = [];
  for (const r of [...resources].sort((a, b) => (a.nav?.position ?? 99) - (b.nav?.position ?? 99))) {
    if (!r.nav) continue;
    const g = groups.find((x) => x.label === r.nav!.group) ?? (groups.push({ label: r.nav.group, items: [] }), groups[groups.length - 1]!);
    const href = `/store/${storeId}${r.routes.list}`;
    g.items.push({ id: r.name, label: r.label.plural, href, active: path.startsWith(href), onClick: () => go(r.routes.list) });
  }
  return (
    <AppFrame
      sidebar={<Sidebar brand="Ratio" groups={groups} />}
      topbar={
        <TopBar
          left={
            <span>
              Store <strong className="text-ink">{storeId}</strong>
            </span>
          }
          right={
            <>
              <JobsIndicator />
              <Button size="sm" variant="ghost" onClick={() => setReport(true)}>
                Report a problem
              </Button>
            </>
          }
        />
      }
    >
      <Outlet />
      <JobFlows />
      <Dialog open={report} onOpenChange={setReport} title="Report a problem">
        <SupportBox />
      </Dialog>
    </AppFrame>
  );
};
