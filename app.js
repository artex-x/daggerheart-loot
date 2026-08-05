/* ============================================================
   Daggerheart Loot Generator — vanilla JS, no build step
   ============================================================ */
(function () {
'use strict';

const DATA = window.LOOT.items;
const ALT  = window.LOOT.alt;

/* ---------- index by id ---------- */
const BY_ID = {};
Object.keys(DATA).forEach(k => DATA[k].forEach(it => { BY_ID[it.id] = it; }));
const ALL = Object.keys(DATA).reduce((a, k) => a.concat(DATA[k]), []);

/* ---------- equipment ----------
   Weapons and armour are not loot rolled off a table: they have stats, so they
   are stored apart and carry an `eq` block instead of a roll number. Eleven
   Wondrous entries are equipment too — those keep their place in the roll table
   and simply gained the same block, so they show up in both places from one
   record rather than being copied. */
const EQ = window.LOOT.eq || [];
EQ.forEach(function (it) { BY_ID[it.id] = it; });
const SEARCHABLE = ALL.concat(EQ);

/* ---------- crafting chains ----------
   A record carries `craft` — the id of what it turns into — when it can be
   upgraded. The reverse direction ("made from") is derived here rather than
   stored, so the two halves can never drift apart. */
const CRAFTED_FROM = {};
ALL.forEach(function (it) {
  if (it.craft && BY_ID[it.craft]) CRAFTED_FROM[it.craft] = it.id;
});

/* Cards from the rulebook that item descriptions point at (a spell, a grimoire
   feature, a beastform). Kept beside the items so a player who is handed the
   item also gets the text they would otherwise have to look up. */
const REFS = window.LOOT.refs || {};

/* ---------- state ---------- */
const S = {
  lang: 'ru',
  route: '',
  std:  { n: 1, src: { core: true, hnf: true } },
  alt:  { rarity: 'common', hope: 1, fear: 2 },
  wond: { n: 1 },
  comm: { c: 'Highborne', n: 1 },
  tables: { t: 'core_item', q: '', view: 'list', anchor: '' },
  search: { q: '' },
  help: '',
  kind: { item: true, consumable: true, equip: true },  // shared filter, applies wherever they can show up
  /* equipment facets: only the values switched off are kept, so an untouched
     filter is an empty object and the shareable link stays short */
  eqOff: {},
  eqOpen: false,
  lists: [],
  /* Selection replaced the old "I am filling list X" mode. Nothing is sticky:
     it holds ids for the page you are on and clears when you leave. */
  sel: {},
  modal: '',        // item shown in the modal, so it can be redrawn with the page
  menuFor: '',      // which control has its list menu open ('' = none, 'sel' = the bar)
  listDraft: '',
  listRoll: { id: '', n: 0 },
  newListFor: '',
  newListDraft: '',
  openList: '',    // локальный список, которому принадлежит текущий адрес
  urlPayload: '',  // код, который мы сами записали в адрес
  importDraft: '',
  pickQ: ''
};

/* ---------- i18n ---------- */
const T = {
  ru: {
    tabs: { std:'Обычные правила', alt:'Альт. таблицы', wondrous:'Wondrous', community:'Сообщества', tables:'Таблицы', lists:'Списки', search:'Поиск' },
    or:'ИЛИ',
    item:'Предмет', cons:'Расходник',
    srcCore:'Core', srcHnf:'Hope & Fear', srcWond:'Wondrous', srcComm:'Сообщества',
    rollResult:'Результат броска', roll:'Бросить', randomIn:'Случайно', rollDuality:'Бросить кости',
    copyName:'Скопировать название', copied:'Скопировано',
    rarity:'Редкость', tier:'Ранг',
    viewGrid:'Сеткой', viewList:'Списком', view:'Вид',
    common:'Обычная', uncommon:'Необычная', rare:'Редкая', veryRare:'Очень редкая', legendary:'Легендарная',
    hopeDie:'Кость Надежды', fearDie:'Кость Страха',
    crit:'Критический успех!', critSub:'Игрок берёт любую позицию из таблицы этой редкости. Мастер может разрешить подняться на ступень выше.',
    bumpTo:'Поднять до',
    filter:'Тип', fItems:'Предметы', fCons:'Расходники', fEquip:'Снаряжение',
    keepOneKind:'Нужен хотя бы один тип',
    eqTrait:'Характеристика', eqRange:'Дистанция', eqDmg:'Тип урона',
    eqBurden:'Хват', eqLineF:'Линейка', eqTh:'Пороги', eqScore:'Броня', filters:'Фильтры',
    eqClass:'Класс', keepOneValue:'Хотя бы одно значение должно остаться',
    resetAll:'Сбросить всё', filterLink:'Ссылка на фильтры',
    filterLinkCopied:'Ссылка на фильтры скопирована',
    community:'Сообщество', source:'Источник', keepOneSource:'Нужен хотя бы один источник',
    importList:'Восстановить из ссылки', importBtn:'Восстановить',
    importPh:'Ссылка на список',
    cancel:'Отмена',
    dismiss:'Скрыть',
    addTo:'Добавить в', inLists:'Лежит в списках',
    selected:'Выбрано', selectAll:'Выбрать все', clearSel:'Снять выделение',
    copySel:'Скопировать', selCopied:'Выбранное скопировано',
    addedTo:'Добавлено в «%s»', removedFrom:'Убрано из «%s»',
    qty:'Кол-во', gold:'Золото', goldUnit:'зол.',
    note:'Заметка', listNote:'Заметка мастера',
    noteInLink:'видна всем, у кого есть ссылка',
    listNotePh:'Например: позиции 9-10 лежат под прилавком',
    notePh:'Внешний вид, хоумбрю, что знает мастер',
    noteCopyItem:'Копировать вместе с предметом', noteCopyList:'Копировать вместе со списком',
    rollInList:'Бросок по списку', clear:'Сбросить',
    dragHint:'Перетащите, чтобы изменить порядок', position:'Позиция в списке',
    listNotFound:'Список не найден', listNotFoundSub:'Возможно, он удалён или открыт в другом браузере.',
    lists:'Списки', newList:'Новый список', listNamePh:'Например: клад дракона', create:'Создать',
    findList:'Найти список', listCreated:'Список «%s» создан',
    untitled:'Без названия', noLists:'Списков пока нет — создайте первый выше',
    addToList:'Добавить в список', removeItem:'Убрать из списка',
    share:'Поделиться', del:'Удалить', rename:'Название списка',
    listEmpty:'Список пуст', listEmptyHint:'Пока пусто. Откройте «Таблицы» или «Поиск», отметьте нужное галочками и нажмите «Добавить в список» — или сделайте это прямо с карточки предмета.',
    sharedList:'Список от другого игрока', saveToMine:'Сохранить себе', savedToLists:'Список сохранён',
    badShare:'Ссылка повреждена или собрана в другой версии данных.',
    deleteConfirm:'Удалить список «%s»? Это действие необратимо.',
    saveFailed:'Не удалось сохранить: браузер блокирует локальное хранилище',
    noStorageTitle:'Браузер блокирует локальное хранилище.',
    noStorage:'Списки не сохранятся после перезагрузки страницы. Обычно так бывает в режиме инкогнито или при запрете сайту хранить данные. Ссылкой поделиться всё равно можно.',
    localOnlyTitle:'Списки живут только в этом браузере.',
    localOnly:'Сервера у приложения нет. Очистка данных сайта, режим инкогнито или другое устройство — и списки пропадут. Чтобы не потерять, сохраните ссылку: весь состав закодирован прямо в адресе, и список восстанавливается из неё целиком, вместе с заметками. Только помните, что ссылка — это снимок: она помнит список таким, каким он был в момент копирования. Добавили позицию или поправили заметку — сохраните ссылку заново, иначе старая вернёт вас к прежней версии. Если заметки не для игроков, отправляйте им не ссылку, а результат кнопки «Скопировать текст»: в него попадут только те заметки, у которых вы отметили галочку «Копировать вместе с предметом». Остальные останутся у вас.',
    searchPh:'Поиск по названию или описанию…',
    nothing:'Ничего не найдено',
    sendAll:'Отправить', copyText:'Скопировать текст', copyImg:'Скопировать изображение',
    imgCopied:'Картинка скопирована', imgSaved:'Картинка сохранена', imgFailed:'Не удалось получить картинку',
    copyLink:'Скопировать ссылку', copySection:'Скопировать ссылку на этот раздел',
    linkCopied:'Ссылка скопирована', nameCopied:'Название скопировано', textCopied:'Текст скопирован',
    tableLinkCopied:'Ссылка на таблицу скопирована', sectionLinkCopied:'Ссылка на раздел скопирована',
    listLinkCopied:'Ссылка на список скопирована',
    listCopied:'Список скопирован', copyFailed:'Не удалось скопировать',
    sImg:'Картинка', sText:'Текст', tableLink:'Ссылка на таблицу',
    copyRoll:'Скопировать все варианты', rollCopied:'Варианты скопированы',
    openPage:'Страница', openTable:'Открыть таблицу', toStart:'На главную',
    craftInto:'Улучшается до', craftFrom:'Получается из',
    rollNo:'номер', notFound:'Предмет не найден', notFoundSub:'Возможно, ссылка устарела или данные были изменены.',
    hope:'Надежда', fear:'Страх',
    foot:'Данные: Daggerheart Core Set, Hope &amp; Fear, Wondrous Loot, Community Magic Items, Alternate Loot &amp; Consumable Tables. Перевод: daggerheart.su и собственные материалы. Daggerheart © Darrington Press.',
    whatIsThis:'Как это работает',
    help: {
      std: [
        'Бросьте d12 и сложите результаты — сумма и есть номер в таблице. Одно и то же число есть и в таблице предметов, и в таблице расходников, поэтому на один бросок приходится несколько вариантов, а игрок выбирает один.',
        'Сколько костей брать, решает редкость добычи — она подписана под каждой кнопкой. Где какая редкость уместна:<br><b>Обычная</b> — заброшенный лагерь, обычная лавка.<br><b>Необычная</b> — ограниченный товар в лавке, тайник в лагере, часть награды.<br><b>Редкая</b> — под замком в лавке, единственная награда за работу, вещи сильного НИП.<br><b>Легендарная</b> — единственная в своём роде, награда за смертельно опасное дело, сокровище могущественного противника.',
        'Ранги у редкостей — рекомендация, а не ограничение. Мастер вправе выдать снаряжение любой редкости на любом уровне, если это уместно за столом.',
      ],
      alt: [
        'Предметы разнесены по колонкам «Надежда» и «Страх» по смыслу: в «Надежде» то, что помогает, защищает и решает задачи, в «Страхе» — то, что вредит, обманывает и работает исподтишка.',
        'Выберите редкость и бросьте Кости Дуальности. Игрок выбирает между вариантом по Кости Надежды и вариантом по Кости Страха.',
        'При критическом успехе, когда обе кости совпали, игрок берёт любую позицию из таблицы этой редкости, а Мастер может разрешить подняться на ступень выше.',
        'Ранги у редкостей — рекомендация, а не ограничение.',
        'Автор таблиц: <a href="https://www.reddit.com/user/PrinceOfNowhereee/" target="_blank" rel="noopener">PrinceOfNowhereee</a>. Источник: <a href="https://www.reddit.com/r/daggerheart/comments/1v3z3gm/alternate_loot_tables_combining_hope_fear_with/" target="_blank" rel="noopener">пост на Reddit</a>.'
      ],
      wondrous: [
        'В таблице 119 позиций, а не 100 — столько предметов описано в самом дополнении. Кости на такой диапазон не бывает, поэтому кнопка выбирает позицию случайно. Если бросаете d100 за столом, введите выпавшее число в поле «Результат броска».',
        'Порядок взят из книги: там предметы отсортированы по английскому алфавиту, а не по силе. В русском переводе он поэтому выглядит произвольным. Большинство предметов слабые или средние.',
        'Часть предметов улучшается до более сильных. На карточке такая связь показана отдельной строкой, по ней же можно перейти ко второму предмету. Мастер может потребовать для улучшения бросок Искусности или Знания.',
        'Источник: дополнение <a href="https://www.drivethrurpg.com/en/product/552648/wondrous-environments" target="_blank" rel="noopener">Wondrous Environments</a>.'
      ],
      community: [
        'Предметы каждого сообщества перечислены по возрастанию редкости: 1 — самый простой, 10 — самый сильный.',
        'Такие предметы уместны как награда от сообщества, семейная реликвия или находка на его территории.',
        'Источник: дополнение <a href="https://www.drivethrurpg.com/en/product/558159/community-magic-items-a-daggerheart-compatible-toolkit" target="_blank" rel="noopener">Community Magic Items</a>.'
      ],
      tables: [
        'Здесь лежат все таблицы целиком: добыча и расходники из корника, Hope &amp; Fear, Wondrous Loot и предметов сообществ, альтернативные таблицы, а также оружие, вторичное оружие и броня.',
        'Снаряжение устроено иначе, чем добыча: у него нет номера в таблице, зато есть характеристика, дистанция, урон, хват или пороги с Показателем Брони. Всё это видно в строке и уезжает вместе с предметом при копировании.',
        'Порядок и разбивка взяты из книг: внутри каждого ранга сначала физическое оружие Core, потом магическое, затем то же для Hope &amp; Fear.',
        '<b>Класс</b> — это раздел книги, а не тип урона. Магическому оружию нужна Характеристика Заклинателя, даже если урон оно наносит физический: Призрачный Клинок магический, а урон у него «физ/маг». Поэтому класс и урон показаны отдельно, а оружие с уроном «физ/маг» попадает в оба фильтра сразу.',
        'Фильтр «Линейка» делит снаряжение надвое. <b>Улучшаемые</b> — вещи, у которых есть версии повыше: Улучшенная, Продвинутая и Легендарная Катана — это одна и та же катана на четырёх рангах. <b>Уникальные</b> — то, что существует в единственном виде и не улучшается.',
        'Фильтры складываются по «или» внутри строки и по «и» между строками, а начинают с того, что включено всё. Кнопка «Ссылка на фильтры» отдаёт адрес с текущим набором — по нему таблица откроется в том же виде.',
        'Одиннадцать предметов из Wondrous Loot на самом деле оружие. В этих таблицах их нет — они остались в своей таблице Wondrous, но выглядят и копируются как снаряжение.',
        'Источники: Daggerheart Core Set и Hope &amp; Fear. Русские названия и формулировки — перевод <a href="https://ru.daggerheart.su/" target="_blank" rel="noopener">daggerheart.su</a>, для Hope &amp; Fear — таблица сообщества. Значения даны с учётом эрраты.'
      ],
      lists: [
        'Создайте список, нажмите «Пополнить» и ходите по таблицам — на карточках и строках появится кнопка «+». Либо кликните по картинке предмета и отметьте нужные списки в блоке «В списки».',
        'Весь состав списка закодирован прямо в адресе страницы и обновляется при каждой правке. Поэтому отправить список можно и кнопкой «Поделиться», и просто скопировав адрес из строки браузера — это одна и та же ссылка. Сервер не нужен: тот, кто её откроет, увидит список и сможет сохранить копию себе.',
        'Поле «Восстановить из ссылки» принимает такую ссылку обратно — получится обычный список, который можно править. Хранятся в нём только название и id позиций, поэтому правки в данных подхватятся сами.'
      ]
    },
    pages: {
      std:   ['Обычные правила', 'Бросок по таблицам корника и дополнения Hope &amp; Fear.'],
      alt:   ['Альтернативные таблицы', 'Бросок Костей Дуальности по объединённым таблицам обеих книг.'],
      wondrous: ['Wondrous Loot', 'Введите результат броска или получите случайную позицию.'],
      community: ['Предметы сообществ', 'Выберите происхождение и бросьте d10.'],
      tables: ['Таблицы', 'Все таблицы целиком, включая оружие и броню, — можно листать, фильтровать и открывать карточки.'],
      lists: ['Списки', 'Соберите добычу в список и отправьте игрокам одной ссылкой.'],
      search: ['Поиск', 'Поиск по всем 828 позициям сразу — добыча, расходники и снаряжение, на русском и на английском.']
    },
  },
  en: {
    tabs: { std:'Standard rules', alt:'Alt. tables', wondrous:'Wondrous', community:'Communities', tables:'Tables', lists:'Lists', search:'Search' },
    or:'OR',
    item:'Item', cons:'Consumable',
    srcCore:'Core', srcHnf:'Hope & Fear', srcWond:'Wondrous', srcComm:'Communities',
    rollResult:'Roll result', roll:'Roll', randomIn:'Random', rollDuality:'Roll the dice',
    copyName:'Copy name', copied:'Copied',
    rarity:'Rarity', tier:'Tier',
    viewGrid:'Grid', viewList:'List', view:'View',
    common:'Common', uncommon:'Uncommon', rare:'Rare', veryRare:'Very rare', legendary:'Legendary',
    hopeDie:'Hope Die', fearDie:'Fear Die',
    crit:'Critical success!', critSub:'The player takes any entry from this rarity table. The GM may allow bumping up one rarity.',
    bumpTo:'Bump to',
    filter:'Type', fItems:'Items', fCons:'Consumables', fEquip:'Equipment',
    keepOneKind:'At least one type has to stay on',
    eqTrait:'Trait', eqRange:'Range', eqDmg:'Damage type',
    eqBurden:'Burden', eqLineF:'Line', eqTh:'Thresholds', eqScore:'Armor', filters:'Filters',
    eqClass:'Class', keepOneValue:'At least one value has to stay on',
    resetAll:'Reset all', filterLink:'Filter link',
    filterLinkCopied:'Filter link copied',
    community:'Community', source:'Source', keepOneSource:'At least one source has to stay on',
    importList:'Restore from a link', importBtn:'Restore',
    importPh:'Paste a list link',
    cancel:'Cancel',
    dismiss:'Dismiss',
    addTo:'Add to', inLists:'Sits in lists',
    selected:'Selected', selectAll:'Select all', clearSel:'Clear selection',
    copySel:'Copy', selCopied:'Selection copied',
    addedTo:'Added to "%s"', removedFrom:'Removed from "%s"',
    qty:'Qty', gold:'Gold', goldUnit:'gp',
    note:'Note', listNote:'GM note',
    noteInLink:'anyone with the link can read it',
    listNotePh:'For example: entries 9-10 are kept under the counter',
    notePh:'Looks, homebrew, what the GM knows',
    noteCopyItem:'Copy along with the item', noteCopyList:'Copy along with the list',
    rollInList:'Roll within the list', clear:'Clear',
    dragHint:'Drag to reorder', position:'Position in the list',
    listNotFound:'List not found', listNotFoundSub:'It may have been deleted, or it lives in another browser.',
    lists:'Lists', newList:'New list', listNamePh:'For example: dragon hoard', create:'Create',
    findList:'Find a list', listCreated:'List “%s” created',
    untitled:'Untitled', noLists:'No lists yet — create one above',
    addToList:'Add to list', removeItem:'Remove from the list',
    share:'Share', del:'Delete', rename:'List name',
    listEmpty:'The list is empty', listEmptyHint:'Nothing here yet. Open Tables or Search, tick what you need and press “Add to list” — or do it straight from an item card.',
    sharedList:'A list from another player', saveToMine:'Save to my lists', savedToLists:'List saved',
    badShare:'The link is damaged or was built from a different data version.',
    deleteConfirm:'Delete the list "%s"? This cannot be undone.',
    saveFailed:'Could not save: the browser is blocking local storage',
    noStorageTitle:'The browser is blocking local storage.',
    noStorage:'Lists will not survive a page reload. This usually happens in private mode or when the site is denied storage. Sharing a link still works.',
    localOnlyTitle:'Lists live in this browser only.',
    localOnly:'There is no server behind this app. Clearing site data, private mode or another device and the lists are gone. Keep the link and you keep the list: the whole thing is encoded into the address and rebuilds from it completely, notes included. Do remember that a link is a snapshot — it holds the list as it was when you copied it. Add an entry or edit a note and you need to save the link again, or the old one takes you back to the old version. If the notes are not for your players, send them what Copy text produces rather than the link: only the notes you ticked "Copy along with the item" go in, the rest stay with you.',
    searchPh:'Search by name or description…',
    nothing:'Nothing found',
    sendAll:'Share', copyText:'Copy text', copyImg:'Copy image',
    imgCopied:'Image copied', imgSaved:'Image saved', imgFailed:'Could not load the image',
    copyLink:'Copy link', copySection:'Copy a link to this section',
    linkCopied:'Link copied', nameCopied:'Name copied', textCopied:'Text copied',
    tableLinkCopied:'Table link copied', sectionLinkCopied:'Section link copied',
    listLinkCopied:'List link copied',
    listCopied:'List copied', copyFailed:'Could not copy',
    sImg:'Image', sText:'Text', tableLink:'Link to this table',
    copyRoll:'Copy every option', rollCopied:'Options copied',
    openPage:'Page', openTable:'Open table', toStart:'Home',
    craftInto:'Upgrades to', craftFrom:'Made from',
    rollNo:'roll', notFound:'Item not found', notFoundSub:'The link may be out of date, or the data has changed.',
    hope:'Hope', fear:'Fear',
    foot:'Data: Daggerheart Core Set, Hope &amp; Fear, Wondrous Loot, Community Magic Items, Alternate Loot &amp; Consumable Tables. Russian text: daggerheart.su and custom material. Daggerheart © Darrington Press.',
    whatIsThis:'How this works',
    help: {
      std: [
        'Roll d12 and add them up — the total is the row number. The same number exists in both the item and the consumable table, so one roll yields several options and the player takes one.',
        'How many dice you take depends on the rarity you are after — each button is captioned with the rarities it covers. Where each one fits:<br><b>Common</b> — an abandoned camp, a local shop.<br><b>Uncommon</b> — limited stock in a shop, a stash in a camp, part of a reward.<br><b>Rare</b> — under lock and key, the sole reward for a job, a powerful NPC\'s possessions.<br><b>Legendary</b> — the only one of its kind, a reward for a deadly job, a powerful adversary\'s treasure.',
        'Tiers attached to rarities are a recommendation, not a limit. The GM may hand out any rarity at any level if it suits the table.',
      ],
      alt: [
        'Items are split between the Hope and Fear columns by theme: Hope holds what aids, protects and solves problems, Fear holds what harms, deceives and works by stealth.',
        'Choose a rarity and roll the Duality Dice. The player picks between the entry matching the Hope Die and the one matching the Fear Die.',
        'On a critical success, when both dice match, the player may take any entry from that rarity table, and the GM may allow jumping up a rarity.',
        'Tiers attached to rarities are a recommendation, not a limit.',
        'Tables by <a href="https://www.reddit.com/user/PrinceOfNowhereee/" target="_blank" rel="noopener">PrinceOfNowhereee</a>. Source: <a href="https://www.reddit.com/r/daggerheart/comments/1v3z3gm/alternate_loot_tables_combining_hope_fear_with/" target="_blank" rel="noopener">the Reddit post</a>.'
      ],
      wondrous: [
        'The table holds 119 entries rather than 100 — that is how many items the supplement actually describes. No die covers that range, so the button picks an entry at random. If you roll d100 at the table, type the number into the Roll result field.',
        'The order is the book\'s own: alphabetical by English name, not by power. Most items are weak to moderate.',
        'Some items upgrade into stronger ones. The card shows that on its own line, and the link takes you to the second item. The GM may ask for a Finesse or Knowledge roll to make the upgrade.',
        'Source: the <a href="https://www.drivethrurpg.com/en/product/552648/wondrous-environments" target="_blank" rel="noopener">Wondrous Environments</a> supplement.'
      ],
      community: [
        'Each community lists its items in ascending order of rarity: 1 is the humblest, 10 the most powerful.',
        'They fit best as a reward from that community, a family heirloom, or a find on its territory.',
        'Source: the <a href="https://www.drivethrurpg.com/en/product/558159/community-magic-items-a-daggerheart-compatible-toolkit" target="_blank" rel="noopener">Community Magic Items</a> supplement.'
      ],
      tables: [
        'Every table in full: loot and consumables from the core book, Hope &amp; Fear, Wondrous Loot and the community items, the alternate tables, plus weapons, secondary weapons and armor.',
        'Equipment works differently from loot: it has no roll number, but it does have a trait, a range, damage and burden — or thresholds and an Armor Score. All of it shows in the row and travels with the entry when you copy it.',
        'The order follows the books: inside each tier, Core physical weapons first, then Core magic, then the same for Hope &amp; Fear.',
        '<b>Class</b> is the table the book prints the weapon in, not the damage it deals. A magic weapon needs a Spellcast trait even when its damage is physical: the Ghostblade is a magic weapon dealing "phy or mag". So class and damage are shown apart, and a weapon that can deal either belongs to both filters.',
        'The "Line" filter splits equipment in two. <b>Upgradable</b> means the piece has higher versions: Improved, Advanced and Legendary Katana are the same katana across four tiers. <b>Unique</b> means it exists in one form only.',
        'Values in one row combine with "or" and rows combine with "and", starting from everything switched on. "Filter link" hands out an address carrying the current set, so the table opens the same way for whoever follows it.',
        'Eleven Wondrous Loot entries are really weapons. They are not in these tables — they stayed in the Wondrous one, but they look and copy like equipment.',
        'Sources: the Daggerheart Core Set and Hope &amp; Fear, with the errata applied.'
      ],
      lists: [
        'Create a list, hit "Fill" and browse the tables — a "+" appears on cards and rows. Or click an item\'s picture and tick the lists you want in the "Add to lists" block.',
        'The whole list is encoded into the page address itself and refreshed on every edit, so the Share button and the browser\'s own address bar hand out the same working link. No server involved: whoever opens it sees the list and can save a copy.',
        'The "Restore from a link" field takes such a link back and rebuilds an ordinary, editable list. Only the name and item ids are stored, so edits to the data are picked up automatically.'
      ]
    },
    pages: {
      std:   ['Standard rules', 'A roll over the core book and the Hope &amp; Fear tables.'],
      alt:   ['Alternate tables', 'A Duality Dice roll over both books merged into one set of tables.'],
      wondrous: ['Wondrous Loot', 'Enter your roll result, or pick a random entry.'],
      community: ['Community items', 'Pick an origin and roll d10.'],
      tables: ['Tables', 'Every table in full, weapons and armor included — browse, filter and open cards.'],
      lists: ['Lists', 'Collect loot into a list and send it to your players as a single link.'],
      search: ['Search', 'Search all 828 entries at once — loot, consumables and equipment, in Russian and English.']
    },
  }
};
const t = () => T[S.lang];

/* Dice per rarity, straight from the Core book */
const DICE = { common:[1,2], uncommon:[2,3], rare:[3,4], legendary:[4,5] };
/* …read the other way round: which rarities a given number of d12 covers.
   Counts overlap (2d12 is both Common and Uncommon), hence a list per count. */
const NDICE = [1, 2, 3, 4, 5].map(function (n) {
  return { n: n, rar: Object.keys(DICE).filter(function (r) { return DICE[r].indexOf(n) >= 0; }) };
});
const RARITIES5 = ['common','uncommon','rare','very_rare','legendary'];
const RAR_KEY = { common:'common', uncommon:'uncommon', rare:'rare', very_rare:'veryRare', legendary:'legendary' };
/* Russian needs the genitive after "поднять до" */
const RAR_GEN_RU = { common:'Обычной', uncommon:'Необычной', rare:'Редкой', very_rare:'Очень редкой', legendary:'Легендарной' };
const REAL_DICE = [4, 6, 8, 10, 12, 20, 100];
/* d119 is not a die anyone owns, so call it what it is: a random pick */
function rollLabel(n){
  return REAL_DICE.indexOf(n) >= 0
    ? t().roll + ' d' + n
    : t().randomIn + ' 1–' + n;
}
/* tier recommendations printed in the Alternate Loot & Consumable Tables */
const TIERS = { common:'1-2', uncommon:'1-2', rare:'2-3', very_rare:'3-4', legendary:'3-4' };
const COMMUNITIES = [
  ['Highborne','Великородное'], ['Loreborne','Научное'], ['Orderborne','Догматичное'],
  ['Ridgeborne','Горное'], ['Seaborne','Морское'], ['Slyborne','Криминальное'],
  ['Underborne','Подземное'], ['Wanderborne','Кочевое'], ['Wildborne','Лесное']
];
const TABLE_DEFS = [
  { id:'core_item',        ru:'Core — предметы',        en:'Core — items' },
  { id:'core_consumable',  ru:'Core — расходники',      en:'Core — consumables' },
  { id:'hnf_item',         ru:'H&F — предметы',         en:'H&F — items' },
  { id:'hnf_consumable',   ru:'H&F — расходники',       en:'H&F — consumables' },
  { id:'wondrous',         ru:'Wondrous Loot',          en:'Wondrous Loot' },
  { id:'community',        ru:'Предметы сообществ',     en:'Community items' },
  { id:'alt_item',         ru:'Альт. — предметы',       en:'Alt. — items' },
  { id:'alt_consumable',   ru:'Альт. — расходники',     en:'Alt. — consumables' },
  { id:'eq_weapon',        ru:'Оружие',                 en:'Weapons' },
  { id:'eq_secondary',     ru:'Вторичное оружие',       en:'Secondary weapons' },
  { id:'eq_armor',         ru:'Броня',                  en:'Armor' }
];

/* ---------- equipment vocabulary ----------
   Terms follow daggerheart.su, which is the translation the rest of the app
   quotes, so a weapon reads the same here and there. */
const EQ_TYPE   = { weapon:['Основное оружие','Primary weapon'],
                    secondary:['Вторичное оружие','Secondary weapon'],
                    armor:['Броня','Armor'] };
const EQ_TRAIT  = { agility:['Проворность','Agility'], strength:['Сила','Strength'],
                    finesse:['Искусность','Finesse'], instinct:['Инстинкт','Instinct'],
                    presence:['Влияние','Presence'], knowledge:['Знание','Knowledge'] };
const EQ_RANGE  = { melee:['Вплотную','Melee'], veryclose:['Близко','Very Close'],
                    close:['Средне','Close'], far:['Далеко','Far'],
                    veryfar:['Очень далеко','Very Far'] };
const EQ_DT     = { phy:['физ','phy'], mag:['маг','mag'], any:['физ/маг','phy/mag'] };
const EQ_BURDEN = { 1:['Одноручное','One-Handed'], 2:['Двуручное','Two-Handed'] };
const EQ_CLS    = { phy:['Физическое','Physical'], mag:['Магическое','Magic'] };
const EQ_LINE   = { line:['Улучшаемые','Upgradable'], uniq:['Уникальные','Unique'] };
const EQ_TABLE  = { eq_weapon:'weapon', eq_secondary:'secondary', eq_armor:'armor' };

const eqWord = (map, key) => { const v = map[key]; return v ? v[S.lang === 'ru' ? 0 : 1] : ''; };
const isEquip = it => !!(it && it.eq);

/* ---------- helpers ---------- */
const esc = s => String(s == null ? '' : s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const d = n => 1 + Math.floor(Math.random() * n);


function nameOf(it){ return S.lang === 'ru' ? (it.ru || it.en) : it.en; }
/* Outside the app a bare name loses the Item/Consumable badge, so spell it out */
function nameForShare(it){
  return nameOf(it) + (it.kind === 'consumable' ? ' (' + t().cons.toLowerCase() + ')' : '');
}
/* Bold travels in the text/html clipboard flavour. The plain flavour stays
   clean: an app that cannot take rich text gets readable text rather than
   stray markdown characters. */
/* Equipment leads with its stat line, tight under the name: it belongs to the
   heading, not to the prose, and a player scanning a pasted message reads the
   numbers before the feature. */
function shareText(it, skip){
  const stats = eqLine(it), ds = descOf(it);
  return nameForShare(it) + (stats ? '\n' + stats : '') + (ds ? '\n\n' + ds : '') +
    extraBlocks(it, skip).concat(contextNote(it)).map(textBlock).join('');
}
function shareHtml(it, skip){
  const stats = eqLine(it);
  return '<b>' + esc(nameForShare(it)) + '</b>' +
    (stats ? '<br>' + esc(stats) : '') +
    (descOf(it) ? '<br><br>' + descHtml(it) : '') +
    extraBlocks(it, skip).concat(contextNote(it)).map(blockHtml).join('');
}

/* A card usually has no list to belong to, so it carries no note. The one
   exception is the card the list roll just produced: there the list is known,
   and a note the GM ticked should travel with it like anywhere else. */
function contextNote(it){
  const l = S.listRoll.id && getList(S.listRoll.id);
  if (!l || onListPage() !== l.id) return [];
  const m = itemMeta(l, it.id);
  return (m.note && m.noteShow) ? [{ head: t().listNote, body: m.note }] : [];
}
function onListPage(){
  if (S.route.indexOf('lists/') === 0) return S.route.slice(6);
  if (S.route.indexOf('l/') === 0 && S.openList) return S.openList;
  return '';
}
/* Italic, not bold: an attached block belongs to the entry above it, and bold
   is kept for names so a wall of pasted entries still reads as a list. Each
   block gets a blank line of its own — flush against the description they ran
   together and were hard to tell apart. */
function blockHtml(b){
  return '<br><br><i>' + esc(b.head) + '</i><br>' + lines(b.body);
}
function textBlock(b){
  return '\n\n' + b.head + '\n' + b.body;
}
const lines = s => esc(s).replace(/\n/g, '<br>');
function descOf(it){ return S.lang === 'ru' ? (it.rud || it.ende) : it.ende; }

/* ---------- equipment stats ----------
   The book prints these as table columns. Out of the table they have to carry
   their own labels, so each value is rendered as a self-explanatory chunk and
   the pieces are joined with a middle dot wherever one line is enough. */
function eqParts(it, noType){
  if (!isEquip(it)) return [];
  const e = it.eq, out = noType ? [] : [eqWord(EQ_TYPE, e.t)];
  out.push(e.tier ? t().tier + ' ' + e.tier : t().srcWond);
  if (e.t === 'armor') {
    if (e.th) out.push(t().eqTh + ' ' + e.th[0] + '/' + e.th[1]);
    if (e.as != null) out.push(t().eqScore + ' ' + e.as);
  } else {
    // a magic weapon stays a magic weapon even when its damage can be physical
    if (e.t === 'weapon' && e.cls) out.push(eqWord(EQ_CLS, e.cls));
    out.push(eqWord(EQ_TRAIT, e.tr));
    out.push(eqWord(EQ_RANGE, e.rg));
    out.push(e.dmg + (e.dt ? ' ' + eqWord(EQ_DT, e.dt) : ''));
    out.push(eqWord(EQ_BURDEN, e.bu));
  }
  return out.filter(Boolean);
}
const eqLine = (it, noType) => eqParts(it, noType).join(' · ');
function eqChips(it){
  const p = eqParts(it, true);
  return p.length ? '<div class="eqstats">' +
    p.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div>' : '';
}
/* The feature label is stored inline ("Quick: when you…") so that every place
   that already prints a description keeps working; only the emphasis is added
   back here, at the first colon — the label itself never contains one. */
function descHtml(it){
  const s = descOf(it) || '';
  if (!isEquip(it)) return esc(s);
  const i = s.indexOf(': ');
  return i < 0 ? esc(s) : '<i>' + esc(s.slice(0, i)) + ':</i>' + esc(s.slice(i + 1));
}

/* What travels with an item when it is copied or shared: the full text of the
   other end of a craft chain, and of any rulebook card the description names.
   Otherwise the player receives a name and still has to go looking.
   `skip` is a set of ids already present elsewhere in the same message. */
function extraBlocks(it, skip){
  const out = [];
  craftRows(it).forEach(function (r) {
    if (skip && skip[r.id]) return;
    out.push({ head: r.label + ': ' + r.name, body: descOf(BY_ID[r.id]) });
  });
  refRows(it).forEach(function (r) {
    out.push({ head: r.name + ' · ' + r.sub, body: r.text });
  });
  return out;
}

/* ---------- crafting ----------
   Both directions as plain rows, so the card, the clipboard and the list
   export all read from one place. Every row points at a record that exists. */
function craftRows(it){
  const rows = [];
  const into = BY_ID[it.craft];
  if (into) rows.push({ label: t().craftInto, name: nameOf(into), id: into.id });
  const from = BY_ID[CRAFTED_FROM[it.id]];
  if (from) rows.push({ label: t().craftFrom, name: nameOf(from), id: from.id });
  return rows;
}
/* ---------- referenced rulebook cards ---------- */
function refRows(it){
  return (it.refs || []).map(function (k) {
    const r = REFS[k];
    if (!r) return null;
    return S.lang === 'ru'
      ? { name: r.ru, sub: r.rusub, text: r.rud, url: r.url }
      : { name: r.en, sub: r.ensub, text: r.ende, url: r.url.replace('//ru.', '//en.') };
  }).filter(Boolean);
}
function refHTML(it){
  const rows = refRows(it);
  if (!rows.length) return '';
  return '<div class="refs">' + rows.map(function (r) {
    return '<details><summary>' + ICON_REF +
        '<span class="ref-n">' + esc(r.name) + '</span>' +
        '<i class="ref-s">' + esc(r.sub) + '</i></summary>' +
      '<p>' + lines(r.text) + '</p>' +
      '<a href="' + esc(r.url) + '" target="_blank" rel="noopener">daggerheart.su</a>' +
    '</details>';
  }).join('') + '</div>';
}
/* Dense table/list rows are one big button, so a link cannot be nested here —
   the chain shows as a compact caption and the row itself stays the target. */
function rowCraft(it){
  const rows = craftRows(it);
  if (!rows.length) return '';
  return '<span class="rcraft">' + ICON_CRAFT +
    rows.map(r => esc(r.label) + ': ' + esc(r.name)).join(' · ') + '</span>';
}
function craftHTML(it){
  const rows = craftRows(it);
  if (!rows.length) return '';
  return '<div class="craft">' + rows.map(function (r) {
    return '<p>' + ICON_CRAFT + '<span class="craft-l">' + esc(r.label) + '</span>' +
      '<a href="#/i/' + esc(r.id) + '">' + esc(r.name) + '</a></p>';
  }).join('') + '</div>';
}

function srcLabel(it){
  if (it.src === 'core') return t().srcCore;
  if (it.src === 'hnf') return t().srcHnf;
  if (it.src === 'wondrous') return t().srcWond;
  return S.lang === 'ru' ? (it.community_ru || t().srcComm) : (it.community || t().srcComm);
}

function toast(msg, isError){
  const el = $('#toast');
  el.textContent = msg;
  el.classList.toggle('err', !!isError);
  el.hidden = false;
  clearTimeout(toast._tm);
  toast._tm = setTimeout(() => { el.hidden = true; }, isError ? 2600 : 1600);
}

/* Puts both flavours on the clipboard: rich-paste targets take the HTML,
   everything else falls back to the plain string. */
function copyRich(html, plain, msg){
  const supported = typeof ClipboardItem !== 'undefined' &&
                    navigator.clipboard && navigator.clipboard.write && window.isSecureContext;
  if (!supported) { copyText(plain, msg); return; }
  navigator.clipboard.write([ new ClipboardItem({
    'text/html':  new Blob([html],  { type: 'text/html' }),
    'text/plain': new Blob([plain], { type: 'text/plain' })
  }) ]).then(function () { toast(msg || t().copied); })
       .catch(function () { copyText(plain, msg); });
}

function copyText(text, msg){
  const done = () => toast(msg || t().copied);
  const failed = () => toast(t().copyFailed, true);
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallback(text, done, failed));
  } else fallback(text, done, failed);
}
function fallback(text, done, failed){
  const ta = document.createElement('textarea');
  ta.value = text; ta.setAttribute('readonly','');
  ta.style.cssText = 'position:fixed;top:-1000px';
  document.body.appendChild(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  document.body.removeChild(ta);
  ok ? done() : failed();
}

const ICON_COPY = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style="flex:none"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"/></svg>';
const ICON_IMG   = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style="flex:none"><path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z"/></svg>';
const ICON_SHARE = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style="flex:none"><path d="M18 16.1c-.8 0-1.5.3-2 .8l-7.1-4.2c.1-.2.1-.5.1-.7s0-.5-.1-.7L16 7.1c.5.5 1.2.8 2 .8a3 3 0 1 0-3-3c0 .3 0 .5.1.7L8 9.9a3 3 0 1 0 0 4.2l7.1 4.2c-.1.2-.1.4-.1.6a2.9 2.9 0 1 0 3-2.8z"/></svg>';
const ICON_EXT  = '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style="flex:none;opacity:.7"><path d="M14 3v2h3.6l-9.8 9.8 1.4 1.4L19 6.4V10h2V3h-7zM5 5h5V3H3v18h18v-7h-2v5H5V5z"/></svg>';
const ICON_PLUS = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true" style="flex:none"><path d="M11 5h2v14h-2zM5 11h14v2H5z"/></svg>';
const ICON_NOTE = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true" style="flex:none"><path d="M4 3h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H8l-4 4V4a1 1 0 0 1 1-1zm3 5h10V6.5H7V8zm0 3h10V9.5H7V11zm0 3h7v-1.5H7V14z"/></svg>';
const ICON_REF ='<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true" style="flex:none"><path d="M6 2h11a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2.5 2.5 0 0 1 0-5h11V4H6a.5.5 0 0 0 0 1h9v2H6a2.5 2.5 0 0 1 0-5z"/></svg>';
const ICON_CRAFT ='<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true" style="flex:none"><path d="M4 11h11.2l-3.6-3.6L13 6l6 6-6 6-1.4-1.4 3.6-3.6H4v-2z"/></svg>';
const ICON_GRIP ='<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true" style="flex:none"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>';
const ICON_LINK ='<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style="flex:none"><path d="M3.9 12a5.1 5.1 0 0 1 5.1-5.1h4V5H9a7 7 0 0 0 0 14h4v-1.9H9A5.1 5.1 0 0 1 3.9 12zM8 13h8v-2H8v2zm7-8v1.9h4a5.1 5.1 0 0 1 0 10.2h-4V19h4a7 7 0 0 0 0-14h-4z"/></svg>';

/* ============================================================
   LISTS
   Kept in localStorage only — there is no server behind this app.
   ============================================================ */
const LS_KEY = 'dhloot.lists.v1';

function loadLists(){
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter(l => l && l.id && Array.isArray(l.ids)) : [];
  } catch (e) { return []; }
}
function saveLists(){
  try { localStorage.setItem(LS_KEY, JSON.stringify(S.lists)); return true; }
  catch (e) { toast(t().saveFailed, true); return false; }
}
function storageWorks(){
  try { localStorage.setItem('dhloot.probe','1'); localStorage.removeItem('dhloot.probe'); return true; }
  catch (e) { return false; }
}
function newId(){ return 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function getList(id){ return S.lists.filter(l => l.id === id)[0] || null; }
function listItems(l){ return l.ids.map(id => BY_ID[id]).filter(Boolean); }

/* meta is optional so lists saved before this existed keep working */
function itemMeta(l, id){ return (l.meta && l.meta[id]) || {}; }
function setMeta(l, id, field, value){
  if (!l.meta) l.meta = {};
  const m = l.meta[id] || (l.meta[id] = {});
  // truthiness, not "> 0": the same helper now carries note text as well
  if (value) m[field] = value; else delete m[field];
  if (!Object.keys(m).length) delete l.meta[id];
  if (!Object.keys(l.meta).length) delete l.meta;
  saveLists();
}
/* Takes the entry out and puts it back at `to` (0-based, clamped). Stepping one
   place at a time meant twenty clicks to move an entry twenty places, so order
   is now set by dragging, or by typing the position you want. */
function moveToInList(l, id, to){
  const i = l.ids.indexOf(id);
  if (i < 0) return false;
  const j = clamp(to, 0, l.ids.length - 1);
  if (i === j) return false;
  l.ids.splice(j, 0, l.ids.splice(i, 1)[0]);
  saveLists();
  return true;
}
/* name plus whatever meta the GM filled in */
function itemLine(l, it){
  const m = itemMeta(l, it.id);
  return nameForShare(it) +
    (m.qty > 1 ? ' ×' + m.qty : '') +
    (m.gold ? ' — ' + m.gold + ' ' + t().goldUnit : '');
}

function createList(name){
  const l = { id: newId(), name: (name || '').trim() || t().untitled, ids: [], created: Date.now() };
  S.lists.unshift(l); saveLists();
  return l;
}
function deleteList(id){
  S.lists = S.lists.filter(l => l.id !== id);
  saveLists();
}
function toggleInList(listId, itemId){
  const l = getList(listId); if (!l) return;
  const i = l.ids.indexOf(itemId);
  if (i >= 0) l.ids.splice(i, 1); else l.ids.push(itemId);
  saveLists();
}

/* Share payload: base64url of
     line 1  name
     line 2  id,id*qty,id*qty*gold
     rest    notes, and only when there are any
   A list without notes encodes to exactly the same bytes as before, so links
   saved earlier and links made now are the same string. Notes may themselves
   contain newlines, hence they live in the tail and use ASCII separators that
   a person cannot type. */
const N_REC = '\x1e';   // starts one note
const N_SEP = '\x1f';   // between the id and the text
const N_LIST = '~';     // the id standing for the list's own note
/* A leading "+" marks a note the GM chose to copy along with the item. It rides
   on the id, not the text: ids are letters and digits, so the plus can never be
   confused with one, while a note is free to start with "-1 к броску". */
const N_SHOW = '+';

function encodeList(l){
  // "id" or "id*qty" or "id*qty*gold" — old links carried bare ids and still parse
  const parts = l.ids.map(function (id) {
    const m = itemMeta(l, id);
    if (m.gold) return id + '*' + (m.qty || 1) + '*' + m.gold;
    if (m.qty > 1) return id + '*' + m.qty;
    return id;
  });
  let raw = l.name + '\n' + parts.join(',');
  const rec = (id, text, show) => text ? N_REC + (show ? N_SHOW : '') + id + N_SEP + text : '';
  const notes = rec(N_LIST, l.note, l.noteShow) + l.ids.map(function (id) {
    const m = itemMeta(l, id);
    return rec(id, m.note, m.noteShow);
  }).join('');
  if (notes) raw += '\n' + notes;

  const bytes = new TextEncoder().encode(raw);
  let bin = ''; bytes.forEach(function (b) { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decodeList(payload){
  try {
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const raw = new TextDecoder().decode(bytes);

    const nl = raw.indexOf('\n');
    const name = nl >= 0 ? raw.slice(0, nl) : '';
    const body = nl >= 0 ? raw.slice(nl + 1) : '';
    // the items line ends at the next newline; everything after it is notes
    const nl2 = body.indexOf('\n');
    const itemsLine = nl2 >= 0 ? body.slice(0, nl2) : body;
    const noteBlob = nl2 >= 0 ? body.slice(nl2 + 1) : '';

    const ids = [], meta = {};
    itemsLine.split(',').forEach(function (part) {
      const bits = part.split('*');
      if (!BY_ID[bits[0]]) return;
      ids.push(bits[0]);
      const qty = parseInt(bits[1], 10), gold = parseInt(bits[2], 10);
      const m = {};
      if (qty > 1) m.qty = qty;
      if (gold > 0) m.gold = gold;
      if (Object.keys(m).length) meta[bits[0]] = m;
    });
    if (!ids.length) return null;

    let note = '', noteShow = false;
    if (noteBlob) {
      const cut = noteBlob.indexOf(N_REC);
      // anything before the first record is a list note from the first cut of
      // this format, which had no flags — treat it as "do not copy"
      note = cut < 0 ? noteBlob : noteBlob.slice(0, cut);
      if (cut >= 0) {
        noteBlob.slice(cut + 1).split(N_REC).forEach(function (rec) {
          const at = rec.indexOf(N_SEP);
          if (at < 0) return;
          let id = rec.slice(0, at);
          const text = rec.slice(at + 1);
          if (!text) return;
          const show = id.charAt(0) === N_SHOW;
          if (show) id = id.slice(1);
          if (id === N_LIST) { note = text; noteShow = show; return; }
          if (!BY_ID[id] || ids.indexOf(id) < 0) return;
          const m = meta[id] || (meta[id] = {});
          m.note = text;
          if (show) m.noteShow = true;
        });
      }
    }
    return {
      name: name, ids: ids,
      note: note || undefined, noteShow: (note && noteShow) || undefined,
      meta: Object.keys(meta).length ? meta : undefined
    };
  } catch (e) { return null; }
}
/* Whoever opens it lands on this table with the same values switched off */
function eqFilterUrl(){
  const kind = EQ_TABLE[S.tables.t], f = kind ? eqEncode(kind) : '';
  return baseUrl() + 'index.html#/tables/' + S.tables.t + (f ? '/' + f : '');
}
function listShareUrl(l){
  return baseUrl() + (hosted() ? '' : 'index.html') + listHash(l);
}
/* The address bar carries the whole list, not a local id, so whatever a person
   copies out of it — the Share button or the browser's own URL box — works for
   everyone. S.openList remembers which local list that address belongs to, so
   an edit can refresh the address instead of orphaning the page. */
function listHash(l){ return '#/l/' + encodeList(l); }
/* Saving a shared list produces an identical payload, so the hash does not
   actually change and no hashchange fires — render by hand in that case. */
function goToList(l){
  S.openList = l.id;
  const want = listHash(l);
  if (location.hash === want) { S.urlPayload = encodeList(l); render(); }
  else location.hash = want;
}
function findListByPayload(payload){
  for (let i = 0; i < S.lists.length; i++) {
    if (encodeList(S.lists[i]) === payload) return S.lists[i];
  }
  return null;
}
/* Rewrites the address to match the list as it stands now. replaceState does
   not fire hashchange, so this never re-enters render(). */
/* Edits made without a re-render (name, quantity, gold, notes) still have to
   move the address along, otherwise the link in the bar quietly goes stale. */
function freshenListUrl(l){
  if (S.openList === l.id) syncListUrl(l);
}
function syncListUrl(l){
  const payload = encodeList(l);
  S.urlPayload = payload;
  const want = '#/l/' + payload;
  if (location.hash !== want && window.history && history.replaceState) {
    history.replaceState(null, '', location.pathname + location.search + want);
  }
}
/* Items already in the list do not get their text repeated as someone else's
   craft partner — the reader has it a few lines up. */
function listSkip(l){
  const seen = {};
  l.ids.forEach(function (id) { seen[id] = true; });
  return seen;
}
/* Notes the GM marked as copyable. They come last, after the description and
   the reference blocks, so the item reads whole before the GM's aside. */
function noteBlocks(l, it){
  const m = itemMeta(l, it.id);
  return (m.note && m.noteShow) ? [{ head: t().listNote, body: m.note }] : [];
}
function listNoteTail(l){
  return (l.note && l.noteShow) ? [{ head: t().listNote, body: l.note }] : [];
}
/* The list note sits right under the list name: it is about the whole thing,
   so it reads as a preamble rather than a footnote after the last entry. */
function listAsText(l){
  const skip = listSkip(l);
  return l.name +
    listNoteTail(l).map(textBlock).join('') +
    '\n\n' + listItems(l).map(function (it) {
      const stats = eqLine(it), ds = descOf(it);
      return itemLine(l, it) + (stats ? '\n' + stats : '') + (ds ? '\n\n' + ds : '') +
        extraBlocks(it, skip).concat(noteBlocks(l, it)).map(textBlock).join('');
    }).join('\n\n');
}
function listAsHtml(l){
  const skip = listSkip(l);
  return '<b>' + esc(l.name) + '</b>' +
    listNoteTail(l).map(blockHtml).join('') +
    '<br><br>' + listItems(l).map(function (it) {
      const stats = eqLine(it);
      return '<b>' + esc(itemLine(l, it)) + '</b>' +
        (stats ? '<br>' + esc(stats) : '') +
        (descOf(it) ? '<br><br>' + descHtml(it) : '') +
        extraBlocks(it, skip).concat(noteBlocks(l, it)).map(blockHtml).join('');
    }).join('<br><br>');
}

/* ---------- share links ---------- */
function baseUrl(){ return location.href.split('#')[0].replace(/index\.html$/, ''); }
function hosted(){ return /^https?:$/.test(location.protocol); }
/* On a real host, link to the static stub in i/ — it carries per-item Open Graph
   tags, so Telegram/Discord unfurl the picture, name and description by itself.
   Opened from disk there is no stub, so fall back to the in-app hash route. */
function itemUrl(id){ return hosted() ? baseUrl() + 'i/' + id + '.html' : baseUrl() + 'index.html#/i/' + id; }
function canShare(){ return typeof navigator !== 'undefined' && !!navigator.share; }

/* Copies, always. Sharing lives on the Send button — a control labelled
   "copy the link" must not open a share sheet. */
function shareItem(id){
  if (BY_ID[id]) copyText(itemUrl(id), t().linkCopied);
}

/* ---------- image ----------
   Not every entry has art: new ones may arrive before a picture is drawn, and
   a file can go missing. Both cases end up here, so the rest of the app only
   ever asks hasImage()/imgSrc() and never touches it.img directly. */
const NO_ART = 'img/_none.webp';
const brokenArt = {};                       // ids whose file failed to load this session
function hasImage(it){ return !!(it && it.img) && !brokenArt[it.id]; }
function imgSrc(it){ return hasImage(it) ? 'img/' + it.img : NO_ART; }
function imgTag(it, extra){
  return '<img src="' + esc(imgSrc(it)) + '" alt="" loading="lazy" decoding="async"' +
    (hasImage(it) ? ' data-art="' + esc(it.id) + '"' : ' class="noart"') +
    (extra || '') + '>';
}

/* ---------- image ---------- */
function imageBlob(it){
  return new Promise(function (resolve, reject) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      c.toBlob(function (b) { b ? resolve(b) : reject(new Error('toBlob failed')); }, 'image/png');
    };
    img.onerror = reject;
    img.src = imgSrc(it);
  });
}

function safeFileName(it){
  return nameOf(it).replace(/[\\/:*?"<>|]/g, '') + '.png';
}

function downloadImage(it){
  imageBlob(it).then(function (blob) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = safeFileName(it);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    toast(t().imgSaved);
  }).catch(function () { toast(t().imgFailed, true); });
}

/* Copy the picture itself to the clipboard. WebP is not a clipboard format the
   browsers accept, so it goes through a canvas and comes out as PNG. */
function copyImage(it){
  if (!hasImage(it)) return;
  const supported = typeof ClipboardItem !== 'undefined' &&
                    navigator.clipboard && navigator.clipboard.write && window.isSecureContext;
  if (!supported) { downloadImage(it); return; }
  // Safari drops the user gesture unless the promise is handed to ClipboardItem directly
  navigator.clipboard.write([ new ClipboardItem({ 'image/png': imageBlob(it) }) ])
    .then(function () { toast(t().imgCopied); })
    .catch(function () { downloadImage(it); });
}

/* One "send" button, three levels of browser support:
   1. share sheet with the picture attached  — phones, puts image + caption into Telegram at once
   2. share sheet with just the link         — desktop browsers that have the Share API
   3. copy the link                          — everything else; the link still unfurls into
                                                picture + name + description in Telegram */
function sendItem(it){
  if (!navigator.share) { copyText(itemUrl(it.id), t().linkCopied); return; }
  if (!(navigator.canShare && window.File)) {
    navigator.share({ title: nameForShare(it), text: shareText(it), url: itemUrl(it.id) }).catch(function () {});
    return;
  }
  const plain = function () {
    return navigator.share({ title: nameForShare(it), text: shareText(it), url: itemUrl(it.id) });
  };
  if (!hasImage(it)) { plain().catch(function () {}); return; }
  imageBlob(it).then(function (blob) {
    const file = new File([blob], safeFileName(it), { type: 'image/png' });
    if (navigator.canShare({ files: [file] })) {
      return navigator.share({ files: [file], text: shareText(it) });
    }
    return plain();
  }).catch(function (err) {
    // The picture failed, not the intent — send the text rather than nothing.
    // A share the user themselves dismissed must not bounce back at them.
    if (err && err.name === 'AbortError') return;
    plain().catch(function () {});
  });
}
const ICON_DIE  = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="flex:none"><path d="M12 2 2 7v10l10 5 10-5V7L12 2zm0 2.3 7.1 3.5-7.1 3.6-7.1-3.6L12 4.3zM4 9.2l7 3.5v7.1l-7-3.5V9.2zm9 10.6v-7.1l7-3.5v7.1l-7 3.5z"/></svg>';

/* ============================================================
   CARD
   ============================================================ */
/* Labels collapse to icons on narrow screens, so every button keeps an aria-label */
function actBtn(action, id, icon, label, primary, full){
  const hint = full || label;
  return '<button type="button" class="btn sm' + (primary ? ' primary' : '') + '"' +
    ' data-' + action + '="' + esc(id) + '"' +
    ' title="' + esc(hint) + '" aria-label="' + esc(hint) + '">' +
    icon + '<span class="btn-lbl">' + esc(label) + '</span></button>';
}

/* Expanded card only: toggle this item against every list at once,
   with an inline field for making a new one. */
/* ---------- adding to a list ----------
   One control, used from an item card and from the selection bar alike. With a
   single item the chips double as membership: a tick means it is already there
   and clicking takes it out. With several, every click just adds. */
const PICKER_SEARCH_AT = 8;
function listMenuHTML(key, ids){
  const one = ids.length === 1 ? ids[0] : '';
  const q = S.pickQ.trim().toLowerCase();
  const all = S.lists.slice().sort(function (a, b) { return (b.created || 0) - (a.created || 0); });
  const shown = q ? all.filter(function (l) { return l.name.toLowerCase().indexOf(q) >= 0; }) : all;
  const find = all.length >= PICKER_SEARCH_AT
    ? '<input type="search" class="pickq" id="pickq" value="' + esc(S.pickQ) + '"' +
      ' placeholder="' + esc(t().findList) + '" aria-label="' + esc(t().findList) + '">'
    : '';
  const chips = shown.length
    ? shown.map(function (l) {
        const inList = one && l.ids.indexOf(one) >= 0;
        return '<button type="button" class="chip' + (inList ? ' on' : '') + '"' +
          ' data-add-to="' + esc(l.id + '|' + key) + '">' +
          (inList ? '✓ ' : '') + esc(l.name) + '</button>';
      }).join('')
    : '<span class="picker-none">' + esc(t().nothing) + '</span>';
  const tail = S.newListFor === key
    ? '<span class="picker-new">' +
        '<input type="text" id="newlist" value="' + esc(S.newListDraft) + '" placeholder="' + esc(t().listNamePh) + '">' +
        '<button type="button" class="btn sm primary" data-act="createFor" data-val="' + esc(key) + '">' + esc(t().create) + '</button>' +
        '<button type="button" class="btn sm ghost" data-act="cancelNew">' + esc(t().cancel) + '</button>' +
      '</span>'
    : '<button type="button" class="chip ghost" data-act="newListFor" data-val="' + esc(key) + '">+ ' + esc(t().newList) + '</button>';
  return '<div class="dropmenu' + (find ? ' long' : '') + '">' +
    '<span class="lbl">' + esc(one ? t().inLists : t().addTo) + '</span>' +
    find + '<div class="pickchips">' + chips + '</div>' + tail +
  '</div>';
}

/* key identifies the opener: an item id on a card, or 'sel' for the bar */
function addToListBtn(key, ids, primary){
  const open = S.menuFor === key;
  return '<div class="seldrop">' +
    (open ? listMenuHTML(key, ids) : '') +
    '<button type="button" class="btn sm' + (primary ? ' primary' : '') + (open ? ' on' : '') + '"' +
      ' data-act="menu" data-val="' + esc(key) + '" aria-expanded="' + (open ? 'true' : 'false') + '">' +
      ICON_PLUS + esc(t().addToList) +
      '<i class="caret' + (open ? ' up' : '') + '"></i></button>' +
  '</div>';
}
function listPicker(it){
  return '<div class="cardpick">' + addToListBtn(it.id, [it.id], true) + '</div>';
}
function focusNew(){
  const input = document.getElementById('newlist');
  if (input) input.focus();
}

/* Adding from the menu. One item behaves as a toggle, so a card still shows
   and undoes its membership; several are only ever added. */
function applyAddTo(listId, key){
  const l = getList(listId);
  if (!l) return;
  const ids = key === 'sel' ? selIds() : [key];
  if (ids.length === 1 && l.ids.indexOf(ids[0]) >= 0) {
    l.ids = l.ids.filter(x => x !== ids[0]);
    saveLists();
    toast(t().removedFrom.replace('%s', l.name));
    render();
    return;
  }
  addIdsTo(l, ids);
}
function addIdsTo(l, ids){
  const fresh = ids.filter(id => BY_ID[id] && l.ids.indexOf(id) < 0);
  fresh.forEach(id => l.ids.push(id));
  saveLists();
  toast(t().addedTo.replace('%s', l.name) + (ids.length > 1 ? ': ' + fresh.length : ''));
  S.menuFor = '';
  render();
}

/* the whole selection as one message, entries apart — they are a set, not
   alternatives, so no OR between them */
function selAsText(items){
  return items.map(it => shareText(it)).join('\n\n');
}
function selAsHtml(items){
  return items.map(it => shareHtml(it)).join('<br><br>');
}

/* opt.full  — big picture on top (item page / modal); otherwise a compact row
   opt.col   — 'hope' | 'fear' badge for the alternate tables
   opt.rollLabel — overrides the number shown in the meta row */
/* Loot is an item or a consumable; equipment says what kind of gear it is */
function kindBadge(it){
  if (isEquip(it))
    return '<span class="badge equip">' + esc(eqWord(EQ_TYPE, it.eq.t)) + '</span>';
  return '<span class="badge ' + (it.kind === 'consumable' ? 'cons' : 'item') + '">' +
    esc(it.kind === 'consumable' ? t().cons : t().item) + '</span>';
}

function cardHTML(it, opt){
  opt = opt || {};
  const nm = nameOf(it), ds = descOf(it);
  const meta =
    ((opt.rollLabel !== false && it.roll) ? '<span class="badge num">' + esc(opt.rollLabel || it.roll) + '</span>' : '') +
    (opt.col ? '<span class="badge ' + opt.col + '">' + esc(opt.col === 'hope' ? t().hope : t().fear) + '</span>' : '') +
    kindBadge(it) +
    '<span class="badge src">' + esc(srcLabel(it)) + '</span>';

  const nameEl = opt.full
    ? '<span>' + esc(nm) + '</span>'
    : '<a href="#/i/' + esc(it.id) + '" title="' + esc(t().openPage) + '">' + esc(nm) + '</a>';

  return '' +
  '<article class="card' + (opt.full ? ' full' : ' compact') + '" data-id="' + esc(it.id) + '">' +
    '<button type="button" class="card-media" data-open="' + esc(it.id) + '" aria-label="' + esc(t().openPage) + '">' +
      imgTag(it) +
    '</button>' +
    '<div class="card-body">' +
      '<div class="card-meta">' + meta + '</div>' +
      '<h3 class="card-name">' + nameEl +
        '<span class="card-name-acts">' +
          '<button type="button" data-copy-name="' + esc(it.id) + '" title="' + esc(t().copyName) + '" aria-label="' + esc(t().copyName) + '">' + ICON_COPY + '</button>' +
          '<button type="button" data-share="' + esc(it.id) + '" title="' + esc(t().copyLink) + '" aria-label="' + esc(t().copyLink) + '">' + ICON_LINK + '</button>' +
        '</span>' +
      '</h3>' +
      eqChips(it) +
      (ds ? '<p class="card-desc">' + descHtml(it) + '</p>' : '') +
      craftHTML(it) +
      refHTML(it) +
      '<div class="card-acts">' +
        actBtn('send', it.id, ICON_SHARE, t().sendAll, true) +
        (hasImage(it) ? actBtn('copy-img', it.id, ICON_IMG, t().sImg, false, t().copyImg) : '') +
        actBtn('copy-full', it.id, ICON_COPY, t().sText, false, t().copyText) +
      '</div>' +
      (opt.full ? listPicker(it) : '') +
    '</div>' +
  '</article>';
}

/* ---------- the whole roll as one message ----------
   A roll offers several options and the player picks one, so the GM wants to
   paste them all at once with the OR spelled out rather than send them apart. */
function rollSep(items){ return items.reduce(function (m, it) { m[it.id] = true; return m; }, {}); }
function rollText(items){
  const skip = rollSep(items);
  return items.map(function (it) { return shareText(it, skip); })
              .join('\n\n' + '— ' + t().or + ' —' + '\n\n');
}
function rollHtml(items){
  const skip = rollSep(items);
  return items.map(function (it) { return shareHtml(it, skip); })
              .join('<br><br><b>— ' + esc(t().or) + ' —</b><br><br>');
}
/* Shown only when there is an actual choice to hand over */
function rollBar(items){
  if (items.length < 2) return '';
  return '<div class="resbar">' +
    '<button type="button" class="btn sm" data-copy-roll="' + esc(items.map(x => x.id).join(',')) + '">' +
      ICON_COPY + esc(t().copyRoll) + '</button>' +
    '</div>';
}

function orDiv(horizontal){
  return '<div class="ordiv' + (horizontal ? ' h' : '') + '"><i>' + esc(t().or) + '</i></div>';
}

/* renders N cards separated by OR */
function orGrid(cards){
  if (!cards.length) return '';
  if (cards.length === 1) return '<div class="orgrid"><div>' + cards[0] + '</div></div>';
  if (cards.length === 2) {
    return '<div class="orgrid c2"><div>' + cards[0] + '</div>' + orDiv() + '<div>' + cards[1] + '</div></div>';
  }
  // 4 → 2x2 with OR between columns and a full-width OR between rows
  return '<div class="orgrid c4">' +
    '<div>' + cards[0] + '</div>' + orDiv() + '<div>' + cards[1] + '</div>' +
    '<div style="grid-column:1/-1">' + orDiv(true) + '</div>' +
    '<div>' + cards[2] + '</div>' + orDiv() + '<div>' + cards[3] + '</div>' +
  '</div>';
}

/* ============================================================
   SHARED CONTROLS
   ============================================================ */
function numBox(id, val, min, max, cls){
  return '<div class="numbox ' + (cls || '') + '">' +
    '<button type="button" data-step="-1" data-for="' + id + '" aria-label="-">−</button>' +
    '<input type="number" id="' + id + '" value="' + val + '" min="' + min + '" max="' + max + '" inputmode="numeric">' +
    '<button type="button" data-step="1" data-for="' + id + '" aria-label="+">+</button>' +
  '</div>';
}

/* Two independent toggles, both on by default, backed by one piece of state */
const KINDS = [['item','fItems'], ['consumable','fCons'], ['equip','fEquip']];
/* Nothing rolls equipment, so the roll pages offer only what a roll can return */
const LOOT_KINDS = KINDS.slice(0, 2);

function kindChips(list){
  list = list || KINDS;
  return '<div class="field"><span class="lbl">' + esc(t().filter) + '</span><div class="chips">' +
    list.map(function (k) {
      const on = !!S.kind[k[0]];
      const last = on && list.filter(function (x) { return S.kind[x[0]]; }).length === 1;
      return '<button type="button" class="chip' + (on ? ' on' : '') + '"' +
        ' data-act="kind" data-val="' + k[0] + '"' +
        ' aria-pressed="' + (on ? 'true' : 'false') + '"' +
        (last ? ' data-last="1" title="' + esc(t().keepOneKind) + '"' : '') + '>' +
        esc(t()[k[1]]) + '</button>';
    }).join('') +
  '</div></div>';
}
function kindAllows(kind){ return !!S.kind[kind]; }

function rarityChips(list, cur, act){
  return '<div class="chips">' + list.map(r => {
    return '<button type="button" class="chip' + (r === cur ? ' on' : '') + '" data-act="' + act + '" data-val="' + r + '">' +
      esc(t()[RAR_KEY[r]]) + '<small>' + esc(t().tier + ' ' + TIERS[r]) + '</small></button>';
  }).join('') + '</div>';
}


/* ============================================================
   PAGES
   ============================================================ */
function pageHead(key){
  const p = t().pages[key];
  const help = t().help[key];
  const btn = help
    ? '<button type="button" class="helpbtn' + (S.help === key ? ' on' : '') + '" data-act="help" data-val="' + key + '"' +
      ' title="' + esc(t().whatIsThis) + '" aria-label="' + esc(t().whatIsThis) + '"' +
      ' aria-expanded="' + (S.help === key ? 'true' : 'false') + '">?</button>'
    : '';
  const box = (help && S.help === key)
    ? '<div class="helpbox">' + help.map(function (x) { return '<p>' + x + '</p>'; }).join('') + '</div>'
    : '';
  return '<h1 class="page-h">' + p[0] + btn + '</h1><p class="page-sub">' + p[1] + '</p>' + box;
}

function pickCards(items, opts){
  return items
    .map((it, i) => [it, (opts && opts[i]) || {}])
    .filter(p => p[0] && kindAllows(p[0].kind))
    .map(p => cardHTML(p[0], p[1]));
}

/* ---- 1: standard rules (Core + Hope & Fear share one d12 flow) ---- */
const SOURCES = [['core','srcCore'], ['hnf','srcHnf']];

function renderStd(){
  const st = S.std, n = st.n;
  const pool = [];
  if (st.src.core) pool.push(DATA.core_item[n-1], DATA.core_consumable[n-1]);
  if (st.src.hnf)  pool.push(DATA.hnf_item[n-1],  DATA.hnf_consumable[n-1]);

  /* Rarity used to sit here as its own row of chips, but on this page it only
     ever decided how many d12 to roll — the table is 1–60 whatever you pick.
     So the dice counts are the buttons now, and the rarity each one belongs to
     lives in the help text where the rest of the rarity guidance already was. */
  return pageHead('std') +
  '<div class="panel">' +
    '<div class="field"><span class="lbl">' + esc(t().rollResult) + ' (1–60)</span>' +
      '<div class="numrow">' + numBox('n', st.n, 1, 60) +
        '<div class="dicebar">' +
          NDICE.map(function (x, i) {
            /* The verb is spelled out once on the first button; the rest read as
               "…or this many" by proximity. Each carries the rarities it covers. */
            const rar = x.rar.map(function (r) { return t()[RAR_KEY[r]]; }).join(' / ');
            return '<button type="button" class="btn' + (i === 0 ? ' primary' : '') + '"' +
              ' data-act="roll" data-val="' + x.n + '"' +
              ' title="' + esc(t().roll + ' ' + x.n + 'd12 — ' + rar) + '">' +
              '<span class="dl">' + (i === 0 ? ICON_DIE + esc(t().roll) + ' ' : '') + x.n + 'd12</span>' +
              '<small>' + esc(rar) + '</small></button>';
          }).join('') +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="field"><span class="lbl">' + esc(t().source) + '</span><div class="chips">' +
      SOURCES.map(sr => {
        const on = !!st.src[sr[0]];
        const last = on && SOURCES.filter(x => st.src[x[0]]).length === 1;
        return '<button type="button" class="chip' + (on ? ' on' : '') + '"' +
          ' data-act="src" data-val="' + sr[0] + '"' +
          ' aria-pressed="' + (on ? 'true' : 'false') + '"' +
          (last ? ' data-last="1" title="' + esc(t().keepOneSource) + '"' : '') + '>' +
          esc(t()[sr[1]]) + '</button>';
      }).join('') +
    '</div></div>' +
    kindChips(LOOT_KINDS) +
  '</div>' +
  rollBar(pool.filter(it => it && kindAllows(it.kind))) +
  '<div class="results">' + orGrid(pickCards(pool)) + '</div>';
}

/* ---- 4: alternate tables ---- */
function altPick(kind, rarity, col, n){
  const id = ALT[kind][rarity][col][n - 1];
  return id ? BY_ID[id] : null;
}
function renderAlt(){
  const st = S.alt;
  const crit = st.hope === st.fear;
  const picks = [
    [altPick('item', st.rarity, 'hope', st.hope), 'hope'],
    [altPick('item', st.rarity, 'fear', st.fear), 'fear'],
    [altPick('consumable', st.rarity, 'hope', st.hope), 'hope'],
    [altPick('consumable', st.rarity, 'fear', st.fear), 'fear']
  ].filter(p => p[0] && kindAllows(p[0].kind));
  const cards = picks.map(p => cardHTML(p[0], { col: p[1], rollLabel: p[1] === 'hope' ? st.hope : st.fear }));

  const nextRar = RARITIES5[RARITIES5.indexOf(st.rarity) + 1];
  const critBox = crit
    ? '<div class="crit">' +
        '<div class="crit-txt">' +
          '<b>' + esc(t().crit) + '</b>' +
          '<span>' + esc(t().critSub) + '</span>' +
        '</div>' +
        '<div class="crit-acts">' +
          '<a class="btn sm primary" target="_blank" rel="noopener" href="' + esc(tableHref(altTableId(), st.rarity)) + '">' +
            esc(t().openTable) + ICON_EXT + '</a>' +
          (nextRar ? '<button type="button" class="btn sm" data-act="rarity" data-val="' + nextRar + '">' +
            esc(t().bumpTo) + ' ' + esc(S.lang === 'ru' ? RAR_GEN_RU[nextRar] : t()[RAR_KEY[nextRar]]) + '</button>' : '') +
        '</div>' +
      '</div>'
    : '';


  return pageHead('alt') +
  '<div class="panel">' +
    '<div class="field"><span class="lbl">' + esc(t().rarity) + '</span>' + rarityChips(RARITIES5, st.rarity, 'rarity') + '</div>' +
    '<div class="field"><span class="lbl">' + esc(t().rollResult) + '</span>' +
      '<div class="numrow">' +
        '<div class="dieblock"><span class="dielbl h">' + esc(t().hopeDie) + '</span>' + numBox('hope', st.hope, 1, 12, 'hope') + '</div>' +
        '<div class="dieblock"><span class="dielbl f">' + esc(t().fearDie) + '</span>' + numBox('fear', st.fear, 1, 12, 'fear') + '</div>' +
        '<div style="display:flex;align-items:flex-end"><button type="button" class="btn primary" data-act="rollDuality">' + ICON_DIE + esc(t().rollDuality) + '</button></div>' +
      '</div>' +
    '</div>' +
    kindChips(LOOT_KINDS) +
  '</div>' +
  rollBar(picks.map(p => p[0])) +
  '<div class="results">' + critBox + orGrid(cards) + '</div>';
}

function altTableId(){ return (!S.kind.item && S.kind.consumable) ? 'alt_consumable' : 'alt_item'; }
/* Absolute so it survives target="_blank"; a bare "#/..." would just re-hash the opener */
function tableHref(table, section){
  return baseUrl() + (hosted() ? '' : 'index.html') + '#/tables/' + table + (section ? '/' + section : '');
}

function rarityLabel(r){ return t()[RAR_KEY[r]] + ' · ' + t().tier + ' ' + TIERS[r]; }


/* ---- 5: wondrous ---- */
function renderWond(){
  const st = S.wond, max = DATA.wondrous.length;
  const it = DATA.wondrous[st.n - 1];
  return pageHead('wondrous') +
  '<div class="panel">' +
    '<div class="field"><span class="lbl">' + esc(t().rollResult) + ' (1–' + max + ')</span>' +
      '<div class="numrow">' + numBox('n', st.n, 1, max) +
        '<button type="button" class="btn primary" data-act="roll">' + ICON_DIE + esc(rollLabel(max)) + '</button>' +
      '</div>' +
    '</div>' +
  '</div>' +
  '<div class="results">' + orGrid([cardHTML(it)]) + '</div>';
}

/* ---- 6: community ---- */
function renderComm(){
  const st = S.comm;
  const list = DATA.community.filter(x => x.community === st.c);
  const it = list[st.n - 1];
  return pageHead('community') +
  '<div class="panel">' +
    '<div class="field"><span class="lbl">' + esc(t().community) + '</span>' +
      '<div class="chips">' + COMMUNITIES.map(c =>
        '<button type="button" class="chip' + (c[0] === st.c ? ' on' : '') + '" data-act="comm" data-val="' + c[0] + '">' +
        esc(S.lang === 'ru' ? c[1] : c[0]) + '</button>').join('') +
      '</div>' +
    '</div>' +
    '<div class="field"><span class="lbl">' + esc(t().rollResult) + ' (1–10)</span>' +
      '<div class="numrow">' + numBox('n', st.n, 1, 10) +
        '<button type="button" class="btn primary" data-act="roll">' + ICON_DIE + esc(rollLabel(10)) + '</button>' +
      '</div>' +
    '</div>' +
  '</div>' +
  '<div class="results">' + orGrid([cardHTML(it)]) + '</div>';
}

/* ---- tables browse ---- */
function sectionId(key){ return 'sec-' + key; }

/* Heading plus a button that copies a direct link to this very section */
function sectionHead(label, table, key){
  return '<div class="tsec-head">' +
    '<span class="lbl">' + esc(label) + '</span>' +
    '<button type="button" class="tsec-link" data-copy-sec="' + esc(table + '/' + key) + '"' +
      ' title="' + esc(t().copySection) + '" aria-label="' + esc(t().copySection) + '">' + ICON_LINK + '</button>' +
  '</div>';
}

function renderTables(){
  const st = S.tables;
  const chips = '<div class="chips">' + TABLE_DEFS.map(d0 =>
    '<a class="chip' + (d0.id === st.t ? ' on' : '') + '" href="#/tables/' + d0.id + '">' +
    esc(S.lang === 'ru' ? d0.ru : d0.en) + '</a>').join('') + '</div>';

  let body;
  if (EQ_TABLE[st.t]) {
    body = renderEquipTable(EQ_TABLE[st.t], st);
  } else if (st.t.indexOf('alt_') === 0) {
    const kind = st.t === 'alt_item' ? 'item' : 'consumable';
    body = RARITIES5.map(r => {
      const rows = [];
      for (let i = 0; i < 12; i++) {
        const h = BY_ID[ALT[kind][r].hope[i]], f = BY_ID[ALT[kind][r].fear[i]];
        rows.push('<tr><td class="num">' + (i+1) + '</td>' +
          '<td><button type="button" data-open="' + esc(h.id) + '">' + esc(nameOf(h)) + '</button></td>' +
          '<td><button type="button" data-open="' + esc(f.id) + '">' + esc(nameOf(f)) + '</button></td></tr>');
      }
      return '<div class="tsection" id="' + sectionId(r) + '" style="margin-top:20px">' +
        sectionHead(rarityLabel(r), st.t, r) +
        '<div class="tblwrap"><table class="alttable"><thead><tr><th>#</th><th class="h">' + esc(t().hope) + '</th><th class="f">' + esc(t().fear) + '</th></tr></thead><tbody>' +
        rows.join('') + '</tbody></table></div></div>';
    }).join('');
  } else {
    let list = DATA[st.t];
    const q = st.q.trim().toLowerCase();
    if (q) list = list.filter(x => matches(x, q));
    if (st.t === 'community') {
      body = COMMUNITIES.map(c => {
        const sub = list.filter(x => x.community === c[0]);
        if (!sub.length) return '';
        return '<div class="tsection" id="' + sectionId(c[0]) + '" style="margin-top:22px">' +
          sectionHead(S.lang === 'ru' ? c[1] + ' · ' + c[0] : c[0], st.t, c[0]) +
          renderList(sub) + '</div>';
      }).join('');
    } else {
      body = list.length ? renderList(list) : '<div class="empty">' + esc(t().nothing) + '</div>';
    }
  }

  const searchBar = st.t.indexOf('alt_') === 0 ? '' :
    '<div class="toolbar" style="margin-top:16px">' +
      '<div class="grow"><input type="search" id="tq" value="' + esc(st.q) + '" placeholder="' + esc(t().searchPh) + '"></div>' +
      '<button type="button" class="btn" data-copy-sec="' + esc(st.t) + '" title="' + esc(t().tableLink) + '" aria-label="' + esc(t().tableLink) + '">' +
        ICON_LINK + '<span class="btn-lbl">' + esc(t().tableLink) + '</span></button>' +
      '<div class="seg small" role="group" aria-label="' + esc(t().view) + '">' +
        '<button type="button" data-act="view" data-val="list"' + (st.view === 'list' ? ' class="on"' : '') + '>' + esc(t().viewList) + '</button>' +
        '<button type="button" data-act="view" data-val="grid"' + (st.view === 'grid' ? ' class="on"' : '') + '>' + esc(t().viewGrid) + '</button>' +
      '</div>' +
    '</div>';

  return pageHead('tables') + '<div class="panel">' + chips + '</div>' + searchBar + '<div style="margin-top:6px">' + body + '</div>';
}

/* ---------- equipment tables ----------
   One table per kind of gear, split into the books' tiers. Every facet is a
   multiple choice with everything on: a filter narrows by switching values off,
   which keeps "no preference" as the state you start from. */
function eqFacets(kind){
  const f = [['tier', t().tier, ['1','2','3','4'].map(k => [k, k])],
             ['src',  t().source, [['core', t().srcCore], ['hnf', t().srcHnf]]]];
  if (kind !== 'armor') {
    /* the book prints magic weapons in their own table and requires a Spellcast
       trait for them, so this is the weapon's class, not the damage it deals */
    f.push(['cls', t().eqClass, ['phy','mag'].map(k => [k, eqWord(EQ_CLS, k)])]);
    f.push(['trait', t().eqTrait, Object.keys(EQ_TRAIT).map(k => [k, eqWord(EQ_TRAIT, k)])]);
    f.push(['range', t().eqRange, Object.keys(EQ_RANGE).map(k => [k, eqWord(EQ_RANGE, k)])]);
    f.push(['burden', t().eqBurden, ['1','2'].map(k => [k, eqWord(EQ_BURDEN, k)])]);
  }
  f.push(['line', t().eqLineF, [['line', eqWord(EQ_LINE, 'line')], ['uniq', eqWord(EQ_LINE, 'uniq')]]]);
  return f;
}
/* Only the switched-off values are kept: an untouched filter is an empty
   object, which is also what makes the shareable link short. */
const eqOff = (facet, value) => !!(S.eqOff[facet] && S.eqOff[facet][value]);
function eqOffCount(kind){
  return eqFacets(kind).reduce(function (n, f) {
    return n + f[2].filter(function (o) { return eqOff(f[0], o[0]); }).length;
  }, 0);
}
function eqPasses(it, kind){
  const e = it.eq;
  if (eqOff('tier', String(e.tier))) return false;
  if (eqOff('src', it.src)) return false;
  if (eqOff('line', e.line ? 'line' : 'uniq')) return false;
  if (kind !== 'armor') {
    // a weapon that can deal either kind of damage belongs to both filters
    if (e.cls === 'any' ? (eqOff('cls','phy') && eqOff('cls','mag')) : eqOff('cls', e.cls)) return false;
    if (eqOff('trait', e.tr)) return false;
    if (eqOff('range', e.rg)) return false;
    if (eqOff('burden', String(e.bu))) return false;
  }
  return true;
}

/* Seven rows of chips fill a phone screen on their own, so the panel opens
   folded everywhere and says how many values are switched off. */
function eqFilterHTML(kind){
  const off = eqOffCount(kind);
  return '<div class="eqbar">' +
      '<button type="button" class="btn sm eqtoggle' + (off ? ' has' : '') + '"' +
        ' data-act="eqOpen" aria-expanded="' + (S.eqOpen ? 'true' : 'false') + '">' +
        esc(t().filters) + (off ? ' (−' + off + ')' : '') +
        '<i class="caret' + (S.eqOpen ? ' up' : '') + '"></i></button>' +
    '</div>' + (S.eqOpen ? eqFilterBody(kind, off) : '');
}
function eqFilterBody(kind, off){
  return '<div class="panel eqfilter">' + eqFacets(kind).map(function (f) {
    return '<div class="field"><span class="lbl">' + esc(f[1]) + '</span><div class="chips">' +
      f[2].map(function (o) {
        const on = !eqOff(f[0], o[0]);
        const last = on && f[2].filter(function (x) { return !eqOff(f[0], x[0]); }).length === 1;
        return '<button type="button" class="chip' + (on ? ' on' : '') + '"' +
          ' data-act="eqf" data-val="' + esc(f[0] + ':' + o[0]) + '"' +
          ' aria-pressed="' + (on ? 'true' : 'false') + '"' +
          (last ? ' data-last="1" title="' + esc(t().keepOneValue) + '"' : '') + '>' +
          esc(o[1]) + '</button>';
      }).join('') + '</div></div>';
  }).join('') +
  /* both buttons live inside the panel: outside it they read as page controls
     rather than as something that belongs to the filter */
  '<div class="eqacts">' +
    '<button type="button" class="btn sm" data-act="eqf" data-val="reset"' +
      (off ? '' : ' disabled') + '>' + esc(t().resetAll) + '</button>' +
    '<button type="button" class="btn sm" data-act="eqLink">' + ICON_LINK +
      esc(t().filterLink) + '</button>' +
  '</div></div>';
}

/* ---- the filter state as a piece of the address ----
   "f_" then one group per facet, listing the values that are switched off.
   Nothing is switched off in a fresh table, so a plain table link stays plain. */
function eqEncode(kind){
  const parts = eqFacets(kind).map(function (f) {
    const off = f[2].filter(function (o) { return eqOff(f[0], o[0]); }).map(o => o[0]);
    return off.length ? f[0] + '-' + off.join('-') : '';
  }).filter(Boolean);
  return parts.length ? 'f_' + parts.join('_') : '';
}
function eqDecode(seg){
  S.eqOff = {};
  if (!seg || seg.indexOf('f_') !== 0) return;
  seg.slice(2).split('_').forEach(function (g) {
    const p = g.split('-'), facet = p.shift();
    if (!facet || !p.length) return;
    S.eqOff[facet] = {};
    p.forEach(function (v) { S.eqOff[facet][v] = true; });
  });
}

function renderEquipTable(kind, st){
  const q = st.q.trim().toLowerCase();
  const list = EQ.filter(function (it) {
    return it.eq.t === kind && eqPasses(it, kind) && (!q || matches(it, q));
  });
  if (!list.length) return eqFilterHTML(kind) + '<div class="empty">' + esc(t().nothing) + '</div>';
  return eqFilterHTML(kind) + [1, 2, 3, 4].map(function (n) {
    const sub = list.filter(function (it) { return it.eq.tier === n; });
    if (!sub.length) return '';
    return '<div class="tsection" id="' + sectionId('t' + n) + '" style="margin-top:22px">' +
      sectionHead(t().tier + ' ' + n, st.t, 't' + n) +
      renderList(sub) + '</div>';
  }).join('');
}

/* Ticks everything currently on screen — which is whatever the filter or the
   search left, so "all" always means "all of what you are looking at". */
function selectAllHTML(list){
  if (!list.length) return '';
  const all = list.every(function (it) { return S.sel[it.id]; });
  // the label wraps the caption too, so the whole line is one comfortable target
  return '<label class="selall">' +
      '<span class="selbox"' + (all ? ' data-on="1"' : '') + '>' +
        '<input type="checkbox" data-sel-all="' + esc(list.map(x => x.id).join(',')) + '"' +
        (all ? ' checked' : '') + '></span>' +
      '<span>' + esc(t().selectAll) + ' (' + list.length + ')</span>' +
    '</label>';
}

function renderList(list){
  return selectAllHTML(list) + (S.tables.view === 'list'
    ? '<div class="rows">' + list.map(function (it) { return rowHTML(it); }).join('') + '</div>'
    : '<div class="tgrid">' + list.map(tileHTML).join('') + '</div>');
}

/* removeFrom: a remove button instead of the selection box (inside a list) */
function rowHTML(it, removeFrom, tail){
  if (typeof removeFrom !== 'string') removeFrom = '';
  return '<div class="row' + (!removeFrom && S.sel[it.id] ? ' sel' : '') + '">' +
      (removeFrom ? '' : selBox(it.id)) +
      '<button type="button" class="row-main" data-open="' + esc(it.id) + '">' +
        imgTag(it) +
        '<span class="rt"><b>' + (it.roll ? '<span class="rnum">' + esc(it.roll) + '</span>' : '') +
          esc(nameOf(it)) +
          (tail ? '<i class="rtail">' + esc(tail) + '</i>' : '') + '</b>' +
        (isEquip(it) ? '<span class="rstats">' + esc(eqLine(it, true)) + '</span>' : '') +
        (descOf(it) ? '<span>' + descHtml(it) + '</span>' : '') + rowCraft(it) + '</span>' +
        '<span class="rm">' + kindBadge(it) +
        '<span class="badge src">' + esc(srcLabel(it)) + '</span></span>' +
      '</button>' +
      (removeFrom
        ? '<button type="button" class="row-x" data-remove="' + esc(removeFrom + ':' + it.id) + '" title="' + esc(t().removeItem) + '" aria-label="' + esc(t().removeItem) + '">&times;</button>'
        : '') +
    '</div>';
}

/* Shown only while a list is being collected into */
/* ---------- selection ---------- */
const selCount = () => Object.keys(S.sel).length;
const selIds = () => Object.keys(S.sel);
function selBox(id){
  const on = !!S.sel[id];
  return '<label class="selbox"' + (on ? ' data-on="1"' : '') + '>' +
    '<input type="checkbox" data-sel="' + esc(id) + '"' + (on ? ' checked' : '') +
    ' aria-label="' + esc(t().selected) + '"></label>';
}

function tileHTML(it){
  const sub = S.lang === 'ru' ? it.en : (it.ru || '');
  return '<div class="tilewrap' + (S.sel[it.id] ? ' sel' : '') + '">' + selBox(it.id) +
    '<button type="button" class="tile" data-open="' + esc(it.id) + '">' +
    '<div class="tile-img">' +
      (it.roll ? '<span class="tile-n">' + esc(it.roll) + '</span>'
               : (isEquip(it) && it.eq.tier ? '<span class="tile-n">' + esc(t().tier + ' ' + it.eq.tier) + '</span>' : '')) +
      '<span class="tile-k ' + (isEquip(it) ? 'equip' : it.kind === 'consumable' ? 'cons' : 'item') +
        '" title="' + esc(isEquip(it) ? eqWord(EQ_TYPE, it.eq.t) : it.kind === 'consumable' ? t().cons : t().item) + '"></span>' +
      imgTag(it) +
    '</div>' +
    '<div class="tile-b"><b>' + esc(nameOf(it)) + '</b>' + (sub ? '<span>' + esc(sub) + '</span>' : '') + '</div>' +
  '</button></div>';
}

/* ---- search ---- */
function matches(it, q){
  return (it.ru && it.ru.toLowerCase().indexOf(q) >= 0) ||
         (it.en && it.en.toLowerCase().indexOf(q) >= 0) ||
         (it.rud && it.rud.toLowerCase().indexOf(q) >= 0) ||
         (it.ende && it.ende.toLowerCase().indexOf(q) >= 0) ||
         (isEquip(it) && eqLine(it).toLowerCase().indexOf(q) >= 0);
}
function renderSearch(){
  const q = S.search.q.trim().toLowerCase();
  let body;
  if (!q) {
    body = '<div class="empty">' + esc(S.lang === 'ru' ? 'Начните вводить запрос' : 'Start typing') + '</div>';
  } else {
    const res = SEARCHABLE.filter(x => kindAllows(x.kind) && matches(x, q)).slice(0, 300);
    // same header as the tables: "all" means everything the query left
    body = res.length ? selectAllHTML(res) +
                        '<div class="rows">' + res.map(function (it) { return rowHTML(it); }).join('') + '</div>'
                      : '<div class="empty">' + esc(t().nothing) + '</div>';
  }
  return pageHead('search') +
    '<div class="panel" style="margin-bottom:16px">' +
      '<div class="field"><input type="search" id="sq" value="' + esc(S.search.q) + '" placeholder="' + esc(t().searchPh) + '" autofocus></div>' +
      kindChips() +
    '</div>' +
    body;
}

/* ---- lists ---- */
/* The "no server here" notice is long and only needs reading once, so it can be
   dismissed for good. The "storage is blocked" one cannot: nothing would
   remember the dismissal, and the warning is the reason lists vanish. */
const WARN_KEY = 'dhloot.warn.v1';
function warnHidden(){
  try { return localStorage.getItem(WARN_KEY) === '1'; } catch (e) { return false; }
}
function hideWarn(){
  try { localStorage.setItem(WARN_KEY, '1'); } catch (e) {}
}
function storageWarning(){
  if (!storageWorks()) {
    return '<div class="warn"><b>' + esc(t().noStorageTitle) + '</b> ' + esc(t().noStorage) + '</div>';
  }
  if (warnHidden()) return '';
  return '<div class="warn"><b>' + esc(t().localOnlyTitle) + '</b> ' + esc(t().localOnly) +
    '<button type="button" class="warn-x" data-act="hideWarn"' +
      ' title="' + esc(t().dismiss) + '" aria-label="' + esc(t().dismiss) + '">&times;</button></div>';
}

function listCardHTML(l){
  const items = listItems(l);
  const thumbs = items.slice(0, 6).map(function (it) {
    return imgTag(it);
  }).join('');
  return '<div class="listcard">' +
    '<a class="listcard-main" href="' + esc(listHash(l)) + '">' +
      '<div class="listcard-top">' +
        '<b>' + esc(l.name) + '</b>' +
        '<span class="badge num">' + items.length + '</span>' +
      '</div>' +
      (thumbs ? '<div class="listcard-thumbs">' + thumbs + '</div>'
              : '<p class="listcard-empty">' + esc(t().listEmpty) + '</p>') +
    '</a>' +
    '<div class="listcard-acts">' +
      '<button type="button" class="btn sm" data-share-list="' + esc(l.id) + '">' + ICON_LINK + esc(t().share) + '</button>' +
      '<button type="button" class="btn sm danger" data-del-list="' + esc(l.id) + '">' + esc(t().del) + '</button>' +
    '</div>' +
  '</div>';
}

function renderLists(){
  return pageHead('lists') +
    storageWarning() +
    '<div class="panel" style="margin-top:16px">' +
      '<div class="field"><span class="lbl">' + esc(t().newList) + '</span>' +
        '<div class="numrow">' +
          '<div class="grow"><input type="text" id="lname" value="' + esc(S.listDraft) + '" placeholder="' + esc(t().listNamePh) + '"></div>' +
          '<button type="button" class="btn primary" data-act="createList">' + esc(t().create) + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="field"><span class="lbl">' + esc(t().importList) + '</span>' +
        '<div class="numrow">' +
          '<div class="grow"><input type="text" id="limport" value="' + esc(S.importDraft) + '" placeholder="' + esc(t().importPh) + '"></div>' +
          '<button type="button" class="btn" data-act="importList">' + esc(t().importBtn) + '</button>' +
        '</div>' +
        '</div>' +
    '</div>' +
    (S.lists.length
      ? '<div class="listgrid">' + S.lists.map(listCardHTML).join('') + '</div>'
      : '<div class="empty">' + esc(t().noLists) + '</div>');
}

function renderOneList(id){
  const l = getList(id);
  if (!l) {
    return '<h1 class="page-h">' + esc(t().listNotFound) + '</h1>' +
      '<p class="page-sub">' + esc(t().listNotFoundSub) + '</p>' +
      '<a class="btn primary" href="#/lists">' + esc(t().lists) + '</a>';
  }
  const items = listItems(l);
  return '<h1 class="page-h">' +
      '<input type="text" id="rename" class="titleinput" value="' + esc(l.name) + '" data-list="' + esc(l.id) + '" aria-label="' + esc(t().rename) + '">' +
    '</h1>' +
    '<p class="page-sub">' + esc(items.length + ' ' + plural(items.length)) + '</p>' +
    '<div class="card-acts" style="margin-bottom:16px">' +
      '<button type="button" class="btn sm" data-share-list="' + esc(l.id) + '">' + ICON_LINK + esc(t().share) + '</button>' +
      '<button type="button" class="btn sm" data-copy-listtext="' + esc(l.id) + '">' + ICON_COPY + esc(t().copyText) + '</button>' +
      '<button type="button" class="btn sm danger" data-del-list="' + esc(l.id) + '">' + esc(t().del) + '</button>' +
    '</div>' +
    listNoteHTML(l) +
    (items.length > 1 ? listRollPanel(l, items) : '') +
    (items.length
      ? '<div class="rows lrows" style="margin-top:16px">' +
          items.map(function (it, i) { return listRowHTML(l, it, i); }).join('') +
        '</div>'
      : '<div class="empty">' + esc(t().listEmptyHint) + '</div>') +
    storageWarning();
}

/* roll a position inside the list itself */
function listRollPanel(l, items){
  const hit = (S.listRoll.id === l.id && S.listRoll.n >= 1 && S.listRoll.n <= items.length)
    ? items[S.listRoll.n - 1] : null;
  /* Same shape as every other roll page: a field you can type into for a roll
     made at the table, and a button for when the app should pick. */
  const n = (S.listRoll.id === l.id && S.listRoll.n) ? S.listRoll.n : 1;
  return '<div class="panel" style="margin-bottom:16px">' +
    '<div class="field" style="margin-bottom:' + (hit ? '14px' : '0') + '">' +
      '<span class="lbl">' + esc(t().rollResult) + ' (1–' + items.length + ')</span>' +
      '<div class="numrow">' + numBox('n', n, 1, items.length) +
        '<button type="button" class="btn primary" data-act="rollList" data-val="' + esc(l.id) + '">' +
          ICON_DIE + esc(rollLabel(items.length)) + '</button>' +
        (hit ? '<button type="button" class="btn ghost" data-act="clearRoll">' + esc(t().clear) + '</button>' : '') +
      '</div>' +
    '</div>' +
    (hit ? orGrid([cardHTML(hit, { rollLabel: S.listRoll.n })]) : '') +
    /* Whatever the GM wrote about this entry is exactly what they need at the
       moment it comes up — but only on their own screen, never in a copy. */
    (hit ? rolledNoteHTML(l, hit) : '') +
  '</div>';
}

function rolledNoteHTML(l, it){
  const note = itemMeta(l, it.id).note;
  if (!note) return '';
  return '<div class="hitnote">' + ICON_NOTE +
    '<span><b>' + esc(t().note) + '</b>' + lines(note) + '</span></div>';
}


function listRowHTML(l, it, i){
  const m = itemMeta(l, it.id);
  const key = l.id + ':' + it.id;
  /* The box is always in the DOM so opening it needs no re-render — typing in a
     note must not rebuild the page under the cursor. It only shows when there
     is something in it, or when the button is pressed. */
  const noteBox = '<div class="rnote"' + (m.note ? '' : ' hidden') + '>' +
      '<textarea rows="2" data-note="' + esc(key) + '" placeholder="' + esc(t().notePh) + '">' +
      esc(m.note || '') + '</textarea>' +
      noteShowHTML('data-note-show="' + esc(key) + '"', m.noteShow, t().noteCopyItem) +
    '</div>';
  return '<div class="row lrow' + (m.note ? ' has-note' : '') + '">' +
      '<span class="lrow-grip" draggable="true" data-drag="' + esc(key) + '"' +
        ' title="' + esc(t().dragHint) + '" aria-hidden="true">' + ICON_GRIP + '</span>' +
      /* the position doubles as the keyboard way to reorder: type 20 and the
         entry lands at 20, no matter how far away it started */
      '<input type="number" class="lrow-n" min="1" max="' + l.ids.length + '"' +
        ' inputmode="numeric" value="' + (i + 1) + '" data-pos="' + esc(key) + '"' +
        ' aria-label="' + esc(t().position) + '">' +
      '<button type="button" class="row-main" data-open="' + esc(it.id) + '">' +
        imgTag(it) +
        '<span class="rt"><b>' + esc(nameOf(it)) + '</b>' +
        (isEquip(it) ? '<span class="rstats">' + esc(eqLine(it, true)) + '</span>' : '') +
        (descOf(it) ? '<span>' + descHtml(it) + '</span>' : '') + rowCraft(it) + '</span>' +
        /* the same badges every other listing shows — without them a list is the
           one place you cannot tell an item from a weapon at a glance */
        '<span class="rm">' + kindBadge(it) +
        '<span class="badge src">' + esc(srcLabel(it)) + '</span></span>' +
      '</button>' +
      '<div class="lrow-meta">' +
        '<label><span>' + esc(t().qty) + '</span>' +
          '<input type="number" min="1" max="99" inputmode="numeric" data-qty="' + esc(l.id + ':' + it.id) + '" value="' + (m.qty || '') + '" placeholder="1"></label>' +
        '<label><span>' + esc(t().gold) + '</span>' +
          '<input type="number" min="0" max="99999" inputmode="numeric" data-gold="' + esc(l.id + ':' + it.id) + '" value="' + (m.gold || '') + '" placeholder="—"></label>' +
      '</div>' +
      '<div class="lrow-acts">' +
        '<button type="button" class="lrow-note' + (m.note ? ' on' : '') + '" data-note-toggle="' + esc(key) + '"' +
          ' title="' + esc(t().note) + '" aria-label="' + esc(t().note) + '">' + ICON_NOTE + '</button>' +
        '<button type="button" class="row-x" data-remove="' + esc(l.id + ':' + it.id) + '" title="' + esc(t().removeItem) + '" aria-label="' + esc(t().removeItem) + '">&times;</button>' +
      '</div>' +
      noteBox +
    '</div>';
}

/* The list-level note: shop rules, homebrew, whatever the GM keeps out of the
   item text. Folded away when empty so a list without notes looks as before. */
function listNoteHTML(l){
  return '<details class="lnote"' + (l.note ? ' open' : '') + '>' +
    '<summary>' + ICON_NOTE + '<span>' + esc(t().listNote) + '</span>' +
      '<i>' + esc(t().noteInLink) + '</i></summary>' +
    '<textarea rows="3" data-list-note="' + esc(l.id) + '" placeholder="' + esc(t().listNotePh) + '">' +
      esc(l.note || '') + '</textarea>' +
    noteShowHTML('data-list-note-show="' + esc(l.id) + '"', l.noteShow, t().noteCopyList) +
  '</details>';
}

/* A note stays with the GM unless this is ticked — then it rides along at the
   end of the copied text, after the description and the reference blocks. */
function noteShowHTML(attr, on, label){
  return '<label class="noteshow' + (on ? ' on' : '') + '">' +
    '<input type="checkbox" ' + attr + (on ? ' checked' : '') + '>' +
    '<span>' + esc(label) + '</span></label>';
}

function renderSharedList(payload){
  const data = decodeList(payload);
  if (!data) {
    return '<h1 class="page-h">' + esc(t().notFound) + '</h1>' +
      '<p class="page-sub">' + esc(t().badShare) + '</p>' +
      '<a class="btn primary" href="#/roll/std">' + esc(t().toStart) + '</a>';
  }
  const items = data.ids.map(function (id) { return BY_ID[id]; });
  const fake = { id: '', name: data.name, ids: data.ids, meta: data.meta };
  return '<h1 class="page-h">' + esc(data.name || t().untitled) + '</h1>' +
    '<p class="page-sub">' + esc(t().sharedList) + ' · ' + esc(items.length + ' ' + plural(items.length)) + '</p>' +
    '<div class="card-acts" style="margin-bottom:18px">' +
      '<button type="button" class="btn primary" data-act="saveShared" data-val="' + esc(payload) + '">' + esc(t().saveToMine) + '</button>' +
    '</div>' +
    '<div class="rows">' + items.map(function (it) {
      const m = itemMeta(fake, it.id);
      const bits = [];
      if (m.qty > 1) bits.push('×' + m.qty);
      if (m.gold) bits.push(m.gold + ' ' + t().goldUnit);
      return rowHTML(it, '', bits.join(' · '));
    }).join('') + '</div>';
}

function plural(n){
  if (S.lang !== 'ru') return n === 1 ? 'item' : 'items';
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return 'позиция';
  if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return 'позиции';
  return 'позиций';
}

/* ---- single item page (shareable link target) ---- */
const TABLE_OF = { core:{item:'core_item',consumable:'core_consumable'}, hnf:{item:'hnf_item',consumable:'hnf_consumable'} };
function tableIdOf(it){
  if (isEquip(it) && !it.roll)
    return { weapon:'eq_weapon', secondary:'eq_secondary', armor:'eq_armor' }[it.eq.t];
  if (it.src === 'wondrous') return 'wondrous';
  if (it.src === 'community') return 'community';
  return TABLE_OF[it.src][it.kind];
}
function renderItemPage(id){
  const it = BY_ID[id];
  if (!it) {
    return '<h1 class="page-h">' + esc(t().notFound) + '</h1>' +
      '<p class="page-sub">' + esc(t().notFoundSub) + '</p>' +
      '<a class="btn primary" href="#/roll/std">' + esc(t().toStart) + '</a>';
  }
  const tdef = TABLE_DEFS.filter(x => x.id === tableIdOf(it))[0];
  const tname = tdef ? (S.lang === 'ru' ? tdef.ru : tdef.en) : '';
  const where = it.src === 'community'
    ? (S.lang === 'ru' ? it.community_ru + ' · ' + it.community : it.community)
    : tname;
  return '<h1 class="page-h">' + esc(nameOf(it)) + '</h1>' +
    '<p class="page-sub">' + esc(where + (it.roll ? ' · ' + t().rollNo + ' ' + it.roll
        : isEquip(it) && it.eq.tier ? ' · ' + t().tier + ' ' + it.eq.tier : '')) + '</p>' +
    '<div class="itempage">' + cardHTML(it, { full: true }) + '</div>' +
    '<div class="card-acts" style="margin-top:18px">' +
      '<a class="btn ghost" target="_blank" rel="noopener" href="' +
        esc(tableHref(tableIdOf(it), it.src === 'community' ? it.community : '')) + '">' +
        esc(t().openTable) + ICON_EXT + '</a>' +
      '<a class="btn ghost" href="#/roll/std">' + esc(t().toStart) + '</a>' +
    '</div>';
}

/* ============================================================
   ROUTER
   ============================================================ */
const ROUTES = {
  'roll/std': renderStd,
  'lists': renderLists,
  'roll/alt': renderAlt,
  'roll/wondrous': renderWond,
  'roll/community': renderComm,
  'tables': renderTables,
  'search': renderSearch
};
const TAB_LIST = [
  ['roll/std','std','1'], ['roll/alt','alt','2'],
  ['roll/wondrous','wondrous','3'], ['roll/community','community','4'],
  ['tables','tables',''], ['lists','lists',''], ['search','search','']
];
/* links handed out before the three d12 modes were merged */
const LEGACY_ROUTES = { 'roll/core':'roll/std', 'roll/hnf':'roll/std', 'roll/all':'roll/std' };

const TABLES_RE = /^tables(?:\/([a-z_]+))?(?:\/([A-Za-z0-9_-]+))?$/;

function currentRoute(){
  const h = (location.hash || '').replace(/^#\/?/, '');
  if (/^i\/[\w-]+$/.test(h)) return h;
  if (/^lists\/[\w-]+$/.test(h)) return h;
  if (/^l\/[A-Za-z0-9_-]+$/.test(h)) return h;
  if (LEGACY_ROUTES[h]) {
    S.std.src = { core: h !== 'roll/hnf', hnf: h !== 'roll/core' };
    return LEGACY_ROUTES[h];
  }
  const m = TABLES_RE.exec(h);
  if (m) {
    const table = m[1] && TABLE_DEFS.some(d => d.id === m[1]) ? m[1] : '';
    // filters belong to the table you are looking at, so they fold and reset
    // whenever the address points somewhere else
    if (table && table !== S.tables.t) { S.tables.t = table; S.eqOpen = false; S.eqOff = {}; }
    const tail = m[2] || '';
    if (tail.indexOf('f_') === 0) { eqDecode(tail); S.tables.anchor = ''; S.eqOpen = true; }
    else S.tables.anchor = tail;
    return 'tables';
  }
  return ROUTES[h] ? h : 'roll/std';
}
function renderTabs(){
  const cur = currentRoute();
  $('#tabs').innerHTML = TAB_LIST.map((tab, i) =>
    '<a href="#/' + tab[0] + '" class="' + (tab[0] === cur ? 'on' : '') + (i === 4 ? ' sep' : '') + '">' +
      (tab[2] ? '<span class="n">' + tab[2] + '</span>' : '') + esc(t().tabs[tab[1]]) +
    '</a>').join('');
}

/* Appears only while something is ticked, and goes away with it — so the cross
   on the counter reads as "clear this" and "close this" at once. */
function markSelected(box, on){
  const holder = box.closest('.row') || box.closest('.tilewrap');
  if (holder) holder.classList.toggle('sel', on);
  box.closest('.selbox').toggleAttribute('data-on', on);
}
/* keep the header box honest after individual ticks */
function syncSelectAll(){
  const all = $('[data-sel-all]');
  if (!all) return;
  const ids = all.dataset.selAll.split(',');
  const every = ids.every(id => S.sel[id]);
  all.checked = every;
  all.parentElement.toggleAttribute('data-on', every);
}

/* The menu is absolutely positioned, so on a tall card it could open below the
   fold and look like nothing happened. Flip it to whichever side has room and
   pull it into view. */
function placeMenu(){
  const menu = $('.dropmenu');
  if (!menu) return;
  const drop = menu.parentElement;
  const btn = drop.querySelector('.btn');
  const below = window.innerHeight - btn.getBoundingClientRect().bottom;
  const need = menu.getBoundingClientRect().height + 16;
  menu.classList.toggle('up', below < need);
  if (menu.scrollIntoView) menu.scrollIntoView({ block: 'nearest' });
}

function renderSelBar(){
  const bar = $('#selBar');
  const n = selCount();
  if (!n) { bar.hidden = true; bar.innerHTML = ''; return; }
  bar.hidden = false;
  bar.innerHTML = '<div class="wrap selbar">' +
    '<span class="selcount">' + esc(t().selected) + ' ' + n +
      '<button type="button" class="selx" data-act="clearSel"' +
        ' title="' + esc(t().clearSel) + '" aria-label="' + esc(t().clearSel) + '">&times;</button>' +
    '</span>' +
    '<div class="selacts">' +
      addToListBtn('sel', selIds(), true) +
      '<button type="button" class="btn sm" data-act="copySel">' + ICON_COPY + esc(t().copySel) + '</button>' +
    '</div>' +
  '</div>';
}

function render(){
  const r = currentRoute();
  S.route = r;
  renderTabs();
  renderSelBar();
  if (r.indexOf('i/') === 0) {
    const id = r.slice(2);
    $('#view').innerHTML = renderItemPage(id);
    const it = BY_ID[id];
    document.title = (it ? nameOf(it) + ' — ' : '') + 'Генератор лута Daggerheart';
  } else if (r.indexOf('lists/') === 0) {
    // old short link: hand it straight over to the shareable address
    const own = getList(r.slice(6));
    if (own) { S.openList = own.id; syncListUrl(own); }
    $('#view').innerHTML = renderOneList(r.slice(6));
    document.title = 'Генератор лута — Daggerheart';
  } else if (r.indexOf('l/') === 0) {
    const payload = r.slice(2);
    /* An edit leaves the address one step behind the list, so a payload we
       wrote ourselves still belongs to the list we were editing. A payload we
       did not write is someone else's link and has to be matched honestly. */
    const own = (payload === S.urlPayload && getList(S.openList)) || findListByPayload(payload);
    if (own) {
      S.openList = own.id;
      syncListUrl(own);
      $('#view').innerHTML = renderOneList(own.id);
    } else {
      S.openList = ''; S.urlPayload = '';
      $('#view').innerHTML = renderSharedList(payload);
    }
    document.title = 'Генератор лута — Daggerheart';
  } else {
    S.openList = ''; S.urlPayload = '';
    $('#view').innerHTML = ROUTES[r]();
    document.title = 'Генератор лута — Daggerheart';
  }
  refreshModal();
  placeMenu();
  $('#footText').innerHTML = t().foot;
  document.documentElement.lang = S.lang;
  const focusId = render._focus;
  if (focusId) {
    const el = document.getElementById(focusId);
    if (el) {
      el.focus();
      // setSelectionRange throws on <input type="number">; only text-ish inputs support it
      if (el.type === 'text' || el.type === 'search') {
        try { const v = el.value; el.setSelectionRange(v.length, v.length); } catch (err) {}
      }
    }
    render._focus = null;
  }

  if (S.tables.anchor && r === 'tables') {
    const target = document.getElementById(sectionId(S.tables.anchor));
    S.tables.anchor = '';
    if (target) {
      if (target.scrollIntoView) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.classList.add('flash');
      setTimeout(function () { target.classList.remove('flash'); }, 1600);
    }
  }
}

/* ============================================================
   EVENTS
   ============================================================ */
function stateForRoute(){
  const r = S.route;
  if (r === 'roll/std') return S.std;
  if (r === 'roll/alt') return S.alt;
  if (r === 'roll/wondrous') return S.wond;
  if (r === 'roll/community') return S.comm;
  return null;
}

function rollNd12(n){ let s = 0; for (let i = 0; i < n; i++) s += d(12); return s; }

document.addEventListener('click', function (e) {
  const langBtn = e.target.closest('#langSeg button');
  if (langBtn) {
    S.lang = langBtn.dataset.lang;
    $$('#langSeg button').forEach(b => b.classList.toggle('on', b === langBtn));
    render();
    return;
  }

  const closeEl = e.target.closest('[data-close]');
  if (closeEl) { closeModal(); return; }

  const openEl = e.target.closest('[data-open]');
  if (openEl) { openModal(openEl.dataset.open); return; }

  const cs = e.target.closest('[data-copy-sec]');
  if (cs) {
    const parts = cs.dataset.copySec.split('/');
    copyText(tableHref(parts[0], parts[1] || ''), parts[1] ? t().sectionLinkCopied : t().tableLinkCopied);
    return;
  }

  const cn = e.target.closest('[data-copy-name]');
  if (cn) { copyText(nameForShare(BY_ID[cn.dataset.copyName]), t().nameCopied); return; }

  const cf = e.target.closest('[data-copy-full]');
  if (cf) {
    const it = BY_ID[cf.dataset.copyFull];
    copyRich(shareHtml(it), shareText(it), t().textCopied);
    return;
  }

  const sh = e.target.closest('[data-share]');
  if (sh) { shareItem(sh.dataset.share); return; }

  const ci = e.target.closest('[data-copy-img]');
  if (ci) { copyImage(BY_ID[ci.dataset.copyImg]); return; }

  const si = e.target.closest('[data-send]');
  if (si) { sendItem(BY_ID[si.dataset.send]); return; }

  const step = e.target.closest('[data-step]');
  if (step) {
    const inp = document.getElementById(step.dataset.for);
    if (!inp) return;
    const v = clamp((parseInt(inp.value, 10) || 0) + parseInt(step.dataset.step, 10),
                    parseInt(inp.min, 10), parseInt(inp.max, 10));
    inp.value = v;
    applyNum(inp.id, v);
    return;
  }

  // one control adds to a list, from a card or from the selection bar
  const at = e.target.closest('[data-add-to]');
  if (at) {
    const parts = at.dataset.addTo.split('|');
    applyAddTo(parts[0], parts[1]);
    return;
  }



  const rm = e.target.closest('[data-remove]');
  if (rm) {
    const parts = rm.dataset.remove.split(':');
    toggleInList(parts[0], parts[1]); render(); return;
  }

  const sl = e.target.closest('[data-share-list]');
  if (sl) {
    const l = getList(sl.dataset.shareList);
    if (l && !l.ids.length) { toast(t().listEmpty); return; }
    if (l) copyText(listShareUrl(l), t().listLinkCopied);
    return;
  }

  const nt = e.target.closest('[data-note-toggle]');
  if (nt) {
    const row = nt.closest('.lrow');
    const box = row && row.querySelector('.rnote');
    if (box) {
      box.hidden = !box.hidden;
      if (!box.hidden) box.querySelector('textarea').focus();
    }
    return;
  }

  const cr = e.target.closest('[data-copy-roll]');
  if (cr) {
    const items = cr.dataset.copyRoll.split(',').map(id => BY_ID[id]).filter(Boolean);
    if (items.length) copyRich(rollHtml(items), rollText(items), t().rollCopied);
    return;
  }

  const clt = e.target.closest('[data-copy-listtext]');
  if (clt) { const l = getList(clt.dataset.copyListtext); if (l) copyRich(listAsHtml(l), listAsText(l), t().listCopied); return; }

  const dl = e.target.closest('[data-del-list]');
  if (dl) {
    const l = getList(dl.dataset.delList);
    if (l && confirm(t().deleteConfirm.replace('%s', l.name))) {
      const wasOpen = S.openList === l.id;
      deleteList(l.id);
      // the address described the list that just went away
      if (wasOpen || S.route.indexOf('lists/') === 0) {
        S.openList = ''; S.urlPayload = '';
        location.hash = '#/lists';
        return;
      }
      render();
    }
    return;
  }

  const act = e.target.closest('[data-act]');
  if (!act) return;
  const st = stateForRoute();
  const a = act.dataset.act, val = act.dataset.val;

  if (a === 'rarity') { st.rarity = val; render(); return; }
  if (a === 'help')   { S.help = S.help === val ? '' : val; render(); return; }
  if (a === 'kind') {
    if (act.dataset.last) { toast(t().keepOneKind); return; }
    S.kind[val] = !S.kind[val];
    render(); return;
  }
  if (a === 'hideWarn') { hideWarn(); render(); return; }
  if (a === 'eqOpen') { S.eqOpen = !S.eqOpen; render(); return; }
  if (a === 'eqLink') { copyText(eqFilterUrl(), t().filterLinkCopied); return; }
  if (a === 'eqf') {
    if (val === 'reset') S.eqOff = {};
    else {
      // a facet with everything switched off would show nothing at all
      if (act.dataset.last) { toast(t().keepOneValue); return; }
      const p = val.split(':'), f = p[0], v = p[1];
      S.eqOff[f] = S.eqOff[f] || {};
      if (S.eqOff[f][v]) delete S.eqOff[f][v]; else S.eqOff[f][v] = true;
    }
    render(); return;
  }
  if (a === 'src') {
    // never leave the roll with nothing to draw from
    if (act.dataset.last) { toast(t().keepOneSource); return; }
    S.std.src[val] = !S.std.src[val];
    render(); return;
  }
  if (a === 'createList') {
    const input = document.getElementById('lname');
    const l = createList(input ? input.value : '');
    S.listDraft = '';
    toast(t().listCreated.replace('%s', l.name));
    render();
    return;
  }
  if (a === 'newListFor') { S.newListFor = val; S.newListDraft = ''; render(); focusNew(); return; }
  if (a === 'cancelNew')  { S.newListFor = ''; S.newListDraft = ''; render(); return; }
  if (a === 'createFor') {
    const input = document.getElementById('newlist');
    const l = createList(input ? input.value : '');
    S.newListFor = ''; S.newListDraft = '';
    addIdsTo(l, val === 'sel' ? selIds() : [val]);
    return;
  }
  if (a === 'menu')     { S.menuFor = S.menuFor === val ? '' : val; render(); return; }
  if (a === 'clearSel') { S.sel = {}; S.menuFor = ''; render(); return; }
  if (a === 'copySel') {
    const items = selIds().map(id => BY_ID[id]).filter(Boolean);
    if (items.length) copyRich(selAsHtml(items), selAsText(items), t().selCopied);
    return;
  }
  if (a === 'rollList') {
    const l = getList(val);
    if (l && l.ids.length) { S.listRoll = { id: l.id, n: d(listItems(l).length) }; render(); }
    return;
  }
  if (a === 'clearRoll') { S.listRoll = { id: '', n: 0 }; render(); return; }
  if (a === 'importList') {
    const field = document.getElementById('limport');
    const raw = (field ? field.value : '').trim();
    // accept a whole URL or just the payload
    const m = /#\/l\/([A-Za-z0-9_-]+)/.exec(raw);
    const data = decodeList(m ? m[1] : raw);
    if (!data) { toast(t().badShare, true); return; }
    const l = createList(data.name);
    l.ids = data.ids.slice();
    if (data.meta) l.meta = JSON.parse(JSON.stringify(data.meta));
    saveLists();
    S.importDraft = '';
    goToList(l);
    return;
  }
  if (a === 'saveShared') {
    const data = decodeList(val);
    if (!data) return;
    const l = createList(data.name);
    l.ids = data.ids.slice();
    if (data.meta) l.meta = JSON.parse(JSON.stringify(data.meta));
    if (data.note) l.note = data.note;
    if (data.noteShow) l.noteShow = true;
    saveLists();
    toast(t().savedToLists);
    goToList(l);
    return;
  }
  if (a === 'comm')   { S.comm.c = val; S.comm.n = 1; render(); return; }
  if (a === 'view')   { S.tables.view = val; render(); return; }

  if (a === 'roll') {
    if (S.route === 'roll/wondrous') { st.n = d(DATA.wondrous.length); }
    else if (S.route === 'roll/community') { st.n = d(10); }
    else { st.n = clamp(rollNd12(+val), 1, 60); }   // val carries the dice count
    render(); return;
  }
  if (a === 'rollDuality') {
    S.alt.hope = d(12); S.alt.fear = d(12);
    render(); return;
  }
});


function applyNum(id, v){
  // the list page has its own roll, driven by the same field
  const openId = onListPage();
  if (openId && id === 'n') {
    S.listRoll = { id: openId, n: v };
    render._focus = id;
    render();
    return;
  }
  const st = stateForRoute();
  if (!st) return;
  if (id === 'n') st.n = v;
  if (id === 'hope') st.hope = v;
  if (id === 'fear') st.fear = v;
  render._focus = id;
  render();
}

document.addEventListener('input', function (e) {
  const el = e.target;
  if (el.id === 'n' || el.id === 'hope' || el.id === 'fear') {
    const raw = parseInt(el.value, 10);
    if (isNaN(raw)) return;
    const v = clamp(raw, parseInt(el.min, 10), parseInt(el.max, 10));
    if (v !== raw) el.value = v;
    applyNum(el.id, v);
  }
  if (el.id === 'sq') { S.search.q = el.value; render._focus = 'sq'; render(); }
  if (el.id === 'lname') { S.listDraft = el.value; }
  if (el.id === 'limport') { S.importDraft = el.value; }
  if (el.id === 'newlist') { S.newListDraft = el.value; }
  if (el.dataset.qty || el.dataset.gold) {
    const field = el.dataset.qty ? 'qty' : 'gold';
    const parts = (el.dataset.qty || el.dataset.gold).split(':');
    const l = getList(parts[0]);
    if (l) { setMeta(l, parts[1], field, parseInt(el.value, 10) || 0); freshenListUrl(l); }
  }
  /* Notes never re-render: the cursor sits inside the textarea. Only the model,
     the storage and the address are brought up to date. */
  if (el.dataset.note) {
    const parts = el.dataset.note.split(':');
    const l = getList(parts[0]);
    if (l) {
      setMeta(l, parts[1], 'note', el.value.trim());
      const row = el.closest('.lrow');
      if (row) {
        row.classList.toggle('has-note', !!el.value.trim());
        const btn = row.querySelector('.lrow-note');
        if (btn) btn.classList.toggle('on', !!el.value.trim());
      }
      freshenListUrl(l);
    }
  }
  /* Ticking a box repaints the row and the bar in place: a full render would
     lose the scroll position halfway down a 119-row table. */
  if (el.dataset.sel) {
    const id = el.dataset.sel;
    if (el.checked) S.sel[id] = true; else delete S.sel[id];
    markSelected(el, el.checked);
    renderSelBar();
    syncSelectAll();
  }
  if (el.dataset.selAll) {
    el.dataset.selAll.split(',').forEach(function (id) {
      if (el.checked) S.sel[id] = true; else delete S.sel[id];
    });
    $$('[data-sel]').forEach(function (box) {
      box.checked = !!S.sel[box.dataset.sel];
      markSelected(box, box.checked);
    });
    el.parentElement.toggleAttribute('data-on', el.checked);
    renderSelBar();
  }
  if (el.dataset.noteShow) {
    const parts = el.dataset.noteShow.split(':');
    const l = getList(parts[0]);
    if (l) {
      setMeta(l, parts[1], 'noteShow', el.checked);
      el.closest('.noteshow').classList.toggle('on', el.checked);
      freshenListUrl(l);
    }
  }
  if (el.dataset.listNoteShow) {
    const l = getList(el.dataset.listNoteShow);
    if (l) {
      if (el.checked) l.noteShow = true; else delete l.noteShow;
      el.closest('.noteshow').classList.toggle('on', el.checked);
      saveLists();
      freshenListUrl(l);
    }
  }
  if (el.dataset.listNote) {
    const l = getList(el.dataset.listNote);
    if (l) {
      l.note = el.value.trim();
      if (!l.note) delete l.note;
      saveLists();
      freshenListUrl(l);
    }
  }
  if (el.id === 'rename') {
    const l = getList(el.dataset.list);
    if (l) { l.name = el.value; saveLists(); renderSelBar(); freshenListUrl(l); }
  }
  if (el.id === 'tq') { S.tables.q = el.value; render._focus = 'tq'; render(); }
  if (el.id === 'pickq') { S.pickQ = el.value; render._focus = 'pickq'; render(); }
});

/* ---------- reordering a list by dragging ----------
   The grip is what you grab, but the whole row is what moves: dragging by a
   small handle and dropping on a big target is easier than the other way
   round. A line marks where the entry would land. */
let dragKey = '';
function rowOf(el){ return el && el.closest ? el.closest('.lrow') : null; }
function clearDropMarks(){
  $$('.lrow.drop-before, .lrow.drop-after').forEach(function (r) {
    r.classList.remove('drop-before', 'drop-after');
  });
}
document.addEventListener('dragstart', function (e) {
  const grip = e.target.closest && e.target.closest('[data-drag]');
  if (!grip) return;
  dragKey = grip.dataset.drag;
  const row = rowOf(grip);
  if (row) row.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  // Firefox refuses to start a drag without payload
  try { e.dataTransfer.setData('text/plain', dragKey); } catch (err) {}
  if (row && e.dataTransfer.setDragImage) e.dataTransfer.setDragImage(row, 24, 24);
});
document.addEventListener('dragover', function (e) {
  if (!dragKey) return;
  const row = rowOf(e.target);
  if (!row || !row.querySelector('[data-drag]')) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  clearDropMarks();
  if (row.querySelector('[data-drag]').dataset.drag === dragKey) return;
  const box = row.getBoundingClientRect();
  row.classList.add(e.clientY < box.top + box.height / 2 ? 'drop-before' : 'drop-after');
});
document.addEventListener('dragend', function () {
  dragKey = '';
  clearDropMarks();
  $$('.lrow.dragging').forEach(function (r) { r.classList.remove('dragging'); });
});
document.addEventListener('drop', function (e) {
  if (!dragKey) return;
  const row = rowOf(e.target);
  if (!row) return;
  e.preventDefault();
  const target = row.querySelector('[data-drag]');
  const after = row.classList.contains('drop-after');
  clearDropMarks();
  const p = dragKey.split(':'), l = getList(p[0]);
  dragKey = '';
  if (!l || !target) return;
  const from = l.ids.indexOf(p[1]);
  let to = l.ids.indexOf(target.dataset.drag.split(':')[1]);
  if (from < 0 || to < 0) return;
  if (after && to < from) to += 1;
  if (!after && to > from) to -= 1;
  if (moveToInList(l, p[1], to)) { freshenListUrl(l); render(); }
});

/* Reordering by typing waits for the field to be committed: acting on every
   keystroke would move the entry to 2 on the way to 20. */
document.addEventListener('change', function (e) {
  const el = e.target;
  if (!el.dataset || !el.dataset.pos) return;
  const p = el.dataset.pos.split(':'), l = getList(p[0]);
  const n = parseInt(el.value, 10);
  if (!l || !(n >= 1) || n > l.ids.length) { render(); return; }
  if (moveToInList(l, p[1], n - 1)) freshenListUrl(l);
  render();
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeModal();
});

function openModal(id){
  const it = BY_ID[id];
  if (!it) return;
  S.modal = id;
  $('#modalBody').innerHTML = cardHTML(it, { full: true });
  $('#modal').hidden = false;
}
function closeModal(){
  S.modal = '';
  $('#modal').hidden = true;
}
/* The modal lives outside #view, so a plain render() would leave it stale —
   which is why the list menu opened inside it never appeared. */
function refreshModal(){
  if (!S.modal || $('#modal').hidden) return;
  const it = BY_ID[S.modal];
  if (it) $('#modalBody').innerHTML = cardHTML(it, { full: true });
}

/* An <img> error does not bubble, so this listens in the capture phase. The
   swap happens in place: a re-render here would throw away the scroll position
   in the middle of a long table. */
document.addEventListener('error', function (e) {
  const img = e.target;
  if (!img || img.tagName !== 'IMG' || !img.dataset.art) return;
  brokenArt[img.dataset.art] = true;
  img.removeAttribute('data-art');
  img.classList.add('noart');
  img.src = NO_ART;
  const holder = img.closest('.card') || img.closest('.row') || img.closest('.tilewrap');
  const btn = holder && holder.querySelector('[data-copy-img]');
  if (btn) btn.remove();
}, true);

S.lists = loadLists();

/* A modal is tied to the route it was opened from. Links inside it (the craft
   chain, for one) navigate the page underneath, so the modal has to go with it
   instead of hanging over the new page. */
window.addEventListener('hashchange', function () {
  closeModal();
  /* A selection belongs to the page it was made on. Route strings cannot tell
     one table from another — they all read "tables" — so the hash is the honest
     signal that the user went somewhere else. */
  S.sel = {}; S.menuFor = ''; S.newListFor = '';
  render();
});
render();

})();
