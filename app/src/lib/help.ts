/* What each roll page explains about itself, off the `help` block in app.js.
 *
 * The live app keeps these as HTML strings and injects them. Here a paragraph
 * is a shape instead: a run of text, links, bold words and line breaks.
 * Nothing has to be injected to render it.
 *
 * The shape started as text plus links plus a bold lead-in, which covered the
 * four sections ported first and quietly failed on the fifth: the Core rules
 * paragraph that lists where each rarity fits is one paragraph with four
 * `<br><b>Word</b>` lines inside it, and it shipped showing those tags as
 * words. Nothing looked at it, because no parity state opened that panel.
 *
 * This is the product's own text, so it is Russian and English rather than
 * source prose, and the em dashes in it are the ones the live app prints.
 */

import type { Lang } from './types.js';

export interface HelpLink {
  href: string;
  label: string;
}

/** A line break inside a paragraph, where the live text has one. */
export const BR = { br: true } as const;
export type HelpBreak = typeof BR;

/** A word in bold partway through a run, rather than opening one. */
export interface HelpBold {
  b: string;
}

/** A run of a paragraph: plain text, a link, a bold word, or a break. */
export type HelpPart = string | HelpLink | HelpBold | HelpBreak;

export interface HelpPara {
  /** The bold opening of a paragraph, where the live text has one. */
  lead?: string;
  parts: HelpPart[];
}

export interface Help {
  paragraphs: HelpPara[];
}

/** A paragraph of plain text, which is most of them. */
const p = (text: string): HelpPara => ({ parts: [text] });

/**
 * One of the "where this rarity fits" lines in the Core rules help: a break, a
 * rarity in bold, and the places it belongs. Four of them hang off the end of
 * one paragraph rather than standing as paragraphs of their own, which is how
 * the live text is written and how it measures.
 */
const rarityLine = (word: string, where: string): HelpPart[] => [
  BR,
  { b: word },
  ` — ${where}`
];

const WONDROUS: Record<Lang, Help> = {
  ru: {
    paragraphs: [
      p(
        'В таблице 119 позиций, а не 100 — столько предметов описано в самом дополнении. Кости на такой диапазон не бывает, поэтому кнопка выбирает позицию случайно. Если бросаете d100 за столом, введите выпавшее число в поле «Результат броска».'
      ),
      p(
        'Порядок взят из книги: там предметы отсортированы по английскому алфавиту, а не по силе. В русском переводе он поэтому выглядит произвольным. Большинство предметов слабые или средние.'
      ),
      p(
        'Часть предметов улучшается до более сильных. На карточке такая связь показана отдельной строкой, по ней же можно перейти ко второму предмету. Мастер может потребовать для улучшения бросок Искусности или Знания.'
      ),
      p(
        'Часть предметов рассчитана на окружения и сюжеты своей книги: вне их вещь может оказаться бесполезной или странной. Случайную выдачу отсюда стоит просматривать глазами, а не отдавать игрокам вслепую.'
      ),
      {
        parts: [
          'Источник: дополнение ',
          {
            href: 'https://www.drivethrurpg.com/en/product/552648/wondrous-environments',
            label: 'Wondrous Environments'
          },
          '.'
        ]
      }
    ]
  },
  en: {
    paragraphs: [
      p(
        'The table holds 119 entries rather than 100 — that is how many items the supplement actually describes. No die covers that range, so the button picks an entry at random. If you roll d100 at the table, type the number into the Roll result field.'
      ),
      p(
        "The order is the book's own: alphabetical by English name, not by power. Most items are weak to moderate."
      ),
      p(
        'Some items upgrade into stronger ones. The card shows that on its own line, and the link takes you to the second item. The GM may ask for a Finesse or Knowledge roll to make the upgrade.'
      ),
      p(
        'Some entries are written for the environments and plots of their own book: elsewhere they can be useless or simply odd. Look over what comes up here rather than handing it to the players unseen.'
      ),
      {
        parts: [
          'Source: the ',
          {
            href: 'https://www.drivethrurpg.com/en/product/552648/wondrous-environments',
            label: 'Wondrous Environments'
          },
          ' supplement.'
        ]
      }
    ]
  }
};

