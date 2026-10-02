/* The homebrew items in the catalog pages over the fake cloud: `#/tables/homebrew` and its
   states, sections, facets and anchors; own equipment in the equipment tables; one merged
   search with the intro sentence; the «Хоумбрю» chip that hides the own items for the visit.
   docs/specs/FEATURES.md, "Tables and search". */
import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import type { Loot } from '../lib/data.js';
import { dict } from '../lib/dict.js';
import type { Record_ } from '../lib/types.js';
import { fakeCloud, type FakeCloud } from '../ports/fake-cloud.js';
import { SEED, uuid } from '../ports/fake-cloud-seed.js';
import { fakeData, fakeEnv, memoryRouter, memoryStorage } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const t = dict('ru');
const AXE = 'hb_emberaxeaaaaaaaa';
const ALDER = uuid(501);

const row = (over: Partial<Record_>): Record_ => ({
  id: 'x',
  src: 'core',
  kind: 'item',
  en: 'Thing',
  ende: '',
  ru: 'Вещь',
  rud: '',
  ...over
});

const LOOT: Loot = {
  items: {
    core_item: [
      row({ id: 'ci1', roll: 1, ru: 'Кольцо Тишины', en: 'Ring of Silence' }),
      row({ id: 'ci2', roll: 2, ru: 'Плащ Теней', en: 'Shadow Cloak' })
    ]
  },
  eq: [
    row({
      id: 'w1',
      ru: 'Короткий меч',
      en: 'Shortsword',
      eq: {
        t: 'weapon',
        tier: 1,
        cls: 'phy',
        tr: 'agility',
        rg: 'melee',
        dmg: 'd8',
        dt: 'phy',
        bu: 1
      }
    }),
    row({
      id: 'w2',
      ru: 'Боевой топор',
      en: 'Battleaxe',
      eq: {
        t: 'weapon',
        tier: 2,
        cls: 'phy',
        tr: 'strength',
        rg: 'melee',
        dmg: 'd10+3',
        dt: 'phy',
        bu: 2
      }
    })
  ]
};

function page(
  hash: string,
  opts: { as?: 'gm1' | 'gm2' | 'gm3' | null; cloud?: FakeCloud | null } = {}
) {
  const as = opts.as === undefined ? 'gm1' : opts.as;
  const cloud =
    opts.cloud === undefined
      ? as === null
        ? fakeCloud(SEED)
        : fakeCloud(SEED, as)
      : opts.cloud;
  const router = memoryRouter(hash);
  const view = render(App, {
    env: fakeEnv({ cloud, router, storage: memoryStorage(), data: fakeData(LOOT) })
  });
  return { ...view, cloud, router };
}

const rowIds = (root: ParentNode = document): (string | null)[] =>
  [...root.querySelectorAll('[data-row]')].map((el) => el.getAttribute('data-row'));

const headings = (): (string | null)[] =>
  [...document.querySelectorAll('.tsec-head .lbl')].map((el) => el.textContent);

/* One field of the open filter panel, by the label it starts with. */
function field(label: string): HTMLElement {
  const found = [...document.querySelectorAll<HTMLElement>('.ffilter .field')].find((f) =>
    f.querySelector('.lbl')?.textContent.startsWith(label)
  );
  if (!found) throw new Error(`No filter field «${label}». Open the filter panel first.`);
  return found;
}

const values = (label: string): string[] =>
  within(field(label))
    .getAllByRole('button')
    .map((b) => b.textContent);

/* The elements `scrollIntoView` was called on. */
function scrolls(): Element[] {
  const on: Element[] = [];
  Element.prototype.scrollIntoView = vi.fn(function (this: Element) {
    on.push(this);
  });
  return on;
}

const toolbarChip = (): HTMLElement => screen.getByRole('button', { name: t.srcHomebrew });

