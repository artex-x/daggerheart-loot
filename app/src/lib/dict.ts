/* The interface dictionary.
 *
 * docs/specs/I18N.md keeps this separate from record text on purpose: this is
 * small, typed and reviewed, while record text is 1061 pairs maintained with
 * the data. Only interface strings belong here.
 *
 * Parity is a compile error rather than a test. `Dict` is derived from the
 * Russian side, so an English side missing a key does not typecheck and a key
 * only English has does not either. The old build could only find that out by
 * parsing its own source at test time.
 *
 * This grows with the rewrite. A key is added when a component needs it, not in
 * advance - an unused string is a translation somebody maintains for nothing,
 * and the old dictionary accumulated five of those. */

import type { Lang } from './types.js';

const ru = {
  /* The chrome that has no text of its own, and so has no other place to be
     named. Without these the tab bar and the language group are unlabelled to
     a screen reader. */
  docTitle: 'Генератор лута — Daggerheart',
  skipToContent: 'К содержимому',
  sectionsLabel: 'Разделы',
  langLabel: 'Язык',
  close: 'Закрыть',

  /* The nine sections, in tab order */
  std: 'Обычные правила',
  alt: 'Альт. таблицы',
  wondrous: 'Wondrous',
  dread: 'Dread',
  voa: 'Vault of Ages',
  community: 'Сообщества',
  tables: 'Таблицы',
  lists: 'Списки',
  search: 'Поиск',

  /* Outside the app a bare name loses the badge, so a consumable says so */
  item: 'Предмет',
  cons: 'Расходник',
  craftInto: 'Улучшается до',
  craftFrom: 'Получается из',

  /* The record card's actions, and what each one says when it is done */
  copyName: 'Скопировать название',
  copyText: 'Скопировать текст',
  copyImg: 'Скопировать изображение',
  sImg: 'Картинка',
  sText: 'Текст',
  openPage: 'Страница',
  showInTable: 'показать в таблице',
  rollNo: 'номер',

  /* The book a record comes from, as the badge and the metadata line name it */
  srcCore: 'Core',
  srcHnf: 'Hope & Fear',
  srcWond: 'Wondrous',
  srcDread: 'Dread',
  srcVoa: 'Vault of Ages',
  srcFrame: 'Фрейм',
  srcComm: 'Сообщества',
  copyLink: 'Скопировать ссылку',
  sendAll: 'Отправить',
  nameCopied: 'Название скопировано',
  imgCopied: 'Картинка скопирована',
  textCopied: 'Текст скопирован',
  linkCopied: 'Ссылка скопирована',
  copyFailed: 'Не удалось скопировать',

  /* Rolling */
  roll: 'Бросить',
  randomIn: 'Случайно',
  rollResult: 'Результат броска',
  stepDown: 'На единицу меньше',
  stepUp: 'На единицу больше',

  /* The licence notice, in three parts so the link is an element rather than
     markup in a string. The verbatim citation lives entirely in the first
     part - tests/derived.js pins it in app.js, and it must read the same here. */
  footBefore:
    'Данные: Daggerheart Core Set, Hope & Fear, Wondrous Loot, Dread GM Toolbox, Vault of Ages, Community Magic Items, Alternate Loot & Consumable Tables. Перевод: daggerheart.su и собственные материалы. Daggerheart © Darrington Press. This product includes materials from the Daggerheart System Reference Document 2.0, © Critical Role, LLC. under the terms of the Darrington Press Community Gaming (DPCGL) License. More information can be found at ',
  footLink: 'daggerheart.com',
  footAfter: '. There are no previous modifications by others.',

  /* The heading of each section, and the line under it. The heading is not
     always the tab's word: the tab says "Сообщества" and the page says
     "Предметы сообществ", because on the page it is the things that matter. */
  pageWondrous: 'Wondrous Loot',
  pageDread: 'Dread GM Toolbox',
  pageVoa: 'Vault of Ages',
  pageCommunity: 'Предметы сообществ',
  pageStd: 'Обычные правила',
  subStd: 'Бросок по таблицам корника и дополнения Hope & Fear.',
  /* The five dice buttons say which rarity band they cover */
  common: 'Обычная',
  uncommon: 'Необычная',
  rare: 'Редкая',
  veryRare: 'Очень редкая',
  legendary: 'Легендарная',
  source: 'Источник',
  keepOneSource: 'Нужен хотя бы один источник',
  filter: 'Тип',
  fItems: 'Предметы',
  fCons: 'Расходники',
  keepOneKind: 'Нужен хотя бы один тип',
  or: 'ИЛИ',
  copyRoll: 'Скопировать все варианты',
  subWondrous: 'Введите результат броска или получите случайную позицию.',
  subVoa: 'Выберите раздел книги и бросьте кость по нему.',
  subCommunity: 'Выберите происхождение и бросьте d10.',
  voaSection: 'Раздел книги',
  voaArtifact: 'Артефакты',
  voaCursed: 'Проклятые предметы',
  /* Singular, for the badge on one card: it is a thing, not a shelf. */
  voaArtifact1: 'Артефакт',
  voaCursed1: 'Проклятый предмет',
  unique: 'Уникальное',
  uniqueHint: 'В книге стоит одним рангом - лестницы улучшений у этой вещи нет',
  homeHint: 'Открывать этот раздел при запуске',
  /* The same button once it is on: the live app renames it rather than only
     filling it in, so a screen reader hears the state and not just the offer. */
  homeOn: 'Открывается при запуске',
  helpHint: 'Как это работает',
  rollLabelFor: 'Результат броска',
  /* Singular, and not the tab's word: the tab says "Сообщества" because it
     names a section, the label above the picker asks for one community. */
  communityLabel: 'Сообщество',

  notFound: 'Предмет не найден',
  notFoundSub: 'Возможно, ссылка устарела или данные были изменены.',
  noData: 'Данные не загрузились. Обновите страницу.',

  /* The stat line needs three words the vocabulary maps do not carry */
  tier: 'Ранг',
  eqTh: 'Пороги',
  eqScore: 'Броня',

  storageOff: 'Браузер не даёт сохранять: списки не переживут перезагрузку.'
} as const;

