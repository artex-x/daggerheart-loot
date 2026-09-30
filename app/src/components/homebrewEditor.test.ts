/* The homebrew editor over the fake cloud: every field of each kind and type, the
   checks on «Сохранить», the preview, the inline source and section, each refused save,
   the conflict and gone banners, the guard, Ctrl+S, the edited language and the delete.
   docs/specs/FEATURES.md, "Homebrew". */
import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import HomebrewEditor from './HomebrewEditor.svelte';
import { dict } from '../lib/dict.js';
import type { HomebrewContent } from '../lib/homebrew.js';
import { COALESCE_MS } from '../lib/live.js';
import { fakeCloud, type FakeCloud, type FakeCloudOptions } from '../ports/fake-cloud.js';
import { SEED, uuid } from '../ports/fake-cloud-seed.js';
import { fakeDialog, fakeEnv, fakePage, memoryRouter, memoryStorage } from '../ports/index.js';
import { AppState } from '../state/app.svelte.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const t = dict('ru');
const AXE = 'hb_emberaxeaaaaaaaa';
const RING = 'hb_engravedringaaaa';
const CAP = 'hb_whispercapaaaaaa';
const POTION = 'hb_smithpotionaaaaa';
const ALDER = uuid(501);

const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

async function editor(
  key: string | null,
  opts: {
    as?: 'gm1' | 'gm2' | null;
    lang?: 'ru' | 'en';
    answer?: boolean;
    fake?: FakeCloudOptions;
    cloud?: FakeCloud;
  } = {}
) {
  const as = opts.as === undefined ? 'gm1' : opts.as;
  const cloud =
    opts.cloud ??
    (as === null ? fakeCloud(SEED, undefined, opts.fake) : fakeCloud(SEED, as, opts.fake));
  const hash = '#/homebrew/' + (key ?? 'new');
  const router = memoryRouter(hash);
  const dialog = fakeDialog(opts.answer ?? true);
  const page = fakePage();
  const storage = memoryStorage(opts.lang ? { 'dhloot.lang.v1': opts.lang } : {});
  const app = new AppState(fakeEnv({ cloud, router, dialog, page, storage }));
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
const toastSays = async (want: string | RegExp): Promise<void> => {
  await waitFor(() => {
    const msg = current?.toast?.msg ?? '';
    if (typeof want === 'string') expect(msg).toBe(want);
    else expect(msg).toMatch(want);
  });
};

const group = (name: string): HTMLElement => screen.getByRole('group', { name });
const press = async (groupName: string, option: string): Promise<void> => {
  await userEvent.click(within(group(groupName)).getByRole('button', { name: option }));
};
const save = (): Promise<void> => userEvent.click(screen.getByRole('button', { name: t.save }));
const stored = async (cloud: FakeCloud, key: string): Promise<HomebrewContent | undefined> => {
  const r = await cloud.homebrew.load();
  return r.ok ? r.items.find((i) => i.key === key)?.content : undefined;
};

describe('the form', () => {
  it('draws a new loot item: the legend, the marks, the default source and a preview', async () => {
    const { container } = await editor(null);
    expect(screen.getByRole('heading', { level: 1, name: t.hbNewItem })).toBeInTheDocument();
    expect(screen.getByText(t.hbLegend)).toBeInTheDocument();
    expect(screen.getByLabelText(/Название/)).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText(t.hbSource)).toHaveValue('');
    expect(within(group(t.hbKind)).getByRole('button', { name: t.item })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(within(group(t.tier)).getByRole('button', { name: t.hbNone })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.queryByLabelText(t.hbSection)).toBeNull();
    await userEvent.type(screen.getByLabelText(/Название/), 'Рог');
    expect(screen.getByRole('heading', { level: 1, name: 'Рог' })).toBeInTheDocument();
    expect(screen.getAllByText('Рог').length).toBeGreaterThan(1);
    await expectNoA11yViolations(container);
  });

  it('draws the weapon fields, no tier pressed, and the second set folded', async () => {
    const { container } = await editor(null);
    await press(t.hbKind, t.fEquip);
    expect(
      within(group(t.hbType)).getByRole('button', { name: 'Основное оружие' })
    ).toHaveAttribute('aria-pressed', 'true');
    const tiers = within(group(t.tier)).getAllByRole('button');
    expect(tiers.map((b) => b.getAttribute('aria-pressed'))).toEqual([
      'false',
      'false',
      'false',
      'false',
      'false'
    ]);
    expect(screen.getByText(t.hbTierHint)).toBeInTheDocument();
    for (const name of [t.hbCls, t.hbTrait, t.hbRange, t.hbDt, t.hbBurden]) {
      expect(group(name)).toBeInTheDocument();
    }
    expect(screen.getByLabelText(/^Урон\*/)).toBeInTheDocument();
    const alt = screen.getByText(t.hbAlt).closest('details') as HTMLDetailsElement;
    expect(alt.open).toBe(false);
    await userEvent.click(screen.getByText(t.hbAlt));
    expect(alt.open).toBe(true);
    await expectNoA11yViolations(container);
  });

  it('draws the armour fields and keeps the weapon values while another type is chosen', async () => {
    const { container } = await editor(AXE);
    await press(t.hbType, 'Броня');
    expect(screen.getByLabelText(/^Показатель брони/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Пороги урона\*/)).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: t.hbCls })).toBeNull();
    await press(t.hbType, 'Основное оружие');
    expect(screen.getByLabelText(/^Урон\*/)).toHaveValue('d10+2');
    await expectNoA11yViolations(container);
  });

  it('draws no stat block in the preview until a tier is chosen', async () => {
    await editor(null);
    await press(t.hbKind, t.fEquip);
    await userEvent.type(screen.getByLabelText(/Название/), 'Меч');
    expect(screen.queryByText(/Основное оружие · Ранг/)).toBeNull();
    await press(t.tier, '3');
    expect(screen.getByText('Хоумбрю · Ранг 3')).toBeInTheDocument();
  });
});

