/* npm run new:resource <name>: the correct skeleton for one entity across every layer. Cache class is mandatory. */
module.exports = function (plop) {
  plop.setHelper('pascal', (s) => s.charAt(0).toUpperCase() + s.slice(1));
  plop.setHelper('eq', (a, b) => a === b);

  /* npm run new:command: one action card added to src/commands/<resource>.ts, with its test. Then reference the id from the resource. */
  plop.setGenerator('command', {
    description: 'New command: one defineCommand card and its test',
    prompts: [
      { type: 'input', name: 'resource', message: 'Resource (camelCase, e.g. order):' },
      { type: 'input', name: 'verb', message: 'Verb (camelCase, e.g. archive). The id becomes <resource>.<verb>, stable forever:' },
      { type: 'input', name: 'label', message: 'Label shown on buttons and ⌘K (e.g. Archive order):' },
      { type: 'list', name: 'scope', message: 'Scope:', choices: ['record', 'selection', 'page', 'global'] },
      { type: 'input', name: 'apiModule', message: 'api module (item, osOrder, inventory, osCustomer, discount, bulkOps, mediaApps, dashboard):' },
      { type: 'input', name: 'apiFunction', message: 'api function the step calls (e.g. bulkArchive):' },
      { type: 'input', name: 'endpoint', message: 'Endpoint, for the comment (e.g. POST /orders/bulk-archive):' },
      { type: 'confirm', name: 'readOnly', message: 'Read-only (no data change)?', default: false },
      { type: 'confirm', name: 'destructive', message: 'Destructive (cannot be undone)?', default: false },
      { type: 'confirm', name: 'idempotent', message: 'Idempotent (safe to retry with the same input)?', default: true },
      { type: 'confirm', name: 'external', message: 'External (reaches customers, money or other systems)?', default: false },
    ],
    actions: [
      { type: 'modify', path: 'src/commands/{{resource}}.ts', pattern: /\s*$/, templateFile: 'plop-templates/command.hbs' },
      { type: 'add', path: 'src/commands/{{resource}}.{{verb}}.test.ts', templateFile: 'plop-templates/command-test.hbs' },
    ],
  });
  plop.setGenerator('resource', {
    description: 'New resource: domain, api functions, resource card, command cards, tests',
    prompts: [
      { type: 'input', name: 'name', message: 'Resource name (camelCase, singular, e.g. collection):' },
      { type: 'input', name: 'service', message: 'Service module under src/api (e.g. item, os-order):', default: 'item' },
      { type: 'list', name: 'cache', message: 'Cache class for the list:', choices: ['list', 'detail', 'lookup', 'calc'], default: 'list' },
      { type: 'input', name: 'route', message: 'List route (e.g. /collections):', default: (a) => `/${a.name}s` },
    ],
    actions: [
      { type: 'add', path: 'src/domain/{{name}}/schema.ts', templateFile: 'plop-templates/domain-schema.hbs' },
      { type: 'add', path: 'src/domain/{{name}}/rules.ts', templateFile: 'plop-templates/domain-rules.hbs' },
      { type: 'add', path: 'src/domain/{{name}}/format.ts', templateFile: 'plop-templates/domain-format.hbs' },
      { type: 'add', path: 'src/domain/{{name}}/rules.test.ts', templateFile: 'plop-templates/domain-rules-test.hbs' },
      { type: 'add', path: 'src/api/{{service}}/{{name}}.wire.ts', templateFile: 'plop-templates/api-wire.hbs' },
      { type: 'add', path: 'src/api/{{service}}/{{name}}.client.ts', templateFile: 'plop-templates/api-client.hbs' },
      { type: 'add', path: 'src/api/{{service}}/fixtures/{{name}}.list.json', templateFile: 'plop-templates/api-fixture.hbs' },
      { type: 'add', path: 'src/resources/{{name}}.ts', templateFile: 'plop-templates/resource.hbs' },
      { type: 'add', path: 'src/commands/{{name}}.ts', templateFile: 'plop-templates/commands.hbs' },
      { type: 'append', path: 'src/resources/registry.ts', pattern: '/* plop:resources */', template: "  {{name}}," },
      { type: 'append', path: 'src/resources/registry.ts', pattern: '/* plop:imports */', template: "import { {{name}} } from './{{name}}';" },
      { type: 'append', path: 'src/commands/registry.ts', pattern: '/* plop:commands */', template: "  ...Object.values({{name}}Commands)," },
      { type: 'append', path: 'src/commands/registry.ts', pattern: '/* plop:imports */', template: "import * as {{name}}Commands from './{{name}}';" },
      { type: 'append', path: 'src/mocks/handlers.ts', pattern: '/* plop:handlers */', template: "  ...{{name}}Handlers," },
      { type: 'append', path: 'src/mocks/handlers.ts', pattern: '/* plop:imports */', template: "import { {{name}}Handlers } from '@/api/{{service}}/{{name}}.mocks';" },
      { type: 'add', path: 'src/api/{{service}}/{{name}}.mocks.ts', templateFile: 'plop-templates/api-mocks.hbs' },
    ],
  });
};
