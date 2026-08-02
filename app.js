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
  core: { n: 1, rarity: 'common' },
  hnf:  { n: 1, rarity: 'common' },
  all:  { n: 1, rarity: 'common' },
  alt:  { rarity: 'common', hope: 1, fear: 2 },
  wond: { n: 1 },
  comm: { c: 'Highborne', n: 1 },
  tables: { t: 'core_item', q: '', view: 'list', anchor: '' },
  search: { q: '' },
  kind: 'all'   // shared item/consumable filter, applies on every page that can show both
};

/* ---------- i18n ---------- */
const T = {
  ru: {
    tabs: { core:'Корник', hnf:'Hope & Fear', all:'Всё сразу', alt:'Альт. таблицы', wondrous:'Wondrous', community:'Сообщества', tables:'Таблицы', search:'Поиск' },
    or:'ИЛИ',
    item:'Предмет', cons:'Расходник',
    srcCore:'Core', srcHnf:'Hope & Fear', srcWond:'Wondrous', srcComm:'Сообщества',
    rollResult:'Результат броска', roll:'Бросить', rollDuality:'Бросить Кости Дуальности',
    copyName:'Скопировать название', copied:'Скопировано',
    rarity:'Редкость', dice:'Кости', tier:'Ранг',
    viewGrid:'Сеткой', viewList:'Списком', view:'Вид',
    common:'Обычная', uncommon:'Необычная', rare:'Редкая', veryRare:'Очень редкая', legendary:'Легендарная',
    hopeDie:'Кость Надежды', fearDie:'Кость Страха',
    crit:'Критический успех!', critSub:'Игрок берёт любую позицию из таблицы этой редкости. Мастер может разрешить подняться на ступень выше.',
    critFrom:'Выбор из таблицы:', bumpTo:'Поднять до',
    filter:'Показать', fAll:'Всё', fItems:'Только предметы', fCons:'Только расходники',
    community:'Сообщество',
    searchPh:'Поиск по названию или описанию (RU / EN)…',
    nothing:'Ничего не найдено',
    sendAll:'Отправить', copyText:'Скопировать текст', copyImg:'Скопировать изображение',
    imgCopied:'Картинка скопирована', imgSaved:'Картинка сохранена', imgFailed:'Не удалось получить картинку',
    copyLink:'Скопировать ссылку', linkCopied:'Ссылка скопирована',
    openPage:'Страница', openTable:'Открыть таблицу', toStart:'На главную',
    rollNo:'номер', notFound:'Предмет не найден', notFoundSub:'Возможно, ссылка устарела или данные были изменены.',
    hope:'Надежда', fear:'Страх',
    foot:'Данные: Daggerheart Core Set, Hope &amp; Fear, Wondrous Loot, Community Magic Items, Alternate Loot &amp; Consumable Tables. Перевод: daggerheart.su и собственные материалы. Daggerheart © Darrington Press.',
    pages: {
      core:  ['Ролл по корнику', 'Введите результат броска d12 (или суммы нескольких d12) — получите предмет ИЛИ расходник под этим номером в таблицах Core Rulebook.'],
      hnf:   ['Ролл по Hope &amp; Fear', 'Введите результат броска — получите предмет ИЛИ расходник под этим номером в таблицах дополнения Hope &amp; Fear.'],
      all:   ['Ролл по всему контенту', 'Один результат броска — четыре варианта на выбор: предмет и расходник из корника и из Hope &amp; Fear.'],
      alt:   ['Альтернативные таблицы', 'Выберите редкость и введите результат Костей Дуальности игрока. Колонка Надежды и колонка Страха дают разные варианты; при крите игрок выбирает что угодно из таблицы.'],
      wondrous: ['Wondrous Loot', 'Бросьте d100 и введите результат.'],
      community: ['Предметы сообществ', 'Выберите происхождение и бросьте d10.'],
      tables: ['Таблицы', 'Все таблицы целиком — можно листать вручную, искать и открывать карточки.'],
      search: ['Поиск', 'Поиск по всем 449 предметам и расходникам сразу, на русском и на английском.']
    },
    diceGuide: {
      common:'1d12 или 2d12 — в заброшенном лагере или в обычной лавке',
      uncommon:'2d12 или 3d12 — ограниченный товар в лавке, тайник в лагере, часть награды',
      rare:'3d12 или 4d12 — под замком в лавке, единственная награда за работу, из вещей сильного НИП',
      legendary:'4d12 или 5d12 — единственный в своём роде, награда за смертельно опасное дело, сокровище могущественного противника'
    }
  },
  en: {
    tabs: { core:'Core', hnf:'Hope & Fear', all:'Everything', alt:'Alt. tables', wondrous:'Wondrous', community:'Communities', tables:'Tables', search:'Search' },
    or:'OR',
    item:'Item', cons:'Consumable',
    srcCore:'Core', srcHnf:'Hope & Fear', srcWond:'Wondrous', srcComm:'Communities',
    rollResult:'Roll result', roll:'Roll', rollDuality:'Roll Duality Dice',
    copyName:'Copy name', copied:'Copied',
    rarity:'Rarity', dice:'Dice', tier:'Tier',
    viewGrid:'Grid', viewList:'List', view:'View',
    common:'Common', uncommon:'Uncommon', rare:'Rare', veryRare:'Very rare', legendary:'Legendary',
    hopeDie:'Hope Die', fearDie:'Fear Die',
    crit:'Critical success!', critSub:'The player takes any entry from this rarity table. The GM may allow bumping up one rarity.',
    critFrom:'Choose from table:', bumpTo:'Bump to',
    filter:'Show', fAll:'All', fItems:'Items only', fCons:'Consumables only',
    community:'Community',
    searchPh:'Search by name or description (RU / EN)…',
    nothing:'Nothing found',
    sendAll:'Share', copyText:'Copy text', copyImg:'Copy image',
    imgCopied:'Image copied', imgSaved:'Image saved', imgFailed:'Could not load the image',
    copyLink:'Copy link', linkCopied:'Link copied',
    openPage:'Page', openTable:'Open table', toStart:'Home',
    rollNo:'roll', notFound:'Item not found', notFoundSub:'The link may be out of date, or the data has changed.',
    hope:'Hope', fear:'Fear',
    foot:'Data: Daggerheart Core Set, Hope &amp; Fear, Wondrous Loot, Community Magic Items, Alternate Loot &amp; Consumable Tables. Russian text: daggerheart.su and custom material. Daggerheart © Darrington Press.',
    pages: {
      core:  ['Core Rulebook roll', 'Enter your d12 (or summed d12s) result to get the item OR the consumable with that number from the Core Rulebook tables.'],
      hnf:   ['Hope &amp; Fear roll', 'Enter your roll result to get the item OR the consumable with that number from the Hope &amp; Fear expansion.'],
      all:   ['Roll across everything', 'One roll result, four options: item and consumable from Core and from Hope &amp; Fear.'],
      alt:   ['Alternate tables', 'Pick a rarity and enter the player’s Duality Dice. The Hope column and the Fear column give different options; on a crit the player picks anything from the table.'],
      wondrous: ['Wondrous Loot', 'Roll d100 and enter the result.'],
      community: ['Community items', 'Pick an origin and roll d10.'],
      tables: ['Tables', 'Every table in full — browse, search and open cards.'],
      search: ['Search', 'Search all 449 items and consumables at once, in Russian and English.']
    },
    diceGuide: {
      common:'1d12 or 2d12 — an abandoned camp or a local shop',
      uncommon:'2d12 or 3d12 — limited stock in a shop, protected place in a camp, part of a reward',
      rare:'3d12 or 4d12 — under lock and key, the sole reward for a job, a powerful NPC’s possessions',
      legendary:'4d12 or 5d12 — the only one of its kind, reward for a deadly job, a powerful adversary’s treasure'
    }
  }
};
const t = () => T[S.lang];

