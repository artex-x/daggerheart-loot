/* The set-up that homebrewEditor.test.ts and homebrewEditor.timed.test.ts
   share: the editor over the fake cloud, its toast, and the fold «Связи». */
import { render, screen, waitFor, within, type RenderResult } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';
import HomebrewEditor from '../components/HomebrewEditor.svelte';
import { dict } from '../lib/dict.js';
import type { HomebrewContent } from '../lib/homebrew.js';
import { COALESCE_MS } from '../lib/live.js';
import { fakeCloud, type FakeCloud, type FakeCloudOptions } from '../ports/fake-cloud.js';
import { SEED, uuid } from '../ports/fake-cloud-seed.js';
import {
  fakeData,
  fakeDialog,
  fakeEnv,
  fakeMedia,
  fakePage,
  fakePicture,
  memoryRouter,
  memoryStorage,
  type FakeMedia
} from '../ports/index.js';
import { AppState } from '../state/app.svelte.js';
import { readLoot } from './loot.js';

const t = dict('ru');
export const AXE = 'hb_emberaxeaaaaaaaa';
export const ALDER = uuid(501);

export const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

const REAL = readLoot();

/** What `editor` returns: the render, and the state and fakes under it. */
type EditorView = RenderResult<typeof HomebrewEditor> & {
  app: AppState;
  cloud: FakeCloud;
  router: ReturnType<typeof memoryRouter>;
  dialog: ReturnType<typeof fakeDialog>;
  page: ReturnType<typeof fakePage>;
  store: NonNullable<AppState['homebrew']>;
};

export async function editor(
  key: string | null,
  opts: {
    as?: 'gm1' | 'gm2' | null;
    lang?: 'ru' | 'en';
    answer?: boolean;
    fake?: FakeCloudOptions;
    cloud?: FakeCloud;
    /* The real catalogue, for the relations to catalog records. */
    real?: boolean;
    /* The picture field's decode and encode. */
    media?: FakeMedia;
  } = {}
): Promise<EditorView> {
  const as = opts.as === undefined ? 'gm1' : opts.as;
  const cloud =
    opts.cloud ??
    (as === null ? fakeCloud(SEED, undefined, opts.fake) : fakeCloud(SEED, as, opts.fake));
  const hash = '#/homebrew/' + (key ?? 'new');
  const router = memoryRouter(hash);
  const dialog = fakeDialog(opts.answer ?? true);
  const page = fakePage();
  const storage = memoryStorage(opts.lang ? { 'dhloot.lang.v1': opts.lang } : {});
  const data = opts.real ? { data: fakeData(REAL) } : {};
  const media = opts.media ?? fakeMedia();
  const app = new AppState(fakeEnv({ cloud, router, dialog, page, storage, media, ...data }));
  app.start();
  await flush();
  /* The owner feed's join asks for one coalesced read; it lands before a test acts as
     another device. */
  await new Promise((r) => setTimeout(r, COALESCE_MS + 50));
  if (opts.lang) app.setLang(opts.lang);
  const store = app.homebrew;
  if (!store) throw new Error('The editor needs a configured sign-in. Pass a cloud port.');
  const view = render(HomebrewEditor, { app, store, key });
  await flush();
  current = app;
  return { ...view, app, cloud, router, dialog, page, store };
}

/* The toast is the frame's; a render of the editor alone has no frame, so a test reads the
   toast from the state. */
let current: AppState | null = null;
export const toastSays = async (want: string | RegExp): Promise<void> => {
  await waitFor(() => {
    const msg = current?.toast?.msg ?? '';
    if (typeof want === 'string') expect(msg).toBe(want);
    else expect(msg).toMatch(want);
  });
};

export const group = (name: string): HTMLElement => screen.getByRole('group', { name });
export const press = async (groupName: string, option: string): Promise<void> => {
  await userEvent.click(within(group(groupName)).getByRole('button', { name: option }));
};
export const helpButton = (label: string): HTMLElement =>
  screen.getByRole('button', { name: t.fieldHelp.replace('%s', label) });
export const save = (): Promise<void> =>
  userEvent.click(screen.getByRole('button', { name: t.save }));
export const stored = async (
  cloud: FakeCloud,
  key: string
): Promise<HomebrewContent | undefined> => {
  const r = await cloud.homebrew.load();
  return r.ok ? r.items.find((i) => i.key === key)?.content : undefined;
};

/* A fake cloud whose item `key` holds `patch` over its seeded content. */
export async function seeded(
  patches: Record<string, Partial<HomebrewContent>>
): Promise<FakeCloud> {
  const cloud = fakeCloud(SEED, 'gm1');
  const r = await cloud.homebrew.load();
  for (const [key, patch] of Object.entries(patches)) {
    const row = r.ok ? r.items.find((i) => i.key === key) : undefined;
    if (!row) throw new Error(`The seed has no item ${key}. Restore it in fake-cloud-seed.ts.`);
    const content: HomebrewContent = { ...row.content, ...patch };
    const w = await cloud.homebrew.updateItem(row.id, { content, book_id: row.book_id }, null);
    if (!w.ok) throw new Error(`The fake refused ${key}: ${w.error}. Fix the test patch.`);
  }
  return cloud;
}

export const relSummary = (): HTMLElement =>
  screen.getByText(/^Связи/, { selector: 'summary' });
export const relFold = (): HTMLDetailsElement =>
  relSummary().closest('details') as HTMLDetailsElement;
export const openRel = async (): Promise<void> => {
  if (!relFold().open) await userEvent.click(relSummary());
};
export const picker = (name: string): HTMLElement => screen.getByRole('combobox', { name });

/* The picture field: a 1000 px file, its input, and a choice through the crop dialog. */
export const png = (): File =>
  new File([fakePicture(1000, 1000)], 'picture.png', { type: 'image/png' });
export const fileInput = (): HTMLInputElement =>
  document.getElementById('hb-art-file') as HTMLInputElement;
export async function cropFile(): Promise<void> {
  await userEvent.upload(fileInput(), png());
  /* The crop dialog is a lazy chunk: under the full coverage run it loads
     after the default 1 s wait (measured 2026-10-15); artField.test.ts
     waits 10 s for it too. */
  await userEvent.click(
    await screen.findByRole('button', { name: t.hbArtDone }, { timeout: 10_000 })
  );
  await screen.findByRole('button', { name: t.hbArtReplace }, { timeout: 10_000 });
}