describe('the checks on «Сохранить»', () => {
  it('sends nothing, focuses the summary, links each field and clears a field on its change', async () => {
    const { cloud, container } = await editor(null);
    const create = vi.spyOn(cloud.homebrew, 'createItem');
    await press(t.hbKind, t.fEquip);
    await save();
    expect(create).not.toHaveBeenCalled();
    const box = screen.getByRole('alert');
    await waitFor(() => {
      expect(box).toHaveFocus();
    });
    expect(box).toHaveTextContent('Не сохранено: исправьте 8 полей.');
    const name = screen.getByLabelText(/Название/);
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAttribute('aria-describedby', 'hb-name-err');
    expect(screen.getByText(t.hbErrName)).toHaveAttribute('id', 'hb-name-err');
    expect(group(t.tier)).toHaveAttribute('aria-describedby', 'hb-eqtier-err');
    await userEvent.click(within(box).getByRole('button', { name: /^Урон - запишите/ }));
    await waitFor(() => {
      expect(screen.getByLabelText(/^Урон\*/)).toHaveFocus();
    });
    await userEvent.click(within(box).getByRole('button', { name: /^Ранг - выберите/ }));
    await waitFor(() => {
      expect(group(t.tier)).toHaveFocus();
    });
    await userEvent.type(name, 'Меч');
    expect(name).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByText(t.hbErrName)).toBeNull();
    expect(box).toHaveTextContent('Не сохранено: исправьте 7 полей.');
    await press(t.tier, '1');
    expect(screen.queryByText(t.hbErrTier)).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('draws each rule of a weapon and an armour', async () => {
    await editor(AXE);
    const dmg = screen.getByLabelText(/^Урон\*/);
    await userEvent.clear(dmg);
    await userEvent.type(dmg, '2d8');
    await userEvent.click(screen.getByText(t.hbAlt));
    await press(t.hbAlt + ': ' + t.hbTrait, 'Сила');
    await save();
    expect(screen.getByText(t.hbErrDmg)).toBeInTheDocument();
    expect(screen.getAllByText(t.hbErrAlt)).toHaveLength(3);
    await press(t.hbType, 'Броня');
    await userEvent.type(screen.getByLabelText(/^Показатель брони/), '13');
    await userEvent.type(screen.getByLabelText(/^Пороги урона\*/), '9');
    await userEvent.type(screen.getByLabelText(t.hbTh + ' 2'), '4');
    await save();
    expect(screen.getByText(t.hbErrAs)).toBeInTheDocument();
    expect(screen.getByText(t.hbErrThOrder)).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText(/^Пороги урона\*/));
    await userEvent.type(screen.getByLabelText(/^Пороги урона\*/), 'x');
    await save();
    expect(screen.getByText(t.hbErrTh)).toBeInTheDocument();
  });

  it('refuses a name past 120 characters and a text with a control character', async () => {
    await editor(null);
    const name = screen.getByLabelText(/Название/);
    await userEvent.click(name);
    await userEvent.paste('я'.repeat(121));
    await save();
    expect(screen.getByText('Не длиннее 120 знаков.')).toBeInTheDocument();
    await userEvent.clear(name);
    await userEvent.type(name, 'Рог');
    await userEvent.click(screen.getByLabelText(t.hbDesc));
    await userEvent.paste('a\u0007b');
    await save();
    expect(screen.getByText(t.hbErrControl)).toBeInTheDocument();
  });
});

