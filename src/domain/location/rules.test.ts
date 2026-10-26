import { describe, it, expect } from 'vitest';
import * as rules from './rules';
import { activeLocations, canDeactivate } from './rules';

describe('location rules', () => {
  it('exports canDeactivate as a pure function', () => {
    expect(typeof rules.canDeactivate).toBe('function');
  });
  it('canDeactivate: active and not default', () => {
    expect(canDeactivate({ active: true, isDefault: false })).toBe(true);
    expect(canDeactivate({ active: true, isDefault: true })).toBe(false);
    expect(canDeactivate({ active: false, isDefault: false })).toBe(false);
  });
  it('activeLocations keeps active ones in order', () => {
    const list = [
      { id: 'a', active: true },
      { id: 'b', active: false },
      { id: 'c', active: true },
    ];
    expect(activeLocations(list).map((l) => l.id)).toEqual(['a', 'c']);
  });
});
