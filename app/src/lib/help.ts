/* What each roll page explains about itself, off the `help` block in app.js.
 *
 * The live app keeps these as HTML strings and injects them. Here a paragraph
 * is a shape instead: a run of text and links, with an optional bold lead-in.
 * Nothing has to be injected to render it, and the two things the live text
 * actually uses - `<b>` at the start of a paragraph, and a source line with
 * three links in it - both fit without a special case.
 *
 * This is the product's own text, so it is Russian and English rather than
 * source prose, and the em dashes in it are the ones the live app prints.
 */

import type { Lang } from './types.js';

export interface HelpLink {
  href: string;
  label: string;
}

/** A run of a paragraph: plain text, or a link to a book. */
export type HelpPart = string | HelpLink;

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
      p(
        'Сколько костей брать, решает редкость добычи — она подписана под каждой кнопкой. Где какая редкость уместна:<br><b>Обычная</b> — заброшенный лагерь, обычная лавка.<br><b>Необычная</b> — ограниченный товар в лавке, тайник в лагере, часть награды.<br><b>Редкая</b> — под замком в лавке, единственная награда за работу, вещи сильного НИП.<br><b>Легендарная</b> — единственная в своём роде, награда за смертельно опасное дело, сокровище могущественного противника.'
      ),
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
      p(
        "How many dice you take depends on the rarity you are after — each button is captioned with the rarities it covers. Where each one fits:<br><b>Common</b> — an abandoned camp, a local shop.<br><b>Uncommon</b> — limited stock in a shop, a stash in a camp, part of a reward.<br><b>Rare</b> — under lock and key, the sole reward for a job, a powerful NPC's possessions.<br><b>Legendary</b> — the only one of its kind, a reward for a deadly job, a powerful adversary's treasure."
      ),
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

const HELP: Record<string, Record<Lang, Help>> = {
  std: STD,
  alt: ALT,
  wondrous: WONDROUS,
  dread: DREAD,
  voa: VOA,
  community: COMMUNITY
};

/** What this section explains about itself, or null where nothing is written. */
export function helpFor(section: string, lang: Lang): Help | null {
  return HELP[section]?.[lang] ?? null;
}

/** Whether a part of a paragraph is a link rather than plain text. */
export function isLink(part: HelpPart): part is HelpLink {
  return typeof part !== 'string';
}
