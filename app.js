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

/* ---------- state ---------- */
const S = {
  lang: 'ru',
  route: '',
  std:  { n: 1, rarity: 'common', src: { core: true, hnf: true } },
  alt:  { rarity: 'common', hope: 1, fear: 2 },
  wond: { n: 1 },
  comm: { c: 'Highborne', n: 1 },
  tables: { t: 'core_item', q: '', view: 'list', anchor: '' },
  search: { q: '' },
  help: '',
  kind: { item: true, consumable: true },  // shared filter, applies wherever both can show up
  lists: [],
  activeList: '',
  listDraft: '',
  newListFor: '',
  newListDraft: '',
  importDraft: ''
};

/* ---------- i18n ---------- */
const T = {
  ru: {
    tabs: { std:'Обычные правила', alt:'Альт. таблицы', wondrous:'Wondrous', community:'Сообщества', tables:'Таблицы', lists:'Списки', search:'Поиск' },
    or:'ИЛИ',
    item:'Предмет', cons:'Расходник',
    srcCore:'Core', srcHnf:'Hope & Fear', srcWond:'Wondrous', srcComm:'Сообщества',
    rollResult:'Результат броска', roll:'Бросить', rollDuality:'Бросить кости',
    copyName:'Скопировать название', copied:'Скопировано',
    rarity:'Редкость', dice:'Кости', tier:'Ранг',
    viewGrid:'Сеткой', viewList:'Списком', view:'Вид',
    common:'Обычная', uncommon:'Необычная', rare:'Редкая', veryRare:'Очень редкая', legendary:'Легендарная',
    hopeDie:'Кость Надежды', fearDie:'Кость Страха',
    crit:'Критический успех!', critSub:'Игрок берёт любую позицию из таблицы этой редкости. Мастер может разрешить подняться на ступень выше.',
    bumpTo:'Поднять до',
    filter:'Показать', fItems:'Предметы', fCons:'Расходники', keepOneKind:'Нужен хотя бы один тип',
    community:'Сообщество', source:'Источник', keepOneSource:'Нужен хотя бы один источник',
    importList:'Восстановить из ссылки', importBtn:'Восстановить',
    importPh:'Вставьте ссылку на список',
    toLists:'В списки', cancel:'Отмена',
    listNotFound:'Список не найден', listNotFoundSub:'Возможно, он удалён или открыт в другом браузере.',
    lists:'Списки', newList:'Новый список', listNamePh:'Например: клад в логове дракона', create:'Создать',
    untitled:'Без названия', noLists:'Списков пока нет — создайте первый выше',
    collectHere:'Пополнять', collecting:'Пополняю', collectingInto:'Пополняю список:', stopCollecting:'Готово',
    addToList:'Добавить', inList:'Добавлено', removeItem:'Убрать из списка',
    share:'Поделиться', del:'Удалить', rename:'Название списка',
    listEmpty:'Список пуст', listEmptyHint:'Список пуст. Нажмите «Пополнять», походите по таблицам и добавляйте позиции кнопкой «+».',
    sharedList:'Список от другого игрока', saveToMine:'Сохранить себе', savedToLists:'Список сохранён',
    badShare:'Ссылка повреждена или собрана в другой версии данных.',
    deleteConfirm:'Удалить список «%s»? Это действие необратимо.',
    saveFailed:'Не удалось сохранить: браузер блокирует локальное хранилище',
    noStorageTitle:'Браузер блокирует локальное хранилище.',
    noStorage:'Списки не сохранятся после перезагрузки страницы. Обычно так бывает в режиме инкогнито или при запрете сайту хранить данные. Ссылкой поделиться всё равно можно.',
    localOnlyTitle:'Списки живут только в этом браузере.',
    localOnly:'Сервера у приложения нет. Очистка данных сайта, режим инкогнито или другое устройство — и списки пропадут. Чтобы не потерять, нажмите «Поделиться» и сохраните ссылку: из неё список восстанавливается целиком.',
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
    openPage:'Страница', openTable:'Открыть таблицу', toStart:'На главную',
    rollNo:'номер', notFound:'Предмет не найден', notFoundSub:'Возможно, ссылка устарела или данные были изменены.',
    hope:'Надежда', fear:'Страх',
    foot:'Данные: Daggerheart Core Set, Hope &amp; Fear, Wondrous Loot, Community Magic Items, Alternate Loot &amp; Consumable Tables. Перевод: daggerheart.su и собственные материалы. Daggerheart © Darrington Press.',
    whatIsThis:'Как это работает',
    help: {
      std: [
        'Выберите редкость, бросьте указанное на чипе количество d12 и сложите результаты. Одно и то же число есть и в таблице предметов, и в таблице расходников, поэтому на один бросок приходится несколько вариантов — игрок выбирает один.',
        '<b>Обычная</b> — в заброшенном лагере или в обычной лавке.<br><b>Необычная</b> — ограниченный товар в лавке, тайник в лагере, часть награды.<br><b>Редкая</b> — под замком в лавке, единственная награда за работу, из вещей сильного НИП.<br><b>Легендарная</b> — единственная в своём роде, награда за смертельно опасное дело, сокровище могущественного противника.',
        'Ранги у редкостей — рекомендация, а не ограничение. Мастер вправе выдать снаряжение любой редкости на любом уровне, если это уместно за столом.',
        'Источник можно сузить до одной книги — но хотя бы одна должна остаться выбранной.'
      ],
      alt: [
        'Предметы распределены между колонками «Надежда» и «Страх» в зависимости от их тематики и назначения. К «Надежде» отнесены предметы, предназначенные для помощи, защиты и решения практических задач, а к «Страху» — те, что служат для причинения вреда, обмана и скрытных уловок.',
        'Выберите редкость и бросьте Кости Дуальности. Игрок выбирает между вариантом по Кости Надежды и вариантом по Кости Страха.',
        'При критическом успехе, когда обе кости совпали, игрок берёт любую позицию из таблицы этой редкости, а Мастер может разрешить подняться на ступень выше.',
        'Ранги у редкостей — рекомендация, а не ограничение.'
      ],
      wondrous: [
        'В таблице 119 позиций вместо ста: столько есть иллюстраций. Кнопка d100 бросает 1–100, кнопка d119 — по всей таблице.',
        'Позиции перечислены по алфавиту, а не по силе. Большинство из них слабой или средней силы.',
        'Некоторые предметы можно переработать в более сильные — это указано в описании. Мастер может потребовать для этого бросок Искусности или Знания.'
      ],
      community: [
        'Предметы каждого сообщества перечислены по возрастанию редкости: 1 — самый простой, 10 — самый сильный.',
        'Такие предметы уместны как награда от сообщества, семейная реликвия или находка на его территории.'
      ],
      lists: [
        'Создайте список, нажмите «Пополнять» и ходите по таблицам — на карточках и строках появится кнопка «+». Либо кликните по картинке предмета и отметьте нужные списки в блоке «В списки».',
        'Кнопка «Поделиться» кладёт в буфер ссылку, внутри которой закодирован весь состав. Сервер не нужен: тот, кто её откроет, увидит список и сможет сохранить копию себе.',
        'Поле «Восстановить из ссылки» принимает такую ссылку обратно — получится обычный список, который можно править. Хранятся в нём только название и id позиций, поэтому правки в данных подхватятся сами.'
      ]
    },
    pages: {
      std:   ['Обычные правила', 'Бросок по таблицам корника и дополнения Hope &amp; Fear.'],
      alt:   ['Альтернативные таблицы', 'Бросок Костей Дуальности по объединённым таблицам обеих книг.'],
      wondrous: ['Wondrous Loot', 'Бросьте d100 и введите результат.'],
      community: ['Предметы сообществ', 'Выберите происхождение и бросьте d10.'],
      tables: ['Таблицы', 'Все таблицы целиком — можно листать вручную, искать и открывать карточки.'],
      lists: ['Списки', 'Соберите добычу в список и отправьте игрокам одной ссылкой.'],
      search: ['Поиск', 'Поиск по всем 449 предметам и расходникам сразу, на русском и на английском.']
    },
  },
  en: {
    tabs: { std:'Standard rules', alt:'Alt. tables', wondrous:'Wondrous', community:'Communities', tables:'Tables', lists:'Lists', search:'Search' },
    or:'OR',
    item:'Item', cons:'Consumable',
    srcCore:'Core', srcHnf:'Hope & Fear', srcWond:'Wondrous', srcComm:'Communities',
    rollResult:'Roll result', roll:'Roll', rollDuality:'Roll the dice',
    copyName:'Copy name', copied:'Copied',
    rarity:'Rarity', dice:'Dice', tier:'Tier',
    viewGrid:'Grid', viewList:'List', view:'View',
    common:'Common', uncommon:'Uncommon', rare:'Rare', veryRare:'Very rare', legendary:'Legendary',
    hopeDie:'Hope Die', fearDie:'Fear Die',
    crit:'Critical success!', critSub:'The player takes any entry from this rarity table. The GM may allow bumping up one rarity.',
    bumpTo:'Bump to',
    filter:'Show', fItems:'Items', fCons:'Consumables', keepOneKind:'At least one type has to stay on',
    community:'Community', source:'Source', keepOneSource:'At least one source has to stay on',
    importList:'Restore from a link', importBtn:'Restore',
    importPh:'Paste a list link',
    toLists:'Add to lists', cancel:'Cancel',
    listNotFound:'List not found', listNotFoundSub:'It may have been deleted, or it lives in another browser.',
    lists:'Lists', newList:'New list', listNamePh:'For example: dragon hoard', create:'Create',
    untitled:'Untitled', noLists:'No lists yet — create one above',
    collectHere:'Fill', collecting:'Filling', collectingInto:'Filling list:', stopCollecting:'Done',
    addToList:'Add', inList:'Added', removeItem:'Remove from the list',
    share:'Share', del:'Delete', rename:'List name',
    listEmpty:'The list is empty', listEmptyHint:'The list is empty. Hit "Fill", browse the tables and add entries with "+".',
    sharedList:'A list from another player', saveToMine:'Save to my lists', savedToLists:'List saved',
    badShare:'The link is damaged or was built from a different data version.',
    deleteConfirm:'Delete the list "%s"? This cannot be undone.',
    saveFailed:'Could not save: the browser is blocking local storage',
    noStorageTitle:'The browser is blocking local storage.',
    noStorage:'Lists will not survive a page reload. This usually happens in private mode or when the site is denied storage. Sharing a link still works.',
    localOnlyTitle:'Lists live in this browser only.',
    localOnly:'There is no server behind this app. Clearing site data, private mode or another device and the lists are gone. Hit Share and keep the link: a list rebuilds from it completely.',
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
    openPage:'Page', openTable:'Open table', toStart:'Home',
    rollNo:'roll', notFound:'Item not found', notFoundSub:'The link may be out of date, or the data has changed.',
    hope:'Hope', fear:'Fear',
    foot:'Data: Daggerheart Core Set, Hope &amp; Fear, Wondrous Loot, Community Magic Items, Alternate Loot &amp; Consumable Tables. Russian text: daggerheart.su and custom material. Daggerheart © Darrington Press.',
    whatIsThis:'How this works',
    help: {
      std: [
        'Pick a rarity, roll the number of d12s shown on the chip and add them up. The same number exists in both the item and the consumable table, so one roll yields several options and the player takes one.',
        '<b>Common</b> — an abandoned camp or a local shop.<br><b>Uncommon</b> — limited stock in a shop, a protected place in a camp, part of a reward.<br><b>Rare</b> — under lock and key, the sole reward for a job, a powerful NPC’s possessions.<br><b>Legendary</b> — the only one of its kind, a reward for a deadly job, a powerful adversary’s treasure.',
        'Tiers attached to rarities are a recommendation, not a limit. The GM may hand out any rarity at any level if it suits the table.',
        'The source can be narrowed to a single book, but at least one has to stay on.'
      ],
      alt: [
        'Items were sorted into the “Hope” and “Fear” column based on theme and function, with Hope leaning towards aid, protection and utility, and Fear leaning towards harm, deception and subterfuge.',
        'Choose a rarity and roll the Duality Dice. The player picks between the entry matching the Hope Die and the one matching the Fear Die.',
        'On a critical success, when both dice match, the player may take any entry from that rarity table, and the GM may allow jumping up a rarity.',
        'Tiers attached to rarities are a recommendation, not a limit.'
      ],
      wondrous: [
        'The table holds 119 entries rather than a hundred — that is how many illustrations exist. The d100 button rolls 1–100, the d119 button covers the whole table.',
        'Entries are listed alphabetically, not by power level, and most are of low to moderate power.',
        'Some entries can be crafted into stronger ones, as noted in their description. The GM may require a Finesse or Knowledge roll to do so.'
      ],
      community: [
        'Each community lists its items in ascending order of rarity: 1 is the humblest, 10 the most powerful.',
        'They fit best as a reward from that community, a family heirloom, or a find on its territory.'
      ],
      lists: [
        'Create a list, hit “Fill” and browse the tables — a “+” appears on cards and rows. Or click an item’s picture and tick the lists you want in the “Add to lists” block.',
        'The Share button copies a link with the whole list encoded inside it. No server involved: whoever opens it sees the list and can save a copy.',
        'The “Restore from a link” field takes such a link back and rebuilds an ordinary, editable list. Only the name and item ids are stored, so edits to the data are picked up automatically.'
      ]
    },
    pages: {
      std:   ['Standard rules', 'A roll over the core book and the Hope &amp; Fear tables.'],
      alt:   ['Alternate tables', 'Pick a rarity and enter the player’s Duality Dice. The Hope column and the Fear column give different options; on a crit the player picks anything from the table.'],
      wondrous: ['Wondrous Loot', 'Roll d100 and enter the result.'],
      community: ['Community items', 'Pick an origin and roll d10.'],
      tables: ['Tables', 'Every table in full — browse, search and open cards.'],
      lists: ['Lists', 'Collect loot into a list and send it to your players as a single link.'],
      search: ['Search', 'Search all 449 items and consumables at once, in Russian and English.']
    },
  }
};
const t = () => T[S.lang];

