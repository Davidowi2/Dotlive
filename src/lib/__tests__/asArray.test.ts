import { describe, it, expect } from 'vitest';
import { asArray } from '../utils';

describe('asArray', () => {
  it('returns the value as-is when it is already an array', () => {
    const arr = [1, 2, 3];
    expect(asArray(arr)).toBe(arr);
  });

  it('returns an empty array for null', () => {
    expect(asArray(null)).toEqual([]);
  });

  it('returns an empty array for undefined', () => {
    expect(asArray(undefined)).toEqual([]);
  });

  it('returns an empty array for an empty object', () => {
    expect(asArray({})).toEqual([]);
  });

  it('returns an empty array for a primitive string', () => {
    expect(asArray('not-an-array')).toEqual([]);
  });

  it('returns an empty array for a number', () => {
    expect(asArray(42)).toEqual([]);
  });

  it('returns an empty array for a boolean', () => {
    expect(asArray(true)).toEqual([]);
  });

  it('unwraps a `{ slots: [...] }` wrapper — the original meetings API shape', () => {
    // Regression: backend used to wrap the slots list in this object. Calling
    // .filter() on the wrapper threw `T.filter is not a function`.
    const wrapped = { slots: [{ id: 'a' }, { id: 'b' }] };
    expect(asArray(wrapped)).toEqual([{ id: 'a' }, { id: 'b' }]);
  });

  it('unwraps a `{ meetings: [...] }` wrapper', () => {
    const wrapped = { meetings: [{ id: 'm1' }] };
    expect(asArray(wrapped)).toEqual([{ id: 'm1' }]);
  });

  it('unwraps a `{ items: [...] }` wrapper', () => {
    const wrapped = { items: ['a', 'b'] };
    expect(asArray(wrapped)).toEqual(['a', 'b']);
  });

  it('unwraps a `{ results: [...] }` wrapper', () => {
    const wrapped = { results: [1, 2] };
    expect(asArray(wrapped)).toEqual([1, 2]);
  });

  it('unwraps a `{ list: [...] }` wrapper', () => {
    const wrapped = { list: ['x'] };
    expect(asArray(wrapped)).toEqual(['x']);
  });

  it('unwraps a `{ data: [...] }` wrapper', () => {
    const wrapped = { data: [{ id: 1 }] };
    expect(asArray(wrapped)).toEqual([{ id: 1 }]);
  });

  it('prefers a flat array over a wrapper — even if the wrapper is present', () => {
    // Defensive: if a future backend returns BOTH the wrapper and a flat
    // array, we keep the flat array (the intended shape).
    const hybrid = { slots: [{ id: 'wrapped' }], 0: { id: 'flat' }, length: 1 };
    // hybrid is not actually an array (the 0/length trick is over-engineered),
    // so asArray should unwrap the slots key.
    expect(asArray(hybrid)).toEqual([{ id: 'wrapped' }]);
  });

  it('preserves the typed element shape (generic)', () => {
    interface MeetingSlot { id: string }
    const wrapped = { slots: [{ id: 'a' } as MeetingSlot] };
    const result = asArray<MeetingSlot>(wrapped);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
  });

  it('does not throw on a circular object reference', () => {
    const obj: any = { foo: 'bar' };
    obj.self = obj;
    expect(() => asArray(obj)).not.toThrow();
    expect(asArray(obj)).toEqual([]);
  });

  it('returns an empty array when a wrapper key holds a non-array value', () => {
    expect(asArray({ slots: 'nope' })).toEqual([]);
    expect(asArray({ meetings: { id: 1 } })).toEqual([]);
    expect(asArray({ items: 42 })).toEqual([]);
  });
});
