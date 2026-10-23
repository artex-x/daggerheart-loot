/* Shared data and helpers for the TASK 57 direction mocks. Real records from
   data.js (names, text, stats, image files); real UI strings from
   app/src/lib/dict.ts where the string is kept, proposed strings otherwise. */
(function () {
  const q = new URLSearchParams(location.search);
  const LANG = q.get('lang') === 'en' ? 'en' : 'ru';
  const OPT = q.get('opt') || '';
  const FONT = q.get('font') || '';
  document.documentElement.lang = LANG;
  if (FONT) document.documentElement.dataset.font = FONT;
  if (OPT) document.documentElement.dataset.opt = OPT;

  /* From issues/57/mocks/direction/<X>/ the repository root is five up. */
  const IMG = '../../../../../img/';

  const S = {
    brand: ['Лут', 'Loot'],
    brandSub: ['Daggerheart', 'Daggerheart'],
    std: ['Обычные правила', 'Standard rules'],
    alt: ['Альт. таблицы', 'Alt. tables'],
    altLong: ['Альтернативные таблицы', 'Alternate tables'],
    sup: ['Дополнения', 'Supplements'],
    tables: ['Таблицы', 'Tables'],
    search: ['Поиск', 'Search'],
    roll: ['Бросок', 'Roll'],
    signIn: ['Войти', 'Sign in'],
    account: ['Аккаунт', 'Account'],
    menuLists: ['Мои списки', 'My lists'],
    myItems: ['Мои предметы', 'My items'],
    signOut: ['Выйти', 'Sign out'],
    signedAs: ['Вы вошли как', 'Signed in as'],
    sumField: ['Сумма на кубиках', 'Dice total'],
    orEnter: ['или введите свой бросок', 'or enter your own roll'],
    rollBtn: ['Бросить', 'Roll'],
    common: ['Обычная', 'Common'],
    cu: ['Обычная - необычная', 'Common - uncommon'],
    ur: ['Необычная - редкая', 'Uncommon - rare'],
    rl: ['Редкая - легендарная', 'Rare - legendary'],
    leg: ['Легендарная', 'Legendary'],
    source: ['Источник', 'Source'],
    type: ['Тип', 'Type'],
    all: ['Все', 'All'],
    items: ['Предметы', 'Items'],
    cons: ['Расходники', 'Consumables'],
    pickOne: ['Бросок 1 - выберите один предмет', 'Roll 1 - pick one item'],
    copyAll: ['Скопировать все четыре', 'Copy all four'],
    addList: ['В список', 'Add to list'],
    share: ['Поделиться', 'Share'],
    print: ['Печать', 'Print'],
    more: ['Ещё', 'More'],
    copyText: ['Скопировать текст', 'Copy text'],
    copyName: ['Скопировать название', 'Copy name'],
    copyImg: ['Скопировать картинку', 'Copy image'],
    copyLink: ['Скопировать ссылку', 'Copy link'],
    keepCopy: ['Копия в мои предметы', 'Copy to my items'],
    showInTable: ['Показать в таблице', 'Show in the table'],
    no: ['№', 'No.'],
    kItem: ['Предмет', 'Item'],
    kCons: ['Расходник', 'Consumable'],
    kWeapon: ['Основное оружие', 'Primary weapon'],
    kArmor: ['Броня', 'Armor'],
    unique: ['Уникальное', 'Unique'],
    gCore: ['Core', 'Core'],
    gHnf: ['Hope & Fear', 'Hope & Fear'],
    gAlt: ['Альт. таблицы', 'Alt. tables'],
    gSup: ['Дополнения', 'Supplements'],
    gEq: ['Снаряжение', 'Equipment'],
    gOther: ['Прочее', 'Other'],
    tWeapon: ['Оружие', 'Weapons'],
    tSecondary: ['Вторичное', 'Secondary'],
    tArmor: ['Броня', 'Armor'],
    tblSearch: ['Поиск по названию или описанию', 'Search names and descriptions'],
    tableLink: ['Ссылка на таблицу', 'Link to this table'],
    viewList: ['Списком', 'List'],
    viewGrid: ['Сеткой', 'Grid'],
    filters: ['Фильтры', 'Filters'],
    select: ['Выбрать', 'Select'],
    reset: ['Сбросить', 'Reset'],
    shown: ['Показано 91 из 458', '91 of 458 shown'],
    tier1: ['Ранг 1', 'Tier 1'],
    tier: ['Ранг', 'Tier'],
    artifacts: ['Артефакты', 'Artifacts'],
    cls: ['Класс', 'Class'],
    phy: ['Физическое', 'Physical'],
    mag: ['Магическое', 'Magic'],
    trait: ['Характеристика', 'Trait'],
    range: ['Дистанция', 'Range'],
    dmg: ['Урон', 'Damage'],
    burden: ['Хват', 'Burden'],
    oneH: ['Одноручное', 'One-handed'],
    twoH: ['Двуручное', 'Two-handed'],
    upg: ['Улучшения', 'Upgrades'],
    upgOk: ['Есть улучшение', 'Upgradable'],
    uniques: ['Уникальные', 'Unique'],
    name: ['Название', 'Name'],
    link: ['Ссылка', 'Link'],
    listName: ['Лавка кузнеца', "The smith's shop"],
    listMeta: ['10 позиций из 100 · сохранено', '10 entries of 100 · saved'],
    prices: ['Цены', 'Prices'],
    asBook: ['Как в книге', 'As in the book'],
    inCoins: ['Монетами', 'In coins'],
    forPlayers: ['Для игроков', 'For players'],
    gmOnly: ['Только для мастера', 'GM only'],
    gmOnlyHint: ['Игроки не видят', 'Players do not see this'],
    note1: ['Открыта с рассвета до заката.', 'Open from dawn to dusk.'],
    note2: [
      'Кузнец торгуется, если назвать имя его брата.',
      'The smith bargains if you name his brother.'
    ],
    rollList: ['Бросить по списку', 'Roll on this list'],
    qty: ['Кол-во', 'Qty'],
    price: ['Цена', 'Price'],
    note: ['Заметка', 'Note'],
    addOwn: ['Добавить свой предмет', 'Add your own item'],
    exportJson: ['Скачать JSON', 'Download JSON'],
    delList: ['Удалить список', 'Delete list'],
    hideFromPlayers: ['Скрыть от игроков', 'Hide from players'],
    remove: ['Убрать из списка', 'Remove from list'],
    lists: ['Списки', 'Lists'],
    noPic: ['Без картинки', 'No picture'],
    gp: ['зол.', 'gp'],
    footInstall: ['Установить как приложение', 'Install as an app'],
    footPrivacy: ['Конфиденциальность', 'Privacy'],
    footTerms: ['Условия использования', 'Terms of use'],
    help: ['Справка', 'Help'],
    home: ['Стартовый раздел', 'Start section'],
    homeOn: ['Стартовый', 'Start section'],
    rarity: ['Редкость', 'Rarity'],
    lastRoll: ['последний бросок', 'last roll'],
    close: ['Закрыть', 'Close'],
    sel: ['Выбрано: 2', '2 selected'],
    copySel: ['Скопировать текст выбранных', 'Copy text of selected'],
    addSel: ['Добавить выбранные в список', 'Add selected to a list'],
    modes: ['Режим броска', 'Roll mode'],
    all9: ['Все режимы', 'All modes']
  };
  const t = (k) => (S[k] ? S[k][LANG === 'en' ? 1 : 0] : k);

  const TRAIT = {
    agility: ['Проворность', 'Agility'],
    strength: ['Сила', 'Strength'],
    finesse: ['Искусность', 'Finesse'],
    instinct: ['Инстинкт', 'Instinct'],
    presence: ['Влияние', 'Presence'],
    knowledge: ['Знание', 'Knowledge']
  };
  const RANGE = {
    melee: ['Вплотную', 'Melee'],
    veryclose: ['Близко', 'Very close'],
    close: ['Средне', 'Close'],
    far: ['Далеко', 'Far'],
    veryfar: ['Очень далеко', 'Very far']
  };
  const L = (pair) => pair[LANG === 'en' ? 1 : 0];

  const R = {
    ci1: {
      kind: 'item',
      src: 'Core',
      no: 1,
      ru: 'Первоклассный Спальный Мешок',
      en: 'Premium Bedroll',
      rud: 'Во время отдыха вы автоматически очищаете Стресс.',
      ende: 'During downtime, you automatically clear a Stress.'
    },
    cc1: {
      kind: 'cons',
      src: 'Core',
      no: 1,
      ru: 'Зелье Быстрого Шага',
      en: 'Stride Potion',
      rud: 'Вы получаете бонус +1 к следующему Броску Проворности.',
      ende: 'You gain a +1 bonus to your next Agility Roll.',
      up: ['Большое Зелье Быстрого Шага', 'Major Stride Potion']
    },
    hi1: {
      kind: 'item',
      src: 'Hope & Fear',
      no: 1,
      ru: 'Шипы',
      en: 'Caltrops',
      rud: 'Вы можете рассыпать эти шипы в пределах Близкой дистанции вокруг себя. Если существо пересекает эту область в спешке, оно должно отметить Стресс.',
      ende: 'You can spread these caltrops in a Very Close area around you. A creature hastening through that area must mark a Stress.'
    },
    hc1: {
      kind: 'cons',
      src: 'Hope & Fear',
      no: 1,
      img: 'hc1',
      ru: 'Оберегающая Свеча',
      en: 'Warding Candle',
      rud: 'Зажгите эту свечу, и в пределах Средней дистанции разольётся ореол света. Существо снаружи ореола не может войти в него, если замышляет недоброе против того, кто внутри. Свеча горит час.',
      ende: "You can light this candle to fill an area within Close range with a halo of light. A creature outside the halo can't enter it if they have ill intent toward a creature within it. The candle burns for an hour."
    },
    q1: {
      kind: 'weapon',
      src: 'Core',
      ru: 'Палаш',
      en: 'Broadsword',
      f: ['Надёжное', 'Reliable', '+1 к Броскам Атаки', '+1 to attack rolls'],
      tr: 'agility',
      rg: 'melee',
      dmg: 'd8',
      dt: 'phy',
      bu: 1
    },
    q2: {
      kind: 'weapon',
      src: 'Core',
      ru: 'Длинный Меч',
      en: 'Longsword',
      tr: 'agility',
      rg: 'melee',
      dmg: 'd10+3',
      dt: 'phy',
      bu: 2
    },
    q4: {
      kind: 'weapon',
      src: 'Core',
      ru: 'Двуручный Меч',
      en: 'Greatsword',
      f: [
        'Массивное',
        'Massive',
        '−1 к Уклонению; при успешной атаке бросьте дополнительную кость урона и отбросьте результат с наименьшим значением.',
        '−1 to Evasion; on a successful attack, roll an additional damage die and discard the lowest result.'
      ],
      tr: 'strength',
      rg: 'melee',
      dmg: 'd10+3',
      dt: 'phy',
      bu: 2
    },
    q10: {
      kind: 'weapon',
      src: 'Core',
      ru: 'Рапира',
      en: 'Rapier',
      f: [
        'Быстрое',
        'Quick',
        'Когда вы совершаете атаку, вы можете отметить Стресс, чтобы выбрать целью еще одно существо в пределах дальности.',
        'When you make an attack, you can mark a Stress to target another creature within range.'
      ],
      tr: 'presence',
      rg: 'melee',
      dmg: 'd8',
      dt: 'phy',
      bu: 1
    },
    q13: {
      kind: 'weapon',
      src: 'Core',
      ru: 'Короткий Лук',
      en: 'Shortbow',
      tr: 'agility',
      rg: 'far',
      dmg: 'd6+3',
      dt: 'phy',
      bu: 2
    },
    q16: {
      kind: 'weapon',
      src: 'Core',
      ru: 'Магические Наручи',
      en: 'Arcane Gauntlets',
      tr: 'strength',
      rg: 'melee',
      dmg: 'd10+3',
      dt: 'mag',
      bu: 2
    },
    q20: {
      kind: 'weapon',
      src: 'Core',
      ru: 'Возвращающийся клинок',
      en: 'Returning Blade',
      f: [
        'Возвращающееся',
        'Returning',
        'Когда это оружие брошено в пределах дистанции, оно появляется в вашей руке сразу после атаки.',
        'When this weapon is thrown within its range, it appears in your hand immediately after the attack.'
      ],
      tr: 'finesse',
      rg: 'close',
      dmg: 'd8',
      dt: 'mag',
      bu: 1
    },
    q23: {
      kind: 'weapon',
      src: 'Core',
      ru: 'Скипетр',
      en: 'Scepter',
      f: [
        'Универсальное',
        'Versatile',
        'Это оружие также можно использовать со следующими характеристиками: Влияние, Вплотную, d8.',
        'This weapon can also be used with these statistics—Presence, Melee, d8.'
      ],
      tr: 'presence',
      rg: 'far',
      dmg: 'd6',
      dt: 'mag',
      bu: 2
    },
    q26: {
      kind: 'weapon',
      src: 'Hope & Fear',
      ru: 'Катана',
      en: 'Katana',
      f: [
        'Быстрое',
        'Quick',
        'Когда вы совершаете атаку, вы можете отметить Стресс, чтобы выбрать целью еще одно существо в пределах дальности.',
        'When you make an attack, you can mark a Stress to target another creature within range.'
      ],
      tr: 'agility',
      rg: 'melee',
      dmg: 'd10+3',
      dt: 'phy',
      bu: 2
    },
    q313: {
      kind: 'armor',
      src: 'Core',
      ru: 'Стёганый Доспех',
      en: 'Gambeson Armor',
      f: ['Гибкое', 'Flexible', '+1 к Уклонению', '+1 to Evasion'],
      th: '5/11',
      as: 3
    },
    hb1: {
      kind: 'weapon',
      src: ['Мастерская Ольхи', "Olkha's workshop"],
      hb: true,
      noimg: true,
      uniq: true,
      ru: 'Топор Тлеющих Углей',
      en: 'Emberaxe',
      d: [
        'Лезвие тлеет и не гаснет под дождём.',
        'The blade smoulders and does not go out in the rain.'
      ],
      tr: 'knowledge',
      rg: 'melee',
      dmg: 'd10+2',
      dt: 'mag',
      bu: 2,
      tier: 2
    },
    voa: {
      kind: 'item',
      src: 'Vault of Ages',
      img: 'voa2_a3',
      ru: 'Колода Сумерек',
      en: 'Twilight Deck',
      f: ['Стоимость Призыва', 'Recall Cost', '2', '2'],
      rud: 'Эта колода усиливает судьбы силой первозданных Богов Сумерек.',
      ende: 'This deck enhances fortunes with the power of the primordial Twilight Gods.'
    }
  };
  for (const [id, r] of Object.entries(R)) r.id = id;

  const nm = (r) => (LANG === 'en' ? r.en : r.ru);
  const desc = (r) => (r.d ? L(r.d) : LANG === 'en' ? r.ende : r.rud);
  const kindBadge = (r) =>
    ({
      item: ['k-item', 'kItem'],
      cons: ['k-cons', 'kCons'],
      weapon: ['k-weapon', 'kWeapon'],
      armor: ['k-armor', 'kArmor']
    })[r.kind];
  const srcName = (r) => (Array.isArray(r.src) ? L(r.src) : r.src);
  const statLine = (r, opts = {}) => {
    const p = [];
    if (opts.tier) p.push(`${t('tier')} ${r.tier || 1}`);
    if (r.kind === 'weapon') {
      p.push(
        r.dt === 'mag' ? t('mag') : t('phy'),
        L(TRAIT[r.tr]),
        L(RANGE[r.rg]),
        `${r.dmg} ${LANG === 'en' ? (r.dt === 'mag' ? 'mag' : 'phy') : r.dt === 'mag' ? 'маг' : 'физ'}`,
        r.bu === 2 ? t('twoH') : t('oneH')
      );
    } else if (r.kind === 'armor') {
      p.push(
        `${LANG === 'en' ? 'Thresholds' : 'Пороги'} ${r.th}`,
        `${LANG === 'en' ? 'Armor' : 'Броня'} ${r.as}`
      );
    }
    return p.map((x) => '<span class="si">' + x + '</span>').join('<span class="dot">·</span>');
  };
  const feat = (r) =>
    r.f ? `<b>${LANG === 'en' ? r.f[1] : r.f[0]}:</b> ${LANG === 'en' ? r.f[3] : r.f[2]}` : '';

  const ICON = {
    star: '<path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.2-4 4.3-6 8-6s6.8 2 8 6"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    link: '<path d="M10 14a4.5 4.5 0 006.4 0l3-3a4.5 4.5 0 00-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 00-6.4 0l-3 3a4.5 4.5 0 006.4 6.4l1-1"/>',
    share:
      '<circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="M8.3 10.8l7.4-4.5M8.3 13.2l7.4 4.5"/>',
    image:
      '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2h3"/>',
    print:
      '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    die: '<path d="M12 2.8l8.2 4.8v8.8L12 21.2l-8.2-4.8V7.6z"/><path d="M12 2.8v5.4M20.2 7.6l-4.7 2.8M3.8 7.6l4.7 2.8M12 21.2v-5M8.5 10.4L12 16.2l3.5-5.8z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    table:
      '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    filter: '<path d="M4 5h16l-6.5 8v5l-3 1.5V13z"/>',
    grip: '<circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/>',
    note: '<path d="M4 4h16v12H8l-4 4z"/><path d="M8 9h8M8 12h5"/>',
    eyeoff:
      '<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0112 5c5 0 9 5 9 7a8 8 0 01-2.2 3.3M6.6 6.6C4.4 8 3 10.4 3 12c0 2 4 7 9 7a9 9 0 004.4-1.2"/><path d="M9.9 9.9a3 3 0 004.2 4.2"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
    home: '<path d="M4 11l8-7 8 7"/><path d="M6 9.5V20h12V9.5"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 014.8.9c0 1.7-2.4 2.2-2.4 3.8"/><path d="M12 17.2v.1"/>',
    sword: '<path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6M16 16l4 4M19 21l2-2"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/>',
    flask:
      '<path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 001.3 2h12.4a1.5 1.5 0 001.3-2L14 9V3"/><path d="M7 15h10"/>',
    gem: '<path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18M9 3l3 18M15 3l-3 18"/>',
    pin: '<path d="M12 21s-6-5.5-6-11a6 6 0 0112 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    globe:
      '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>'
  };
  const ic = (n, cls = '') =>
    `<svg class="i ${n === 'chev' ? 'chev' : ''} ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;
  const star = () =>
    `<svg class="star" viewBox="0 0 24 24" aria-hidden="true">${ICON.star}</svg>`;
  const glyphFor = (r) =>
    ({ weapon: 'sword', armor: 'shield', cons: 'flask', item: 'gem' })[r.kind] || 'gem';

  /* The well: the image over the kind glyph. A record with no picture keeps
     the glyph; a picture still loading shows it until it decodes. */
  const art = (r, size, cls = '') => {
    const s = size ? `style="width:${size}px"` : '';
    const img = r.noimg ? '' : `<img src="${IMG}${r.img || r.id}.webp" alt="" loading="eager">`;
    const label = r.noimg ? `<span class="sr">${t('noPic')}</span>` : '';
    return `<div class="art ${cls}" ${s}><span class="glyph">${ic(glyphFor(r))}</span>${img}${label}</div>`;
  };
  const badge = (r) => {
    const [c, k] = kindBadge(r);
    return `<span class="badge ${c}">${t(k)}</span>`;
  };

  window.M = {
    LANG,
    OPT,
    t,
    L,
    R,
    nm,
    desc,
    statLine,
    feat,
    ic,
    star,
    art,
    badge,
    srcName,
    IMG
  };
})();
