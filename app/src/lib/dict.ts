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
  docTitle: 'Генератор лута для Daggerheart',
  skipToContent: 'К содержимому',
  sectionsLabel: 'Разделы',
  langLabel: 'Язык',
  close: 'Закрыть',

  brand: 'Лут',
  brandSub: 'Daggerheart',

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
  imgCopied: 'Изображение скопировано',
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

  /* The line under each section heading */
  pageWondrous: 'Wondrous Loot',
  pageDread: 'Dread GM Toolbox',
  subWondrous: 'Введите результат броска или получите случайную позицию.',
  homeHint: 'Открывать этот раздел при запуске',
  rollLabelFor: 'Результат броска',

  notFound: 'Предмет не найден',
  notFoundSub: 'Возможно, ссылка устарела или данные были изменены.',
  noData: 'Данные не загрузились. Обновите страницу.',

  /* The stat line needs three words the vocabulary maps do not carry */
  tier: 'Ранг',
  eqTh: 'Пороги',
  eqScore: 'Броня',

  homeSet: 'Раздел стал стартовым',
  homeReset: 'Стартовый раздел сброшен',
  setHome: 'Сделать стартовым',
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

  brand: 'Loot',
  brandSub: 'Daggerheart',

  std: 'Core rules',
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
  subWondrous: 'Type the roll result or get a random entry.',
  homeHint: 'Open this section on start',
  rollLabelFor: 'Roll result',

  notFound: 'Item not found',
  notFoundSub: 'The link may be out of date, or the data has changed.',
  noData: 'The data did not load. Reload the page.',

  tier: 'Tier',
  eqTh: 'Thresholds',
  eqScore: 'Armor',

  homeSet: 'Starting section set',
  homeReset: 'Starting section cleared',
  setHome: 'Make this the start',
  storageOff: 'This browser will not save: lists are lost on reload.'
};

const DICTS: Record<Lang, Dict> = { ru, en };

export function dict(lang: Lang): Dict {
  return DICTS[lang];
}