const RARITIES4 = ['common','uncommon','rare','legendary'];
const RARITIES5 = ['common','uncommon','rare','very_rare','legendary'];
const RAR_KEY = { common:'common', uncommon:'uncommon', rare:'rare', very_rare:'veryRare', legendary:'legendary' };
/* Russian needs the genitive after "поднять до" */
const RAR_GEN_RU = { common:'Обычной', uncommon:'Необычной', rare:'Редкой', very_rare:'Очень редкой', legendary:'Легендарной' };
const DICE = { common:[1,2], uncommon:[2,3], rare:[3,4], legendary:[4,5] };
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
  { id:'alt_consumable',   ru:'Альт. — расходники',     en:'Alt. — consumables' }
];

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
function shareText(it){ return nameForShare(it) + '\n\n' + descOf(it); }
function shareHtml(it){ return '<b>' + esc(nameForShare(it)) + '</b><br><br>' + esc(descOf(it)); }
function descOf(it){ return S.lang === 'ru' ? (it.rud || it.ende) : it.ende; }

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
const ICON_LINK = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style="flex:none"><path d="M3.9 12a5.1 5.1 0 0 1 5.1-5.1h4V5H9a7 7 0 0 0 0 14h4v-1.9H9A5.1 5.1 0 0 1 3.9 12zM8 13h8v-2H8v2zm7-8v1.9h4a5.1 5.1 0 0 1 0 10.2h-4V19h4a7 7 0 0 0 0-14h-4z"/></svg>';

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

