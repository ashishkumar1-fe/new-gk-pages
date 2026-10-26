/** Embedded apps: iframe + bridge. Messages: title, modal, toast, save bar (joins the leave guard), resource picker, redirect. */
export type BridgeMessage =
  | { type: 'title'; value: string }
  | { type: 'toast'; message: string }
  | { type: 'saveBar'; dirty: boolean }
  | { type: 'redirect'; to: string };
export const onBridgeMessage = (_m: BridgeMessage) => {
  /* host implementation */
};
