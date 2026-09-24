/* The record page, driven through fake ports.
 *
 * A small catalogue rather than the real one: five records shaped to cover what
 * the card branches on - a plain item, a consumable, equipment with a stat line,
 * both ends of an upgrade chain, a referenced rulebook card, and a record with
 * no picture. The format the copy buttons produce is held to the live app in
 * lib/share.test.ts; what is checked here is that the buttons reach it, that a
 * refusal is reported rather than swallowed, and that the markup is one a
 * screen reader can follow. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import {
  fakeClipboard,
  fakeData,
  fakeEnv,
  fakeImage,
  fakeShare,
  memoryRouter,
  memoryStorage,
  noData
} from '../ports/index.js';
import type { Env } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import type { Loot } from '../lib/data.js';

afterEach(cleanup);

/* jsdom does not implement scrollIntoView - the add-to-list menu's placement
   effect calls it unconditionally once open, which the tier-ladder modal's own
   AddToList control reaches too. */
Element.prototype.scrollIntoView = vi.fn();

const LOOT: Loot = {
  items: {
    core_item: [
      {
        id: 'ci1',
        src: 'core',
        kind: 'item',
        roll: 1,
        en: 'Premium Bedroll',
        ende: 'Clear a Stress.',
        ru: 'Спальный мешок',
        rud: 'Очистите Стресс.',
        img: 'ci1.webp',
        craft: 'cc1'
      },
      {
        id: 'odd',
        src: 'somethingnew',
        kind: 'item',
        en: 'Orphan',
        ende: 'From nowhere.',
        ru: 'Сирота',
        rud: 'Ниоткуда.'
      },
      {
        id: 'ci2',
        src: 'core',
        kind: 'item',
        roll: 2,
        en: 'Chalk',
        ende: 'Draws on stone.',
        ru: 'Мел',
        rud: 'Пишет по камню.',
        refs: ['vicious-entangle']
      }
    ],
    core_consumable: [
      {
        id: 'cc1',
        src: 'core',
        kind: 'consumable',
        roll: 1,
        en: 'Stamina Potion',
        ende: 'Clear 1d4 Stress.',
        ru: 'Зелье выносливости',
        rud: 'Очистите 1d4 Стресса.'
      }
    ],
    /* One community record: the one table sectioned by a value the record
       itself carries besides `other_frames`, so its path completes with the
       community and its badge names the community alone. */
    community: [
      {
        id: 'cm1',
        src: 'community',
        kind: 'item',
        community: 'Highborne',
        community_ru: 'Великородное',
        en: 'Signet',
        ende: 'A mark of blood.',
        ru: 'Перстень',
        rud: 'Знак крови.'
      }
    ],
    /* A campaign-frame equipment record, shaped like the real f33 - D11,
       paid off: it used to hide its tier and show a full path instead of a
       tag, the same special-casing an otherwise identical `eq` record never
       got. */
    frames: [
      {
        id: 'f1',
        src: 'frame',
        frame: 'beast_feast',
        kind: 'equip',
        en: 'Quilted Clothing',
        ende: 'Flexible: +1 to Evasion',
        ru: 'Стеганая Одежда',
        rud: 'Гибкое: +1 к Уклонению',
        eq: { t: 'armor', tier: 1, as: 3, th: [5, 11], line: '' }
      },
      /* f2/f3: a two-rung upgrade line on frame records, both sharing
         `eq.line`. Dropping RecordCard's `!isFrameRecord(it)` guard turned the
         tier ladder on for every frame record that has one (56 of them in the
         real data) - f1 stands alone (`eq.line: ''`) and cannot prove that;
         these two can. */
      {
        id: 'f2',
        src: 'frame',
        frame: 'beast_feast',
        kind: 'equip',
        en: 'Sharpened Cooking Knife',
        ende: 'Reliable: +1 to attack rolls',
        ru: 'Наточенный Кухонный Нож',
        rud: 'Надёжное: +1 к Броскам Атаки',
        eq: {
          t: 'weapon',
          tier: 1,
          cls: 'phy',
          tr: 'finesse',
          rg: 'melee',
          dmg: 'd8+1',
          bu: 1,
          line: 'cookknife'
        }
      },
      {
        id: 'f3',
        src: 'frame',
        frame: 'beast_feast',
        kind: 'equip',
        en: 'Masterwork Cooking Knife',
        ende: 'Reliable: +2 to attack rolls',
        ru: 'Кухонный Нож Мастера',
        rud: 'Надёжное: +2 к Броскам Атаки',
        eq: {
          t: 'weapon',
          tier: 2,
          cls: 'phy',
          tr: 'finesse',
          rg: 'melee',
          dmg: 'd8+3',
          bu: 1,
          line: 'cookknife'
        }
      }
    ],
    /* Vault of Ages carries the tier word `app.js:3237` prints but the
       Svelte rewrite dropped - an artifact and a cursed object, the two
       shapes the word takes. */
    voa: [
      /* An artifact with a stat block: `eq.tier` is the book's section, 'A'. */
      {
        id: 'voa_a3',
        src: 'voa',
        kind: 'equip',
        tier: 'A',
        en: 'Oath Blade',
        ende: 'Keeps its word.',
        ru: 'Клинок Клятвы',
        rud: 'Держит слово.',
        eq: {
          t: 'weapon',
          tier: 'A',
          cls: 'phy',
          tr: 'strength',
          rg: 'melee',
          dmg: 'd10+6',
          bu: 2
        }
      },
      {
        id: 'voa_a1',
        src: 'voa',
        kind: 'item',
        tier: 'A',
        en: 'Sunstone',
        ende: 'Warm to the touch.',
        ru: 'Солнечный камень',
        rud: 'Тёплый на ощупь.'
      },
      {
        id: 'voa_c1',
        src: 'voa',
        kind: 'item',
        tier: 'C',
        en: 'Blighted Coin',
        ende: 'Whispers at night.',
        ru: 'Проклятая монета',
        rud: 'Шепчет по ночам.'
      }
    ]
  },
  eq: [
    {
      id: 'q1',
      src: 'core',
      kind: 'equip',
      en: 'Broadsword',
      ende: 'Reliable: +1 to attack rolls',
      ru: 'Палаш',
      rud: 'Надёжное: +1 к Броскам Атаки',
      eq: {
        t: 'weapon',
        tier: 1,
        cls: 'phy',
        tr: 'agility',
        rg: 'melee',
        dmg: 'd8+3',
        bu: 1,
        line: 'broadsword'
      }
    },
    /* The rest of one upgrade line, which is what the tier ladder is made of.
       Out of tier order on purpose: the ladder sorts them. */
    {
      id: 'q3',
      src: 'core',
      kind: 'equip',
      en: 'Advanced Broadsword',
      ende: 'Reliable: +3 to attack rolls',
      ru: 'Продвинутый Палаш',
      rud: 'Надёжное: +3 к Броскам Атаки',
      eq: {
        t: 'weapon',
        tier: 3,
        cls: 'phy',
        tr: 'agility',
        rg: 'melee',
        dmg: 'd8+9',
        bu: 1,
        line: 'broadsword'
      }
    },
    {
      id: 'q2',
      src: 'core',
      kind: 'equip',
      en: 'Improved Broadsword',
      ende: 'Reliable: +2 to attack rolls',
      ru: 'Улучшенный Палаш',
      rud: 'Надёжное: +2 к Броскам Атаки',
      eq: {
        t: 'weapon',
        tier: 2,
        cls: 'phy',
        tr: 'agility',
        rg: 'melee',
        dmg: 'd8+6',
        bu: 1,
        line: 'broadsword'
      }
    },
    /* A two-member set, off the real Ember/Spark pair (`docs/DECISIONS.md`,
       "Set membership"): two records that name the same `set` key, with no
       craft link between them at all - the set line is its own mechanism. */
    {
      id: 's1',
      src: 'core',
      kind: 'equip',
      en: 'First Blade',
      ende: 'Half of a pair.',
      ru: 'Первый клинок',
      rud: 'Половина пары.',
      set: 'twin-blades',
      eq: { t: 'weapon', tier: 1, cls: 'phy', tr: 'agility', rg: 'melee', dmg: 'd6', bu: 1 }
    },
    {
      id: 's2',
      src: 'core',
      kind: 'equip',
      en: 'Second Blade',
      ende: 'The other half.',
      ru: 'Второй клинок',
      rud: 'Другая половина.',
      set: 'twin-blades',
      eq: { t: 'weapon', tier: 1, cls: 'phy', tr: 'agility', rg: 'melee', dmg: 'd6', bu: 1 }
    }
  ],
  refs: {
    /* Two lines, so the port's `\n` -> real text nodes (not {@html}) has
       something to split. */
    'vicious-entangle': {
      en: 'Vicious Entangle',
      ensub: 'Sage · Level 1 · Spell',
      ende: 'Roots reach out.\nThey grab at ankles.',
      ru: 'Неистовое опутывание',
      rusub: 'Мудрость · Уровень 1 · Заклинание',
      rud: 'Корни вырываются из-под земли.\nОни хватают за лодыжки.',
      url: 'https://ru.daggerheart.su/domain/vicious-entangle'
    }
  },
  sets: {
    'twin-blades': {
      en: 'Twin Edge',
      ru: 'Двойное лезвие',
      ende: 'Both blades strike as one.',
      rud: 'Оба клинка бьют как один.'
    }
  }
};