function createList(name){
  const l = { id: newId(), name: (name || '').trim() || t().untitled, ids: [], created: Date.now() };
  S.lists.unshift(l); saveLists();
  return l;
}
function deleteList(id){
  S.lists = S.lists.filter(l => l.id !== id);
  if (S.activeList === id) S.activeList = '';
  saveLists();
}
function toggleInList(listId, itemId){
  const l = getList(listId); if (!l) return;
  const i = l.ids.indexOf(itemId);
  if (i >= 0) l.ids.splice(i, 1); else l.ids.push(itemId);
  saveLists();
}

/* Share payload: base64url of "name\nid,id,id" — short enough to paste anywhere */
function encodeList(l){
  const bytes = new TextEncoder().encode(l.name + '\n' + l.ids.join(','));
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
    const ids = (nl >= 0 ? raw.slice(nl + 1) : '').split(',').filter(function (id) { return BY_ID[id]; });
    return ids.length ? { name: name, ids: ids } : null;
  } catch (e) { return null; }
}
function listShareUrl(l){
  return baseUrl() + (hosted() ? '' : 'index.html') + '#/l/' + encodeList(l);
}
function listAsText(l){
  return l.name + '\n\n' + listItems(l).map(function (it) {
    return nameForShare(it) + '\n' + descOf(it);
  }).join('\n\n');
}
function listAsHtml(l){
  return '<b>' + esc(l.name) + '</b><br><br>' + listItems(l).map(function (it) {
    return '<b>' + esc(nameForShare(it)) + '</b><br>' + esc(descOf(it));
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

function shareItem(id){
  const it = BY_ID[id];
  if (!it) return;
  const url = itemUrl(id);
  if (canShare()) {
    navigator.share({ title: nameForShare(it), text: shareText(it), url: url })
      .catch(() => {});
  } else {
    copyText(url, t().linkCopied);
  }
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
    img.src = 'img/' + it.img;
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
  imageBlob(it).then(function (blob) {
    const file = new File([blob], safeFileName(it), { type: 'image/png' });
    if (navigator.canShare({ files: [file] })) {
      return navigator.share({ files: [file], text: shareText(it) });
    }
    return navigator.share({ title: nameForShare(it), text: shareText(it), url: itemUrl(it.id) });
  }).catch(function () {});
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
function listPicker(it){
  const chips = S.lists.map(function (l) {
    const inList = l.ids.indexOf(it.id) >= 0;
    return '<button type="button" class="chip' + (inList ? ' on' : '') + '"' +
      ' data-toggle-in="' + esc(l.id + ':' + it.id) + '">' +
      (inList ? '✓ ' : '') + esc(l.name) + '</button>';
  }).join('');
  const tail = S.newListFor === it.id
    ? '<span class="picker-new">' +
        '<input type="text" id="newlist" value="' + esc(S.newListDraft) + '" placeholder="' + esc(t().listNamePh) + '">' +
        '<button type="button" class="btn sm primary" data-act="createFor" data-val="' + esc(it.id) + '">' + esc(t().create) + '</button>' +
        '<button type="button" class="btn sm ghost" data-act="cancelNew">' + esc(t().cancel) + '</button>' +
      '</span>'
    : '<button type="button" class="chip ghost" data-act="newListFor" data-val="' + esc(it.id) + '">+ ' + esc(t().newList) + '</button>';
  return '<div class="picker" data-picker="' + esc(it.id) + '">' +
    '<span class="lbl">' + esc(t().toLists) + '</span>' +
    '<div class="chips">' + chips + tail + '</div>' +
  '</div>';
}

function refreshPicker(el){
  const box = el.closest('.picker');
  if (!box) return;
  const it = BY_ID[box.dataset.picker];
  if (!it) return;
  box.outerHTML = listPicker(it);
  const input = document.getElementById('newlist');
  if (input) input.focus();
}

function cardCollectBtn(it){
  if (!S.activeList) return '';
  const l = getList(S.activeList); if (!l) return '';
  const inList = l.ids.indexOf(it.id) >= 0;
  return '<button type="button" class="btn sm' + (inList ? ' on' : '') + '" data-toggle-list="' + esc(it.id) + '"' +
    ' title="' + esc(l.name) + '">' + (inList ? '✓ ' : '+ ') + esc(inList ? t().inList : t().addToList) + '</button>';
}

/* opt.full  — big picture on top (item page / modal); otherwise a compact row
   opt.col   — 'hope' | 'fear' badge for the alternate tables
   opt.rollLabel — overrides the number shown in the meta row */
function cardHTML(it, opt){
  opt = opt || {};
  const nm = nameOf(it), ds = descOf(it);
  const meta =
    ((opt.rollLabel !== false && it.roll) ? '<span class="badge num">' + esc(opt.rollLabel || it.roll) + '</span>' : '') +
    (opt.col ? '<span class="badge ' + opt.col + '">' + esc(opt.col === 'hope' ? t().hope : t().fear) + '</span>' : '') +
    '<span class="badge ' + (it.kind === 'consumable' ? 'cons' : 'item') + '">' +
      esc(it.kind === 'consumable' ? t().cons : t().item) + '</span>' +
    '<span class="badge src">' + esc(srcLabel(it)) + '</span>';

  const nameEl = opt.full
    ? '<span>' + esc(nm) + '</span>'
    : '<a href="#/i/' + esc(it.id) + '" title="' + esc(t().openPage) + '">' + esc(nm) + '</a>';

  return '' +
  '<article class="card' + (opt.full ? ' full' : ' compact') + '" data-id="' + esc(it.id) + '">' +
    '<button type="button" class="card-media" data-open="' + esc(it.id) + '" aria-label="' + esc(t().openPage) + '">' +
      '<img src="img/' + esc(it.img) + '" alt="" loading="lazy" decoding="async">' +
    '</button>' +
    '<div class="card-body">' +
      '<div class="card-meta">' + meta + '</div>' +
      '<h3 class="card-name">' + nameEl +
        '<span class="card-name-acts">' +
          '<button type="button" data-copy-name="' + esc(it.id) + '" title="' + esc(t().copyName) + '" aria-label="' + esc(t().copyName) + '">' + ICON_COPY + '</button>' +
          '<button type="button" data-share="' + esc(it.id) + '" title="' + esc(t().copyLink) + '" aria-label="' + esc(t().copyLink) + '">' + ICON_LINK + '</button>' +
        '</span>' +
      '</h3>' +
      '<p class="card-desc">' + esc(ds) + '</p>' +
      '<div class="card-acts">' +
        actBtn('send', it.id, ICON_SHARE, t().sendAll, true) +
        actBtn('copy-img',  it.id, ICON_IMG,  t().sImg,  false, t().copyImg) +
        actBtn('copy-full', it.id, ICON_COPY, t().sText, false, t().copyText) +
        (opt.full ? '' : cardCollectBtn(it)) +
      '</div>' +
      (opt.full ? listPicker(it) : '') +
    '</div>' +
  '</article>';
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
const KINDS = [['item','fItems'], ['consumable','fCons']];

function kindChips(){
  return '<div class="field"><span class="lbl">' + esc(t().filter) + '</span><div class="chips">' +
    KINDS.map(function (k) {
      const on = !!S.kind[k[0]];
      const last = on && KINDS.filter(function (x) { return S.kind[x[0]]; }).length === 1;
      return '<button type="button" class="chip' + (on ? ' on' : '') + '"' +
        ' data-act="kind" data-val="' + k[0] + '"' +
        ' aria-pressed="' + (on ? 'true' : 'false') + '"' +
        (last ? ' data-last="1" title="' + esc(t().keepOneKind) + '"' : '') + '>' +
        esc(t()[k[1]]) + '</button>';
    }).join('') +
  '</div></div>';
}
function kindAllows(kind){ return !!S.kind[kind]; }

function rarityChips(list, cur, act, mode){
  return '<div class="chips">' + list.map(r => {
    const sub = mode === 'tiers'
      ? t().tier + ' ' + TIERS[r]
      : (DICE[r] ? DICE[r].map(n => n + 'd12').join(' / ') : '');
    return '<button type="button" class="chip' + (r === cur ? ' on' : '') + '" data-act="' + act + '" data-val="' + r + '">' +
      esc(t()[RAR_KEY[r]]) + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</button>';
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

  return pageHead('std') +
  '<div class="panel">' +
    '<div class="field"><span class="lbl">' + esc(t().rarity) + ' · ' + esc(t().dice) + '</span>' +
      rarityChips(RARITIES4, st.rarity, 'rarity') +
    '</div>' +
    '<div class="field"><span class="lbl">' + esc(t().rollResult) + ' (1–60)</span>' +
      '<div class="numrow">' + numBox('n', st.n, 1, 60) +
        '<button type="button" class="btn primary" data-act="roll">' + ICON_DIE + esc(t().roll) + ' ' + DICE[st.rarity][0] + 'd12</button>' +
        '<button type="button" class="btn ghost" data-act="roll2">' + DICE[st.rarity][1] + 'd12</button>' +
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
    kindChips() +
  '</div>' +
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
    '<div class="field"><span class="lbl">' + esc(t().rarity) + '</span>' + rarityChips(RARITIES5, st.rarity, 'rarity', 'tiers') + '</div>' +
    '<div class="field"><span class="lbl">' + esc(t().rollResult) + '</span>' +
      '<div class="numrow">' +
        '<div class="dieblock"><span class="dielbl h">' + esc(t().hopeDie) + '</span>' + numBox('hope', st.hope, 1, 12, 'hope') + '</div>' +
        '<div class="dieblock"><span class="dielbl f">' + esc(t().fearDie) + '</span>' + numBox('fear', st.fear, 1, 12, 'fear') + '</div>' +
        '<div style="display:flex;align-items:flex-end"><button type="button" class="btn primary" data-act="rollDuality">' + ICON_DIE + esc(t().rollDuality) + '</button></div>' +
      '</div>' +
    '</div>' +
    kindChips() +
  '</div>' +
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
        '<button type="button" class="btn primary" data-act="roll">' + ICON_DIE + esc(t().roll) + ' d' + max + '</button>' +
        '<button type="button" class="btn ghost" data-act="roll100">d100</button>' +
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
        '<button type="button" class="btn primary" data-act="roll">' + ICON_DIE + esc(t().roll) + ' d10</button>' +
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
  if (st.t.indexOf('alt_') === 0) {
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

function renderList(list){
  return S.tables.view === 'list'
    ? '<div class="rows">' + list.map(function (it) { return rowHTML(it); }).join('') + '</div>'
    : '<div class="tgrid">' + list.map(tileHTML).join('') + '</div>';
}

/* removeFrom: render a remove button instead of the collect toggle (list view) */
function rowHTML(it, removeFrom){
  if (typeof removeFrom !== 'string') removeFrom = '';
  return '<div class="row">' +
      '<button type="button" class="row-main" data-open="' + esc(it.id) + '">' +
        '<img src="img/' + esc(it.img) + '" alt="" loading="lazy" decoding="async">' +
        '<span class="rt"><b><span class="rnum">' + esc(it.roll) + '</span>' + esc(nameOf(it)) + '</b>' +
        '<span>' + esc(descOf(it)) + '</span></span>' +
        '<span class="rm"><span class="badge ' + (it.kind === 'consumable' ? 'cons' : 'item') + '">' +
          esc(it.kind === 'consumable' ? t().cons : t().item) + '</span>' +
        '<span class="badge src">' + esc(srcLabel(it)) + '</span></span>' +
      '</button>' +
      (removeFrom
        ? '<button type="button" class="row-x" data-remove="' + esc(removeFrom + ':' + it.id) + '" title="' + esc(t().removeItem) + '" aria-label="' + esc(t().removeItem) + '">&times;</button>'
        : collectBtn(it)) +
    '</div>';
}

/* Shown only while a list is being collected into */
function collectBtn(it){
  if (!S.activeList) return '';
  const l = getList(S.activeList); if (!l) return '';
  const inList = l.ids.indexOf(it.id) >= 0;
  return '<button type="button" class="row-add' + (inList ? ' on' : '') + '"' +
    ' data-toggle-list="' + esc(it.id) + '"' +
    ' title="' + esc(inList ? t().inList : t().addToList) + '"' +
    ' aria-label="' + esc(inList ? t().inList : t().addToList) + '">' + (inList ? '✓' : '+') + '</button>';
}

function tileHTML(it){
  const sub = S.lang === 'ru' ? it.en : (it.ru || '');
  return '<div class="tilewrap">' + collectBtn(it) +
    '<button type="button" class="tile" data-open="' + esc(it.id) + '">' +
    '<div class="tile-img">' +
      '<span class="tile-n">' + esc(it.roll) + '</span>' +
      '<span class="tile-k ' + (it.kind === 'consumable' ? 'cons' : 'item') + '" title="' + esc(it.kind === 'consumable' ? t().cons : t().item) + '"></span>' +
      '<img src="img/' + esc(it.img) + '" alt="" loading="lazy" decoding="async">' +
    '</div>' +
    '<div class="tile-b"><b>' + esc(nameOf(it)) + '</b>' + (sub ? '<span>' + esc(sub) + '</span>' : '') + '</div>' +
  '</button></div>';
}

/* ---- search ---- */
function matches(it, q){
  return (it.ru && it.ru.toLowerCase().indexOf(q) >= 0) ||
         (it.en && it.en.toLowerCase().indexOf(q) >= 0) ||
         (it.rud && it.rud.toLowerCase().indexOf(q) >= 0) ||
         (it.ende && it.ende.toLowerCase().indexOf(q) >= 0);
}
function renderSearch(){
  const q = S.search.q.trim().toLowerCase();
  let body;
  if (!q) {
    body = '<div class="empty">' + esc(S.lang === 'ru' ? 'Начните вводить запрос' : 'Start typing') + '</div>';
  } else {
    const res = ALL.filter(x => kindAllows(x.kind) && matches(x, q)).slice(0, 300);
    body = res.length ? '<div class="rows">' + res.map(function (it) { return rowHTML(it); }).join('') + '</div>'
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
function storageWarning(){
  if (!storageWorks()) {
    return '<div class="warn"><b>' + esc(t().noStorageTitle) + '</b> ' + esc(t().noStorage) + '</div>';
  }
  return '<div class="warn"><b>' + esc(t().localOnlyTitle) + '</b> ' + esc(t().localOnly) + '</div>';
}

function listCardHTML(l){
  const items = listItems(l);
  const thumbs = items.slice(0, 6).map(function (it) {
    return '<img src="img/' + esc(it.img) + '" alt="" loading="lazy" decoding="async">';
  }).join('');
  const active = S.activeList === l.id;
  return '<div class="listcard' + (active ? ' active' : '') + '">' +
    '<a class="listcard-main" href="#/lists/' + esc(l.id) + '">' +
      '<div class="listcard-top">' +
        '<b>' + esc(l.name) + '</b>' +
        '<span class="badge num">' + items.length + '</span>' +
      '</div>' +
      (thumbs ? '<div class="listcard-thumbs">' + thumbs + '</div>'
              : '<p class="listcard-empty">' + esc(t().listEmpty) + '</p>') +
    '</a>' +
    '<div class="listcard-acts">' +
      '<button type="button" class="btn sm' + (active ? ' primary' : '') + '" data-act="collect" data-val="' + esc(l.id) + '">' +
        esc(active ? t().collecting : t().collectHere) + '</button>' +
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
  const active = S.activeList === l.id;
  return '<h1 class="page-h">' +
      '<input type="text" id="rename" class="titleinput" value="' + esc(l.name) + '" data-list="' + esc(l.id) + '" aria-label="' + esc(t().rename) + '">' +
    '</h1>' +
    '<p class="page-sub">' + esc(items.length + ' ' + plural(items.length)) + '</p>' +
    '<div class="card-acts" style="margin-bottom:16px">' +
      '<button type="button" class="btn sm' + (active ? ' primary' : '') + '" data-act="collect" data-val="' + esc(l.id) + '">' +
        esc(active ? t().collecting : t().collectHere) + '</button>' +
      '<button type="button" class="btn sm" data-share-list="' + esc(l.id) + '">' + ICON_LINK + esc(t().share) + '</button>' +
      '<button type="button" class="btn sm" data-copy-listtext="' + esc(l.id) + '">' + ICON_COPY + esc(t().copyText) + '</button>' +
      '<button type="button" class="btn sm danger" data-del-list="' + esc(l.id) + '">' + esc(t().del) + '</button>' +
    '</div>' +
    storageWarning() +
    (items.length
      ? '<div class="rows" style="margin-top:16px">' + items.map(function (it) { return rowHTML(it, l.id); }).join('') + '</div>'
      : '<div class="empty">' + esc(t().listEmptyHint) + '</div>');
}

function renderSharedList(payload){
  const data = decodeList(payload);
  if (!data) {
    return '<h1 class="page-h">' + esc(t().notFound) + '</h1>' +
      '<p class="page-sub">' + esc(t().badShare) + '</p>' +
      '<a class="btn primary" href="#/roll/std">' + esc(t().toStart) + '</a>';
  }
  const items = data.ids.map(function (id) { return BY_ID[id]; });
  return '<h1 class="page-h">' + esc(data.name || t().untitled) + '</h1>' +
    '<p class="page-sub">' + esc(t().sharedList) + ' · ' + esc(items.length + ' ' + plural(items.length)) + '</p>' +
    '<div class="card-acts" style="margin-bottom:18px">' +
      '<button type="button" class="btn primary" data-act="saveShared" data-val="' + esc(payload) + '">' + esc(t().saveToMine) + '</button>' +
    '</div>' +
    '<div class="rows">' + items.map(function (it) { return rowHTML(it); }).join('') + '</div>';
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
    '<p class="page-sub">' + esc(where) + ' · ' + esc(t().rollNo) + ' ' + esc(it.roll) + '</p>' +
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

const TABLES_RE = /^tables(?:\/([a-z_]+))?(?:\/([A-Za-z_]+))?$/;

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
    if (m[1] && TABLE_DEFS.some(d => d.id === m[1])) S.tables.t = m[1];
    S.tables.anchor = m[2] || '';
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
function refreshToggle(el){
  const l = getList(S.activeList); if (!l) return;
  const inList = l.ids.indexOf(el.dataset.toggleList) >= 0;
  el.classList.toggle('on', inList);
  const label = inList ? t().inList : t().addToList;
  el.title = label; el.setAttribute('aria-label', label);
  el.textContent = el.classList.contains('row-add')
    ? (inList ? '✓' : '+')
    : (inList ? '✓ ' : '+ ') + label;
}

function renderCollectBar(){
  const bar = $('#collectBar');
  const l = S.activeList ? getList(S.activeList) : null;
  if (!l) { bar.hidden = true; bar.innerHTML = ''; return; }
  bar.hidden = false;
  bar.innerHTML = '<div class="wrap collect-in">' +
    '<span class="collect-txt">' + esc(t().collectingInto) + ' <a href="#/lists/' + esc(l.id) + '"><b>' + esc(l.name) + '</b></a>' +
      ' <span class="badge num">' + l.ids.length + '</span></span>' +
    '<button type="button" class="btn sm" data-act="collectOff">' + esc(t().stopCollecting) + '</button>' +
  '</div>';
}

function render(){
  const r = currentRoute();
  S.route = r;
  renderTabs();
  renderCollectBar();
  if (r.indexOf('i/') === 0) {
    const id = r.slice(2);
    $('#view').innerHTML = renderItemPage(id);
    const it = BY_ID[id];
    document.title = (it ? nameOf(it) + ' — ' : '') + 'Генератор лута Daggerheart';
  } else if (r.indexOf('lists/') === 0) {
    $('#view').innerHTML = renderOneList(r.slice(6));
    document.title = 'Генератор лута — Daggerheart';
  } else if (r.indexOf('l/') === 0) {
    $('#view').innerHTML = renderSharedList(r.slice(2));
    document.title = 'Генератор лута — Daggerheart';
  } else {
    $('#view').innerHTML = ROUTES[r]();
    document.title = 'Генератор лута — Daggerheart';
  }
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
  if (closeEl) { $('#modal').hidden = true; return; }

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

  const ti = e.target.closest('[data-toggle-in]');
  if (ti) {
    const parts = ti.dataset.toggleIn.split(':');
    toggleInList(parts[0], parts[1]);
    refreshPicker(ti);
    renderCollectBar();
    return;
  }

  const tg = e.target.closest('[data-toggle-list]');
  if (tg) {
    toggleInList(S.activeList, tg.dataset.toggleList);
    // patch the button in place: a full re-render would drop scroll position
    // and make adding several entries in a row impossible
    refreshToggle(tg);
    renderCollectBar();
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

  const clt = e.target.closest('[data-copy-listtext]');
  if (clt) { const l = getList(clt.dataset.copyListtext); if (l) copyRich(listAsHtml(l), listAsText(l), t().listCopied); return; }

  const dl = e.target.closest('[data-del-list]');
  if (dl) {
    const l = getList(dl.dataset.delList);
    if (l && confirm(t().deleteConfirm.replace('%s', l.name))) {
      deleteList(l.id);
      if (S.route.indexOf('lists/') === 0) { location.hash = '#/lists'; return; }
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
  if (a === 'src') {
    // never leave the roll with nothing to draw from
    if (act.dataset.last) { toast(t().keepOneSource); return; }
    S.std.src[val] = !S.std.src[val];
    render(); return;
  }
  if (a === 'collect')    { S.activeList = S.activeList === val ? '' : val; render(); return; }
  if (a === 'collectOff') { S.activeList = ''; render(); return; }
  if (a === 'createList') {
    const input = document.getElementById('lname');
    const l = createList(input ? input.value : '');
    S.listDraft = ''; S.activeList = l.id;
    location.hash = '#/lists/' + l.id;
    return;
  }
  if (a === 'newListFor') {
    S.newListFor = val; S.newListDraft = '';
    refreshPicker(act);
    return;
  }
  if (a === 'cancelNew') {
    S.newListFor = ''; S.newListDraft = '';
    refreshPicker(act);
    return;
  }
  if (a === 'createFor') {
    const input = document.getElementById('newlist');
    const l = createList(input ? input.value : '');
    l.ids.push(val); saveLists();
    S.newListFor = ''; S.newListDraft = '';
    // deliberately not switching on collect mode here: the user asked to add
    // one item, not to start filling a list
    refreshPicker(act);
    renderCollectBar();
    return;
  }
  if (a === 'importList') {
    const field = document.getElementById('limport');
    const raw = (field ? field.value : '').trim();
    // accept a whole URL or just the payload
    const m = /#\/l\/([A-Za-z0-9_-]+)/.exec(raw);
    const data = decodeList(m ? m[1] : raw);
    if (!data) { toast(t().badShare, true); return; }
    const l = createList(data.name);
    l.ids = data.ids.slice(); saveLists();
    S.importDraft = '';
    location.hash = '#/lists/' + l.id;
    return;
  }
  if (a === 'saveShared') {
    const data = decodeList(val);
    if (!data) return;
    const l = createList(data.name);
    l.ids = data.ids.slice(); saveLists();
    toast(t().savedToLists);
    location.hash = '#/lists/' + l.id;
    return;
  }
  if (a === 'comm')   { S.comm.c = val; S.comm.n = 1; render(); return; }
  if (a === 'view')   { S.tables.view = val; render(); return; }

  if (a === 'roll' || a === 'roll2') {
    if (S.route === 'roll/wondrous') { st.n = d(DATA.wondrous.length); }
    else if (S.route === 'roll/community') { st.n = d(10); }
    else {
      const nd = DICE[st.rarity][a === 'roll' ? 0 : 1];
      st.n = clamp(rollNd12(nd), 1, 60);
    }
    render(); return;
  }
  if (a === 'roll100') { S.wond.n = clamp(d(100), 1, DATA.wondrous.length); render(); return; }
  if (a === 'rollDuality') {
    S.alt.hope = d(12); S.alt.fear = d(12);
    render(); return;
  }
});


function applyNum(id, v){
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
  if (el.id === 'rename') {
    const l = getList(el.dataset.list);
    if (l) { l.name = el.value; saveLists(); renderCollectBar(); }
  }
  if (el.id === 'tq') { S.tables.q = el.value; render._focus = 'tq'; render(); }
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') $('#modal').hidden = true;
});

function openModal(id){
  const it = BY_ID[id];
  if (!it) return;
  $('#modalBody').innerHTML = cardHTML(it, { full: true });
  $('#modal').hidden = false;
}

S.lists = loadLists();

window.addEventListener('hashchange', render);
render();

})();
