/* Layer boundaries: a layer imports only from layers below it. Red lint locks merge. Run from the repo root: eslint --config config/eslint.cjs */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', project: null },
  plugins: ['@typescript-eslint', 'boundaries', 'import'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:boundaries/recommended'],
  settings: {
    'import/resolver': { alias: { map: [['@', './src']], extensions: ['.ts', '.tsx', '.js', '.json'] }, node: { extensions: ['.ts', '.tsx', '.js', '.json'] } },
    'boundaries/elements': [
      { type: 'lib', pattern: 'src/lib/**' },
      { type: 'platform', pattern: 'src/platform/**' },
      { type: 'domain', pattern: 'src/domain/**' },
      { type: 'api', pattern: 'src/api/**' },
      { type: 'contracts', pattern: ['src/resources/**', 'src/commands/**'] },
      { type: 'machines', pattern: 'src/machines/**' },
      { type: 'ui', pattern: 'src/ui/**' },
      { type: 'mocks', pattern: 'src/mocks/**' },
      { type: 'surfaces', pattern: ['src/routes/**', 'src/features/**', 'src/assistant/**', 'src/extensions/**', 'src/store/**', 'src/main.tsx'] },
    ],
    'boundaries/ignore': ['**/*.test.{ts,tsx}'],
  },
  rules: {
    'boundaries/element-types': ['error', {
      default: 'disallow',
      rules: [
        { from: 'lib', allow: ['lib'] },
        { from: 'platform', allow: ['lib', 'platform'] },
        { from: 'domain', allow: ['lib', 'domain'] },
        { from: 'api', allow: ['lib', 'domain', 'platform', 'api'] },
        { from: 'contracts', allow: ['lib', 'api', 'domain', 'platform', 'contracts'] },
        { from: 'machines', allow: ['lib', 'contracts', 'domain', 'platform', 'machines'] },
        { from: 'ui', allow: ['lib', 'ui'] },
        { from: 'surfaces', allow: ['lib', 'machines', 'contracts', 'domain', 'platform', 'ui', 'surfaces', 'mocks'] },
        { from: 'mocks', allow: ['lib', 'api', 'mocks'] },
      ],
    }],
    'no-restricted-imports': ['error', {
      paths: [{ name: 'axios', message: 'Use platform/http request().' }],
      patterns: [{ group: ['**/api/*/client'], message: 'Surfaces read through resources and write through runCommand.' }],
    }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  overrides: [
    { files: ['src/resources/**', 'src/commands/**', 'src/machines/**'], rules: { 'no-restricted-imports': 'off' } },
    /* Surfaces: no fetch (reads via resources, writes via runCommand); no XState (use the machine's hook); no query-data mutation. */
    {
      files: ['src/routes/**', 'src/features/**', 'src/assistant/**', 'src/extensions/**', 'src/store/**'],
      rules: {
        'no-restricted-imports': ['error', {
          paths: [{ name: 'axios', message: 'Use platform/http request().' }],
          patterns: [
            { group: ['**/api/*/client', '**/api/*/*.client'], message: 'Surfaces read through resources and write through runCommand.' },
            { group: ['xstate', '@xstate/*'], message: 'Components never import XState; use the machine hook from machines/<flow>.' },
          ],
        }],
        'no-restricted-syntax': ['error',
          { selector: "CallExpression[callee.name='fetch']", message: 'No fetch in surfaces; use resources and runCommand.' },
          { selector: "JSXAttribute[name.name='className'] Literal[value=/#[0-9a-fA-F]{3,8}\\b|\\b\\d+px\\b|-\\[/]", message: 'Tokens only: no raw hex, raw px or Tailwind arbitrary values outside src/ui.' },
          { selector: "JSXAttribute[name.name='className'] TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b|\\b\\d+px\\b|-\\[/]", message: 'Tokens only: no raw hex, raw px or Tailwind arbitrary values outside src/ui.' },
        ],
        'no-param-reassign': ['error', { props: true }],
      },
    },
    /* Features use the kit, never raw interactive elements. */
    {
      files: ['src/features/**'],
      rules: {
        'no-restricted-syntax': ['error',
          { selector: "CallExpression[callee.name='fetch']", message: 'No fetch in surfaces; use resources and runCommand.' },
          { selector: "JSXOpeningElement[name.name=/^(button|input|select|textarea)$/]", message: 'Use the kit (Button, TextField, Select, TextArea, FileInput), not raw elements.' },
          { selector: "JSXAttribute[name.name='className'] Literal[value=/#[0-9a-fA-F]{3,8}\\b|\\b\\d+px\\b|-\\[/]", message: 'Tokens only: no raw hex, raw px or Tailwind arbitrary values outside src/ui.' },
        ],
      },
    },
    /* Machines: no React components, no ui/. */
    { files: ['src/machines/**'], excludedFiles: ['**/index.ts'], rules: { 'no-restricted-imports': ['error', { patterns: [{ group: ['react', '@xstate/react'], message: 'machine.ts / actors.ts stay React-free; the hook lives in index.ts.' }] }] } },
  ],
  ignorePatterns: ['dist', 'node_modules', 'config/plop/templates'],
};