describe('saving', () => {
  it('saves a new item, replaces the address and keeps the form mounted and focused', async () => {
    const router = memoryRouter('#/homebrew/new');
    const cloud = fakeCloud(SEED, 'gm2');
    render(App, { env: fakeEnv({ cloud, router, storage: memoryStorage() }) });
    const name = await screen.findByLabelText(/Название/);
    await userEvent.type(name, 'Рог охотника');
    await userEvent.type(screen.getByLabelText(t.hbDesc), 'Трубит.');
    await save();
    expect(await screen.findByText('Сохранено: «Рог охотника»')).toBeInTheDocument();
    const read = await cloud.homebrew.load();
    const key = read.ok ? read.items[0]?.key : undefined;
    expect(read.ok && read.items[0]?.content).toEqual({
      kind: 'item',
      ru: 'Рог охотника',
      rud: 'Трубит.'
    });
    expect(router.hash()).toBe('#/homebrew/' + String(key));
    expect(screen.getByLabelText(/Название/)).toBe(name);
    expect(screen.getByRole('button', { name: t.save })).toHaveFocus();
    expect(screen.getByRole('button', { name: t.del })).toBeInTheDocument();
  });

  it('saves an edit over its revision and saves by Ctrl+S', async () => {
    const { cloud, container } = await editor(AXE);
    const name = screen.getByLabelText(/Название/);
    expect(name).toHaveValue('Топор Тлеющих Углей');
    await userEvent.clear(name);
    await userEvent.type(name, 'Топор II');
    await save();
    await toastSays('Сохранено: «Топор II»');
    expect((await stored(cloud, AXE))?.ru).toBe('Топор II');
    expect((await stored(cloud, AXE))?.en).toBe('Ember Axe');
    await userEvent.type(name, '!');
    await userEvent.keyboard('{Control>}s{/Control}');
    await waitFor(async () => {
      expect((await stored(cloud, AXE))?.ru).toBe('Топор II!');
    });
    await expectNoA11yViolations(container);
  });

  it('says the limit and the lost network, and keeps the form', async () => {
    const { cloud } = await editor(null, { fake: { limits: { items: 4 } } });
    await userEvent.type(screen.getByLabelText(/Название/), 'Пятый');
    await save();
    expect(
      await screen.findByText(/^Не сохранено\. Достигнут предел своих предметов: 4\./)
    ).toBeInTheDocument();
    cloud.setOffline(true);
    await save();
    expect(await screen.findByText(t.hbSaveNetwork)).toBeInTheDocument();
    expect(screen.getByLabelText(/Название/)).toHaveValue('Пятый');
  });

  it('says how many lists hold the item', async () => {
    const { app } = await editor(RING);
    app.listsHolding = () => 2;
    cleanup();
    render(HomebrewEditor, { app, store: app.homebrew!, key: RING });
    await flush();
    expect(
      screen.getByText(
        'Предмет есть в 2 списках: изменения появятся в них сразу, в том числе у игроков по ссылке.'
      )
    ).toBeInTheDocument();
  });
});

