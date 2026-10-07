/* The set-up that importPanel.test.ts and importPanel.timed.test.ts share:
   the lists index over the fake cloud as gm1 with «Импорт из файла» open, the
   picked file, and the readers of the report. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fireEvent, render, screen, type RenderResult } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import App from '../App.svelte';
import type { Loot } from '../lib/data.js';
import { fakeCloud, type FakeCloud, type FakeCloudOptions } from '../ports/fake-cloud.js';
import { SEED } from '../ports/fake-cloud-seed.js';
import { fakeData, fakeDialog, fakeEnv, memoryRouter } from '../ports/index.js';

/** What `opened` returns: the render of the app and its fake cloud. */
type Opened = RenderResult<typeof App> & { cloud: FakeCloud };

export const ROOT = join(import.meta.dirname, '..', '..', '..');
export const LOOT = JSON.parse(readFileSync(join(ROOT, 'data.json'), 'utf8')) as Loot;
export const fixture = (name: string): Uint8Array =>
  new Uint8Array(readFileSync(join(ROOT, 'docs', 'fixtures', 'import', name)));
export const utf8 = (s: string): Uint8Array => new TextEncoder().encode(s);
export const doc = (lists: unknown, extra: Record<string, unknown> = {}): string =>
  JSON.stringify({ format: 'daggerheart-loot/lists', version: 1, lists, ...extra });

export async function opened(options: FakeCloudOptions = {}): Promise<Opened> {
  const cloud = fakeCloud(SEED, 'gm1', options);
  const view = render(App, {
    env: fakeEnv({
      router: memoryRouter('#/lists'),
      data: fakeData(LOOT),
      dialog: fakeDialog(),
      cloud
    })
  });
  await userEvent.click(await screen.findByRole('button', { name: 'Импорт из файла' }));
  return { ...view, cloud };
}

/* The input is `hidden`; its files are set as the browser's picker would. */
export function choose(
  container: HTMLElement,
  bytes: Uint8Array | File,
  name = 'file.json'
): File {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error('no file input');
  const file = bytes instanceof File ? bytes : new File([new Uint8Array(bytes)], name);
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  void fireEvent.change(input);
  return file;
}

export const alertText = async (): Promise<string> =>
  (await screen.findByRole('alert', {}, { timeout: 3000 })).textContent.trim();
export const importButton = (n: number): Promise<HTMLElement> =>
  screen.findByRole('button', { name: `Импортировать (${String(n)})` });
export const cardNames = (c: HTMLElement): string[] =>
  [...c.querySelectorAll('.listcard-top b')].map((b) => b.textContent);
export const lineTexts = (el: Element): string[] =>
  [...el.querySelectorAll('li')].map((li) => li.textContent.replace(/\s+/g, ' ').trim());