const at = (id: string, over: Partial<Env> = {}): Env =>
  fakeEnv({ router: memoryRouter(`#/i/${id}`), data: fakeData(LOOT), ...over });

describe('a record on its own page', () => {
  it('leads with the name', () => {
    render(App, { env: at('ci1') });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Спальный мешок' })
    ).toBeInTheDocument();
  });

  it('follows the language switch', async () => {
    render(App, { env: at('ci1') });
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(
      screen.getByRole('heading', { level: 1, name: 'Premium Bedroll' })
    ).toBeInTheDocument();
  });

  it('puts the stats under the name as chips, one value each', () => {
    /* Chips rather than a sentence, as the live app draws them, and without
       the type word - the badge row above already says what kind it is. */
    render(App, { env: at('q1') });
    for (const chip of ['Ранг 1', 'Физическое', 'Проворность', 'Вплотную', 'd8+3']) {
      expect(screen.getByText(chip), chip).toBeInTheDocument();
    }
    /* The type word is a badge above the name, not a chip in the stat row -
       the row is values, and saying "primary weapon" twice on one card is one
       time too many. */
    expect(screen.getByText('Основное оружие')).toHaveClass('badge');
  });

  it('gives loot no stat chips at all', () => {
    render(App, { env: at('ci1') });
    expect(screen.queryByText(/Ранг/)).not.toBeInTheDocument();
  });

  it('says whether it is an item or a consumable', () => {
    render(App, { env: at('cc1') });
    expect(screen.getByText('Расходник')).toBeInTheDocument();
  });

  it('links both ways along an upgrade chain', () => {
    render(App, { env: at('ci1') });
    expect(screen.getByRole('link', { name: 'Зелье выносливости' })).toHaveAttribute(
      'href',
      '#/i/cc1'
    );

    cleanup();
    render(App, { env: at('cc1') });
    /* The reverse direction is derived, not stored - see buildIndex. */
    expect(screen.getByRole('link', { name: 'Спальный мешок' })).toHaveAttribute(
      'href',
      '#/i/ci1'
    );
  });

  it('brings the text of a referenced card, collapsed, as real text nodes split on the line break', () => {
    /* Ported from app.js's refHTML/lines(): a \n becomes a <br> between two
       text nodes, not one joined run injected via {@html}. Svelte 5 leaves an
       empty comment anchor beside each {#if}/{#each} item, so the real
       assertion filters those out rather than reading raw innerHTML/childNodes. */
    render(App, { env: at('ci2') });
    const card = screen.getByText('Неистовое опутывание');
    expect(card).toBeInTheDocument();
    expect(card.closest('details')?.open).toBe(false);

    const p = card.closest('details')?.querySelector('p');
    expect(p?.textContent).toBe('Корни вырываются из-под земли.Они хватают за лодыжки.');
    const real = Array.from(p?.childNodes ?? []).filter(
      (n) =>
        n.nodeType === Node.ELEMENT_NODE || (n.nodeType === Node.TEXT_NODE && n.textContent)
    );
    expect(real.map((n) => n.nodeName)).toEqual(['#text', 'BR', '#text']);
    expect(real.map((n) => n.textContent)).toEqual([
      'Корни вырываются из-под земли.',
      '',
      'Они хватают за лодыжки.'
    ]);
  });

  it('links a referenced card out to daggerheart.su, subdomain matching the language on screen', async () => {
    render(App, { env: at('ci2') });
    const link = screen.getByRole('link', { name: 'daggerheart.su' });
    expect(link).toHaveAttribute('href', 'https://ru.daggerheart.su/domain/vicious-entangle');
    /* A third-party site: opened in its own tab, and without handing it
       window.opener (app.js's own refHTML markup). Invisible to a pixel diff
       or an accessibility snapshot either way - a golden never reads these
       two attributes - so this is the only place either is pinned. */
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener');
    /* <i class="ref-s">, not <span> - .ref-s sets font-style: normal, so the
       tag itself is invisible to every pixel instrument and, after R0c
       (23c00a6), has no record outside this file and the source. */
    expect(screen.getByText('Мудрость · Уровень 1 · Заклинание').tagName).toBe('I');

    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByRole('link', { name: 'daggerheart.su' })).toHaveAttribute(
      'href',
      'https://en.daggerheart.su/domain/vicious-entangle'
    );
  });

  it('gives a referenced card in the language on screen', async () => {
    render(App, { env: at('ci2') });
    expect(screen.getByText('Мудрость · Уровень 1 · Заклинание')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByText('Sage · Level 1 · Spell')).toBeInTheDocument();
    const p = screen.getByText('Sage · Level 1 · Spell').closest('details')?.querySelector('p');
    expect(p?.textContent).toBe('Roots reach out.They grab at ankles.');
  });

  it('offers no way into a table for a record that is in none', () => {
    /* A source the app does not know has no table to point at, and a link to
       nowhere is worse than no link. */
    render(App, { env: at('odd') });
    expect(screen.queryByRole('link', { name: /показать в таблице/ })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Сирота' })).toBeInTheDocument();
  });

  it('links into the table a record is printed in', () => {
    render(App, { env: at('ci1') });
    expect(screen.getByRole('link', { name: /показать в таблице/ })).toHaveAttribute(
      'href',
      '#/tables/core_item/ci1'
    );
  });

  it('shows the placeholder for a record with no art', () => {
    render(App, { env: at('ci2') });
    expect(screen.getByRole('presentation')).toHaveAttribute('src', 'img/_none.webp');
  });

  it('falls back to the placeholder when the file fails to load', async () => {
    /* A picture can go missing between a deploy and a cache. The layout must
       not shift, so the failure lands on the same placeholder. */
    const { container } = render(App, { env: at('ci1') });
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', 'img/ci1.webp');

    img?.dispatchEvent(new Event('error'));
    await Promise.resolve();
    expect(container.querySelector('img')).toHaveAttribute('src', 'img/_none.webp');
  });

  it('offers no copy-image button for a record with no art at all', () => {
    /* Ported from tests/noart.js:39. `odd` carries no `img` field at all -
       distinct from ci1's real-load-failure case below, which is a
       different record shape. */
    render(App, { env: at('odd') });
    expect(
      screen.queryByRole('button', { name: 'Скопировать изображение' })
    ).not.toBeInTheDocument();
  });

  it('drops the copy-image button once the picture fails to load, restoring the live gate', async () => {
    /* RecordActions.svelte used to gate the copy-image button on `it.img`
       alone; the live app gates on hasImage(it) = !!it.img &&
       !brokenArt[it.id]. `ci1` carries an `img` field, so the button starts
       present and only the load failure should take it away. */
    const { container } = render(App, { env: at('ci1') });
    expect(screen.getByRole('button', { name: 'Скопировать изображение' })).toBeInTheDocument();

    container.querySelector('img')?.dispatchEvent(new Event('error'));
    await Promise.resolve();
    expect(
      screen.queryByRole('button', { name: 'Скопировать изображение' })
    ).not.toBeInTheDocument();
  });

  it('remembers a broken image across a navigation away and back', async () => {
    /* Ported from tests/noart.js:80-85. app.artBroken lives on the shared
       AppState, not on RecordCard's own props, so it must outlive the
       record page it was set on. */
    const env = at('ci1');
    const { container } = render(App, { env });
    container.querySelector('img')?.dispatchEvent(new Event('error'));
    await Promise.resolve();
    expect(container.querySelector('img')).toHaveAttribute('src', 'img/_none.webp');

    env.router.navigate('#/i/cc1');
    await tick();
    env.router.navigate('#/i/ci1');
    await tick();
    expect(container.querySelector('img')).toHaveAttribute('src', 'img/_none.webp');
  });
});

