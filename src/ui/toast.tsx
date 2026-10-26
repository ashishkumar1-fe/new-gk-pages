import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'default' | 'warning' | 'critical';
interface Toast {
  id: number;
  message: string;
  tone: Tone;
}
let listeners: ((t: Toast[]) => void)[] = [];
let toasts: Toast[] = [];
let seq = 0;
const notify = () => listeners.forEach((l) => l(toasts));

/** Kit-internal queue: ordered, deduplicated by message. Surfaces call `toast()`; the kit draws it. */
export const toast = (message: string, tone: Tone = 'default') => {
  if (toasts.some((t) => t.message === message)) return;
  const t = { id: ++seq, message, tone };
  toasts = [...toasts, t];
  notify();
  setTimeout(
    () => {
      toasts = toasts.filter((x) => x.id !== t.id);
      notify();
    },
    tone === 'default' ? 3200 : 5000,
  );
};

/** Dark pill, bottom centre (design: shell toast). Critical and warning tones tint the pill. */
export const Toaster = () => {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    listeners.push(setItems);
    return () => {
      listeners = listeners.filter((l) => l !== setItems);
    };
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[90] flex flex-col items-center gap-2 lg:left-60" aria-live="polite">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            'pointer-events-auto animate-up rounded-md px-3.5 py-2.5 text-base shadow-lg',
            t.tone === 'critical'
              ? 'bg-a-danger text-white'
              : t.tone === 'warning'
                ? 'bg-a-warn-bg text-a-ink-900 shadow-ring-warn'
                : 'bg-a-ink-900 text-white',
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
};