const RARITIES4 = ['common','uncommon','rare','legendary'];
const RARITIES5 = ['common','uncommon','rare','very_rare','legendary'];
const RAR_KEY = { common:'common', uncommon:'uncommon', rare:'rare', very_rare:'veryRare', legendary:'legendary' };
const DICE = { common:[1,2], uncommon:[2,3], rare:[3,4], legendary:[4,5] };
/* tier recommendations printed in the Alternate Loot & Consumable Tables */
const TIERS = { common:'1-2', uncommon:'1-2', rare:'2-3', very_rare:'3-4', legendary:'3-4' };
const COMMUNITIES = [
  ['Highborne','Благородные'], ['Loreborne','Учёные'], ['Orderborne','Упорядоченные'],
  ['Ridgeborne','Горцы'], ['Seaborne','Морские'], ['Slyborne','Хитроумные'],
  ['Underborne','Подземные'], ['Wanderborne','Странники'], ['Wildborne','Дикие']
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
function shareText(it){ return nameForShare(it) + '\n\n' + descOf(it); }
function descOf(it){ return S.lang === 'ru' ? (it.rud || it.ende) : it.ende; }

function srcLabel(it){
  if (it.src === 'core') return t().srcCore;
  if (it.src === 'hnf') return t().srcHnf;
  if (it.src === 'wondrous') return t().srcWond;
  return S.lang === 'ru' ? (it.community_ru || t().srcComm) : (it.community || t().srcComm);
}

function toast(msg){
  const el = $('#toast');
  el.textContent = msg; el.hidden = false;
  clearTimeout(toast._tm);
  toast._tm = setTimeout(() => { el.hidden = true; }, 1500);
}

function copyText(text){
  const done = () => toast(t().copied);
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallback(text, done));
  } else fallback(text, done);
}
function fallback(text, done){
  const ta = document.createElement('textarea');
  ta.value = text; ta.setAttribute('readonly','');
  ta.style.cssText = 'position:fixed;top:-1000px';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); done(); } catch(e){}
  document.body.removeChild(ta);
}

