/* Accessibility, on states rather than on first paints.
 *
 * The other component tests each end with an axe assertion, and every one of
 * them ran on a screen nobody had pressed anything on - the same blind spot
 * tests/parity.js had before it compared states. The modal is the sharpest
 * example: a focus trap, `aria-modal`, and a close button, none of which any
 * axe run had ever seen, because opening it takes two presses.
 *
 * This file holds the states reached by pressing, and the guard below, which
 * is what keeps the coverage from quietly lapsing when a component is added. */

import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../App.svelte';
import { fakeData, fakeEnv, memoryRouter } from '../ports/index.js';
import type { Env } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import type { Loot } from '../lib/data.js';
import type { Record_ } from '../lib/types.js';

afterEach(cleanup);

const row = (over: Partial<Record_>): Record_ => ({
  id: 'x',
  src: 'wondrous',
  kind: 'item',
  en: 'Thing',
  ende: 'Does a thing.',
  ru: 'Вещь',
  rud: 'Делает что-то.',
  ...over
});

const LOOT: Loot = {
  items: {
    wondrous: [row({ id: 'w1', roll: 1, ru: 'Первая вещь' })],
    voa: [row({ id: 'v1', src: 'voa', tier: 1, ru: 'Реликвия' })],
    community: [
      row({ id: 'c1', src: 'community', community: 'Loreborne', community_ru: 'Научное' })
    ]
  },
  eq: [],
  refs: {}
};

const at = (hash: string, over: Partial<Env> = {}): Env =>
  fakeEnv({ router: memoryRouter(hash), data: fakeData(LOOT), ...over });

const press = (name: string): Promise<void> =>
  userEvent.click(screen.getByRole('button', { name }));

/**
 * The states axe is run on, beyond the first paints the other files cover.
 *
 * Each is reached the way a person reaches it. A state that is not here is not
 * checked, so adding a way into a screen means adding it - the same rule
 * STATES follows in tests/parity/specs.js.
 */
const STATES: { what: string; route: string; enter?: () => Promise<void> }[] = [
  {
    what: 'the record over the page, which has the focus trap',
    route: '#/roll/wondrous',
    enter: () => press('Страница')
  },
  {
    what: 'the help panel, unfolded',
    route: '#/roll/wondrous',
    enter: () => press('Как это работает')
  },
  {
    what: 'the section pinned as the one to open on',
    route: '#/roll/wondrous',
    enter: () => press('Открывать этот раздел при запуске')
  },
  {
    what: 'a roll page in English',
    route: '#/roll/wondrous',
    enter: () => press('EN')
  },
  {
    what: 'a division of Vault of Ages that is not a tier',
    route: '#/roll/voa',
    enter: () => press('Артефакты')
  },
  {
    what: 'Vault of Ages in English',
    route: '#/roll/voa',
    enter: () => press('EN')
  },
  {
    what: 'communities in English',
    route: '#/roll/community',
    enter: () => press('EN')
  }
];

describe('states reached by pressing something', () => {
  it.each(STATES)('has no axe violations on $what', async ({ route, enter }) => {
    const { container } = render(App, { env: at(route) });
    await enter?.();
    await expectNoA11yViolations(container);
  });
});

/**
 * Where each component is rendered under axe.
 *
 * A guard, not documentation: the test below compares this against the files
 * on disk, so a new component fails until somebody says which state exercises
 * it. Coverage already forces a component to be *rendered* by some test; this
 * is what forces it to be rendered while axe is watching, which is a different
 * question and the one that was going unasked.
 */
const COVERED: Record<string, string> = {
  'Button.svelte': 'the roll button and the card actions, on every roll page',
  'Chip.svelte': 'the Vault of Ages and community pickers - sections.test.ts and above',
  'ChipRow.svelte': 'the same two pickers',
  'CommunityPanel.svelte': 'sections.test.ts, and in English above',
  'Die.svelte': 'the roll button on every roll page',
  'Field.svelte': 'the number row on every roll page, and both pickers',
  'Icon.svelte': 'the card actions and the pin toggle',
  'LangSwitch.svelte': 'the frame, on every state here and in shell.test.ts',
  'NumberField.svelte': 'the number row on every roll page',
  'RecordActions.svelte': 'record.test.ts, and inside the modal above',
  'RecordCard.svelte': 'record.test.ts, and inside the modal above',
  'RecordModal.svelte': 'the first state above, which is the only way in',
  'RecordPage.svelte': 'record.test.ts',
  'RollPanel.svelte': 'roll.test.ts, and the pressed states above',
  'Shell.svelte': 'shell.test.ts, including the storage warning',
  'TabBar.svelte': 'the frame, on every state',
  'VoaPanel.svelte': 'sections.test.ts, and in English above'
};

describe('the guard', () => {
  it('has an axe-covered state named for every component', () => {
    /* Vite resolves this at build time, so it needs no filesystem and no guess
       about the working directory - `import.meta.url` is rewritten by the
       transform, and cwd differs between `npm test` and a single-file run. */
    const onDisk = Object.keys(import.meta.glob('./*.svelte'))
      .map((p) => p.replace('./', ''))
      .sort();
    /* Compared as a whole rather than one-way: a component that is deleted has
       to lose its entry too, or the list drifts into fiction. */
    expect(onDisk).toEqual(Object.keys(COVERED).sort());
  });

  it('says something about each, rather than carrying an empty promise', () => {
    for (const [file, where] of Object.entries(COVERED)) {
      expect(where.length, file).toBeGreaterThan(10);
    }
  });
});
