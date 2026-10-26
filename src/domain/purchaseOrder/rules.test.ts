import { describe, it, expect } from 'vitest';
import * as rules from './rules';
import { poLineTotal, poTotals, poStatus, poDisplayNumber, poActions, poPrimaryAction, poValidate } from './rules';
import { money } from '@/domain/shared/money';

describe('purchaseOrder rules', () => {
  it('exports poTotals as a pure function', () => {
    expect(typeof rules.poTotals).toBe('function');
  });
  it('poLineTotal = quantity × cost (paise)', () => {
    expect(poLineTotal({ quantityOrdered: 3, costPerUnit: money(12550) })).toEqual(money(37650));
  });
  it('poTotals sums line totals; tax excluded', () => {
    const lines = [
      { quantityOrdered: 2, costPerUnit: money(1000), tax: '18.00' },
      { quantityOrdered: 1, costPerUnit: money(250), tax: '5' },
    ] as unknown as Parameters<typeof poTotals>[0]['lines'];
    expect(poTotals({ lines })).toEqual(money(2250));
  });
  it('poStatus maps exact wire values; anything else → draft', () => {
    expect(poStatus('Draft')).toBe('draft');
    expect(poStatus('Ordered')).toBe('ordered');
    expect(poStatus('Partially_Received')).toBe('partially_received');
    expect(poStatus('Received')).toBe('received');
    expect(poStatus('Closed')).toBe('closed');
    expect(poStatus('ordered')).toBe('draft');
    expect(poStatus(undefined)).toBe('draft');
    expect(poStatus('toString')).toBe('draft');
  });
  it('poDisplayNumber falls back to PO- + 8 id chars', () => {
    expect(poDisplayNumber({ id: 'abcdef123456', referenceNumber: '' })).toBe('PO-abcdef12');
    expect(poDisplayNumber({ id: 'abcdef123456', referenceNumber: 'REF-1' })).toBe('REF-1');
  });
  it('poActions per status', () => {
    expect(poActions({ status: 'draft' })).toEqual({
      primary: 'purchaseOrder.markOrdered',
      more: ['purchaseOrder.update', 'purchaseOrder.delete'],
    });
    expect(poActions({ status: 'ordered' })).toEqual({ primary: 'purchaseOrder.openReceive', more: ['purchaseOrder.close'] });
    expect(poActions({ status: 'partially_received' })).toEqual({ primary: 'purchaseOrder.openReceive', more: ['purchaseOrder.close'] });
    expect(poActions({ status: 'received' })).toEqual({ primary: 'purchaseOrder.openReceive', more: ['purchaseOrder.close'] });
    expect(poActions({ status: 'closed' })).toEqual({ more: ['purchaseOrder.reopen'] });
  });
  it('poPrimaryAction still matches the header button', () => {
    expect(poPrimaryAction({ status: 'draft' })).toBe('purchaseOrder.markOrdered');
    expect(poPrimaryAction({ status: 'received' })).toBe('purchaseOrder.openReceive');
    expect(poPrimaryAction({ status: 'closed' })).toBeUndefined();
  });
  it('poValidate: valid draft has no errors; reference optional', () => {
    expect(
      poValidate({ supplierId: 's1', destinationLocationId: 'iloc_1', lines: [{ quantityOrdered: 1, costPerUnit: money(0) }] }),
    ).toEqual({});
  });
  it('poValidate: messages verbatim', () => {
    expect(poValidate({ lines: [] })).toEqual({
      supplier: 'Supplier is required',
      destinationLocationId: 'Destination is required',
      lines: 'At least one item is required',
    });
    expect(
      poValidate({ supplierId: 's1', destinationLocationId: 'iloc_1', lines: [{ quantityOrdered: 0, costPerUnit: money(-1) }] }),
    ).toEqual({
      'lines.0.quantityOrdered': 'Quantity must be at least 1',
      'lines.0.costPerUnit': 'Price must be at least 0',
    });
  });
});
