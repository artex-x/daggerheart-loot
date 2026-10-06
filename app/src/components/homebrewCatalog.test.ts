/* The homebrew items in the catalog pages over the fake cloud: `#/tables/homebrew` and its
   states, source chips, sections, facets and anchors; own equipment in the equipment tables;
   one merged search with the intro sentence; the «Свои предметы» switch that hides the own
   items for the visit. docs/specs/FEATURES.md, "Tables and search". */
import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import type { Loot } from '../lib/data.js';
import { dict } from '../lib/dict.js';
import { BOOK_NAME_MAX } from '../lib/homebrew.js';
import type { Record_ } from '../lib/types.js';
import { fakeCloud, type FakeCloud } from '../ports/fake-cloud.js';
import { SEED, uuid } from '../ports/fake-cloud-seed.js';
import {
  fakeClipboard,
  fakeData,
  fakeEnv,
  memoryRouter,
  memoryStorage
} from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const t = dict('ru');
const AXE = 'hb_emberaxeaaaaaaaa';
const ALDER = uuid(501);
const GUILD = 'hb_guildaaaaaaaaaaa';
const GUILD_A = 'hb_guildbowsecaaaaa';
const GUILD_B = 'hb_guildshldsecaaaa';

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
      /* Its description names a «топор»: a catalog hit that ranks below an own name */
      row({ id: 'ci2', roll: 2, ru: 'Плащ Теней', en: 'Shadow Cloak', rud: 'Прячет топор.' })
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
  opts: {
    as?: 'gm1' | 'gm2' | 'gm3' | null;
    cloud?: FakeCloud | null;
    clipboard?: ReturnType<typeof fakeClipboard>;
  } = {}
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
    env: fakeEnv({
      cloud,
      router,
      storage: memoryStorage(),
      data: fakeData(LOOT),
      ...(opts.clipboard ? { clipboard: opts.clipboard } : {})
    })
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

const ownSwitch = (): HTMLElement => screen.getByRole('switch', { name: t.ownSwitch });

/* The one picked value's pill beside the filter button. */
const pill = (): HTMLElement => {
  const found = document.querySelector<HTMLElement>('.fpill');
  if (!found) throw new Error('No filter pill. Pick a value first.');
  return found;
};

/* The source chips: the links of the table nav's second row. */
const chips = (): HTMLAnchorElement[] => [
  ...document.querySelectorAll<HTMLAnchorElement>('.tablenav .subchips a')
];
const chipOn = (): string | null | undefined =>
  chips().find((a) => a.getAttribute('aria-current') === 'page')?.textContent;
const chip = (label: string): HTMLAnchorElement => {
  const found = chips().find((a) => a.textContent === label);
  if (!found) throw new Error(`No source chip «${label}».`);
  return found;
};

/* gm1's cloud with one more source of two sections and three items: one in each section
   and one in none. */
async function withGuild(): Promise<FakeCloud> {
  const cloud = fakeCloud(SEED, 'gm1');
  await cloud.homebrew.createBook({
    id: uuid(9100),
    key: GUILD,
    content: {
      ru: 'Гильдия',
      sections: [
        { key: GUILD_A, ru: 'Луки' },
        { key: GUILD_B, ru: 'Щиты' }
      ]
    }
  });
  const item = (n: number, key: string, ru: string, section?: string) =>
    cloud.homebrew.createItem({
      id: uuid(n),
      key,
      book_id: uuid(9100),
      content: { kind: 'item', ru, ...(section ? { section } : {}) }
    });
  await item(9101, 'hb_guildbowaaaaaaaa', 'Гильдейский лук', GUILD_A);
  await item(9102, 'hb_guildshieldaaaaa', 'Гильдейский щит', GUILD_B);
  await item(9103, 'hb_guildcoinaaaaaaa', 'Гильдейская монета');
  return cloud;
}