const ICON_COPY = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style="flex:none"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"/></svg>';
const ICON_IMG   = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style="flex:none"><path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z"/></svg>';
const ICON_SHARE = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style="flex:none"><path d="M18 16.1c-.8 0-1.5.3-2 .8l-7.1-4.2c.1-.2.1-.5.1-.7s0-.5-.1-.7L16 7.1c.5.5 1.2.8 2 .8a3 3 0 1 0-3-3c0 .3 0 .5.1.7L8 9.9a3 3 0 1 0 0 4.2l7.1 4.2c-.1.2-.1.4-.1.6a2.9 2.9 0 1 0 3-2.8z"/></svg>';
const ICON_LINK = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style="flex:none"><path d="M3.9 12a5.1 5.1 0 0 1 5.1-5.1h4V5H9a7 7 0 0 0 0 14h4v-1.9H9A5.1 5.1 0 0 1 3.9 12zM8 13h8v-2H8v2zm7-8v1.9h4a5.1 5.1 0 0 1 0 10.2h-4V19h4a7 7 0 0 0 0-14h-4z"/></svg>';

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
    copyText(url);
    toast(t().linkCopied);
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
  }).catch(function () { toast(t().imgFailed); });
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
  if (!navigator.share) { copyText(itemUrl(it.id)); toast(t().linkCopied); return; }
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
function actBtn(action, id, icon, label, primary){
  return '<button type="button" class="btn sm' + (primary ? ' primary' : '') + '"' +
    ' data-' + action + '="' + esc(id) + '"' +
    ' title="' + esc(label) + '" aria-label="' + esc(label) + '">' +
    icon + '<span class="btn-lbl">' + esc(label) + '</span></button>';
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
        '<button type="button" data-copy-name="' + esc(it.id) + '" title="' + esc(t().copyName) + '" aria-label="' + esc(t().copyName) + '">' + ICON_COPY + '</button>' +
      '</h3>' +
      '<p class="card-desc">' + esc(ds) + '</p>' +
      '<div class="card-acts">' +
        actBtn('send', it.id, ICON_SHARE, t().sendAll, true) +
        actBtn('copy-img',  it.id, ICON_IMG,  t().copyImg) +
        actBtn('copy-full', it.id, ICON_COPY, t().copyText) +
        actBtn('share',     it.id, ICON_LINK, t().copyLink) +
      '</div>' +
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

/* The same three chips everywhere, backed by one piece of state */
function kindChips(){
  return '<div class="field"><span class="lbl">' + esc(t().filter) + '</span><div class="chips">' +
    ['all','items','cons'].map(f =>
      '<button type="button" class="chip' + (f === S.kind ? ' on' : '') + '" data-act="kind" data-val="' + f + '">' +
        esc(f === 'all' ? t().fAll : f === 'items' ? t().fItems : t().fCons) + '</button>').join('') +
  '</div></div>';
}
function kindAllows(kind){
  return S.kind === 'all' || (S.kind === 'items' ? kind === 'item' : kind === 'consumable');
}

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
  return '<h1 class="page-h">' + p[0] + '</h1><p class="page-sub">' + p[1] + '</p>';
}

