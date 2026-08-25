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
  rp: -20,          // проценты для пакетного пересчёта цен
  guess: false,     // раскрыта ли панель с ориентиром по цене
  moneyHelp: false, // раскрыта ли справка о пересчёте золота
  printIds: '',     // что печатаем - читается из адреса
  printBW: false,   // чёрно-белый лист: без картинок и без золота
  keepOpen: {},     // что человек свернул или раскрыл сам - переживает перерисовку
  shared: { ids: [], meta: {} },   // позиции открытого по ссылке чужого списка
  lsel: {},         // выделенные строки открытого списка
  wond: { n: 1 },
  dread: { n: 1 },
  voa:  { k: 1, n: 1 },   // раздел книги и бросок внутри него
  comm: { c: 'Highborne', n: 1 },
  tables: { t: 'core_item', q: '', view: 'list', anchor: '' },
  search: { q: '' },
  help: '',
  kind: { item: true, consumable: true, equip: true },  // shared filter, applies wherever they can show up
  /* equipment facets: what is picked in each row. An empty row means "any", so
     an untouched filter is an empty object and its link stays short */
  fOn: {},
  fOpen: false,
  fSeg: '',   // the filter piece of the address we have already read back
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
  pickQ: '',
  deleted: {}   // ids this tab removed, so a merge does not bring them back
};

