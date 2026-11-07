/* Rolling on one table, the number field, and the record over the page.
 *
 * The dice are a port here, so "what came up" is an assertion rather than a
 * shrug - a roll test that can only check that something appeared is the test
 * that lets a wrong table through. */

import { cleanup, render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import {
  brokenStorage,
  fakeData,
  fakeEnv,
  memoryRouter,
  memoryStorage,
  noData
} from '../ports/index.js';
import type { Env } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import type { Loot } from '../lib/data.js';
import { sectionHash } from '../lib/hash.js';
import { SUPPLEMENTS } from '../lib/nav.js';
import type { Record_ } from '../lib/types.js';
import { readLoot } from '../test/loot.js';

afterEach(cleanup);

/* jsdom does not implement scrollIntoView: the record's menu calls it once open. */
Element.prototype.scrollIntoView = vi.fn();

const row = (i: number, src: string): Record_ => ({
  id: `${src}${String(i)}`,
  src,
  kind: 'item',
  roll: i,
  en: `${src} thing ${String(i)}`,
  ende: 'Does a thing.',
  ru: `${src} вещь ${String(i)}`,
  rud: 'Делает что-то.'
});

/* Dread has 29 rows in the book, which is deliberately not a die anybody owns;
   the wondrous table here is cut to 20, which is. */
const LOOT: Loot = {
  items: {
    wondrous: Array.from({ length: 20 }, (_, i) => row(i + 1, 'w')),
    dread: Array.from({ length: 29 }, (_, i) => row(i + 1, 'd'))
  }
};

const at = (hash: string, over: Partial<Env> = {}): Env =>
  fakeEnv({ router: memoryRouter(hash), data: fakeData(LOOT), ...over });

/** A dice roll that always lands on the same row, counting from one. */
const lands =
  (n: number, of: number): (() => number) =>
  () =>
    (n - 1) / of;

describe('rolling on a table', () => {
  it('opens on the first row rather than on an empty panel', () => {
    /* What the live app did. A page that shows nothing until it is pressed
       reads as one that failed to load - and the parity harness (deleted at
       23c00a6, R0c, issue 47) caught the invitation-first version as a
       difference from the original. */
    render(App, { env: at('#/roll/wondrous') });
    expect(screen.getByRole('heading', { level: 2, name: 'w вещь 1' })).toBeInTheDocument();
  });

  it('names a real die where the range has one', () => {
    render(App, { env: at('#/roll/wondrous') });
    expect(screen.getByRole('button', { name: 'Бросить d20' })).toBeInTheDocument();
  });

  it('names the range where the range is not a die', () => {
    /* 29 is not a die, and calling it one would be a lie a player acts on. */
    render(App, { env: at('#/roll/dread') });
    expect(screen.getByRole('button', { name: 'Бросить 1-29' })).toBeInTheDocument();
  });

  it('lands on the row the dice chose', async () => {
    render(App, { env: at('#/roll/wondrous', { random: lands(7, 20) }) });
    await userEvent.click(screen.getByRole('button', { name: 'Бросить d20' }));
    expect(screen.getByRole('heading', { level: 2, name: 'w вещь 7' })).toBeInTheDocument();
  });

  it('rolls on its own table and not on a neighbor', async () => {
    render(App, { env: at('#/roll/dread', { random: lands(3, 29) }) });
    await userEvent.click(screen.getByRole('button', { name: 'Бросить 1-29' }));
    expect(screen.getByRole('heading', { level: 2, name: 'd вещь 3' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'w вещь 3' })).not.toBeInTheDocument();
  });

  it('never rolls past either end of the table', async () => {
    /* The two ends are where an off-by-one lives, and a roll of 0 or of 21
       would render nothing at all rather than fail loudly. */
    for (const [n, label] of [
      [1, 'w вещь 1'],
      [20, 'w вещь 20']
    ] as const) {
      cleanup();
      render(App, { env: at('#/roll/wondrous', { random: lands(n, 20) }) });
      await userEvent.click(screen.getByRole('button', { name: 'Бросить d20' }));
      expect(screen.getByRole('heading', { level: 2, name: label })).toBeInTheDocument();
    }
  });

  it('says so when the dataset did not load, under the heading and nothing else', () => {
    const { container } = render(App, { env: at('#/roll/wondrous', { data: noData() }) });
    expect(screen.getByText('Данные не загрузились. Обновите страницу.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(container.querySelector('.rp')).toBeNull();
  });
});

describe('choosing the number by hand', () => {
  const field = (): HTMLInputElement =>
    screen.getByRole<HTMLInputElement>('textbox', { name: 'Результат броска' });

  it('shows the row for a number that is typed and committed', async () => {
    render(App, { env: at('#/roll/wondrous') });
    await userEvent.clear(field());
    await userEvent.type(field(), '12');
    await userEvent.tab();
    expect(screen.getByRole('heading', { level: 2, name: 'w вещь 12' })).toBeInTheDocument();
  });

  it('keeps two digits in the order they were typed', async () => {
    /* Defect #64 in the interface it happened in: the caret jumping to the end
       turned 47 into 74. The rule is unit-tested in lib/numField.test.ts; this
       is the field itself. */
    render(App, { env: at('#/roll/wondrous') });
    await userEvent.clear(field());
    await userEvent.type(field(), '14');
    expect(field().value).toBe('14');
  });

  it('refuses anything that is not a digit', async () => {
    render(App, { env: at('#/roll/wondrous') });
    await userEvent.clear(field());
    await userEvent.type(field(), '1a2');
    expect(field().value).toBe('12');
  });

  it('caps a number over the end of the table as it is typed', async () => {
    render(App, { env: at('#/roll/wondrous') });
    await userEvent.clear(field());
    await userEvent.type(field(), '99');
    expect(field().value).toBe('20');
  });

  it('settles an emptied field on the first row rather than on nothing', async () => {
    render(App, { env: at('#/roll/wondrous') });
    await userEvent.clear(field());
    await userEvent.tab();
    expect(field().value).toBe('1');
  });

  it('steps by one, and stops at the ends', async () => {
    render(App, { env: at('#/roll/wondrous') });
    const up = screen.getByRole('button', { name: 'На единицу больше' });
    const down = screen.getByRole('button', { name: 'На единицу меньше' });

    expect(down).toBeDisabled();
    await userEvent.click(up);
    expect(field().value).toBe('2');
    expect(screen.getByRole('heading', { level: 2, name: 'w вещь 2' })).toBeInTheDocument();

    await userEvent.click(down);
    expect(field().value).toBe('1');
    expect(down).toBeDisabled();
  });
});

describe("The Dragon's Vault over the real data", () => {
  /* The book's equipment rolls after its loot, 78-145, and keeps its stat
     block in the result card. */
  const REAL = readLoot();
  const field = (): HTMLInputElement =>
    screen.getByRole<HTMLInputElement>('textbox', { name: 'Результат броска' });
  const typed = async (n: string): Promise<void> => {
    render(App, { env: fakeEnv({ router: memoryRouter('#/roll/dv'), data: fakeData(REAL) }) });
    await userEvent.clear(field());
    await userEvent.type(field(), n);
    await userEvent.tab();
  };

  it('names the whole range on the button', () => {
    render(App, { env: fakeEnv({ router: memoryRouter('#/roll/dv'), data: fakeData(REAL) }) });
    expect(screen.getByRole('button', { name: 'Бросить 1-145' })).toBeInTheDocument();
  });

  it('draws the first piece of equipment, stat line and all, at 78', async () => {
    await typed('78');
    expect(
      screen.getByRole('heading', { level: 2, name: 'Тысяча Порезов' })
    ).toBeInTheDocument();
    expect(screen.getByText(/d8\+4/)).toBeInTheDocument();
  });

  it('draws the last piece of equipment at 145', async () => {
    await typed('145');
    expect(field().value).toBe('145');
    expect(screen.getByRole('heading', { level: 2, name: 'Оберег Теней' })).toBeInTheDocument();
  });
});

/* An upgrade line is one roll row, its head; the other tiers open from the card
   (docs/specs/FEATURES.md, "Rolling"). */
describe('the whole-table supplements over the real data', () => {
  const REAL = readLoot();
  const field = (): HTMLInputElement =>
    screen.getByRole<HTMLInputElement>('textbox', { name: 'Результат броска' });
  const open = (route: string): void => {
    render(App, { env: fakeEnv({ router: memoryRouter(route), data: fakeData(REAL) }) });
  };
  const typed = async (route: string, n: string): Promise<void> => {
    open(route);
    await userEvent.clear(field());
    await userEvent.type(field(), n);
    await userEvent.tab();
  };
  const heading = (name: string): HTMLElement =>
    screen.getByRole('heading', { level: 2, name });

  it("rolls Arazo's Artifacts over 27 entries, one per item", () => {
    open('#/roll/arazo');
    expect(screen.getByRole('button', { name: 'Бросить 1-27' })).toBeInTheDocument();
    expect(screen.getByText('Результат броска (1-27)')).toBeInTheDocument();
  });

  it('draws the head of an upgrade line, stat line and all, at 7', async () => {
    await typed('#/roll/arazo', '7');
    expect(heading('Лук из Эльфийских Волос')).toBeInTheDocument();
    expect(screen.getByText(/d10\+1/)).toBeInTheDocument();
  });

  it('clamps a 28 to the last entry, 27', async () => {
    await typed('#/roll/arazo', '28');
    expect(field().value).toBe('27');
    expect(heading('Ларец Зерана')).toBeInTheDocument();
  });

  it('reaches no rung: every one of the 27 entries is a head or a single item', async () => {
    open('#/roll/arazo');
    const up = screen.getByRole('button', { name: 'На единицу больше' });
    for (let n = 1; n <= 27; n++) {
      const name = document.querySelector('.card-name')?.textContent ?? '';
      expect(name, String(n)).not.toBe('');
      expect(name, String(n)).not.toMatch(/^(Улучшенн|Продвинут|Легендарн)/);
      if (n < 27) await userEvent.click(up);
    }
  });

  it('rolls Pistolheart over 45 entries and draws a head at 14 and the last entry at 45', async () => {
    open('#/roll/ph');
    expect(screen.getByRole('button', { name: 'Бросить 1-45' })).toBeInTheDocument();
    cleanup();
    await typed('#/roll/ph', '14');
    expect(heading('Разделочный Нож')).toBeInTheDocument();
    cleanup();
    await typed('#/roll/ph', '46');
    expect(field().value).toBe('45');
    expect(heading('Инфузия Доблести')).toBeInTheDocument();
  });

  it('rolls Escape the Veiled Halls over its 15 entries, with no room picker', async () => {
    open('#/roll/vh');
    expect(screen.getByRole('button', { name: 'Бросить 1-15' })).toBeInTheDocument();
    expect(screen.getByText('Результат броска (1-15)')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByText('Комната')).not.toBeInTheDocument();
    cleanup();
    await typed('#/roll/vh', '9');
    expect(heading('Зелье Внимательности')).toBeInTheDocument();
    cleanup();
    await typed('#/roll/vh', '50');
    expect(field().value).toBe('15');
    expect(heading('Легендарное Зелье Предвидения')).toBeInTheDocument();
  });

  it('rolls Escape the Veiled Halls the same way in English', async () => {
    open('#/roll/vh');
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByRole('button', { name: 'Roll 1-15' })).toBeInTheDocument();
    expect(screen.getByText('Roll result (1-15)')).toBeInTheDocument();
    expect(screen.queryByText('Room')).not.toBeInTheDocument();
    const en = screen.getByRole<HTMLInputElement>('textbox', { name: 'Roll result' });
    await userEvent.clear(en);
    await userEvent.type(en, '15');
    await userEvent.tab();
    expect(heading('Legendary Foresight Potion')).toBeInTheDocument();
  });

  it('has no axe violations on Escape the Veiled Halls', async () => {
    const { container } = render(App, {
      env: fakeEnv({ router: memoryRouter('#/roll/vh'), data: fakeData(REAL) })
    });
    await expectNoA11yViolations(container);
  });
});

describe('pinning the section', () => {
  const OFF = 'Открывать при запуске';
  const ON = 'Открывается при запуске';
  const pin = (name = OFF): HTMLElement => screen.getByRole('button', { name });

  it('remembers the choice, and says so on the control', async () => {
    /* The live app renames the button rather than only filling it in, so a
       screen reader hears the state and not just the offer. The test used to
       look it up by the "off" name both times, which is why the rename went
       missing from the port until a parity state pressed it. */
    render(App, { env: at('#/roll/wondrous') });
    expect(pin()).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(pin());
    expect(pin(ON)).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: OFF })).not.toBeInTheDocument();
  });

  it('says nothing was saved when the browser refuses', async () => {
    /* A control that looks pressed but did not stick is a control that lies. */
    render(App, { env: at('#/roll/wondrous', { storage: brokenStorage() }) });
    await userEvent.click(pin());
    expect(pin()).toHaveAttribute('aria-pressed', 'false');
    /* The shell also warns that storage is off, so both live regions are on
       the page; this asks for the panel's. */
    expect(
      screen.getByText(
        'Не удалось сохранить: браузер не дал записать в локальное хранилище - оно заблокировано или переполнено'
      )
    ).toBeInTheDocument();
  });
});