function pickCards(items, opts){
  return items
    .map((it, i) => [it, (opts && opts[i]) || {}])
    .filter(p => p[0] && kindAllows(p[0].kind))
    .map(p => cardHTML(p[0], p[1]));
}

/* ---- 1 & 2: Core / H&F ---- */
function renderNumbered(key){
  const st = S[key];
  const src = key === 'core' ? 'core' : 'hnf';
  const items = DATA[src + '_item'], cons = DATA[src + '_consumable'];
  const it = items[st.n - 1], co = cons[st.n - 1];

  return pageHead(key) +
  '<div class="panel">' +
    '<div class="field"><span class="lbl">' + esc(t().rarity) + ' · ' + esc(t().dice) + '</span>' +
      rarityChips(RARITIES4, st.rarity, 'rarity') +
      '<p class="hint">' + esc(t().diceGuide[st.rarity]) + '</p>' +
    '</div>' +
    '<div class="field"><span class="lbl">' + esc(t().rollResult) + ' (1–60)</span>' +
      '<div class="numrow">' + numBox('n', st.n, 1, 60) +
        '<button type="button" class="btn primary" data-act="roll">' + ICON_DIE + esc(t().roll) + ' ' + DICE[st.rarity][0] + 'd12</button>' +
        '<button type="button" class="btn ghost" data-act="roll2">' + DICE[st.rarity][1] + 'd12</button>' +
      '</div>' +
    '</div>' +
    kindChips() +
  '</div>' +
  '<div class="results">' + orGrid(pickCards([it, co])) + '</div>';
}

/* ---- 3: everything ---- */
function renderAll(){
  const st = S.all, n = st.n;
  const cards = pickCards([
    DATA.core_item[n-1], DATA.core_consumable[n-1],
    DATA.hnf_item[n-1],  DATA.hnf_consumable[n-1]
  ]);
  return pageHead('all') +
  '<div class="panel">' +
    '<div class="field"><span class="lbl">' + esc(t().rarity) + ' · ' + esc(t().dice) + '</span>' +
      rarityChips(RARITIES4, st.rarity, 'rarity') +
      '<p class="hint">' + esc(t().diceGuide[st.rarity]) + '</p>' +
    '</div>' +
    '<div class="field"><span class="lbl">' + esc(t().rollResult) + ' (1–60)</span>' +
      '<div class="numrow">' + numBox('n', st.n, 1, 60) +
        '<button type="button" class="btn primary" data-act="roll">' + ICON_DIE + esc(t().roll) + ' ' + DICE[st.rarity][0] + 'd12</button>' +
        '<button type="button" class="btn ghost" data-act="roll2">' + DICE[st.rarity][1] + 'd12</button>' +
      '</div>' +
    '</div>' +
    kindChips() +
  '</div>' +
  '<div class="results">' + orGrid(cards) + '</div>';
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
          '<span class="crit-tbl">' + esc(t().critFrom) + ' <em>' + esc(rarityLabel(st.rarity)) + '</em></span>' +
        '</div>' +
        '<div class="crit-acts">' +
          '<button type="button" class="btn sm primary" data-act="gotoTable">' + esc(t().openTable) + '</button>' +
          (nextRar ? '<button type="button" class="btn sm" data-act="rarity" data-val="' + nextRar + '">' +
            esc(t().bumpTo) + ' ' + esc(rarityLabel(nextRar)) + '</button>' : '') +
        '</div>' +
      '</div>'
    : '';


  return pageHead('alt') +
  '<div class="panel">' +
    '<div class="field"><span class="lbl">' + esc(t().rarity) + '</span>' + rarityChips(RARITIES5, st.rarity, 'rarity', 'tiers') + '</div>' +
    '<div class="field"><span class="lbl">' + esc(t().rollResult) + '</span>' +
      '<div class="numrow">' +
        '<div><span class="dielbl h">' + esc(t().hopeDie) + '</span>' + numBox('hope', st.hope, 1, 12, 'hope') + '</div>' +
        '<div><span class="dielbl f">' + esc(t().fearDie) + '</span>' + numBox('fear', st.fear, 1, 12, 'fear') + '</div>' +
        '<div style="display:flex;align-items:flex-end"><button type="button" class="btn primary" data-act="rollDuality">' + ICON_DIE + esc(t().rollDuality) + '</button></div>' +
      '</div>' +
    '</div>' +
    kindChips() +
  '</div>' +
  '<div class="results">' + critBox + orGrid(cards) + '</div>';
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
      '<p class="hint">' + esc(S.lang === 'ru'
        ? 'В таблице ' + max + ' позиций. Кнопка d100 бросает 1–100, кнопка d' + max + ' — по всей таблице.'
        : 'The table holds ' + max + ' entries. d100 rolls 1–100, d' + max + ' covers the whole table.') + '</p>' +
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
        esc(S.lang === 'ru' ? c[1] : c[0]) + (S.lang === 'ru' ? '<small>' + c[0] + '</small>' : '') + '</button>').join('') +
      '</div>' +
    '</div>' +
    '<div class="field"><span class="lbl">' + esc(t().rollResult) + ' (1–10)</span>' +
      '<div class="numrow">' + numBox('n', st.n, 1, 10) +
        '<button type="button" class="btn primary" data-act="roll">' + ICON_DIE + esc(t().roll) + ' d10</button>' +
      '</div>' +
      '<p class="hint">' + esc(S.lang === 'ru'
        ? 'Предметы сообщества перечислены по возрастанию редкости: 1 — самый простой, 10 — самый сильный.'
        : 'Community items are listed in ascending order of rarity: 1 is the humblest, 10 the most powerful.') + '</p>' +
    '</div>' +
  '</div>' +
  '<div class="results">' + orGrid([cardHTML(it)]) + '</div>';
}