describe('the source and the section', () => {
  it('picks a source and a section, and resets the section on a source change', async () => {
    const { cloud } = await editor(RING);
    await userEvent.selectOptions(screen.getByLabelText(t.hbSource), ALDER);
    await userEvent.selectOptions(screen.getByLabelText(t.hbSection), 'hb_sectpistolsaaaaa');
    await save();
    await toastSays(/^Сохранено/);
    expect((await stored(cloud, RING))?.section).toBe('hb_sectpistolsaaaaa');
    expect(screen.getByText('Хоумбрю · Мастерская Ольхи · Пистоли')).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText(t.hbSource), '');
    expect(screen.queryByLabelText(t.hbSection)).toBeNull();
  });

  it('makes a source inline, with its refusals, and selects it', async () => {
    const { container } = await editor(null, { as: 'gm2' });
    await userEvent.selectOptions(screen.getByLabelText(t.hbSource), '__new');
    const box = screen.getByLabelText(t.hbNewSource);
    await waitFor(() => {
      expect(box).toHaveFocus();
    });
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByText(t.hbErrSourceName)).toBeInTheDocument();
    await userEvent.type(box, 'Homebrew{Enter}');
    expect(await screen.findByText('Источник «Homebrew» уже есть.')).toBeInTheDocument();
    await userEvent.clear(box);
    await userEvent.type(box, 'Кузня{Enter}');
    await toastSays('Источник «Кузня» создан');
    const select = screen.getByLabelText(t.hbSource);
    expect((select as HTMLSelectElement).selectedOptions[0]?.textContent).toBe('Кузня');
    await expectNoA11yViolations(container);
  });

  it('makes a section inline and selects it; a cancel returns the select', async () => {
    const { cloud } = await editor(RING);
    await userEvent.selectOptions(screen.getByLabelText(t.hbSource), ALDER);
    await userEvent.selectOptions(screen.getByLabelText(t.hbSection), '__new');
    await userEvent.type(screen.getByLabelText(t.hbNewSection), 'пистоли{Enter}');
    expect(
      await screen.findByText('Раздел «пистоли» уже есть в этом источнике.')
    ).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.getByLabelText(t.hbSection)).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText(t.hbSection), '__new');
    await userEvent.type(screen.getByLabelText(t.hbNewSection), 'Луки{Enter}');
    await toastSays('Раздел «Луки» создан');
    const read = await cloud.homebrew.load();
    const key = read.ok ? read.books[0]?.content.sections?.at(-1)?.key : undefined;
    expect(screen.getByLabelText(t.hbSection)).toHaveValue(key);
  });

  it('draws a deleted source under a dirty draft as its own problem', async () => {
    const { cloud, store } = await editor(RING);
    await userEvent.selectOptions(screen.getByLabelText(t.hbSource), ALDER);
    await cloud.homebrew.removeBook(ALDER);
    await store.read();
    await flush();
    await save();
    expect(screen.getByText(t.hbErrBookGone)).toBeInTheDocument();
  });
});