describe('the help panel', () => {
  const help = (name = 'Об этой таблице'): HTMLElement => screen.getByRole('button', { name });

  it('is folded until it is asked for', () => {
    render(App, { env: at('#/roll/wondrous') });
    expect(help()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/В таблице 119 позиций/)).not.toBeInTheDocument();
  });

  it('explains why the button says random rather than naming a die', async () => {
    /* That is the question the panel exists to answer: no die has 119 faces. */
    render(App, { env: at('#/roll/wondrous') });
    await userEvent.click(help());
    expect(help()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Кости на такой диапазон не бывает/)).toBeInTheDocument();
  });

  it('credits the book it came from, as a link', async () => {
    render(App, { env: at('#/roll/dread') });
    await userEvent.click(help('Об этой книге'));
    expect(
      screen.getByRole('link', { name: 'Dread GM Toolbox for Daggerheart' })
    ).toHaveAttribute('href', expect.stringContaining('drivethrurpg.com'));
  });

  it('folds again', async () => {
    render(App, { env: at('#/roll/wondrous') });
    await userEvent.click(help());
    await userEvent.click(help());
    expect(screen.queryByText(/В таблице 119 позиций/)).not.toBeInTheDocument();
  });
});

describe('a table with nothing in it', () => {
  it('says so rather than drawing an empty panel', () => {
    render(App, {
      env: at('#/roll/wondrous', { data: fakeData({ items: { wondrous: [] } }) })
    });
    expect(screen.getByText('Данные не загрузились. Обновите страницу.')).toBeInTheDocument();
  });
});

