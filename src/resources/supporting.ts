/** Supporting resources: no list screen of their own in v1; used by pickers, filters and the settings sheet (docs/architecture/resources/registry.md). */
export const supporting = [
  { name: 'supplier', service: 'inventory', usedBy: 'PO supplier picker' },
  { name: 'vendor', service: 'item', usedBy: 'Product filters and organization fields' },
  { name: 'productType', service: 'item', usedBy: 'Product filters' },
  { name: 'tag', service: 'item', usedBy: 'Product filters' },
  { name: 'taxonomy', service: 'item', usedBy: 'Product category' },
  { name: 'fieldDefinition', service: 'inventory', usedBy: 'Settings › Custom fields; editors (runtime fields)' },
  { name: 'metaobject', service: 'inventory', usedBy: 'Settings › Custom fields; reference fields' },
  { name: 'priceSchedule', service: 'item', usedBy: 'Products › Flash sale' },
  { name: 'app', service: 'media-apps', usedBy: 'Settings › Apps' },
  { name: 'mediaAsset', service: 'media-apps', usedBy: 'Media pickers; Content' },
  { name: 'timelineEvent', service: 'os-order', usedBy: 'Order and customer detail' },
  { name: 'orderTag', service: 'os-order', usedBy: 'Order tags section and bulk tags' },
  { name: 'job', service: 'bulk-ops', usedBy: 'Jobs indicator, import / export history, bulkOps.cancel' },
] as const;