const DREAD: Record<Lang, Help> = {
  ru: {
    paragraphs: [
      p(
        'В таблице 29 позиций — столько предметов описано в дополнении. Кости на такой диапазон не бывает, поэтому кнопка выбирает позицию случайно.'
      ),
      p(
        'Порядок взят из книги: сначала семь единиц снаряжения с характеристиками (их ранг книга указывает сама), затем предметы по английскому алфавиту.'
      ),
      p(
        'Книга не делит вещи на постоянные и расходуемые. Здесь это проставлено по смыслу описания: масла, гранаты и сыворотка помечены расходниками, остальное — предметами.'
      ),
      p(
        'Часть предметов рассчитана на окружения и сюжеты своей книги: вне их вещь может оказаться бесполезной или странной. Случайную выдачу отсюда стоит просматривать глазами, а не отдавать игрокам вслепую.'
      ),
      {
        parts: [
          'Источник: дополнение ',
          {
            href: 'https://www.drivethrurpg.com/en/product/573714/dread-gm-toolbox-for-daggerheart',
            label: 'Dread GM Toolbox for Daggerheart'
          },
          '.'
        ]
      }
    ]
  },
  en: {
    paragraphs: [
      p(
        'The table has 29 entries, which is how many the supplement describes. No die covers that range, so the button picks an entry at random.'
      ),
      p(
        'The order follows the book: seven pieces of equipment with statistics first (the book states their tier), then the items in English alphabetical order.'
      ),
      p(
        'The book does not sort these into permanent and single-use. That split is made here from what each entry describes: oils, grenades and the serum are marked as consumables, the rest as items.'
      ),
      p(
        'Some entries are written for the environments and plots of their own book: elsewhere they can be useless or simply odd. Look over what comes up here rather than handing it to the players unseen.'
      ),
      {
        parts: [
          'Source: the ',
          {
            href: 'https://www.drivethrurpg.com/en/product/573714/dread-gm-toolbox-for-daggerheart',
            label: 'Dread GM Toolbox for Daggerheart'
          },
          ' supplement.'
        ]
      }
    ]
  }
};

const VOA_V1: HelpLink = {
  href: 'https://www.drivethrurpg.com/en/product/562876/vault-of-ages-volume-1',
  label: 'Vault of Ages Volume 1'
};
const VOA_V2: HelpLink = {
  href: 'https://www.drivethrurpg.com/en/product/567176/vault-of-ages-volume-2',
  label: 'Volume 2'
};
const VOA_V3: HelpLink = {
  href: 'https://www.drivethrurpg.com/en/product/574145/vault-of-ages-volume-3',
  label: 'Volume 3'
};

/** Three links in one sentence, which is why a paragraph is a run of parts. */
const voaSource = (before: string): HelpPara => ({
  parts: [before, VOA_V1, ', ', VOA_V2, ', ', VOA_V3, '.']
});

