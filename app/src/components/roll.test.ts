/* Rolling on one table, the number field, and the record over the page.
 *
 * The dice are a port here, so "what came up" is an assertion rather than a
 * shrug - a roll test that can only check that something appeared is the test
 * that lets a wrong table through. */

import { cleanup, render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../App.svelte';
import { brokenStorage, fakeData, fakeEnv, memoryRouter, noData } from '../ports/index.js';
import type { Env } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import type { Loot } from '../lib/data.js';
import type { Record_ } from '../lib/types.js';

afterEach(cleanup);

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
    /* What the live app does. A page that shows nothing until it is pressed
       reads as one that failed to load - and tests/parity.js caught the
       invitation-first version as a difference from the original. */
    render(App, { env: at('#/roll/wondrous') });
    expect(screen.getByRole('heading', { level: 2, name: 'w вещь 1' })).toBeInTheDocument();
  });

  it('names a real die where the range has one', () => {
    render(App, { env: at('#/roll/wondrous') });
    expect(screen.getByRole('button', { name: 'Бросить d20' })).toBeInTheDocument();
  });

  it('says "random" where the range is not a die', () => {
    /* 29 is not a die, and calling it one would be a lie a player acts on.
       The dash is an en dash, as the live app prints it: tests/parity.js
       compares the two apps character for character and caught a hyphen here. */
    render(App, { env: at('#/roll/dread') });
    expect(screen.getByRole('button', { name: 'Случайно 1–29' })).toBeInTheDocument();
  });

  it('lands on the row the dice chose', async () => {
    render(App, { env: at('#/roll/wondrous', { random: lands(7, 20) }) });
    await userEvent.click(screen.getByRole('button', { name: 'Бросить d20' }));
    expect(screen.getByRole('heading', { level: 2, name: 'w вещь 7' })).toBeInTheDocument();
  });

  it('rolls on its own table and not on a neighbour', async () => {
    render(App, { env: at('#/roll/dread', { random: lands(3, 29) }) });
    await userEvent.click(screen.getByRole('button', { name: 'Случайно 1–29' }));
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

  it('says so when the dataset did not load', () => {
    render(App, { env: at('#/roll/wondrous', { data: noData() }) });
    expect(screen.getByText('Данные не загрузились. Обновите страницу.')).toBeInTheDocument();
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

describe('pinning the section', () => {
  const pin = (): HTMLElement =>
    screen.getByRole('button', { name: 'Открывать этот раздел при запуске' });

  it('remembers the choice, and says so on the control', async () => {
    render(App, { env: at('#/roll/wondrous') });
    expect(pin()).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(pin());
    expect(pin()).toHaveAttribute('aria-pressed', 'true');
  });

  it('says nothing was saved when the browser refuses', async () => {
    /* A control that looks pressed but did not stick is a control that lies. */
    render(App, { env: at('#/roll/wondrous', { storage: brokenStorage() }) });
    await userEvent.click(pin());
    expect(pin()).toHaveAttribute('aria-pressed', 'false');
    /* The shell also warns that storage is off, so both live regions are on
       the page; this asks for the panel's. */
    expect(screen.getByText('Не удалось скопировать')).toBeInTheDocument();
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
    await userEvent.click(screen.getAllByRole('button', { name: 'Страница' })[0]!);
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
});

describe('accessibility', () => {
  it('has no axe violations on an untouched roll page', async () => {
    const { container } = render(App, { env: at('#/roll/wondrous') });
    await expectNoA11yViolations(container);
  });

  it('has no axe violations once something has come up', async () => {
    const { container } = render(App, { env: at('#/roll/dread', { random: lands(2, 29) }) });
    await userEvent.click(screen.getByRole('button', { name: 'Случайно 1–29' }));
    await expectNoA11yViolations(container);
  });
});