describe('#/tables/homebrew', () => {
  it('draws the own items by source and section, with the group chip on', async () => {
    const { container } = page('#/tables/homebrew');
    await screen.findByText('Топор Тлеющих Углей');
    expect(screen.getByRole('link', { name: t.srcHomebrew })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(headings()).toEqual(['Мастерская Ольхи · Холодное оружие', 'Хоумбрю']);
    expect(rowIds()).toHaveLength(4);
    expect(screen.getByPlaceholderText(t.searchPh)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: t.viewList }));
    expect(screen.getByText('Мастерская Ольхи (HB)')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: t.srcHomebrew })).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('offers kind, source and section, and a section pick leaves its one row', async () => {
    const { container, router } = page('#/tables/homebrew');
    await screen.findByText('Топор Тлеющих Углей');
    await userEvent.click(screen.getByRole('button', { name: t.filters }));
    expect(values(t.kindF).length).toBeGreaterThan(1);
    expect(values(t.source)).toEqual(['Хоумбрю', 'Мастерская Ольхи']);
    expect(values(t.hbSection)).toEqual(['Мастерская Ольхи · Холодное оружие']);
    await expectNoA11yViolations(container);
    await userEvent.click(
      within(field(t.hbSection)).getByRole('button', {
        name: 'Мастерская Ольхи · Холодное оружие'
      })
    );
    expect(router.hash()).toBe('#/tables/homebrew/f_sect-hb_sectbladesaaaaaa');
    expect(rowIds()).toEqual([AXE]);
  });

  it('scrolls a source key to the source items outside its sections', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    await cloud.homebrew.createItem({
      id: uuid(9001),
      key: 'hb_whetstoneaaaaaaa',
      book_id: ALDER,
      content: { kind: 'item', ru: 'Точильный камень' }
    });
    const on = scrolls();
    page('#/tables/homebrew/hb_alderworkshopaaa', { cloud });
    await screen.findAllByText('Точильный камень');
    expect(headings()).toEqual([
      'Мастерская Ольхи · Холодное оружие',
      'Мастерская Ольхи',
      'Хоумбрю'
    ]);
    await waitFor(() => {
      expect(on.map((el) => el.id)).toContain('sec-hb_alderworkshopaaa');
    });
    expect(document.getElementById('sec-hb_alderworkshopaaa')).toHaveClass('flash');
  });

  it('scrolls to nothing for a source key whose items all sit in sections, and draws the table', async () => {
    const on = scrolls();
    page('#/tables/homebrew/hb_alderworkshopaaa');
    await screen.findByText('Топор Тлеющих Углей');
    await new Promise((r) => setTimeout(r, 0));
    expect(on).toEqual([]);
    expect(rowIds()).toHaveLength(4);
  });

  it('scrolls a row anchor that arrives with the page once the own items load', async () => {
    const on = scrolls();
    page('#/tables/homebrew/' + AXE);
    expect(screen.getByText(t.cloudLoading)).toBeInTheDocument();
    await waitFor(() => {
      expect(on.map((el) => el.getAttribute('data-row'))).toContain(AXE);
    });
  });

  it('scrolls a section key and the default source key to their sections', async () => {
    const on = scrolls();
    page('#/tables/homebrew/hb_sectbladesaaaaaa');
    await screen.findByText('Топор Тлеющих Углей');
    await waitFor(() => {
      expect(on.map((el) => el.id)).toContain('sec-hb_sectbladesaaaaaa');
    });
    cleanup();
    const again = scrolls();
    page('#/tables/homebrew/hb');
    await screen.findByText('Топор Тлеющих Углей');
    await waitFor(() => {
      expect(again.map((el) => el.id)).toContain('sec-hb');
    });
  });

  it('finds an item edited elsewhere by its new name in the table box, not by its old one', async () => {
    const { cloud } = page('#/tables/homebrew');
    await screen.findByText('Топор Тлеющих Углей');
    const read = await cloud?.homebrew.load();
    const axe = read?.ok ? read.items.find((i) => i.key === AXE) : undefined;
    if (!cloud || !axe) throw new Error('The seed has no axe. Restore the seed.');
    await cloud.homebrew.updateItem(
      axe.id,
      { content: { ...axe.content, ru: 'Топор Пепла' }, book_id: axe.book_id },
      null
    );
    expect(await screen.findByText('Топор Пепла', {}, { timeout: 4000 })).toBeInTheDocument();
    const box = screen.getByPlaceholderText(t.searchPh);
    await userEvent.type(box, 'Пепла');
    expect(rowIds()).toEqual([AXE]);
    await userEvent.clear(box);
    await userEvent.type(box, 'Тлеющих');
    expect(rowIds()).toEqual([]);
  });

  it('asks a signed-out reader to sign in, with no group chip and no search box', async () => {
    const { container, router } = page('#/tables/homebrew', { as: null });
    expect(await screen.findByText(t.hbTablesSignIn)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: t.signIn })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: t.srcHomebrew })).toBeNull();
    expect(screen.queryByPlaceholderText(t.searchPh)).toBeNull();
    expect(router.hash()).toBe('#/tables/homebrew');
    await expectNoA11yViolations(container);
  });

  it('draws not found with no sign-in configured, and keeps the address', () => {
    const { router } = page('#/tables/homebrew', { cloud: null });
    expect(screen.getByRole('heading', { name: t.notFound })).toBeInTheDocument();
    expect(router.hash()).toBe('#/tables/homebrew');
  });

  it('draws the empty state with «Новый предмет» for an account with no item', async () => {
    const { container } = page('#/tables/homebrew', { as: 'gm2' });
    expect(await screen.findByText(t.hbEmptyTable)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: t.hbNewItem })).toHaveAttribute(
      'href',
      '#/homebrew/new'
    );
    await expectNoA11yViolations(container);
  });

  it('draws a failed read with «Повторить», which reads again', async () => {
    const cloud = fakeCloud(SEED, 'gm1', { offline: true });
    const { container } = page('#/tables/homebrew', { cloud });
    expect(await screen.findByText(t.hbLoadFailed)).toBeInTheDocument();
    await expectNoA11yViolations(container);
    cloud.setOffline(false);
    await userEvent.click(screen.getByRole('button', { name: t.retry }));
    expect(await screen.findByText('Топор Тлеющих Углей')).toBeInTheDocument();
  });
});