/* ---- tables browse ---- */
function sectionId(key){ return 'sec-' + key; }

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
        '<span class="lbl">' + esc(rarityLabel(r)) + '</span>' +
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
          '<span class="lbl">' + esc(S.lang === 'ru' ? c[1] + ' · ' + c[0] : c[0]) + '</span>' +
          renderList(sub) + '</div>';
      }).join('');
    } else {
      body = list.length ? renderList(list) : '<div class="empty">' + esc(t().nothing) + '</div>';
    }
  }

  const searchBar = st.t.indexOf('alt_') === 0 ? '' :
    '<div class="toolbar" style="margin-top:16px">' +
      '<div class="grow"><input type="search" id="tq" value="' + esc(st.q) + '" placeholder="' + esc(t().searchPh) + '"></div>' +
      '<div class="seg small" role="group" aria-label="' + esc(t().view) + '">' +
        '<button type="button" data-act="view" data-val="list"' + (st.view === 'list' ? ' class="on"' : '') + '>' + esc(t().viewList) + '</button>' +
        '<button type="button" data-act="view" data-val="grid"' + (st.view === 'grid' ? ' class="on"' : '') + '>' + esc(t().viewGrid) + '</button>' +
      '</div>' +
    '</div>';

  return pageHead('tables') + '<div class="panel">' + chips + '</div>' + searchBar + '<div style="margin-top:6px">' + body + '</div>';
}

function renderList(list){
  return S.tables.view === 'list'
    ? '<div class="rows">' + list.map(rowHTML).join('') + '</div>'
    : '<div class="tgrid">' + list.map(tileHTML).join('') + '</div>';
}

function rowHTML(it){
  return '<button type="button" class="row" data-open="' + esc(it.id) + '">' +
      '<img src="img/' + esc(it.img) + '" alt="" loading="lazy" decoding="async">' +
      '<span class="rt"><b><span class="rnum">' + esc(it.roll) + '</span>' + esc(nameOf(it)) + '</b>' +
      '<span>' + esc(descOf(it)) + '</span></span>' +
      '<span class="rm"><span class="badge ' + (it.kind === 'consumable' ? 'cons' : 'item') + '">' +
        esc(it.kind === 'consumable' ? t().cons : t().item) + '</span>' +
      '<span class="badge src">' + esc(srcLabel(it)) + '</span></span>' +
    '</button>';
}

