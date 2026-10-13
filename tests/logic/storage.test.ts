import { afterEach, describe, expect, it, vi } from 'vitest';
import { session, storage } from '../../src/logic/storage.ts';

afterEach(() => { vi.unstubAllGlobals(); session.forget(); });

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

describe('session', () => {
  function stubSession(): Map<string, string> {
    const data = new Map<string, string>();
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => { data.set(key, value); },
    });
    return data;
  }

  it('reads back what was stored, also after the page is reloaded', () => {
    const data = stubSession();
    expect(session.get('karol.programs')).toBeNull();
    session.set('karol.programs', '{}');
    expect(data.get('karol.programs')).toBe('{}');
    expect(session.get('karol.programs')).toBe('{}');
    session.forget();
    expect(session.get('karol.programs')).toBe('{}');
  });

  it('keeps values until the page is reloaded when there is no session storage', () => {
    vi.stubGlobal('sessionStorage', undefined);
    expect(session.get('karol.programs')).toBeNull();
    expect(() => session.set('karol.programs', '{}')).not.toThrow();
    expect(session.get('karol.programs')).toBe('{}');
    session.forget();
    expect(session.get('karol.programs')).toBeNull();
  });

  it('keeps values until the page is reloaded when session storage is blocked', () => {
    const blocked = () => { throw Error('blocked'); };
    vi.stubGlobal('sessionStorage', { getItem: blocked, setItem: blocked });
    expect(session.get('karol.customs')).toBeNull();
    expect(() => session.set('karol.customs', '1')).not.toThrow();
    expect(session.get('karol.customs')).toBe('1');
    session.forget();
    expect(session.get('karol.customs')).toBeNull();
  });

  it('keeps the latest value when a later write does not fit into storage', () => {
    const data = stubSession();
    session.set('karol.programs', '"old"');
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: () => { throw Error('quota'); },
    });
    session.set('karol.programs', '"new"');
    expect(session.get('karol.programs')).toBe('"new"');
  });

  it('reads and writes values as JSON, and reads null for what is missing or unreadable', () => {
    const data = stubSession();
    expect(session.read('karol.customs')).toBeNull();
    session.write('karol.customs', { counter: 2, blocks: {} });
    expect(data.get('karol.customs')).toBe('{"counter":2,"blocks":{}}');
    expect(session.read('karol.customs')).toEqual({ counter: 2, blocks: {} });
    session.forget();
    data.set('karol.customs', '{not json');
    expect(session.read('karol.customs')).toBeNull();
  });

  it('does not touch local storage', () => {
    stubSession();
    const local = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => local.get(key) ?? null, setItem: (key: string, value: string) => { local.set(key, value); } });
    session.set('karol.programs', '{}');
    expect(local.size).toBe(0);
    expect(storage.get('karol.programs')).toBeNull();
  });
});