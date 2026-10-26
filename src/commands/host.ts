/** The UI pieces runCommand needs. Surfaces register real dialogs at boot; defaults keep tests and non-React callers working. */
import type { ConfirmSpec } from './define';
import type { FieldSpec } from '@/resources/define';

export interface CommandHost {
  confirm: (spec: ConfirmSpec) => Promise<boolean>;
  openForm: <T>(title: string, fields: FieldSpec<T>[], initial: Partial<T>) => Promise<Partial<T> | undefined>;
  toast: (message: string, tone?: 'default' | 'warning' | 'critical') => void;
  navigate: (to: string) => void;
  copy: (text: string) => Promise<void>;
}

let host: CommandHost = {
  confirm: async () => true,
  openForm: async (_t, _f, initial) => initial,
  toast: (m) => console.info('[toast]', m),
  navigate: (to) => console.info('[navigate]', to),
  copy: async (text) => {
    await navigator.clipboard?.writeText(text);
  },
};
export const configureCommandHost = (h: Partial<CommandHost>) => {
  host = { ...host, ...h };
};
export const getCommandHost = () => host;
