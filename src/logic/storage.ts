/** Guarded local storage: the game must keep working when storage is blocked. */
export const storage = {
  get(key: string): string | null { try { return localStorage.getItem(key); } catch (e) { return null; } },
  set(key: string, value: string): void { try { localStorage.setItem(key, value); } catch (e) { /* in-memory only */ } },
};
