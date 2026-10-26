import { useEffect, useRef } from 'react';

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));

/**
 * Binds one shortcut ("mod+s", "j", "?") while the component is mounted, i.e. scoped to the screen that shows the command.
 * Shortcuts without a modifier never fire inside text inputs.
 */
export function useShortcut(combo: string, handler: () => void, enabled = true) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!enabled) return;
    const parts = combo.toLowerCase().split('+');
    const key = parts[parts.length - 1]!;
    const mod = parts.includes('mod');
    const onKey = (e: KeyboardEvent) => {
      if (mod !== (e.metaKey || e.ctrlKey)) return;
      if (e.key.toLowerCase() !== key) return;
      if (!mod && isTyping(e.target)) return;
      e.preventDefault();
      ref.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [combo, enabled]);
}
