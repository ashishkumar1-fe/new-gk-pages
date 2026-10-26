import { useId, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useDismiss } from './primitives';

/**
 * Click to open; Escape or a click outside closes. `trigger` renders the opener itself (a Button or IconButton) and
 * receives (open, toggle), so no button is ever nested inside another.
 */
export const Popover = ({
  trigger,
  children,
  align = 'right',
  up,
}: {
  trigger: (open: boolean, toggle: () => void) => ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  up?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));
  return (
    <div ref={ref} className="relative" aria-controls={id}>
      {trigger(open, () => setOpen((o) => !o))}
      {open && (
        <div
          id={id}
          role="dialog"
          className={cn(
            'absolute z-50 animate-dd rounded-md bg-white p-3 shadow-menu',
            up ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+6px)]',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
};
