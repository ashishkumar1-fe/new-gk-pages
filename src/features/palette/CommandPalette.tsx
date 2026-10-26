import { commands } from '@/commands/registry';
import { resources } from '@/resources/registry';

/** ⌘K: Recent · Commands (current record/selection first) · records via 2–3 list APIs in parallel · Settings and pages (d41). */
export const paletteSources = () => ({
  commands: commands.filter((c) => c.expose.palette).map((c) => c.id),
  searchable: resources.filter((r) => r.search?.enabled).map((r) => r.name),
});
