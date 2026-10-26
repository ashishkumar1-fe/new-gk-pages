import { describe, it, expect } from 'vitest';
import * as rules from './rules';
import {
  onHand,
  unavailableTotal,
  bulkEditBuffer,
  bulkEditDerive,
  bulkEditChanged,
  bulkEditRows,
  bulkEditWrite,
  BULK_EDIT_NOTHING_CHANGED,
  adjustCurrent,
  adjustPreview,
  adjustValidate,
  receiveRemaining,
  receiveCaps,
  receiveChange,
  receiveTotals,
  receivePayload,
} from './rules';

const unavailable = { reserved: 1, damaged: 2, safetyStock: 3, qualityControl: 4 };

describe('inventory rules', () => {
  it('exports onHand as a pure function', () => {
    expect(typeof rules.onHand).toBe('function');
  });
  it('onHand sums available, committed and unavailable buckets; incoming excluded', () => {
    expect(onHand({ available: 10, committed: 5, unavailable })).toBe(25);
  });
  it('unavailableTotal sums the four buckets', () => {
    expect(unavailableTotal({ unavailable })).toBe(10);
  });
});

describe('bulkEditDerive', () => {
  const row = { available: 10, onHand: 15 };
  it('buffer is onHand − available, missing values read as 0', () => {
    expect(bulkEditBuffer(row)).toBe(5);
    expect(bulkEditBuffer({})).toBe(0);
  });
  it('editing available derives onHand = value + buffer', () => {
    expect(bulkEditDerive(row, { field: 'available', value: 20 })).toEqual({ available: 20, onHand: 25 });
  });
  it('editing onHand derives available = value − buffer, negatives allowed', () => {
    expect(bulkEditDerive(row, { field: 'onHand', value: 2 })).toEqual({ onHand: 2, available: -3 });
  });
  it('no edit, null or NaN → null', () => {
    expect(bulkEditDerive(row, undefined)).toBeNull();
    expect(bulkEditDerive(row, { field: 'available', value: null })).toBeNull();
    expect(bulkEditDerive(row, { field: 'available', value: NaN })).toBeNull();
  });
  it('a row is changed only when a derived number differs', () => {
    expect(bulkEditChanged(row, { field: 'available', value: 10 })).toBe(false);
    expect(bulkEditChanged(row, { field: 'onHand', value: 16 })).toBe(true);
  });
});

describe('bulkEditRows', () => {
  const rows = [
    { id: 'invl_1', inventoryItemId: 'invi_1', locationId: 'iloc_1', available: 10, onHand: 15 },
    { id: 'invl_2', inventoryItemId: 'invi_2', locationId: 'iloc_1', available: 0, onHand: 0 },
  ];
  it('nothing changed → verbatim message', () => {
    expect(bulkEditRows(rows, {})).toEqual({ ok: false, message: 'Nothing to update — change at least one quantity' });
    expect(BULK_EDIT_NOTHING_CHANGED).toBe('Nothing to update — change at least one quantity');
  });
  it('available edit carries compareAvailable; onHand edit carries onHand only', () => {
    expect(bulkEditRows(rows, { invl_1: { field: 'available', value: 12 }, invl_2: { field: 'onHand', value: 4 } })).toEqual({
      ok: true,
      rows: [
        { inventoryItemId: 'invi_1', locationId: 'iloc_1', available: 12, compareAvailable: 10 },
        { inventoryItemId: 'invi_2', locationId: 'iloc_1', onHand: 4 },
      ],
    });
  });
});