describe('#/tables/homebrew', () => {
  it('draws one chip per source, «Хоумбрю» last, and the bare address picks the first one', async () => {
    const { container, router } = page('#/tables/homebrew');
    await screen.findByText('Топор Тлеющих Углей');
    expect(chips().map((a) => a.textContent)).toEqual(['Мастерская Ольхи', 'Хоумбрю']);
    expect(chipOn()).toBe('Мастерская Ольхи');
    expect(headings()).toEqual(['Холодное оружие']);
    expect(rowIds()).toEqual([AXE]);
    expect(router.hash()).toBe('#/tables/homebrew');
    expect(screen.getByPlaceholderText(t.searchPh)).toBeInTheDocument();
    expect(screen.queryByRole('switch')).toBeNull();
    expect(chips().every((a) => !a.textContent.match(/\d/))).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: t.viewList }));
    expect(screen.getByText('Мастерская Ольхи (HB)')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('picks «Хоумбрю» with f_src-hb and draws its one heading', async () => {
    const { container, router } = page('#/tables/homebrew/f_src-hb');
    await screen.findAllByRole('link', { name: 'Хоумбрю' });
    await waitFor(() => {
      expect(rowIds()).toHaveLength(3);
    });
    expect(chipOn()).toBe('Хоумбрю');
    expect(headings()).toEqual(['Хоумбрю']);
    expect(router.hash()).toBe('#/tables/homebrew/f_src-hb');
    expect(document.querySelector('.ffilter')).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('draws no chip row and the source headings with one source', async () => {
    page('#/tables/homebrew', { as: 'gm3' });
    await waitFor(() => {
      expect(rowIds().length).toBeGreaterThan(0);
    });
    expect(chips()).toEqual([]);
    expect(headings()).toEqual(['Хоумбрю']);
  });

  it('keeps a one-source address with an unknown src value and draws every row', async () => {
    const { router } = page('#/tables/homebrew/f_src-hb_nosuchsourceaaa', { as: 'gm3' });
    await waitFor(() => {
      expect(rowIds()).toHaveLength(39);
    });
    expect(router.hash()).toBe('#/tables/homebrew/f_src-hb_nosuchsourceaaa');
  });

  it('rewrites two src values to the first held one, and an unknown one to the first chip', async () => {
    const { router } = page('#/tables/homebrew/f_src-hb-hb_alderworkshopaaa');
    await waitFor(() => {
      expect(router.hash()).toBe('#/tables/homebrew/f_src-hb');
    });
    expect(chipOn()).toBe('Хоумбрю');
    cleanup();
    const again = page('#/tables/homebrew/f_src-hb_nosuchsourceaaa');
    await waitFor(() => {
      expect(again.router.hash()).toBe('#/tables/homebrew/f_src-hb_alderworkshopaaa');
    });
    expect(chipOn()).toBe('Мастерская Ольхи');
    expect(rowIds()).toEqual([AXE]);
  });

  it('drops a section of another source from the address', async () => {
    const { router } = page('#/tables/homebrew/f_src-hb.sect-hb_sectbladesaaaaaa');
    await waitFor(() => {
      expect(router.hash()).toBe('#/tables/homebrew/f_src-hb');
    });
    expect(rowIds()).toHaveLength(3);
  });

  it('keeps kind and drops sect in a chip link', async () => {
    page('#/tables/homebrew/f_kind-equip.sect-hb_sectbladesaaaaaa');
    await screen.findByText('Топор Тлеющих Углей');
    expect(chip('Хоумбрю')).toHaveAttribute('href', '#/tables/homebrew/f_kind-equip.src-hb');
    expect(chip('Мастерская Ольхи')).toHaveAttribute(
      'href',
      '#/tables/homebrew/f_kind-equip.src-hb_alderworkshopaaa'
    );
  });

  it('offers kind and the chosen source sections by name, and no source row', async () => {
    const { container, router } = page('#/tables/homebrew');
    await screen.findByText('Топор Тлеющих Углей');
    await userEvent.click(screen.getByRole('button', { name: t.filters }));
    expect(values(t.kindF).length).toBeGreaterThan(1);
    expect(() => field(t.source)).toThrow();
    expect(values(t.hbSection)).toEqual(['Холодное оружие']);
    await expectNoA11yViolations(container);
    await userEvent.click(
      within(field(t.hbSection)).getByRole('button', { name: 'Холодное оружие' })
    );
    expect(router.hash()).toBe(
      '#/tables/homebrew/f_src-hb_alderworkshopaaa.sect-hb_sectbladesaaaaaa'
    );
    expect(rowIds()).toEqual([AXE]);
  });

  it('keeps the chip of an anchor on a kind pick', async () => {
    scrolls();
    const { router } = page('#/tables/homebrew/hb');
    await waitFor(() => {
      expect(chipOn()).toBe('Хоумбрю');
    });
    await userEvent.click(screen.getByRole('button', { name: t.filters }));
    const [first] = within(field(t.kindF)).getAllByRole('button');
    if (!first) throw new Error('The kind row has no value.');
    await userEvent.click(first);
    expect(router.hash()).toMatch(/^#\/tables\/homebrew\/f_kind-[a-z]+\.src-hb$/);
    expect(chipOn()).toBe('Хоумбрю');
  });

  it('keeps the chip of a section address on a pill drop and on «Сбросить все»', async () => {
    const { router } = page('#/tables/homebrew/f_sect-hb_sectbladesaaaaaa');
    await screen.findByText('Топор Тлеющих Углей');
    expect(chipOn()).toBe('Мастерская Ольхи');
    await userEvent.click(pill());
    expect(router.hash()).toBe('#/tables/homebrew/f_src-hb_alderworkshopaaa');
    router.navigate('#/tables/homebrew/f_sect-hb_sectbladesaaaaaa');
    await userEvent.click(await screen.findByRole('button', { name: t.resetAll }));
    expect(router.hash()).toBe('#/tables/homebrew/f_src-hb_alderworkshopaaa');
    expect(chipOn()).toBe('Мастерская Ольхи');
  });

  it('keeps a folded panel folded on a chip press and on a pill drop', async () => {
    const { router } = page('#/tables/homebrew/f_sect-hb_sectbladesaaaaaa');
    await screen.findByText('Топор Тлеющих Углей');
    expect(document.querySelector('.ffilter')).not.toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /^Фильтры/ }));
    expect(document.querySelector('.ffilter')).toBeNull();
    await userEvent.click(pill());
    expect(document.querySelector('.ffilter')).toBeNull();
    router.navigate(chip('Хоумбрю').getAttribute('href') ?? '');
    await waitFor(() => {
      expect(chipOn()).toBe('Хоумбрю');
    });
    expect(document.querySelector('.ffilter')).toBeNull();
  });

  it('keeps two ticked rows across a chip press and back', async () => {
    const { router } = page('#/tables/homebrew/f_src-hb');
    await waitFor(() => {
      expect(rowIds()).toHaveLength(3);
    });
    const boxes = (): HTMLInputElement[] => [
      ...document.querySelectorAll<HTMLInputElement>('[data-row] input[type="checkbox"]')
    ];
    await userEvent.click(boxes()[0] as HTMLElement);
    await userEvent.click(boxes()[1] as HTMLElement);
    router.navigate(chip('Мастерская Ольхи').getAttribute('href') ?? '');
    await waitFor(() => {
      expect(rowIds()).toEqual([AXE]);
    });
    router.navigate(chip('Хоумбрю').getAttribute('href') ?? '');
    await waitFor(() => {
      expect(rowIds()).toHaveLength(3);
    });
    expect(boxes().filter((b) => b.checked)).toHaveLength(2);
    router.navigate('#/tables/core_item');
    router.navigate('#/tables/homebrew/f_src-hb');
    await waitFor(() => {
      expect(rowIds()).toHaveLength(3);
    });
    expect(boxes().filter((b) => b.checked)).toHaveLength(0);
  });

  it('copies the chosen chip as the table link, and the bare address with one source', async () => {
    const clip = fakeClipboard();
    page('#/tables/homebrew/f_src-hb', { clipboard: clip });
    await waitFor(() => {
      expect(rowIds()).toHaveLength(3);
    });
    await userEvent.click(screen.getByRole('button', { name: t.tableLink }));
    expect(clip.last.text).toMatch(/#\/tables\/homebrew\/f_src-hb$/);
    cleanup();
    const one = fakeClipboard();
    page('#/tables/homebrew', { as: 'gm3', clipboard: one });
    await waitFor(() => {
      expect(rowIds().length).toBeGreaterThan(0);
    });
    await userEvent.click(screen.getByRole('button', { name: t.tableLink }));
    expect(one.last.text).toMatch(/#\/tables\/homebrew$/);
  });

  it('heads a chip by its sections, then «Без раздела», and narrows to one section', async () => {
    const cloud = await withGuild();
    const { router } = page('#/tables/homebrew/f_src-' + GUILD, { cloud });
    await screen.findAllByText('Гильдейский лук');
    expect(chips().map((a) => a.textContent)).toEqual([
      'Мастерская Ольхи',
      'Гильдия',
      'Хоумбрю'
    ]);
    expect(headings()).toEqual(['Луки', 'Щиты', t.hbNoSection]);
    await userEvent.click(screen.getByRole('button', { name: t.filters }));
    expect(values(t.hbSection)).toEqual(['Луки', 'Щиты']);
    router.navigate('#/tables/homebrew/f_sect-' + GUILD_A);
    await waitFor(() => {
      expect(rowIds()).toEqual(['hb_guildbowaaaaaaaa']);
    });
    expect(chipOn()).toBe('Гильдия');
  });

  it('scrolls a source key to the source items outside its sections, under its chip', async () => {
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
    expect(chipOn()).toBe('Мастерская Ольхи');
    expect(headings()).toEqual(['Холодное оружие', t.hbNoSection]);
    await waitFor(() => {
      expect(on.map((el) => el.id)).toContain('sec-hb_alderworkshopaaa');
    });
    expect(document.getElementById('sec-hb_alderworkshopaaa')).toHaveClass('flash');
  });

  it('picks the chip of a source key whose items all sit in sections, and scrolls to nothing', async () => {
    const on = scrolls();
    const { router } = page('#/tables/homebrew/hb_alderworkshopaaa');
    await screen.findByText('Топор Тлеющих Углей');
    await new Promise((r) => setTimeout(r, 0));
    expect(on).toEqual([]);
    expect(chipOn()).toBe('Мастерская Ольхи');
    expect(rowIds()).toEqual([AXE]);
    expect(router.hash()).toBe('#/tables/homebrew/hb_alderworkshopaaa');
  });

  it('scrolls a row anchor that arrives with the page once the own items load', async () => {
    const on = scrolls();
    page('#/tables/homebrew/' + AXE);
    expect(screen.getByText(t.cloudLoading)).toBeInTheDocument();
    await waitFor(() => {
      expect(on.map((el) => el.getAttribute('data-row'))).toContain(AXE);
    });
    expect(chipOn()).toBe('Мастерская Ольхи');
  });

  it('picks the chip of an item anchor in «Хоумбрю»', async () => {
    const read = await fakeCloud(SEED, 'gm1').homebrew.load();
    const potion = read.ok ? read.items.find((i) => i.book_id === null) : undefined;
    if (!potion) throw new Error('The seed has no item in «Хоумбрю». Restore the seed.');
    const on = scrolls();
    page('#/tables/homebrew/' + potion.key);
    await waitFor(() => {
      expect(on.map((el) => el.getAttribute('data-row'))).toContain(potion.key);
    });
    expect(chipOn()).toBe('Хоумбрю');
  });

  it('scrolls a section key and the default source key to their sections', async () => {
    const on = scrolls();
    page('#/tables/homebrew/hb_sectbladesaaaaaa');
    await screen.findByText('Топор Тлеющих Углей');
    await waitFor(() => {
      expect(on.map((el) => el.id)).toContain('sec-hb_sectbladesaaaaaa');
    });
    expect(chipOn()).toBe('Мастерская Ольхи');
    cleanup();
    const again = scrolls();
    page('#/tables/homebrew/hb');
    await waitFor(() => {
      expect(again.map((el) => el.id)).toContain('sec-hb');
    });
    expect(chipOn()).toBe('Хоумбрю');
  });

  it('draws 21 chips for 20 named sources, and a long name in full', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const long = 'Д'.repeat(BOOK_NAME_MAX);
    for (let n = 0; n < 19; n++) {
      const key = 'hb_many' + 'abcdefghijklmnopqrstuvwxyz'.charAt(n) + 'aaaaaaaaaaa';
      await cloud.homebrew.createBook({
        id: uuid(9200 + n),
        key,
        content: { ru: n === 0 ? long : 'Источник ' + String(n) }
      });
      await cloud.homebrew.createItem({
        id: uuid(9300 + n),
        key: 'hb_item' + 'abcdefghijklmnopqrstuvwxyz'.charAt(n) + 'aaaaaaaaaaa',
        book_id: uuid(9200 + n),
        content: { kind: 'item', ru: 'Вещь ' + String(n) }
      });
    }
    const { container } = page('#/tables/homebrew', { cloud });
    await screen.findByText('Топор Тлеющих Углей');
    expect(chips()).toHaveLength(21);
    expect(chips().at(-1)?.textContent).toBe('Хоумбрю');
    expect(chip(long)).toBeInTheDocument();
    await expectNoA11yViolations(container);
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
  it('draws the axe after the catalog weapons, its source last, and the switch hides both', async () => {
    const { container, router } = page('#/tables/eq_weapon');
    await screen.findByText('Топор Тлеющих Углей');
    const tier2 = document.getElementById('sec-t2') as HTMLElement;
    expect(rowIds(tier2)).toEqual(['w2', AXE]);
    expect(ownSwitch()).toBeChecked();
    expect(ownSwitch()).not.toHaveAttribute('title');
    expect(screen.queryByRole('button', { name: t.srcHomebrew })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: t.filters }));
    expect(values(t.source)).toEqual(['Core', 'Мастерская Ольхи']);
    await expectNoA11yViolations(container);

    await userEvent.click(ownSwitch());
    expect(ownSwitch()).not.toBeChecked();
    expect(rowIds(document.getElementById('sec-t2') as HTMLElement)).toEqual(['w2']);
    expect(values(t.source)).toEqual(['Core']);
    await expectNoA11yViolations(container);

    router.navigate('#/search');
    expect(await screen.findByRole('switch', { name: t.ownSwitch })).not.toBeChecked();
  });

  it('drops the own sources from the filter when the switch hides the own items, and keeps the rest', async () => {
    const { router } = page('#/tables/eq_weapon');
    await screen.findByText('Топор Тлеющих Углей');
    await userEvent.click(screen.getByRole('button', { name: t.filters }));
    await userEvent.click(within(field(t.source)).getByRole('button', { name: 'Core' }));
    const coreOnly = router.hash();
    await userEvent.click(
      within(field(t.source)).getByRole('button', { name: 'Мастерская Ольхи' })
    );
    expect(router.hash()).toContain('hb_alderworkshopaaa');
    await userEvent.click(ownSwitch());
    expect(router.hash()).toBe(coreOnly);
    expect(rowIds()).toEqual(['w1', 'w2']);
    expect(within(field(t.source)).getByRole('button', { name: 'Core' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await userEvent.click(ownSwitch());
    expect(router.hash()).toBe(coreOnly);
    await userEvent.click(ownSwitch());
    expect(router.hash()).toBe(coreOnly);
  });

  it('narrows to the axe alone with its source picked', async () => {
    page('#/tables/eq_weapon/f_src-hb_alderworkshopaaa');
    await screen.findByText('Топор Тлеющих Углей');
    expect(rowIds()).toEqual([AXE]);
  });
});

describe('search with own items', () => {
  it('ranks own matches with the catalog, says how many own items there are, and the switch hides them', async () => {
    const { container } = page('#/search');
    expect(
      await screen.findByText(t.subSearch + ' ' + 'И 4 ваших предмета.')
    ).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText(t.searchPh), 'топор');
    /* Two names at a word start tie, the catalog first; the axe's name ranks above
       the catalog's description hit */
    expect(rowIds()).toEqual(['w2', AXE, 'ci2']);
    expect(ownSwitch()).toBeChecked();
    await expectNoA11yViolations(container);
    await userEvent.click(ownSwitch());
    expect(rowIds()).toEqual(['w2', 'ci2']);
    expect(screen.getByText(t.subSearch + ' И 4 ваших предмета.')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('draws no switch and no sentence for an account with no item and signed out', async () => {
    page('#/search', { as: 'gm2' });
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.getByText(t.subSearch)).toBeInTheDocument();
    expect(screen.queryByRole('switch')).toBeNull();
    cleanup();
    page('#/search', { as: null });
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.getByText(t.subSearch)).toBeInTheDocument();
    expect(screen.queryByRole('switch')).toBeNull();
  });

  it('holds the three kinds in the kind row, the switch under it, and refuses the last kind either way', async () => {
    const { container } = page('#/search');
    await screen.findByText(t.subSearch + ' И 4 ваших предмета.');
    const kinds = document.querySelector('.panel .chips') as HTMLElement;
    expect(
      within(kinds)
        .getAllByRole('button')
        .map((b) => b.textContent)
    ).toEqual([t.fItems, t.fCons, t.fEquip]);
    expect(kinds.contains(ownSwitch())).toBe(false);
    for (const on of [true, false]) {
      if (!on) await userEvent.click(ownSwitch());
      expect((ownSwitch() as HTMLInputElement).checked).toBe(on);
      await userEvent.click(within(kinds).getByRole('button', { name: t.fItems }));
      await userEvent.click(within(kinds).getByRole('button', { name: t.fCons }));
      expect(within(kinds).getByRole('button', { name: t.fEquip })).toHaveAttribute(
        'title',
        t.keepOneKind
      );
      await userEvent.click(within(kinds).getByRole('button', { name: t.fEquip }));
      expect(within(kinds).getByRole('button', { name: t.fEquip })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      await userEvent.click(within(kinds).getByRole('button', { name: t.fItems }));
      await userEvent.click(within(kinds).getByRole('button', { name: t.fCons }));
    }
    await expectNoA11yViolations(container);
  });

  it('says the own items in English', async () => {
    page('#/search');
    await screen.findByText(t.subSearch + ' И 4 ваших предмета.');
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    const en = dict('en');
    expect(
      await screen.findByText(en.subSearch + ' And 4 items of your own.')
    ).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Own items' })).toBeChecked();
  });
});

describe("the author's own relations on catalog rows and cards", () => {
  const relation = (id: string): string | null | undefined =>
    document.querySelector(`[data-row="${id}"] .rcraft`)?.textContent;

  it("keeps a catalog row's own relations while the switch hides the own items", async () => {
    const { container } = page('#/search', { as: 'gm3' });
    await screen.findByText(t.subSearch + ' И 39 ваших предметов.');
    await userEvent.type(screen.getByPlaceholderText(t.searchPh), 'кольцо');
    expect(relation('ci1')).toBe('Улучшается до: Мешок спокойных снов (HB) и ещё 14');
    await userEvent.click(ownSwitch());
    expect(ownSwitch()).not.toBeChecked();
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
