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
import { canonJson, type HomebrewContent } from '../lib/homebrew.js';
import { fakeCloud, type FakeCloud } from '../ports/fake-cloud.js';
import { SEED, uuid } from '../ports/fake-cloud-seed.js';
import { fakeEnv, memoryRouter, memoryStorage } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import {
  ALDER,
  AXE,
  editor,
  flush,
  group,
  helpButton,
  openRel,
  picker,
  press,
  relFold,
  relSummary,
  save,
  seeded,
  stored,
  toastSays
} from '../test/homebrewEditor.js';

afterEach(cleanup);

/* jsdom does not implement scrollIntoView - the preview's add-to-list menu places
   itself with it once open. */
Element.prototype.scrollIntoView = vi.fn();

const t = dict('ru');
const RING = 'hb_engravedringaaaa';
const CAP = 'hb_whispercapaaaaaa';
const POTION = 'hb_smithpotionaaaaa';

/* The main damage pair by its own labels; the second set's carry its prefix. */
const dieBox = (): HTMLElement => screen.getByRole('combobox', { name: t.hbDmgDie });
const bonusBox = (): HTMLElement => screen.getByRole('textbox', { name: t.hbDmgBonus });
const altButton = (): HTMLElement => screen.getByRole('button', { name: t.hbAlt });
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
    expect(within(group(t.tier)).getByRole('button', { name: t.hbNoTier })).toHaveAttribute(
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
      'false'
    ]);
    expect(helpButton(t.tier)).toHaveAttribute('aria-expanded', 'false');
    for (const name of [t.hbCls, t.hbTrait, t.hbRange, t.hbDt, t.hbBurden]) {
      expect(group(name)).toBeInTheDocument();
    }
    expect(dieBox()).toBeInTheDocument();
    const body = document.getElementById('hb-alt-body');
    expect(altButton()).toHaveAttribute('aria-expanded', 'false');
    expect(altButton()).toHaveAttribute('aria-controls', 'hb-alt-body');
    expect(body).not.toBeVisible();
    await userEvent.click(altButton());
    expect(altButton()).toHaveAttribute('aria-expanded', 'true');
    expect(body).toBeVisible();
    await expectNoA11yViolations(container);
  });

  it('draws the armour fields and keeps the weapon values while another type is chosen', async () => {
    const { container } = await editor(AXE);
    await press(t.hbType, 'Броня');
    expect(screen.getByLabelText(/^Показатель брони/)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: t.hbThMajor })).toHaveAttribute('id', 'hb-th0');
    expect(screen.getByRole('textbox', { name: t.hbThSevere })).toHaveAttribute('id', 'hb-th1');
    expect(screen.getByRole('group', { name: t.hbTh })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: t.fieldHelp.replace('%s', t.hbTh) })
    ).toBeNull();
    expect(screen.queryByRole('group', { name: t.hbCls })).toBeNull();
    await press(t.hbType, 'Основное оружие');
    expect(dieBox()).toHaveValue('d10');
    expect(bonusBox()).toHaveValue('2');
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
    await userEvent.click(within(box).getByRole('button', { name: /^Урон - выберите кость/ }));
    await waitFor(() => {
      expect(dieBox()).toHaveFocus();
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
    const bonus = bonusBox();
    await userEvent.clear(bonus);
    await userEvent.type(bonus, 'x');
    await userEvent.click(altButton());
    await press(t.hbAlt + ': ' + t.hbTrait, 'Сила');
    await save();
    expect(screen.getByText(t.hbErrDmg)).toBeInTheDocument();
    expect(screen.getAllByText(t.hbErrAlt)).toHaveLength(3);
    await press(t.hbType, 'Броня');
    await userEvent.type(screen.getByLabelText(/^Показатель брони/), '13');
    await userEvent.type(screen.getByLabelText(t.hbThMajor), '9');
    await userEvent.type(screen.getByLabelText(t.hbThSevere), '4');
    await save();
    expect(screen.getByText(t.hbErrAs)).toBeInTheDocument();
    expect(screen.getByText(t.hbErrThOrder)).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText(t.hbThMajor));
    await userEvent.type(screen.getByLabelText(t.hbThMajor), 'x');
    await save();
    expect(screen.getByText(t.hbErrTh)).toBeInTheDocument();
  });

  it('stops a name at 120 characters and refuses a text with a control character', async () => {
    await editor(null);
    const name = screen.getByLabelText(/Название/);
    expect(name).toHaveAttribute('maxlength', '120');
    expect(screen.getByLabelText(t.hbDesc)).toHaveAttribute('maxlength', '3000');
    await userEvent.click(name);
    await userEvent.paste('я'.repeat(121));
    expect(name).toHaveValue('я'.repeat(120));
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
    expect(await screen.findByText('Предмет «Рог охотника» создан')).toBeInTheDocument();
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
    await toastSays('Предмет «Кольцо с гравировкой мой» создан');
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
    expect(dialog.asked).toEqual([
      'Удалить предмет «Кольцо с гравировкой!»? Отменить удаление нельзя.'
    ]);
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
      'Предмет «Кольцо с гравировкой» есть в 1 списке. Удалить его и убрать из списков? Отменить удаление нельзя.'
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
    await toastSays('Предмет «Кольцо с гравировкой мой» создан');
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
    await userEvent.selectOptions(dieBox(), 'd12');
    const bonus = bonusBox();
    await userEvent.clear(bonus);
    await userEvent.type(bonus, '{Enter}');
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

describe('the damage pair', () => {
  it('offers «Кость» and the six dice, and saves d12 with 25 as d12+25', async () => {
    const { cloud, container } = await editor(AXE);
    const die = dieBox();
    expect(
      within(die)
        .getAllByRole('option')
        .map((o) => o.textContent)
    ).toEqual([t.hbDie, 'd4', 'd6', 'd8', 'd10', 'd12', 'd20']);
    expect(die).toHaveAttribute('aria-required', 'true');
    await userEvent.selectOptions(die, 'd12');
    const bonus = bonusBox();
    await userEvent.clear(bonus);
    await userEvent.type(bonus, '25');
    await save();
    await waitFor(async () => {
      expect((await stored(cloud, AXE))?.eq?.dmg).toBe('d12+25');
    });
    await expectNoA11yViolations(container);
  });

  it('draws the damage problem under «Урон» for a bonus of 100 and sends nothing', async () => {
    const { cloud, container } = await editor(AXE);
    const update = vi.spyOn(cloud.homebrew, 'updateItem');
    const bonus = bonusBox();
    await userEvent.clear(bonus);
    await userEvent.type(bonus, '100');
    await save();
    expect(screen.getByText(t.hbErrDmg)).toHaveAttribute('id', 'hb-dmg-err');
    expect(dieBox()).toHaveAttribute('aria-invalid', 'true');
    expect(bonus).toHaveAttribute('aria-invalid', 'true');
    expect(bonus).toHaveAttribute('aria-describedby', 'hb-dmg-err');
    expect(update).not.toHaveBeenCalled();
    await expectNoA11yViolations(container);
  });
});

describe('the second set', () => {
  const ALT_TRAIT = t.hbAlt + ': ' + t.hbTrait;
  const pressedIn = (name: string): HTMLElement =>
    within(group(name)).getByRole('button', { pressed: true });

  it('opens with its hint behind its «?»; a second press unpresses a choice of the set, never a main one', async () => {
    const { container } = await editor(null);
    await press(t.hbKind, t.fEquip);
    await userEvent.click(altButton());
    const hint = screen.getByText(t.hbAltHint);
    expect(hint).toHaveAttribute('id', 'hb-alt-help');
    expect(hint).not.toBeVisible();
    const help = helpButton(t.hbAlt);
    expect(help).toHaveAttribute('aria-controls', 'hb-alt-help');
    await userEvent.click(help);
    expect(help).toHaveAttribute('aria-expanded', 'true');
    expect(hint).toBeVisible();
    await expectNoA11yViolations(container);
    expect(screen.queryByRole('button', { name: t.hbAltClear })).toBeNull();
    await press(ALT_TRAIT, 'Сила');
    expect(pressedIn(ALT_TRAIT)).toHaveTextContent('Сила');
    expect(screen.getByRole('button', { name: t.hbAltClear })).toBeInTheDocument();
    await expectNoA11yViolations(container);
    await press(ALT_TRAIT, 'Сила');
    expect(within(group(ALT_TRAIT)).queryByRole('button', { pressed: true })).toBeNull();
    expect(screen.queryByRole('button', { name: t.hbAltClear })).toBeNull();
    const first = within(group(t.hbCls)).getAllByRole('button')[0];
    if (!first) throw new Error('The class group has no option.');
    await userEvent.click(first);
    await userEvent.click(first);
    expect(first).toHaveAttribute('aria-pressed', 'true');
  });

  /* The axe has no second set: one chip of it leaves three fields empty. */
  async function oneChipLeft(): Promise<void> {
    await userEvent.click(altButton());
    await press(ALT_TRAIT, 'Сила');
  }

  it('«Очистить второй набор» empties the set and its lines, keeps the name and focuses the fold', async () => {
    const { cloud, container } = await editor(AXE);
    const name = screen.getByLabelText(/Название/);
    await userEvent.clear(name);
    await userEvent.type(name, 'Топор II');
    await oneChipLeft();
    await save();
    expect(screen.getByRole('alert')).toHaveTextContent('Не сохранено: исправьте 3 поля.');
    expect(screen.getAllByText(t.hbErrAlt)).toHaveLength(3);
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: t.hbAltClear }));
    expect(screen.queryByText(t.hbErrAlt)).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(within(group(ALT_TRAIT)).queryByRole('button', { pressed: true })).toBeNull();
    expect(screen.queryByRole('button', { name: t.hbAltClear })).toBeNull();
    const fold = altButton();
    expect(fold).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => {
      expect(fold).toHaveFocus();
    });
    expect(name).toHaveValue('Топор II');
    await save();
    await waitFor(async () => {
      expect((await stored(cloud, AXE))?.ru).toBe('Топор II');
    });
    expect((await stored(cloud, AXE))?.eq?.alt).toBeUndefined();
  });

  it('opens a closed set when a save finds a problem in it', async () => {
    await editor(AXE);
    await oneChipLeft();
    await userEvent.click(altButton());
    expect(altButton()).toHaveAttribute('aria-expanded', 'false');
    await save();
    expect(altButton()).toHaveAttribute('aria-expanded', 'true');
    const lines = screen.getAllByText(t.hbErrAlt, { selector: '.ferr' });
    expect(lines).toHaveLength(3);
    for (const line of lines) expect(line).toBeVisible();
  });

  it('keeps the values of the set across a fold', async () => {
    await editor(AXE);
    await oneChipLeft();
    await userEvent.click(altButton());
    expect(altButton()).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(altButton());
    expect(pressedIn(ALT_TRAIT)).toHaveTextContent('Сила');
  });

  it('labels each box of the damage pair in the main stats and the second set', async () => {
    const { container } = await editor(AXE);
    await userEvent.click(altButton());
    expect(dieBox()).toHaveAttribute('id', 'hb-dmg');
    expect(bonusBox()).toHaveAttribute('id', 'hb-dmg-bonus');
    expect(screen.getByRole('combobox', { name: t.hbAlt + ': ' + t.hbDmgDie })).toHaveAttribute(
      'id',
      'hb-alt-dmg'
    );
    expect(
      screen.getByRole('textbox', { name: t.hbAlt + ': ' + t.hbDmgBonus })
    ).toHaveAttribute('id', 'hb-alt-dmg-bonus');
    for (const id of ['hb-dmg', 'hb-dmg-bonus', 'hb-alt-dmg', 'hb-alt-dmg-bonus']) {
      const label = container.querySelector(`label[for="${id}"]`);
      expect(label?.textContent).toBe(id.endsWith('bonus') ? t.hbDmgBonus : t.hbDmgDie);
    }
  });

  it('drops the lines of the set and their summary when an unpress empties the set', async () => {
    await editor(AXE);
    await oneChipLeft();
    await save();
    expect(screen.getAllByText(t.hbErrAlt)).toHaveLength(3);
    await userEvent.click(pressedIn(ALT_TRAIT));
    expect(screen.queryByText(t.hbErrAlt)).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

/* A fake cloud whose axe holds the Vault of Ages tier 'A', and whose ring holds 'C'. */
async function heldTiers(): Promise<FakeCloud> {
  const cloud = fakeCloud(SEED, 'gm1');
  const r = await cloud.homebrew.load();
  if (!r.ok) throw new Error('The fake refused its own load. Check fake-cloud.ts.');
  for (const row of r.items) {
    const c = row.content;
    let content: HomebrewContent | null = null;
    if (row.key === AXE && c.eq) content = { ...c, eq: { ...c.eq, tier: 'A' } };
    if (row.key === RING) content = { ...c, tier: 'C' };
    if (!content) continue;
    const w = await cloud.homebrew.updateItem(row.id, { content, book_id: row.book_id }, null);
    if (!w.ok) throw new Error(`The fake refused ${row.key}: ${w.error}. Fix the test patch.`);
  }
  return cloud;
}

const tierNames = (name = t.tier): (string | null)[] =>
  within(group(name))
    .getAllByRole('button')
    .map((b) => b.textContent);

describe('the tier', () => {
  it('offers «Без ранга» and 1-4 for loot and 1-4 for equipment, never a Vault of Ages tier', async () => {
    await editor(null);
    expect(tierNames()).toEqual([t.hbNoTier, '1', '2', '3', '4']);
    await press(t.hbKind, t.cons);
    expect(tierNames()).toEqual([t.hbNoTier, '1', '2', '3', '4']);
    await press(t.hbKind, t.fEquip);
    expect(tierNames()).toEqual(['1', '2', '3', '4']);
    expect(screen.queryByRole('button', { name: t.voaArtifact1 })).toBeNull();
    expect(screen.queryByRole('button', { name: t.voaCursed1 })).toBeNull();
  });

  it('shows a stored «Артефакт» pressed after 4 and keeps it on a save with no tier change', async () => {
    const cloud = await heldTiers();
    await editor(AXE, { cloud });
    expect(tierNames()).toEqual(['1', '2', '3', '4', t.voaArtifact1]);
    expect(within(group(t.tier)).getByRole('button', { name: t.voaArtifact1 })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await press(t.tier, '3');
    expect(tierNames()).toEqual(['1', '2', '3', '4', t.voaArtifact1]);
    await press(t.tier, t.voaArtifact1);
    const name = screen.getByLabelText(/Название/);
    await userEvent.type(name, '!');
    await save();
    await toastSays(/^Сохранено/);
    expect((await stored(cloud, AXE))?.eq?.tier).toBe('A');
    expect(tierNames()).toEqual(['1', '2', '3', '4', t.voaArtifact1]);
  });

  it('drops a stored «Проклятый предмет» after a saved change of the tier', async () => {
    const cloud = await heldTiers();
    await editor(RING, { cloud });
    expect(tierNames()).toEqual([t.hbNoTier, '1', '2', '3', '4', t.voaCursed1]);
    await press(t.tier, '2');
    expect(tierNames()).toEqual([t.hbNoTier, '1', '2', '3', '4', t.voaCursed1]);
    await save();
    await toastSays(/^Сохранено/);
    expect((await stored(cloud, RING))?.tier).toBe(2);
    expect(tierNames()).toEqual([t.hbNoTier, '1', '2', '3', '4']);
  });
});

describe('the «?» of a field', () => {
  it('toggles with Enter and Space', async () => {
    await editor(null);
    const button = helpButton(t.hbSource);
    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard(' ');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('draws the loot tier «?» and none on a self-explanatory field or on «Пороги урона»', async () => {
    await editor(null);
    expect(helpButton(t.tier)).toHaveAttribute('aria-controls', 'hb-tier-help');
    for (const label of [t.hbKind, t.hbName, t.hbDesc, t.hbTh]) {
      expect(
        screen.queryByRole('button', { name: t.fieldHelp.replace('%s', label) })
      ).toBeNull();
    }
  });
});

describe('«Добавить в список» in the preview', () => {
  it('is absent on a new item before its first save and drawn after it', async () => {
    await editor(null);
    await userEvent.type(screen.getByLabelText(/Название/), 'Рог');
    expect(screen.queryByRole('button', { name: t.addToList })).toBeNull();
    await save();
    await toastSays('Предмет «Рог» создан');
    expect(await screen.findByRole('button', { name: t.addToList })).toBeInTheDocument();
  });

  it('puts the saved item into a list as a reference', async () => {
    const { cloud, page, container } = await editor(AXE);
    await userEvent.click(screen.getByRole('button', { name: t.addToList }));
    await expectNoA11yViolations(container);
    await userEvent.click(await screen.findByRole('button', { name: 'Пустой список' }));
    await toastSays(t.addedTo.replace('%s', 'Пустой список'));
    page.fireHidden();
    await waitFor(async () => {
      const read = await cloud.lists.list();
      const empty = read.ok ? read.lists.find((l) => l.id === uuid(102)) : undefined;
      expect(empty?.list_entries).toEqual([
        expect.objectContaining({ item_key: AXE, source: 'homebrew', snapshot: null })
      ]);
    });
  });
});

const preview = (c: HTMLElement): HTMLElement => c.querySelector('.preview') as HTMLElement;
const setOptions = (): string[] =>
  [...screen.getByLabelText<HTMLSelectElement>(t.setLabel).options].map((o) => o.text);

const ALL_FIVE: Partial<HomebrewContent> = {
  craft: ['ci1'],
  craft_from: ['ci2'],
  set: 'ember-spark',
  refs: ['slow', 'hb_alderrulecardaaa'],
  eq: {
    t: 'weapon',
    tier: 2,
    cls: 'mag',
    tr: 'spellcast',
    rg: 'melee',
    dmg: 'd10+2',
    dt: 'mag',
    bu: 2,
    line: 'q1'
  }
};

describe('the fold «Связи»', () => {
  it('is closed for an item with no relation, for every kind, and draws the line for equipment only', async () => {
    const { container } = await editor(null, { real: true });
    expect(relFold().open).toBe(false);
    expect(relSummary().textContent).toBe(t.hbRelations);
    await openRel();
    expect(picker(t.craftInto)).toBeInTheDocument();
    expect(picker(t.craftFrom)).toBeInTheDocument();
    expect(picker(t.hbRefs)).toBeInTheDocument();
    expect(screen.getByLabelText(t.setLabel)).toHaveValue('');
    expect(screen.queryByRole('group', { name: t.hbLine })).toBeNull();
    await expectNoA11yViolations(container);
    await press(t.hbKind, t.cons);
    expect(screen.queryByRole('group', { name: t.hbLine })).toBeNull();
    await press(t.hbKind, t.fEquip);
    expect(
      within(group(t.hbLine)).getByRole('button', { name: t.hbLineUnique })
    ).toHaveAttribute('aria-pressed', 'true');
    await press(t.hbLine, t.hbLineIn);
    expect(picker(t.hbLinePick)).toBeInTheDocument();
    await press(t.hbLine, t.hbLineNew);
    expect(relSummary().textContent).toBe('Связи · 1');
    await expectNoA11yViolations(container);
  });

  it('opens for an item with relations, counts them, saves them unchanged and draws them in the preview', async () => {
    const cloud = await seeded({ [AXE]: ALL_FIVE });
    const before = await stored(cloud, AXE);
    const { container } = await editor(AXE, { cloud, real: true });
    expect(relFold().open).toBe(true);
    expect(relSummary().textContent).toBe('Связи · 6');
    expect(within(group(t.hbLine)).getByRole('button', { name: t.hbLineIn })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Убрать: Палаш' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Убрать: Первоклассный Спальный Мешок' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Убрать: Медленный' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Убрать: Клеймо Ольхи' })).toBeInTheDocument();
    expect(screen.getByText('Свойство оружия · Хоумбрю')).toBeInTheDocument();
    expect(screen.getByLabelText(t.setLabel)).toHaveValue('ember-spark');

    const card = preview(container);
    const rungs = [...card.querySelectorAll('.step')].map((e) => e.textContent.trim());
    expect(rungs).toEqual(['1', '2', '2 HB', '3', '4']);
    expect(within(card).getByRole('button', { name: 'Палаш' })).toBeInTheDocument();
    expect(within(card).getByText(/Пылающие близнецы:/)).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: 'Уголёк' })).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: 'Искра' })).toBeInTheDocument();
    expect(
      within(card).getByRole('link', { name: 'Первоклассный Спальный Мешок' })
    ).toBeInTheDocument();
    expect(
      within(card).getByRole('link', { name: 'Пронзительная Свирель' })
    ).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: 'example.test' })).toHaveAttribute(
      'href',
      'https://example.test/alder-brand'
    );
    expect(within(card).getByRole('link', { name: 'daggerheart.su' })).toHaveAttribute(
      'href',
      'https://ru.daggerheart.su/adversary/huge-green-ooze'
    );
    await expectNoA11yViolations(container);

    await save();
    await toastSays(/^Сохранено/);
    expect(canonJson(await stored(cloud, AXE))).toBe(canonJson(before));
  });

  it('refuses «В линии» with no line or a line of another type, and opens the fold for it', async () => {
    const { cloud } = await editor(AXE, { real: true });
    await openRel();
    await press(t.hbLine, t.hbLineIn);
    await userEvent.click(relSummary());
    expect(relFold().open).toBe(false);
    await save();
    expect(relFold().open).toBe(true);
    expect(screen.getByText(t.hbErrLine)).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Линия улучшений - выберите предмет из линии или нажмите «Уникальный».'
      })
    ).toBeInTheDocument();
    await userEvent.type(picker(t.hbLinePick), 'Палаш');
    await userEvent.keyboard('{Enter}');
    expect(screen.queryByText(t.hbErrLine)).toBeNull();
    expect(screen.getByText(/линия из 4 рангов/)).toBeInTheDocument();
    await press(t.hbType, 'Броня');
    await save();
    expect(screen.getByText(t.hbErrLineType)).toBeInTheDocument();
    expect((await stored(cloud, AXE))?.eq?.line).toBeUndefined();
  });

  it('stores the item key as «Новая линия», for a saved and a new item', async () => {
    const { cloud } = await editor(AXE, { real: true });
    await openRel();
    await press(t.hbLine, t.hbLineNew);
    await save();
    await toastSays(/^Сохранено/);
    expect((await stored(cloud, AXE))?.eq?.line).toBe(AXE);
    cleanup();
    const fresh = await editor(null, { real: true });
    await userEvent.type(screen.getByLabelText(/^Название\*$/), 'Латы');
    await press(t.hbKind, t.fEquip);
    await press(t.hbType, 'Броня');
    await press(t.tier, '1');
    await userEvent.type(screen.getByLabelText(/^Показатель брони/), '3');
    await userEvent.type(screen.getByLabelText(t.hbThMajor), '5');
    await userEvent.type(screen.getByLabelText(t.hbThSevere), '10');
    await openRel();
    await press(t.hbLine, t.hbLineNew);
    await save();
    await toastSays('Предмет «Латы» создан');
    const key = fresh.router.hash().replace('#/homebrew/', '');
    expect((await stored(fresh.cloud, key))?.eq?.line).toBe(key);
  });

  it('picks a craft target by keyboard, never offers the item itself, and saves it', async () => {
    const { cloud } = await editor(AXE, { real: true });
    await openRel();
    await userEvent.type(picker(t.craftInto), 'Тлеющих');
    expect(screen.queryByRole('option', { name: /Топор Тлеющих Углей/ })).toBeNull();
    await userEvent.clear(picker(t.craftInto));
    await userEvent.type(picker(t.craftInto), 'Первоклассный Спальный');
    await userEvent.keyboard('{ArrowDown}{ArrowUp}{Enter}');
    expect(
      screen.getByRole('button', { name: 'Убрать: Первоклассный Спальный Мешок' })
    ).toBeInTheDocument();
    expect(relSummary().textContent).toBe('Связи · 1');
    await save();
    await toastSays(/^Сохранено/);
    expect((await stored(cloud, AXE))?.craft).toEqual(['ci1']);
  });

  it('ranks an item picker: a name with the word at a word start comes first', async () => {
    await editor(AXE, { real: true });
    await openRel();
    await userEvent.type(picker(t.craftInto), 'меч');
    const first = within(screen.getByRole('listbox', { name: t.craftInto })).getAllByRole(
      'option'
    )[0] as HTMLElement;
    const nm = first.querySelector('.nm');
    const name = (nm?.textContent ?? '').replace(
      nm?.querySelector('small')?.textContent ?? '',
      ''
    );
    expect(name).toMatch(/(^|[^\p{L}\p{N}])меч/iu);
  });

  it('lists each upgrade line once in «Линия улучшений», at its best-ranked member', async () => {
    await editor(AXE, { real: true });
    await openRel();
    await press(t.hbLine, t.hbLineIn);
    await userEvent.type(picker(t.hbLinePick), 'Палаш');
    expect(
      within(screen.getByRole('listbox', { name: t.hbLinePick })).getAllByRole('option')
    ).toHaveLength(1);
  });

  it('disables a picker with eight chosen', async () => {
    const craft = ['ci1', 'ci2', 'ci3', 'ci4', 'ci5', 'ci6', 'ci7', 'ci8'];
    const { container } = await editor(AXE, {
      cloud: await seeded({ [AXE]: { craft } }),
      real: true
    });
    const full = screen.getByRole('textbox', { name: t.craftInto });
    expect(full).toBeDisabled();
    expect(full).toHaveAttribute('placeholder', 'Уже 8 - больше нельзя');
    await expectNoA11yViolations(container);
  });

  it('keeps a chosen item and a rule card that resolve to nothing through a save', async () => {
    const gone = { craft: ['hb_goneitemaaaaaaaa'], refs: ['hb_goneruleaaaaaaaa'] };
    const cloud = await seeded({ [RING]: gone });
    await editor(RING, { cloud, real: true });
    expect(screen.getByRole('button', { name: 'Убрать: ' + t.hbGoneItem })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Убрать: ' + t.hbGoneCard })).toBeInTheDocument();
    await save();
    await toastSays(/^Сохранено/);
    expect(await stored(cloud, RING)).toMatchObject(gone);
  });

  it('lists the catalog sets, then the own ones, each by name, and «?» for a deleted set card', async () => {
    const cloud = await seeded({ [RING]: { set: 'hb_gonesetaaaaaaaaa' } });
    await editor(RING, { cloud, real: true });
    expect(setOptions()).toEqual([
      t.hbNone,
      'Пылающие близнецы',
      'Убранство Святого',
      'Комплект Ольхи (HB)',
      '?',
      t.hbSetNew
    ]);
    expect(screen.getByLabelText(t.setLabel)).toHaveValue('hb_gonesetaaaaaaaaa');
    await userEvent.type(screen.getByLabelText(/^Название\*$/), '!');
    await save();
    await toastSays(/^Сохранено/);
    expect((await stored(cloud, RING))?.set).toBe('hb_gonesetaaaaaaaaa');
  });

  it('makes a set at once in the item source, selects it and toasts', async () => {
    const { cloud, container } = await editor(AXE, { real: true });
    await openRel();
    await userEvent.selectOptions(screen.getByLabelText(t.setLabel), '__new');
    const form = screen.getByRole('group', { name: t.hbNewSet });
    await waitFor(() => {
      expect(within(form).getByLabelText(/^Название комплекта/)).toHaveFocus();
    });
    expect(within(form).getByText(t.hbSetInlineHint)).toBeInTheDocument();
    await expectNoA11yViolations(container);
    await userEvent.type(within(form).getByLabelText(/^Название комплекта/), 'Кузня');
    await userEvent.type(within(form).getByLabelText(/^Бонус комплекта/), '+1 к Броне.');
    await userEvent.click(within(form).getByRole('button', { name: t.hbCreateSet }));
    await toastSays('Комплект «Кузня» создан');
    const read = await cloud.homebrew.load();
    const made = read.ok ? read.cards.find((c) => c.content.ru === 'Кузня') : undefined;
    expect(made).toMatchObject({ kind: 'set', book_id: ALDER });
    const select = screen.getByLabelText(t.setLabel);
    expect(select).toHaveValue(made?.key);
    await waitFor(() => {
      expect(select).toHaveFocus();
    });
  });

  it('makes a rule card and adds it, with its own refusals under its fields', async () => {
    const { cloud, container } = await editor(RING, { real: true });
    await openRel();
    await userEvent.click(screen.getByRole('button', { name: t.hbNewCard }));
    const form = screen.getByRole('group', { name: t.hbNewCard });
    await userEvent.click(within(form).getByRole('button', { name: t.hbCreateCard }));
    expect(within(form).getByText(t.hbErrName)).toBeInTheDocument();
    expect(within(form).getByText(t.hbErrCardText)).toBeInTheDocument();
    await expectNoA11yViolations(container);
    expect(
      ['Название карты', 'Подзаголовок', 'Текст карты', 'Ссылка'].map((l) =>
        within(form)
          .getByLabelText(new RegExp('^' + l))
          .getAttribute('maxlength')
      )
    ).toEqual(['80', '60', '1500', '300']);
    await userEvent.type(within(form).getByLabelText(/^Название карты/), 'Огонь');
    await userEvent.type(within(form).getByLabelText(/^Текст карты/), 'Жжёт.');
    await userEvent.click(within(form).getByRole('button', { name: t.hbCreateCard }));
    await toastSays('Карта правил «Огонь» создана');
    expect(screen.getByRole('button', { name: 'Убрать: Огонь' })).toBeInTheDocument();
    await save();
    await toastSays(/^Сохранено/);
    const read = await cloud.homebrew.load();
    const made = read.ok ? read.cards.find((c) => c.content.ru === 'Огонь') : undefined;
    expect(made).toMatchObject({ kind: 'ref', book_id: null });
    expect((await stored(cloud, RING))?.refs).toEqual([made?.key]);
  });

  it('refuses a save while a card form is open, and reopens a closed fold on its name field', async () => {
    const { cloud } = await editor(RING, { real: true });
    await openRel();
    await userEvent.click(screen.getByRole('button', { name: t.hbNewCard }));
    await userEvent.click(relSummary());
    expect(relFold().open).toBe(false);
    await userEvent.type(screen.getByLabelText(/^Название\*$/), '!');
    await save();
    expect(relFold().open).toBe(true);
    const link = screen.getByRole('button', {
      name: 'Карты правил - создайте карту кнопкой «Создать карту» или нажмите «Отмена».'
    });
    await userEvent.click(relSummary());
    await userEvent.click(link);
    expect(relFold().open).toBe(true);
    await waitFor(() => {
      expect(screen.getByLabelText(/^Название карты/)).toHaveFocus();
    });
    expect((await stored(cloud, RING))?.ru).toBe('Кольцо с гравировкой');
  });

  it('asks the delete confirm with the items that name the item', async () => {
    const cloud = await seeded({ [CAP]: { craft: [RING] }, [POTION]: { craft_from: [RING] } });
    const { app, dialog } = await editor(RING, { cloud, answer: false, real: true });
    await userEvent.click(screen.getByRole('button', { name: t.del }));
    expect(dialog.asked.at(-1)).toBe(
      'Предмет «Кольцо с гравировкой» указан в 2 предметах. Удалить его? Отменить удаление нельзя.'
    );
    app.listsHolding = () => 1;
    cleanup();
    render(HomebrewEditor, { app, store: app.homebrew!, key: RING });
    await flush();
    await userEvent.click(screen.getByRole('button', { name: t.del }));
    expect(dialog.asked.at(-1)).toBe(
      'Предмет «Кольцо с гравировкой» есть в 1 списке и указан в 2 предметах. Удалить его и убрать из списков? Отменить удаление нельзя.'
    );
  });
});
