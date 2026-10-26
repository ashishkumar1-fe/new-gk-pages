import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './icons';
import { AryaMark, Menu, type MenuItem } from './primitives';

/* Assistant surfaces from ratio-website/src/components/admin/arya.tsx: composer, dock, note, message bubbles. Presentational. */

/** Message box. `big` is the home hero version with the travelling border beam. */
export const Composer = ({
  big,
  beam,
  placeholder,
  onSend,
  autoFocus,
  quick,
  recents,
  disabled,
}: {
  big?: boolean;
  beam?: boolean;
  placeholder?: string;
  onSend: (text: string) => void;
  autoFocus?: boolean;
  /** quick prompts under the + button */
  quick?: string[];
  recents?: string[];
  disabled?: boolean;
}) => {
  const [v, setV] = useState('');
  const send = (t = v) => {
    if (!t.trim() || disabled) return;
    onSend(t.trim());
    setV('');
  };
  const quickItems: MenuItem[] = (quick ?? []).map((q) => ({ label: q, icon: 'sparkle', onClick: () => send(q) }));
  const recentItems: MenuItem[] = recents?.length
    ? recents.slice(0, 5).map((r) => ({ label: r.length > 44 ? `${r.slice(0, 44)}…` : r, icon: 'history', onClick: () => send(r) }))
    : [{ label: 'No recent chats yet', disabled: true }];
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      className={cn(
        'relative rounded-xl bg-white transition-shadow duration-120',
        big ? 'p-3 shadow-composer' : 'p-2 shadow-card focus-within:shadow-[0_0_0_1px_#F5A3C0,0_0_0_4px_rgba(217,70,143,0.08)]',
        beam && 'arya-beam',
      )}
    >
      <div className="flex gap-3">
        {big && (
          <span className="mt-1">
            <AryaMark size="lg" />
          </span>
        )}
        <textarea
          value={v}
          autoFocus={autoFocus}
          disabled={disabled}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={big ? 2 : 1}
          aria-label="Message Arya"
          placeholder={placeholder ?? 'Ask Arya anything'}
          className={cn(
            'block min-w-0 flex-1 resize-none bg-transparent text-a-ink-800 outline-none placeholder:text-a-ink-450',
            big ? 'min-h-[56px] pt-1.5 text-md' : 'max-h-32 px-1.5 py-1 text-base',
          )}
        />
      </div>
      <div className={cn('flex items-center gap-1', big ? 'mt-2 pl-11' : 'mt-1')}>
        {big && (
          <Menu
            align="left"
            items={recentItems}
            trigger={(open, toggle) => (
              <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                className="flex h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-a-ink-600 hover:bg-a-line-100"
              >
                <Icon name="history" size={16} /> Recents
              </button>
            )}
          />
        )}
        {quickItems.length > 0 && (
          <Menu
            align="left"
            items={quickItems}
            trigger={(open, toggle) => (
              <button
                type="button"
                onClick={toggle}
                aria-label="Quick prompts"
                aria-expanded={open}
                className="flex h-8 w-8 items-center justify-center rounded-md text-a-ink-600 hover:bg-a-line-100"
              >
                <Icon name="plus" size={16} />
              </button>
            )}
          />
        )}
        <span className="flex-1" />
        <button
          type="submit"
          disabled={!v.trim() || disabled}
          aria-label="Send"
          className="arya-grad flex h-8 w-8 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-30"
        >
          <Icon name="send" size={16} strokeWidth={2} />
        </button>
      </div>
    </form>
  );
};

/** Floating pill at the bottom of every page but Home. */
export const AssistantDock = ({ onOpen, context }: { onOpen: () => void; context?: string }) => (
  <div className="pointer-events-none fixed inset-x-0 bottom-5 z-30 flex justify-center lg:left-60">
    <div className="pointer-events-auto flex animate-up items-center gap-1 rounded-full bg-white p-1.5 pl-2 shadow-bar">
      <button type="button" onClick={onOpen} className="flex h-8 items-center gap-2 rounded-full pl-0.5 pr-3 hover:bg-a-line-100">
        <AryaMark />
        <span className="text-base font-medium text-a-ink-800">Work with Arya</span>
        {context && <span className="hidden text-xs text-a-ink-450 sm:inline">on {context}</span>}
      </button>
      <span className="h-5 w-px bg-a-line-150" />
      <button
        type="button"
        onClick={onOpen}
        aria-label="New chat"
        className="flex h-8 w-8 items-center justify-center rounded-full text-a-ink-600 hover:bg-a-line-100"
      >
        <Icon name="plus" />
      </button>
      <button
        type="button"
        onClick={onOpen}
        aria-label="Open Arya panel"
        className="flex h-8 w-8 items-center justify-center rounded-full text-a-ink-600 hover:bg-a-line-100"
      >
        <Icon name="panel" />
      </button>
    </div>
  </div>
);

/** Chat bubble. Arya's carry the mark; the person's sit right. */
export const ChatMessage = ({ role, children }: { role: 'user' | 'arya'; children: ReactNode }) =>
  role === 'user' ? (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-xl rounded-br-sm bg-a-ink-900 px-3.5 py-2 text-base text-white">{children}</div>
    </div>
  ) : (
    <div className="flex gap-2.5">
      <AryaMark size="sm" />
      <div className="min-w-0 flex-1 text-base leading-5 text-a-ink-800">{children}</div>
    </div>
  );

/** Suggestion chip row (home hero). */
export const PromptChips = ({
  items,
  onPick,
}: {
  items: { label: string; count?: number; prompt: string }[];
  onPick: (p: string) => void;
}) => (
  <div className="flex flex-wrap justify-center gap-2">
    {items.map((c) => (
      <button
        key={c.label}
        type="button"
        onClick={() => onPick(c.prompt)}
        className="group flex h-9 items-center gap-2 rounded-full bg-white pl-3.5 pr-2 text-base font-medium text-a-ink-800 shadow-ring-line transition-[background,box-shadow] duration-120 hover:bg-a-arya-soft hover:shadow-ring-arya"
      >
        {c.label}
        {c.count ? (
          <span className="rounded-full bg-a-line-100 px-1.5 text-xs tabular-nums text-a-ink-600 group-hover:bg-white">{c.count}</span>
        ) : (
          <Icon name="sparkle" size={14} tone="arya" />
        )}
      </button>
    ))}
  </div>
);