describe('another device', () => {
  it('draws the conflict; «Сохранить мою версию» writes over it', async () => {
    const { cloud } = await editor(AXE);
    const row = (await cloud.homebrew.load()) as {
      ok: true;
      items: { key: string; id: string; content: HomebrewContent; book_id: string | null }[];
    };
    const axe = row.items.find((i) => i.key === AXE)!;
    await cloud.homebrew.updateItem(
      axe.id,
      { content: { ...axe.content, ru: 'Чужое' }, book_id: axe.book_id },
      null
    );
    await userEvent.type(screen.getByLabelText(/Название/), '!');
    await save();
    expect(await screen.findByText(t.hbConflict)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: t.hbSaveMine }));
    await waitFor(async () => {
      expect((await stored(cloud, AXE))?.ru).toBe('Топор Тлеющих Углей!');
    });
    expect(screen.queryByText(t.hbConflict)).toBeNull();
  });

  it('«Показать новую версию» asks, then reloads; after a failed read it keeps the draft', async () => {
    const { cloud, dialog } = await editor(AXE);
    const read = (await cloud.homebrew.load()) as {
      ok: true;
      items: { key: string; id: string; content: HomebrewContent; book_id: string | null }[];
    };
    const axe = read.items.find((i) => i.key === AXE)!;
    await cloud.homebrew.updateItem(
      axe.id,
      { content: { ...axe.content, ru: 'Чужое' }, book_id: axe.book_id },
      null
    );
    await userEvent.type(screen.getByLabelText(/Название/), '!');
    await save();
    await screen.findByText(t.hbConflict);
    cloud.setOffline(true);
    await userEvent.click(screen.getByRole('button', { name: t.hbShowNew }));
    expect(dialog.asked.at(-1)).toBe(t.hbDropEdits);
    expect(await screen.findByText(t.hbWriteFailed)).toBeInTheDocument();
    expect(screen.getByLabelText(/Название/)).toHaveValue('Топор Тлеющих Углей!');
    expect(screen.getByText(t.hbConflict)).toBeInTheDocument();
    cloud.setOffline(false);
    await userEvent.click(screen.getByRole('button', { name: t.hbShowNew }));
    await waitFor(() => {
      expect(screen.getByLabelText(/Название/)).toHaveValue('Чужое');
    });
    expect(screen.queryByText(t.hbConflict)).toBeNull();
  });

  it('a dirty form whose item another tab deletes keeps the typed text and draws the gone banner', async () => {
    const { cloud, store, router } = await editor(RING);
    await userEvent.type(screen.getByLabelText(/Название/), ' мой');
    const read = (await cloud.homebrew.load()) as {
      ok: true;
      items: { key: string; id: string }[];
    };
    await cloud.homebrew.removeItem(read.items.find((i) => i.key === RING)!.id);
    await store.read();
    expect(await screen.findByText(t.hbGone)).toBeInTheDocument();
    expect(screen.getByLabelText(/Название/)).toHaveValue('Кольцо с гравировкой мой');
    await userEvent.click(screen.getByRole('button', { name: t.hbSaveAsNew }));
    await toastSays('Сохранено: «Кольцо с гравировкой мой»');
    expect(router.hash()).toMatch(/^#\/homebrew\/hb_new/);
    expect(screen.queryByText(t.hbGone)).toBeNull();
    expect(screen.getByLabelText(/Название/)).toHaveValue('Кольцо с гравировкой мой');
  });

  it('draws the gone banner when a save finds the item deleted', async () => {
    const { cloud } = await editor(RING);
    const read = (await cloud.homebrew.load()) as {
      ok: true;
      items: { key: string; id: string }[];
    };
    await userEvent.type(screen.getByLabelText(/Название/), '!');
    await cloud.homebrew.removeItem(read.items.find((i) => i.key === RING)!.id);
    await save();
    expect(await screen.findByText(t.hbGone)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: t.hbToMyItems })).toHaveAttribute(
      'href',
      '#/homebrew'
    );
  });

  it('reloads a clean form when a read brings a newer row', async () => {
    const { cloud, store } = await editor(RING);
    const read = (await cloud.homebrew.load()) as {
      ok: true;
      items: { key: string; id: string; content: HomebrewContent }[];
    };
    const ring = read.items.find((i) => i.key === RING)!;
    await cloud.homebrew.updateItem(
      ring.id,
      { content: { ...ring.content, ru: 'Кольцо II' }, book_id: null },
      null
    );
    await store.read();
    await waitFor(() => {
      expect(screen.getByLabelText(/Название/)).toHaveValue('Кольцо II');
    });
  });
});

