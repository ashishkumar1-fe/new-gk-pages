import type { AnyCommand, CommandId } from './define';
import * as productCommands from './product';
import * as collectionCommands from './collection';
import * as priceScheduleCommands from './priceSchedule';
import * as fieldDefinitionCommands from './fieldDefinition';
import * as inventoryCommands from './inventory';
import * as locationCommands from './location';
import * as inventoryLevelCommands from './inventoryLevel';
import * as purchaseOrderCommands from './purchaseOrder';
import * as transferCommands from './transfer';
import * as orderCommands from './order';
import * as refundCommands from './refund';
import * as orderEditCommands from './orderEdit';
import * as draftOrderCommands from './draftOrder';
import * as customerCommands from './customer';
import * as segmentCommands from './segment';
import * as discountCommands from './discount';
import * as discountSetCommands from './discountSet';
import * as bulkOpsCommands from './bulkOps';
/* plop:imports */

/** All commands (docs/architecture/commands/registry.md). IDs are stable forever: shortcuts, extensions and assistant history bind to them. */
export const commands: AnyCommand[] = [
  ...Object.values(productCommands),
  ...Object.values(collectionCommands),
  ...Object.values(priceScheduleCommands),
  ...Object.values(fieldDefinitionCommands),
  ...Object.values(inventoryCommands),
  ...Object.values(locationCommands),
  ...Object.values(inventoryLevelCommands),
  ...Object.values(purchaseOrderCommands),
  ...Object.values(transferCommands),
  ...Object.values(orderCommands),
  ...Object.values(refundCommands),
  ...Object.values(orderEditCommands),
  ...Object.values(draftOrderCommands),
  ...Object.values(customerCommands),
  ...Object.values(segmentCommands),
  ...Object.values(discountCommands),
  ...Object.values(discountSetCommands),
  ...Object.values(bulkOpsCommands),
  /* plop:commands */
];

const byId = new Map(commands.map((c) => [c.id, c]));
export const commandById = (id: CommandId) => byId.get(id);

/**
 * Installed apps add commands at runtime (record or selection targets; commands/surfaces.md). An id is registered once;
 * built-in ids cannot be replaced. Returns the unregister function.
 */
export const registerCommand = (def: AnyCommand): (() => void) => {
  if (byId.has(def.id)) throw new Error(`Command ${def.id} is already registered`);
  byId.set(def.id, def);
  commands.push(def);
  return () => {
    byId.delete(def.id);
    commands.splice(commands.indexOf(def), 1);
  };
};
/**
 * v1 bindings (commands/surfaces.md). mod+s saves whichever editor is open (its `editor.save` command); j / k move between
 * records on a detail page with a pager. Each is bound by the screen that shows it (useShortcut), never globally.
 */
export const SHORTCUTS: Record<string, CommandId | 'palette' | 'help' | 'editor.save' | 'detail.previous' | 'detail.next'> = {
  'mod+k': 'palette',
  'mod+s': 'editor.save',
  j: 'detail.next',
  k: 'detail.previous',
  '?': 'help',
};