describe('the path at the top of the page, and the tag on the badge', () => {
  it('completes the path with the community, the leaf the table is sectioned by', () => {
    const { container } = render(App, { env: at('cm1') });
    const sub = container.querySelector('p.page-sub');
    // childNodes[0] is positional on purpose: it isolates the path's own
    // text node from the badges that follow it in the same element.
    expect(sub?.childNodes[0]?.textContent?.trim()).toBe('Сообщества · Великородное');
  });

  it('names the community alone on the badge, with no path in it', () => {
    render(App, { env: at('cm1') });
    expect(screen.getByText('Великородное').closest('.badge')).toHaveClass('src');
  });

  it('carries the artifact word in the path line, not only on a badge', () => {
    const { container } = render(App, { env: at('voa_a1') });
    const sub = container.querySelector('p.page-sub');
    // childNodes[0] is positional on purpose: it isolates the path's own
    // text node from the badges that follow it in the same element.
    expect(sub?.childNodes[0]?.textContent?.trim()).toBe('Vault of Ages · Артефакт');
  });

  it('carries the cursed-object word in the path line', () => {
    const { container } = render(App, { env: at('voa_c1') });
    const sub = container.querySelector('p.page-sub');
    // childNodes[0] is positional on purpose: it isolates the path's own
    // text node from the badges that follow it in the same element.
    expect(sub?.childNodes[0]?.textContent?.trim()).toBe('Vault of Ages · Проклятый предмет');
  });

  it('names an artifact weapon an artifact on the badge, the path and the stat row', async () => {
    const { container } = render(App, { env: at('voa_a3') });
    const sub = container.querySelector('p.page-sub');
    expect(sub?.childNodes[0]?.textContent?.trim()).toBe('Vault of Ages · Артефакт');
    const stats = [...container.querySelectorAll('.eqstats span')].map((el) => el.textContent);
    expect(stats[0]).toBe('Артефакт');
    expect(stats).toContain('d10+6');
    expect(container.textContent).not.toContain('Ранг');
    expect(container.querySelector('.badge.tier')).toHaveTextContent('Артефакт');
    await expectNoA11yViolations(container);
  });

  it('prints the tier for campaign-frame equipment, and the frame as a tag (D11, paid off)', () => {
    const { container } = render(App, { env: at('f1') });
    const sub = container.querySelector('p.page-sub');
    expect(sub?.childNodes[0]?.textContent?.trim()).toBe(
      'Прочее · Сеттинги · Пир зверей · Ранг 1'
    );
  });

  it('has no axe violations on a community record or a Vault of Ages artifact', async () => {
    const { container, unmount } = render(App, { env: at('cm1') });
    await expectNoA11yViolations(container);
    unmount();

    const voa = render(App, { env: at('voa_a1') });
    await expectNoA11yViolations(voa.container);
  });
});

