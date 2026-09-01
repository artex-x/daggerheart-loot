/* What each roll page explains about itself, off the `help` block in app.js.
 *
 * Plain paragraphs and, at the end, the book it came from as a real link. The
 * live app keeps these as HTML strings; here the link is a shape rather than
 * markup, so nothing has to be injected into the page to render it. */

import type { Lang } from './types.js';

export interface HelpSource {
  href: string;
  /** The book's name, which is the link text. */
  label: string;
}

export interface Help {
  paragraphs: string[];
  source: HelpSource;
}

const WONDROUS: Record<Lang, Help> = {
  ru: {
    paragraphs: [
      'В таблице 119 позиций, а не 100 — столько предметов описано в самом дополнении. Кости на такой диапазон не бывает, поэтому кнопка выбирает позицию случайно. Если бросаете d100 за столом, введите выпавшее число в поле «Результат броска».',
      'Порядок взят из книги: там предметы отсортированы по английскому алфавиту, а не по силе. В русском переводе он поэтому выглядит произвольным. Большинство предметов слабые или средние.',
      'Часть предметов улучшается до более сильных. На карточке такая связь показана отдельной строкой, по ней же можно перейти ко второму предмету. Мастер может потребовать для улучшения бросок Искусности или Знания.',
      'Часть предметов рассчитана на окружения и сюжеты своей книги: вне их вещь может оказаться бесполезной или странной. Случайную выдачу отсюда стоит просматривать глазами, а не отдавать игрокам вслепую.'
    ],
    source: {
      href: 'https://www.drivethrurpg.com/en/product/552648/wondrous-environments',
      label: 'Wondrous Environments'
    }
  },
  en: {
    paragraphs: [
      'The table holds 119 entries rather than 100 - that is how many the supplement describes. No die has that many faces, so the button picks one at random. If you are rolling a d100 at the table, type the number you rolled into the roll field.',
      'The order is the book’s: entries are sorted by their English names rather than by power, which is why the Russian translation looks arbitrary. Most of them are weak or middling.',
      'Some entries upgrade into stronger ones. The card shows that on a line of its own, and the line is a link to the other end. A GM may ask for a Finesse or Knowledge roll to make the upgrade.',
      'Some entries are written for the environments and stories of their own book, and outside them a thing can be useless or strange. Random results from here are worth reading before they are handed over.'
    ],
    source: {
      href: 'https://www.drivethrurpg.com/en/product/552648/wondrous-environments',
      label: 'Wondrous Environments'
    }
  }
};

const DREAD: Record<Lang, Help> = {
  ru: {
    paragraphs: [
      'В таблице 29 позиций — столько предметов описано в дополнении. Кости на такой диапазон не бывает, поэтому кнопка выбирает позицию случайно.',
      'Порядок взят из книги: сначала семь единиц снаряжения с характеристиками (их ранг книга указывает сама), затем предметы по английскому алфавиту.',
      'Книга не делит вещи на постоянные и расходуемые. Здесь это проставлено по смыслу описания: масла, гранаты и сыворотка помечены расходниками, остальное — предметами.',
      'Часть предметов рассчитана на окружения и сюжеты своей книги: вне их вещь может оказаться бесполезной или странной. Случайную выдачу отсюда стоит просматривать глазами, а не отдавать игрокам вслепую.'
    ],
    source: {
      href: 'https://www.drivethrurpg.com/en/product/573714/dread-gm-toolbox-for-daggerheart',
      label: 'Dread GM Toolbox for Daggerheart'
    }
  },
  en: {
    paragraphs: [
      'The table holds 29 entries - that is how many the supplement describes. No die has that many faces, so the button picks one at random.',
      'The order is the book’s: seven pieces of equipment with stats first, whose tier the book states itself, and then the items by their English names.',
      'The book does not split things into permanent and consumable. That is set here from what each description says: oils, grenades and the serum are consumables, the rest are items.',
      'Some entries are written for the environments and stories of their own book, and outside them a thing can be useless or strange. Random results from here are worth reading before they are handed over.'
    ],
    source: {
      href: 'https://www.drivethrurpg.com/en/product/573714/dread-gm-toolbox-for-daggerheart',
      label: 'Dread GM Toolbox for Daggerheart'
    }
  }
};

const HELP: Record<string, Record<Lang, Help>> = {
  wondrous: WONDROUS,
  dread: DREAD
};

/** What this section explains about itself, or null where nothing is written. */
export function helpFor(section: string, lang: Lang): Help | null {
  return HELP[section]?.[lang] ?? null;
}