describe('the guard', () => {
  it('asks on an in-app navigation and on unload while dirty, never after a save', async () => {
    const { app, dialog, page } = await editor(RING, { answer: false });
    expect(page.unloadAsks()).toBe(false);
    await userEvent.type(screen.getByLabelText(/Название/), '!');
    expect(page.unloadAsks()).toBe(true);
    app.go('#/lists');
    expect(dialog.asked).toEqual([t.leaveUnsaved]);
    expect(app.hash).toBe('#/homebrew/' + RING);
    await save();
    await toastSays(/^Сохранено/);
    expect(page.unloadAsks()).toBe(false);
    app.go('#/lists');
    expect(app.hash).toBe('#/lists');
    expect(dialog.asked).toHaveLength(1);
  });

  it('deletes after its confirm and leaves with no question', async () => {
    const { app, dialog, cloud } = await editor(RING);
    await userEvent.type(screen.getByLabelText(/Название/), '!');
    await userEvent.click(screen.getByRole('button', { name: t.del }));
    expect(dialog.asked).toEqual(['Удалить предмет «Кольцо с гравировкой!»? Отменить нельзя.']);
    await waitFor(() => {
      expect(app.hash).toBe('#/homebrew');
    });
    expect(dialog.asked).toHaveLength(1);
    expect(await stored(cloud, RING)).toBeUndefined();
  });

  it('asks the list form of the delete confirm, and says a failed delete', async () => {
    const { app, cloud, dialog } = await editor(RING, { answer: true });
    app.listsHolding = () => 1;
    cleanup();
    render(HomebrewEditor, { app, store: app.homebrew!, key: RING });
    await flush();
    cloud.setOffline(true);
    await userEvent.click(screen.getByRole('button', { name: t.del }));
    expect(dialog.asked.at(-1)).toBe(
      'Предмет «Кольцо с гравировкой» есть в 1 списке. Удалить его и убрать из списков? Отменить нельзя.'
    );
    expect(await screen.findByText(t.hbDeleteFailed)).toBeInTheDocument();
  });
});

describe('the edited language', () => {
  it('edits an English-only item in the Russian UI and keeps it English', async () => {
    const { cloud } = await editor(CAP);
    const name = screen.getByLabelText(/Название/);
    expect(name).toHaveValue('Whispering Cap');
    await userEvent.type(name, ' II');
    await save();
    await toastSays(/^Сохранено/);
    expect(await stored(cloud, CAP)).toEqual({
      kind: 'item',
      en: 'Whispering Cap II',
      ende: 'Once per rest, hear one sentence spoken within Far range.',
      tier: 2
    });
  });

  it('edits a Russian-only item in the English UI and keeps it Russian', async () => {
    const { cloud } = await editor(POTION, { lang: 'en' });
    const name = screen.getByLabelText(/Name/);
    expect(name).toHaveValue('Настой кузнеца');
    await userEvent.type(name, '!');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await toastSays(/^Saved/);
    const c = await stored(cloud, POTION);
    expect(c?.ru).toBe('Настой кузнеца!');
    expect(c?.en).toBeUndefined();
  });

  it('writes the other language of a two-language item back unchanged', async () => {
    const { cloud } = await editor(AXE, { lang: 'en' });
    const name = screen.getByLabelText(/Name/);
    expect(name).toHaveValue('Ember Axe');
    await userEvent.type(name, ' II');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await toastSays(/^Saved/);
    const c = await stored(cloud, AXE);
    expect([c?.en, c?.ru, c?.rud]).toEqual([
      'Ember Axe II',
      'Топор Тлеющих Углей',
      'Лезвие тлеет и не гаснет под дождём.'
    ]);
  });
});

