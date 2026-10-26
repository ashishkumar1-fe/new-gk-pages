/** Sandboxed UI extensions (gokwik-ui-extensions-core) render into targets declared on resources. One error boundary per extension; never the session token. */
export const extensionTargets = [
  'admin.product-details.block.render',
  'admin.product-details.sidebar.render',
  'admin.product-details.action.render',
] as const;
export type ExtensionTarget = (typeof extensionTargets)[number];
export interface ExtensionContext {
  target: ExtensionTarget;
  recordId?: string;
  selectedIds?: string[];
}
