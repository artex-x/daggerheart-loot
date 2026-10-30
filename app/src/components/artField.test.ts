/* ArtField.svelte over the fake media port and the fake cloud: the four states of m40, each
   refusal line, the crop dialog's lazy chunk and its failure, «Выбрать из предметов» with
   its filter (m42), «Убрать картинку» and «Обрезать заново», and where the focus goes
   (docs/specs/FEATURES.md, "Homebrew"). */
import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ArtField from './ArtField.svelte';
import { ICONS } from '../lib/icons.js';
import { ART_SOURCE_MAX } from '../lib/art.js';
import { dict } from '../lib/dict.js';
import { recordOf, withRecords } from '../lib/homebrew.js';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED } from '../ports/fake-cloud-seed.js';
import { fakeData, fakeEnv, fakeMedia, fakePicture, type FakeMedia } from '../ports/index.js';
import { AppState } from '../state/app.svelte.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import { readLoot } from '../test/loot.js';

afterEach(cleanup);

Element.prototype.scrollIntoView = vi.fn();

const chunk = vi.hoisted(() => ({ fail: false }));

vi.mock('./CropDialog.svelte', async (importOriginal) => {
  if (chunk.fail) {
    chunk.fail = false;
    throw new Error('the chunk did not load');
  }
  return importOriginal();
});

const t = dict('ru');
const AXE = 'hb_emberaxeaaaaaaaa';
const POTION = 'hb_smithpotionaaaaa';
const REAL = readLoot();

/* Another account's item with a picture, as a list page's index holds it. */
const FOREIGN = recordOf(
  'hb_foreignlampaaaaa',
  { kind: 'item', ru: 'Чужой фонарь', en: 'Foreign Lamp' },
  null,
  [],
  '00000000-0000-4000-8000-000000000999',
  'ci3.webp'
);

async function field(
  opts: {
    selfKey?: string;
    saved?: string | null;
    line?: string | null;
    media?: FakeMedia;
  } = {}
) {
  const media = opts.media ?? fakeMedia();
  const app = new AppState(
    fakeEnv({ cloud: fakeCloud(SEED, 'gm1'), media, data: fakeData(REAL) })
  );
  app.start();
  const store = app.homebrew;
  if (!store) throw new Error('The field needs a configured sign-in. Pass a cloud port.');
  await waitFor(() => {
    expect(store.status).toBe('ready');
  });
  const catalog = app.catalog;
  if (!catalog) throw new Error('The field needs the catalog. Pass fakeData(REAL).');
  const index = withRecords(catalog, store.records, [FOREIGN], store.cardRefs);
  const host = {
    get t() {
      return app.t;
    },
    get lang() {
      return app.lang;
    },
    env: app.env,
    index
  } as unknown as AppState;
  const view = render(ArtField, {
    app: host,
    store,
    selfKey: opts.selfKey ?? POTION,
    saved: opts.saved ?? null,
    line: opts.line ?? null,
    glyph: 'kindConsumable'
  });
  return { ...view, media, store };
}

const thumb = (): HTMLImageElement => document.querySelector('.th img') as HTMLImageElement;
/* The empty square: no picture, the kind glyph alone. */
const glyphOnly = (): void => {
  expect(document.querySelector('.th img')).toBeNull();
  expect(document.querySelector('.th svg path')).toHaveAttribute('d', ICONS.kindConsumable.d);
};
const button = (name: string): HTMLElement => screen.getByRole('button', { name });
const fileInput = (): HTMLInputElement =>
  document.getElementById('hb-art-file') as HTMLInputElement;
const choose = (file: File): Promise<void> => userEvent.upload(fileInput(), file);
const png = (w: number, h: number): File =>
  new File([fakePicture(w, h)], 'picture.png', { type: 'image/png' });

async function crop(file = png(1000, 1000)): Promise<void> {
  await choose(file);
  await userEvent.click(await screen.findByRole('button', { name: t.hbArtDone }));
  await waitFor(() => {
    expect(screen.queryByRole('heading', { name: t.hbArtCrop })).toBeNull();
  });
}

