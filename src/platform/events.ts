type Handler = () => void;
const handlers: Record<string, Handler[]> = {};
export const on = (event: 'session-expired', h: Handler) => {
  (handlers[event] ??= []).push(h);
  return () => {
    handlers[event] = (handlers[event] ?? []).filter((x) => x !== h);
  };
};
export const emit = (event: 'session-expired') => (handlers[event] ?? []).forEach((h) => h());
