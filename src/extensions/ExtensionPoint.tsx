import { Component, type ComponentType, type ReactNode } from 'react';
import { captureException } from '@/platform/telemetry';
import type { ExtensionContext, ExtensionTarget } from './host';

/** An installed extension's renderer for one target. The sandbox runtime (gokwik-ui-extensions-core) registers these at boot. */
export interface RegisteredExtension {
  id: string;
  target: ExtensionTarget;
  render: ComponentType<{ context: ExtensionContext }>;
}
const registry: RegisteredExtension[] = [];
export const registerExtension = (e: RegisteredExtension) => {
  registry.push(e);
  return () => {
    registry.splice(registry.indexOf(e), 1);
  };
};
export const extensionsFor = (target: string) => registry.filter((e) => e.target === target);

/** One boundary per extension: a crashing extension never breaks the page; it is reported and drops out. */
class ExtensionBoundary extends Component<{ id: string; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch(error: unknown) {
    captureException(error, { boundary: 'extension', extension: this.props.id });
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Renders every extension registered for a target with typed context. Extensions never get the session token or direct API access. */
export const ExtensionPoint = ({ target, context }: { target: string; context: Omit<ExtensionContext, 'target'> }) => {
  const list = extensionsFor(target);
  if (!list.length) return null;
  return (
    <>
      {list.map((e) => (
        <ExtensionBoundary key={e.id} id={e.id}>
          <e.render context={{ ...context, target: e.target }} />
        </ExtensionBoundary>
      ))}
    </>
  );
};
