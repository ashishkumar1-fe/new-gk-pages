/** Opens over any page as ?settings=<tab>. Tabs: General, Apps, Metafields (field definitions). Checkout, Shipping, Domains are capability off. */
export const settingsTabs = [
  { id: 'general', label: 'General', capability: undefined },
  { id: 'apps', label: 'Apps', capability: undefined },
  { id: 'metafields', label: 'Custom fields', capability: undefined },
  { id: 'checkout', label: 'Checkout', capability: 'settings-checkout' },
  { id: 'shipping', label: 'Shipping', capability: 'settings-shipping' },
  { id: 'domains', label: 'Domains', capability: 'settings-domains' },
] as const;