/* ---------- i18n ---------- */
const T = {
  ru: {
    tabs: { std:'Обычные правила', alt:'Альт. таблицы', wondrous:'Wondrous', dread:'Dread', voa:'Vault of Ages', community:'Сообщества', tables:'Таблицы', lists:'Списки', search:'Поиск' },
    or:'ИЛИ',
    item:'Предмет', cons:'Расходник',
    srcCore:'Core', srcHnf:'Hope & Fear', srcWond:'Wondrous', srcDread:'Dread', srcVoa:'Vault of Ages', srcFrame:'Фрейм', srcComm:'Сообщества',
    rollResult:'Результат броска', roll:'Бросить', randomIn:'Случайно', rollDuality:'Бросить кости',
    stepDown:'На единицу меньше', stepUp:'На единицу больше',
    copyName:'Скопировать название', copied:'Скопировано',
    rarity:'Редкость', tier:'Ранг',
    viewGrid:'Сеткой', viewList:'Списком', view:'Вид',
    common:'Обычная', uncommon:'Необычная', rare:'Редкая', veryRare:'Очень редкая', legendary:'Легендарная',
    hopeDie:'Кость Надежды', fearDie:'Кость Страха',
    crit:'Критический успех!', critSub:'Игрок берёт любую позицию из таблицы этой редкости. Мастер может разрешить подняться на ступень выше.',
    bumpTo:'Поднять до',
    filter:'Тип', kindF:'Тип', frameF:'Фрейм', commF:'Сообщество', fItems:'Предметы', fCons:'Расходники', fEquip:'Снаряжение',
    keepOneKind:'Нужен хотя бы один тип',
    eqTrait:'Характеристика', eqRange:'Дистанция', eqDmg:'Тип урона',
    eqBurden:'Хват', eqLineF:'Линейка', eqTh:'Пороги', eqScore:'Броня', filters:'Фильтры',
    eqClass:'Класс', anyValue:'любое', outOf:'из', dropValue:'Убрать из фильтра',
    resetAll:'Сбросить всё', filterLink:'Ссылка на фильтры',
    filterLinkCopied:'Ссылка на фильтры скопирована',
    community:'Сообщество', source:'Источник', keepOneSource:'Нужен хотя бы один источник',
    importList:'Восстановить из ссылки', importBtn:'Восстановить',
    importPh:'Ссылка на список',
    cancel:'Отмена',
    dismiss:'Скрыть',
    readMore:'подробнее',
    addTo:'Добавить в', inLists:'Лежит в списках',
    selected:'Выбрано', selectAll:'Выбрать все', clearSel:'Снять выделение',
    copySel:'Скопировать', selCopied:'Выбранное скопировано',
    addedTo:'Добавлено в «%s»', removedFrom:'Убрано из «%s»',
    qty:'Кол-во', gold:'Золото', goldUnit:'зол.',
    rollHint:'Бросьте кубик и введите результат - или нажмите кнопку', rollBy:'Бросок по списку',
    voaSection:'Раздел книги', voaArtifact:'Артефакты', voaCursed:'Проклятые предметы',
    voaArtifact1:'Артефакт', voaCursed1:'Проклятый предмет', voaRecall:'Стоимость Призыва',
    guessPrice:'Подсказать цены', batchMoney:'Цены',
    /* Подписи в полосе характеристик короче, чем в интерфейсе: на 63 мм
       «Характеристика» не помещается, а в макете печатной карты стоит «Черта». */
    pcDmg:'Урон', pcTrait:'Черта', pcRange:'Дистанция', pcTh:'Пороги', pcArmor:'Броня',
    thLight:'Лёгкий урон', thMajor:'Ощутимый урон', thSevere:'Тяжёлый урон',
    printColor:'Цветная', printBW:'Чёрно-белая',
    print:'Печать', printNow:'Отправить на печать',
    printLink:'Ссылка на набор', printTitle:'Печать карточек',
    printHint:'Собрать карточки для печати: девять на лист A4',
    printSub:'Карточек: %n. Листов A4: %p. Размер карты 63×88 мм - как у обычной игральной.',
    printNote:'В окне печати выберите A4, книжную ориентацию и поля «нет». Лист светлый нарочно: так он читается и на чёрно-белом принтере, и не съедает картридж.',
    printEmpty:'Печатать нечего: в адресе не нашлось ни одной вещи.',
    printFoot:'Лут Daggerheart', guessApply:'Проставить эти цены',
    guessWhy:'В книге цен нет: Core (с. 105) оставляет их мастеру. Порядок величин взят из общей таблицы сообщества - у снаряжения по рангу, у добычи по редкости. Это не канон, а точка отсчёта; выбранным строкам цены будут перезаписаны.',
    guessNoTier:'нечем оценить', guessNoRarity:'редкость не указана', guessDone:'Цены проставлены',
    moneyAs:'Отображение цен', money_coin:'Монетами', money_bag:'Как в книге',
    moneyHelp:'Корник считает золото <b>горстями, мешками и сундуками</b>: 10 горстей = 1 мешок, 10 мешков = 1 сундук. Монеты — опциональное правило, по которому 1 горсть = 10 монет, значит мешок = 100, а сундук = 1000. Цена вводится монетами в любом случае: режим меняет только то, как её прочитают. Читается она так, как о деньгах говорят за столом — двумя старшими единицами и с округлением до ближайшей: 750 — это <b>7 мешков 5 горстей</b>, 894 — <b>8 мешков 9 горстей</b>, а 899 — уже <b>9 мешков</b>. Монет в этом виде нет вовсе: 804 — просто <b>8 мешков</b>.',
    note:'Заметка', listNote:'Заметки', noteHead:'Заметка',
    notePub:'Для игроков', noteHid:'Только для мастера',
    notePubHint:'уедет с текстом и ссылкой для игроков',
    noteHidHint:'останется у вас',
    listNotePhPub:'Например: лавка закрыта до утра',
    listNotePhHid:'Например: позиции 9-10 лежат под прилавком',
    notePhPub:'Как предмет выглядит, что о нём знают',
    notePhHid:'Хоумбрю, подвох, что знает только мастер',
    sharePlayers:'Ссылка игрокам', shareGm:'Ссылка себе',
    playersLinkCopied:'Ссылка для игроков скопирована — заметок мастера в ней нет',
    gmLinkCopied:'Ссылка со всеми заметками скопирована — она только для вас',
    clear:'Сбросить',
    dragHint:'Перетащите, чтобы изменить порядок', position:'Позиция в списке',
    listNotFound:'Список не найден', listNotFoundSub:'Возможно, он удалён или открыт в другом браузере.',
    lists:'Списки', newList:'Новый список', listNamePh:'Например: клад дракона', create:'Создать',
    findList:'Найти список', listCreated:'Список «%s» создан',
    nameFirst:'Сначала назовите список',
    untitled:'Без названия', noLists:'Списков пока нет — создайте первый выше',
    addToList:'Добавить в список', removeItem:'Убрать из списка',
    removedItem:'«%s» убран', undo:'Вернуть',
    share:'Поделиться', del:'Удалить', rename:'Название списка',
    listEmpty:'Список пуст', listEmptyHint:'Пока пусто. Откройте «Таблицы» или «Поиск», отметьте нужное галочками и нажмите «Добавить в список» — или сделайте это прямо с карточки предмета.',
    sharedList:'Список от другого игрока',
    badShare:'Ссылка повреждена или собрана в другой версии данных.',
    deleteConfirm:'Удалить список «%s»? Это действие необратимо.',
    saveFailed:'Не удалось сохранить: браузер блокирует локальное хранилище',
    noStorageTitle:'Браузер блокирует локальное хранилище.',
    noStorage:'Списки не сохранятся после перезагрузки страницы. Обычно так бывает в режиме инкогнито или при запрете сайту хранить данные. Ссылкой поделиться всё равно можно.',
    localOnlyTitle:'Списки живут только в этом браузере.',
    localOnly:'Сервера у приложения нет. Очистка данных сайта, режим инкогнито или другое устройство — и списки пропадут. Чтобы не потерять, нажмите «Ссылка себе»: весь состав закодирован прямо в адресе, и список восстанавливается из неё целиком, вместе с обеими заметками. Эта ссылка только для вас — в ней есть и то, что вы писали в «Только для мастера». Игрокам отправляйте «Ссылка игрокам» или результат кнопки «Скопировать текст»: туда попадает лишь то, что написано в «Для игроков». В адресной строке браузера тоже лежит ссылка для игроков, так что скопировать её оттуда безопасно. Только помните, что ссылка — это снимок: она помнит список таким, каким он был в момент копирования. Добавили позицию или поправили заметку — сохраните ссылку заново.',
    searchPh:'Поиск по названию или описанию…',
    nothing:'Ничего не найдено',
    sendAll:'Отправить', copyText:'Скопировать текст', copyImg:'Скопировать изображение',
    imgCopied:'Картинка скопирована', imgSaved:'Картинка сохранена', imgFailed:'Не удалось получить картинку',
    copyLink:'Скопировать ссылку', copySection:'Скопировать ссылку на этот раздел',
    linkCopied:'Ссылка скопирована', nameCopied:'Название скопировано', textCopied:'Текст скопирован',
    tableLinkCopied:'Ссылка на таблицу скопирована', sectionLinkCopied:'Ссылка на раздел скопирована',
    listCopied:'Список скопирован', copyFailed:'Не удалось скопировать',
    sImg:'Картинка', sText:'Текст', tableLink:'Ссылка на таблицу',
    copyRoll:'Скопировать все варианты', rollCopied:'Варианты скопированы',
    openPage:'Страница', openTable:'Открыть таблицу', toStart:'На главную',
    openItems:'Таблица предметов', openCons:'Таблица расходников', showInTable:'показать в таблице',
    craftInto:'Улучшается до', craftFrom:'Получается из', tierLadder:'Ранг',
    unique:'Уникальное', uniqueHint:'В книге стоит одним рангом - лестницы улучшений у этой вещи нет',
    noteClear:'Очистить заметку', noteCleared:'Заметка очищена',
    pickRow:'Выбрать позицию', pickAll:'Выбрать все', pickedN:'Выбрано',
    batchNoPrice:'Убрать цену', repricePct:'Изменить на, %',
    repriceDown:'Сделать скидку', repriceUp:'Поднять цену',
    repriceHint:'Минус — скидка, плюс — наценка. Считается от текущей цены.',
    repriceDone:'Цены пересчитаны', repriceUndo:'Вернуть', batchDeleted:'Убрано из списка',
    rollNo:'номер', notFound:'Предмет не найден', notFoundSub:'Возможно, ссылка устарела или данные были изменены.',
    hope:'Надежда', fear:'Страх',
    foot:'Данные: Daggerheart Core Set, Hope &amp; Fear, Wondrous Loot, Dread GM Toolbox, Vault of Ages, Community Magic Items, Alternate Loot &amp; Consumable Tables. Перевод: daggerheart.su и собственные материалы. Daggerheart © Darrington Press.',
    whatIsThis:'Как это работает',
    langLabel:'Язык', sectionsLabel:'Разделы', close:'Закрыть', skipToContent:'К содержимому',
    docTitle:'Генератор лута — Daggerheart',
    setHome:'Открывать этот раздел при запуске', isHome:'Открывается при запуске',
    homeSet:'Приложение будет открываться на этом разделе',
    homeReset:'Приложение снова будет открываться на обычных правилах',
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
        'Часть предметов рассчитана на окружения и сюжеты своей книги: вне их вещь может оказаться бесполезной или странной. Случайную выдачу отсюда стоит просматривать глазами, а не отдавать игрокам вслепую.',
        'Источник: дополнение <a href="https://www.drivethrurpg.com/en/product/552648/wondrous-environments" target="_blank" rel="noopener">Wondrous Environments</a>.'
      ],
      dread: [
        'В таблице 29 позиций — столько предметов описано в дополнении. Кости на такой диапазон не бывает, поэтому кнопка выбирает позицию случайно.',
        'Порядок взят из книги: сначала семь единиц снаряжения с характеристиками (их ранг книга указывает сама), затем предметы по английскому алфавиту.',
        'Книга не делит вещи на постоянные и расходуемые. Здесь это проставлено по смыслу описания: масла, гранаты и сыворотка помечены расходниками, остальное — предметами.',
        'Часть предметов рассчитана на окружения и сюжеты своей книги: вне их вещь может оказаться бесполезной или странной. Случайную выдачу отсюда стоит просматривать глазами, а не отдавать игрокам вслепую.',
        'Источник: дополнение <a href="https://www.drivethrurpg.com/en/product/573714/dread-gm-toolbox-for-daggerheart" target="_blank" rel="noopener">Dread GM Toolbox for Daggerheart</a>.'
      ],
      voa: [
        'Три тома одного автора: 108 карточек, разложенных по рангам. Своей таблицы броска у книги нет, поэтому и разделов шесть — четыре ранга плюс артефакты и проклятые предметы, ровно как в самих томах. Бросок идёт внутри выбранного раздела: ранг 1 и артефакт — награды разного веса, и на одной кости им не место.',
        '<b>Стоимость Призыва.</b> Вещи из этой книги сильнее того, что лежит в корнике, поэтому у большинства есть Стоимость Призыва. Если баланс важен, пусть игрок платит её Стрессом и меняет предмет на одну из карт домена в Руке — только тогда предмет считается снаряжённым. Если баланс не важен, правило можно не применять.',
        '<b>Артефакты.</b> Предметы из легенд: последствия применения некоторых способны изменить мир и вытянуть на себе целую кампанию. Их не раздают всем — они должны появляться редко и работать на историю.',
        '<b>Проклятые предметы.</b> Дают сильное преимущество, но не бесплатно. Когда персонаж запускает проклятие, карта немедленно занимает место одной из карт в его Руке, и предмет привязывается навсегда. Снять его можно только трудным заданием, мощной магией или особыми обстоятельствами — условие придумывает Мастер или стол. Носить несколько проклятых предметов можно, но неразумно.',
        'Источник: три тома Криса ДеШамплейна, версия 1.5 — <a href="https://www.drivethrurpg.com/en/product/562876/vault-of-ages-volume-1" target="_blank" rel="noopener">Vault of Ages Volume 1</a>, <a href="https://www.drivethrurpg.com/en/product/567176/vault-of-ages-volume-2" target="_blank" rel="noopener">Volume 2</a>, <a href="https://www.drivethrurpg.com/en/product/574145/vault-of-ages-volume-3" target="_blank" rel="noopener">Volume 3</a>.'
      ],
      community: [
        'Предметы каждого сообщества перечислены по возрастанию редкости: 1 — самый простой, 10 — самый сильный.',
        'Такие предметы уместны как награда от сообщества, семейная реликвия или находка на его территории.',
        'Источник: дополнение <a href="https://www.drivethrurpg.com/en/product/558159/community-magic-items-a-daggerheart-compatible-toolkit" target="_blank" rel="noopener">Community Magic Items</a>.'
      ],
      tables: [
        'Здесь лежат все таблицы целиком. Сверху выбирается книга — корник, Hope &amp; Fear, Wondrous Loot, Dread GM Toolbox, Vault of Ages, фреймы, сообщества, — а под ней её разделы, если внутри есть из чего выбирать. Отдельно стоят «Снаряжение» и «Альт. таблицы»: это не книги, а срезы через все книги сразу.',
        '<b>Снаряжение</b> собрано из всех источников, а не только из корника и Hope &amp; Fear: оружие и броня есть ещё в Wondrous Loot, Dread, Vault of Ages и фреймах. Отобрать нужную книгу можно фильтром «Источник».',
        'Снаряжение устроено иначе, чем добыча: у него нет номера в таблице, зато есть характеристика, дистанция, урон, хват или пороги с Показателем Брони. Всё это видно в строке и уезжает вместе с предметом при копировании.',
        'Порядок и разбивка взяты из книг: внутри каждого ранга сначала физическое оружие корника, потом магическое, затем то же для Hope &amp; Fear.',
        'Ранг есть у всего снаряжения, включая Wondrous Loot. Рядом с вещью он там не напечатан, но книга привязывает добычу к локации таблицей «Loot items by environment», а у локации ранг указан: Посох Шепчущего Архива найден в Могиле Смотрителя, у неё ранг 2 — значит, и у посоха ранг 2. Это не оценка по характеристикам, а то же самое место в книге, просто на страницу раньше.',
        '<b>Класс</b> — это раздел книги, а не тип урона. Магическому оружию нужна Характеристика Заклинателя, даже если урон оно наносит физический: Призрачный Клинок магический, а урон у него «физ/маг». Поэтому класс и урон показаны отдельно, а оружие с уроном «физ/маг» попадает в оба фильтра сразу.',
        'Фильтр «Линейка» делит снаряжение надвое. <b>Улучшаемые</b> — вещи, у которых есть версии повыше: Улучшенная, Продвинутая и Легендарная Катана — это одна и та же катана на четырёх рангах. <b>Уникальные</b> — то, что существует в единственном виде и не улучшается.',
        'Панель фильтров одна на все таблицы и стоит под поиском: у снаряжения в ней семь строк, у Vault of Ages вид и ранг, у фреймов вид и фрейм, у сообществ — сообщество. Где отбирать нечего, панели нет вовсе. В фильтрах ничего не выбрано по умолчанию — строка без выбора значит «любое». Клик выбирает значение, поэтому «только ранг 2» — это один клик, а не выключение трёх остальных. Внутри строки значения складываются по «или», строки сужают друг друга. Выбранное показано плашками рядом с кнопкой: крестик снимает одно значение, «Сбросить всё» — сразу все, а кнопка со звеном отдаёт ссылку на текущий набор. Всё это остаётся под рукой и со свёрнутой панелью. Адрес страницы едет за фильтром, так что ссылкой можно поделиться и прямо из строки браузера.',
        'Одиннадцать предметов из Wondrous Loot на самом деле оружие. В этих таблицах их нет — они остались в своей таблице Wondrous, но выглядят и копируются как снаряжение.',
        'Источники: Daggerheart Core Set и Hope &amp; Fear. Русские названия и формулировки — перевод <a href="https://ru.daggerheart.su/" target="_blank" rel="noopener">daggerheart.su</a>, для Hope &amp; Fear — таблица сообщества. Значения даны с учётом эрраты.'
      ],
      lists: [
        'Соберите список: отметьте нужное галочками в «Таблицах» или «Поиске» и нажмите «Добавить в список». То же самое можно сделать прямо с карточки предмета — меню остаётся открытым, поэтому один предмет легко положить сразу в несколько списков.',
        'У списка и у каждой позиции две заметки. <b>Для игроков</b> уезжает вместе с текстом и ссылкой для игроков. <b>Только для мастера</b> остаётся у вас: ни в текст, ни в ссылку для игроков она не попадает.',
        'Отсюда и две кнопки. <b>Ссылка игрокам</b> — то, что можно кинуть в чат партии. <b>Ссылка себе</b> — полный снимок со всеми заметками: это и способ сохранить список, чтобы восстановить его потом или открыть на другом устройстве. В адресной строке браузера лежит ссылка для игроков, так что скопировать её оттуда тоже безопасно.',
        'Поле «Восстановить из ссылки» принимает любую из них обратно — получится обычный список, который можно править. Хранятся в ссылке только название, id позиций, количество, цена и заметки, поэтому правки в данных подхватятся сами.'
      ]
    },
    pages: {
      std:   ['Обычные правила', 'Бросок по таблицам корника и дополнения Hope &amp; Fear.'],
      alt:   ['Альтернативные таблицы', 'Бросок Костей Дуальности по объединённым таблицам обеих книг.'],
      wondrous: ['Wondrous Loot', 'Введите результат броска или получите случайную позицию.'],
      dread: ['Dread GM Toolbox', 'Введите результат броска или получите случайную позицию.'],
      voa:   ['Vault of Ages', 'Выберите раздел книги и бросьте кость по нему.'],
      community: ['Предметы сообществ', 'Выберите происхождение и бросьте d10.'],
      tables: ['Таблицы', 'Все таблицы целиком, включая оружие и броню, — можно листать, фильтровать и открывать карточки.'],
      lists: ['Списки', 'Соберите добычу в список и отправьте игрокам одной ссылкой.'],
      search: ['Поиск', 'Поиск по всем 1061 позиции сразу — добыча, расходники и снаряжение, на русском и на английском.']
    },
  },
  en: {
    tabs: { std:'Standard rules', alt:'Alt. tables', wondrous:'Wondrous', dread:'Dread', voa:'Vault of Ages', community:'Communities', tables:'Tables', lists:'Lists', search:'Search' },
    or:'OR',
    item:'Item', cons:'Consumable',
    srcCore:'Core', srcHnf:'Hope & Fear', srcWond:'Wondrous', srcDread:'Dread', srcVoa:'Vault of Ages', srcFrame:'Frame', srcComm:'Communities',
    rollResult:'Roll result', roll:'Roll', randomIn:'Random', rollDuality:'Roll the dice',
    stepDown:'One lower', stepUp:'One higher',
    copyName:'Copy name', copied:'Copied',
    rarity:'Rarity', tier:'Tier',
    viewGrid:'Grid', viewList:'List', view:'View',
    common:'Common', uncommon:'Uncommon', rare:'Rare', veryRare:'Very rare', legendary:'Legendary',
    hopeDie:'Hope Die', fearDie:'Fear Die',
    crit:'Critical success!', critSub:'The player takes any entry from this rarity table. The GM may allow bumping up one rarity.',
    bumpTo:'Bump to',
    filter:'Type', kindF:'Type', frameF:'Frame', commF:'Community', fItems:'Items', fCons:'Consumables', fEquip:'Equipment',
    keepOneKind:'At least one type has to stay on',
    eqTrait:'Trait', eqRange:'Range', eqDmg:'Damage type',
    eqBurden:'Burden', eqLineF:'Line', eqTh:'Thresholds', eqScore:'Armor', filters:'Filters',
    eqClass:'Class', anyValue:'any', outOf:'of', dropValue:'Remove from the filter',
    resetAll:'Reset all', filterLink:'Filter link',
    filterLinkCopied:'Filter link copied',
    community:'Community', source:'Source', keepOneSource:'At least one source has to stay on',
    importList:'Restore from a link', importBtn:'Restore',
    importPh:'Paste a list link',
    cancel:'Cancel',
    dismiss:'Dismiss',
    readMore:'more',
    addTo:'Add to', inLists:'Sits in lists',
    selected:'Selected', selectAll:'Select all', clearSel:'Clear selection',
    copySel:'Copy', selCopied:'Selection copied',
    addedTo:'Added to "%s"', removedFrom:'Removed from "%s"',
    qty:'Qty', gold:'Gold', goldUnit:'gp',
    rollHint:'Roll a die and type the result - or press the button', rollBy:'Roll on this list',
    voaSection:'Section', voaArtifact:'Artifacts', voaCursed:'Cursed objects',
    voaArtifact1:'Artifact', voaCursed1:'Cursed object', voaRecall:'Recall Cost',
    guessPrice:'Suggest prices', batchMoney:'Prices',
    pcDmg:'Damage', pcTrait:'Trait', pcRange:'Range', pcTh:'Thresholds', pcArmor:'Armor',
    thLight:'Minor damage', thMajor:'Major damage', thSevere:'Severe damage',
    printColor:'Colour', printBW:'Black and white',
    print:'Print', printNow:'Send to printer',
    printLink:'Link to this set', printTitle:'Printing cards',
    printHint:'Lay these out for printing: nine to an A4 sheet',
    printSub:'Cards: %n. A4 sheets: %p. Card size 63×88 mm - the size of a playing card.',
    printNote:'In the print dialog pick A4, portrait, and margins "none". The sheet is light on purpose: it reads on a black-and-white printer and does not drain the cartridge.',
    printEmpty:'Nothing to print: the address holds no items.',
    printFoot:'Daggerheart Loot', guessApply:'Set these prices',
    guessWhy:'The book has no prices: Core (p. 105) leaves them to the GM. These magnitudes come from the community spreadsheet - by tier for equipment, by rarity for loot. Not canon, a starting point; the selected rows will have their prices overwritten.',
    guessNoTier:'nothing to go on', guessNoRarity:'no rarity given', guessDone:'Prices set',
    moneyAs:'Price display', money_coin:'In coins', money_bag:'As in the book',
    moneyHelp:'The core book counts gold in <b>handfuls, bags and chests</b>: 10 handfuls = 1 bag, 10 bags = 1 chest. Coins are an optional rule where 1 handful = 10 coins, so a bag is 100 and a chest 1000. A price is always typed in coins: the mode only changes how it reads. It reads the way money is spoken of at the table - two units at most, rounded to the nearest: 750 is <b>7 bags 5 handfuls</b>, 894 is <b>8 bags 9 handfuls</b>, and 899 is already <b>9 bags</b>. There are no coins in this reading at all: 804 is simply <b>8 bags</b>.',
    note:'Note', listNote:'Notes', noteHead:'Note',
    notePub:'For players', noteHid:'GM only',
    notePubHint:'travels with the text and the players’ link',
    noteHidHint:'stays with you',
    listNotePhPub:'e.g. the shop is shut until morning',
    listNotePhHid:'e.g. entries 9-10 are kept under the counter',
    notePhPub:'What it looks like, what is known about it',
    notePhHid:'Homebrew, the catch, what only the GM knows',
    sharePlayers:'Players’ link', shareGm:'Your own link',
    playersLinkCopied:'Players’ link copied — it carries no GM notes',
    gmLinkCopied:'Link with every note copied — this one is for you',
    clear:'Clear',
    dragHint:'Drag to reorder', position:'Position in the list',
    listNotFound:'List not found', listNotFoundSub:'It may have been deleted, or it lives in another browser.',
    lists:'Lists', newList:'New list', listNamePh:'For example: dragon hoard', create:'Create',
    findList:'Find a list', listCreated:'List “%s” created',
    nameFirst:'Give the list a name first',
    untitled:'Untitled', noLists:'No lists yet — create one above',
    addToList:'Add to list', removeItem:'Remove from the list',
    removedItem:'“%s” removed', undo:'Undo',
    share:'Share', del:'Delete', rename:'List name',
    listEmpty:'The list is empty', listEmptyHint:'Nothing here yet. Open Tables or Search, tick what you need and press “Add to list” — or do it straight from an item card.',
    sharedList:'A list from another player',
    badShare:'The link is damaged or was built from a different data version.',
    deleteConfirm:'Delete the list "%s"? This cannot be undone.',
    saveFailed:'Could not save: the browser is blocking local storage',
    noStorageTitle:'The browser is blocking local storage.',
    noStorage:'Lists will not survive a page reload. This usually happens in private mode or when the site is denied storage. Sharing a link still works.',
    localOnlyTitle:'Lists live in this browser only.',
    localOnly:'The app has no server. Clearing site data, a private window or another device, and the lists are gone. To keep one, press “Your own link”: the whole list is encoded in the address and comes back from it entire, both notes included. That link is for you alone — it carries whatever you wrote under “GM only”. Send players the “Players’ link” or the result of “Copy text”: only what is written under “For players” goes there. The browser’s own address bar holds the players’ link too, so copying it from there is safe. Do remember that a link is a snapshot: it holds the list as it was when you copied it. Add an entry or edit a note and save the link again.',
    searchPh:'Search by name or description…',
    nothing:'Nothing found',
    sendAll:'Share', copyText:'Copy text', copyImg:'Copy image',
    imgCopied:'Image copied', imgSaved:'Image saved', imgFailed:'Could not load the image',
    copyLink:'Copy link', copySection:'Copy a link to this section',
    linkCopied:'Link copied', nameCopied:'Name copied', textCopied:'Text copied',
    tableLinkCopied:'Table link copied', sectionLinkCopied:'Section link copied',
    listCopied:'List copied', copyFailed:'Could not copy',
    sImg:'Image', sText:'Text', tableLink:'Link to this table',
    copyRoll:'Copy every option', rollCopied:'Options copied',
    openPage:'Page', openTable:'Open table', toStart:'Home',
    openItems:'Items table', openCons:'Consumables table', showInTable:'show in the table',
    craftInto:'Upgrades to', craftFrom:'Made from', tierLadder:'Tier',
    unique:'Unique', uniqueHint:'Printed at a single tier - this one has no upgrade ladder',
    noteClear:'Clear the note', noteCleared:'Note cleared',
    pickRow:'Select entry', pickAll:'Select all', pickedN:'Selected',
    batchNoPrice:'Clear price', repricePct:'Change by, %',
    repriceDown:'Discount', repriceUp:'Mark up',
    repriceHint:'Minus discounts, plus marks up. Counted from the current price.',
    repriceDone:'Prices recalculated', repriceUndo:'Undo', batchDeleted:'Removed from the list',
    rollNo:'roll', notFound:'Item not found', notFoundSub:'The link may be out of date, or the data has changed.',
    hope:'Hope', fear:'Fear',
    foot:'Data: Daggerheart Core Set, Hope &amp; Fear, Wondrous Loot, Dread GM Toolbox, Vault of Ages, Community Magic Items, Alternate Loot &amp; Consumable Tables. Russian text: daggerheart.su and custom material. Daggerheart © Darrington Press.',
    whatIsThis:'How this works',
    langLabel:'Language', sectionsLabel:'Sections', close:'Close', skipToContent:'Skip to content',
    docTitle:'Daggerheart Loot Generator',
    setHome:'Open this section on start', isHome:'Opens on start',
    homeSet:'The app will open on this section',
    homeReset:'The app will open on the standard rules again',
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
        'Some entries are written for the environments and plots of their own book: elsewhere they can be useless or simply odd. Look over what comes up here rather than handing it to the players unseen.',
        'Source: the <a href="https://www.drivethrurpg.com/en/product/552648/wondrous-environments" target="_blank" rel="noopener">Wondrous Environments</a> supplement.'
      ],
      dread: [
        'The table has 29 entries, which is how many the supplement describes. No die covers that range, so the button picks an entry at random.',
        'The order follows the book: seven pieces of equipment with statistics first (the book states their tier), then the items in English alphabetical order.',
        'The book does not sort these into permanent and single-use. That split is made here from what each entry describes: oils, grenades and the serum are marked as consumables, the rest as items.',
        'Some entries are written for the environments and plots of their own book: elsewhere they can be useless or simply odd. Look over what comes up here rather than handing it to the players unseen.',
        'Source: the <a href="https://www.drivethrurpg.com/en/product/573714/dread-gm-toolbox-for-daggerheart" target="_blank" rel="noopener">Dread GM Toolbox for Daggerheart</a> supplement.'
      ],
      voa: [
        'Three volumes by one author: 108 cards sorted by tier. The book has no roll table of its own, so there are six sections here — four tiers plus artifacts and cursed objects, exactly as the volumes are laid out. The roll happens inside the section you pick: a tier 1 item and an artifact are rewards of a different weight and do not belong on one die.',
        '<b>Recall Cost.</b> Items in this book are often stronger than those in the core book, so most carry a Recall Cost. If balance matters at your table, have the player pay it in Stress and swap the item for one of the domain cards in their loadout — only then does it count as equipped. If balance does not matter, skip the rule.',
        '<b>Artifacts.</b> Objects out of legend: the consequences of using some of them can reshape a world and carry a whole campaign. Do not hand them to everyone — they should be rare and serve the story.',
        '<b>Cursed objects.</b> A strong benefit that is not free. The moment a character triggers the curse, the card takes the place of one of the cards in their loadout, and the item is bound to them permanently. Removing it takes a hard task, powerful magic or special circumstances — the GM or the table invents the condition. Carrying several cursed objects is possible but unwise.',
        'Source: three volumes by Chris DeChamplain, v1.5 — <a href="https://www.drivethrurpg.com/en/product/562876/vault-of-ages-volume-1" target="_blank" rel="noopener">Vault of Ages Volume 1</a>, <a href="https://www.drivethrurpg.com/en/product/567176/vault-of-ages-volume-2" target="_blank" rel="noopener">Volume 2</a>, <a href="https://www.drivethrurpg.com/en/product/574145/vault-of-ages-volume-3" target="_blank" rel="noopener">Volume 3</a>.'
      ],
      community: [
        'Each community lists its items in ascending order of rarity: 1 is the humblest, 10 the most powerful.',
        'They fit best as a reward from that community, a family heirloom, or a find on its territory.',
        'Source: the <a href="https://www.drivethrurpg.com/en/product/558159/community-magic-items-a-daggerheart-compatible-toolkit" target="_blank" rel="noopener">Community Magic Items</a> supplement.'
      ],
      tables: [
        'Every table in full. The top row picks a book — the core set, Hope &amp; Fear, Wondrous Loot, the Dread GM Toolbox, Vault of Ages, frames, communities — and the row under it picks a section of that book, when there is more than one. "Equipment" and "Alt. tables" stand apart: they are cuts across every book rather than books of their own.',
        '<b>Equipment</b> is gathered from every source, not only the core set and Hope &amp; Fear: there are weapons and armor in Wondrous Loot, Dread, Vault of Ages and the campaign frames too. Narrow it to one book with the "Source" filter.',
        'Equipment works differently from loot: it has no roll number, but it does have a trait, a range, damage and burden — or thresholds and an Armor Score. All of it shows in the row and travels with the entry when you copy it.',
        'The order follows the books: inside each tier, Core physical weapons first, then Core magic, then the same for Hope &amp; Fear.',
        'Every piece of equipment has a tier, Wondrous Loot included. The book does not print it next to the item, but it binds each piece of loot to a location in the "Loot items by environment" table, and every location has a tier: the Staff of the Whispering Archive comes from The Watcher\'s Grave, which is tier 2, so the staff is tier 2. This is not an estimate from the stats - it is the same book, one page earlier.',
        '<b>Class</b> is the table the book prints the weapon in, not the damage it deals. A magic weapon needs a Spellcast trait even when its damage is physical: the Ghostblade is a magic weapon dealing "phy or mag". So class and damage are shown apart, and a weapon that can deal either belongs to both filters.',
        'The "Line" filter splits equipment in two. <b>Upgradable</b> means the piece has higher versions: Improved, Advanced and Legendary Katana are the same katana across four tiers. <b>Unique</b> means it exists in one form only.',
        'One filter panel serves every table and sits under the search box: seven rows for equipment, kind and tier for Vault of Ages, kind and frame for the campaign frames, community for the community items. Where there is nothing to narrow, there is no panel. Nothing is picked to begin with, and a row with no pick means "any". Clicking picks a value, so "tier 2 only" is one click rather than switching three others off. Values in a row combine with "or", rows narrow each other. What is picked shows as chips beside the button: the cross drops one value, "Reset all" drops the lot, and the link button hands out the current set. All of it stays reachable with the panel folded. The address follows the filter too, so the link in the address bar is the one to share.',
        'Eleven Wondrous Loot entries are really weapons. They are not in these tables — they stayed in the Wondrous one, but they look and copy like equipment.',
        'Sources: the Daggerheart Core Set and Hope &amp; Fear, with the errata applied.'
      ],
      lists: [
        'Build a list: tick what you need in Tables or Search and press “Add to list”. The same works straight from an item card — the menu stays open, so one item goes into several lists without reopening anything.',
        'A list and every entry in it carry two notes. <b>For players</b> travels with the copied text and with the players’ link. <b>GM only</b> stays with you: it reaches neither.',
        'Hence the two buttons. <b>Players’ link</b> is the one to drop into the party chat. <b>Your own link</b> is a full snapshot with every note — which is also how you keep a list to restore later or open on another device. The browser’s address bar holds the players’ link, so copying it from there is safe too.',
        'The “Restore from a link” field takes either of them back and gives you an ordinary, editable list. A link stores only the name, the entry ids, quantity, price and the notes, so edits to the data are picked up on their own.'
      ]
    },
    pages: {
      std:   ['Standard rules', 'A roll over the core book and the Hope &amp; Fear tables.'],
      alt:   ['Alternate tables', 'A Duality Dice roll over both books merged into one set of tables.'],
      wondrous: ['Wondrous Loot', 'Enter your roll result, or pick a random entry.'],
      dread: ['Dread GM Toolbox', 'Enter your roll result, or pick a random entry.'],
      voa:   ['Vault of Ages', 'Pick a section of the book and roll within it.'],
      community: ['Community items', 'Pick an origin and roll d10.'],
      tables: ['Tables', 'Every table in full, weapons and armor included — browse, filter and open cards.'],
      lists: ['Lists', 'Collect loot into a list and send it to your players as a single link.'],
      search: ['Search', 'Search all 1061 entries at once — loot, consumables and equipment, in Russian and English.']
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
/* Кампейн-фреймы: снаряжение из них подписано названием своего фрейма, а не
   общим словом - иначе непонятно, из какой оно кампании. */
const FRAME_LABEL = {
  ru: { beast_feast:'Пир зверей', colossus:'Колоссы Сухоземья',
        dark_heart:'Тёмное сердце Андалурии', motherboard:'Материнская Плата' },
  en: { beast_feast:'Beast Feast', colossus:'Colossus of the Drylands',
        dark_heart:'Dark Heart of Andaluria', motherboard:'Motherboard' }
};
function frameName(f){ return (FRAME_LABEL[S.lang] || FRAME_LABEL.en)[f] || f; }
const FRAME_ORDER = ['beast_feast', 'colossus', 'dark_heart', 'motherboard'];
const TIERS = { common:'1–2', uncommon:'1–2', rare:'2–3', very_rare:'3–4', legendary:'3–4' };
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
  { id:'dread',            ru:'Dread GM Toolbox',       en:'Dread GM Toolbox' },
  { id:'voa',              ru:'Vault of Ages',          en:'Vault of Ages' },
  { id:'frames',           ru:'Снаряжение фреймов',     en:'Frame equipment' },
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
/* Weapon, offhand and armour each get their own colour: in a mixed list the
   three read as one undifferentiated block otherwise. */
const eqClass = it => 'eq-' + (isEquip(it) ? it.eq.t : 'weapon');

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

/* Карточке обычно не к какому списку принадлежать, и заметки у неё нет. Но пока
   открыт список, она есть: заметка для игроков едет вместе с позицией, куда бы
   её ни копировали - её для того и писали. Мастерская не едет никуда, а цена и
   количество остаются в списке: в тексте одной вещи им делать нечего. */
function contextNote(it){
  const l = getList(onListPage());
  if (!l || l.ids.indexOf(it.id) < 0) return [];
  const m = itemMeta(l, it.id);
  return m.note ? [{ head: t().noteHead, body: m.note }] : [];
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
  const e = it.eq;
  /* Vault of Ages подписывает форму вещи: «Основное оружие — Кинжал». Правила
     за этим никакого не стоит, но это единственное, что отличает кинжал от
     косы в блоке характеристик, и терять его при переносе не за что. */
  const type = eqWord(EQ_TYPE, e.t) + (e.sub ? ' — ' + e.sub[S.lang === 'ru' ? 0 : 1] : '');
  const out = noType ? [] : [type];
  /* Ранг есть у всего снаряжения. У Wondrous он не напечатан рядом с вещью, но
     выводится однозначно: книга привязывает добычу к локации таблицей «Loot
     items by environment», а у локации ранг указан. Догадка по характеристикам,
     что стояла здесь раньше, больше не нужна - и хорошо, потому что полосы
     урона у соседних рангов перекрываются и такая догадка врала. */
  if (e.tier) out.push(t().tier + ' ' + e.tier);
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
  return p.length ? '<div class="eqstats ' + eqClass(it) + '">' +
    p.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div>' : '';
}
/* The feature label is stored inline ("Quick: when you…") so that every place
   that already prints a description keeps working; only the emphasis is added
   back here, at the first colon — the label itself never contains one. */
/* Ярлык свойства хранится прямо в тексте («Быстрое: когда вы…»), чтобы всякое
   место, которое уже печатает описание, продолжало работать; курсив добавляется
   здесь, по первому двоеточию - в самом ярлыке двоеточия не бывает. */
/* Ярлык свойства - это несколько слов в начале строки, а не всякое двоеточие:
   «…на которое он наложен: +3 к урону» - обычное предложение, и курсив в нём
   выделяет случайный кусок. Отсекаем по длине и по знакам, которых в названии
   свойства не бывает: запятая или точка внутри значат, что это уже фраза. */
const LABEL_MAX = 34;
function labelHtml(line, inList){
  const i = line.indexOf(': ');
  if (i < 0) return esc(line);
  const head = line.slice(0, i);
  /* В пункте списка двоеточие отделяет название варианта - «Бедствие (Провал,
     Страх)», «6 жетонов и 6 Надежды», - и запятая внутри скобок там законна.
     В обычной строке ярлыком считается только короткое имя свойства. */
  const ok = inList
    ? head.length <= 40
    : head.length <= LABEL_MAX && !/[,.;]/.test(head) && head.split(' ').length <= 4;
  return ok ? '<i>' + esc(head) + ':</i>' + esc(line.slice(i + 1)) : esc(line);
}
/* #18: строка, начинающаяся с «- », - пункт списка. Перечисление вариантов
   («1-2 - …; 3-4 - …») в одну строку читается как сплошная стена, а списком
   разбирается взглядом. Разметка минимальная нарочно: жирным только название
   вещи, курсивом ярлык свойства, всё остальное - обычный текст. */
/* plain — для строк списка и плиток: там описание в две строки под многоточие,
   и настоящий <ul> в них не помещается ни по смыслу, ни по разметке (внутри
   <span> он невалиден, а внутри <p> браузер закрывает абзац перед списком и
   весь текст после него теряет оформление карточки). */
function descHtml(it, plain){
  const s = descOf(it) || '';
  /* Курсивом выделяется ярлык свойства, а не всякое двоеточие: у добычи в тексте
     сплошь «Мастер решает: …», и italic там был бы шумом. Ярлыки бывают у
     снаряжения и у Стоимости Призыва - её строку книга и печатает отдельно. */
  /* Vault of Ages печатает именованные свойства и варианты выбора полужирным
     подзаголовком - тем же приёмом, что Core у свойств снаряжения. */
  const named = isEquip(it) || it.src === 'voa';
  const lab = (line, inList) => named ? labelHtml(line, inList) : esc(line);
  if (plain)
    return s.split('\n')
            .map(l => l.slice(0, 2) === '- ' ? '• ' + lab(l.slice(2), true) : lab(l))
            .join('<br>');
  const out = [];
  let ul = null;
  s.split('\n').forEach(function (line) {
    if (line.slice(0, 2) === '- ') {
      if (!ul) { ul = []; out.push(ul); }
      ul.push('<li>' + lab(line.slice(2), true) + '</li>');
      return;
    }
    ul = null;
    out.push(lab(line));
  });
  return out.map(function (x, i) {
    if (Array.isArray(x)) return '<ul class="dlist">' + x.join('') + '</ul>';
    return (i && !Array.isArray(out[i - 1]) ? '<br>' : '') + x;
  }).join('');
}

/* What travels with an item when it is copied or shared: the full text of the
   other end of a craft chain, and of any rulebook card the description names.
   Otherwise the player receives a name and still has to go looking.
   `skip` is a set of ids already present elsewhere in the same message. */
function extraBlocks(it, skip){
  const out = [];
  craftRows(it).forEach(function (r) {
    if (skip && skip[r.id]) return;
    /* Только вперёд по цепочке. «Получается из» полезно на карточке - видно,
       откуда вещь берётся, - но в сообщении игрокам это рецепт того, что у них
       уже на руках: лишний абзац про предмет, который они не получали. */
    if (r.back) return;
    out.push({ head: r.label + ': ' + r.name, body: descOf(BY_ID[r.id]) });
  });
  refRows(it).forEach(function (r) {
    out.push({ head: r.name + ' · ' + r.sub, body: r.text });
  });
  return out;
}

/* ---------- пересчёт цен ----------
   Скидка у торговца - это не «поправь десять полей руками», а одно решение:
   успех с Надеждой даёт минус двадцать процентов на всю покупку. Панель берёт
   проценты и применяет их ко всем позициям, у которых цена вообще проставлена;
   без цены позиция не трогается - нулю скидка не нужна.

   Отменить можно кнопкой в уведомлении: прежние цены запоминаются целиком, а
   не пересчитываются обратно, иначе округление увело бы их в сторону. */
/* ---------- пакетные действия над позициями ----------
   Раньше пересчёт цен жил отдельной панелью над предупреждением о хранении -
   далеко от строк, которых он касается, и всегда по всему списку разом. Теперь
   это выделение галочками, как в таблицах, и полоса действий прямо над
   строками: что выделено, то и меняется. */
function batchBarHTML(l){
  const ids = l.ids.filter(function (id) { return S.lsel[id]; });
  const n = ids.length;
  const all = n && n === l.ids.length;
  /* Денежных кнопок было четыре, и все четыре стояли в одной строке с
     удалением: «подсказать цены», подпись «цены, %», поле процентов, кнопка
     скидки и «убрать цену». Пять виджетов ради трёх решений, из которых за
     раз принимают одно. Теперь в полосе две кнопки - «Цены» и «Удалить», а
     всё денежное разложено под ней, где на него есть место и подписи. */
  return '<div class="batch' + (n ? ' on' : '') + '">' +
    '<label class="batch-all"><input type="checkbox" data-lsel-all="' + esc(l.id) + '"' +
      (all ? ' checked' : '') + '>' + esc(n ? t().pickedN + ' ' + n : t().pickAll) + '</label>' +
    (n ? '<span class="batch-acts">' +
      '<button type="button" class="btn sm' + (S.guess ? ' on' : '') + '" data-guess="' + esc(l.id) + '"' +
        ' aria-expanded="' + (S.guess ? 'true' : 'false') + '">' + esc(t().batchMoney) +
        '<i class="caret' + (S.guess ? ' up' : '') + '"></i></button>' +
      '<button type="button" class="btn sm danger" data-batch-del="' + esc(l.id) + '">' +
        esc(t().del) + ' (' + n + ')</button>' +
    '</span>' : '') +
    (n && S.guess ? moneyPanelHTML(l, ids) : '') +
  '</div>';
}

/* Всё, что можно сделать с ценами выбранных строк, в одном месте и по порядку:
   пересчитать проценты, взять подсказку, стереть. Проценты и «стереть» есть
   только там, где цена вообще проставлена - нулю скидка не нужна. */
function moneyPanelHTML(l, ids){
  const priced = ids.filter(function (id) { return itemMeta(l, id).gold > 0; }).length;
  return '<div class="guess">' +
    (priced
      ? '<div class="money-act">' +
          '<span class="batch-lbl">' + esc(t().repricePct) + '</span>' +
          numBox('rp', S.rp, -90, 500) +
          '<button type="button" class="btn sm" data-reprice="' + esc(l.id) + '">' +
            esc(S.rp < 0 ? t().repriceDown : t().repriceUp) + '</button>' +
          '<span class="money-hint">' + esc(t().repriceHint) + '</span>' +
        '</div>'
      : '') +
    '<p class="guess-note">' + esc(t().guessWhy) + '</p>' +
    '<div class="guess-rows">' + ids.map(function (id) {
      const it = BY_ID[id];
      if (!it) return '';
      const v = guessPrice(it);
      return '<div class="guess-row"><span>' + esc(nameOf(it)) + '</span>' +
        '<span class="guess-band">' + esc(guessWhy(it)) + '</span>' +
        '<b>' + (v ? esc(priceText(v, moneyMode(l))) : '—') + '</b></div>';
    }).join('') + '</div>' +
    '<div class="money-act">' +
      '<button type="button" class="btn sm primary" data-guess-apply="' + esc(l.id) + '">' +
        esc(t().guessApply) + '</button>' +
      (priced
        ? '<button type="button" class="btn sm" data-batch-clearprice="' + esc(l.id) + '">' +
            esc(t().batchNoPrice) + ' (' + priced + ')</button>'
        : '') +
    '</div>' +
  '</div>';
}

/* ---------- ориентир по цене (#7) ----------
   В книге цен нет: Core на с. 105 прямо говорит, что их назначает мастер. Так
   что кнопка не может называться «правильная цена» - она показывает, откуда
   взяты числа, и только потом предлагает их проставить. Порядок величин тот
   же, что в llms.txt: общая таблица сообщества, не канон.

   Оружие и броня идут по рангу, расходники - по силе, а добыча ранга не имеет
   вовсе, поэтому у неё своя мерка. Ставим середину вилки: любая точка внутри
   неё одинаково правдива, а середина меньше всего похожа на точное число. */
const GUESS_EQ = {
  weapon:    [[20, 30], [100, 150], [500, 700], [1000, 1500]],
  secondary: [[20, 30], [100, 150], [500, 700], [1000, 1500]],
  armor:     [[20, 40], [150, 200], [600, 800], [1500, 2000]]
};
/* Добыча ранга не имеет, её ось - редкость, и она уже размечена: сами
   альтернативные таблицы и есть эта разметка, 24 записи на каждую из пяти
   редкостей. Так что угадывать нечего - можно спросить у данных. */
/* У Vault of Ages ранг стоит и на добыче: книга разложена по рангам целиком.
   Переводим его в ту же шкалу редкости, по которой оценивается вся остальная
   добыча, - иначе весь Vault of Ages молча уехал бы в «необычное». */
const TIER_RAR = { 1:'common', 2:'uncommon', 3:'rare', 4:'very_rare', A:'legendary', C:'legendary' };
const GUESS_RAR = {
  item:       { common: [80, 120], uncommon: [150, 250], rare: [400, 600], very_rare: [800, 1200], legendary: [1500, 2500] },
  consumable: { common: [15, 25],  uncommon: [30, 50],   rare: [50, 70],   very_rare: [70, 90],    legendary: [100, 150] }
};
/* Записи из Wondrous, Dread и сообществ в альтернативные таблицы не входят -
   там редкости нет и взяться ей неоткуда. Для них остаётся середина шкалы:
   честнее сказать «обычная добыча», чем выдумать редкость по названию. */
const RARITY_OF = {};
Object.keys(ALT).forEach(function (kind) {
  Object.keys(ALT[kind]).forEach(function (r) {
    ['hope', 'fear'].forEach(function (c) {
      ALT[kind][r][c].forEach(function (id) { RARITY_OF[id] = r; });
    });
  });
});
function guessBand(it){
  if (isEquip(it))
    return (it.eq.tier && GUESS_EQ[it.eq.t] && GUESS_EQ[it.eq.t][it.eq.tier - 1]) || null;
  const kind = it.kind === 'consumable' ? 'consumable' : 'item';
  const r = RARITY_OF[it.id] || TIER_RAR[it.tier];
  return r ? GUESS_RAR[kind][r] : GUESS_RAR[kind].uncommon;
}
function guessPrice(it){
  const band = it && guessBand(it);
  return band ? Math.round((band[0] + band[1]) / 2) : 0;
}
/* Подпись говорит, по какому признаку взята вилка: у снаряжения это ранг, у
   добычи - редкость, а если редкости нет, так и сказано. */
function guessWhy(it){
  const band = guessBand(it);
  if (!band) return t().guessNoTier;
  const src = isEquip(it) ? t().tier + ' ' + it.eq.tier
            : RARITY_OF[it.id] ? t()[RAR_KEY[RARITY_OF[it.id]]]
            : it.tier ? voaTierName(it.tier)
            : t().guessNoRarity;
  /* Вилка всегда в монетах, а результат рядом может стоять мешками - без
     единицы это читалось как «30-50» и «4 горсти» про одно и то же число. */
  return src + ' · ' + band[0] + '–' + band[1] + ' ' + t().goldUnit;
}
/* ---------- ступени линии улучшения ----------
   У снаряжения улучшения не пара «до/из», а лестница из четырёх рангов, и
   ходить по ней через поиск неудобно. Ряд номеров под характеристиками -
   это та же лестница: текущая ступень подсвечена, остальные кликабельны. */
const BY_LINE = {};
EQ.concat(...Object.values(DATA)).forEach(function (x) {
  if (x.eq && x.eq.line) (BY_LINE[x.eq.line] = BY_LINE[x.eq.line] || []).push(x);
});
Object.keys(BY_LINE).forEach(function (k) {
  BY_LINE[k].sort(function (a, b) { return a.eq.tier - b.eq.tier; });
});
function lineStepsHTML(it){
  if (!isEquip(it) || !it.eq.line) return '';
  const all = BY_LINE[it.eq.line] || [];
  if (all.length < 2) return '';
  return '<div class="steps"><span class="steps-l">' + esc(t().tierLadder) + '</span>' +
    all.map(function (x) {
      return x.id === it.id
        ? '<span class="step on" aria-current="true">' + x.eq.tier + '</span>'
        : '<button type="button" class="step" data-open="' + esc(x.id) + '"' +
          ' title="' + esc(nameOf(x)) + '">' + x.eq.tier + '</button>';
    }).join('') + '</div>';
}

function craftRows(it){
  const rows = [];
  const into = BY_ID[it.craft];
  if (into) rows.push({ label: t().craftInto, name: nameOf(into), id: into.id });
  const from = BY_ID[CRAFTED_FROM[it.id]];
  if (from) rows.push({ label: t().craftFrom, name: nameOf(from), id: from.id, back: true });
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

/* ---------- Vault of Ages ----------
   Три тома одного автора, 108 карточек. Своей таблицы броска у книги нет: она
   разложена по рангам, а сверх четырёх рангов идут артефакты и проклятые
   предметы - в книге это отдельные разделы и отдельные строки в её же таблице
   рарности. Значит и бросков шесть, по одному на раздел, а не один общий:
   ранг 1 и артефакт - это не соседние результаты одной кости. */
const VOA_TIERS = [1, 2, 3, 4, 'A', 'C'];
function voaTierName(k){
  if (k === 'A') return t().voaArtifact;
  if (k === 'C') return t().voaCursed;
  return t().tier + ' ' + k;
}
/* На плитке места мало: буква вместо слова, как её печатает сама книга.
   У добычи показываются только буквы; ранг снаряжения - как был. */
function tileTier(it){
  if (it.tier) return (it.tier === 'A' || it.tier === 'C') ? it.tier : '';
  return isEquip(it) && it.eq.tier ? t().tier + ' ' + it.eq.tier : '';
}
function voaGroup(k){ return (DATA.voa || []).filter(x => String(x.tier) === String(k)); }

/* Всё снаряжение, откуда бы оно ни пришло. `LOOT.eq` - это только две базовые
   книги; ещё сто с лишним единиц лежат в Wondrous, Dread, Vault of Ages и во
   фреймах, и таблицы оружия и брони их не видели вовсе. */
const ALL_EQ = EQ.concat(...Object.values(DATA)).filter(function (x) { return x.eq; });
/* Фреймы стоят в фильтре поимённо, а не одним «Фреймом»: это не одна книга, а
   три разные кампании, и снаряжение каждой держится на её собственной завязке.
   За столом, где идёт «Пир зверей», остальные два фрейма - шум, а одним
   значением этого не сказать: либо все девяносто с лишним, либо ни одного.
   К тому же на самих строках уже стоит имя фрейма, а не слово «Фрейм». */
const EQ_SRC = ['core', 'hnf', 'wondrous', 'dread', 'voa'].concat(FRAME_ORDER);
function eqSrcOf(it){ return it.src === 'frame' ? it.frame : it.src; }
function srcName(k){
  const named = { core: t().srcCore, hnf: t().srcHnf, wondrous: t().srcWond,
                  dread: t().srcDread, voa: t().srcVoa }[k];
  return named || frameName(k) || k;
}

function srcLabel(it){
  if (it.src === 'core') return t().srcCore;
  if (it.src === 'hnf') return t().srcHnf;
  if (it.src === 'wondrous') return t().srcWond;
  if (it.src === 'dread') return t().srcDread;
  if (it.src === 'voa') return t().srcVoa;
  if (it.src === 'frame') return frameName(it.frame);
  return S.lang === 'ru' ? (it.community_ru || t().srcComm) : (it.community || t().srcComm);
}

function toast(msg, isError){
  showToast(msg, isError ? 'err' : '', isError ? 2600 : 1600, null);
}
/* A toast that can be acted on: removing an entry from a list is one click,
   irreversible and easy to do by accident, so the way back has to be right
   where the eye already is. It lingers longer than a plain notice, because it
   is asking a question rather than reporting a fact. */
function toastAction(msg, label, fn){
  showToast(msg, 'act', 7000, { label: label, fn: fn });
}
function hideToast(){
  const el = $('#toast');
  el.hidden = true; el.textContent = ''; toast._act = null;
}
function showToast(msg, mode, ms, action){
  const el = $('#toast');
  const err = mode === 'err';
  el.setAttribute('role', err ? 'alert' : 'status');
  el.setAttribute('aria-live', err ? 'assertive' : 'polite');
  el.className = 'toast' + (mode ? ' ' + mode : '');
  el.textContent = '';
  el.appendChild(document.createTextNode(msg));
  toast._act = null;
  if (action) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'toast-act';
    b.textContent = action.label;
    b.setAttribute('data-toast-act', '1');
    el.appendChild(b);
    toast._act = action.fn;
  }
  el.hidden = false;
  clearTimeout(toast._tm);
  // the button goes with it: a hidden node that still answers to a selector is
  // a lie to anything reading the page, tests included
  toast._tm = setTimeout(function () { hideToast(); }, ms);
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

const ICON_PRINT = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style="flex:none"><path d="M19 8H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3zm-3 11H8v-5h8v5zm3-7a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM18 3H6v4h12V3z"/></svg>';
const ICON_COPY = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style="flex:none"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"/></svg>';
const ICON_IMG   = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style="flex:none"><path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z"/></svg>';
const ICON_SHARE = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style="flex:none"><path d="M18 16.1c-.8 0-1.5.3-2 .8l-7.1-4.2c.1-.2.1-.5.1-.7s0-.5-.1-.7L16 7.1c.5.5 1.2.8 2 .8a3 3 0 1 0-3-3c0 .3 0 .5.1.7L8 9.9a3 3 0 1 0 0 4.2l7.1 4.2c-.1.2-.1.4-.1.6a2.9 2.9 0 1 0 3-2.8z"/></svg>';
const ICON_EXT  = '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style="flex:none;opacity:.7"><path d="M14 3v2h3.6l-9.8 9.8 1.4 1.4L19 6.4V10h2V3h-7zM5 5h5V3H3v18h18v-7h-2v5H5V5z"/></svg>';
const ICON_PLUS = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true" style="flex:none"><path d="M11 5h2v14h-2zM5 11h14v2H5z"/></svg>';
const ICON_HOME = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M12 3 2 11h3v9h5v-6h4v6h5v-9h3L12 3z"/></svg>';
const ICON_EYE = '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true" style="flex:none"><path d="M12 5c-5 0-9 4.5-9.7 6.6a1.2 1.2 0 0 0 0 .8C3 14.5 7 19 12 19s9-4.5 9.7-6.6a1.2 1.2 0 0 0 0-.8C21 9.5 17 5 12 5zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/></svg>';
const ICON_EYE_OFF = '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true" style="flex:none"><path d="M2.8 3.6 3.9 2.5l17.6 17.6-1.1 1.1-3.2-3.2A10 10 0 0 1 12 19c-5 0-9-4.5-9.7-6.6a1.2 1.2 0 0 1 0-.8A13 13 0 0 1 6 7.3L2.8 3.6zm5.3 5.3A5 5 0 0 0 12 17c1 0 1.9-.3 2.7-.8l-1.5-1.5a2.5 2.5 0 0 1-3.4-3.4L8.1 8.9zM12 5c5 0 9 4.5 9.7 6.6a1.2 1.2 0 0 1 0 .8 13 13 0 0 1-2.5 3.4l-3-3A5 5 0 0 0 9.2 6.4 9.6 9.6 0 0 1 12 5z"/></svg>';
const ICON_NOTE = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true" style="flex:none"><path d="M4 3h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H8l-4 4V4a1 1 0 0 1 1-1zm3 5h10V6.5H7V8zm0 3h10V9.5H7V11zm0 3h7v-1.5H7V14z"/></svg>';
const ICON_COIN = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 8v8M9.6 10.2h4.8M9.6 13.8h4.8" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>';
const ICON_REF ='<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true" style="flex:none"><path d="M6 2h11a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2.5 2.5 0 0 1 0-5h11V4H6a.5.5 0 0 0 0 1h9v2H6a2.5 2.5 0 0 1 0-5z"/></svg>';
const ICON_CRAFT ='<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true" style="flex:none"><path d="M4 11h11.2l-3.6-3.6L13 6l6 6-6 6-1.4-1.4 3.6-3.6H4v-2z"/></svg>';
const ICON_GRIP ='<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true" style="flex:none"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>';
const ICON_LINK ='<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style="flex:none"><path d="M3.9 12a5.1 5.1 0 0 1 5.1-5.1h4V5H9a7 7 0 0 0 0 14h4v-1.9H9A5.1 5.1 0 0 1 3.9 12zM8 13h8v-2H8v2zm7-8v1.9h4a5.1 5.1 0 0 1 0 10.2h-4V19h4a7 7 0 0 0 0-14h-4z"/></svg>';

/* ============================================================
   LISTS
   Kept in localStorage only — there is no server behind this app.
   ============================================================ */
const LS_KEY = 'dhloot.lists.v2';
const LS_KEY_V1 = 'dhloot.lists.v1';
/* The language is a preference, not a per-page choice: without remembering it,
   an English reader is thrown back into Russian by every reload and every
   shared link they open. */
const LANG_KEY = 'dhloot.lang.v1';
/* Which section the app opens on. A GM who lives in Search should not have to
   walk past the d12 roller every time. */
const HOME_KEY = 'dhloot.home.v1';
/* ---------- remembered choices ----------
   Only how a page is laid out. Everything about what is shown or asked starts
   fresh, because a reload is a new sitting: a filter restored from yesterday is
   invisible state — nobody remembers switching it off, and the app just looks
   broken. Which books to roll from, which kinds to show, the rarity and the
   community are all answers to "what am I doing this minute", so they are
   answered again rather than remembered. */
const PREFS_KEY = 'dhloot.prefs.v1';
function savePrefs(){
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ view: S.tables.view }));
  } catch (e) {}
}
/* Storage is a stranger: a value that fails the check keeps its default rather
   than taking the app down with it. */
