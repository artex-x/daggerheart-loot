/* The homebrew editor over the fake cloud: every field of each kind and type, the
   checks on «Сохранить», the preview, the inline source and section, each refused save,
   the conflict and gone banners, the guard, Ctrl+S, both languages, the formatting
   toolbar and the delete.
   docs/specs/FEATURES.md, "Homebrew". */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
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
  cropFile,
  editor,
  fileInput,
  flush,
  group,
  helpButton,
  openRel,
  picker,
  png,
  press,
  relFold,
  relSummary,
  save,
  seeded,
  stored,
  toastSays
} from '../test/homebrewEditor.js';

/* Every item delete's confirm ends with its consequence for other players' lists. */
const OTHERS =
  'Если предмет есть в списках других игроков, строка пропадёт и там - с количеством, ценой и заметками; владельцы списков увидят, что он удалён. Отменить удаление нельзя.';

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
/* The banner's own text, apart from the status region that says it (rule 19). */
const BOX = { selector: '.box .lead' };
const said = (): string =>
  document.querySelector('.hbform .said[role="status"]')?.textContent.trim() ?? '';

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
    /* A player knows the tier and the damage line (FEATURES.md, rule 15(c)). */
    for (const label of [t.tier, t.hbDmg]) {
      expect(
        screen.queryByRole('button', { name: t.fieldHelp.replace('%s', label) })
      ).toBeNull();
    }
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

  it('redraws a refused save in English after «EN»', async () => {
    const { app } = await editor(null, { fake: { limits: { items: 4 } } });
    await userEvent.type(screen.getByLabelText(/Название/), 'Пятый');
    await save();
    await screen.findByText(/^Не сохранено\. Достигнут предел/);
    app.setLang('en');
    expect(await screen.findByRole('alert')).toHaveTextContent(/^Not saved\. /);
    expect(screen.queryByText(/^Не сохранено/)).toBeNull();
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
    expect(await screen.findByText(t.hbConflict, BOX)).toBeInTheDocument();
    /* The box is no live region; the form's region, there before it, says it once. */
    expect(screen.getByText(t.hbConflict, BOX).closest('.box')).not.toHaveAttribute('role');
    expect(said()).toBe(t.hbConflict);
    await userEvent.click(screen.getByRole('button', { name: t.hbSaveMine }));
    await waitFor(async () => {
      expect((await stored(cloud, AXE))?.ru).toBe('Топор Тлеющих Углей!');
    });
    expect(screen.queryByText(t.hbConflict, BOX)).toBeNull();
    expect(said()).toBe('');
  });

  it("«Сохранить мою версию» keeps another device's write in a language this form did not change", async () => {
    const { cloud } = await editor(AXE);
    const read = (await cloud.homebrew.load()) as {
      ok: true;
      items: { key: string; id: string; content: HomebrewContent; book_id: string | null }[];
    };
    const axe = read.items.find((i) => i.key === AXE)!;
    await cloud.homebrew.updateItem(
      axe.id,
      { content: { ...axe.content, ende: 'Written elsewhere.' }, book_id: axe.book_id },
      null
    );
    await userEvent.type(screen.getByLabelText(/Название/), '!');
    await save();
    expect(await screen.findByText(t.hbConflict, BOX)).toBeInTheDocument();
    /* A failed read writes nothing and keeps the banner. */
    cloud.setOffline(true);
    await userEvent.click(screen.getByRole('button', { name: t.hbSaveMine }));
    expect(await screen.findByText(t.hbWriteFailed)).toBeInTheDocument();
    expect(screen.getByText(t.hbConflict, BOX)).toBeInTheDocument();
    cloud.setOffline(false);
    await userEvent.click(screen.getByRole('button', { name: t.hbSaveMine }));
    await waitFor(async () => {
      expect((await stored(cloud, AXE))?.ru).toBe('Топор Тлеющих Углей!');
    });
    const c = await stored(cloud, AXE);
    expect([c?.en, c?.ende]).toEqual(['Ember Axe', 'Written elsewhere.']);
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
    await screen.findByText(t.hbConflict, BOX);
    cloud.setOffline(true);
    await userEvent.click(screen.getByRole('button', { name: t.hbShowNew }));
    expect(dialog.asked.at(-1)).toBe(t.hbDropEdits);
    expect(await screen.findByText(t.hbWriteFailed)).toBeInTheDocument();
    expect(screen.getByLabelText(/Название/)).toHaveValue('Топор Тлеющих Углей!');
    expect(screen.getByText(t.hbConflict, BOX)).toBeInTheDocument();
    cloud.setOffline(false);
    await userEvent.click(screen.getByRole('button', { name: t.hbShowNew }));
    await waitFor(() => {
      expect(screen.getByLabelText(/Название/)).toHaveValue('Чужое');
    });
    expect(screen.queryByText(t.hbConflict, BOX)).toBeNull();
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
    expect(await screen.findByText(t.hbGone, BOX)).toBeInTheDocument();
    expect(screen.getByLabelText(/Название/)).toHaveValue('Кольцо с гравировкой мой');
    await userEvent.click(screen.getByRole('button', { name: t.hbSaveAsNew }));
    await toastSays('Предмет «Кольцо с гравировкой мой» создан');
    expect(router.hash()).toMatch(/^#\/homebrew\/hb_new/);
    expect(screen.queryByText(t.hbGone, BOX)).toBeNull();
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
    expect(await screen.findByText(t.hbGone, BOX)).toBeInTheDocument();
    expect(said()).toBe(t.hbGone);
    /* The banner's way back and the button row's: the same name, the same place. */
    const back = screen.getAllByRole('link', { name: t.hbToMyItems });
    expect(back).toHaveLength(2);
    for (const a of back) expect(a).toHaveAttribute('href', '/homebrew');
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
  it('names the way back «К моим предметам» clean and dirty, links it to #/homebrew, and asks before that navigation drops edits', async () => {
    const { app, dialog } = await editor(RING, { answer: false });
    const row = (): string[] =>
      [...document.querySelectorAll('.buttons > *')].map((b) => b.textContent.trim());
    expect(row()).toEqual([t.save, t.hbToMyItems, t.del]);
    await userEvent.type(screen.getByLabelText(/Название/), '!');
    expect(row()).toEqual([t.save, t.hbToMyItems, t.del]);
    expect(screen.getByRole('link', { name: t.hbToMyItems })).toHaveAttribute(
      'href',
      '/homebrew'
    );
    /* The memory router sees no link press, so the test makes the link's navigation. */
    app.go('#/homebrew');
    expect(dialog.asked).toEqual([t.leaveUnsaved]);
    expect(app.hash).toBe('#/homebrew/' + RING);
  });

  it('draws no «Удалить» on a new item', async () => {
    await editor(null);
    const row = [...document.querySelectorAll('.buttons > *')].map((b) => b.textContent.trim());
    expect(row).toEqual([t.save, t.hbToMyItems]);
  });

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
    expect(dialog.asked).toEqual(['Удалить предмет «Кольцо с гравировкой!»? ' + OTHERS]);
    await waitFor(() => {
      expect(app.hash).toBe('#/homebrew');
    });
    expect(dialog.asked).toHaveLength(1);
    expect(await stored(cloud, RING)).toBeUndefined();
  });

  it('says the lists clause while the lists are not read, and the short question once they are', async () => {
    const { app, dialog } = await editor(RING, { answer: false });
    const lists = app.cloudLists;
    if (!lists) throw new Error('The editor needs the lists store. Pass a cloud port.');
    expect(lists.status).toBe('ready');
    for (const status of ['loading', 'error'] as const) {
      lists.status = status;
      await userEvent.click(screen.getByRole('button', { name: t.del }));
      expect(dialog.asked.at(-1)).toBe(
        'Удалить предмет «Кольцо с гравировкой»? Если предмет есть в ваших списках, он пропадёт и из них. ' +
          OTHERS
      );
    }
    lists.status = 'ready';
    await userEvent.click(screen.getByRole('button', { name: t.del }));
    expect(dialog.asked.at(-1)).toBe('Удалить предмет «Кольцо с гравировкой»? ' + OTHERS);
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
      'Предмет «Кольцо с гравировкой» есть в 1 списке. Удалить его и убрать из списков? ' +
        OTHERS
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

describe('both languages', () => {
  const lang = (): HTMLElement => group(t.hbTextLang);
  const preview = (container: HTMLElement): HTMLElement =>
    container.querySelector('.preview') as HTMLElement;

  it('switchesTheNameAndDescriptionToTheOtherLanguage', async () => {
    const { container } = await editor(AXE);
    const name = screen.getByLabelText(/Название/);
    const desc = screen.getByLabelText(t.hbDesc);
    expect(name).toHaveValue('Топор Тлеющих Углей');
    expect(name).toHaveAttribute('lang', 'ru');
    /* The switch sits right above «Название». */
    expect(
      lang().compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    await press(t.hbTextLang, 'EN');
    expect(name).toHaveValue('Ember Axe');
    expect(name).toHaveAttribute('lang', 'en');
    expect(desc).toHaveValue('The blade smoulders and does not go out in the rain.');
    expect(desc).toHaveAttribute('lang', 'en');
    /* The labels stay in the interface language. */
    expect(screen.getByText(t.hbLegend)).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('savesBothLanguagesInOneWrite', async () => {
    const { cloud } = await editor(AXE);
    const update = vi.spyOn(cloud.homebrew, 'updateItem');
    await userEvent.type(screen.getByLabelText(/Название/), ' II');
    await press(t.hbTextLang, 'EN');
    const desc = screen.getByLabelText(t.hbDesc);
    await userEvent.clear(desc);
    await userEvent.type(desc, 'It **burns**.');
    await save();
    await toastSays('Сохранено: «Топор Тлеющих Углей II»');
    expect(update).toHaveBeenCalledOnce();
    const c = await stored(cloud, AXE);
    expect([c?.ru, c?.en, c?.rud, c?.ende]).toEqual([
      'Топор Тлеющих Углей II',
      'Ember Axe',
      'Лезвие тлеет и не гаснет под дождём.',
      'It **burns**.'
    ]);
  });

  it('marksAnEmptyLanguageOnTheSwitch', async () => {
    await editor(CAP);
    /* An English-only item opens in English in the Russian interface. */
    expect(within(lang()).getByRole('button', { name: 'EN' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(within(lang()).getByRole('button', { name: 'RU - пусто' })).toBeInTheDocument();
    cleanup();
    await editor(null);
    expect(within(lang()).getByRole('button', { name: 'RU - пусто' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await userEvent.type(screen.getByLabelText(/Название/), 'Рог');
    expect(within(lang()).getByRole('button', { name: 'RU' })).toBeInTheDocument();
    expect(within(lang()).getByRole('button', { name: 'EN - пусто' })).toBeInTheDocument();
  });

  it('namesAProblemOfTheHiddenLanguageInTheSummary', async () => {
    const { cloud, container } = await editor(AXE);
    const update = vi.spyOn(cloud.homebrew, 'updateItem');
    await press(t.hbTextLang, 'EN');
    await fireEvent.input(screen.getByLabelText(t.hbDesc), { target: { value: 'a\u0007b' } });
    await press(t.hbTextLang, 'RU');
    await save();
    expect(update).not.toHaveBeenCalled();
    const box = screen.getByRole('alert');
    const link = within(box).getByRole('button', { name: /^Описание \(EN\) - / });
    /* The Russian box has no problem of its own. */
    expect(screen.getByLabelText(t.hbDesc)).not.toHaveAttribute('aria-invalid');
    await expectNoA11yViolations(container);
    await userEvent.click(link);
    await waitFor(() => {
      expect(screen.getByLabelText(t.hbDesc)).toHaveFocus();
    });
    expect(screen.getByLabelText(/Название/)).toHaveValue('Ember Axe');
    expect(screen.getByLabelText(t.hbDesc)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(t.hbErrControl)).toBeInTheDocument();
  });

  it('drawsTheTypedMarkdownInTheCard', async () => {
    const { container } = await editor(null);
    await userEvent.type(screen.getByLabelText(t.hbDesc), '**x**');
    expect(preview(container).querySelector('.card-desc b')?.textContent).toBe('x');
  });

  it('drawsTheCardInTheShownLanguage', async () => {
    const { container } = await editor(AXE);
    await press(t.hbTextLang, 'EN');
    const card = preview(container);
    expect(card).toHaveAttribute('lang', 'en');
    expect(within(card).getByRole('heading', { name: 'Ember Axe' })).toBeInTheDocument();
    /* The page title stays in the interface language. */
    expect(
      screen.getByRole('heading', { level: 1, name: 'Топор Тлеющих Углей' })
    ).toBeInTheDocument();
    await press(t.hbTextLang, 'RU');
    expect(card).not.toHaveAttribute('lang');
    cleanup();
    const view = await editor(null);
    await press(t.hbTextLang, 'EN - пусто');
    expect(within(preview(view.container)).getByText('New item')).toBeInTheDocument();
  });

  it('drawsNoPreviewButtonOnTheItemForm', async () => {
    await editor(AXE);
    const bar = screen.getByRole('toolbar', { name: 'Оформление: Описание' });
    expect(within(bar).getAllByRole('button')).toHaveLength(5);
    expect(screen.queryByRole('button', { name: t.mdPreview })).toBeNull();
  });

  it('opensTheDescriptionHint', async () => {
    const { container } = await editor(null);
    const help = helpButton(t.hbDesc);
    await userEvent.click(help);
    const hint = document.getElementById('hb-desc-help');
    expect(hint).toBeVisible();
    expect(hint?.textContent).toBe(t.mdHelp.replace('%n', '3000'));
    expect(hint?.textContent.split('\n')).toHaveLength(3);
    await expectNoA11yViolations(container);
  });
});

describe('the states around the form', () => {
  it('draws not found for a key the store does not hold', async () => {
    const { container } = await editor('hb_nosuchitemaaaaa');
    expect(screen.getByRole('heading', { name: t.notFound })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: t.hbToMyItems })).toHaveAttribute(
      'href',
      '/homebrew'
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
    expect(await screen.findByText(t.hbGone, BOX)).toBeInTheDocument();
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
    expect(screen.queryByText(t.hbGone, BOX)).toBeNull();
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
    expect(container.querySelector('a[href^="/i/"]')).toBeNull();
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

  it('offers «Любая» in the trait group and the second set, and saves both as any', async () => {
    const { cloud, container } = await editor(AXE);
    await press(t.hbTrait, 'Любая');
    expect(pressedIn(t.hbTrait)).toHaveTextContent('Любая');
    await userEvent.click(altButton());
    await press(ALT_TRAIT, 'Любая');
    await press(t.hbAlt + ': ' + t.hbRange, 'Средне');
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: t.hbAlt + ': ' + t.hbDmgDie }),
      'd6'
    );
    await press(t.hbAlt + ': ' + t.hbDt, 'физ');
    await expectNoA11yViolations(container);
    await save();
    await waitFor(async () => {
      expect((await stored(cloud, AXE))?.eq?.alt?.tr).toBe('any');
    });
    expect((await stored(cloud, AXE))?.eq?.tr).toBe('any');
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

  it('draws no «?» on «Ранг», a self-explanatory field or «Пороги урона»', async () => {
    await editor(null);
    for (const label of [t.tier, t.hbKind, t.hbName, t.hbTh, t.hbTextLang]) {
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

  it('puts the saved item into a list as a link', async () => {
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
        expect.objectContaining({ item_key: AXE, source: 'homebrew', hb_item: uuid(511) })
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
    /* Only the eight drawn options are built; the rest still count for «Ещё N». */
    const options = within(screen.getByRole('listbox', { name: t.craftInto })).getAllByRole(
      'option'
    );
    expect(options).toHaveLength(8);
    expect(options.every((o) => o.textContent.trim() !== '')).toBe(true);
    expect(screen.getByText(/^Ещё \d+ - уточните запрос$/)).toBeInTheDocument();
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
      'Предмет «Кольцо с гравировкой» указан в 2 предметах. Удалить его? ' + OTHERS
    );
    app.listsHolding = () => 1;
    cleanup();
    render(HomebrewEditor, { app, store: app.homebrew!, key: RING });
    await flush();
    await userEvent.click(screen.getByRole('button', { name: t.del }));
    expect(dialog.asked.at(-1)).toBe(
      'Предмет «Кольцо с гравировкой» есть в 1 списке и указан в 2 предметах. Удалить его и убрать из списков? ' +
        OTHERS
    );
  });

  it('links the preview in the language on screen, whatever the edited language', async () => {
    const BEDROLL = 'Первоклассный Спальный Мешок';
    const own = (c: HTMLElement): HTMLAnchorElement[] => [
      ...preview(c).querySelectorAll<HTMLAnchorElement>('a[href^="/"]')
    ];
    const ru = await editor(AXE, { cloud: await seeded({ [AXE]: ALL_FIVE }), real: true });
    await press(t.hbTextLang, 'EN');
    expect(own(ru.container).length).toBeGreaterThan(0);
    for (const a of own(ru.container))
      expect(a.getAttribute('href')).not.toMatch(/^\/(i\/)?en\//);
    /* The link text stays in the edited language. */
    expect(within(preview(ru.container)).queryByRole('link', { name: BEDROLL })).toBeNull();
    await expectNoA11yViolations(ru.container);
    cleanup();

    const en = await editor(AXE, {
      cloud: await seeded({ [AXE]: ALL_FIVE }),
      real: true,
      lang: 'en'
    });
    await press(dict('en').hbTextLang, 'RU');
    expect(own(en.container).length).toBeGreaterThan(0);
    for (const a of own(en.container)) expect(a.getAttribute('href')).toMatch(/^\/(i\/)?en\//);
    expect(
      within(preview(en.container)).getByRole('link', { name: BEDROLL }).getAttribute('href')
    ).toMatch(/^\/i\/en\//);
    await expectNoA11yViolations(en.container);
  });
});

describe('the picture', () => {
  const OWN_HEX = 'a'.repeat(32);
  const previewImg = (): HTMLImageElement =>
    document.querySelector('.preview .card-media img') as HTMLImageElement;

  async function rowOf(cloud: FakeCloud, key: string) {
    const r = await cloud.homebrew.load();
    return r.ok ? r.items.find((i) => i.key === key) : undefined;
  }

  /* Records the port calls a save makes, in order. */
  function traced(cloud: FakeCloud): string[] {
    const calls: string[] = [];
    const h = cloud.homebrew;
    const upload = h.uploadArt.bind(h);
    const create = h.createItem.bind(h);
    h.uploadArt = (name, blob) => {
      calls.push('upload ' + name);
      return upload(name, blob);
    };
    h.createItem = (row) => {
      calls.push('create ' + String(row.art));
      return create(row);
    };
    return calls;
  }

  it('sits in the form after the description and before the tier', async () => {
    await editor(null);
    const desc = screen.getByLabelText(t.hbDesc);
    const field = screen.getByRole('group', { name: t.hbArt });
    const tier = group(t.tier);
    expect(desc.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(field.compareDocumentPosition(tier) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(previewImg().src).toContain('/img/_none.webp');
  });

  it('draws a cropped file in the preview and arms the guard', async () => {
    const { page, container } = await editor(null);
    expect(page.unloadAsks()).toBe(false);
    await cropFile();
    expect(previewImg().src).toBe('blob:fake-2');
    expect(page.unloadAsks()).toBe(true);
    await expectNoA11yViolations(container);
  });

  it('uploads the 640 px file, then the 160 px file, then creates the item with the name', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const calls = traced(cloud);
    const { page } = await editor(null, { cloud });
    await userEvent.type(screen.getByLabelText(/Название/), 'Фонарь');
    await cropFile();
    cloud.setOffline(true);
    await save();
    expect(await screen.findByText(t.hbArtUploadFailed)).toHaveAttribute('role', 'alert');
    expect(page.unloadAsks()).toBe(true);
    const first = calls[0];
    cloud.setOffline(false);
    await save();
    await toastSays('Предмет «Фонарь» создан');
    expect(calls[1]).toBe(first);
    expect(calls.slice(1)).toEqual([
      first,
      first?.replace('upload p/', 'upload t/'),
      'create ' + String(first?.replace('upload ', ''))
    ]);
    expect(first).toMatch(/^upload p\/[0-9a-f]{32}\.webp$/);
    const key = (await cloud.homebrew.load()) as { ok: true; items: { art?: string | null }[] };
    expect(key.items.some((i) => 'upload ' + String(i.art) === first)).toBe(true);
    expect(page.unloadAsks()).toBe(false);
    expect(screen.getByRole('button', { name: t.hbArtReplace })).toBeInTheDocument();
  });

  it('says «Загружаем картинку...» while the files upload', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    let go = (): void => undefined;
    const held = new Promise<void>((r) => (go = r));
    const upload = cloud.homebrew.uploadArt.bind(cloud.homebrew);
    cloud.homebrew.uploadArt = async (n, b) => {
      await held;
      return upload(n, b);
    };
    const { container } = await editor(null, { cloud });
    await userEvent.type(screen.getByLabelText(/Название/), 'Фонарь');
    await cropFile();
    await save();
    expect(screen.getByText(t.hbArtUploading)).toHaveAttribute('role', 'status');
    expect(screen.getByRole('button', { name: t.save })).toBeDisabled();
    await expectNoA11yViolations(container);
    go();
    await toastSays('Предмет «Фонарь» создан');
    expect(screen.queryByText(t.hbArtUploading)).toBeNull();
  });

  it('names the picture limit as the item limit plus 5: 105, and 305 at 3x', async () => {
    for (const [items, n] of [
      [undefined, 105],
      [300, 305]
    ] as const) {
      const cloud = fakeCloud(SEED, 'gm1', items ? { limits: { items } } : {});
      cloud.homebrew.uploadArt = () =>
        Promise.resolve({ ok: false, error: 'limit', key: 'homebrew_art', value: null });
      await editor(null, { cloud });
      await userEvent.type(screen.getByLabelText(/Название/), 'Фонарь');
      await cropFile();
      await save();
      expect(
        await screen.findByText(
          `Не сохранено. Достигнут предел картинок: ${String(n)}. Нужно больше - напишите на daggerheart.loot@gmail.com.`
        )
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/Название/)).toHaveValue('Фонарь');
      cleanup();
    }
  });

  it('takes a new name and uploads once more when the database released the first', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const calls = traced(cloud);
    const create = cloud.homebrew.createItem.bind(cloud.homebrew);
    let refused = false;
    cloud.homebrew.createItem = (row) => {
      if (refused) return create(row);
      refused = true;
      calls.push('refused');
      return Promise.resolve({ ok: false, error: 'refused', reason: 'artGone' });
    };
    await editor(null, { cloud });
    await userEvent.type(screen.getByLabelText(/Название/), 'Фонарь');
    await cropFile();
    await save();
    await toastSays('Предмет «Фонарь» создан');
    const uploads = calls.filter((c) => c.startsWith('upload p/'));
    expect(uploads).toHaveLength(2);
    expect(uploads[0]).not.toBe(uploads[1]);
    expect(calls.at(-1)).toBe('create ' + String(uploads[1]?.replace('upload ', '')));
    expect(screen.queryByText(t.hbArtGone)).toBeNull();
  });

  it('says «Картинка не сохранилась» for a picked picture whose file is gone, and keeps the edits', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    cloud.homebrew.updateItem = () =>
      Promise.resolve({ ok: false, error: 'refused', reason: 'artGone' });
    const { container } = await editor(RING, { cloud });
    await userEvent.type(screen.getByLabelText(/Название/), '!');
    await userEvent.click(screen.getByRole('button', { name: t.hbArtFromItems }));
    await userEvent.type(
      screen.getByRole('combobox', { name: t.hbArtFromItemsLabel }),
      'Топор{Enter}'
    );
    await save();
    expect(await screen.findByText(t.hbArtGone)).toHaveAttribute('role', 'alert');
    expect(screen.getByLabelText(/Название/)).toHaveValue('Кольцо с гравировкой!');
    await expectNoA11yViolations(container);
    /* The next choice clears the line. */
    await userEvent.click(screen.getByRole('button', { name: t.hbArtRemove }));
    expect(screen.queryByText(t.hbArtGone)).toBeNull();
  });

  it("sends no picture with a text-only edit, so another tab's picture stays", async () => {
    const { cloud, store } = await editor(AXE);
    const axe = await rowOf(cloud, AXE);
    expect(axe?.art).toBe('ci1.webp');
    await cloud.homebrew.setArt(axe!.id, 'ci2.webp', false);
    await userEvent.type(screen.getByLabelText(/Название/), '!');
    /* The other tab's message reads the account again under the dirty form. */
    await store.read();
    await save();
    await screen.findByText(t.hbConflict, BOX);
    await userEvent.click(screen.getByRole('button', { name: t.hbSaveMine }));
    await waitFor(async () => {
      expect((await stored(cloud, AXE))?.ru).toBe('Топор Тлеющих Углей!');
    });
    expect((await rowOf(cloud, AXE))?.art).toBe('ci2.webp');
    /* The form and the preview draw the row's picture, not the one loaded before. */
    await waitFor(() => {
      expect(previewImg().getAttribute('src')).toBe('/img/ci2.webp');
    });
    expect(document.querySelector('.th img')?.getAttribute('src')).toBe('/img/thumb/ci2.webp');
  });

  it('removes the saved picture with «Убрать картинку»', async () => {
    const { cloud } = await editor(AXE);
    await userEvent.click(screen.getByRole('button', { name: t.hbArtRemove }));
    await save();
    await toastSays(/^Сохранено/);
    expect((await rowOf(cloud, AXE))?.art).toBeNull();
    expect(screen.getByRole('button', { name: t.hbArtChoose })).toBeInTheDocument();
  });

  it('saves nothing on Enter in the crop dialog', async () => {
    const { cloud } = await editor(AXE);
    await userEvent.type(screen.getByLabelText(/Название/), '!');
    await userEvent.upload(fileInput(), png());
    const zoom = await screen.findByLabelText(t.hbArtZoom);
    zoom.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('{Control>}s{/Control}');
    await flush();
    expect((await stored(cloud, AXE))?.ru).toBe('Топор Тлеющих Углей');
  });

  it('refuses «Сохранить как новый» with a deleted own picture, and keeps a catalog one', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const own = `p/${OWN_HEX}.webp`;
    const blob = new Blob(['x'], { type: 'image/webp' });
    await cloud.homebrew.uploadArt(own, blob);
    await cloud.homebrew.uploadArt(`t/${OWN_HEX}.webp`, blob);
    const ring = await rowOf(cloud, RING);
    expect((await cloud.homebrew.setArt(ring!.id, own, false)).ok).toBe(true);
    const { store } = await editor(RING, { cloud });
    await userEvent.type(screen.getByLabelText(/Название/), ' мой');
    await cloud.homebrew.removeItem(ring!.id);
    await store.read();
    await userEvent.click(await screen.findByRole('button', { name: t.hbSaveAsNew }));
    expect(await screen.findByText(t.hbArtGone)).toBeInTheDocument();
    expect(screen.getByLabelText(/Название/)).toHaveValue('Кольцо с гравировкой мой');
    cleanup();

    const two = await editor(AXE);
    await userEvent.type(screen.getByLabelText(/Название/), ' мой');
    await two.cloud.homebrew.removeItem((await rowOf(two.cloud, AXE))!.id);
    await two.store.read();
    await userEvent.click(await screen.findByRole('button', { name: t.hbSaveAsNew }));
    await toastSays('Предмет «Топор Тлеющих Углей мой» создан');
    const read = (await two.cloud.homebrew.load()) as {
      ok: true;
      items: { content: HomebrewContent; art?: string | null }[];
    };
    expect(read.items.find((i) => i.content.ru === 'Топор Тлеющих Углей мой')?.art).toBe(
      'ci1.webp'
    );
  });
});