describe('bulkEditWrite', () => {
  it('splits rows: available → set-quantities with compare; on-hand only → set-on-hand; reason correction', () => {
    const r = bulkEditWrite(
      [
        { inventoryItemId: 'invi_1', locationId: 'iloc_1', available: 3, compareAvailable: 1 },
        { inventoryItemId: 'invi_2', onHand: 7 },
        { inventoryItemId: 'invi_3', locationId: 'iloc_2', available: 5 },
      ],
      { locationId: 'iloc_9' },
    );
    expect(r).toEqual({
      ok: true,
      write: {
        reason: 'correction',
        setOnHand: [{ inventoryItemId: 'invi_2', locationId: 'iloc_9', onHand: 7 }],
        setQuantities: [
          { inventoryItemId: 'invi_1', locationId: 'iloc_1', quantityName: 'available', quantity: 3, compareQuantity: 1 },
          { inventoryItemId: 'invi_3', locationId: 'iloc_2', quantityName: 'available', quantity: 5 },
        ],
        skipped: 0,
      },
    });
  });
  it('available wins when both fields are set', () => {
    const r = bulkEditWrite([{ inventoryItemId: 'invi_1', locationId: 'iloc_1', available: 3, onHand: 9 }]);
    expect(r.ok && r.write.setOnHand).toEqual([]);
    expect(r.ok && r.write.setQuantities.length).toBe(1);
  });
  it('skips rows without item or location; nothing left → "Nothing to update"', () => {
    expect(
      bulkEditWrite([
        { inventoryItemId: '', locationId: 'iloc_1', available: 1 },
        { inventoryItemId: 'invi_1', available: 1 },
      ]),
    ).toEqual({ ok: false, message: 'Nothing to update' });
    const r = bulkEditWrite([
      { inventoryItemId: 'invi_1', available: 1 },
      { inventoryItemId: 'invi_2', locationId: 'iloc_1', onHand: 1 },
    ]);
    expect(r.ok && r.write.skipped).toBe(1);
  });
  it('honours an explicit reason', () => {
    const r = bulkEditWrite([{ inventoryItemId: 'invi_1', locationId: 'iloc_1', onHand: 1 }], { reason: 'import' });
    expect(r.ok && r.write.reason).toBe('import');
  });
});

describe('adjustPreview', () => {
  const level = { available: 10, committed: 2, incoming: 7, unavailable };
  it('current value per bucket; onHand is the bucket sum without incoming', () => {
    expect(adjustCurrent(level, 'onHand')).toBe(22);
    expect(adjustCurrent(level, 'incoming')).toBe(7);
    expect(adjustCurrent(level, 'safetyStock')).toBe(3);
    expect(adjustCurrent({}, 'available')).toBe(0);
  });
  it('set → absolute target, delta 0, set-quantities write', () => {
    expect(adjustPreview(level, 'available', 'set', 4)).toEqual({
      before: 10,
      after: 4,
      delta: 0,
      write: { kind: 'set', quantityName: 'available', quantity: 4 },
    });
  });
  it('add / remove → delta, adjust write', () => {
    expect(adjustPreview(level, 'damaged', 'add', 3)).toEqual({
      before: 2,
      after: 5,
      delta: 3,
      write: { kind: 'adjust', quantityName: 'damaged', delta: 3 },
    });
    expect(adjustPreview(level, 'available', 'remove', 15)).toEqual({
      before: 10,
      after: -5,
      delta: -15,
      write: { kind: 'adjust', quantityName: 'available', delta: -15 },
    });
  });
  it('on-hand add / remove / set become a set-on-hand target', () => {
    expect(adjustPreview(level, 'onHand', 'remove', 2)?.write).toEqual({ kind: 'setOnHand', onHand: 20 });
    expect(adjustPreview(level, 'onHand', 'set', 30)?.write).toEqual({ kind: 'setOnHand', onHand: 30 });
  });
  it('empty or NaN value → null', () => {
    expect(adjustPreview(level, 'available', 'add', null)).toBeNull();
    expect(adjustPreview(level, 'available', 'add', NaN)).toBeNull();
  });
});

