/* The record page, driven through fake ports.
 *
 * A small catalogue rather than the real one: five records shaped to cover what
 * the card branches on - a plain item, a consumable, equipment with a stat line,
 * both ends of an upgrade chain, a referenced rulebook card, and a record with
 * no picture. The format the copy buttons produce is held to the live app in
 * lib/share.test.ts; what is checked here is that the buttons reach it, that a
 * refusal is reported rather than swallowed, and that the markup is one a
 * screen reader can follow. */

import { cleanup, render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../App.svelte';
import {
  fakeClipboard,
  fakeData,
  fakeEnv,
  fakeShare,
  memoryRouter,
  noData
} from '../ports/index.js';
import type { Env } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import type { Loot } from '../lib/data.js';

afterEach(cleanup);

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
    }
  ],
  refs: {
    'vicious-entangle': {
      en: 'Vicious Entangle',
      ensub: 'Sage · Level 1 · Spell',
      ende: 'Roots reach out.',
      ru: 'Неистовое опутывание',
      rusub: 'Мудрость · Уровень 1 · Заклинание',
      rud: 'Корни вырываются из-под земли.',
      url: 'https://ru.daggerheart.su/domain/vicious-entangle'
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

  it('brings the text of a referenced card, collapsed', () => {
    render(App, { env: at('ci2') });
    const card = screen.getByText('Неистовое опутывание');
    expect(card).toBeInTheDocument();
    expect(screen.getByText('Корни вырываются из-под земли.')).toBeInTheDocument();
    expect(card.closest('details')?.open).toBe(false);
  });

  it('gives a referenced card in the language on screen', async () => {
    render(App, { env: at('ci2') });
    expect(screen.getByText('Мудрость · Уровень 1 · Заклинание')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByText('Sage · Level 1 · Spell')).toBeInTheDocument();
    expect(screen.getByText('Roots reach out.')).toBeInTheDocument();
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
});

describe('a link that no longer resolves', () => {
  it('says so, rather than rendering an empty page', () => {
    render(App, { env: at('no-such-id') });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Предмет не найден' })
    ).toBeInTheDocument();
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
    /* As the live app does - tests/parity.js compares the two. Where there is
       no share sheet the link goes to the clipboard, which is what the person
       was reaching for; hiding the control would just lose the action. */
    const clip = fakeClipboard();
    render(App, {
      env: at('cc1', { share: fakeShare({ available: false }), clipboard: clip })
    });
    await userEvent.click(screen.getByRole('button', { name: 'Отправить' }));
    expect(clip.last.text).toBe('https://example.test/i/cc1.html');
  });

  it('copies the picture, which the clipboard will only take as a PNG', async () => {
    const clip = fakeClipboard();
    render(App, { env: at('ci1', { clipboard: clip }) });
    await userEvent.click(screen.getByRole('button', { name: 'Скопировать изображение' }));
    expect(clip.last.image).toBe(true);
    expect(screen.getByText('Картинка скопирована')).toBeInTheDocument();
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
