/* The set-up that homebrewImport.test.ts and homebrewImport.timed.test.ts
   share: `#/homebrew` over the fake cloud with «Импорт из файла» open, a
   homebrew file built in the test, and the readers of the preview rows. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fireEvent, render, screen, type RenderResult } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import App from '../App.svelte';
import type { Loot } from '../lib/data.js';
import { fakeCloud, type FakeCloud, type FakeCloudOptions } from '../ports/fake-cloud.js';
import { SEED, type Seed } from '../ports/fake-cloud-seed.js';
import { fakeData, fakeDialog, fakeEnv, memoryRouter, memoryStorage } from '../ports/index.js';

/** What `opened` returns: the render of the app, its fake cloud and dialog. */
type Opened = RenderResult<typeof App> & {
  cloud: FakeCloud;
  dialog: ReturnType<typeof fakeDialog>;
};

const ROOT = join(import.meta.dirname, '..', '..', '..');
export const LOOT = JSON.parse(readFileSync(join(ROOT, 'data.json'), 'utf8')) as Loot;
export const fixture = (name: string): Uint8Array =>
  new Uint8Array(readFileSync(join(ROOT, 'docs', 'fixtures', 'homebrew-file', name)));
export const utf8 = (s: string): Uint8Array => new TextEncoder().encode(s);
export const doc = (o: Record<string, unknown>): Uint8Array =>
  utf8(JSON.stringify({ format: 'daggerheart-loot/homebrew', version: 1, ...o }));
const BASE32 = 'abcdefghijklmnopqrstuvwxyz234567';
/* A key from a number: `hb_` and 16 base32 characters. */
export const keyN = (n: number): string => {
  let tail = '';
  let v = n;
  do {
    tail = BASE32.charAt(v % 32) + tail;
    v = Math.floor(v / 32);
  } while (v > 0);
  return 'hb_' + tail.padStart(16, 'a');
};
export async function opened(
  as: 'gm1' | 'gm2' = 'gm1',
  opts: FakeCloudOptions = {},
  answer = true,
  seed: Seed = SEED
): Promise<Opened> {
  const cloud = fakeCloud(seed, as, opts);
  const dialog = fakeDialog(answer);
  const view = render(App, {
    env: fakeEnv({
      router: memoryRouter('#/homebrew'),
      data: fakeData(LOOT),
      dialog,
      storage: memoryStorage(),
      cloud
    })
  });
  await userEvent.click(await screen.findByRole('button', { name: 'Импорт из файла' }));
  /* The first open compiles the lazy chunk: slow on a loaded host. */
  await screen.findByText('Импорт предметов из файла JSON', {}, { timeout: 10_000 });
  return { ...view, cloud, dialog };
}

/* The input is `hidden`; its files are set as the browser's picker would. */
export function choose(container: HTMLElement, bytes: Uint8Array, name = 'items.json'): void {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error('no file input');
  const file = new File([new Uint8Array(bytes)], name);
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  void fireEvent.change(input);
}

export const importButton = (n: number): Promise<HTMLElement> =>
  screen.findByRole('button', { name: `Импортировать (${String(n)})` });
export const rowsOf = (c: HTMLElement): HTMLElement[] => [
  ...c.querySelectorAll<HTMLElement>('.srcrow')
];
