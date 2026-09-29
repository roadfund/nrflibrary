import { describe, expect, it } from 'vitest';
import { newId } from './ids';

describe('newId', () => {
  it('prefixes a uuid so two ids created in the same millisecond stay unique', () => {
    const first = newId('sub');
    const second = newId('sub');

    expect(first).not.toBe(second);
    expect(first.startsWith('sub_')).toBe(true);
    expect(first).toMatch(/^sub_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(first).not.toMatch(/^sub_\d{13}$/);
  });
});
