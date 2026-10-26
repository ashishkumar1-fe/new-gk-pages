import { describe, it, expect } from 'vitest';
import * as rules from './rules';
import { transferValidate, transferValidateErrors, transferStatus, transferActions } from './rules';

describe('transfer rules', () => {
  it('exports transferValidate as a pure function', () => {
    expect(typeof rules.transferValidate).toBe('function');
  });
  it('transferValidate: origin ≠ destination, ≥ 1 line, quantity ≥ 1', () => {
    expect(transferValidate({ originLocationId: 'a', destinationLocationId: 'b', lines: [{ quantityOrdered: 1 }] } as never)).toBe(true);
    expect(transferValidate({ originLocationId: 'a', destinationLocationId: 'a', lines: [{ quantityOrdered: 1 }] } as never)).toBe(false);
    expect(transferValidate({ originLocationId: 'a', destinationLocationId: 'b', lines: [] } as never)).toBe(false);
  });
  it('transferValidateErrors: messages verbatim', () => {
    expect(transferValidateErrors({ lines: [] })).toEqual({
      originLocationId: 'Source warehouse is required',
      destinationLocationId: 'Destination warehouse is required',
      lines: 'At least one item is required',
    });
    expect(transferValidateErrors({ originLocationId: 'a', destinationLocationId: 'b', lines: [{ quantityOrdered: 0 }] })).toEqual({
      'lines.0.quantityOrdered': 'Quantity must be at least 1',
    });
    expect(transferValidateErrors({ originLocationId: 'a', destinationLocationId: 'a', lines: [{ quantityOrdered: 1 }] })).toEqual({
      destinationLocationId: 'Source and destination warehouses cannot be the same',
    });
    expect(transferValidateErrors({ originLocationId: 'a', destinationLocationId: 'b', lines: [{ quantityOrdered: 2 }] })).toEqual({});
  });
  it('transferStatus maps wire values', () => {
    expect(transferStatus('Draft')).toBe('draft');
    expect(transferStatus('Pending')).toBe('pending');
    expect(transferStatus('Partial')).toBe('partially_received');
    expect(transferStatus('Partially_Received')).toBe('partially_received');
    expect(transferStatus('partially received')).toBe('partially_received');
    expect(transferStatus('Received')).toBe('received');
    expect(transferStatus('Completed')).toBe('received');
    expect(transferStatus(undefined)).toBe('draft');
    expect(transferStatus('Weird')).toBe('draft');
  });
  it('transferActions per status', () => {
    expect(transferActions({ status: 'draft' })).toEqual({ primary: 'transfer.markPending', more: ['transfer.delete'] });
    expect(transferActions({ status: 'pending' })).toEqual({
      primary: 'transfer.openReceive',
      more: ['transfer.update', 'transfer.delete'],
    });
    expect(transferActions({ status: 'partially_received' })).toEqual({
      primary: 'transfer.openReceive',
      more: ['transfer.update', 'transfer.delete'],
    });
    expect(transferActions({ status: 'received' })).toEqual({ more: ['transfer.update'] });
  });
});