const VOA: Record<Lang, Help> = {
  ru: {
    paragraphs: [
      p(
        'Три тома одного автора: 108 карточек, разложенных по рангам. Своей таблицы броска у книги нет, поэтому и разделов шесть — четыре ранга плюс артефакты и проклятые предметы, ровно как в самих томах. Бросок идёт внутри выбранного раздела: ранг 1 и артефакт — награды разного веса, и на одной кости им не место.'
      ),
      {
        lead: 'Стоимость Призыва.',
        parts: [
          ' Вещи из этой книги сильнее того, что лежит в корнике, поэтому у большинства есть Стоимость Призыва. Если баланс важен, пусть игрок платит её Стрессом и меняет предмет на одну из карт домена в Руке — только тогда предмет считается снаряжённым. Если баланс не важен, правило можно не применять.'
        ]
      },
      {
        lead: 'Артефакты.',
        parts: [
          ' Предметы из легенд: последствия применения некоторых способны изменить мир и вытянуть на себе целую кампанию. Их не раздают всем — они должны появляться редко и работать на историю.'
        ]
      },
      {
        lead: 'Проклятые предметы.',
        parts: [
          ' Дают сильное преимущество, но не бесплатно. Когда персонаж запускает проклятие, карта немедленно занимает место одной из карт в его Руке, и предмет привязывается навсегда. Снять его можно только трудным заданием, мощной магией или особыми обстоятельствами — условие придумывает Мастер или стол. Носить несколько проклятых предметов можно, но неразумно.'
        ]
      },
      voaSource('Источник: три тома Криса ДеШамплейна, версия 1.5 — ')
    ]
  },
  en: {
    paragraphs: [
      p(
        'Three volumes by one author: 108 cards sorted by tier. The book has no roll table of its own, so there are six sections here — four tiers plus artifacts and cursed objects, exactly as the volumes are laid out. The roll happens inside the section you pick: a tier 1 item and an artifact are rewards of a different weight and do not belong on one die.'
      ),
      {
        lead: 'Recall Cost.',
        parts: [
          ' Items in this book are often stronger than those in the core book, so most carry a Recall Cost. If balance matters at your table, have the player pay it in Stress and swap the item for one of the domain cards in their loadout — only then does it count as equipped. If balance does not matter, skip the rule.'
        ]
      },
      {
        lead: 'Artifacts.',
        parts: [
          ' Objects out of legend: the consequences of using some of them can reshape a world and carry a whole campaign. Do not hand them to everyone — they should be rare and serve the story.'
        ]
      },
      {
        lead: 'Cursed objects.',
        parts: [
          ' A strong benefit that is not free. The moment a character triggers the curse, the card takes the place of one of the cards in their loadout, and the item is bound to them permanently. Removing it takes a hard task, powerful magic or special circumstances — the GM or the table invents the condition. Carrying several cursed objects is possible but unwise.'
        ]
      },
      voaSource('Source: three volumes by Chris DeChamplain, v1.5 — ')
    ]
  }
};

const COMMUNITY_LINK: HelpLink = {
  href: 'https://www.drivethrurpg.com/en/product/558159/community-magic-items-a-daggerheart-compatible-toolkit',
  label: 'Community Magic Items'
};

const COMMUNITY: Record<Lang, Help> = {
  ru: {
    paragraphs: [
      p(
        'Предметы каждого сообщества перечислены по возрастанию редкости: 1 — самый простой, 10 — самый сильный.'
      ),
      p(
        'Такие предметы уместны как награда от сообщества, семейная реликвия или находка на его территории.'
      ),
      { parts: ['Источник: дополнение ', COMMUNITY_LINK, '.'] }
    ]
  },
  en: {
    paragraphs: [
      p(
        'Each community lists its items in ascending order of rarity: 1 is the humblest, 10 the most powerful.'
      ),
      p(
        'They fit best as a reward from that community, a family heirloom, or a find on its territory.'
      ),
      { parts: ['Source: the ', COMMUNITY_LINK, ' supplement.'] }
    ]
  }
};

