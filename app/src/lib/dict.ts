/* The interface dictionary.
 *
 * docs/specs/I18N.md keeps this separate from record text on purpose: this is
 * small, typed and reviewed, while record text is 1236 pairs maintained with
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

import type { Lang, Section } from './types.js';

const ru = {
  /* The chrome that has no text of its own, and so has no other place to be
     named. Without these the tab bar and the language group are unlabelled to
     a screen reader. */
  docTitle: 'Генератор лута — Daggerheart',
  skipToContent: 'К содержимому',
  sectionsLabel: 'Разделы',
  langLabel: 'Язык',
  close: 'Закрыть',

  /* The ten sections, in tab order */
  std: 'Обычные правила',
  alt: 'Альт. таблицы',
  wondrous: 'Wondrous',
  dread: 'Dread',
  voa: 'Vault of Ages',
  dv: "Dragon's Vault",
  community: 'Сообщества',
  tables: 'Таблицы',
  lists: 'Списки',
  search: 'Поиск',

  /* Outside the app a bare name loses the badge, so a consumable says so */
  item: 'Предмет',
  cons: 'Расходник',
  craftInto: 'Улучшается до',
  craftFrom: 'Получается из',
  /* The set line on a card: names the set, not a count, so one word covers
     any number of members (`docs/DECISIONS.md`, "Set membership"). */
  setLabel: 'Комплект',

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
  srcDv: "Dragon's Vault",
  /* Matches `frameF`/`subFrames` below - one word for the concept in
     Russian, verified against ru.daggerheart.su/frame ("Сеттинги" is both
     that page's own title and its term for one entry on it). */
  srcFrame: 'Сеттинг',
  srcComm: 'Сообщества',
  copyLink: 'Скопировать ссылку',
  sendAll: 'Отправить',
  nameCopied: 'Название скопировано',
  imgCopied: 'Картинка скопирована',
  textCopied: 'Текст скопирован',
  linkCopied: 'Ссылка скопирована',
  copyFailed: 'Не удалось скопировать',
  /* D13, paid off: the copy-all-options button gets its own toast. */
  rollCopied: 'Варианты скопированы',
  /* D10/D14/D15, paid off: a file:// document's own picture taints the
   *  canvas it is redrawn on, so the picture can never leave it - falls back
   *  to the record's text instead of reporting a false success. Distinct
   *  from a clipboard that simply refuses the picture, which offers a
   *  download instead (`imgSaved`/`imgFailed`), and from `copyFailed`, the
   *  generic every-other-copy-button wording. */
  imgTainted: 'Не удалось скопировать картинку - скопирован текст',
  imgSaved: 'Картинка сохранена',
  imgFailed: 'Не удалось сохранить картинку',

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
    "Данные: Daggerheart Core Set, Hope & Fear, Wondrous Loot, Dread GM Toolbox, Vault of Ages, The Dragon's Vault, Community Magic Items, Alternate Loot & Consumable Tables. Перевод: daggerheart.su и собственные материалы. Daggerheart © Darrington Press. This product includes materials from the Daggerheart System Reference Document 2.0, © Critical Role, LLC. under the terms of the Darrington Press Community Gaming (DPCGL) License. More information can be found at ",
  footLink: 'daggerheart.com',
  footAfter: '. There are no previous modifications by others.',

  /* The heading of each section, and the line under it. The heading is not
     always the tab's word: the tab says "Сообщества" and the page says
     "Предметы сообществ", because on the page it is the things that matter. */
  pageWondrous: 'Wondrous Loot',
  pageDread: 'Dread GM Toolbox',
  pageVoa: 'Vault of Ages',
  pageDv: "The Dragon's Vault",
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
  fEquip: 'Снаряжение',
  keepOneKind: 'Нужен хотя бы один тип',
  or: 'ИЛИ',
  copyRoll: 'Скопировать все варианты',
  subWondrous: 'Введите результат броска или получите случайную позицию.',
  subVoa: 'Выберите раздел книги и бросьте кость по нему.',
  subCommunity: 'Выберите происхождение и бросьте d10.',

  /* The alternate tables. Two dice with names instead of a sum, so each one
     is labelled and the card says which of them found it. */
  pageAlt: 'Альтернативные таблицы',
  subAlt: 'Бросок Костей Дуальности по объединённым таблицам обеих книг.',
  rarity: 'Редкость',
  hopeDie: 'Кость Надежды',
  fearDie: 'Кость Страха',
  rollDuality: 'Бросить кости',
  hope: 'Надежда',
  fear: 'Страх',
  crit: 'Критический успех!',
  critSub:
    'Игрок берёт любую позицию из таблицы этой редкости. Мастер может разрешить подняться на ступень выше.',
  /* One link per kind that is on; with a single kind there is nothing to tell
     apart and the label stays general. */
  openTable: 'Открыть таблицу',
  openItems: 'Таблица предметов',
  openCons: 'Таблица расходников',
  /* The whole phrase rather than "Поднять до" plus a rarity: Russian needs the
     genitive there, which no concatenation of the chip labels can produce.
     There is no `common` twin - a critical success only ever steps up. */
  bumpUncommon: 'Поднять до Необычной',
  bumpRare: 'Поднять до Редкой',
  bumpVeryRare: 'Поднять до Очень редкой',
  bumpLegendary: 'Поднять до Легендарной',

  voaSection: 'Раздел книги',
  voaArtifact: 'Артефакты',
  voaCursed: 'Проклятые предметы',
  /* Singular, for the badge on one card: it is a thing, not a shelf. */
  voaArtifact1: 'Артефакт',
  voaCursed1: 'Проклятый предмет',
  unique: 'Уникальное',
  uniqueHint: 'В книге стоит одним рангом — лестницы улучшений у этой вещи нет',
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
  /* The smallest error boundary: a page that throws mid-render draws
     this instead of leaving a blank middle under a working tab bar. */
  pageError: 'Что-то пошло не так на этой странице.',
  reloadPage: 'Обновить страницу',

  /* The stat line needs three words the vocabulary maps do not carry */
  tier: 'Ранг',
  eqTh: 'Пороги',
  eqScore: 'Броня',
  /* The equipment tables' own facet row labels */
  eqClass: 'Класс',
  eqDmg: 'Тип урона',
  eqTrait: 'Характеристика',
  eqRange: 'Дистанция',
  eqBurden: 'Хват',
  eqLineF: 'Линейка',

  /* The print card's own stat-strip labels: shorter than the interface's,
     because 63mm has no room for "Характеристика" - the layout says "Черта". */
  pcDmg: 'Урон',
  pcTrait: 'Черта',
  pcRange: 'Дистанция',
  pcArmor: 'Броня',
  thLight: 'Лёгкий урон',
  thMajor: 'Ощутимый урон',
  thSevere: 'Тяжёлый урон',

  /* The two groups the tab bar has no word for - both a slice through every
     book rather than a book of their own. */
  grpEquipment: 'Снаряжение',
  grpOther: 'Прочее',
  subStarting: 'Стартовые',
  subFrames: 'Сеттинги',
  /* The three equipment tables' sub-caption, shorter than the book's own name
     for the kind of gear - "Основное оружие" on the badge, "Оружие" here. */
  subWeapon: 'Оружие',
  subSecondary: 'Вторичное',
  subArmor: 'Броня',

  subTables:
    'Все таблицы целиком, включая оружие и броню, — можно листать, фильтровать и открывать карточки.',
  subLists: 'Соберите добычу в список и отправьте игрокам одной ссылкой.',
  /* "по всем N позициям" needs "всем" to agree with the numeral, so the
     sentence leaves it out and reads for any count. */
  subSearch:
    'Поиск сразу по 1236 позициям — добыча, расходники и снаряжение, на русском и на английском.',

  searchPh: 'Поиск по названию или описанию…',
  tableLink: 'Ссылка на таблицу',
  tableLinkCopied: 'Ссылка на таблицу скопирована',
  view: 'Вид',
  viewList: 'Списком',
  viewGrid: 'Сеткой',
  nothing: 'Ничего не найдено',
  startTyping: 'Начните вводить запрос',
  selectAll: 'Выбрать все',
  selected: 'Выбрано',
  clearSel: 'Снять выделение',
  copySel: 'Скопировать',
  selCopied: 'Выбранное скопировано',

  /* The table filter: the strip, the panel it folds open, and the link that
     hands the picked state to somebody else. */
  filters: 'Фильтры',
  kindF: 'Тип',
  frameF: 'Сеттинг',
  commF: 'Сообщество',
  anyValue: 'любое',
  outOf: 'из',
  dropValue: 'Убрать из фильтра',
  resetAll: 'Сбросить всё',
  filterLink: 'Ссылка на фильтры',
  filterLinkCopied: 'Ссылка на фильтры скопирована',

  /* A section heading's own link, off `sectionHead` in app.js - the table
     link button's sibling, one level down. */
  copySection: 'Скопировать ссылку на этот раздел',
  sectionLinkCopied: 'Ссылка на раздел скопирована',

  /* The add-to-list row every full card draws, and the toast it and the pin
     button both raise - app.js 109-164, 199-200. */
  addToList: 'Добавить в список',
  addTo: 'Добавить в',
  inLists: 'Лежит в списках',
  newList: 'Новый список',
  listNamePh: 'Например: клад дракона',
  create: 'Создать',
  cancel: 'Отмена',
  findList: 'Найти список',
  showMore: 'Показать ещё',
  addedTo: 'Добавлено в «%s»',
  removedFrom: 'Убрано из «%s»',
  nameFirst: 'Сначала назовите список',
  untitled: 'Без названия',
  saveFailed: 'Не удалось сохранить: браузер блокирует локальное хранилище',
  /* The shared page - app.js 3130-3170: a list from another player, the
     bad-link page's own link home, and the button that saves the shared
     list as a new own list. */
  sharedList: 'Список от другого игрока',
  saveShared: 'Сохранить себе',
  toStart: 'На главную',
  print: 'Печать',
  printHint: 'Собрать карточки для печати: девять на лист A4',
  printColor: 'Цветная',
  printBW: 'Чёрно-белая',
  printStd: 'Обычная',
  printCompact: 'Компактная',
  printSize: 'Размер карты',
  printNow: 'Отправить на печать',
  printLink: 'Ссылка на набор',
  printTitle: 'Печать карточек',
  printSub: 'Карточек: %n. Листов A4: %p. Размер карты 63×88 мм — как у обычной игральной.',
  printSubCompact: 'Карточек: %n. Листов A4: %p. Размер карты 44×63 мм — шестнадцать на лист.',
  printNote:
    'В окне печати выберите A4, книжную ориентацию и поля «нет». Лист светлый нарочно: так он читается и на чёрно-белом принтере, и не съедает картридж.',
  printEmpty: 'Печатать нечего: в адресе не нашлось ни одной вещи.',
  back: 'Назад',
  printTooMany:
    'За один раз печатается %n карточек, остальные %d в лист не попали. Разделите набор на части.',
  homeSet: 'Приложение будет открываться на этом разделе',
  homeReset: 'Приложение снова будет открываться на обычных правилах',

  /* The lists index - app.js 107-108/110-111/154/156/159-160/162-168/163/148,
     the storage notice's two live forms and the panel's restore row. */
  importList: 'Восстановить из ссылки',
  importBtn: 'Восстановить',
  importPh: 'Ссылка на список',
  dismiss: 'Скрыть',
  readMore: 'подробнее',
  listCreated: 'Список «%s» создан',
  noLists: 'Списков пока нет — создайте первый выше',
  share: 'Поделиться',
  del: 'Удалить',
  listEmpty: 'Список пуст',
  noStorageTitle: 'Браузер блокирует локальное хранилище.',
  noStorage:
    'Списки не сохранятся после перезагрузки страницы. Обычно так бывает в режиме инкогнито или при запрете сайту хранить данные. Ссылкой поделиться всё равно можно.',
  badStorageTitle: 'Сохранённые списки не удалось прочитать.',
  badStorage:
    'Похоже, их записала другая версия приложения, расширение браузера или другая вкладка на этом сайте. Исходное содержимое сохранено под отдельным ключом и не потеряно; дальнейшие изменения будут сохраняться заново, начиная с чистого списка.',
  localOnlyTitle: 'Списки живут только в этом браузере.',
  localOnly:
    'Сервера у приложения нет. Очистка данных сайта, режим инкогнито или другое устройство — и списки пропадут. Чтобы не потерять, нажмите «Ссылка себе»: весь состав закодирован прямо в адресе, и список восстанавливается из неё целиком, вместе с обеими заметками. Эта ссылка только для вас — в ней есть и то, что вы писали в «Только для мастера». Игрокам отправляйте «Ссылка игрокам» или результат кнопки «Скопировать текст»: туда попадает лишь то, что написано в «Для игроков». В адресной строке браузера тоже лежит ссылка для игроков, так что скопировать её оттуда безопасно. Только помните, что ссылка — это снимок: она помнит список таким, каким он был в момент копирования. Добавили позицию или поправили заметку — сохраните ссылку заново.',
  deleteConfirm: 'Удалить список «%s»? Это действие необратимо.',
  /* Delete gets an undo, like every other destructive action. */
  listDeleted: 'Список «%s» удалён',
  playersLinkCopied: 'Ссылка для игроков скопирована — заметок мастера в ней нет',
  badShare: 'Ссылка повреждена или собрана в другой версии данных.',
  /* An old link naming a renumbered or deleted record would otherwise lose
     those entries with no sign anything was missing - toasted once, on the
     shared page and after restoring a copy. */
  droppedItems: 'Пропущено позиций: %n — их больше нет в данных',

  /* The list page - app.js 114-195, the address, the actions, the notes,
     the roll panel and a row's own controls. */
  rename: 'Название списка',
  sharePlayers: 'Ссылка игрокам',
  shareGm: 'Ссылка себе',
  gmLinkCopied: 'Ссылка со всеми заметками скопирована — она только для вас',
  listCopied: 'Список скопирован',
  listEmptyHint:
    'Пока пусто. Откройте «Таблицы» или «Поиск», отметьте нужное галочками и нажмите «Добавить в список» — или сделайте это прямо с карточки предмета.',
  listNotFound: 'Список не найден',
  listNotFoundSub: 'Возможно, он удалён или открыт в другом браузере.',
  rollBy: 'Бросок по списку',
  rollHint: 'Бросьте кубик и введите результат — или нажмите кнопку',
  clear: 'Сбросить',
  note: 'Заметка',
  listNote: 'Заметки',
  noteHead: 'Заметка',
  notePub: 'Для игроков',
  noteHid: 'Только для мастера',
  notePubHint: 'уедет с текстом и ссылкой для игроков',
  noteHidHint: 'останется у вас',
  listNotePhPub: 'Например: лавка закрыта до утра',
  listNotePhHid: 'Например: позиции 9-10 лежат под прилавком',
  notePhPub: 'Как предмет выглядит, что о нём знают',
  notePhHid: 'Хоумбрю, подвох, что знает только мастер',
  noteClear: 'Очистить заметку',
  noteCleared: 'Заметка очищена',
  qty: 'Кол-во',
  gold: 'Золото',
  position: 'Позиция в списке',
  dragHint: 'Перетащите, чтобы изменить порядок',
  removeItem: 'Убрать из списка',
  removedItem: '«%s» убран',
  movedItem: '«%s» — позиция %n из %m',
  undo: 'Вернуть',
  pickAll: 'Выбрать все',
  pickedN: 'Выбрано',
  /* A selection's taken count and total - colon forms, so a count and a
     record name never have to agree with a word (I18N.md, "Rules"). */
  total: 'Итого',
  unpricedN: 'без цены: %n',
  pickQty: 'Сколько',
  pickQtyOf: 'Сколько: %s',
  moneyAs: 'Отображение цен',
  money_bag: 'Как в книге',
  money_coin: 'Монетами',
  goldUnit: 'зол.',
  batchMoney: 'Цены',
  batchNoPrice: 'Убрать цену',
  repricePct: 'Изменить на, %',
  repriceDown: 'Сделать скидку',
  repriceUp: 'Поднять цену',
  repriceHint: 'Минус — скидка, плюс — наценка. Считается от текущей цены.',
  repriceDone: 'Цены пересчитаны',
  repriceUndo: 'Вернуть',
  batchDeleted: 'Убрано из списка',
  guessApply: 'Проставить эти цены',
  guessWhy:
    'В книге цен нет: Core (с. 105) оставляет их мастеру. Порядок величин взят из общей таблицы сообщества — у снаряжения по рангу, у добычи по редкости. Это не канон, а точка отсчёта; выбранным строкам цены будут перезаписаны.',
  guessNoTier: 'нечем оценить',
  guessNoRarity: 'редкость не указана',
  guessDone: 'Цены проставлены'
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
  dv: "Dragon's Vault",
  community: 'Communities',
  tables: 'Tables',
  lists: 'Lists',
  search: 'Search',

  item: 'Item',
  cons: 'Consumable',
  craftInto: 'Upgrades to',
  craftFrom: 'Made from',
  setLabel: 'Set',

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
  srcDv: "Dragon's Vault",
  srcFrame: 'Frame',
  srcComm: 'Communities',
  copyLink: 'Copy link',
  sendAll: 'Share',
  nameCopied: 'Name copied',
  imgCopied: 'Image copied',
  textCopied: 'Text copied',
  linkCopied: 'Link copied',
  copyFailed: 'Could not copy',
  rollCopied: 'Options copied',
  imgTainted: 'Could not copy the image - copied the text instead',
  imgSaved: 'Image saved',
  imgFailed: 'Could not save the image',

  roll: 'Roll',
  randomIn: 'Random',
  rollResult: 'Roll result',
  stepDown: 'One lower',
  stepUp: 'One higher',

  footBefore:
    "Data: Daggerheart Core Set, Hope & Fear, Wondrous Loot, Dread GM Toolbox, Vault of Ages, The Dragon's Vault, Community Magic Items, Alternate Loot & Consumable Tables. Russian text: daggerheart.su and custom material. Daggerheart © Darrington Press. This product includes materials from the Daggerheart System Reference Document 2.0, © Critical Role, LLC. under the terms of the Darrington Press Community Gaming (DPCGL) License. More information can be found at ",
  footLink: 'daggerheart.com',
  footAfter: '. There are no previous modifications by others.',

  pageWondrous: 'Wondrous Loot',
  pageDread: 'Dread GM Toolbox',
  pageVoa: 'Vault of Ages',
  pageDv: "The Dragon's Vault",
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
  fEquip: 'Equipment',
  keepOneKind: 'At least one type has to stay on',
  or: 'OR',
  copyRoll: 'Copy every option',
  subWondrous: 'Enter your roll result, or pick a random entry.',
  subVoa: 'Pick a section of the book and roll within it.',
  subCommunity: 'Pick an origin and roll d10.',

  pageAlt: 'Alternate tables',
  subAlt: 'A Duality Dice roll over both books merged into one set of tables.',
  rarity: 'Rarity',
  hopeDie: 'Hope Die',
  fearDie: 'Fear Die',
  rollDuality: 'Roll the dice',
  hope: 'Hope',
  fear: 'Fear',
  crit: 'Critical success!',
  critSub:
    'The player takes any entry from this rarity table. The GM may allow bumping up one rarity.',
  openTable: 'Open table',
  openItems: 'Items table',
  openCons: 'Consumables table',
  bumpUncommon: 'Bump to Uncommon',
  bumpRare: 'Bump to Rare',
  bumpVeryRare: 'Bump to Very rare',
  bumpLegendary: 'Bump to Legendary',

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
  pageError: 'Something went wrong on this page.',
  reloadPage: 'Reload the page',

  tier: 'Tier',
  eqTh: 'Thresholds',
  eqScore: 'Armor',
  eqClass: 'Class',
  eqDmg: 'Damage type',
  eqTrait: 'Trait',
  eqRange: 'Range',
  eqBurden: 'Burden',
  eqLineF: 'Line',

  pcDmg: 'Damage',
  pcTrait: 'Trait',
  pcRange: 'Range',
  pcArmor: 'Armor',
  thLight: 'Minor damage',
  thMajor: 'Major damage',
  thSevere: 'Severe damage',

  grpEquipment: 'Equipment',
  grpOther: 'Other',
  subStarting: 'Starting',
  subFrames: 'Frames',
  subWeapon: 'Weapons',
  subSecondary: 'Secondary',
  subArmor: 'Armor',

  subTables: 'Every table in full, weapons and armor included — browse, filter and open cards.',
  subLists: 'Collect loot into a list and send it to your players as a single link.',
  subSearch:
    'Search all 1236 entries at once — loot, consumables and equipment, in Russian and English.',

  searchPh: 'Search by name or description…',
  tableLink: 'Link to this table',
  tableLinkCopied: 'Table link copied',
  view: 'View',
  viewList: 'List',
  viewGrid: 'Grid',
  nothing: 'Nothing found',
  startTyping: 'Start typing',
  selectAll: 'Select all',
  selected: 'Selected',
  clearSel: 'Clear selection',
  copySel: 'Copy',
  selCopied: 'Selection copied',

  filters: 'Filters',
  kindF: 'Type',
  frameF: 'Frame',
  commF: 'Community',
  anyValue: 'any',
  outOf: 'of',
  dropValue: 'Remove from the filter',
  resetAll: 'Reset all',
  filterLink: 'Filter link',
  filterLinkCopied: 'Filter link copied',

  copySection: 'Copy a link to this section',
  sectionLinkCopied: 'Section link copied',

  addToList: 'Add to list',
  addTo: 'Add to',
  inLists: 'Sits in lists',
  newList: 'New list',
  listNamePh: 'For example: dragon hoard',
  create: 'Create',
  cancel: 'Cancel',
  findList: 'Find a list',
  showMore: 'Show more',
  addedTo: 'Added to "%s"',
  removedFrom: 'Removed from "%s"',
  nameFirst: 'Give the list a name first',
  untitled: 'Untitled',
  saveFailed: 'Could not save: the browser is blocking local storage',
  sharedList: 'A list from another player',
  saveShared: 'Save to my lists',
  toStart: 'Home',
  print: 'Print',
  printHint: 'Lay these out for printing: nine to an A4 sheet',
  printColor: 'Colour',
  printBW: 'Black and white',
  printStd: 'Standard',
  printCompact: 'Compact',
  printSize: 'Card size',
  printNow: 'Send to printer',
  printLink: 'Link to this set',
  printTitle: 'Printing cards',
  printSub: 'Cards: %n. A4 sheets: %p. Card size 63×88 mm - the size of a playing card.',
  printSubCompact: 'Cards: %n. A4 sheets: %p. Card size 44×63 mm - sixteen to a sheet.',
  printNote:
    'In the print dialog pick A4, portrait, and margins "none". The sheet is light on purpose: it reads on a black-and-white printer and does not drain the cartridge.',
  printEmpty: 'Nothing to print: the address holds no items.',
  back: 'Back',
  printTooMany:
    'One run prints %n cards; the remaining %d did not make it onto a sheet. Split the set in two.',
  homeSet: 'The app will open on this section',
  homeReset: 'The app will open on the standard rules again',

  importList: 'Restore from a link',
  importBtn: 'Restore',
  importPh: 'Paste a list link',
  dismiss: 'Dismiss',
  readMore: 'more',
  listCreated: 'List "%s" created',
  noLists: 'No lists yet — create one above',
  share: 'Share',
  del: 'Delete',
  listEmpty: 'The list is empty',
  noStorageTitle: 'The browser is blocking local storage.',
  noStorage:
    'Lists will not survive a page reload. This usually happens in private mode or when the site is denied storage. Sharing a link still works.',
  badStorageTitle: 'The saved lists could not be read.',
  badStorage:
    'Something else on this site - another build, a browser extension, or another tab - seems to have written them. The original content was kept under a separate key rather than lost; further changes save again from a clean list.',
  localOnlyTitle: 'Lists live in this browser only.',
  localOnly:
    'The app has no server. Clearing site data, a private window or another device, and the lists are gone. To keep one, press "Your own link": the whole list is encoded in the address and comes back from it entire, both notes included. That link is for you alone — it carries whatever you wrote under "GM only". Send players the "Players\' link" or the result of "Copy text": only what is written under "For players" goes there. The browser\'s own address bar holds the players\' link too, so copying it from there is safe. Do remember that a link is a snapshot: it holds the list as it was when you copied it. Add an entry or edit a note and save the link again.',
  deleteConfirm: 'Delete the list "%s"? This cannot be undone.',
  listDeleted: 'List "%s" deleted',
  playersLinkCopied: "Players' link copied — it carries no GM notes",
  badShare: 'The link is damaged or was built from a different data version.',
  droppedItems: 'Skipped %n items — no longer in the data',

  rename: 'List name',
  sharePlayers: "Players' link",
  shareGm: 'Your own link',
  gmLinkCopied: 'Link with every note copied — this one is for you',
  listCopied: 'List copied',
  listEmptyHint:
    'Nothing here yet. Open Tables or Search, tick what you need and press "Add to list" — or do it straight from an item card.',
  listNotFound: 'List not found',
  listNotFoundSub: 'It may have been deleted, or it lives in another browser.',
  rollBy: 'Roll on this list',
  rollHint: 'Roll a die and type the result - or press the button',
  clear: 'Clear',
  note: 'Note',
  listNote: 'Notes',
  noteHead: 'Note',
  notePub: 'For players',
  noteHid: 'GM only',
  notePubHint: "travels with the text and the players' link",
  noteHidHint: 'stays with you',
  listNotePhPub: 'e.g. the shop is shut until morning',
  listNotePhHid: 'e.g. entries 9-10 are kept under the counter',
  notePhPub: 'What it looks like, what is known about it',
  notePhHid: 'Homebrew, the catch, what only the GM knows',
  noteClear: 'Clear the note',
  noteCleared: 'Note cleared',
  qty: 'Qty',
  gold: 'Gold',
  position: 'Position in the list',
  dragHint: 'Drag to reorder',
  removeItem: 'Remove from the list',
  removedItem: '"%s" removed',
  movedItem: '"%s" - position %n of %m',
  undo: 'Undo',
  pickAll: 'Select all',
  pickedN: 'Selected',
  total: 'Total',
  unpricedN: 'no price: %n',
  pickQty: 'How many',
  pickQtyOf: 'How many: %s',
  moneyAs: 'Price display',
  money_bag: 'As in the book',
  money_coin: 'In coins',
  goldUnit: 'gp',
  batchMoney: 'Prices',
  batchNoPrice: 'Clear price',
  repricePct: 'Change by, %',
  repriceDown: 'Discount',
  repriceUp: 'Mark up',
  repriceHint: 'Minus discounts, plus marks up. Counted from the current price.',
  repriceDone: 'Prices recalculated',
  repriceUndo: 'Undo',
  batchDeleted: 'Removed from the list',
  guessApply: 'Set these prices',
  guessWhy:
    'The book has no prices: Core (p. 105) leaves them to the GM. These magnitudes come from the community spreadsheet - by tier for equipment, by rarity for loot. Not canon, a starting point; the selected rows will have their prices overwritten.',
  guessNoTier: 'nothing to go on',
  guessNoRarity: 'no rarity given',
  guessDone: 'Prices set'
};

const DICTS: Record<Lang, Dict> = { ru, en };

export function dict(lang: Lang): Dict {
  return DICTS[lang];
}

/** D5/O3, paid off: which dictionary key names a section, for the tab title
 *  (`<section label> — <docTitle>`). Mirrors `TabBar.svelte`'s own `TABS`
 *  pairing exactly - the exhaustive `Record<Section, ...>` is what keeps the
 *  two from drifting apart the moment a tenth section arrives. */
export const SECTION_LABEL: Record<Section, keyof Dict> = {
  'roll/std': 'std',
  'roll/alt': 'alt',
  'roll/wondrous': 'wondrous',
  'roll/dread': 'dread',
  'roll/voa': 'voa',
  'roll/dv': 'dv',
  'roll/community': 'community',
  tables: 'tables',
  lists: 'lists',
  search: 'search'
};