describe('the states around the form', () => {
  it('draws not found for a key the store does not hold', async () => {
    const { container } = await editor('hb_nosuchitemaaaaa');
    expect(screen.getByRole('heading', { name: t.notFound })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: t.hbToMyItems })).toHaveAttribute(
      'href',
      '#/homebrew'
    );
    await expectNoA11yViolations(container);
  });

  it('asks a signed-out reader to sign in', async () => {
    await editor(AXE, { as: null });
    expect(screen.getByText(t.hbSignIn)).toBeInTheDocument();
  });

  it('draws a failed load with «Повторить», not «Предмет не найден»', async () => {
    const cloud = fakeCloud(SEED, 'gm1', { offline: true });
    await editor(AXE, { cloud });
    expect(screen.getByText(t.hbLoadFailed)).toBeInTheDocument();
    expect(screen.queryByText(t.notFound)).toBeNull();
    cloud.setOffline(false);
    await userEvent.click(screen.getByRole('button', { name: t.retry }));
    expect(await screen.findByLabelText(/Название/)).toHaveValue('Топор Тлеющих Углей');
  });
});

describe('a retry, a delete in flight, Enter and the preview', () => {
  it('«Сохранить как новый» sent again after a lost answer makes one item, keeps the form and asks on unload', async () => {
    const { cloud, store, page, router } = await editor(RING);
    const read = (await cloud.homebrew.load()) as {
      ok: true;
      items: { key: string; id: string }[];
    };
    const create = cloud.homebrew.createItem.bind(cloud.homebrew);
    let lose = true;
    cloud.homebrew.createItem = async (row) => {
      const r = await create(row);
      if (!lose) return r;
      lose = false;
      return { ok: false, error: 'network' };
    };
    const name = screen.getByLabelText(/Название/);
    await userEvent.type(name, ' мой');
    await cloud.homebrew.removeItem(read.items.find((i) => i.key === RING)!.id);
    await store.read();
    expect(await screen.findByText(t.hbGone)).toBeInTheDocument();
    expect(page.unloadAsks()).toBe(true);
    const again = screen.getByRole('button', { name: t.hbSaveAsNew });
    await userEvent.click(again);
    expect(await screen.findByText(t.hbSaveNetwork)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: t.hbSaveAsNew }));
    await toastSays('Сохранено: «Кольцо с гравировкой мой»');
    const after = await cloud.homebrew.load();
    const mine = after.ok
      ? after.items.filter((i) => i.content.ru === 'Кольцо с гравировкой мой')
      : [];
    expect(mine).toHaveLength(1);
    expect(router.hash()).toBe('#/homebrew/' + String(mine[0]?.key));
    expect(screen.getByLabelText(/Название/)).toBe(name);
    expect(screen.getByRole('button', { name: t.save })).toBeInTheDocument();
    expect(page.unloadAsks()).toBe(false);
  });

  it('draws neither the gone banner nor «Предмет не найден» while a delete reads the lists', async () => {
    const { cloud, app } = await editor(RING);
    let answer: (() => void) | null = null;
    const list = cloud.lists.list.bind(cloud.lists);
    cloud.lists.list = () =>
      new Promise((resolve) => {
        answer = () => {
          void list().then(resolve);
        };
      });
    await userEvent.type(screen.getByLabelText(/Название/), '!');
    await userEvent.click(screen.getByRole('button', { name: t.del }));
    await flush();
    await flush();
    expect(screen.queryByText(t.hbGone)).toBeNull();
    expect(screen.queryByText(t.notFound)).toBeNull();
    expect(app.hash).toBe('#/homebrew/' + RING);
    (answer as unknown as () => void)();
    await waitFor(() => {
      expect(app.hash).toBe('#/homebrew');
    });
  });

  it('saves on Enter in a one-line field of a weapon', async () => {
    const { cloud } = await editor(AXE);
    const dmg = screen.getByLabelText(/^Урон\*/);
    await userEvent.clear(dmg);
    await userEvent.type(dmg, 'd12{Enter}');
    await waitFor(async () => {
      expect((await stored(cloud, AXE))?.eq?.dmg).toBe('d12');
    });
  });

  it('draws the full card as the preview, with no link to an unsaved key', async () => {
    const { container } = await editor(null);
    await userEvent.type(screen.getByLabelText(/Название/), 'Рог');
    expect(container.querySelector('a[href^="#/i/"]')).toBeNull();
  });
});