describe('the crop chunk', () => {
  it('says a failed load with «Повторить», keeps the file and loads it on the press', async () => {
    chunk.fail = true;
    const { container } = await field();
    await choose(png(1000, 1000));
    expect(await screen.findByText(t.hbArtChunkFailed)).toHaveAttribute('role', 'alert');
    await expectNoA11yViolations(container);
    await userEvent.click(button(t.retry));
    expect(
      await screen.findByRole('heading', { name: t.hbArtCrop }, { timeout: 10_000 })
    ).toBeInTheDocument();
  });
});

describe('the states of m40', () => {
  it('draws the kind glyph with «Выбрать файл» and «Выбрать из предметов»', async () => {
    const { container } = await field();
    glyphOnly();
    expect(button(t.hbArtChoose)).toBeInTheDocument();
    expect(button(t.hbArtFromItems)).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: t.hbArtRemove })).toBeNull();
    expect(screen.getByText(t.hbArtLine)).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('draws a saved picture with «Заменить» and «Убрать картинку», and no «Обрезать заново»', async () => {
    const { container } = await field({ saved: 'ci1.webp' });
    expect(thumb().src).toContain('/img/thumb/ci1.webp');
    expect(button(t.hbArtReplace)).toBeInTheDocument();
    expect(button(t.hbArtRemove)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: t.hbArtRecrop })).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('draws a cropped file unsaved, crops it again, and moves the focus to «Заменить»', async () => {
    const { container, media } = await field();
    await crop();
    expect(thumb().src).toBe('blob:fake-2');
    expect(button(t.hbArtReplace)).toHaveFocus();
    expect(button(t.hbArtRecrop)).toBeInTheDocument();
    await expectNoA11yViolations(container);
    await userEvent.click(button(t.hbArtRecrop));
    await userEvent.click(await screen.findByRole('button', { name: t.hbArtDone }));
    await waitFor(() => {
      expect(thumb().src).toBe('blob:fake-4');
    });
    /* The first crop's preview went with it. */
    expect(media.released).toContain('blob:fake-2');
  });

  it('removes a saved picture, and keeps none for a crop over no saved picture', async () => {
    await field({ saved: 'ci1.webp' });
    await userEvent.click(button(t.hbArtRemove));
    glyphOnly();
    await waitFor(() => {
      expect(button(t.hbArtChoose)).toHaveFocus();
    });
    cleanup();
    const { media } = await field();
    await crop();
    await userEvent.click(button(t.hbArtRemove));
    glyphOnly();
    expect(media.released).toContain('blob:fake-2');
    expect(screen.queryByRole('button', { name: t.hbArtRecrop })).toBeNull();
  });

  it('draws the kind glyph for a picture that fails to load', async () => {
    await field({ saved: 'ci1.webp' });
    thumb().dispatchEvent(new Event('error'));
    await waitFor(() => {
      glyphOnly();
    });
  });

  it("draws the save's refusal line under the field", async () => {
    const { container } = await field({ saved: 'ci1.webp', line: t.hbArtGone });
    expect(screen.getByText(t.hbArtGone)).toHaveAttribute('role', 'alert');
    await expectNoA11yViolations(container);
  });
});

