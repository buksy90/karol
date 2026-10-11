// Guarded local storage: the game must keep working when storage is blocked.
export const storage = {
  get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* in-memory only */ } },
};
