// Tests that need a page: real components mounted in happy-dom.
// A test file that uses this starts with the line `// @vitest-environment happy-dom`.
import { getActivePinia } from 'pinia';
import { createApp, nextTick } from 'vue';
import type { App, Component } from 'vue';

let app: App | null = null;

/** Mount a component on the page with the stores of the current test. Call after setupStores(). */
export function mount(component: Component): HTMLElement {
  const host = document.createElement('div');
  document.body.appendChild(host);
  app = createApp(component);
  app.use(getActivePinia()!);
  app.mount(host);
  return host;
}

/** Call in afterEach, before teardownStores(). */
export function unmount(): void {
  if (app) app.unmount();
  app = null;
  document.body.innerHTML = '';
}

/** Wait until the page shows the current state of the stores. */
export const rendered = (): Promise<void> => nextTick();

/** The texts of the buttons inside an element, in order. */
export const buttonTexts = (root: ParentNode): string[] =>
  [...root.querySelectorAll('button')].map(button => button.textContent!.trim());

/** Click the button with this text. Fails the test when there is none. */
export function click(root: ParentNode, text: string): void {
  const button = [...root.querySelectorAll('button')].find(b => b.textContent!.trim() === text);
  if (!button) throw Error('no button "' + text + '" among: ' + buttonTexts(root).join(', '));
  button.click();
}