const STD: Record<Lang, Help> = {
  ru: {
    paragraphs: [
      p(
        'Бросьте d12 и сложите результаты — сумма и есть номер в таблице. Одно и то же число есть и в таблице предметов, и в таблице расходников, поэтому на один бросок приходится несколько вариантов, а игрок выбирает один.'
      ),
      {
        parts: [
          'Сколько костей брать, решает редкость добычи — она подписана под каждой кнопкой. Где какая редкость уместна:',
          ...rarityLine('Обычная', 'заброшенный лагерь, обычная лавка.'),
          ...rarityLine(
            'Необычная',
            'ограниченный товар в лавке, тайник в лагере, часть награды.'
          ),
          ...rarityLine(
            'Редкая',
            'под замком в лавке, единственная награда за работу, вещи сильного НИП.'
          ),
          ...rarityLine(
            'Легендарная',
            'единственная в своём роде, награда за смертельно опасное дело, сокровище могущественного противника.'
          )
        ]
      },
      p(
        'Ранги у редкостей — рекомендация, а не ограничение. Мастер вправе выдать снаряжение любой редкости на любом уровне, если это уместно за столом.'
      )
    ]
  },
  en: {
    paragraphs: [
      p(
        'Roll d12 and add them up — the total is the row number. The same number exists in both the item and the consumable table, so one roll yields several options and the player takes one.'
      ),
      {
        parts: [
          'How many dice you take depends on the rarity you are after — each button is captioned with the rarities it covers. Where each one fits:',
          ...rarityLine('Common', 'an abandoned camp, a local shop.'),
          ...rarityLine(
            'Uncommon',
            'limited stock in a shop, a stash in a camp, part of a reward.'
          ),
          ...rarityLine(
            'Rare',
            "under lock and key, the sole reward for a job, a powerful NPC's possessions."
          ),
          ...rarityLine(
            'Legendary',
            "the only one of its kind, a reward for a deadly job, a powerful adversary's treasure."
          )
        ]
      },
      p(
        'Tiers attached to rarities are a recommendation, not a limit. The GM may hand out any rarity at any level if it suits the table.'
      )
    ]
  }
};

const ALT_AUTHOR: HelpLink = {
  href: 'https://www.reddit.com/user/PrinceOfNowhereee/',
  label: 'PrinceOfNowhereee'
};
const ALT_POST: HelpLink = {
  href: 'https://www.reddit.com/r/daggerheart/comments/1v3z3gm/alternate_loot_tables_combining_hope_fear_with/',
  label: 'the Reddit post'
};

const ALT: Record<Lang, Help> = {
  ru: {
    paragraphs: [
      p(
        'Предметы разнесены по колонкам «Надежда» и «Страх» по смыслу: в «Надежде» то, что помогает, защищает и решает задачи, в «Страхе» — то, что вредит, обманывает и работает исподтишка.'
      ),
      p(
        'Выберите редкость и бросьте Кости Дуальности. Игрок выбирает между вариантом по Кости Надежды и вариантом по Кости Страха.'
      ),
      p(
        'При критическом успехе, когда обе кости совпали, игрок берёт любую позицию из таблицы этой редкости, а Мастер может разрешить подняться на ступень выше.'
      ),
      p('Ранги у редкостей — рекомендация, а не ограничение.'),
      {
        parts: [
          'Автор таблиц: ',
          ALT_AUTHOR,
          '. Источник: ',
          { ...ALT_POST, label: 'пост на Reddit' },
          '.'
        ]
      }
    ]
  },
  en: {
    paragraphs: [
      p(
        'Items are split between the Hope and Fear columns by theme: Hope holds what aids, protects and solves problems, Fear holds what harms, deceives and works by stealth.'
      ),
      p(
        'Choose a rarity and roll the Duality Dice. The player picks between the entry matching the Hope Die and the one matching the Fear Die.'
      ),
      p(
        'On a critical success, when both dice match, the player may take any entry from that rarity table, and the GM may allow jumping up a rarity.'
      ),
      p('Tiers attached to rarities are a recommendation, not a limit.'),
      { parts: ['Tables by ', ALT_AUTHOR, '. Source: ', ALT_POST, '.'] }
    ]
  }
};

const DAGGERHEART_SU: HelpLink = {
  href: 'https://ru.daggerheart.su/',
  label: 'daggerheart.su'
};

