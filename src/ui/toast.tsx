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
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    notify();
  }, 4000);
};

export const Toaster = () => {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    listeners.push(setItems);
    return () => {
      listeners = listeners.filter((l) => l !== setItems);
    };
  }, []);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite">
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto rounded-lg px-4 py-2 text-sm shadow',
            t.tone === 'critical'
              ? 'bg-critical text-surface'
              : t.tone === 'warning'
                ? 'bg-warning-soft text-warning'
                : 'bg-ink text-surface',
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
};
