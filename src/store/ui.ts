import { create } from 'zustand';

/**
 * The entire Zustand footprint: global UI flags only. Server data never goes here (it lives in the query cache),
 * view state never goes here (it lives in the URL). Row selection stays in the list page's own state.
 */
export type ActiveDialog = { kind: 'import' | 'export'; resource: string; label: string } | undefined;
export type SettingsTab =
  | 'general'
  | 'users'
  | 'activity'
  | 'domains'
  | 'checkout'
  | 'shipping'
  | 'taxes'
  | 'orders'
  | 'returns'
  | 'notifications'
  | 'reviews'
  | 'search'
  | 'seo'
  | 'apps'
  | 'metafields';
interface UiState {
  sidebarOpen: boolean;
  assistantOpen: boolean;
  /** a prompt handed to the assistant when it opens ("ask" from a button) */
  assistantPrompt: string | null;
  settingsTab: SettingsTab | null;
  dialog: ActiveDialog;
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  setAssistant: (open: boolean) => void;
  ask: (prompt: string) => void;
  takePrompt: () => string | null;
  openSettings: (tab: SettingsTab) => void;
  closeSettings: () => void;
  openDialog: (d: NonNullable<ActiveDialog>) => void;
  closeDialog: () => void;
}
export const useUi = create<UiState>((set, get) => ({
  sidebarOpen: false,
  assistantOpen: false,
  assistantPrompt: null,
  settingsTab: null,
  dialog: undefined,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar: (sidebarOpen) => set({ sidebarOpen }),
  setAssistant: (assistantOpen) => set({ assistantOpen }),
  ask: (assistantPrompt) => set({ assistantPrompt, assistantOpen: true }),
  takePrompt: () => {
    const p = get().assistantPrompt;
    if (p) set({ assistantPrompt: null });
    return p;
  },
  openSettings: (settingsTab) => set({ settingsTab }),
  closeSettings: () => set({ settingsTab: null }),
  openDialog: (dialog) => set({ dialog }),
  closeDialog: () => set({ dialog: undefined }),
}));
