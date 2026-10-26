import { cn } from '@/lib/cn';

/** 16px stroke icons for the admin (24px grid). Paths from ratio-website/src/components/admin/ui.tsx, unchanged. */
const P = {
  home: 'M4 10.5 12 4l8 6.5V20h-5.5v-5.5h-5V20H4z',
  orders: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  products: 'M3.5 7.5h17V19a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1zm0 0L5 4h14l1.5 3.5M9.5 11h5',
  customers: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  growth: 'M4 17 10 11l4 4 6-7M15 8h5v5',
  discounts: 'M20 12 12 20l-8-8V4h8zM8.5 8.5h.01',
  content: 'M5 4h14v16H5zM8.5 8.5h7M8.5 12h7M8.5 15.5h4',
  markets: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-9-9h18M12 3c2.5 2.7 3.5 5.7 3.5 9s-1 6.3-3.5 9c-2.5-2.7-3.5-5.7-3.5-9s1-6.3 3.5-9Z',
  analytics: 'M4 20V10m6 10V4m6 16v-7m4 7H2',
  channels: 'M3 9.5 5 4h14l2 5.5M3 9.5h18M3 9.5V20h18V9.5M9 20v-5h6v5',
  apps: 'M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 3.5h7M16.5 13v7',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.3 7.3 0 0 0-2-1.2L14.5 3h-4l-.4 2.6a7.3 7.3 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.3 7.3 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7.3 7.3 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 5 5',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0',
  help: 'M4 4h16v16H4zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.2M12 16.5h.01',
  chevron: 'm9 6 6 6-6 6',
  down: 'm6 9 6 6 6-6',
  left: 'm15 6-6 6 6 6',
  back: 'M19 12H5m6-6-6 6 6 6',
  plus: 'M12 5v14M5 12h14',
  x: 'M6 6l12 12M18 6 6 18',
  check: 'm5 12 5 5 9-10',
  export: 'M12 4v11m0 0-4-4m4 4 4-4M5 19h14',
  import: 'M12 15V4m0 0L8 8m4-4 4 4M5 19h14',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  sparkle:
    'M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7ZM19 16c.2 1.3.9 2 2.2 2.2-1.3.2-2 .9-2.2 2.2-.2-1.3-.9-2-2.2-2.2 1.3-.2 2-.9 2.2-2.2Z',
  mic: 'M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm-6-3a6 6 0 0 0 12 0M12 18v3',
  panel: 'M4 5h16v14H4zM14 5v14',
  send: 'M12 19V5m0 0-6 6m6-6 6 6',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4l3 2',
  truck: 'M3 6h11v10H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  card: 'M3 6h18v12H3zM3 10h18M7 15h3',
  chat: 'M4 5h16v11H9l-5 4z',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  image: 'M4 5h16v14H4zm0 10 4-4 4 4 3-3 5 5M15 9.5h.01',
  store: 'M4 10v10h16V10M3 10l2-6h14l2 6M3 10c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3',
  logout: 'M15 4h4v16h-4M10 16l-4-4 4-4M6 12h10',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  keyboard: 'M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10',
  switch: 'M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7',
  menu: 'M4 7h16M4 12h16M4 17h16',
  history: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 8v4l3 2',
  filter: 'M4 5h16l-6 7v6l-4 2v-8z',
  alert: 'M12 4 2.5 20h19zM12 10v4M12 17h.01',
  whatsapp: 'M4 20l1.3-4A8 8 0 1 1 8 18.7zM9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1a4 4 0 0 1-2-2l1-1-1-2z',
  pin: 'M12 21s-6-5.6-6-11a6 6 0 1 1 12 0c0 5.4-6 11-6 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z',
  mail: 'M3 5h18v14H3zm0 0 9 7 9-7',
  tag: 'M3 12V4h8l10 10-8 8zM7.5 7.5h.01',
  refresh: 'M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4',
  receipt: 'M6 2h12v20l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6M9 15h4',
  print: 'M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  pause: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM10 9v6M14 9v6',
  minus: 'M5 12h14',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 10a7 7 0 0 1 14 0m1-10a3 3 0 1 0 0-6m3 16a6 6 0 0 0-3-5',
  star: 'm12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  code: 'm8 7-5 5 5 5m8-10 5 5-5 5',
  layers: 'm12 3 9 5-9 5-9-5zm-9 9 9 5 9-5M3 16l9 5 9-5',
  cart: 'M3 4h2l2.4 11h11L21 7H6.2M9 20h.01M18 20h.01',
  segment: 'M12 3a9 9 0 1 0 9 9h-9z M14 2.5V10h7.5A8 8 0 0 0 14 2.5Z',
  boxes: 'M3 7.5 12 3l9 4.5v9L12 21l-9-4.5zM3 7.5l9 4.5 9-4.5M12 12v9',
  'map-pin': 'M12 21s-6-5.6-6-11a6 6 0 1 1 12 0c0 5.4-6 11-6 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  clipboard: 'M9 4h6v3H9zM7 6H5v15h14V6h-2',
  'arrow-right-left': 'M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7',
  folder: 'M3 7h6l2 2h10v10H3z',
  file: 'M6 3h8l4 4v14H6zM14 3v4h4',
  package: 'M3 7.5 12 3l9 4.5v9L12 21l-9-4.5zM3 7.5l9 4.5 9-4.5M12 12v9',
  tags: 'M3 12V4h8l10 10-8 8zM7.5 7.5h.01',
  'receipt-text': 'M6 2h12v20l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6M9 15h4',
} as const;
export type IconName = keyof typeof P;
export const ICON_NAMES = Object.keys(P) as IconName[];

export function Icon({
  name,
  size = 16,
  strokeWidth = 1.6,
  tone,
}: {
  name: IconName;
  size?: 12 | 14 | 16 | 18 | 20 | 24;
  strokeWidth?: number;
  tone?: 'muted' | 'faint' | 'accent' | 'arya' | 'ok' | 'current';
}) {
  const px = `${size}px`;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: px, height: px }}
      className={cn(
        'shrink-0',
        tone === 'muted' && 'text-a-ink-600',
        tone === 'faint' && 'text-a-ink-500',
        tone === 'accent' && 'text-a-blue',
        tone === 'arya' && 'text-a-arya',
        tone === 'ok' && 'text-a-ok',
      )}
      aria-hidden
    >
      <path d={P[name] ?? P.help} />
    </svg>
  );
}

/** Resource icons from the registry are plain strings; unknown ones fall back to a box. */
export const iconFor = (name: string | undefined): IconName => (name && name in P ? (name as IconName) : 'package');

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'sm' ? { height: 22, width: 64 } : size === 'lg' ? { height: 38, width: 110 } : { height: 24, width: 70 };
  return (
    <span
      role="img"
      aria-label="Ratio"
      className="a-mask block text-a-ink-900"
      style={{ ...dims, maskImage: 'url(/admin/logo.png)', WebkitMaskImage: 'url(/admin/logo.png)' }}
    />
  );
}