describe('the record over the page', () => {
  const openFirst = async (): Promise<void> => {
    render(App, { env: at('#/roll/wondrous', { random: lands(5, 20) }) });
    await userEvent.click(screen.getByRole('button', { name: 'Бросить d20' }));
    /* The picture is the way in, as it is in the live app. */
    await userEvent.click(screen.getAllByRole('button', { name: 'Открыть карточку' })[0]!);
  };

  it('opens the record without leaving the page behind it', async () => {
    await openFirst();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    /* Two cards now carry the name - the one in the panel and the one in the
       dialog over it - so this asks the dialog rather than the page. */
    expect(
      within(dialog).getByRole('heading', { level: 2, name: 'w вещь 5' })
    ).toBeInTheDocument();
    /* The roll is still there underneath, so closing returns to it. */
    expect(screen.getByRole('button', { name: 'Бросить d20' })).toBeInTheDocument();
  });

  it('closes on the close button', async () => {
    await openFirst();
    await userEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on the backdrop, as pressing beside the card does in the live app', async () => {
    /* The backdrop is not an element of its own, so the press lands on the
       dialog itself - which is how "outside the card" is told from "inside
       it" without a second transparent layer to keep in step. */
    await openFirst();
    await userEvent.click(screen.getByRole('dialog'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('stays open when the press lands on the card', async () => {
    await openFirst();
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('heading', { level: 2, name: 'w вещь 5' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('offers the same actions on the card as the record page does', async () => {
    /* The rewrite drew this card with no actions at all for a while. No
       route-level parity spec could see it, because a modal is a state and not
       a URL - `tests/app/states.js` and `tests/app/golden.js` both visit it
       now. */
    await openFirst();
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Поделиться' })).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Ещё' }));
    for (const name of ['Скопировать название', 'Скопировать ссылку', 'Скопировать текст']) {
      expect(within(dialog).getByRole('menuitem', { name }), name).toBeInTheDocument();
    }
  });

  it("goes one step deeper from the dialog's picture: the record's page", async () => {
    await openFirst();
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).queryByRole('button', { name: 'Открыть карточку' })).toBeNull();
    const link = within(dialog).getByRole('link', { name: 'Открыть страницу' });
    expect(link).toHaveClass('card-media');
    const id = link.closest('.card')?.getAttribute('data-id') ?? '';
    expect(id).not.toBe('');
    expect(link).toHaveAttribute('href', `/i/${id}`);
    await expectNoA11yViolations(dialog);
  });
});

describe('a picker of parts', () => {
  const PARTS: Loot = {
    items: {
      voa: [
        ...Array.from({ length: 3 }, (_, i) => ({ ...row(i + 1, 'v'), tier: 1 as const })),
        ...Array.from({ length: 2 }, (_, i) => ({ ...row(i + 1, 'x'), tier: 2 as const }))
      ]
    }
  };

  it('puts the roll back to one when the part changes', async () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/roll/voa'), data: fakeData(PARTS) })
    });
    const select = screen.getByRole('combobox', { name: 'Раздел книги' });
    await userEvent.click(screen.getByRole('button', { name: 'На единицу больше' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Бросок 2' })).toBeInTheDocument();
    await userEvent.selectOptions(select, '2');
    expect(screen.getByRole('heading', { level: 2, name: 'Бросок 1' })).toBeInTheDocument();
  });
});

describe('the mode row on a roll page', () => {
  const modes = (): HTMLElement | null =>
    screen.queryByRole('navigation', { name: 'Режим броска' });

  it.each(SUPPLEMENTS)('lights the supplements button on %s and draws no chip panel', (s) => {
    render(App, { env: at(`#/${s}`) });
    const nav = modes();
    expect(nav).not.toBeNull();
    const lit = (nav as HTMLElement).querySelector('[aria-current="page"]');
    expect(lit?.tagName).toBe('BUTTON');
    expect(lit?.getAttribute('data-section')).toBe(sectionHash(s));
    expect(screen.queryByRole('navigation', { name: 'Дополнения' })).toBeNull();
  });

  it.each(['#/roll/std', '#/roll/alt'])('lights its own link on %s', (hash) => {
    render(App, { env: at(hash) });
    const lit = (modes() as HTMLElement).querySelector('[aria-current="page"]');
    expect(lit?.getAttribute('href')).toBe(hash.slice(1));
  });
});

describe('accessibility', () => {
  it('names the roll in a hidden status, and the results are no live region', () => {
    /* A menu opens inside the results: a live region there would read the card again. */
    const { container } = render(App, { env: at('#/roll/wondrous') });
    const results = container.querySelector('.results');
    expect(results).not.toHaveAttribute('role');
    expect(results).not.toHaveAttribute('aria-live');
    expect(container.querySelector('.said[role="status"]')?.textContent).not.toBe('');
  });

  it('has no axe violations on an untouched roll page', async () => {
    const { container } = render(App, { env: at('#/roll/wondrous') });
    await expectNoA11yViolations(container);
  });

  it('has no axe violations once something has come up', async () => {
    const { container } = render(App, { env: at('#/roll/dread', { random: lands(2, 29) }) });
    await userEvent.click(screen.getByRole('button', { name: 'Бросить 1-29' }));
    await expectNoA11yViolations(container);
  });
});

/* The whole-table rolls share one branch of App.svelte; a number kept from one
   table pointed past the end of a shorter one and drew nothing. */
describe('switching between two tables', () => {
  it('starts the next table at its first row after a switch from a longer one', async () => {
    const router = memoryRouter('#/roll/dread');
    render(App, { env: fakeEnv({ router, data: fakeData(LOOT) }) });
    const field = (): HTMLInputElement =>
      screen.getByRole<HTMLInputElement>('textbox', { name: 'Результат броска' });
    await userEvent.clear(field());
    await userEvent.type(field(), '25');
    await userEvent.tab();
    expect(screen.getByRole('heading', { level: 2, name: 'd вещь 25' })).toBeInTheDocument();
    router.navigate('#/roll/wondrous');
    expect(
      await screen.findByRole('heading', { level: 2, name: 'w вещь 1' })
    ).toBeInTheDocument();
    expect(field().value).toBe('1');
  });
});

/* An old roll address names the page the stored slug pin points at. */
describe('the home button on an old roll address', () => {
  it('is pressed on #/roll/dread when #/roll/dread_gm_toolbox is pinned', async () => {
    const { container } = render(App, {
      env: at('#/roll/dread', {
        storage: memoryStorage({ 'dhloot.home.v1': '#/roll/dread_gm_toolbox' })
      })
    });
    expect(container.querySelector('.homebtn')).toHaveAttribute('aria-pressed', 'true');
    await expectNoA11yViolations(container);
  });
});