function tileHTML(it){
  const sub = S.lang === 'ru' ? it.en : (it.ru || '');
  return '<button type="button" class="tile" data-open="' + esc(it.id) + '">' +
    '<div class="tile-img">' +
      '<span class="tile-n">' + esc(it.roll) + '</span>' +
      '<span class="tile-k ' + (it.kind === 'consumable' ? 'cons' : 'item') + '" title="' + esc(it.kind === 'consumable' ? t().cons : t().item) + '"></span>' +
      '<img src="img/' + esc(it.img) + '" alt="" loading="lazy" decoding="async">' +
    '</div>' +
    '<div class="tile-b"><b>' + esc(nameOf(it)) + '</b>' + (sub ? '<span>' + esc(sub) + '</span>' : '') + '</div>' +
  '</button>';
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
    body = res.length ? '<div class="rows">' + res.map(rowHTML).join('') + '</div>'
                      : '<div class="empty">' + esc(t().nothing) + '</div>';
  }
  return pageHead('search') +
    '<div class="panel" style="margin-bottom:16px">' +
      '<div class="field"><input type="search" id="sq" value="' + esc(S.search.q) + '" placeholder="' + esc(t().searchPh) + '" autofocus></div>' +
      kindChips() +
    '</div>' +
    body;
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
      '<a class="btn primary" href="#/roll/core">' + esc(t().toStart) + '</a>';
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
      '<a class="btn ghost" href="#/tables">' + esc(t().openTable) + '</a>' +
      '<a class="btn ghost" href="#/roll/core">' + esc(t().toStart) + '</a>' +
    '</div>';
}

/* ============================================================
   ROUTER
   ============================================================ */
const ROUTES = {
  'roll/core': renderNumbered.bind(null, 'core'),
  'roll/hnf': renderNumbered.bind(null, 'hnf'),
  'roll/all': renderAll,
  'roll/alt': renderAlt,
  'roll/wondrous': renderWond,
  'roll/community': renderComm,
  'tables': renderTables,
  'search': renderSearch
};
const TAB_LIST = [
  ['roll/core','core','1'], ['roll/hnf','hnf','2'], ['roll/all','all','3'],
  ['roll/alt','alt','4'], ['roll/wondrous','wondrous','5'], ['roll/community','community','6'],
  ['tables','tables',''], ['search','search','']
];

const TABLES_RE = /^tables(?:\/([a-z_]+))?(?:\/([A-Za-z_]+))?$/;

function currentRoute(){
  const h = (location.hash || '').replace(/^#\/?/, '');
  if (/^i\/[\w-]+$/.test(h)) return h;
  const m = TABLES_RE.exec(h);
  if (m) {
    if (m[1] && TABLE_DEFS.some(d => d.id === m[1])) S.tables.t = m[1];
    S.tables.anchor = m[2] || '';
    return 'tables';
  }
  return ROUTES[h] ? h : 'roll/core';
}
function renderTabs(){
  const cur = currentRoute();
  $('#tabs').innerHTML = TAB_LIST.map((tab, i) =>
    '<a href="#/' + tab[0] + '" class="' + (tab[0] === cur ? 'on' : '') + (i === 6 ? ' sep' : '') + '">' +
      (tab[2] ? '<span class="n">' + tab[2] + '</span>' : '') + esc(t().tabs[tab[1]]) +
    '</a>').join('');
}
function render(){
  const r = currentRoute();
  S.route = r;
  renderTabs();
  if (r.indexOf('i/') === 0) {
    const id = r.slice(2);
    $('#view').innerHTML = renderItemPage(id);
    const it = BY_ID[id];
    document.title = (it ? nameOf(it) + ' — ' : '') + 'Генератор лута Daggerheart';
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
  if (r === 'roll/core') return S.core;
  if (r === 'roll/hnf') return S.hnf;
  if (r === 'roll/all') return S.all;
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

  const cn = e.target.closest('[data-copy-name]');
  if (cn) { copyText(nameForShare(BY_ID[cn.dataset.copyName])); return; }

  const cf = e.target.closest('[data-copy-full]');
  if (cf) {
    copyText(shareText(BY_ID[cf.dataset.copyFull]));
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

  const act = e.target.closest('[data-act]');
  if (!act) return;
  const st = stateForRoute();
  const a = act.dataset.act, val = act.dataset.val;

  if (a === 'rarity') { st.rarity = val; render(); return; }
  if (a === 'kind')   { S.kind = val; render(); return; }
  if (a === 'comm')   { S.comm.c = val; S.comm.n = 1; render(); return; }
  if (a === 'view')   { S.tables.view = val; render(); return; }
  if (a === 'gotoTable') {
    S.tables.q = '';
    location.hash = '#/tables/' + (S.kind === 'cons' ? 'alt_consumable' : 'alt_item') + '/' + S.alt.rarity;
    return;
  }

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

window.addEventListener('hashchange', render);
render();

})();