describe('a link that no longer resolves', () => {
  it('draws the not-found page for an id the data does not know', async () => {
    const { container } = render(App, { env: at('nope') });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Предмет не найден' })
    ).toBeInTheDocument();
    expect(container.querySelector('p.page-sub')?.textContent).toBe(
      'Возможно, ссылка устарела или данные были изменены.'
    );
    expect(container.querySelector('.miss')).toBeNull();
    const link = screen.getByRole('link', { name: 'На главную' });
    expect(link).toHaveAttribute('href', '#/roll/std');
    expect(link.className).toContain('btn');
    expect(link.className).toContain('primary');
    await expectNoA11yViolations(container);
  });

  it('says so when the dataset itself did not load', () => {
    /* data.js served as HTML by a broken deploy, or missing from a folder. */
    render(App, { env: fakeEnv({ router: memoryRouter('#/i/ci1'), data: noData() }) });
    expect(screen.getByText('Данные не загрузились. Обновите страницу.')).toBeInTheDocument();
  });
});

describe('taking a record somewhere else', () => {
  const withClip = (): { env: Env; clip: ReturnType<typeof fakeClipboard> } => {
    const clip = fakeClipboard();
    return { env: at('cc1', { clipboard: clip }), clip };
  };

  it('copies the name with the consumable spelled out', async () => {
    const { env, clip } = withClip();
    render(App, { env });
    await userEvent.click(screen.getByRole('button', { name: 'Скопировать название' }));
    expect(clip.last.text).toBe('Зелье выносливости (расходник)');
  });

  it('copies the text in both flavours', async () => {
    const { env, clip } = withClip();
    render(App, { env });
    await userEvent.click(screen.getByRole('button', { name: 'Скопировать текст' }));
    expect(clip.last.rich?.plain).toContain('Очистите 1d4 Стресса.');
    expect(clip.last.rich?.html).toContain('<b>Зелье выносливости (расходник)</b>');
  });

  it('copies a link to the stub page, not to the app', async () => {
    /* memoryRouter reports itself hosted, which is the case the stub exists in. */
    const { env, clip } = withClip();
    render(App, { env });
    await userEvent.click(screen.getByRole('button', { name: 'Скопировать ссылку' }));
    expect(clip.last.text).toBe('https://example.test/i/cc1.html');
  });

  it('copies the English stub in English', async () => {
    const clip = fakeClipboard();
    const env = at('cc1', {
      clipboard: clip,
      storage: memoryStorage({ 'dhloot.lang.v1': 'en' })
    });
    const { container } = render(App, { env });
    await userEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(clip.last.text).toBe('https://example.test/i/en/cc1.html');
    await expectNoA11yViolations(container);
  });

  it('says what happened, in a region a screen reader is told about', async () => {
    const { env } = withClip();
    render(App, { env });
    await userEvent.click(screen.getByRole('button', { name: 'Скопировать название' }));
    expect(screen.getByText('Название скопировано')).toBeInTheDocument();
  });

  it('reports a refusal instead of pretending it worked', async () => {
    /* Copying is refused outside a secure context, and a button that lies about
       it leaves somebody pasting nothing into a chat. */
    render(App, { env: at('cc1', { clipboard: fakeClipboard({ fail: true }) }) });
    await userEvent.click(screen.getByRole('button', { name: 'Скопировать название' }));
    expect(screen.getByText('Не удалось скопировать')).toBeInTheDocument();
  });

  it('offers the share sheet whether or not the browser has one', async () => {
    /* As the live app did. Where there is no share sheet the link goes to the
       clipboard, which is what the person was reaching for; hiding the
       control would just lose the action. */
    const clip = fakeClipboard();
    render(App, {
      env: at('cc1', { share: fakeShare({ available: false }), clipboard: clip })
    });
    await userEvent.click(screen.getByRole('button', { name: 'Отправить' }));
    expect(clip.last.text).toBe('https://example.test/i/cc1.html');
  });

  it('shares the full text, not just the name (D22, paid off)', async () => {
    const share = fakeShare();
    render(App, { env: at('cc1', { share }) });
    await userEvent.click(screen.getByRole('button', { name: 'Отправить' }));
    expect(share.last.title).toBe('Зелье выносливости (расходник)');
    expect(share.last.text).toContain('Очистите 1d4 Стресса.');
    expect(share.last.text).not.toBe('Зелье выносливости (расходник)');
  });

  it('attaches no file for a record with no art', async () => {
    const share = fakeShare();
    render(App, { env: at('cc1', { share }) });
    await userEvent.click(screen.getByRole('button', { name: 'Отправить' }));
    expect(share.last.hasFile).toBe(false);
  });

  it('attaches the picture where there is art (D22, paid off)', async () => {
    const share = fakeShare();
    render(App, { env: at('ci1', { share }) });
    await userEvent.click(screen.getByRole('button', { name: 'Отправить' }));
    expect(share.last.hasFile).toBe(true);
    const file = await share.last.file?.();
    expect(file?.name).toBe('Спальный мешок.png');
    expect(file?.type).toBe('image/png');
  });

  it('copies the picture, which the clipboard will only take as a PNG', async () => {
    const clip = fakeClipboard();
    render(App, { env: at('ci1', { clipboard: clip }) });
    await userEvent.click(screen.getByRole('button', { name: 'Скопировать изображение' }));
    expect(clip.last.image).toBe(true);
    expect(screen.getByText('Картинка скопирована')).toBeInTheDocument();
  });

  it('falls back to the text when the canvas cannot be read back at all (D10, paid off)', async () => {
    /* A tainted canvas under file:// - `pngOf` itself rejects, so there is
       never a blob to offer the clipboard at all. */
    const clip = fakeClipboard();
    const image = {
      pngOf: () => Promise.reject(new Error('tainted')),
      download: () => Promise.resolve()
    };
    render(App, { env: at('ci1', { clipboard: clip, image }) });
    await userEvent.click(screen.getByRole('button', { name: 'Скопировать изображение' }));
    expect(clip.last.image).toBeUndefined();
    expect(clip.last.rich?.plain).toContain('Спальный мешок');
    expect(
      screen.getByText('Не удалось скопировать картинку - скопирован текст')
    ).toBeInTheDocument();
  });

  it('offers a download when the picture exists but the clipboard refuses it (D14, paid off)', async () => {
    const clip = fakeClipboard({ fail: true });
    const image = fakeImage();
    render(App, { env: at('ci1', { clipboard: clip, image }) });
    await userEvent.click(screen.getByRole('button', { name: 'Скопировать изображение' }));
    expect(image.downloaded).toHaveLength(1);
    expect(image.downloaded[0]?.filename).toBe('Спальный мешок.png');
    expect(screen.getByText('Картинка сохранена')).toBeInTheDocument();
  });

  it('says the picture could not be saved either, distinct from the generic failure (D15, paid off)', async () => {
    const clip = fakeClipboard({ fail: true });
    const image = fakeImage({ failDownload: true });
    render(App, { env: at('ci1', { clipboard: clip, image }) });
    await userEvent.click(screen.getByRole('button', { name: 'Скопировать изображение' }));
    expect(screen.getByText('Не удалось сохранить картинку')).toBeInTheDocument();
    expect(screen.queryByText('Не удалось скопировать')).not.toBeInTheDocument();
  });

  it('says nothing when somebody dismisses their own share sheet', async () => {
    /* Changing your mind is not an error, and reporting it would be nagging. */
    render(App, { env: at('cc1', { share: fakeShare({ result: 'dismissed' }) }) });
    await userEvent.click(screen.getByRole('button', { name: 'Отправить' }));
    expect(screen.queryByText('Не удалось скопировать')).not.toBeInTheDocument();
    expect(screen.queryByText('Ссылка скопирована')).not.toBeInTheDocument();
  });

  it('falls back to the clipboard when the share sheet fails', async () => {
    const clip = fakeClipboard();
    render(App, {
      env: at('cc1', { share: fakeShare({ result: 'failed' }), clipboard: clip })
    });
    await userEvent.click(screen.getByRole('button', { name: 'Отправить' }));
    expect(clip.last.text).toBe('https://example.test/i/cc1.html');
  });
});

