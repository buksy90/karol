import { afterEach, describe, expect, it, vi } from 'vitest';
import { storage } from '../../src/logic/storage.ts';

afterEach(() => { vi.unstubAllGlobals(); });

describe('storage', () => {
  it('reads null and does not throw when there is no local storage', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(storage.get('karol.lang')).toBeNull();
    expect(() => storage.set('karol.lang', 'sk')).not.toThrow();
  });

  it('reads null and does not throw when local storage is blocked', () => {
    const blocked = () => { throw Error('blocked'); };
    vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked });
    expect(storage.get('karol.lang')).toBeNull();
    expect(() => storage.set('karol.lang', 'sk')).not.toThrow();
  });

  it('reads back what was stored', () => {
    const data = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => { data.set(key, value); },
    });
    expect(storage.get('karol.lang')).toBeNull();
    storage.set('karol.lang', 'sk');
    expect(storage.get('karol.lang')).toBe('sk');
  });
});
