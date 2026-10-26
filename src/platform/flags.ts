/** Two kinds of flag (d27). Release flags come from PostHog at boot with safe defaults; capability flags live on contracts. */
const releaseDefaults: Record<string, boolean> = {
  'product-insights': false,
  'custom-fields': false,
  'price-schedules': false, // capability: price-schedule endpoints not ported yet (no recorded fixture)          // capability: metafield-definitions read not ported yet
  assistant: true,
};
let release: Record<string, boolean> = { ...releaseDefaults };
export const loadFlags = async () => {
  /* PostHog bootstrap goes here; defaults apply if blocked */ release = { ...releaseDefaults };
};
export const flags = { isOn: (key: string) => release[key] ?? false };
