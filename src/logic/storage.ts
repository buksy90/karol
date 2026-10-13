/** Guarded local storage: the game must keep working when storage is blocked. */
export const storage = {
  get(key: string): string | null { try { return localStorage.getItem(key); } catch (e) { return null; } },
  set(key: string, value: string): void { try { localStorage.setItem(key, value); } catch (e) { /* in-memory only */ } },
};

// What this page asked session storage to keep. With storage blocked it is all there is,
// which lasts until the page is reloaded.
const memory = new Map<string, string>();

/**
 * Guarded session storage for what lasts as long as the browser tab: values survive a
 * reload and are gone in a new tab. Values are JSON.
 */
export const session = {
  get(key: string): string | null {
    if (memory.has(key)) return memory.get(key)!;
    try { return sessionStorage.getItem(key); } catch (e) { return null; }
  },
  set(key: string, value: string): void {
    memory.set(key, value);
    try { sessionStorage.setItem(key, value); } catch (e) { /* in-memory only */ }
  },
  /** The stored value, or null when there is none or it cannot be read. */
  read(key: string): unknown {
    const text = this.get(key);
    if (text === null) return null;
    try { return JSON.parse(text); } catch (e) { return null; }
  },
  write(key: string, value: unknown): void { this.set(key, JSON.stringify(value)); },
  /** Drop what is held in memory, as a page reload does. Tests use it. */
  forget(): void { memory.clear(); },
};
