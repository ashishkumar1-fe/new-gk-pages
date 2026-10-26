import type { ZodTypeAny } from 'zod';
/** Minimal placeholder until a JSON-schema library is picked; the command's Zod is the single source. */
export const zodToJsonSchema = (schema: ZodTypeAny) => ({ type: 'object', description: schema.description ?? 'See command input schema' });