describe('adjustValidate', () => {
  it('messages verbatim', () => {
    expect(adjustValidate('set', null)).toBe('Enter a quantity');
    expect(adjustValidate('set', NaN)).toBe('Enter a quantity');
    expect(adjustValidate('set', 1.5)).toBe('Quantity must be a whole number');
    expect(adjustValidate('add', 0)).toBe('Enter a quantity greater than 0');
    expect(adjustValidate('remove', -1)).toBe('Enter a quantity greater than 0');
  });
  it('set allows zero and negative targets (backend decides)', () => {
    expect(adjustValidate('set', 0)).toBeNull();
    expect(adjustValidate('set', -4)).toBeNull();
    expect(adjustValidate('add', 2)).toBeNull();
  });
});

describe('receive', () => {
  const line = { id: 'l1', inventoryItemId: 'invi_1', quantityOrdered: 10, quantityReceived: 3, quantityRejected: 1 };
  it('receiveRemaining = ordered − prev received − prev rejected − accept − reject, floor 0', () => {
    expect(receiveRemaining(line)).toBe(6);
    expect(receiveRemaining(line, { accept: 2, reject: 1 })).toBe(3);
    expect(receiveRemaining(line, { accept: 9 })).toBe(0);
    expect(receiveRemaining({ id: 'x', quantityOrdered: 4 })).toBe(4);
  });
  it('receiveCaps: each field capped by what the other leaves', () => {
    expect(receiveCaps(line, { accept: 2, reject: 1 })).toEqual({ maxAccept: 5, maxReject: 4 });
    expect(receiveCaps(line, { accept: 0, reject: 9 })).toEqual({ maxAccept: 0, maxReject: 6 });
  });
  it('receiveChange clamps the other field down, keeps the typed one', () => {
    expect(receiveChange(line, { accept: 0, reject: 5 }, 'accept', 4)).toEqual({ accept: 4, reject: 2 });
    expect(receiveChange(line, { accept: 5, reject: 0 }, 'reject', 3)).toEqual({ accept: 3, reject: 3 });
    expect(receiveChange(line, { accept: 1, reject: 1 }, 'accept', 2)).toEqual({ accept: 2, reject: 1 });
  });
  it('receiveChange coerces strings with parseFloat and nullish to 0', () => {
    expect(receiveChange(line, { accept: 0, reject: 0 }, 'accept', '2')).toEqual({ accept: 2, reject: 0 });
    expect(receiveChange(line, { accept: 0, reject: 0 }, 'accept', 'abc')).toEqual({ accept: 0, reject: 0 });
    expect(receiveChange(line, { accept: 0, reject: 3 }, 'accept', null)).toEqual({ accept: 0, reject: 3 });
  });
  it('receiveTotals adds this session to previous', () => {
    expect(receiveTotals([line, { id: 'l2', quantityOrdered: 5 }], { l1: { accept: 2 }, l2: { reject: 1 } })).toEqual({
      total: 15,
      received: 5,
      rejected: 2,
    });
  });
  const lines = [line, { id: 'l2', quantityOrdered: 5 }, { id: 'l3', quantityOrdered: 2 }];
  const drafts = { l1: { accept: 2, reject: 1 }, l2: { accept: 0, reject: 1 }, l3: { accept: 0, reject: 0 } };
  it("purchase order payload sends this session's deltas, untouched lines dropped", () => {
    expect(receivePayload('purchaseOrder', lines, drafts)).toEqual([
      { lineId: 'l1', inventoryItemId: 'invi_1', quantityReceived: 2, quantityRejected: 1 },
      { lineId: 'l2', inventoryItemId: '', quantityReceived: 0, quantityRejected: 1 },
    ]);
  });
  it('transfer payload sends cumulative totals', () => {
    expect(receivePayload('transfer', lines, drafts)).toEqual([
      { lineId: 'l1', quantityReceived: 5, quantityRejected: 2 },
      { lineId: 'l2', quantityReceived: 0, quantityRejected: 1 },
    ]);
  });
  it('nothing entered → empty payload', () => {
    expect(receivePayload('transfer', lines, {})).toEqual([]);
  });
});
