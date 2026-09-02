/* The shell, driven through fake ports.
 *
 * Every one of these would need a browser, a real localStorage and a real
 * address bar without them. With them it is a function of an Env, which is the
 * whole argument for Phase 3 in one file. */
import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../App.svelte';
import { expectNoA11yViolations } from '../test/a11y.js';
import { brokenStorage, fakeEnv, memoryRouter, memoryStorage } from '../ports/index.js';
import type { Env } from '../ports/index.js';

afterEach(cleanup);

const at = (hash: string, over: Partial<Env> = {}): Env =>
  fakeEnv({ router: memoryRouter(hash), ...over });

describe('the frame', () => {
  it('names the tab bar and the language group for a screen reader', () => {
    /* Neither has text of its own, so without a label they are two unnamed
       groups of links */
    render(App, { env: at('#/roll/std') });
    expect(screen.getByRole('navigation', { name: 'Разделы' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Язык' })).toBeInTheDocument();
  });

  it('offers a way past the tabs to the content', () => {
    render(App, { env: at('#/roll/std') });
    expect(screen.getByRole('link', { name: 'К содержимому' })).toHaveAttribute(
      'href',
      '#main'
    );
  });

  it('follows the language on the document itself', async () => {
    render(App, { env: at('#/roll/std') });
    expect(document.documentElement.lang).toBe('ru');
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(document.documentElement.lang).toBe('en');
    expect(document.title).toBe('Daggerheart Loot Generator');
  });
});

describe('the language', () => {
  it('redraws the interface, not just the switch', async () => {
    render(App, { env: at('#/roll/std') });
    expect(screen.getByRole('link', { name: 'Обычные правила' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByRole('link', { name: 'Standard rules' })).toBeInTheDocument();
  });

  it('leaves the wordmark alone', async () => {
    /* It is a logo, not a string: the live app writes "Лут Daggerheart" into
       index.html once and never translates it. The rewrite had it in the
       dictionary and was turning it into "Loot Daggerheart" on every English
       page, which no test and no route-level screenshot could see. */
    render(App, { env: at('#/roll/std') });
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByRole('link', { name: 'ЛутDaggerheart' })).toHaveAttribute(
      'href',
      '#/roll/std'
    );
  });

  it('is remembered', async () => {
    const storage = memoryStorage();
    render(App, { env: at('#/roll/std', { storage }) });
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(storage.get('dhloot.lang.v1')).toBe('en');
  });

  it('starts from what was remembered', () => {
    render(App, {
      env: at('#/roll/std', { storage: memoryStorage({ 'dhloot.lang.v1': 'en' }) })
    });
    expect(screen.getByRole('link', { name: 'Standard rules' })).toBeInTheDocument();
  });

  it('ignores a stored value that is not a language', () => {
    /* Settings are read as untrusted data: rubbish falls back rather than
       leaving the page in a state with no dictionary */
    render(App, {
      env: at('#/roll/std', { storage: memoryStorage({ 'dhloot.lang.v1': 'xx' }) })
    });
    expect(screen.getByRole('link', { name: 'Обычные правила' })).toBeInTheDocument();
  });
});

describe('which tab is lit', () => {
  it('marks the section the address names', () => {
    render(App, { env: at('#/roll/voa') });
    expect(screen.getByRole('link', { name: 'Vault of Ages' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it('lights Tables for a table, and Lists for a list', () => {
    render(App, { env: at('#/tables/eq_weapon') });
    expect(screen.getByRole('link', { name: 'Таблицы' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    cleanup();

    render(App, { env: at('#/lists/abc') });
    expect(screen.getByRole('link', { name: 'Списки' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it('lights nothing on a record', () => {
    /* A record belongs to no section, and lighting one would be a claim about
       where it came from that the address does not make */
    render(App, { env: at('#/i/ci1') });
    for (const link of screen.getAllByRole('link')) {
      expect(link).not.toHaveAttribute('aria-current');
    }
  });

  it('follows an old section name to the section it became', () => {
    render(App, { env: at('#/roll/hnf') });
    expect(screen.getByRole('link', { name: 'Обычные правила' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });
});

describe('the address on the way in', () => {
  it('opens the pinned section when there is none', () => {
    const router = memoryRouter('');
    render(App, {
      env: fakeEnv({ router, storage: memoryStorage({ 'dhloot.home.v1': '#/search' }) })
    });
    expect(router.hash()).toBe('#/search');
    expect(screen.getByRole('link', { name: 'Поиск' })).toHaveAttribute('aria-current', 'page');
  });

  it('leaves a real address alone, whatever is pinned', () => {
    /* A link to a record or a shared list must beat a preference: the person
       following it did not ask for somebody's home screen */
    const router = memoryRouter('#/i/ci1');
    render(App, {
      env: fakeEnv({ router, storage: memoryStorage({ 'dhloot.home.v1': '#/search' }) })
    });
    expect(router.hash()).toBe('#/i/ci1');
  });

  it('refuses a pinned address that is a snapshot rather than a section', () => {
    /* A record or a list drifts away from the data; only a section or a named
       table may be pinned */
    const router = memoryRouter('');
    render(App, {
      env: fakeEnv({ router, storage: memoryStorage({ 'dhloot.home.v1': '#/i/ci1' }) })
    });
    expect(router.hash()).toBe('#/roll/std');
  });
});

describe('storage that does not work', () => {
  it('says so before anyone builds a list', () => {
    render(App, { env: at('#/lists', { storage: brokenStorage() }) });
    expect(screen.getByRole('status')).toHaveTextContent('не переживут перезагрузку');
  });

  it('says nothing when it does', () => {
    render(App, { env: at('#/lists') });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('accessibility', () => {
  /* Not a separate concern from the tests above: those check that the frame
     says the right things, this checks that the markup saying them is markup a
     screen reader can follow. Every slice added below the shell adds a case
     here - see docs/specs/COVERAGE.md. */
  it('has no axe violations on a section', async () => {
    const { container } = render(App, { env: at('#/roll/std') });
    await expectNoA11yViolations(container);
  });

  it('has no axe violations in English', async () => {
    const { container } = render(App, { env: at('#/tables/weapons') });
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    await expectNoA11yViolations(container);
  });

  it('has no axe violations while warning that storage is off', async () => {
    const { container } = render(App, { env: at('#/lists', { storage: brokenStorage() }) });
    await expectNoA11yViolations(container);
  });
});
