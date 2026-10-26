import { readFileSync } from 'node:fs';

/**
 * Commit message rule (same as gk-pages):
 *   [<Type>]: <one-line description>
 * Type: Hotfix | Bugfix | Feature (preferred). Refactor | Chore | Docs | Test only when none of the three fit.
 * Single line. No body, no footer, no Co-Authored-By.
 */
const file = process.argv[2];
const raw = readFileSync(file, 'utf8');
const lines = raw.split('\n').filter((l) => !l.startsWith('#') && l.trim() !== '');
const first = lines[0] ?? '';
const TYPES = ['Hotfix', 'Bugfix', 'Feature', 'Refactor', 'Chore', 'Docs', 'Test'];
const re = new RegExp(`^\\[(${TYPES.join('|')})\\]: \\S.{4,}$`);

const fail = (why) => {
  console.error(`\n✖ Commit message rejected: ${why}\n`);
  console.error('  Format:   [Type]: one-line description');
  console.error('  Type:     Hotfix | Bugfix | Feature   (Refactor | Chore | Docs | Test only if none fit)');
  console.error('  Example:  [Feature]: Add archive command for orders with canArchive rule\n');
  console.error(`  You wrote: ${JSON.stringify(first)}\n`);
  process.exit(1);
};

if (/^(Merge|Revert) /.test(first)) process.exit(0);          // git-generated messages pass
if (!re.test(first)) fail('first line must be "[Type]: description"');
if (first.length > 100) fail('keep the line under 100 characters');
if (lines.length > 1) fail('single line only, no body or footer');