describe('the tier ladder', () => {
  it('offers every rung of the upgrade line, in tier order', () => {
    /* Improved, Advanced and Legendary are the same weapon at four tiers, and
       the card is where a person moves between them. The fixture stores them
       out of order to prove the ladder does the sorting. */
    render(App, { env: at('q1') });
    const steps = screen.getByText('Ранг').parentElement;
    expect(steps?.textContent.replace('Ранг', '').trim()).toBe('123');
  });

  it('marks the rung you are on rather than offering it', () => {
    render(App, { env: at('q1') });
    expect(screen.getByText('1', { selector: '.step' })).toHaveAttribute(
      'aria-current',
      'true'
    );
    expect(screen.queryByRole('button', { name: 'Палаш' })).not.toBeInTheDocument();
  });

  it('names each rung by the weapon it leads to, not by its number', () => {
    /* The digit alone tells a screen reader nothing about where it goes. */
    render(App, { env: at('q1') });
    expect(screen.getByRole('button', { name: 'Улучшенный Палаш' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Продвинутый Палаш' })).toBeInTheDocument();
  });

  it('opens the rung over the page rather than navigating to it', async () => {
    /* The live app answers with the modal, which keeps the page you came from
       underneath - and the ladder inside the modal keeps working. */
    render(App, { env: at('q1') });
    await userEvent.click(screen.getByRole('button', { name: 'Улучшенный Палаш' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Улучшенный Палаш')).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Продвинутый Палаш' }));
    expect(
      within(screen.getByRole('dialog')).getByText('Продвинутый Палаш')
    ).toBeInTheDocument();
  });

  it('draws no ladder for a piece that stands alone', () => {
    /* A line of one is not a ladder, and neither is a loot record. */
    render(App, { env: at('ci1') });
    expect(screen.queryByText('Ранг')).not.toBeInTheDocument();
  });

  it('draws the ladder on a frame record now that the guard is dropped, tier words and all (D11, paid off)', async () => {
    /* Before D11 paid off, RecordCard suppressed the ladder for every frame
       record (`!isFrameRecord(it)`, once at `RecordCard.svelte:177`). f1
       stands alone (`eq.line: ''`) and cannot prove the guard's removal; f2
       and f3 share one, so this is a frame record's own page showing both a
       ladder and the tier word on its stat chip - the larger, user-visible
       half of D11, which real frame records with a line (`f37`-`f44` and 54
       others) now get too. */
    const { container } = render(App, { env: at('f2') });
    const steps = screen.getByText('Ранг').parentElement;
    expect(steps?.textContent.replace('Ранг', '').trim()).toBe('12');
    expect(screen.getByText('Ранг 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Кухонный Нож Мастера' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('folds a menu left open when the modal closes by its own button', async () => {
    /* Without `app.menuFor = ''` on every close path, the card's add-to-list
       menu, left open when a modal closes, is still `open` the next time the
       same record's modal is shown - `aria-expanded="true"`, menu drawn. */
    render(App, { env: at('q1') });
    await userEvent.click(screen.getByRole('button', { name: 'Улучшенный Палаш' }));
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Добавить в список' })
    );
    expect(screen.getByText('Лежит в списках')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Улучшенный Палаш' }));
    const reopened = screen.getByRole('dialog');
    expect(within(reopened).getByRole('button', { name: 'Добавить в список' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.queryByText('Лежит в списках')).not.toBeInTheDocument();
  });

  it('folds the same menu when the modal closes through the backdrop', async () => {
    render(App, { env: at('q1') });
    await userEvent.click(screen.getByRole('button', { name: 'Улучшенный Палаш' }));
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Добавить в список' })
    );
    expect(screen.getByText('Лежит в списках')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('dialog'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Улучшенный Палаш' }));
    const reopened = screen.getByRole('dialog');
    expect(within(reopened).getByRole('button', { name: 'Добавить в список' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('closes on a real navigation, but a filter pick or a list mutation would not (RecordHost)', async () => {
    /* RecordHost's close-on-navigation effect is shared
       by all eight pages now, pinned here on the one it came from.
       app.navigations bumps on go() and on an external hash change only
       (app.svelte.ts:312,460) - replace() never touches it, so a filter
       pick or a list mutation (both replace()-shaped address rewrites) must
       leave the modal open; only a real navigation like this one closes it. */
    const router = memoryRouter('#/i/q1');
    render(App, { env: at('q1', { router }) });
    await userEvent.click(screen.getByRole('button', { name: 'Улучшенный Палаш' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    router.navigate('#/i/ci1');
    await tick();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the add-to-list menu on Escape and returns focus to its toggle, leaving the modal open', async () => {
    render(App, { env: at('q1') });
    await userEvent.click(screen.getByRole('button', { name: 'Улучшенный Палаш' }));
    const toggle = within(screen.getByRole('dialog')).getByRole('button', {
      name: 'Добавить в список'
    });
    await userEvent.click(toggle);
    expect(screen.getByText('Лежит в списках')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByText('Лежит в списках')).not.toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
    /* Only the menu closed - a second, unclaimed Escape is what closes the
       modal, the native <dialog> behaviour this must not fight. */
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('a craft chain that runs through the record', () => {
  /* Frostwyrd (Awakened) from the real data: made from Dormant, upgrades to
     Exalted, and a named weapon rather than a rung of a tier ladder. */
  const REAL = JSON.parse(
    readFileSync(join(import.meta.dirname, '..', '..', '..', 'data.json'), 'utf8')
  ) as Loot;
  const awakened = (): Env =>
    fakeEnv({ router: memoryRouter('#/i/dve25'), data: fakeData(REAL) });

  it('draws where it came from before where it goes, each with its own arrow, the unique badge, and no ladder', async () => {
    const { container } = render(App, { env: awakened() });
    const into = screen.getByText('Улучшается до').parentElement;
    const from = screen.getByText('Получается из').parentElement;
    expect(into).not.toBeNull();
    expect(from).not.toBeNull();
    if (!into || !from) return;
    expect(from.compareDocumentPosition(into) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const fromPath = from.querySelector('svg path')?.getAttribute('d');
    const intoPath = into.querySelector('svg path')?.getAttribute('d');
    expect(fromPath).toBeTruthy();
    expect(intoPath).toBeTruthy();
    expect(fromPath).not.toBe(intoPath);
    expect(within(into).getByRole('link', { name: 'Фроствирд (Возвышенный)' })).toHaveAttribute(
      'href',
      '#/i/dve26'
    );
    expect(within(from).getByRole('link', { name: 'Фроствирд (Дремлющий)' })).toHaveAttribute(
      'href',
      '#/i/dve24'
    );
    expect(screen.getByText('Уникальное')).toBeInTheDocument();
    expect(container.querySelector('.step')).toBeNull();
    await expectNoA11yViolations(container);
  });
});

describe('a feature an item grants an adversary', () => {
  /* Nightshroud from the real data: its text stops where the book's does, and
     Slow travels as a folded referenced card (I18N.md, "Rules"). */
  const REAL = JSON.parse(
    readFileSync(join(import.meta.dirname, '..', '..', '..', 'data.json'), 'utf8')
  ) as Loot;
  const nightshroud = (): Env =>
    fakeEnv({ router: memoryRouter('#/i/dve66'), data: fakeData(REAL) });

  it('draws Slow as a folded referenced card that links to the page that prints it', async () => {
    const { container } = render(App, { env: nightshroud() });
    expect(container.querySelector('.card-desc')?.textContent).not.toContain(
      'Медленный - Пассивный'
    );
    const summary = screen.getByText('Медленный', { selector: '.ref-n' }).closest('summary');
    expect(summary).not.toBeNull();
    if (!summary) return;
    expect(summary).toHaveTextContent(
      'Огромная Зелёная Слизь · Свойство противника · Пассивное'
    );
    const details = summary.closest('details');
    expect(details).not.toBeNull();
    if (!details) return;
    expect(details.open).toBe(false);
    expect(details.querySelector('a')).toHaveAttribute(
      'href',
      'https://ru.daggerheart.su/adversary/huge-green-ooze'
    );
    await expectNoA11yViolations(container);
    await userEvent.click(summary);
    expect(details.open).toBe(true);
    await expectNoA11yViolations(container);
  });
});

describe('a consumable artifact', () => {
  /* Narvik Contract from the real data: the book prints it among the
     artifacts, so its section names it, with its roll inside that section. */
  it('names the Artifacts section and its roll in the path line', async () => {
    const REAL = JSON.parse(
      readFileSync(join(import.meta.dirname, '..', '..', '..', 'data.json'), 'utf8')
    ) as Loot;
    const { container } = render(App, {
      env: fakeEnv({ router: memoryRouter('#/i/voa4_a2'), data: fakeData(REAL) })
    });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Контракт Нарвиков');
    expect(container.textContent).toContain('Vault of Ages · Артефакт · номер 8');
    expect(container.textContent).not.toContain('Ранг');
    await expectNoA11yViolations(container);
  });
});

describe('the set line', () => {
  it('lists every member, the one you are on inert and the rest linked', () => {
    render(App, { env: at('s1') });
    const line = screen.getByText('Комплект').parentElement;
    expect(line).not.toBeNull();
    if (!line) return;
    const own = within(line).getByText('Первый клинок');
    expect(own.tagName).toBe('SPAN');
    expect(own).toHaveAttribute('aria-current', 'true');
    expect(within(line).getByRole('link', { name: 'Второй клинок' })).toHaveAttribute(
      'href',
      '#/i/s2'
    );
    /* Svelte's whitespace collapsing at a tag boundary can eat the space
       after the comma, so the test reads the whole line's text. */
    expect(line.textContent.replace(/\s+/g, ' ').trim()).toBe(
      'Комплект Первый клинок, Второй клинок'
    );
  });

  it('reads the same set from the other half, itself inert this time', () => {
    /* Membership is symmetric: opening Spark's own page marks Spark inert and
       links back to Ember, the same pair read from its other end. */
    render(App, { env: at('s2') });
    const line = screen.getByText('Комплект').parentElement;
    expect(line).not.toBeNull();
    if (!line) return;
    expect(within(line).getByText('Второй клинок')).toHaveAttribute('aria-current', 'true');
    expect(within(line).getByRole('link', { name: 'Первый клинок' })).toHaveAttribute(
      'href',
      '#/i/s1'
    );
  });

  it("draws the set's shared bonus under the set line on both members", () => {
    for (const id of ['s1', 's2']) {
      render(App, { env: at(id) });
      const label = screen.getByText('Двойное лезвие:');
      const line = label.closest('p');
      expect(line?.previousElementSibling?.textContent).toContain('Комплект');
      expect(line?.textContent.replace(/\s+/g, ' ').trim()).toBe(
        'Двойное лезвие: Оба клинка бьют как один.'
      );
      cleanup();
    }
  });

  it('draws no set line for a record outside any set', () => {
    render(App, { env: at('q1') });
    expect(screen.queryByText('Комплект')).not.toBeInTheDocument();
  });

  it('draws the real Ember and Spark bonus on Ember', async () => {
    const REAL = JSON.parse(
      readFileSync(join(import.meta.dirname, '..', '..', '..', 'data.json'), 'utf8')
    ) as Loot;
    const { container } = render(App, {
      env: fakeEnv({ router: memoryRouter('#/i/dve19'), data: fakeData(REAL) })
    });
    expect(screen.getByText('Пылающие близнецы:')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('has no axe violations with the set line on the page', async () => {
    const { container } = render(App, { env: at('s1') });
    await expectNoA11yViolations(container);
  });
});

describe('accessibility', () => {
  it('has no axe violations on a record with everything on it', async () => {
    const { container } = render(App, { env: at('ci1') });
    await expectNoA11yViolations(container);
  });

  it('has no axe violations on a referenced card', async () => {
    const { container } = render(App, { env: at('ci2') });
    await expectNoA11yViolations(container);
  });

  it('has no axe violations with the tier ladder and the card it opens', async () => {
    const { container } = render(App, { env: at('q1') });
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: 'Улучшенный Палаш' }));
    await expectNoA11yViolations(container);
  });

  it('has no axe violations when the link does not resolve', async () => {
    const { container } = render(App, { env: at('no-such-id') });
    await expectNoA11yViolations(container);
  });
});
