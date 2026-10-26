import { describe, it, expect } from 'vitest';
import * as rules from './rules';

describe('job rules', () => {
  it('exports isTerminal as a pure function', () => {
    expect(typeof rules.isTerminal).toBe('function');
  });
});