function loadPrefs(){
  let p;
  try { p = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null'); } catch (e) { return; }
  if (!p || typeof p !== 'object') return;
  if (p.view === 'list' || p.view === 'grid') S.tables.view = p.view;
}

/* ---------- how tall a note box stands ----------
   The height used to be dragged by hand and kept in the settings, one figure
   per kind of box. It travelled: a height set for a long shop note came back on
   a one-line note about a dagger, in another list, tomorrow (#12). There is
   nothing to remember here — the right height is the one the text needs, so the
   box grows under its own content up to a ceiling and scrolls past it.

   A box the GM has resized by hand is left alone until the next render: while
   the pointer is theirs, ours has no business moving it. */
const NOTE_SEL = '.lnote textarea, .rnote textarea';
const NOTE_MAX = 320;
function autoSize(ta){
  if (!ta || ta.dataset.manual) return;
  /* Hidden boxes measure as zero; the row attribute holds them until they open. */
  if (!ta.offsetParent) return;
  ta.style.height = 'auto';
  // scrollHeight is the content box, height is the border box on these
  const frame = ta.offsetHeight - ta.clientHeight;
  ta.style.height = Math.min(ta.scrollHeight + frame, NOTE_MAX) + 'px';
}
function autoSizeNotes(root){
  [...(root || document).querySelectorAll(NOTE_SEL)].forEach(autoSize);
}

/* Which section the app opens on. A GM who lives in Search should not have to
   walk past the d12 roller every time. */
const HOME_DEFAULT = '#/roll/std';
function loadHome(){
  try { const v = localStorage.getItem(HOME_KEY); return homeAllows(v) ? v : ''; }
  catch (e) { return ''; }
}
/* Only whole sections, and a table by name — an item page or a list payload
   would pin the app to a snapshot that can go stale. */
function homeAllows(hash){
  if (!hash) return false;
  const h = hash.replace(/^#\/?/, '');
  if (TAB_LIST.some(function (x) { return x[0] === h; })) return true;
  const m = /^tables\/([a-z_]+)$/.exec(h);
  return !!(m && TABLE_DEFS.some(function (d) { return d.id === m[1]; }));
}
/* The address of the section being looked at, or '' where pinning makes no
   sense (a single item, someone else's list). */
function homeHash(){
  if (S.route === 'tables') return '#/tables/' + S.tables.t;
  return TAB_LIST.some(function (x) { return x[0] === S.route; }) ? '#/' + S.route : '';
}
function isHome(){
  const here = homeHash();
  return !!here && (loadHome() || HOME_DEFAULT) === here;
}
function loadLang(){
  try { const v = localStorage.getItem(LANG_KEY); if (v === 'ru' || v === 'en') S.lang = v; }
  catch (e) {}
}
function saveLang(){
  try { localStorage.setItem(LANG_KEY, S.lang); } catch (e) {}
}

function loadLists(){
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw !== null) return keepLists(JSON.parse(raw));
    // first run on the new shape: bring the old lists across and leave the old
    // key untouched, so nothing is lost if this version is rolled back
    const old = localStorage.getItem(LS_KEY_V1);
    if (old === null) return [];
    const moved = keepLists(JSON.parse(old)).map(liftNotes);
    localStorage.setItem(LS_KEY, JSON.stringify(moved));
    return moved;
  } catch (e) { return []; }
}
function keepLists(arr){
  return Array.isArray(arr) ? arr.filter(l => l && l.id && Array.isArray(l.ids)) : [];
}
/* One flagged note becomes two named ones. The old `noteShow` said "copy this
   along with the item", which is precisely the note meant for players — so the
   split is read off the data rather than guessed. */
function liftNotes(l){
  const lift = o => {
    if (o && o.note && !o.noteShow) { o.hnote = o.note; delete o.note; }
    if (o) delete o.noteShow;
    return o;
  };
  lift(l);
  if (l.meta) Object.keys(l.meta).forEach(id => lift(l.meta[id]));
  return l;
}
/* Every write used to stamp this tab's whole array over the key, so two tabs
   open at once destroyed each other's lists: the one that saved last won
   outright, silently, with no server and no export to recover from. Storage is
   re-read and merged by id instead, and a list this tab never knew about is
   left where it is. */