/** Every key the interface has. Derived, so the two sides cannot drift. */
export type Dict = Record<keyof typeof ru, string>;

const en: Dict = {
  docTitle: 'Daggerheart Loot Generator',
  skipToContent: 'Skip to content',
  sectionsLabel: 'Sections',
  langLabel: 'Language',
  close: 'Close',

  std: 'Standard rules',
  alt: 'Alt. tables',
  wondrous: 'Wondrous',
  dread: 'Dread',
  voa: 'Vault of Ages',
  community: 'Communities',
  tables: 'Tables',
  lists: 'Lists',
  search: 'Search',

  item: 'Item',
  cons: 'Consumable',
  craftInto: 'Upgrades to',
  craftFrom: 'Made from',

  copyName: 'Copy name',
  copyText: 'Copy text',
  copyImg: 'Copy image',
  sImg: 'Image',
  sText: 'Text',
  openPage: 'Page',
  showInTable: 'show in the table',
  rollNo: 'roll',

  srcCore: 'Core',
  srcHnf: 'Hope & Fear',
  srcWond: 'Wondrous',
  srcDread: 'Dread',
  srcVoa: 'Vault of Ages',
  srcFrame: 'Frame',
  srcComm: 'Communities',
  copyLink: 'Copy link',
  sendAll: 'Share',
  nameCopied: 'Name copied',
  imgCopied: 'Image copied',
  textCopied: 'Text copied',
  linkCopied: 'Link copied',
  copyFailed: 'Could not copy',

  roll: 'Roll',
  randomIn: 'Random',
  rollResult: 'Roll result',
  stepDown: 'One lower',
  stepUp: 'One higher',

  footBefore:
    'Data: Daggerheart Core Set, Hope & Fear, Wondrous Loot, Dread GM Toolbox, Vault of Ages, Community Magic Items, Alternate Loot & Consumable Tables. Russian text: daggerheart.su and custom material. Daggerheart © Darrington Press. This product includes materials from the Daggerheart System Reference Document 2.0, © Critical Role, LLC. under the terms of the Darrington Press Community Gaming (DPCGL) License. More information can be found at ',
  footLink: 'daggerheart.com',
  footAfter: '. There are no previous modifications by others.',

  pageWondrous: 'Wondrous Loot',
  pageDread: 'Dread GM Toolbox',
  pageVoa: 'Vault of Ages',
  pageCommunity: 'Community items',
  pageStd: 'Standard rules',
  subStd: 'A roll over the core book and the Hope & Fear tables.',
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  veryRare: 'Very rare',
  legendary: 'Legendary',
  source: 'Source',
  keepOneSource: 'At least one source has to stay on',
  filter: 'Type',
  fItems: 'Items',
  fCons: 'Consumables',
  keepOneKind: 'At least one type has to stay on',
  or: 'OR',
  copyRoll: 'Copy every option',
  subWondrous: 'Enter your roll result, or pick a random entry.',
  subVoa: 'Pick a section of the book and roll within it.',
  subCommunity: 'Pick an origin and roll d10.',
  voaSection: 'Section',
  voaArtifact: 'Artifacts',
  voaCursed: 'Cursed objects',
  voaArtifact1: 'Artifact',
  voaCursed1: 'Cursed object',
  unique: 'Unique',
  uniqueHint: 'Printed at a single tier - this one has no upgrade ladder',
  homeHint: 'Open this section on start',
  homeOn: 'Opens on start',
  helpHint: 'How this works',
  rollLabelFor: 'Roll result',
  communityLabel: 'Community',

  notFound: 'Item not found',
  notFoundSub: 'The link may be out of date, or the data has changed.',
  noData: 'The data did not load. Reload the page.',

  tier: 'Tier',
  eqTh: 'Thresholds',
  eqScore: 'Armor',

  storageOff: 'This browser will not save: lists are lost on reload.'
};

const DICTS: Record<Lang, Dict> = { ru, en };

export function dict(lang: Lang): Dict {
  return DICTS[lang];
}