/**
 * The tables screen's help. Two paragraphs carry a bold word at the very
 * start - the `lead` shape - and one carries two bold words mid-sentence,
 * which is why a paragraph is a run of parts rather than a lead plus plain
 * text: "Улучшаемые" and "Уникальные" both sit inside the same sentence as
 * plain prose, not at its head.
 */
const TABLES: Record<Lang, Help> = {
  ru: {
    paragraphs: [
      p(
        'Здесь лежат все таблицы целиком. Сверху выбирается книга — корник, Hope & Fear, Wondrous Loot, Dread GM Toolbox, Vault of Ages, фреймы, сообщества, — а под ней её разделы, если внутри есть из чего выбирать. Отдельно стоят «Снаряжение» и «Альт. таблицы»: это не книги, а срезы через все книги сразу.'
      ),
      {
        lead: 'Снаряжение',
        parts: [
          ' собрано из всех источников, а не только из корника и Hope & Fear: оружие и броня есть ещё в Wondrous Loot, Dread, Vault of Ages и фреймах. Отобрать нужную книгу можно фильтром «Источник».'
        ]
      },
      p(
        'Снаряжение устроено иначе, чем добыча: у него нет номера в таблице, зато есть характеристика, дистанция, урон, хват или пороги с Показателем Брони. Всё это видно в строке и уезжает вместе с предметом при копировании.'
      ),
      p(
        'Порядок и разбивка взяты из книг: внутри каждого ранга сначала физическое оружие корника, потом магическое, затем то же для Hope & Fear.'
      ),
      p(
        'Ранг есть у всего снаряжения, включая Wondrous Loot. Рядом с вещью он там не напечатан, но книга привязывает добычу к локации таблицей «Loot items by environment», а у локации ранг указан: Посох Шепчущего Архива найден в Могиле Смотрителя, у неё ранг 2 — значит, и у посоха ранг 2. Это не оценка по характеристикам, а то же самое место в книге, просто на страницу раньше.'
      ),
      {
        lead: 'Класс',
        parts: [
          ' — это раздел книги, а не тип урона. Магическому оружию нужна Характеристика Заклинателя, даже если урон оно наносит физический: Призрачный Клинок магический, а урон у него «физ/маг». Поэтому класс и урон показаны отдельно, а оружие с уроном «физ/маг» попадает в оба фильтра сразу.'
        ]
      },
      {
        parts: [
          'Фильтр «Линейка» делит снаряжение надвое. ',
          { b: 'Улучшаемые' },
          ' — вещи, у которых есть версии повыше: Улучшенная, Продвинутая и Легендарная Катана — это одна и та же катана на четырёх рангах. ',
          { b: 'Уникальные' },
          ' — то, что существует в единственном виде и не улучшается.'
        ]
      },
      p(
        'Панель фильтров одна на все таблицы и стоит под поиском: у снаряжения в ней семь строк, у Vault of Ages вид и ранг, у фреймов вид и фрейм, у сообществ — сообщество. Где отбирать нечего, панели нет вовсе. В фильтрах ничего не выбрано по умолчанию — строка без выбора значит «любое». Клик выбирает значение, поэтому «только ранг 2» — это один клик, а не выключение трёх остальных. Внутри строки значения складываются по «или», строки сужают друг друга. Выбранное показано плашками рядом с кнопкой: крестик снимает одно значение, «Сбросить всё» — сразу все, а кнопка со звеном отдаёт ссылку на текущий набор. Всё это остаётся под рукой и со свёрнутой панелью. Адрес страницы едет за фильтром, так что ссылкой можно поделиться и прямо из строки браузера.'
      ),
      p(
        'Одиннадцать предметов из Wondrous Loot на самом деле оружие. В этих таблицах их нет — они остались в своей таблице Wondrous, но выглядят и копируются как снаряжение.'
      ),
      {
        parts: [
          'Источники: Daggerheart Core Set и Hope & Fear. Русские названия и формулировки — перевод ',
          DAGGERHEART_SU,
          ', для Hope & Fear — таблица сообщества. Значения даны с учётом эрраты.'
        ]
      }
    ]
  },
  en: {
    paragraphs: [
      p(
        'Every table in full. The top row picks a book — the core set, Hope & Fear, Wondrous Loot, the Dread GM Toolbox, Vault of Ages, frames, communities — and the row under it picks a section of that book, when there is more than one. "Equipment" and "Alt. tables" stand apart: they are cuts across every book rather than books of their own.'
      ),
      {
        lead: 'Equipment',
        parts: [
          ' is gathered from every source, not only the core set and Hope & Fear: there are weapons and armor in Wondrous Loot, Dread, Vault of Ages and the campaign frames too. Narrow it to one book with the "Source" filter.'
        ]
      },
      p(
        'Equipment works differently from loot: it has no roll number, but it does have a trait, a range, damage and burden — or thresholds and an Armor Score. All of it shows in the row and travels with the entry when you copy it.'
      ),
      p(
        'The order follows the books: inside each tier, Core physical weapons first, then Core magic, then the same for Hope & Fear.'
      ),
      p(
        'Every piece of equipment has a tier, Wondrous Loot included. The book does not print it next to the item, but it binds each piece of loot to a location in the "Loot items by environment" table, and every location has a tier: the Staff of the Whispering Archive comes from The Watcher\'s Grave, which is tier 2, so the staff is tier 2. This is not an estimate from the stats - it is the same book, one page earlier.'
      ),
      {
        lead: 'Class',
        parts: [
          ' is the table the book prints the weapon in, not the damage it deals. A magic weapon needs a Spellcast trait even when its damage is physical: the Ghostblade is a magic weapon dealing "phy or mag". So class and damage are shown apart, and a weapon that can deal either belongs to both filters.'
        ]
      },
      {
        parts: [
          'The "Line" filter splits equipment in two. ',
          { b: 'Upgradable' },
          ' means the piece has higher versions: Improved, Advanced and Legendary Katana are the same katana across four tiers. ',
          { b: 'Unique' },
          ' means it exists in one form only.'
        ]
      },
      p(
        'One filter panel serves every table and sits under the search box: seven rows for equipment, kind and tier for Vault of Ages, kind and frame for the campaign frames, community for the community items. Where there is nothing to narrow, there is no panel. Nothing is picked to begin with, and a row with no pick means "any". Clicking picks a value, so "tier 2 only" is one click rather than switching three others off. Values in a row combine with "or", rows narrow each other. What is picked shows as chips beside the button: the cross drops one value, "Reset all" drops the lot, and the link button hands out the current set. All of it stays reachable with the panel folded. The address follows the filter too, so the link in the address bar is the one to share.'
      ),
      p(
        'Eleven Wondrous Loot entries are really weapons. They are not in these tables — they stayed in the Wondrous one, but they look and copy like equipment.'
      ),
      p('Sources: the Daggerheart Core Set and Hope & Fear, with the errata applied.')
    ]
  }
};

const HELP: Record<string, Record<Lang, Help>> = {
  std: STD,
  alt: ALT,
  wondrous: WONDROUS,
  dread: DREAD,
  voa: VOA,
  community: COMMUNITY,
  tables: TABLES
};

/** What this section explains about itself, or null where nothing is written. */
export function helpFor(section: string, lang: Lang): Help | null {
  return HELP[section]?.[lang] ?? null;
}

/** Whether a part of a paragraph is a link to a book. */
export function isLink(part: HelpPart): part is HelpLink {
  return typeof part !== 'string' && 'href' in part;
}

/** Whether it is a word set in bold partway through the run. */
export function isBold(part: HelpPart): part is HelpBold {
  return typeof part !== 'string' && 'b' in part;
}

/** Whether it is a line break. */
export function isBreak(part: HelpPart): part is HelpBreak {
  return typeof part !== 'string' && 'br' in part;
}
