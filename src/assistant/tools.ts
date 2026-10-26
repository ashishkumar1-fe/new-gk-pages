import { commands } from '@/commands/registry';
import { resources } from '@/resources/registry';
import { flags } from '@/platform/flags';
import { zodToJsonSchema } from './zodToJsonSchema';

const on = (capability?: string) => !capability || flags.isOn(capability);

/**
 * Assistant tools are generated from command cards (TRD 7.10): name = command id, description = description + topic
 * instructions, inputSchema from the command's Zod input, and the four effect flags as the MCP-style annotations.
 * Commands whose capability is off do not exist for the assistant either.
 */
export const writeTools = (topic?: string) =>
  commands
    .filter((c) => c.expose.assistant && on(c.capability))
    .filter((c) => !topic || (c.expose.assistant && c.expose.assistant.topic === topic))
    .map((c) => {
      const a = c.expose.assistant as { topic: string; instructions?: string };
      return {
        name: c.id,
        description: a.instructions ? `${c.description} ${a.instructions}` : c.description,
        inputSchema: zodToJsonSchema(c.input),
        annotations: {
          readOnlyHint: c.effect.readOnly,
          destructiveHint: c.effect.destructive,
          idempotentHint: c.effect.idempotent,
          openWorldHint: c.effect.external,
        },
        topic: a.topic,
      };
    });

/** Read tools come from resources with assistant metadata: list, get and (when the resource has it) search. */
export const readTools = () =>
  resources
    .filter((r) => r.assistant && on(r.capability))
    .flatMap((r) => [
      {
        name: `${r.name}.list`,
        description: `List ${r.label.plural.toLowerCase()}. ${r.assistant!.description}`,
        readableFields: r.assistant!.readableFields,
      },
      {
        name: `${r.name}.get`,
        description: `Get one ${r.label.singular.toLowerCase()} by id. ${r.assistant!.description}`,
        readableFields: r.assistant!.readableFields,
      },
      ...(r.data.search
        ? [
            {
              name: `${r.name}.search`,
              description: `Search ${r.label.plural.toLowerCase()} by text.`,
              readableFields: r.assistant!.readableFields,
            },
          ]
        : []),
    ]);