describe('refusals', () => {
  it('refuses a file over 20 MB before anything reads it', async () => {
    const media = fakeMedia();
    const decode = vi.spyOn(media, 'decode');
    await field({ media });
    const big = png(1000, 1000);
    Object.defineProperty(big, 'size', { value: ART_SOURCE_MAX + 1 });
    await choose(big);
    expect(screen.getByText(t.hbArtTooBig)).toHaveAttribute('role', 'alert');
    expect(decode).not.toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: t.hbArtCrop })).toBeNull();
  });

  for (const [name, file, text] of [
    ['a file it cannot open', new File(['x'], 'x.png', { type: 'image/png' }), t.hbArtBad],
    ['a small picture', png(100, 400), t.hbArtSmall],
    ['a huge picture', png(9000, 400), t.hbArtHuge]
  ] as const) {
    it(`closes the dialog on ${name} and says why under the field`, async () => {
      const { container } = await field();
      await choose(file);
      expect(await screen.findByText(text)).toHaveAttribute('role', 'alert');
      expect(screen.queryByRole('heading', { name: t.hbArtCrop })).toBeNull();
      expect(button(t.hbArtChoose)).toBeInTheDocument();
      await expectNoA11yViolations(container);
      /* The next choice clears the line. */
      await crop();
      expect(screen.queryByText(text)).toBeNull();
    });
  }

  it('says a picture that no quality squeezes under 200 KB', async () => {
    await field({ media: fakeMedia({ size: () => 300000 }) });
    await choose(png(1000, 1000));
    await userEvent.click(await screen.findByRole('button', { name: t.hbArtDone }));
    expect(await screen.findByText(t.hbArtSqueeze)).toBeInTheDocument();
  });

  it('keeps the field as it was on «Отмена» and gives the focus back', async () => {
    await field({ saved: 'ci1.webp' });
    await choose(png(1000, 1000));
    await userEvent.click(await screen.findByRole('button', { name: t.cancel }));
    await waitFor(() => {
      expect(button(t.hbArtReplace)).toHaveFocus();
    });
    expect(thumb().src).toContain('/img/thumb/ci1.webp');
    expect(screen.queryByRole('button', { name: t.hbArtRecrop })).toBeNull();
  });
});

describe('«Выбрать из предметов»', () => {
  const pickerInput = (): HTMLElement =>
    screen.getByRole('combobox', { name: t.hbArtFromItemsLabel });
  const options = (): string[] => screen.queryAllByRole('option').map((o) => o.textContent);

  it("offers catalog pictures and own pictures, never one without, another account's or its own", async () => {
    const { container } = await field();
    await userEvent.click(button(t.hbArtFromItems));
    expect(pickerInput()).toHaveFocus();
    expect(button(t.hbArtFromItems)).toHaveAttribute('aria-expanded', 'true');
    await userEvent.type(pickerInput(), 'Кольцо Тишины');
    expect(options().some((o) => o.startsWith('Кольцо Тишины'))).toBe(true);
    await expectNoA11yViolations(container);
    await userEvent.clear(pickerInput());
    await userEvent.type(pickerInput(), 'Топор Тлеющих');
    expect(options().some((o) => o.startsWith('Топор Тлеющих Углей'))).toBe(true);
    await userEvent.clear(pickerInput());
    await userEvent.type(pickerInput(), 'Кольцо с гравировкой');
    expect(options()).toEqual([]);
    await userEvent.clear(pickerInput());
    await userEvent.type(pickerInput(), 'Чужой фонарь');
    expect(options()).toEqual([]);
  });

  it('never offers the item itself', async () => {
    await field({ selfKey: AXE });
    await userEvent.click(button(t.hbArtFromItems));
    await userEvent.type(pickerInput(), 'Топор Тлеющих');
    expect(options()).toEqual([]);
  });

  it('shows at most 8 options and «Ещё N»', async () => {
    await field();
    await userEvent.click(button(t.hbArtFromItems));
    await userEvent.type(pickerInput(), 'Кольцо');
    expect(options()).toHaveLength(8);
    expect(screen.getByText(/^Ещё \d+ - уточните запрос$/)).toBeInTheDocument();
  });

  it('takes the picked picture and moves the focus to «Заменить»', async () => {
    await field();
    await userEvent.click(button(t.hbArtFromItems));
    await userEvent.type(pickerInput(), 'Кольцо Тишины');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => {
      expect(button(t.hbArtReplace)).toHaveFocus();
    });
    expect(thumb().src).toMatch(/img\/thumb\/ci\d+\.webp$/);
    expect(screen.queryByRole('combobox')).toBeNull();
    /* No saved picture: a removal goes back to none. */
    await userEvent.click(button(t.hbArtRemove));
    glyphOnly();
  });

  it('closes on a second press', async () => {
    await field();
    await userEvent.click(button(t.hbArtFromItems));
    await userEvent.click(button(t.hbArtFromItems));
    expect(screen.queryByRole('combobox')).toBeNull();
  });
});