describe('own equipment in the equipment tables', () => {
  it('draws the axe after the catalog weapons, its source last, and the chip hides both', async () => {
    const { container, router } = page('#/tables/eq_weapon');
    await screen.findByText('Топор Тлеющих Углей');
    const tier2 = document.getElementById('sec-t2') as HTMLElement;
    expect(rowIds(tier2)).toEqual(['w2', AXE]);
    expect(toolbarChip()).toHaveAttribute('aria-pressed', 'true');
    expect(toolbarChip()).toHaveAttribute('title', 'Показывать свои предметы');
    expect(screen.getByRole('link', { name: t.srcHomebrew })).not.toHaveAttribute('title');
    await userEvent.click(screen.getByRole('button', { name: t.filters }));
    expect(values(t.source)).toEqual(['Core', 'Мастерская Ольхи']);
    await expectNoA11yViolations(container);

    await userEvent.click(toolbarChip());
    expect(toolbarChip()).toHaveAttribute('aria-pressed', 'false');
    expect(rowIds(document.getElementById('sec-t2') as HTMLElement)).toEqual(['w2']);
    expect(values(t.source)).toEqual(['Core']);
    await expectNoA11yViolations(container);

    router.navigate('#/search');
    expect(await screen.findByRole('button', { name: t.srcHomebrew })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('drops the own sources from the filter when the chip hides the own items, and keeps the rest', async () => {
    const { router } = page('#/tables/eq_weapon');
    await screen.findByText('Топор Тлеющих Углей');
    await userEvent.click(screen.getByRole('button', { name: t.filters }));
    await userEvent.click(within(field(t.source)).getByRole('button', { name: 'Core' }));
    const coreOnly = router.hash();
    await userEvent.click(
      within(field(t.source)).getByRole('button', { name: 'Мастерская Ольхи' })
    );
    expect(router.hash()).toContain('hb_alderworkshopaaa');
    await userEvent.click(toolbarChip());
    expect(router.hash()).toBe(coreOnly);
    expect(rowIds()).toEqual(['w1', 'w2']);
    expect(within(field(t.source)).getByRole('button', { name: 'Core' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await userEvent.click(toolbarChip());
    expect(router.hash()).toBe(coreOnly);
    await userEvent.click(toolbarChip());
    expect(router.hash()).toBe(coreOnly);
  });

  it('narrows to the axe alone with its source picked', async () => {
    page('#/tables/eq_weapon/f_src-hb_alderworkshopaaa');
    await screen.findByText('Топор Тлеющих Углей');
    expect(rowIds()).toEqual([AXE]);
  });
});

describe('search with own items', () => {
  it('lists own matches after the catalog, says how many own items there are, and the chip hides them', async () => {
    const { container } = page('#/search');
    expect(
      await screen.findByText(t.subSearch + ' ' + 'И 4 ваших предмета.')
    ).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText(t.searchPh), 'топор');
    expect(rowIds()).toEqual(['w2', AXE]);
    expect(toolbarChip()).toHaveAttribute('aria-pressed', 'true');
    await expectNoA11yViolations(container);
    await userEvent.click(toolbarChip());
    expect(rowIds()).toEqual(['w2']);
    expect(screen.getByText(t.subSearch + ' И 4 ваших предмета.')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('draws no chip and no sentence for an account with no item and signed out', async () => {
    page('#/search', { as: 'gm2' });
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.getByText(t.subSearch)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: t.srcHomebrew })).toBeNull();
    cleanup();
    page('#/search', { as: null });
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.getByText(t.subSearch)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: t.srcHomebrew })).toBeNull();
  });

  it('says the own items in English', async () => {
    page('#/search');
    await screen.findByText(t.subSearch + ' И 4 ваших предмета.');
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    const en = dict('en');
    expect(
      await screen.findByText(en.subSearch + ' And 4 items of your own.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: en.srcHomebrew })).toHaveAttribute(
      'title',
      'Show your own items'
    );
  });
});

describe("the author's own relations on catalog rows and cards", () => {
  const relation = (id: string): string | null | undefined =>
    document.querySelector(`[data-row="${id}"] .rcraft`)?.textContent;

  it("keeps a catalog row's own relations while the chip hides the own items", async () => {
    const { container } = page('#/search', { as: 'gm3' });
    await screen.findByText(t.subSearch + ' И 34 ваших предмета.');
    await userEvent.type(screen.getByPlaceholderText(t.searchPh), 'кольцо');
    expect(relation('ci1')).toBe('Улучшается до: Мешок спокойных снов (HB) и ещё 14');
    await userEvent.click(toolbarChip());
    expect(toolbarChip()).toHaveAttribute('aria-pressed', 'false');
    expect(rowIds()).toEqual(['ci1']);
    expect(relation('ci1')).toBe('Улучшается до: Мешок спокойных снов (HB) и ещё 14');
    await expectNoA11yViolations(container);
  });

  it('draws a catalog record at once and with no own relation when the own items fail to load', async () => {
    const cloud = fakeCloud(SEED, 'gm3', { offline: true });
    const { container } = page('#/i/ci1', { cloud });
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Кольцо Тишины' })
    ).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByText(t.craftInto)).toBeNull();
    expect(screen.queryByText(t.hbLoadFailed)).toBeNull();
    await expectNoA11yViolations(container);
  });
});