function saveLists(){
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(mergeLists(S.lists)));
    return true;
  } catch (e) { toast(t().saveFailed, true); return false; }
}
function mergeLists(mine){
  let stored;
  try { stored = keepLists(JSON.parse(localStorage.getItem(LS_KEY) || '[]')); }
  catch (e) { return mine; }
  const seen = {};
  mine.forEach(function (l) { seen[l.id] = true; });
  /* Anything only the other tab has is kept, after ours so the order this tab
     shows stays the order this tab meant. A list deleted here is gone from
     `mine` and from `deleted`, which is what tells the two cases apart. */
  const theirs = stored.filter(function (l) { return !seen[l.id] && !S.deleted[l.id]; });
  return mine.concat(theirs);
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
/* ---------- how much a thing costs, in words ----------
   Цена всегда хранится монетами, целым числом: пересчёт живёт только в этой
   функции, и режим отображения ничего не портит в данных. Корник говорит про
   горсти, мешки и сундуки, а не про сотни монет, и список, где всё стоит
   «750 зол.», читается хуже, чем список из мешков (#15). */
const MONEY_STEP = [
  { n: 1000, ru: ['сундук', 'сундука', 'сундуков'], en: ['chest', 'chests'] },
  { n: 100,  ru: ['мешок', 'мешка', 'мешков'],      en: ['bag', 'bags'] },
  { n: 10,   ru: ['горсть', 'горсти', 'горстей'],   en: ['handful', 'handfuls'] },
  { n: 1,    ru: ['монета', 'монеты', 'монет'],     en: ['coin', 'coins'] }
];
/* Первым стоит то, как деньги считает сама книга: горсти, мешки и сундуки.
   Монеты - опциональное правило, и по умолчанию их нет, поэтому и режим по
   умолчанию книжный. В ссылке помечается «coin»: отсутствие пометки значит
   книжный вид, и старые ссылки без неё читаются так же, как новые. */
const MONEY_MODES = ['bag', 'coin'];
const MONEY_DEFAULT = 'bag';
function moneyWord(step, n){
  if (S.lang !== 'ru') return step.en[n === 1 ? 0 : 1];
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return step.ru[0];
  if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return step.ru[1];
  return step.ru[2];
}
/* Две старшие единицы, а не все четыре: «1 сундук 2 мешка» - это цена, а
   «1 сундук 2 мешка 3 горсти 4 монеты» - это опись.

   И округление к ближайшему, а не отбрасывание остатка. Книжный счёт - это то,
   как о деньгах говорят за столом, а за столом 899 монет - это «девять мешков»,
   а не «восемь мешков девять горстей девять монет». Монет в этом виде нет
   вовсе: 804 - это восемь мешков, и четыре монеты сверху ничего не добавляют,
   кроме точности, за которой сюда не приходят. Меньше горсти округляется вверх
   до горсти - иначе цена в четыре монеты показалась бы пустой строкой.

   Округление второй единицы может её переполнить (8 мешков 10 горстей), и тогда
   она переносится в старшую: девять мешков. */
function priceText(coins, mode){
  const n = Math.max(0, Math.round(coins) || 0);
  if (!n) return '';
  if (mode !== 'bag') return n + ' ' + t().goldUnit;
  const STEPS = MONEY_STEP.filter(function (s) { return s.n >= 10; });
  /* Сначала округляем сумму до той единицы, на которой строка кончится, и
     только потом раскладываем: так перенос («10 горстей») получается сам собой
     и не приходится ловить его отдельно. Шаг округления - вторая единица
     сверху, а у самой мелкой суммы - она сама. */
  const top = STEPS.filter(function (s) { return n >= s.n; })[0] || STEPS[STEPS.length - 1];
  const res = (STEPS[STEPS.indexOf(top) + 1] || top).n;
  const round = Math.max(res, Math.round(n / res) * res);
  const out = [];
  let left = round;
  STEPS.forEach(function (st) {
    if (out.length >= 2 || left < st.n) return;
    const v = Math.floor(left / st.n);
    out.push(v + ' ' + moneyWord(st, v));
    left -= v * st.n;
  });
  return out.join(' ');
}
function moneyMode(l){
  return l && MONEY_MODES.indexOf(l.money) >= 0 ? l.money : MONEY_DEFAULT;
}
/* Подсказка на поле цены: в режиме монет говорить нечего, поле и так о них */
function goldText(l, coins){
  return coins > 0 && moneyMode(l) !== 'coin' ? priceText(coins, moneyMode(l)) : '';
}
function goldTitle(l, coins){
  const s = goldText(l, coins);
  return s ? ' title="' + esc(s) + '"' : '';
}
/* Пересчёт в мешки висел только всплывающей подсказкой на поле, и о ней нельзя
   было догадаться, не наведя мышь. Вопросительный знак в подписи занимает те же
   нисколько места, но виден - дальше работает та же подсказка. Знак не кнопка:
   нажимать тут не на что, он только говорит, что подсказка есть. В режиме
   монет пересчитывать нечего, и знака нет. */
function goldHintHTML(l, coins){
  const s = goldText(l, coins);
  return s
    ? '<span class="goldhint" data-goldhint="' + esc(s) + '" title="' + esc(s) + '">?</span>'
    : '';
}
/* name plus whatever meta the GM filled in */
function itemLine(l, it){
  const m = itemMeta(l, it.id);
  return nameForShare(it) +
    (m.qty > 1 ? ' ×' + m.qty : '') +
    (m.gold ? ' — ' + priceText(m.gold, moneyMode(l)) : '');
}

function createList(name){
  const l = { id: newId(), name: (name || '').trim() || t().untitled, ids: [], created: Date.now() };
  S.lists.unshift(l);
  /* The list is kept for this session even when the write fails — the app still
     works, the banner already explains that nothing will survive a reload. What
     must not happen is a cheerful "created" on top of the failure notice, so
     the caller checks this before congratulating anyone. */
  createList.saved = saveLists();
  return l;
}
/* Remembered for this tab's lifetime so a merge cannot resurrect it from the
   copy another tab still holds. */
function deleteList(id){
  S.deleted[id] = true;
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
const N_MONEY = '$';    // not an id: carries the price display mode, ignored by old builds
const N_SHARED = '@';   // not an id either: the menu key for "take from a shared list"
/* A leading "+" marks the note meant for players. It rides on the id, not the
   text: ids are letters and digits, so the plus can never be confused with one,
   while a note is free to start with "-1 к броску".
   This is the same marker the old format used for "copy along with the item",
   and it meant the same thing, so old links carry over without a version. */
const N_SHOW = '+';

/* `forPlayers` leaves the GM's own notes out. That link is what gets pasted
   into the party chat; the full one is the GM's backup. */
function encodeListRaw(l, forPlayers){
  // "id" or "id*qty" or "id*qty*gold" — old links carried bare ids and still parse
  const parts = l.ids.map(function (id) {
    const m = itemMeta(l, id);
    if (m.gold) return id + '*' + (m.qty || 1) + '*' + m.gold;
    if (m.qty > 1) return id + '*' + m.qty;
    return id;
  });
  /* A chat client that wraps or clips a long URL leaves a payload that still
     decodes — into a shorter list that looks complete. The count and a short
     hash of the ids give the decoder something to disagree with. */
  let raw = l.name + '\n' + stamp(parts) + parts.join(',');
  const rec = (id, text, show) => text ? N_REC + (show ? N_SHOW : '') + id + N_SEP + text : '';
  const pair = (id, o) => rec(id, o.note, true) + (forPlayers ? '' : rec(id, o.hnote, false));
  /* Режим показа цены едет в хвосте заметок под id, которого нет и не может
     быть ни у одной записи. Старый разборщик на таком id делает `return` -
     ссылка у него открывается как открывалась, просто монетами (#15). Знак
     считается только по строке позиций, так что лишняя запись его не трогает. */
  const money = moneyMode(l) !== MONEY_DEFAULT ? N_REC + N_MONEY + N_SEP + moneyMode(l) : '';
  const notes = money + pair(N_LIST, l) + l.ids.map(function (id) {
    return pair(id, itemMeta(l, id));
  }).join('');
  if (notes) raw += '\n' + notes;

  return raw;
}
function encodeList(l, forPlayers){
  return b64url(new TextEncoder().encode(encodeListRaw(l, forPlayers)));
}
/* Four base36 characters: enough that a truncation lands on the right value
   about once in two million, cheap enough to spend on every link. */
function stamp(parts){
  const body = parts.join(',');
  let h = 2166136261;
  for (let i = 0; i < body.length; i++) {
    h ^= body.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return parts.length.toString(36) + '.' + (h >>> 0).toString(36).slice(-4) + '~';
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

    /* Links from before the stamp existed have no "~" on the items line and are
       read as they always were — there is simply nothing to check them against. */
    const cut = itemsLine.indexOf('~');
    let want = null;
    let itemsBody = itemsLine;
    if (cut > 0 && /^[0-9a-z]+\.[0-9a-z]{1,4}$/.test(itemsLine.slice(0, cut))) {
      want = itemsLine.slice(0, cut);
      itemsBody = itemsLine.slice(cut + 1);
    }

    const ids = [], meta = {};
    const parts = itemsBody.split(',');
    if (want !== null && stamp(parts) !== want + '~') return null;   // truncated or edited
    parts.forEach(function (part) {
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

    let note = '', hnote = '', money = '';
    if (noteBlob) {
      const cut = noteBlob.indexOf(N_REC);
      // anything before the first record is a list note from the first cut of
      // this format, which had no marker — that meant the GM's own note
      hnote = cut < 0 ? noteBlob : noteBlob.slice(0, cut);
      if (cut >= 0) {
        noteBlob.slice(cut + 1).split(N_REC).forEach(function (rec) {
          const at = rec.indexOf(N_SEP);
          if (at < 0) return;
          let id = rec.slice(0, at);
          const text = rec.slice(at + 1);
          if (!text) return;
          const forPlayers = id.charAt(0) === N_SHOW;
          if (forPlayers) id = id.slice(1);
          const field = forPlayers ? 'note' : 'hnote';
          if (id === N_MONEY) { if (MONEY_MODES.indexOf(text) >= 0) money = text; return; }
          if (id === N_LIST) { if (forPlayers) note = text; else hnote = text; return; }
          if (!BY_ID[id] || ids.indexOf(id) < 0) return;
          (meta[id] || (meta[id] = {}))[field] = text;
        });
      }
    }
    return {
      name: name, ids: ids, money: money || undefined,
      note: note || undefined, hnote: hnote || undefined,
      meta: Object.keys(meta).length ? meta : undefined
    };
  } catch (e) { return null; }
}
/* ---------- короткая ссылка ----------
   Заметки — самая длинная часть списка, и по-русски каждый символ занимает в
   base64 вчетверо больше места, чем стоило бы. Deflate ужимает такую ссылку
   почти вдвое.

   Сжатый payload помечен «~» в начале. Обычный — это base64url, в его алфавите
   тильды нет и быть не может, так что старые ссылки читаются как читались, а
   различать их можно по первому символу.

   Сжатие асинхронное (CompressionStream), поэтому оно живёт только на кнопках
   «Поделиться»: адресная строка обновляется на каждую правку и ждать там
   нечего. Пришедшую короткую ссылку приложение разворачивает обратно в обычную
   при открытии — дальше всё работает прежним синхронным кодом. */
const PACK_MARK = '~';
function canPack(){ return typeof CompressionStream === 'function'; }
function b64url(bytes){
  let bin = ''; bytes.forEach(function (b) { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64url(s){
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function pipe(bytes, stream){
  const r = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await r.arrayBuffer());
}
/* Короче не всегда: у списка из трёх позиций без заметок сжатие только мешает,
   поэтому берём тот вариант, который на самом деле вышел меньше. */
async function packPayload(raw){
  const plain = b64url(new TextEncoder().encode(raw));
  if (!canPack()) return plain;
  try {
    const packed = PACK_MARK + b64url(
      await pipe(new TextEncoder().encode(raw), new CompressionStream('deflate-raw')));
    return packed.length < plain.length ? packed : plain;
  } catch (e) { return plain; }
}
async function unpackPayload(pay){
  if (pay.charAt(0) !== PACK_MARK) return pay;
  const raw = await pipe(unb64url(pay.slice(1)), new DecompressionStream('deflate-raw'));
  return b64url(raw);
}

function listShareUrl(l, forPlayers){
  return appUrl(listHash(l, forPlayers));
}
/* Ссылка для человека: та же, но по возможности короткая. */
async function listShareUrlShort(l, forPlayers){
  return appUrl('#/l/' + await packPayload(encodeListRaw(l, forPlayers)));
}
/* The address bar carries the whole list, not a local id, so whatever a person
   copies out of it — the Share button or the browser's own URL box — works for
   everyone. S.openList remembers which local list that address belongs to, so
   an edit can refresh the address instead of orphaning the page. */
function listHash(l, forPlayers){ return '#/l/' + encodeList(l, forPlayers); }
/* Saving a shared list produces an identical payload, so the hash does not
   actually change and no hashchange fires — render by hand in that case. */
function goToList(l){
  S.openList = l.id;
  const want = listHash(l, true);
  if (location.hash === want) { S.urlPayload = encodeList(l, true); render(); }
  else location.hash = want;
}
/* Which of my lists is this address showing?
   Comparing encoded payloads was brittle: a list has two flavours (with the
   GM's notes and without), links made before the checksum look different again,
   and every future change to the encoding would break recognition once more —
   the symptom being "Список от другого игрока" over your own list, with saving
   it changing nothing. So the payload is decoded and the contents compared:
   same name, same entries in the same order, and nothing the link carries
   contradicting what is stored. */
function findListByPayload(payload){
  const want = decodeList(payload);
  if (!want) return null;
  const fields = ['qty', 'gold', 'note', 'hnote'];
  for (let i = 0; i < S.lists.length; i++) {
    const l = S.lists[i];
    if (l.name !== want.name || l.ids.length !== want.ids.length) continue;
    if (l.ids.some(function (id, k) { return id !== want.ids[k]; })) continue;
    // a players' link simply has no GM notes; that is not a disagreement
    const meta = want.meta || {};
    const clash = Object.keys(meta).some(function (id) {
      const mine = itemMeta(l, id);
      return fields.some(function (f) {
        return meta[id][f] !== undefined && meta[id][f] !== mine[f];
      });
    });
    if (clash) continue;
    if (want.note !== undefined && want.note !== l.note) continue;
    if (want.hnote !== undefined && want.hnote !== l.hnote) continue;
    return l;
  }
  return null;
}

/* Whoever opens it lands on this table with the same values picked */
function fltHash(){
  const f = fEncode(S.tables.t);
  return '#/tables/' + S.tables.t + (f ? '/' + f : '');
}
function fltUrl(){ return appUrl(fltHash()); }
/* Written straight into the address bar, so copying it from there and using the
   button give the same link — and a stale filter never lingers in the URL. */
function syncFltUrl(){
  if (!tblFacets(S.tables.t).length) return;
  S.fSeg = fEncode(S.tables.t);
  if (history.replaceState) history.replaceState(null, '', fltHash());
}
/* A list now has two payloads — with the GM's notes and without — and either
   one is still that list. Comparing against the players' flavour alone meant a
   GM opening their own backup link was told it belonged to someone else, and
   saving it again changed nothing, because the link never matched. */
/* Rewrites the address to match the list as it stands now. replaceState does
   not fire hashchange, so this never re-enters render(). */
/* Edits made without a re-render (name, quantity, gold, notes) still have to
   move the address along, otherwise the link in the bar quietly goes stale. */
function freshenListUrl(l){
  if (S.openList === l.id) syncListUrl(l);
}
function syncListUrl(l){
  const payload = encodeList(l, true);
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
  return m.note ? [{ head: t().noteHead, body: m.note }] : [];
}
function listNoteTail(l){
  return l.note ? [{ head: t().noteHead, body: l.note }] : [];
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
/* Every in-app link is built here, so they cannot disagree with each other.
   A web server serves index.html for the bare directory, so naming the file
   only adds noise; opened from disk there is nothing to serve and the file has
   to be named. The filter link used to spell it out either way, which is how
   two links copied from the same page came out looking different. */
function appUrl(hash){ return baseUrl() + (hosted() ? '' : 'index.html') + hash; }
/* On a real host, link to the static stub in i/ — it carries per-item Open Graph
   tags, so Telegram/Discord unfurl the picture, name and description by itself.
   Opened from disk there is no stub, so fall back to the in-app hash route. */
function itemUrl(id){ return hosted() ? baseUrl() + 'i/' + id + '.html' : appUrl('#/i/' + id); }
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
/* The art is drawn at 640, and nothing on screen is wider than about 320 —
   a table of sixty rows was pulling two megabytes to fill hundred-pixel
   thumbnails. `sizes` describes the widest box a picture can land in, which is
   the tile in grid view; rows and compact cards are far smaller and the browser
   picks accordingly. */
function imgTag(it, where, extra){
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

/* Что стоит за ключом меню. Раскладка одна на всех: и «положить в готовый
   список», и «создать новый и положить туда» спрашивают одно и то же, а две
   копии этого разбора успели разойтись - создание нового списка из чужой
   ссылки клало в него один несуществующий id «@» и выдавало пустой список. */
function idsForKey(key){
  if (key === 'sel') return selIds();
  if (key === N_SHARED) return S.shared.ids.slice();
  return [key];
}
/* Пока открыт чужой список, всё, что с него забирают, забирают вместе с тем,
   что на нём написано: количеством, ценой и заметкой для игроков. Раньше это
   работало только у кнопки «весь список», а галочки на строках и «плюс» на
   карточке приносили голые названия. */
function metaForKey(key){
  if (key === N_SHARED) return S.shared.meta;
  return (S.route.indexOf('l/') === 0 && !S.openList) ? S.shared.meta : null;
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
/* Putting one thing into four lists is a normal errand, so the menu stays open
   and the chip you pressed just changes state. Redrawing the page instead made
   the whole card blink and shut the menu after every single pick. */
function applyAddTo(listId, key){
  const l = getList(listId);
  if (!l) return;
  const ids = idsForKey(key);
  if (key === N_SHARED) { addIdsTo(l, ids, S.shared.meta); return; }
  if (ids.length === 1 && l.ids.indexOf(ids[0]) >= 0) {
    l.ids = l.ids.filter(x => x !== ids[0]);
    saveLists();
    toast(t().removedFrom.replace('%s', l.name));
    afterListChange(l, ids[0]);
    return;
  }
  addIdsTo(l, ids, metaForKey(key));
}
/* Количество и цена едут вместе с позицией, если их есть откуда взять: лавка,
   которой поделился мастер, без цен - это просто перечень названий (#14).
   Заметки не едут: в них мастерское, и в чужом инвентаре им не место. */
function addIdsTo(l, ids, meta){
  const fresh = ids.filter(id => BY_ID[id] && l.ids.indexOf(id) < 0);
  fresh.forEach(id => l.ids.push(id));
  /* Переносим всё, что видно на чужой странице: количество, цену и заметку для
     игроков. Мастерская заметка не видна и не едет. Поправить у себя проще, чем
     восстанавливать по памяти то, что не приехало. */
  if (meta) fresh.forEach(function (id) {
    const m = meta[id];
    if (!m) return;
    if (m.qty > 1) setMeta(l, id, 'qty', m.qty);
    if (m.gold > 0) setMeta(l, id, 'gold', m.gold);
    if (m.note) setMeta(l, id, 'note', m.note);
  });
  saveLists();
  toast(t().addedTo.replace('%s', l.name) + (ids.length > 1 ? ': ' + fresh.length : ''));
  afterListChange(l, ids.length === 1 ? ids[0] : '');
}
/* The page has to be rebuilt only when it is showing the list that changed.
   Anywhere else the sole visible difference is the tick on one chip. */
function afterListChange(l, itemId){
  if (onListPage() === l.id) { render(); return; }
  freshenListUrl(l);
  if (itemId) markMembership(l, itemId);
  renderSelBar();
}
function markMembership(l, itemId){
  const inList = l.ids.indexOf(itemId) >= 0;
  $$('[data-add-to]').forEach(function (chip) {
    const p = chip.dataset.addTo.split('|');
    if (p[0] !== l.id || p[1] !== itemId) return;
    chip.classList.toggle('on', inList);
    chip.textContent = (inList ? '✓ ' : '') + l.name;
  });
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
    return '<span class="badge ' + eqClass(it) + '">' + esc(eqWord(EQ_TYPE, it.eq.t)) + '</span>';
  return '<span class="badge ' + (it.kind === 'consumable' ? 'cons' : 'item') + '">' +
    esc(it.kind === 'consumable' ? t().cons : t().item) + '</span>';
}
/* #21: часть снаряжения стоит без лестницы рангов. Это не пробел в данных, а
   именованные вещи, которые в книге существуют в одном ранге - и выбирать их
   надо иначе, чем «взять тот же меч на ранг выше». Слово то же, что в фильтре
   «Линия»: два названия одного и того же читаются как два разных признака. */
function isUnique(it){ return isEquip(it) && !it.eq.line; }
/* Ранг добычи - случай Vault of Ages: у снаряжения он и так стоит в строке
   характеристик, и второй раз его повторять незачем. */
/* Речь об одной вещи, а не о разделе книги: «Артефакт», не «Артефакты» */
function voaTierOne(k){
  return k === 'A' ? t().voaArtifact1
       : k === 'C' ? t().voaCursed1
       : t().tier + ' ' + k;
}
/* Ярлык только там, где иначе не сказать. Артефакт и проклятый предмет - это
   отдельные категории, их нет больше нигде. Числовой ранг у добычи Vault of
   Ages ярлыком не выносится: у остальной добычи ранга нет вовсе, а в самой
   таблице он и так стоит заголовком раздела. */
function tierBadge(it){
  return (it.tier === 'A' || it.tier === 'C')
    ? '<span class="badge tier">' + esc(voaTierOne(it.tier)) + '</span>' : '';
}
function uniqBadge(it){
  return isUnique(it)
    ? '<span class="badge uniq" title="' + esc(t().uniqueHint) + '">' + esc(t().unique) + '</span>'
    : '';
}

function cardHTML(it, opt){
  opt = opt || {};
  const nm = nameOf(it), ds = descOf(it);
  const meta =
    ((opt.rollLabel !== false && it.roll) ? '<span class="badge num">' + esc(opt.rollLabel || it.roll) + '</span>' : '') +
    (opt.col ? '<span class="badge ' + opt.col + '">' + esc(opt.col === 'hope' ? t().hope : t().fear) + '</span>' : '') +
    kindBadge(it) + uniqBadge(it) + tierBadge(it) +
    '<span class="badge src">' + esc(srcLabel(it)) + '</span>';

  const nameEl = opt.full
    ? '<span>' + esc(nm) + '</span>'
    : '<a href="#/i/' + esc(it.id) + '" title="' + esc(t().openPage) + '">' + esc(nm) + '</a>';

  return '' +
  '<article class="card' + (opt.full ? ' full' : ' compact') + '" data-id="' + esc(it.id) + '">' +
    '<button type="button" class="card-media" data-open="' + esc(it.id) + '" aria-label="' + esc(t().openPage) + '">' +
      imgTag(it, opt.full ? 'full' : 'card') +
    '</button>' +
    '<div class="card-body">' +
      '<div class="card-meta">' + meta + '</div>' +
      '<h2 class="card-name">' + nameEl +
        '<span class="card-name-acts">' +
          '<button type="button" data-copy-name="' + esc(it.id) + '" title="' + esc(t().copyName) + '" aria-label="' + esc(t().copyName) + '">' + ICON_COPY + '</button>' +
          '<button type="button" data-share="' + esc(it.id) + '" title="' + esc(t().copyLink) + '" aria-label="' + esc(t().copyLink) + '">' + ICON_LINK + '</button>' +
        '</span>' +
      '</h2>' +
      eqChips(it) +
      (ds ? '<div class="card-desc">' + descHtml(it) + '</div>' : '') +
      lineStepsHTML(it) +
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
/* Deliberately type=text. A number input refuses setSelectionRange, so after
   the re-render that every keystroke triggers there was no way to put the caret
   back: the second digit of a two-digit roll landed in front of the first and
   47 came out as 74, then clamped to 60. The stepper buttons are ours anyway,
   so nothing is lost by dropping the native one. */
function numBox(id, val, min, max, cls){
  return '<div class="numbox ' + (cls || '') + '">' +
    '<button type="button" data-step="-1" data-for="' + id + '" aria-label="' + esc(t().stepDown) + '">−</button>' +
    '<input type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off"' +
      /* Значение ниже минимума набрать нельзя, поэтому оно и означает «ещё не
         введено»: поле стоит пустым (#16). У поля процентов минимум
         отрицательный, так что его ноль - обычное число и виден он как ноль. */
      ' id="' + id + '" value="' + (val < min ? '' : val) + '" data-min="' + min + '" data-max="' + max + '"' +
      ' aria-label="' + esc(t().rollResult) + '">' +
    '<button type="button" data-step="1" data-for="' + id + '" aria-label="' + esc(t().stepUp) + '">+</button>' +
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
/* What the badge says is what the filter has to obey. The eleven Wondrous
   entries that are weapons are stored as items, so asking for `it.kind` left
   them on screen after "Equipment" was switched off — badged as weapons. */
function kindOf(it){ return isEquip(it) ? 'equip' : it.kind; }
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
  const here = homeHash();
  const on = here && isHome();
  const home = here
    ? '<button type="button" class="homebtn' + (on ? ' on' : '') + '" data-act="home"' +
      ' title="' + esc(on ? t().isHome : t().setHome) + '"' +
      ' aria-label="' + esc(on ? t().isHome : t().setHome) + '"' +
      ' aria-pressed="' + (on ? 'true' : 'false') + '">' + ICON_HOME + '</button>'
    : '';
  /* The buttons used to live inside the H1, so its accessible name came out as
     "Обычные правила?" — the help mark read as part of the heading. */
  return '<div class="page-head">' +
      '<h1 class="page-h">' + p[0] + '</h1>' + home + btn +
    '</div><p class="page-sub">' + p[1] + '</p>' + box;
}

function pickCards(items, opts){
  return items
    .map((it, i) => [it, (opts && opts[i]) || {}])
    .filter(p => p[0] && kindAllows(kindOf(p[0])))
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
            /* Кнопка броска на сайте выглядит одинаково везде: золотая, с
               костью. Здесь их пять, и все пять - одна и та же кнопка с разным
               числом костей, поэтому выделять первую нечем и незачем: выбирают
               по редкости, а не по порядку. Слово написано один раз, на первой -
               дальше оно понятно по соседству. */
            const rar = x.rar.map(function (r) { return t()[RAR_KEY[r]]; }).join(' / ');
            return '<button type="button" class="btn primary"' +
              ' data-act="roll" data-val="' + x.n + '"' +
              ' title="' + esc(t().roll + ' ' + x.n + 'd12 — ' + rar) + '">' +
              '<span class="dl">' + ICON_DIE + (i === 0 ? esc(t().roll) + ' ' : '') + x.n + 'd12</span>' +
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
  rollBar(pool.filter(it => it && kindAllows(kindOf(it)))) +
  '<div class="results" role="status" aria-live="polite">' + orGrid(pickCards(pool)) + '</div>';
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
  ].filter(p => p[0] && kindAllows(kindOf(p[0])));
  const cards = picks.map(p => cardHTML(p[0], { col: p[1], rollLabel: p[1] === 'hope' ? st.hope : st.fear }));

  const nextRar = RARITIES5[RARITIES5.indexOf(st.rarity) + 1];
  const critBox = crit
    ? '<div class="crit">' +
        '<div class="crit-txt">' +
          '<b>' + esc(t().crit) + '</b>' +
          '<span>' + esc(t().critSub) + '</span>' +
        '</div>' +
        '<div class="crit-acts">' +
          /* На критическом успехе игрок берёт любую позицию этой редкости - и
             из предметов, и из расходников. Одна ссылка вела только в предметы,
             и половина выбора оставалась за кадром. Кнопок столько, сколько
             видов включено: при одном включённом подпись остаётся общей. */
          /* Обе таблицы равноправны: игрок берёт любую позицию этой редкости, и
             выделять предметы перед расходниками нечем. */
          altTables().map(function (a) {
            return '<a class="btn sm" target="_blank" rel="noopener"' +
              ' href="' + esc(tableHref(a[0], st.rarity)) + '">' + esc(a[1]) + ICON_EXT + '</a>';
          }).join('') +
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
  '<div class="results" role="status" aria-live="polite">' + critBox + orGrid(cards) + '</div>';
}

function altTableId(){ return (!S.kind.item && S.kind.consumable) ? 'alt_consumable' : 'alt_item'; }
/* Таблицы, куда ведёт критический успех: по одной на включённый вид. Пока вид
   один, подпись общая - уточнять нечего. */
function altTables(){
  const both = S.kind.item && S.kind.consumable;
  const out = [];
  if (S.kind.item) out.push(['alt_item', both ? t().openItems : t().openTable]);
  if (S.kind.consumable) out.push(['alt_consumable', both ? t().openCons : t().openTable]);
  return out.length ? out : [['alt_item', t().openTable]];
}
/* Absolute so it survives target="_blank"; a bare "#/..." would just re-hash the opener */
function tableHref(table, section){
  return appUrl('#/tables/' + table + (section ? '/' + section : ''));
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
  '<div class="results" role="status" aria-live="polite">' + orGrid([cardHTML(it)]) + '</div>';
}

/* ---- 5b: dread ----
   Устроен как Wondrous: своя книга, свой список, бросок по длине списка. */
function renderDread(){
  const st = S.dread, max = DATA.dread.length;
  const it = DATA.dread[st.n - 1];
  return pageHead('dread') +
  '<div class="panel">' +
    '<div class="field"><span class="lbl">' + esc(t().rollResult) + ' (1\u2013' + max + ')</span>' +
      '<div class="numrow">' + numBox('n', st.n, 1, max) +
        '<button type="button" class="btn primary" data-act="roll">' + ICON_DIE + esc(rollLabel(max)) + '</button>' +
      '</div>' +
    '</div>' +
  '</div>' +
  '<div class="results" role="status" aria-live="polite">' + orGrid([cardHTML(it)]) + '</div>';
}

/* ---- 5c: Vault of Ages ----
   Устроен как «Сообщества»: сначала выбирается раздел, потом бросок внутри
   него. Шесть разделов - четыре ранга плюс артефакты и проклятые предметы,
   ровно как в самой книге. Один общий бросок по всем 108 смешал бы ранг 1 с
   артефактом, а это подарки разного веса. */
function renderVoa(){
  const st = S.voa;
  const list = voaGroup(st.k);
  const max = list.length;
  const it = list[st.n - 1];
  return pageHead('voa') +
  '<div class="panel">' +
    '<div class="field"><span class="lbl">' + esc(t().voaSection) + '</span>' +
      '<div class="chips">' + VOA_TIERS.map(k =>
        '<button type="button" class="chip' + (String(k) === String(st.k) ? ' on' : '') + '"' +
        ' data-act="voa" data-val="' + k + '">' + esc(voaTierName(k)) + '</button>').join('') +
      '</div>' +
    '</div>' +
    '<div class="field"><span class="lbl">' + esc(t().rollResult) + ' (1–' + max + ')</span>' +
      '<div class="numrow">' + numBox('n', st.n, 1, max) +
        '<button type="button" class="btn primary" data-act="roll">' + ICON_DIE + esc(rollLabel(max)) + '</button>' +
      '</div>' +
    '</div>' +
  '</div>' +
  '<div class="results" role="status" aria-live="polite">' +
    (it ? orGrid([cardHTML(it)]) : '') + '</div>';
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
  '<div class="results" role="status" aria-live="polite">' + orGrid([cardHTML(it)]) + '</div>';
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

/* ---------- два уровня вместо четырнадцати чипов ----------
   Полоса разделов росла с каждой книгой: четырнадцать чипов занимали на
   телефоне пол-экрана, и первая запись оказывалась ниже сгиба.
   При этом чипы отвечали сразу на два вопроса - из какой книги и что именно, -
   и перемешивали их в одну строку. Теперь сверху книга, под ней её разделы, и
   вторая строка появляется, только когда внутри книги есть из чего выбирать.

   Порядок тот же, что у вкладок наверху: обычные правила, альтернативные
   таблицы, Wondrous, Dread, Vault of Ages, сообщества. Две группы вкладок не
   имеют - снаряжение и фреймы, - и они идут в конце.

   Адреса таблиц не меняются: `#/tables/core_item` - по-прежнему таблица, а не
   пара «книга + раздел». Это чистая перестановка навигации, и ссылки, выданные
   раньше, продолжают открывать то же самое. */
const TABLE_GROUPS = [
  { id:'core',   ru:'Core',            en:'Core',            subs:['core_item','core_consumable'] },
  { id:'hnf',    ru:'Hope & Fear',     en:'Hope & Fear',     subs:['hnf_item','hnf_consumable'] },
  { id:'alt',    ru:'Альт. таблицы',   en:'Alt. tables',     subs:['alt_item','alt_consumable'] },
  { id:'wond',   ru:'Wondrous Loot',   en:'Wondrous Loot',   subs:['wondrous'] },
  { id:'dread',  ru:'Dread GM Toolbox',en:'Dread GM Toolbox',subs:['dread'] },
  { id:'voa',    ru:'Vault of Ages',   en:'Vault of Ages',   subs:['voa'] },
  { id:'comm',   ru:'Сообщества',      en:'Communities',     subs:['community'] },
  { id:'eq',     ru:'Снаряжение',      en:'Equipment',       subs:['eq_weapon','eq_secondary','eq_armor'] },
  { id:'frames', ru:'Фреймы',          en:'Frames',          subs:['frames'] }
];
/* Подпись раздела внутри книги короче названия таблицы: «Core — предметы» под
   заголовком «Core» повторяет книгу дважды. */
const SUB_LABEL = {
  core_item:['Предметы','Items'], core_consumable:['Расходники','Consumables'],
  hnf_item:['Предметы','Items'], hnf_consumable:['Расходники','Consumables'],
  alt_item:['Предметы','Items'], alt_consumable:['Расходники','Consumables'],
  eq_weapon:['Оружие','Weapons'], eq_secondary:['Вторичное','Secondary'], eq_armor:['Броня','Armor']
};
function groupOf(tableId){
  return TABLE_GROUPS.filter(function (g) { return g.subs.indexOf(tableId) >= 0; })[0] || TABLE_GROUPS[0];
}
function tableChipsHTML(cur){
  const g = groupOf(cur);
  const top = '<div class="chips">' + TABLE_GROUPS.map(function (x) {
    return '<a class="chip' + (x.id === g.id ? ' on' : '') + '" href="#/tables/' + x.subs[0] + '">' +
      esc(S.lang === 'ru' ? x.ru : x.en) + '</a>';
  }).join('') + '</div>';
  if (g.subs.length < 2) return top;
  return top + '<div class="chips subchips">' + g.subs.map(function (id) {
    const w = SUB_LABEL[id] || ['', ''];
    return '<a class="chip sm' + (id === cur ? ' on' : '') + '" href="#/tables/' + id + '">' +
      esc(S.lang === 'ru' ? w[0] : w[1]) + '</a>';
  }).join('') + '</div>';
}

/* Какие виды записей вообще есть в таблице - в том порядке, в каком они
   перечислены в KINDS. */
function tableKinds(id){
  const a = DATA[id];
  if (!a) return [];
  const seen = {};
  a.forEach(function (x) { seen[kindOf(x)] = true; });
  return KINDS.filter(function (k) { return seen[k[0]]; });
}

function renderTables(){
  const st = S.tables;
  const chips = tableChipsHTML(st.t);

  let body;
  if (EQ_TABLE[st.t]) {
    body = renderEquipTable(EQ_TABLE[st.t], st);
  } else if (st.t.indexOf('alt_') === 0) {
    /* #8: раньше здесь стояла голая таблица из трёх колонок - номер и два
       названия. Единственное место на сайте, где у записи не было ни описания,
       ни ярлыков, ни галочки. А именно сюда мастер даёт ссылку со словами
       «возьми любое из этой редкости»: чтобы понять, из чего выбираешь,
       приходилось открывать все двадцать четыре по очереди. Теперь строки те же,
       что во всех остальных таблицах, а пара «надежда/страх» разведена по двум
       подзаголовкам - иначе она теряется. */
    const kind = st.t === 'alt_item' ? 'item' : 'consumable';
    const aq = st.q.trim().toLowerCase();
    /* Номер - это результат кости, а не место в отфильтрованном списке: он
       снимается до поиска и едет со строкой. */
    const col = function (r, c) {
      return ALT[kind][r][c].map(function (id, i) { return { it: BY_ID[id], n: i + 1 }; })
                            .filter(function (x) { return !aq || matches(x.it, aq); });
    };
    body = RARITIES5.map(function (r) {
      const cols = [['hope', t().hope], ['fear', t().fear]]
        .map(function (c) { return [c[1], c[0], col(r, c[0])]; })
        .filter(function (c) { return c[2].length; });
      if (!cols.length) return '';
      return '<div class="tsection" id="' + sectionId(r) + '" style="margin-top:20px">' +
        sectionHead(rarityLabel(r), st.t, r) +
        cols.map(function (c) {
          const body = S.tables.view === 'grid'
            ? '<div class="tgrid">' + c[2].map(function (x) { return tileHTML(x.it, x.n); }).join('') + '</div>'
            : '<div class="rows">' + c[2].map(function (x) { return rowHTML(x.it, '', '', x.n); }).join('') + '</div>';
          return '<h4 class="altcol ' + c[1] + '">' + esc(c[0]) + '</h4>' + body;
        }).join('') +
      '</div>';
    }).join('') || '<div class="empty">' + esc(t().nothing) + '</div>';
  } else {
    const pool = DATA[st.t];
    const q = st.q.trim().toLowerCase();
    let list = pool.filter(function (x) { return tblPasses(x, st.t); });
    if (q) list = list.filter(x => matches(x, q));
    const fbar = fBarHTML(st.t, list.length, pool.length);
    if (st.t === 'voa') {
      /* Книга разложена по рангам, а не по таблице броска, и артефакты с
         проклятыми предметами стоят отдельными разделами - так же, как в самих
         томах. Разделов шесть, и по ним же идёт бросок. */
      body = VOA_TIERS.map(k => {
        const sub = list.filter(x => String(x.tier) === String(k));
        if (!sub.length) return '';
        return '<div class="tsection" id="' + sectionId('t' + k) + '" style="margin-top:22px">' +
          sectionHead(voaTierName(k), st.t, 't' + k) + renderList(sub) + '</div>';
      }).join('');
    } else if (st.t === 'frames') {
      /* Разбито по фреймам, как таблица сообществ: снаряжение из кампании имеет
         смысл только рядом со своей, вперемешку оно читается как ошибка. */
      body = FRAME_ORDER.map(f => {
        const sub = list.filter(x => x.frame === f);
        if (!sub.length) return '';
        return '<div class="tsection" id="' + sectionId(f) + '" style="margin-top:22px">' +
          sectionHead(frameName(f), st.t, f) + renderList(sub) + '</div>';
      }).join('');
    } else if (st.t === 'community') {
      body = COMMUNITIES.map(c => {
        const sub = list.filter(x => x.community === c[0]);
        if (!sub.length) return '';
        return '<div class="tsection" id="' + sectionId(c[0]) + '" style="margin-top:22px">' +
          sectionHead(S.lang === 'ru' ? c[1] + ' · ' + c[0] : c[0], st.t, c[0]) +
          renderList(sub) + '</div>';
      }).join('');
    } else {
      body = renderList(list);
    }
    if (!list.length)
      /* Сброс лежит в панели, которая свёрнута и уехала вверх, - без кнопки
         прямо здесь страница читается как пустая без всякой причины. */
      body = '<div class="empty">' + esc(t().nothing) +
        (fChosen(st.t).length
          ? '<button type="button" class="btn sm" data-act="flt" data-val="reset">' +
            esc(t().resetAll) + '</button>'
          : '') + '</div>';
    body = fbar + body;
  }

  /* Альтернативные таблицы были единственным местом без поиска и без выбора
     вида - ровно те две вещи, за которыми на страницу такого размера и
     приходят. Панель теперь общая для всех. */
  const searchBar =
    '<div class="toolbar" style="margin-top:16px">' +
      '<div class="grow"><input type="search" id="tq" value="' + esc(st.q) + '" placeholder="' + esc(t().searchPh) + '"></div>' +
      '<button type="button" class="btn" data-copy-sec="' + esc(st.t) + '" title="' + esc(t().tableLink) + '" aria-label="' + esc(t().tableLink) + '">' +
        ICON_LINK + '<span class="btn-lbl">' + esc(t().tableLink) + '</span></button>' +
      '<div class="seg small" role="group" aria-label="' + esc(t().view) + '">' +
        '<button type="button" data-act="view" data-val="list"' + (st.view === 'list' ? ' class="on"' : '') + '>' + esc(t().viewList) + '</button>' +
        '<button type="button" data-act="view" data-val="grid"' + (st.view === 'grid' ? ' class="on"' : '') + '>' + esc(t().viewGrid) + '</button>' +
      '</div>' +
    '</div>';

  return pageHead('tables') + '<div class="panel tablenav">' + chips + '</div>' +
    searchBar + '<div style="margin-top:6px">' + body + '</div>';
}

/* ---------- equipment tables ----------
   One table per kind of gear, split into the books' tiers.

   A facet holds the values you picked, and an empty facet means "any" — so
   narrowing to one value is one click rather than switching the other five off.
   Values inside a row are an OR, rows are an AND. Nothing is chosen to begin
   with, which is why the chips start neutral instead of all lit: an all-gold
   panel claims seven decisions have been made when none have. */
function eqFacets(kind){
  /* Источников стало семь: снаряжение есть не только в корнике и H&F, и
     пока в фильтре стояли только они, четверть снаряжения нельзя было ни найти,
     ни отсеять - таблица о них просто не знала. */
  const f = [['tier', t().tier, ['1','2','3','4'].map(k => [k, k])],
             ['src',  t().source, EQ_SRC.filter(function (k) {
               return ALL_EQ.some(function (x) { return eqSrcOf(x) === k && x.eq.t === kind; });
             }).map(function (k) { return [k, srcName(k)]; })]];
  if (kind !== 'armor') {
    /* For primary weapons this is the table the book prints them in, and magic
       ones need a Spellcast trait — a class, not a damage type. Secondary
       weapons get no such split in either book, so there the same two values
       are only the damage they deal, and the row says so. */
    f.push(['cls', kind === 'weapon' ? t().eqClass : t().eqDmg,
            ['phy','mag'].map(k => [k, eqWord(EQ_CLS, k)])]);
    f.push(['trait', t().eqTrait, Object.keys(EQ_TRAIT).map(k => [k, eqWord(EQ_TRAIT, k)])]);
    f.push(['range', t().eqRange, Object.keys(EQ_RANGE).map(k => [k, eqWord(EQ_RANGE, k)])]);
    // every secondary weapon in both books is one-handed: nothing to sort by
    if (kind === 'weapon')
      f.push(['burden', t().eqBurden, ['1','2'].map(k => [k, eqWord(EQ_BURDEN, k)])]);
  }
  f.push(['line', t().eqLineF, [['line', eqWord(EQ_LINE, 'line')], ['uniq', eqWord(EQ_LINE, 'uniq')]]]);
  return f;
}
const fPicked = (facet, value) => !!(S.fOn[facet] && S.fOn[facet][value]);
const fAny = facet => !S.fOn[facet] || !Object.keys(S.fOn[facet]).length;
function fHits(facet, value){ return fAny(facet) || fPicked(facet, value); }
/* Everything currently picked, in the order the rows are shown */
function fChosen(tid){
  const out = [];
  tblFacets(tid).forEach(function (f) {
    f[2].forEach(function (o) {
      // a bare number says nothing on its own, so those carry their row's name
      if (fPicked(f[0], o[0])) out.push([f[0], o[0], /^\d+$/.test(o[1]) ? f[1] + ' ' + o[1] : o[1]]);
    });
  });
  return out;
}
/* Reads the facets this table actually offers, so a value carried in from a
   link for a facet this kind does not have cannot empty the page. */
function eqPasses(it, kind){
  const e = it.eq;
  const value = { tier: String(e.tier), src: eqSrcOf(it), line: e.line ? 'line' : 'uniq',
                  cls: e.cls, trait: e.tr, range: e.rg, burden: String(e.bu) };
  return eqFacets(kind).every(function (f) { return fHits(f[0], value[f[0]]); });
}

/* ---------- фасеты обычных таблиц ----------
   Панель снаряжения оказалась единственным местом на сайте, где фильтр умеет
   всё сразу: он свёрнут, показывает выбранное плашками, сбрасывается одной
   кнопкой и отдаётся ссылкой. У остальных таблиц вместо неё стояла голая
   строка чипов над поиском - другой вид, другое место, ничего из перечисленного.
   Теперь строка чипов - это просто фасет с одним значением, а панель одна на
   все таблицы: где фасетов больше, там их больше строк, и только. */
function tblFacets(tid){
  const kind = EQ_TABLE[tid];
  if (kind) return eqFacets(kind);
  const f = [];
  /* Вид отбирают только там, где видов правда несколько: у корника и Hope &
     Fear вид и есть таблица, у сообществ он один. */
  const kinds = tableKinds(tid);
  if (kinds.length > 1)
    f.push(['kind', t().kindF, kinds.map(function (k) { return [k[0], t()[k[1]]]; })]);
  if (tid === 'voa')
    f.push(['tier', t().tier, VOA_TIERS.map(function (k) { return [String(k), voaTierName(k)]; })]);
  if (tid === 'frames')
    f.push(['frame', t().frameF, FRAME_ORDER.map(function (k) { return [k, frameName(k)]; })]);
  if (tid === 'community')
    f.push(['comm', t().commF, COMMUNITIES.map(function (c) {
      return [c[0], S.lang === 'ru' ? c[1] : c[0]];
    })]);
  return f;
}
/* Значение записи в этом фасете - то, с чем сравнивается выбранное */
function facetValue(it, key){
  if (key === 'kind')  return kindOf(it);
  if (key === 'tier')  return String(it.tier);
  if (key === 'frame') return it.frame;
  if (key === 'comm')  return it.community;
  return '';
}
function tblPasses(it, tid){
  return tblFacets(tid).every(function (f) { return fHits(f[0], facetValue(it, f[0])); });
}

/* Folded by default, so what is chosen has to be readable without opening it:
   each pick is its own chip and takes one click to undo. Dropping everything
   and handing the state out as a link belong to the same strip — they are the
   rest of "what is filtered right now", and inside the panel they could only be
   reached by unfolding it again. Neither appears while nothing is picked. */
function fBarHTML(tid, shown, total){
  const chosen = fChosen(tid);
  if (!tblFacets(tid).length) return '';
  return '<div class="fbar">' +
      '<button type="button" class="btn sm ftoggle' + (chosen.length ? ' has' : '') + '"' +
        ' data-act="fOpen" aria-expanded="' + (S.fOpen ? 'true' : 'false') + '">' +
        esc(t().filters) + (chosen.length ? ' (' + chosen.length + ')' : '') +
        '<i class="caret' + (S.fOpen ? ' up' : '') + '"></i></button>' +
      chosen.map(function (c) {
        return '<button type="button" class="fpill" data-act="flt"' +
          ' data-val="' + esc(c[0] + ':' + c[1]) + '"' +
          ' title="' + esc(t().dropValue) + '">' + esc(c[2]) + '<i>&times;</i></button>';
      }).join('') +
      (chosen.length
        ? '<button type="button" class="fclear" data-act="flt" data-val="reset">' +
            esc(t().resetAll) + '</button>' +
          '<button type="button" class="flink" data-act="fLink"' +
            ' title="' + esc(t().filterLink) + '" aria-label="' + esc(t().filterLink) + '">' +
            ICON_LINK + '</button>'
        : '') +
      '<span class="fcount">' +
        esc(chosen.length ? shown + ' ' + t().outOf + ' ' + total : String(total)) +
      '</span>' +
    '</div>' + (S.fOpen ? fPanelHTML(tid) : '');
}
function fPanelHTML(tid){
  return '<div class="panel ffilter">' + tblFacets(tid).map(function (f) {
    const any = fAny(f[0]);
    /* an untouched row says so, so that neutral chips do not read as "nothing
       matches" — they mean the row is not narrowing anything yet */
    return '<div class="field"><span class="lbl">' + esc(f[1]) +
      (any ? ' <i>' + esc(t().anyValue) + '</i>' : '') + '</span><div class="chips">' +
      f[2].map(function (o) {
        const on = fPicked(f[0], o[0]);
        return '<button type="button" class="chip' + (on ? ' on' : '') + '"' +
          ' data-act="flt" data-val="' + esc(f[0] + ':' + o[0]) + '"' +
          ' aria-pressed="' + (on ? 'true' : 'false') + '">' + esc(o[1]) + '</button>';
      }).join('') + '</div></div>';
  }).join('') + '</div>';
}

/* ---- the filter state as a piece of the address ----
   "f_" then one group per facet listing what is picked there. Nothing is picked
   in a fresh table, so a plain table link stays plain.

   Groups are divided by a dot rather than the underscore this started with:
   `beast_feast` is a value, and the old separator cut it in half, so a link to
   one campaign frame arrived as a filter on a frame named "beast". Links made
   before that are still read - a segment without a dot goes through the old
   splitter, which was right for every value that has no underscore in it. */
function fEncode(tid){
  const parts = tblFacets(tid).map(function (f) {
    const on = f[2].filter(function (o) { return fPicked(f[0], o[0]); }).map(o => o[0]);
    return on.length ? f[0] + '-' + on.join('-') : '';
  }).filter(Boolean);
  return parts.length ? 'f_' + parts.join('.') : '';
}
function fDecode(seg){
  S.fOn = {};
  if (!seg || seg.indexOf('f_') !== 0) return;
  const body = seg.slice(2);
  /* Старый разделитель читается только там, где он ещё может быть верным: без
     точки и когда каждый кусок сам похож на группу. `frame-beast_feast` этой
     проверки не проходит - и хорошо, это новая ссылка. */
  const legacy = body.indexOf('.') < 0 &&
                 body.split('_').every(function (g) { return g.indexOf('-') > 0; });
  (legacy ? body.split('_') : body.split('.')).forEach(function (g) {
    const p = g.split('-'), facet = p.shift();
    if (!facet || !p.length) return;
    S.fOn[facet] = {};
    p.forEach(function (v) { S.fOn[facet][v] = true; });
  });
}

function renderEquipTable(kind, st){
  const q = st.q.trim().toLowerCase();
  const pool = ALL_EQ.filter(function (it) { return it.eq.t === kind; });
  const list = pool.filter(function (it) {
    return eqPasses(it, kind) && (!q || matches(it, q));
  });
  const head = fBarHTML(st.t, list.length, pool.length);
  if (!list.length)
    /* The reset lives at the top of a panel that is folded and scrolled away by
       now, so from here the page reads as empty with no visible cause. */
    return head + '<div class="empty">' + esc(t().nothing) +
      (fChosen(st.t).length
        ? '<button type="button" class="btn sm" data-act="flt" data-val="reset">' +
          esc(t().resetAll) + '</button>'
        : '') + '</div>';
  const groups = [1, 2, 3, 4].map(function (n) {
    return ['t' + n, t().tier + ' ' + n, list.filter(function (it) { return it.eq.tier === n; })];
  });
  return head + groups.map(function (g) {
    if (!g[2].length) return '';
    return '<div class="tsection" id="' + sectionId(g[0]) + '" style="margin-top:22px">' +
      sectionHead(g[1], st.t, g[0]) +
      renderList(g[2]) + '</div>';
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
/* num переопределяет номер в строке: в альтернативных таблицах он свой, 1-12 по
   кости, а не тот, под которым запись стоит в собственной таблице книги. */
function rowHTML(it, removeFrom, tail, num){
  if (typeof removeFrom !== 'string') removeFrom = '';
  const n = num || it.roll;
  return '<div class="row' + (!removeFrom && S.sel[it.id] ? ' sel' : '') + '" data-row="' + esc(it.id) + '">' +
      (removeFrom ? '' : selBox(it.id)) +
      '<button type="button" class="row-main" data-open="' + esc(it.id) + '">' +
        imgTag(it, 'row') +
        '<span class="rt"><b>' + (n ? '<span class="rnum">' + esc(n) + '</span>' : '') +
          esc(nameOf(it)) +
          (tail ? '<i class="rtail">' + esc(tail) + '</i>' : '') + '</b>' +
        (isEquip(it) ? '<span class="rstats ' + eqClass(it) + '">' + esc(eqLine(it, true)) + '</span>' : '') +
        (descOf(it) ? '<span>' + descHtml(it, true) + '</span>' : '') + rowCraft(it) + '</span>' +
        '<span class="rm">' + kindBadge(it) + uniqBadge(it) + tierBadge(it) +
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

function tileHTML(it, num){
  const sub = S.lang === 'ru' ? it.en : (it.ru || '');
  const n = num || it.roll;
  return '<div class="tilewrap' + (S.sel[it.id] ? ' sel' : '') + '" data-row="' + esc(it.id) + '">' + selBox(it.id) +
    '<button type="button" class="tile" data-open="' + esc(it.id) + '">' +
    '<div class="tile-img">' +
      (n ? '<span class="tile-n">' + esc(n) + '</span>'
         : (tileTier(it) ? '<span class="tile-n">' + esc(tileTier(it)) + '</span>' : '')) +
      '<span class="tile-k ' + (isEquip(it) ? eqClass(it) : it.kind === 'consumable' ? 'cons' : 'item') +
        '" title="' + esc(isEquip(it) ? eqWord(EQ_TYPE, it.eq.t) : it.kind === 'consumable' ? t().cons : t().item) + '"></span>' +
      imgTag(it, 'tile') +
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
    const res = SEARCHABLE.filter(x => kindAllows(kindOf(x)) && matches(x, q)).slice(0, 300);
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
  /* The headline is the part that has to be read; the rest is there when it is
     wanted. Unfolded it ran to 551px on a 320px phone, above the list itself. */
  /* The cross lives inside the summary: a closed <details> hides everything
     else, which would leave nothing to dismiss it with. */
  return '<details class="warn"><summary>' +
      '<b>' + esc(t().localOnlyTitle) + '</b><i>' + esc(t().readMore) + '</i>' +
      '<button type="button" class="warn-x" data-act="hideWarn"' +
        ' title="' + esc(t().dismiss) + '" aria-label="' + esc(t().dismiss) + '">&times;</button>' +
    '</summary><p>' + esc(t().localOnly) + '</p></details>';
}

function listCardHTML(l){
  const items = listItems(l);
  const thumbs = items.slice(0, 6).map(function (it) {
    return imgTag(it, 'thumb');
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

/* #15: показывается, только когда в списке есть хоть одна цена - пустой список
   ни о каких мешках не спрашивает. Выбранный режим едет вместе со ссылкой. */
function moneyPickerHTML(l){
  if (!l.ids.some(function (id) { return itemMeta(l, id).gold > 0; })) return '';
  const cur = moneyMode(l);
  /* Пример «750 → 7 мешков 5 горстей» объяснял только половину: откуда взялись
     мешки, из чего они складываются и почему в поле всё равно вводят монеты -
     не сказано нигде, а монеты тут вообще опциональное правило. Поэтому вместо
     примера вопросительный знак, а за ним весь пересчёт. */
  return '<div class="money"><span class="money-l">' + esc(t().moneyAs) + '</span>' +
    MONEY_MODES.map(function (m) {
      return '<button type="button" class="chip' + (m === cur ? ' on' : '') + '"' +
        ' data-money="' + esc(l.id) + '" data-val="' + m + '"' +
        (m === cur ? ' aria-current="true"' : '') + '>' +
        esc(t()['money_' + m]) + '</button>';
    }).join('') +
    '<button type="button" class="helpbtn sm' + (S.moneyHelp ? ' on' : '') + '"' +
      ' data-act="moneyHelp" aria-expanded="' + (S.moneyHelp ? 'true' : 'false') + '"' +
      ' title="' + esc(t().whatIsThis) + '" aria-label="' + esc(t().whatIsThis) + '">?</button>' +
    (S.moneyHelp ? '<span class="money-br"></span><p class="money-help">' + t().moneyHelp + '</p>' : '') +
  '</div>';
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
      '<button type="button" class="btn sm" data-share-list="' + esc(l.id) + '">' +
        ICON_LINK + esc(t().sharePlayers) + '</button>' +
      '<button type="button" class="btn sm" data-share-gm="' + esc(l.id) + '">' +
        ICON_LINK + esc(t().shareGm) + '</button>' +
      '<button type="button" class="btn sm" data-copy-listtext="' + esc(l.id) + '">' + ICON_COPY + esc(t().copyText) + '</button>' +
      printBtn(items.map(function (x) { return x.id; }), 'sm') +
      '<button type="button" class="btn sm danger" data-del-list="' + esc(l.id) + '">' + esc(t().del) + '</button>' +
    '</div>' +
    /* Same slot as on the index: under the page header, above the content.
       Between the note and the roll panel it read as a caption for the roll,
       and at the foot it turned up in two different places on two pages that
       are about the same thing. */
    storageWarning() +
    moneyPickerHTML(l) +
    listNoteHTML(l) +
    (items.length > 1 ? listRollPanel(l, items) : '') +
    (items.length
      ? batchBarHTML(l) + '<div class="rows lrows">' +
          items.map(function (it, i) { return listRowHTML(l, it, i); }).join('') +
        '</div>'
      : '<div class="empty">' + esc(t().listEmptyHint) + '</div>');
}

/* roll a position inside the list itself */
function listRollPanel(l, items){
  const hit = (S.listRoll.id === l.id && S.listRoll.n >= 1 && S.listRoll.n <= items.length)
    ? items[S.listRoll.n - 1] : null;
  /* Same shape as every other roll page: a field you can type into for a roll
     made at the table, and a button for when the app should pick. */
  /* #16: поле пустое, пока в него не ввели число. Со значением 1 по умолчанию
     выпавшая на кубике единица была единственным результатом, который некуда
     набрать: поле уже показывает 1, событие не приходит, позиция не выбирается.
     Пустое поле - это ещё и честный ответ на вопрос «бросали уже или нет». */
  const n = (S.listRoll.id === l.id && S.listRoll.n) ? S.listRoll.n : 0;
  /* Свёрнут по умолчанию: список открывают, чтобы читать и править, а бросают
     по нему изредка. Развёрнутая панель занимала первый экран у всех и всегда
     ради того, что делают раз в сессию. Разворачивается сам, когда бросок уже
     сделан - иначе результат оказался бы спрятан за собственной кнопкой. */
  return '<details class="panel lroll" data-keep="roll:' + esc(l.id) + '"' + (hit ? ' open' : '') + '>' +
    '<summary>' + ICON_DIE + '<span>' + esc(t().rollBy) + '</span></summary>' +
    '<div class="field" style="margin-bottom:' + (hit ? '14px' : '0') + '">' +
      '<span class="lbl">' + esc(t().rollResult) + ' (1–' + items.length + ')</span>' +
      '<div class="numrow">' + numBox('n', n, 1, items.length) +
        '<button type="button" class="btn primary" data-act="rollList" data-val="' + esc(l.id) + '">' +
          ICON_DIE + esc(rollLabel(items.length)) + '</button>' +
        (hit ? '<button type="button" class="btn ghost" data-act="clearRoll">' + esc(t().clear) + '</button>' : '') +
      '</div>' +
      (hit ? '' : '<p class="rollhint">' + esc(t().rollHint) + '</p>') +
    '</div>' +
    (hit ? orGrid([cardHTML(hit, { rollLabel: S.listRoll.n })]) : '') +
    /* Whatever the GM wrote about this entry is exactly what they need at the
       moment it comes up — but only on their own screen, never in a copy. */
    (hit ? rolledNoteHTML(l, hit) : '') +
  '</details>';
}

/* Both notes at the moment the entry comes up — this is the GM's own screen,
   so the private one belongs here as much as the other. */
function rolledNoteHTML(l, it){
  const m = itemMeta(l, it.id);
  const one = (icon, label, text) => text
    ? '<div class="hitnote">' + icon + '<span><b>' + esc(label) + '</b>' + lines(text) + '</span></div>'
    : '';
  return one(ICON_EYE, t().notePub, m.note) + one(ICON_EYE_OFF, t().noteHid, m.hnote);
}


function listRowHTML(l, it, i){
  const m = itemMeta(l, it.id);
  const key = l.id + ':' + it.id;
  /* The box is always in the DOM so opening it needs no re-render — typing in a
     note must not rebuild the page under the cursor. It only shows when there
     is something in it, or when the button is pressed. */
  const hasNote = !!(m.note || m.hnote);
  const noteBox = '<div class="rnote" data-keep="rnote:' + esc(key) + '"' + (hasNote ? '' : ' hidden') + '>' +
      notePairHTML(function (kind) {
        return 'data-note="' + esc(key) + '" data-nkind="' + kind + '"';
      }, m) +
    '</div>';
  return '<div class="row lrow' + (hasNote ? ' has-note' : '') + '">' +
      '<span class="lrow-grip" draggable="true" data-drag="' + esc(key) + '"' +
        ' title="' + esc(t().dragHint) + '" aria-hidden="true">' + ICON_GRIP + '</span>' +
      /* the position doubles as the keyboard way to reorder: type 20 and the
         entry lands at 20, no matter how far away it started */
      '<label class="lrow-pick"><input type="checkbox" data-lsel="' + esc(it.id) + '"' +
        (S.lsel[it.id] ? ' checked' : '') + ' aria-label="' + esc(t().pickRow) + '"></label>' +
      '<input type="number" class="lrow-n" min="1" max="' + l.ids.length + '"' +
        ' inputmode="numeric" value="' + (i + 1) + '" data-pos="' + esc(key) + '"' +
        ' aria-label="' + esc(t().position) + '">' +
      '<button type="button" class="row-main" data-open="' + esc(it.id) + '">' +
        imgTag(it, 'row') +
        '<span class="rt"><b>' + esc(nameOf(it)) + '</b>' +
        (isEquip(it) ? '<span class="rstats ' + eqClass(it) + '">' + esc(eqLine(it, true)) + '</span>' : '') +
        (descOf(it) ? '<span>' + descHtml(it, true) + '</span>' : '') + rowCraft(it) + '</span>' +
        /* the same badges every other listing shows — without them a list is the
           one place you cannot tell an item from a weapon at a glance */
        '<span class="rm">' + kindBadge(it) + uniqBadge(it) + tierBadge(it) +
        '<span class="badge src">' + esc(srcLabel(it)) + '</span></span>' +
      '</button>' +
      '<div class="lrow-meta">' +
        '<label><span>' + esc(t().qty) + '</span>' +
          '<input type="number" min="1" max="99" inputmode="numeric" data-qty="' + esc(l.id + ':' + it.id) + '" value="' + (m.qty || '') + '" placeholder="1"></label>' +
        /* Поле остаётся монетами - править мешки цифрами нельзя. Как их
           прочитают игроки, показывает подсказка на самом поле: отдельная
           строка рядом занимала место в каждой строке списка, а нужна она
           ровно в тот момент, когда на цену смотрят (#15). */
        '<label><span>' + esc(t().gold) + goldHintHTML(l, m.gold) + '</span>' +
          '<input type="number" min="0" max="99999" inputmode="numeric" data-gold="' + esc(l.id + ':' + it.id) + '"' +
          ' value="' + (m.gold || '') + '" placeholder="—"' + goldTitle(l, m.gold) + '></label>' +
      '</div>' +
      '<div class="lrow-acts">' +
        '<button type="button" class="lrow-note' + (hasNote ? ' on' : '') + '" data-note-toggle="' + esc(key) + '"' +
          ' title="' + esc(t().note) + '" aria-label="' + esc(t().note) + '">' + ICON_NOTE + '</button>' +
        '<button type="button" class="row-x" data-remove="' + esc(l.id + ':' + it.id) + '" title="' + esc(t().removeItem) + '" aria-label="' + esc(t().removeItem) + '">&times;</button>' +
      '</div>' +
      noteBox +
    '</div>';
}

/* The list-level note: shop rules, homebrew, whatever the GM keeps out of the
   item text. Folded away when empty so a list without notes looks as before. */
function listNoteHTML(l){
  return '<details class="lnote" data-keep="note:' + esc(l.id) + '"' + ((l.note || l.hnote) ? ' open' : '') + '>' +
    '<summary>' + ICON_NOTE + '<span>' + esc(t().listNote) + '</span></summary>' +
    notePairHTML(function (kind) {
      return 'data-list-note="' + esc(l.id) + '" data-nkind="' + kind + '"';
    }, l, { phPub: t().listNotePhPub, phHid: t().listNotePhHid }) +
  '</details>';
}

/* ---------- notes ----------
   A GM writes two different things: what the table is told, and what only they
   know. One box with a "show this too" tick made the second kind the default
   and the first an afterthought, and left "is this note secret" answerable only
   by hunting for a checkbox. Two labelled boxes say it outright, and the same
   markup serves the list and every entry in it. */
function notePairHTML(attr, o, opt){
  o = o || {}; opt = opt || {};
  const field = (kind, icon, label, hint, value, ph) =>
    '<div class="nfield n-' + kind + '">' +
      '<span class="nlbl">' + icon + esc(label) +
        (hint ? '<i>' + esc(hint) + '</i>' : '') +
        /* Очистить поле мышью было нечем: только выделить всё и стереть.
           Виден крестик, только когда в поле что-то есть - :placeholder-shown
           у пустого поля прячет его без перерисовки. */
        '<button type="button" class="note-x" data-note-clear' +
          ' title="' + esc(t().noteClear) + '" aria-label="' + esc(t().noteClear) + '">&times;</button>' +
      '</span>' +
      '<textarea rows="' + (opt.rows || 3) + '" ' + attr(kind) +
        ' placeholder="' + esc(ph) + '">' + esc(value || '') + '</textarea>' +
    '</div>';
  return '<div class="npair">' +
    field('pub', ICON_EYE, t().notePub, t().notePubHint, o.note, opt.phPub || t().notePhPub) +
    field('hid', ICON_EYE_OFF, t().noteHid, t().noteHidHint, o.hnote, opt.phHid || t().notePhHid) +
  '</div>';
}

function renderSharedList(payload){
  const data = decodeList(payload);
  if (!data) {
    return '<h1 class="page-h">' + esc(t().notFound) + '</h1>' +
      '<p class="page-sub">' + esc(t().badShare) + '</p>' +
      '<a class="btn primary" href="#/roll/std">' + esc(t().toStart) + '</a>';
  }
  const items = data.ids.map(function (id) { return BY_ID[id]; });
  const fake = { id: '', name: data.name, ids: data.ids, meta: data.meta, money: data.money };
  // читается обработчиком «забрать в свой список»: разбирать payload заново незачем
  S.shared = { ids: data.ids, meta: data.meta || {}, name: data.name,
               note: data.note, hnote: data.hnote };
  /* A note written for the party is half the message — showing only the entries
     drops it on the floor. The GM's own note is shown too when the link is the
     GM's own backup; a players' link simply does not carry one. */
  const shown = (icon, label, text) => text
    ? '<div class="hitnote">' + icon + '<span><b>' + esc(label) + '</b>' + lines(text) + '</span></div>'
    : '';
  const head = shown(ICON_EYE, t().notePub, data.note) + shown(ICON_EYE_OFF, t().noteHid, data.hnote);
  return '<h1 class="page-h">' + esc(data.name || t().untitled) + '</h1>' +
    '<p class="page-sub">' + esc(t().sharedList) + ' · ' + esc(items.length + ' ' + plural(items.length)) + '</p>' +
    /* Один вход вместо двух. «Сохранить себе» и «Добавить в список → новый»
       делали одно и то же разными словами; здесь выбор списка, а «+ Новый
       список» и есть прежнее «сохранить себе»: он забирает и имя, и заметки. */
    '<div class="card-acts" style="margin-bottom:18px">' +
      addToListBtn(N_SHARED, data.ids, true) +
    '</div>' +
    (head ? '<div style="margin-bottom:18px">' + head + '</div>' : '') +
    '<div class="rows">' + items.map(function (it) {
      const m = itemMeta(fake, it.id);
      const bits = [];
      if (m.qty > 1) bits.push('×' + m.qty);
      if (m.gold) bits.push(priceText(m.gold, moneyMode(fake)));
      return rowHTML(it, '', bits.join(' · ')) +
        shown(ICON_EYE, t().notePub, m.note) + shown(ICON_EYE_OFF, t().noteHid, m.hnote);
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
  /* Vault of Ages стоит перед проверкой на снаряжение: 24 его единицы живут в
     своей таблице, а не в общей по видам оружия - иначе ссылка «наверх, к
     таблице» с карточки уводила бы в чужой раздел. */
  if (it.src === 'voa') return 'voa';
  if (isEquip(it) && !it.roll)
    return { weapon:'eq_weapon', secondary:'eq_secondary', armor:'eq_armor' }[it.eq.t];
  if (it.src === 'wondrous') return 'wondrous';
  if (it.src === 'dread') return 'dread';
  if (it.src === 'frame') return 'frames';
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
  /* Подзаголовок читается как путь по навигации: книга, потом её раздел. Плоское
     имя таблицы («H&F — предметы») повторяло книгу внутри себя и расходилось с
     тем, что написано на чипах. */
  const tid = tableIdOf(it);
  const grp = groupOf(tid);
  const sub = SUB_LABEL[tid];
  const where = it.src === 'community'
    ? (S.lang === 'ru' ? it.community_ru + ' · ' + it.community : it.community)
    : (S.lang === 'ru' ? grp.ru : grp.en) + (sub ? ' · ' + (S.lang === 'ru' ? sub[0] : sub[1]) : '');
  /* Ссылка ведёт прямо на строку этой вещи, а не на раздел: «открыть таблицу» и
     потом искать её глазами среди сотни - это не ответ на вопрос «где она». */
  const back = tableHref(tid, it.id);
  return '<h1 class="page-h">' + esc(nameOf(it)) + '</h1>' +
    '<p class="page-sub">' + esc(where +
        (it.tier === 'A' || it.tier === 'C' ? ' · ' + voaTierOne(it.tier) : '') +
        (it.roll ? ' · ' + t().rollNo + ' ' + it.roll
         : isEquip(it) && it.eq.tier ? ' · ' + t().tier + ' ' + it.eq.tier : '')) +
      ' <a class="itemtable" href="' + esc(back) + '">' + esc(t().showInTable) + ICON_EXT + '</a></p>' +
    '<div class="itempage">' + cardHTML(it, { full: true }) + '</div>' +
    '<div class="card-acts" style="margin-top:16px">' + printBtn([it.id], 'sm') + '</div>';
}

/* ============================================================
   PRINT (#20)
   ============================================================
   Карточки для стола: девять штук на A4, 63x88 мм - размер игральной карты, под
   который продаются протекторы и режется картон. Печать одинаково нужна и с
   карточки одной вещи, и со списка, и из выделения в таблице, поэтому это не
   кнопка на странице, а свой адрес: `#/print/<id>-<id>-...`. Такой адрес можно
   отдать другому мастеру, а страница печати не зависит от того, откуда пришли.

   Карта светлая, а не как сайт. Тёмный фон с золотом хорошо смотрится на экране
   и плохо на бумаге: он съедает картридж и на чёрно-белом принтере превращается
   в серую кашу, из которой не читается текст. Поэтому лист белый, рамка тонкая,
   а всё, что на экране различается цветом, на карте различается ещё и словом. */
const PRINT_MAX = 54;   // шесть листов - дальше браузер начинает думать минутами

function printIds(seg){
  return (seg || '').split('-').filter(Boolean)
    .filter(function (id, i, a) { return BY_ID[id] && a.indexOf(id) === i; })
    .slice(0, PRINT_MAX);
}
function printHref(ids){ return '#/print/' + ids.join('-'); }

/* Кнопка печати выглядит одинаково везде, откуда печатают */
function printBtn(ids, cls){
  if (!ids.length) return '';
  return '<a class="btn' + (cls ? ' ' + cls : '') + '" href="' + esc(printHref(ids)) + '"' +
    ' title="' + esc(t().printHint) + '">' + ICON_PRINT + esc(t().print) + '</a>';
}

/* ---------- детали карты ----------
   Лента ранга, ладони хвата, кость и рамка вокруг полосы характеристик - это
   выгруженные из макета векторы, а не нарисованные заново: у них свои градиенты
   и своя штриховка, повторить которые на глаз нельзя. Лежат отдельными файлами
   в `card/`, потому что рамка одна весит два килобайта, и держать её строкой в
   коде было бы неудобно читать. Открываются и с file://, как всё остальное. */
const CARD_ART = 'card/';
/* Знак вида вещи: карта без картинки не должна выглядеть пустой сверху */
const PRINT_GLYPH = {
  weapon:    '<path d="M24 1 L29 12 V30 H19 V12 Z M9 32 H39 V36 H9 Z M21 36 H27 V44 H21 Z' +
             ' M24 41 A4 4 0 1 0 24 49 A4 4 0 1 0 24 41 Z"/>',
  secondary: '<path d="M24 3 L28 14 V25 H20 V14 Z M13 27 H35 V30 H13 Z M21 30 H27 V45 H21 Z"/>',
  armor:     '<path d="M24 3 L42 10 V26 C42 36 34 43 24 47 C14 43 6 36 6 26 V10 Z"/>',
  item:      '<path d="M24 2 L41 18 L24 48 L7 18 Z"/>',
  cons:      '<path d="M18 4 H30 V14 L38 30 V42 A4 4 0 0 1 34 46 H14 A4 4 0 0 1 10 42 V30 L18 14 Z"/>'
};
function printGlyph(kindKey){
  return '<svg class="pc-glyph" viewBox="0 0 48 50" aria-hidden="true">' +
    (PRINT_GLYPH[kindKey] || PRINT_GLYPH.item) + '</svg>';
}
/* У каждой кости в макете своя форма: d4 - треугольник, дальше многоугольники
   со своими гранями. Формы взяты из компонентов макета, цвет - из типа урона.
   Кость, которой в наборе нет, рисуется общим шестиугольником обрезкой: это
   заметно хуже, чем своя форма, но лучше пустого места. */
const DIE_ART = { d4: 1, d6: 1, d8: 1, d10: 1, d12: 1, d20: 1 };

/* Клетка полосы характеристик: подпись сверху, значение снизу */
function statBox(label, value){
  return '<span class="pc-box"><small>' + esc(label) + '</small><b>' + esc(value) + '</b></span>';
}
/* Файл детали. Чёрно-белый режим берёт те же формы, но с белой заливкой и
   тёмным контуром вместо золота: на монохромном принтере градиент - серое
   пятно, а контур остаётся контуром. */
function cardArt(name){
  /* В чёрно-белом у костей нет деления на физический и магический: цвет и был
     единственным, чем они отличались. */
  if (S.printBW) name = name.replace(/-(phy|mag)$/, '');
  return CARD_ART + name + (S.printBW ? '-bw' : '') + '.svg';
}

/* Полоса урона у оружия: кость, бонус и три клетки. У «Универсального» таких
   полос две - книга даёт второй набор характеристик прямо в свойстве, и на
   карте он должен стоять полосой, а не строчкой прозы, как в книге. */
function dmgStripHTML(e){
  const m = /^(d\d+)(.*)$/.exec(e.dmg || '');
  return '<div class="pc-strip"><img class="pc-ribbon" src="' + cardArt('ribbon') + '" alt="">' +
    '<div class="pc-cells">' +
      dieHTML(m ? m[1] : (e.dmg || ''), e.dt) +
      (m && m[2] ? '<span class="pc-bonus">' + esc(m[2]) + '</span>' : '') +
      statBox(t().pcDmg, eqWord(EQ_DT, e.dt) || '—') +
      statBox(t().pcTrait, eqWord(EQ_TRAIT, e.tr)) +
      statBox(t().pcRange, eqWord(EQ_RANGE, e.rg)) +
    '</div></div>';
}
/* Кость урона. Форма своя у каждой кости, а цвет - у типа урона: физический
   золотой, магический сине-фиолетовый, как в макете. Где формы нет, рисуется
   общий шестиугольник обрезкой, и цвет тогда тоже общий. */
function dieHTML(die, dt){
  const own = DIE_ART[die];
  const mag = dt === 'mag';
  return '<span class="pc-die' + (own ? ' own' : '') + (mag ? ' mag' : '') +
    '" data-die="' + esc(die) + '">' +
    (own ? '<img src="' + cardArt('die-' + die + '-' + (mag ? 'mag' : 'phy')) + '" alt="">' : '') +
    '<b>' + esc(die) + '</b></span>';
}

/* Полоса брони: три подписи и два порога в тёмных клетках между ними - шкала
   читается слева направо, от лёгкого урона к тяжёлому. */
function thStripHTML(e){
  const th = e.th || ['—', '—'];
  const lab = function (word, dots) {
    return '<span class="pc-th-lab"><img src="' + CARD_ART + 'dots' + dots + '.svg" alt="">' +
      '<small>' + esc(word) + '</small></span>';
  };
  const box = function (v) {
    return '<span class="pc-th-box"><img src="' + cardArt('thbox') + '" alt="">' +
      '<b>' + esc(String(v)) + '</b></span>' +
      '<img class="pc-th-arrow" src="' + CARD_ART + 'arrow.svg" alt="">';
  };
  return '<div class="pc-thstrip">' +
    '<img class="pc-ribbon" src="' + CARD_ART + 'thframe.svg" alt="">' +
    '<div class="pc-cells">' +
      lab(t().thLight, 1) + box(th[0]) + lab(t().thMajor, 2) + box(th[1]) + lab(t().thSevere, 3) +
    '</div></div>';
}

/* Одна карта - по макету печатной карты снаряжения.

   Разметка идёт сверху вниз ровно как там: квадрат картинки во всю ширину,
   лента ранга слева от него, справа хват у оружия или щит с Показателем Брони
   у брони, а ниже белый блок с мягким переходом поверх картинки. В блоке - пара
   плашек, имя прописными, полоса характеристик в рамке, текст правила и подпись
   с книгой.

   Цепочка улучшений и ссылки на другие карты сюда не едут: карта уезжает на
   стол к игроку, а «крафтится из» и «см. такую-то карту» - это разговор с
   мастером за экраном, и на 63 мм ширины он вытесняет само правило. */
function printCardHTML(it){
  const eq = isEquip(it) ? it.eq : null;
  const kindKey = eq ? eq.t : (it.kind === 'consumable' ? 'cons' : 'item');
  const kind = eq ? eqWord(EQ_TYPE, eq.t)
                  : (it.kind === 'consumable' ? t().cons : t().item);
  const artifact = (it.tier === 'A' || it.tier === 'C') && !eq;
  const tag1 = artifact ? voaTierOne(it.tier) : kind;
  const tag2 = eq && eq.sub ? eq.sub[S.lang === 'ru' ? 0 : 1]
             : eq && eq.t === 'weapon' && eq.cls ? eqWord(EQ_CLS, eq.cls)
             : '';
  const tier = eq && eq.tier ? String(eq.tier)
             : (typeof it.tier === 'number' ? String(it.tier) : '');
  const armor = !!(eq && eq.t === 'armor');
  const burden = eq && !armor && eq.bu ? eq.bu : 0;
  const strip = armor ? thStripHTML(eq)
              : eq ? dmgStripHTML(eq) + (eq.alt ? dmgStripHTML(eq.alt) : '')
              : '';
  /* Лента ранга и правый знак - ладони хвата у оружия, щит с Показателем
     Брони у брони. В цветном режиме они лежат поверх картинки по углам, в
     чёрно-белом картинки нет, и в макете они собраны в строку над именем
     вместе с плашкой вида. Поэтому разметка тут ветвится: это две разные
     карты, а не одна с выключенной картинкой. */
  const banner = tier
    ? '<span class="pc-tier"><img src="' + cardArt('banner') + '" alt="">' +
      '<b>' + esc(tier) + '</b><i>' + esc(t().tier) + '</i></span>'
    : '';
  const mark = armor && eq.as != null
    ? '<span class="pc-shield"><img src="' + cardArt('shield') + '" alt="">' +
      '<b>' + esc(String(eq.as)) + '</b><i>' + esc(t().pcArmor) + '</i></span>'
    : burden
    ? '<span class="pc-burden"><small>' + esc(t().eqBurden) + '</small>' +
      '<img src="' + cardArt(burden > 1 ? 'hand-used' : 'hand-free') + '" alt="">' +
      '<img src="' + cardArt('hand-used') + '" alt=""></span>'
    : '';
  const tags = '<div class="pc-tags"><span class="pc-tag on">' + esc(tag1) + '</span>' +
    (tag2 ? '<span class="pc-tag out">' + esc(tag2) + '</span>' : '') + '</div>';
  return '<article class="pcard ' + eqClassFor(it) + (S.printBW ? ' bw' : '') +
      '" data-pid="' + esc(it.id) + '">' +
    (S.printBW ? '' :
      '<div class="pc-art">' +
        (hasImage(it) ? '<img class="pc-img" src="' + esc(imgSrc(it)) + '" alt="">'
                      : printGlyph(kindKey)) +
      '</div>' + banner + mark) +
    '<div class="pc-content">' +
      (S.printBW ? '<div class="pc-head">' + banner + tags + mark + '</div>' : tags) +
      '<h3 class="pc-name">' + esc(nameOf(it)) + '</h3>' +
      strip +
      '<div class="pc-text">' + (descOf(it) ? descHtml(it) : '') + '</div>' +
      '<div class="pc-bottom"><span>Daggerheart</span><span>' + esc(srcLabel(it)) + '</span></div>' +
    '</div>' +
  '</article>';
}
/* Вид вещи цветом: у снаряжения он свой на каждый из трёх видов, у добычи -
   предмет или расходник. На чёрно-белом принтере все они печатаются серым
   разной плотности, поэтому цвет тут украшение, а вид назван словом на плашке. */
function eqClassFor(it){
  return isEquip(it) ? 'pk-' + it.eq.t : 'pk-' + (it.kind === 'consumable' ? 'cons' : 'item');
}

/* Описания разной длины: у одних три строки, у других двенадцать, а место на
   карте одно. Шрифт уменьшается шагами, пока текст не влезет; ниже 5.6 пункта
   читать на бумаге уже неприятно, и там лучше обрезать, чем печатать то, что
   всё равно не прочтут. Считать это можно только после отрисовки - высоту знает
   браузер, а не мы. */
function fitPrintCards(){
  const list = document.querySelectorAll('.pcard');
  for (let i = 0; i < list.length; i++) {
    const card = list[i], el = card.querySelector('.pc-text'),
          art = card.querySelector('.pc-art'), box = card.querySelector('.pc-content');
    /* Полоса характеристик - самое тесное место карты: кость, бонус и три
       значения на 88% ширины. «Очень далеко» рядом с «+7» уже не помещается,
       и значение молча обрезалось многоточием. Шрифт полосы садится, пока всё
       не встанет целиком - подписи над значениями при этом не трогаются. */
    const cells = card.querySelectorAll('.pc-strip .pc-cells');
    for (let c = 0; c < cells.length; c++) {
      const vals = cells[c].querySelectorAll('.pc-box b');
      /* Ширина меряется диапазоном, а не scrollWidth: при `text-overflow`
         обрезанный текст рапортует ту же ширину, что и коробка, и переполнение
         так не увидеть. */
      const rng = document.createRange();
      const over = function () {
        for (let v = 0; v < vals.length; v++) {
          rng.selectNodeContents(vals[v]);
          /* Запас в два пикселя: на бумаге шрифт растрируется иначе, чем на
             экране, и подогнанное «впритык» значение всё равно уезжало в
             многоточие. */
          if (rng.getBoundingClientRect().width > vals[v].clientWidth - 2) return true;
        }
        return false;
      };
      let sz = 3;
      vals.forEach(function (v) { v.style.fontSize = ''; });
      while (over() && sz > 2.2) {
        sz -= 0.1;
        vals.forEach(function (v) { v.style.fontSize = sz.toFixed(1) + 'cqw'; });
      }
    }
    if (!el) continue;
    el.style.fontSize = '';
    if (box) box.style.paddingTop = '';
    const tight = function () { return el.scrollHeight > el.clientHeight + 1; };
    /* Сначала шрифт до предела читаемости, потом - отступ сверху: у карты с
       длинным правилом картинка и должна быть меньше, но исчезать совсем ей
       нельзя, иначе от карты остаётся лист бумаги с текстом. */
    let pct = 3.5;
    while (tight() && pct > 3) { pct -= 0.1; el.style.fontSize = pct.toFixed(1) + 'cqw'; }
    let pad = S.printBW ? 5.8 : 23;
    while (tight() && pad > (S.printBW ? 3 : 8)) {
      pad -= 1.5;
      if (box) box.style.paddingTop = pad + 'cqw';
      /* Картинка садится вместе с отступом: иначе она остаётся на прежней
         высоте и оказывается фоном под именем. */
      if (art) art.style.height = Math.max(0, pad + 52) + 'cqw';
    }
    while (tight() && pct > 2.6) { pct -= 0.1; el.style.fontSize = pct.toFixed(1) + 'cqw'; }
    /* Обрезок картинки под лентой читается как брак печати - лучше без неё */
    if (art) art.style.display = pad < 16 ? 'none' : '';
  }
}

function renderPrint(){
  const ids = printIds(S.printIds);
  if (!ids.length)
    return '<h1 class="page-h">' + esc(t().printTitle) + '</h1>' +
      '<p class="page-sub">' + esc(t().printEmpty) + '</p>' +
      '<a class="btn primary" href="#/lists">' + esc(t().lists) + '</a>';
  const items = ids.map(function (id) { return BY_ID[id]; });
  /* Пустые места до девяти: без них последняя карта на листе съезжает к краю, а
     резать проще по полной сетке. */
  const pad = (9 - items.length % 9) % 9;
  const pages = [];
  for (let i = 0; i < items.length; i += 9) pages.push(items.slice(i, i + 9));
  return '<div class="printbar noprint">' +
      '<h1 class="page-h">' + esc(t().printTitle) + '</h1>' +
      '<p class="page-sub">' + esc(t().printSub.replace('%n', String(items.length))
                                    .replace('%p', String(Math.ceil(items.length / 9)))) + '</p>' +
      '<div class="card-acts">' +
        '<button type="button" class="btn primary" data-act="doPrint">' + ICON_PRINT + esc(t().printNow) + '</button>' +
        '<div class="seg small" role="group" aria-label="' + esc(t().printTitle) + '">' +
          '<button type="button" data-act="printArt" data-val="color"' +
            (S.printBW ? '' : ' class="on"') + '>' + esc(t().printColor) + '</button>' +
          '<button type="button" data-act="printArt" data-val="bw"' +
            (S.printBW ? ' class="on"' : '') + '>' + esc(t().printBW) + '</button>' +
        '</div>' +
        '<button type="button" class="btn" data-act="printLink">' + ICON_LINK + esc(t().printLink) + '</button>' +
      '</div>' +
      '<p class="printnote">' + esc(t().printNote) + '</p>' +
    '</div>' +
    /* Листы нарезаны заранее, а не отданы на откуп разрыву страниц: браузеры
       по-разному ломают сетку, и ряд карт то и дело оказывался разрезан краем
       бумаги пополам. Девять на лист, пустые места добиты - по полной сетке
       резать ровнее. */
    pages.map(function (page, i) {
      return '<div class="psheet' + (S.printBW ? ' bw' : '') + '"' + (i ? ' data-next="1"' : '') + '>' +
        page.map(printCardHTML).join('') +
        (i === pages.length - 1
          ? Array(pad).fill('<div class="pcard blank"></div>').join('') : '') +
      '</div>';
    }).join('');
}

/* ============================================================
   ROUTER
   ============================================================ */
const ROUTES = {
  'roll/std': renderStd,
  'lists': renderLists,
  'roll/alt': renderAlt,
  'roll/wondrous': renderWond,
  'roll/dread': renderDread,
  'roll/voa': renderVoa,
  'roll/community': renderComm,
  'tables': renderTables,
  'search': renderSearch,
  'print': renderPrint
};
const TAB_LIST = [
  ['roll/std','std'], ['roll/alt','alt'],
  ['roll/wondrous','wondrous'], ['roll/dread','dread'], ['roll/voa','voa'], ['roll/community','community'],
  ['tables','tables'], ['lists','lists'], ['search','search']
];
/* links handed out before the three d12 modes were merged */
const LEGACY_ROUTES = { 'roll/core':'roll/std', 'roll/hnf':'roll/std', 'roll/all':'roll/std' };

const TABLES_RE = /^tables(?:\/([a-z_]+))?(?:\/([A-Za-z0-9_.-]+))?$/;

/* Пришла короткая ссылка: разворачиваем её в обычную и переписываем адрес.
   Дальше всё идёт прежним синхронным путём и ничего про сжатие не знает. */
function expandHash(){
  const h = (location.hash || '').replace(/^#\/?/, '');
  if (h.indexOf('l/' + PACK_MARK) !== 0) return false;
  unpackPayload(h.slice(2)).then(function (plain) {
    if (history.replaceState) history.replaceState(null, '', appUrl('#/l/' + plain));
    else location.hash = '#/l/' + plain;
    render();
  }).catch(function () {
    /* Не развернулось — пусть страница честно скажет «ссылка повреждена» */
    if (history.replaceState) history.replaceState(null, '', appUrl('#/l/zzzz'));
    render();
  });
  return true;
}

function currentRoute(){
  const h = (location.hash || '').replace(/^#\/?/, '');
  if (h.indexOf('l/' + PACK_MARK) === 0) return 'l/zzzz';   // пока разворачивается
  if (/^i\/[\w-]+$/.test(h)) return h;
  /* Что печатаем, живёт в адресе, а не в памяти: печать вызывают из трёх мест,
     и набор должен пережить и перезагрузку, и пересылку другому мастеру. */
  if (/^print\/[\w-]+$/.test(h)) { S.printIds = h.slice(6); return 'print'; }
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
    if (table && table !== S.tables.t) {
      S.tables.t = table; S.fOpen = false; S.fOn = {}; S.fSeg = '';
    }
    const tail = m[2] || '';
    /* This runs on every render, so the address may only be read back when it
       has actually changed. Reading it every time froze the filter at whatever
       the link said: the panel could not be folded and a chip clicked itself
       straight back to the state in the URL. */
    if (tail.indexOf('f_') === 0) {
      if (tail !== S.fSeg) { fDecode(tail); S.fSeg = tail; S.fOpen = true; }
      S.tables.anchor = '';
    } else {
      S.tables.anchor = tail;
    }
    return 'tables';
  }
  if (ROUTES[h]) return h;
  /* Only what we could not read at all. An address that resolved to something
     else stays in the bar otherwise, and every refresh and every step back
     replays it. */
  if (h && history.replaceState) {
    const home = loadHome() || HOME_DEFAULT;
    history.replaceState(null, '', location.pathname + location.search + home);
    return home.replace(/^#\/?/, '');
  }
  return 'roll/std';
}
/* index.html cannot know the language, so the chrome that has no text of its
   own is named here — these were the last three strings stuck in Russian. */
function syncChrome(){
  const set = (sel, label) => { const el = $(sel); if (el) el.setAttribute('aria-label', label); };
  set('#langSeg', t().langLabel);
  set('#tabs', t().sectionsLabel);
  set('.modal-x', t().close);
  const skip = $('#skip');
  if (skip) skip.textContent = t().skipToContent;
  document.title = t().docTitle;
}
function syncLangButtons(){
  $$('#langSeg button').forEach(function (b) {
    const on = b.dataset.lang === S.lang;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}
function renderTabs(){
  const cur = currentRoute();
  $('#tabs').innerHTML = TAB_LIST.map((tab, i) =>
    '<a href="#/' + tab[0] + '" class="' + (tab[0] === cur ? 'on' : '') + (tab[0] === 'tables' ? ' sep' : '') + '">' +
      esc(t().tabs[tab[1]]) +
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
      printBtn(selIds(), 'sm') +
    '</div>' +
  '</div>';
}

/* ---------- keeping the keyboard where it was ----------
   A render throws the whole view away and builds it again, so whatever had
   focus is a different node afterwards. Without this, pressing Enter on a roll
   button dropped focus to <body> and every keystroke in a field sent the caret
   back to position 0. Both are found again by the attributes the markup is
   built from, which is the one thing that survives the rebuild. */
const FOCUS_BY = ['id','data-act','data-val','data-for','data-step','data-open','data-sel',
                  'data-add-to','data-note','data-nkind','data-pos','data-qty','data-gold',
                  'data-note-toggle','data-remove','data-drag','data-list-note','data-copy-sec',
                  'data-copy-name','data-share','data-copy-full','data-send','data-copy-img',
                  'data-copy-roll','data-copy-listtext','data-share-list','data-share-gm',
                  'data-del-list','data-list','data-lang','data-close','data-sel-all',
                  'data-money','data-guess','data-guess-apply'];
function rememberFocus(){
  const el = document.activeElement;
  if (!el || !el.tagName || el === document.body) return null;
  const bits = [];
  FOCUS_BY.forEach(function (a) {
    const v = el.getAttribute && el.getAttribute(a);
    if (v == null || v.indexOf('"') >= 0) return;
    bits.push(a === 'id' ? '#' + v : '[' + a + '="' + v + '"]');
  });
  if (!bits.length) return null;
  const keep = { sel: bits[0].charAt(0) === '#' ? bits[0] : el.tagName.toLowerCase() + bits.join('') };
  if (typeof el.selectionStart === 'number') {
    keep.start = el.selectionStart; keep.end = el.selectionEnd;
  }
  return keep;
}
function restoreFocus(keep){
  if (!keep) return;
  let el;
  try { el = document.querySelector(keep.sel); } catch (e) { return; }
  if (!el) return;
  try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
  if (keep.start != null) {
    try { el.setSelectionRange(keep.start, keep.end); } catch (e) {}
  }
}

/* ---------- что было свёрнуто, тем и остаётся ----------
   Разметку страницы перерисовывают целиком, и раскрытость <details> живёт в
   ней, а не в модели. Поэтому любая мелочь, вызывающая render, - смена режима
   цен, галочка «выбрать все» - разворачивала обратно всё, что человек свернул.
   Ключ на элементе, снимок до перерисовки, восстановление после. */
function restoreOpen(){
  $$('[data-keep]').forEach(function (el) {
    const was = S.keepOpen[el.dataset.keep];
    if (was === undefined) return;
    if (el.tagName === 'DETAILS') el.open = was; else el.hidden = !was;
  });
}
/* Запоминаем только то, что человек свернул или раскрыл сам. Снимок всей
   разметки был бы проще, но тогда панель броска не смогла бы раскрыться на
   свежий результат: снимок, сделанный до перерисовки, закрыл бы её обратно.
   `toggle` не всплывает, поэтому слушаем на перехвате. */
document.addEventListener('toggle', function (e) {
  const el = e.target;
  if (el.dataset && el.dataset.keep) S.keepOpen[el.dataset.keep] = el.open;
}, true);

function render(){
  const keep = rememberFocus();
  const r = currentRoute();
  S.route = r;
  renderTabs();
  renderSelBar();
  if (r.indexOf('i/') === 0) {
    const id = r.slice(2);
    $('#view').innerHTML = renderItemPage(id);
    const it = BY_ID[id];
    document.title = (it ? nameOf(it) + ' — ' : '') + t().docTitle;
  } else if (r.indexOf('lists/') === 0) {
    // old short link: hand it straight over to the shareable address
    const own = getList(r.slice(6));
    if (own) { S.openList = own.id; syncListUrl(own); }
    $('#view').innerHTML = renderOneList(r.slice(6));
    document.title = t().docTitle;
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
    document.title = t().docTitle;
  } else {
    S.openList = ''; S.urlPayload = '';
    $('#view').innerHTML = ROUTES[r]();
    document.title = t().docTitle;
  }
  syncChrome();
  refreshModal();
  placeMenu();
  $('#footText').innerHTML = t().foot;
  document.documentElement.lang = S.lang;
  restoreOpen();
  autoSizeNotes();
  if (r === 'print') fitPrintCards();
  restoreFocus(keep);

  if (S.tables.anchor && r === 'tables') {
    /* Якорем может быть раздел или отдельная запись: с карточки ведут прямо на
       её строку, и подсветить весь ранг вместо одной вещи - значит не ответить
       на вопрос «где она здесь». */
    const key = S.tables.anchor;
    const target = document.getElementById(sectionId(key)) ||
                   document.querySelector('[data-row="' + key.replace(/"/g, '') + '"]');
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
  if (r === 'roll/dread') return S.dread;
  if (r === 'roll/voa') return S.voa;
  if (r === 'roll/community') return S.comm;
  return null;
}

function rollNd12(n){ let s = 0; for (let i = 0; i < n; i++) s += d(12); return s; }

document.addEventListener('click', function (e) {
  /* The menu used to close itself on every pick; now that it stays open, a
     click anywhere else is what dismisses it. */
  if (S.menuFor && !e.target.closest('.seldrop') && !e.target.closest('.dropmenu')) {
    S.menuFor = ''; S.newListFor = ''; render();
  }

  const langBtn = e.target.closest('#langSeg button');
  if (langBtn) {
    S.lang = langBtn.dataset.lang;
    saveLang();
    syncLangButtons();
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
                    parseInt(inp.dataset.min, 10), parseInt(inp.dataset.max, 10));
    inp.value = v;
    /* Through the same event as typing. Each field has its own `input` handler,
       and a second copy of that logic behind the steppers eventually falls
       behind it: the reprice field changed its digits but neither the model nor
       the button's label (#19), because only `applyNum` was called. */
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }

  // one control adds to a list, from a card or from the selection bar
  const at = e.target.closest('[data-add-to]');
  if (at) {
    const parts = at.dataset.addTo.split('|');
    applyAddTo(parts[0], parts[1]);
    return;
  }



  if (e.target.closest('[data-toast-act]')) {
    const fn = toast._act;
    hideToast();
    if (fn) fn();
    return;
  }

  const rm = e.target.closest('[data-remove]');
  if (rm) {
    const parts = rm.dataset.remove.split(':');
    const l = getList(parts[0]);
    if (!l) return;
    // everything needed to put it back exactly where it was
    const at = l.ids.indexOf(parts[1]);
    const meta = JSON.parse(JSON.stringify(itemMeta(l, parts[1])));
    const it = BY_ID[parts[1]];
    toggleInList(parts[0], parts[1]);
    freshenListUrl(l);
    render();
    if (at >= 0) toastAction(t().removedItem.replace('%s', it ? nameOf(it) : ''), t().undo, function () {
      const back = getList(parts[0]);
      if (!back || back.ids.indexOf(parts[1]) >= 0) return;
      back.ids.splice(Math.min(at, back.ids.length), 0, parts[1]);
      if (Object.keys(meta).length) {
        back.meta = back.meta || {};
        back.meta[parts[1]] = meta;
      }
      saveLists();
      freshenListUrl(back);
      render();
    });
    return;
  }

  const sl = e.target.closest('[data-share-list]');
  if (sl) {
    const l = getList(sl.dataset.shareList);
    if (l && !l.ids.length) { toast(t().listEmpty); return; }
    if (l) listShareUrlShort(l, true).then(u => copyText(u, t().playersLinkCopied));
    return;
  }
  const sg = e.target.closest('[data-share-gm]');
  if (sg) {
    const l = getList(sg.dataset.shareGm);
    if (l && !l.ids.length) { toast(t().listEmpty); return; }
    if (l) listShareUrlShort(l, false).then(u => copyText(u, t().gmLinkCopied));
    return;
  }

  const gt = e.target.closest('[data-guess]');
  if (gt) { S.guess = !S.guess; render(); return; }

  const ga = e.target.closest('[data-guess-apply]');
  if (ga) {
    const l = getList(ga.dataset.guessApply);
    if (!l) return;
    const before = {};
    let n = 0;
    l.ids.filter(function (id) { return S.lsel[id]; }).forEach(function (id) {
      const v = guessPrice(BY_ID[id]);
      if (!v) return;                       // без ранга угадывать нечего
      before[id] = itemMeta(l, id).gold || 0;
      setMeta(l, id, 'gold', v);
      n++;
    });
    if (!n) return;
    S.guess = false;
    freshenListUrl(l); render();
    toastAction(t().guessDone + ' (' + n + ')', t().repriceUndo, function () {
      const back = getList(l.id); if (!back) return;
      Object.keys(before).forEach(function (id) { setMeta(back, id, 'gold', before[id]); });
      freshenListUrl(back); render();
    });
    return;
  }

  const rp = e.target.closest('[data-reprice]');
  if (rp) {
    const l = getList(rp.dataset.reprice);
    if (!l) return;
    const pct = S.rp;
    if (!pct) return;
    const before = {};
    let n = 0;
    l.ids.filter(function (id) { return S.lsel[id]; }).forEach(function (id) {
      const g = itemMeta(l, id).gold;
      if (!(g > 0)) return;
      before[id] = g;
      /* Округляем до целого: цена в списке - монеты, дробных монет не бывает.
         Не даём цене уйти в ноль, иначе позиция потеряет цену насовсем. */
      setMeta(l, id, 'gold', Math.max(1, Math.round(g * (100 + pct) / 100)));
      n++;
    });
    if (!n) return;
    freshenListUrl(l); render();
    toastAction(t().repriceDone + ' (' + (pct > 0 ? '+' : '') + pct + '%, ' + n + ')',
      t().repriceUndo, function () {
        const back = getList(l.id);
        if (!back) return;
        Object.keys(before).forEach(function (id) { setMeta(back, id, 'gold', before[id]); });
        freshenListUrl(back); render();
      });
    return;
  }

  const bc = e.target.closest('[data-batch-clearprice]');
  if (bc) {
    const l = getList(bc.dataset.batchClearprice);
    if (!l) return;
    const before = {};
    l.ids.filter(function (id) { return S.lsel[id]; }).forEach(function (id) {
      const g = itemMeta(l, id).gold;
      if (g > 0) { before[id] = g; setMeta(l, id, 'gold', 0); }
    });
    if (!Object.keys(before).length) return;
    freshenListUrl(l); render();
    toastAction(t().batchNoPrice, t().repriceUndo, function () {
      const back = getList(l.id); if (!back) return;
      Object.keys(before).forEach(function (id) { setMeta(back, id, 'gold', before[id]); });
      freshenListUrl(back); render();
    });
    return;
  }

  const bd = e.target.closest('[data-batch-del]');
  if (bd) {
    const l = getList(bd.dataset.batchDel);
    if (!l) return;
    /* Помним и позиции, и место каждой: вернуть надо туда же, откуда убрали. */
    const gone = [];
    l.ids.forEach(function (id, i) { if (S.lsel[id]) gone.push({ id: id, at: i, meta: itemMeta(l, id) }); });
    if (!gone.length) return;
    gone.slice().reverse().forEach(function (g) { l.ids.splice(g.at, 1); });
    S.lsel = {};
    saveLists(); freshenListUrl(l); render();
    toastAction(t().batchDeleted + ' (' + gone.length + ')', t().undo, function () {
      const back = getList(l.id); if (!back) return;
      gone.forEach(function (g) {
        back.ids.splice(Math.min(g.at, back.ids.length), 0, g.id);
        if (g.meta && Object.keys(g.meta).length) {
          if (!back.meta) back.meta = {};
          back.meta[g.id] = g.meta;
        }
      });
      saveLists(); freshenListUrl(back); render();
    });
    return;
  }

  const mm = e.target.closest('[data-money]');
  if (mm) {
    const l = getList(mm.dataset.money);
    if (l) {
      if (mm.dataset.val === MONEY_DEFAULT) delete l.money; else l.money = mm.dataset.val;
      saveLists(); freshenListUrl(l); render();
    }
    return;
  }

  const nx = e.target.closest('[data-note-clear]');
  if (nx) {
    const field = nx.closest('.nfield');
    const ta = field && field.querySelector('textarea');
    const was = ta ? ta.value : '';
    if (!was) return;
    /* Через то же событие, что и набор с клавиатуры: модель, адрес и отметка
       на строке обновляются существующим обработчиком, а не второй копией. */
    const put = function (v) {
      ta.value = v;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    };
    put('');
    toastAction(t().noteCleared, t().undo, function () { put(was); });
    return;
  }

  const nt = e.target.closest('[data-note-toggle]');
  if (nt) {
    const row = nt.closest('.lrow');
    const box = row && row.querySelector('.rnote');
    if (box) {
      box.hidden = !box.hidden;
      S.keepOpen[box.dataset.keep] = !box.hidden;
      // a hidden box measures as zero, so its size is settled on the way out
      if (!box.hidden) { autoSizeNotes(box); box.querySelector('textarea').focus(); }
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
    if (act.dataset.last) { toast(t().keepOneKind, true); return; }
    S.kind[val] = !S.kind[val];
    render(); return;
  }
  if (a === 'home') {
    const here = homeHash();
    if (!here) return;
    // pressing the one that is already home puts the default back
    const next = isHome() ? '' : here;
    try { if (next) localStorage.setItem(HOME_KEY, next); else localStorage.removeItem(HOME_KEY); }
    catch (e) { toast(t().saveFailed, true); return; }
    toast(next ? t().homeSet : t().homeReset);
    render(); return;
  }
  if (a === 'hideWarn') { e.preventDefault(); hideWarn(); render(); return; }
  if (a === 'fOpen') { S.fOpen = !S.fOpen; render(); return; }
  if (a === 'fLink') { copyText(fltUrl(), t().filterLinkCopied); return; }
  if (a === 'flt') {
    if (val === 'reset') S.fOn = {};
    else {
      const p = val.split(':'), f = p[0], v = p[1];
      S.fOn[f] = S.fOn[f] || {};
      // letting go of the last pick in a row puts that row back to "any"
      if (S.fOn[f][v]) delete S.fOn[f][v]; else S.fOn[f][v] = true;
    }
    syncFltUrl();
    render(); return;
  }
  if (a === 'src') {
    // never leave the roll with nothing to draw from
    if (act.dataset.last) { toast(t().keepOneSource, true); return; }
    S.std.src[val] = !S.std.src[val];
    render(); return;
  }
  if (a === 'createList') {
    const input = document.getElementById('lname');
    // an unnamed empty list is almost never what was meant; ask for a name
    if (input && !input.value.trim()) { toast(t().nameFirst, true); input.focus(); return; }
    const l = createList(input ? input.value : '');
    S.listDraft = '';
    if (createList.saved) toast(t().listCreated.replace('%s', l.name));
    render();
    return;
  }
  if (a === 'newListFor') {
    S.newListFor = val;
    // из чужой ссылки новый список наследует её имя: переименовать проще, чем набрать
    S.newListDraft = val === N_SHARED ? (S.shared.name || '') : '';
    render(); focusNew(); return;
  }
  if (a === 'cancelNew')  { S.newListFor = ''; S.newListDraft = ''; render(); return; }
  if (a === 'createFor') {
    const input = document.getElementById('newlist');
    if (input && !input.value.trim()) { toast(t().nameFirst, true); input.focus(); return; }
    const l = createList(input ? input.value : '');
    S.newListFor = ''; S.newListDraft = '';
    /* Новый список из чужой ссылки - это её копия целиком, а не горстка
       позиций: имя, заметки списка и всё, что пришло по каждой позиции, включая
       мастерские заметки, если ссылка их несла. В готовый список мастерское не
       льют - там уже есть своё, и чужое его бы вытеснило. */
    if (val === N_SHARED) {
      l.ids = S.shared.ids.slice();
      if (S.shared.meta) l.meta = JSON.parse(JSON.stringify(S.shared.meta));
      if (S.shared.note) l.note = S.shared.note;
      if (S.shared.hnote) l.hnote = S.shared.hnote;
      saveLists();
      toast(t().addedTo.replace('%s', l.name));
      goToList(l);
      return;
    }
    addIdsTo(l, idsForKey(val), metaForKey(val));
    return;
  }
  if (a === 'menu')     { S.menuFor = S.menuFor === val ? '' : val; render(); return; }
  if (a === 'clearSel') { S.sel = {}; S.menuFor = ''; render(); return; }
  if (a === 'doPrint')  { window.print(); return; }
  /* Картинки - выбор человека, а не наш: на цветном принтере они делают карту
     карточкой, на чёрно-белом превращаются в серое пятно поверх текста. */
  if (a === 'printArt') { S.printBW = val === 'bw'; render(); return; }
  if (a === 'printLink'){ copyText(appUrl(printHref(printIds(S.printIds))), t().linkCopied); return; }
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
  if (a === 'comm')   { S.comm.c = val; S.comm.n = 1; render(); return; }
  /* Разделы разной длины: бросок, сделанный в одном, в другом указывал бы мимо */
  if (a === 'moneyHelp') { S.moneyHelp = !S.moneyHelp; render(); return; }
  if (a === 'voa')    { S.voa.k = val === 'A' || val === 'C' ? val : +val; S.voa.n = 1; render(); return; }
  if (a === 'view')   { S.tables.view = val; savePrefs(); render(); return; }

  if (a === 'roll') {
    /* Одна цепочка: отдельный if для Dread разрывал её, и Wondrous получал
       свой номер, а следом его затирал бросок d12 из последней ветки. */
    if (S.route === 'roll/wondrous') { st.n = d(DATA.wondrous.length); }
    else if (S.route === 'roll/dread') { st.n = d(DATA.dread.length); }
    else if (S.route === 'roll/voa') { st.n = d(voaGroup(S.voa.k).length); }
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
    render();
    return;
  }
  const st = stateForRoute();
  if (!st) return;
  if (id === 'n') st.n = v;
  if (id === 'hope') st.hope = v;
  if (id === 'fear') st.fear = v;
  render();
}

document.addEventListener('input', function (e) {
  const el = e.target;
  // the box follows the text as it is typed, not only when the page renders
  if (el.matches && el.matches(NOTE_SEL)) autoSize(el);
  if (el.id === 'n' || el.id === 'hope' || el.id === 'fear') {
    // a text field can hold anything, so keep it to digits without moving the caret
    const digits = el.value.replace(/\D/g, '');
    if (digits !== el.value) {
      const at = el.selectionStart - (el.value.length - digits.length);
      el.value = digits;
      try { el.setSelectionRange(at, at); } catch (err) {}
    }
    const raw = parseInt(digits, 10);
    /* На странице списка пустое поле - это состояние «бросок не сделан», а не
       полуготовый ввод: результат убирается, и следующая цифра приходит как
       изменение, даже если это единица (#16). На страницах бросков показывать
       нечего было бы вовсе, поэтому там пустое поле по-прежнему ждёт `change`. */
    if (isNaN(raw)) { if (onListPage()) applyNum(el.id, 0); return; }
    const v = clamp(raw, parseInt(el.dataset.min, 10), parseInt(el.dataset.max, 10));
    if (v !== raw) el.value = v;
    applyNum(el.id, v);
  }
  if (el.id === 'sq') { S.search.q = el.value; render(); }
  if (el.id === 'lname') { S.listDraft = el.value; }
  if (el.id === 'limport') { S.importDraft = el.value; }
  if (el.id === 'rp') {
    /* Кнопка называется по знаку: «Сделать скидку» или «Поднять цену». Значит
       перерисовать надо ровно тогда, когда знак поменялся, а не на каждую
       цифру - иначе каретка прыгала бы посреди набора. */
    const was = S.rp < 0;
    S.rp = parseInt(el.value, 10) || 0;
    if (was !== (S.rp < 0)) render();
    return;
  }
  if (el.id === 'newlist') { S.newListDraft = el.value; }
  if (el.dataset.qty || el.dataset.gold) {
    const field = el.dataset.qty ? 'qty' : 'gold';
    const parts = (el.dataset.qty || el.dataset.gold).split(':');
    const l = getList(parts[0]);
    if (l) {
      /* Панель пересчёта живёт от того, есть ли в списке хоть одна цена. Поля
         правятся без перерисовки - иначе каретка прыгала бы на каждой цифре, -
         поэтому перерисовываем только в тот момент, когда первая цена
         появилась или последняя исчезла. Фокус render() возвращает сам. */
      const had = l.ids.some(function (id) { return itemMeta(l, id).gold > 0; });
      setMeta(l, parts[1], field, parseInt(el.value, 10) || 0);
      freshenListUrl(l);
      if (field === 'gold') {
        /* Подсказка живёт на самом поле, и перерисовки, которая бы её обновила,
           здесь нет: пересчитываем на месте, иначе после правки цены на 231
           поле продолжало обещать «4 горсти». */
        const say = goldText(l, parseInt(el.value, 10) || 0);
        if (say) el.title = say; else el.removeAttribute('title');
        const has = l.ids.some(function (id) { return itemMeta(l, id).gold > 0; });
        if (had !== has) render();
      }
    }
  }
  /* Notes never re-render: the cursor sits inside the textarea. Only the model,
     the storage and the address are brought up to date. */
  if (el.dataset.note) {
    const parts = el.dataset.note.split(':');
    const l = getList(parts[0]);
    if (l) {
      setMeta(l, parts[1], el.dataset.nkind === 'hid' ? 'hnote' : 'note', el.value.trim());
      const row = el.closest('.lrow');
      if (row) {
        // either box counts: the marker says "there is something written here"
        const any = [...row.querySelectorAll('.rnote textarea')].some(x => x.value.trim());
        row.classList.toggle('has-note', any);
        const btn = row.querySelector('.lrow-note');
        if (btn) btn.classList.toggle('on', any);
      }
      freshenListUrl(l);
    }
  }
  /* Ticking a box repaints the row and the bar in place: a full render would
     lose the scroll position halfway down a 119-row table. */
  if (el.dataset.lsel) {
    if (el.checked) S.lsel[el.dataset.lsel] = true; else delete S.lsel[el.dataset.lsel];
    render();
    return;
  }
  if (el.dataset.lselAll) {
    const l = getList(el.dataset.lselAll);
    if (l) {
      S.lsel = {};
      if (el.checked) l.ids.forEach(function (id) { S.lsel[id] = true; });
      render();
    }
    return;
  }
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
  if (el.dataset.listNote) {
    const l = getList(el.dataset.listNote);
    if (l) {
      const f = el.dataset.nkind === 'hid' ? 'hnote' : 'note';
      const v = el.value.trim();
      if (v) l[f] = v; else delete l[f];
      saveLists();
      freshenListUrl(l);
    }
  }
  if (el.id === 'rename') {
    const l = getList(el.dataset.list);
    if (l) { l.name = el.value; saveLists(); renderSelBar(); freshenListUrl(l); }
  }
  if (el.id === 'tq') { S.tables.q = el.value; render(); }
  if (el.id === 'pickq') { S.pickQ = el.value; render(); }
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
/* ---------- scrolling while dragging ----------
   A native drag swallows the wheel, and the browser's own edge scrolling starts
   in a strip a few pixels tall — aiming at it is a game in itself, and moving an
   entry past the fold was effectively impossible (#22). So the page scrolls
   itself: a generous band at either edge, speed growing as the pointer goes
   deeper into it, running off the frame rather than off the mouse so it keeps
   going while the hand is still. */
const EDGE = 120, EDGE_MAX = 22;
let edgeSpeed = 0, edgeTimer = 0;
function edgeStep(){
  edgeTimer = 0;
  if (!dragKey || !edgeSpeed) return;
  scrollBy(0, edgeSpeed);
  edgeTimer = requestAnimationFrame(edgeStep);
}
function edgeScroll(y){
  const h = innerHeight;
  const depth = y < EDGE ? y - EDGE : (y > h - EDGE ? y - (h - EDGE) : 0);
  edgeSpeed = depth ? Math.round(EDGE_MAX * Math.max(-1, Math.min(1, depth / EDGE))) : 0;
  if (edgeSpeed && !edgeTimer) edgeTimer = requestAnimationFrame(edgeStep);
}
function edgeStop(){
  edgeSpeed = 0;
  if (edgeTimer) { cancelAnimationFrame(edgeTimer); edgeTimer = 0; }
}
/* The pointer spends most of a drag over the gap between rows, where the row
   handler below returns early — the scrolling has to be driven from every
   dragover, not only the ones that land on a row. */
document.addEventListener('dragover', function (e) {
  if (dragKey) edgeScroll(e.clientY);
}, true);

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
  edgeStop();
  clearDropMarks();
  $$('.lrow.dragging').forEach(function (r) { r.classList.remove('dragging'); });
});
document.addEventListener('drop', function (e) {
  edgeStop();
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
  /* Half-typed input is left alone so the caret is not yanked around; once the
     field is done being edited it has to hold a number again. */
  if (el.id === 'n' || el.id === 'hope' || el.id === 'fear') {
    const raw = parseInt(el.value, 10);
    // пустое поле списка - это осмысленное состояние, а не недобор (#16)
    if (isNaN(raw) && el.id === 'n' && onListPage()) return;
    const v = isNaN(raw) ? parseInt(el.dataset.min, 10)
                         : clamp(raw, parseInt(el.dataset.min, 10), parseInt(el.dataset.max, 10));
    if (String(v) !== el.value) { el.value = v; applyNum(el.id, v); }
    return;
  }
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

/* The resize grip is part of the textarea, so a drag starts and ends on it.
   Measuring once the pointer is up rather than while it moves keeps us out of
   the way of the hand; all we take from it is "this box is theirs now", which
   stops the auto-sizing from undoing the drag on the next keystroke. */
let noteDrag = null;
document.addEventListener('pointerdown', function (e) {
  const ta = e.target.closest && e.target.closest(NOTE_SEL);
  noteDrag = ta ? { ta: ta, h: ta.offsetHeight } : null;
});
document.addEventListener('pointerup', function () {
  const d = noteDrag; noteDrag = null;
  if (!d || !d.ta.isConnected || d.ta.offsetHeight === d.h) return;
  d.ta.dataset.manual = '1';
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
loadLang();
loadPrefs();
syncLangButtons();
/* Opened without an address — go where this browser was told to start */
if (!location.hash || location.hash === '#' || location.hash === '#/') {
  const home = loadHome();
  if (home && home !== HOME_DEFAULT) location.hash = home;
}

/* A modal is tied to the route it was opened from. Links inside it (the craft
   chain, for one) navigate the page underneath, so the modal has to go with it
   instead of hanging over the new page. */
/* Another tab wrote the lists: take theirs, keeping anything we have that they
   have not seen yet, and redraw. */
window.addEventListener('storage', function (e) {
  if (e.key !== LS_KEY) return;
  S.lists = mergeLists(loadLists());
  render();
});

window.addEventListener('hashchange', function () {
  closeModal();
  /* A selection belongs to the page it was made on. Route strings cannot tell
     one table from another — they all read "tables" — so the hash is the honest
     signal that the user went somewhere else. */
  S.sel = {}; S.lsel = {}; S.menuFor = ''; S.newListFor = '';
  if (expandHash()) return;
  render();
});
if (!expandHash()) render();

})();
