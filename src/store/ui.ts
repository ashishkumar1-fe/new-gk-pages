import { create } from 'zustand';

/**
 * The entire Zustand footprint: global UI flags only. Server data never goes here (it lives in the query cache),
 * view state never goes here (it lives in the URL). Row selection stays in the list page's own state.
 */
export type ActiveDialog = { kind: 'import' | 'export'; resource: string; label: string } | undefined;
interface UiState {
  sidebarOpen: boolean;
  assistantOpen: boolean;
  dialog: ActiveDialog;
  toggleSidebar: () => void;
  setAssistant: (open: boolean) => void;
  openDialog: (d: NonNullable<ActiveDialog>) => void;
  closeDialog: () => void;
}
export const useUi = create<UiState>((set) => ({
  sidebarOpen: true,
  assistantOpen: false,
  dialog: undefined,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setAssistant: (assistantOpen) => set({ assistantOpen }),
  openDialog: (dialog) => set({ dialog }),
  closeDialog: () => set({ dialog: undefined }),
}));
