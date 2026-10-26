import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

/** Click to open; Escape or a click outside closes. The trigger keeps focus semantics (aria-expanded, aria-controls). */
export const Popover = ({ trigger, children }: { trigger: ReactNode; children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="rounded px-2 py-1 text-ink hover:bg-neutral-soft"
      >
        {trigger}
      </button>
      {open && (
        <div id={id} role="dialog" className="absolute right-0 z-30 mt-1 rounded-lg border border-line bg-surface p-3 shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
};
