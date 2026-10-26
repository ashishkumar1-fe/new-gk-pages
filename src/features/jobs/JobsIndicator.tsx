import { useJobProgress, useJobs, type TrackedJob } from '@/machines/jobs';
import { Button, Popover, ProgressBar } from '@/ui';

const Row = ({ job, onCancel }: { job: TrackedJob; onCancel: () => void }) => {
  const p = useJobProgress(job);
  const pct = p.progress && p.progress.total > 0 ? Math.round((p.progress.done / p.progress.total) * 100) : undefined;
  return (
    <div className="flex flex-col gap-1 py-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span>{job.label}</span>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      <ProgressBar value={pct} label={`${job.label} progress`} />
      <span className="text-xs text-muted">
        {p.state === 'Paused'
          ? 'Paused while this tab is hidden'
          : pct !== undefined
            ? `${p.progress!.done} of ${p.progress!.total} rows`
            : 'Starting…'}
      </span>
    </div>
  );
};

/** Top-bar jobs indicator: reads the Jobs machine's children. Hidden when nothing runs. */
export const JobsIndicator = () => {
  const { jobs, cancel } = useJobs();
  if (jobs.length === 0) return null;
  return (
    <Popover
      trigger={
        <span className="text-sm">
          {jobs.length} job{jobs.length === 1 ? '' : 's'} running
        </span>
      }
    >
      <div className="w-72 divide-y divide-line">
        {jobs.map((j) => (
          <Row key={j.jobId} job={j} onCancel={() => cancel(j.jobId)} />
        ))}
      </div>
    </Popover>
  );
};
