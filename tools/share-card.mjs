/*
  The link-preview card: the one renderer of every card the site hands out.
  tools/build-share-pages.js draws the catalog stubs (i/<id>.html) with it at
  build time; the preview host (preview/worker.mjs) draws the homebrew item,
  shared list, print set and table cards with it at request time.

  Pure: no imports, no file system, no window. The words are copies of the
  app's (app/src/lib/dict.ts, i18n.ts, frames.ts, realms.ts, tables.ts, label.ts,
  filters.ts, plural.ts), pinned equal by app/src/lib/i18n.test.ts.
*/

export const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/* The words of a page in each language. The keys from `srcHomebrew` on are
   the app's own dict.ts entries, word for word. */
export const TEXT = {
  ru: {
    site: 'Генератор лута Daggerheart',
    open: 'Открыть в генераторе лута',
    other: 'Прочее',
    frames: 'Сеттинги',
    starting: 'Стартовые',
    craftFrom: 'Получается из: ',
    craftInto: 'Улучшается до: ',
    set: 'Комплект: ',
    tier: 'Ранг',
    thresholds: 'Пороги',
    armor: 'Броня',
    artifact: 'Артефакт',
    srcHomebrew: 'Хоумбрю',
    hbTag: '%s (HB)',
    notFound: 'Предмет не найден',
    notFoundSub: 'Возможно, ссылка устарела или данные были изменены.',
    andMore: 'и ещё %n',
    itemsN: '%n позиция|%n позиции|%n позиций',
    untitled: 'Без названия',
    shareLinkGm: 'Ссылка для мастера',
    shareGone: 'Список больше не доступен',
    shareGoneSub: 'Владелец удалил эту ссылку или список.',
    printTitle: 'Печать карточек',
    signInToPrint: 'Войдите, чтобы печатать карточки.',
    printSetGone: 'Набор не найден: ссылку не открывали 90 дней, или в адресе ошибка.',
    communityLabel: 'Сообщество',
    commF: 'Сообщество',
    frameF: 'Сеттинг',
    realmF: 'Мир'
  },
  en: {
    site: 'Daggerheart Loot Generator',
    open: 'Open in the loot generator',
    other: 'Other',
    frames: 'Frames',
    starting: 'Starting',
    craftFrom: 'Made from: ',
    craftInto: 'Upgrades to: ',
    set: 'Set: ',
    tier: 'Tier',
    thresholds: 'Thresholds',
    armor: 'Armor',
    artifact: 'Artifact',
    srcHomebrew: 'Homebrew',
    hbTag: '%s (HB)',
    notFound: 'Item not found',
    notFoundSub: 'The link may be out of date, or the data has changed.',
    andMore: 'and %n more',
    itemsN: '%n item|%n items',
    untitled: 'Untitled',
    shareLinkGm: "GM's link",
    shareGone: 'This list is no longer available',
    shareGoneSub: 'The owner deleted this link or the list.',
    printTitle: 'Printing cards',
    signInToPrint: 'Sign in to print cards.',
    printSetGone: 'Set not found: nobody opened the link for 90 days, or the address is wrong.',
    communityLabel: 'Community',
    commF: 'Community',
    frameF: 'Frame',
    realmF: 'Realm'
  }
};

export const FRAME_LABEL = {
  beast_feast: ['Пир зверей', 'Beast Feast'],
  colossus: ['Колоссы Сухоземья', 'Colossus of the Drylands'],
  dark_heart: ['Тёмное сердце Андалурии', 'Dark Heart of Andaluria'],
  motherboard: ['Материнская Плата', 'Motherboard']
};

export const REALM_LABEL = {
  sporopolis: ['Спорополис', 'Sporopolis'],
  wagerwood: ['Лес Пари', 'Wagerwood'],
  warrens: ['Воюющие Норы', "Warrin' Warrens"],
  godsvale: ['Долина Богов', 'Godsvale']
};

export const EQ_TYPE = {
  weapon: ['Основное оружие', 'Primary weapon'],
  secondary: ['Вторичное оружие', 'Secondary weapon'],
  armor: ['Броня', 'Armor']
};
export const EQ_TRAIT = {
  agility: ['Проворность', 'Agility'],
  strength: ['Сила', 'Strength'],
  finesse: ['Искусность', 'Finesse'],
  instinct: ['Инстинкт', 'Instinct'],
  presence: ['Влияние', 'Presence'],
  knowledge: ['Знание', 'Knowledge'],
  spellcast: ['Характеристика Заклинателя', 'Spellcast'],
  any: ['Любая', 'Any']
};
export const EQ_RANGE = {
  melee: ['Вплотную', 'Melee'],
  veryclose: ['Близко', 'Very Close'],
  close: ['Средне', 'Close'],
  far: ['Далеко', 'Far'],
  veryfar: ['Очень далеко', 'Very Far']
};
export const EQ_DT = { phy: ['физ', 'phy'], mag: ['маг', 'mag'], any: ['физ/маг', 'phy/mag'] };
export const EQ_BURDEN = {
  1: ['Одноручное', 'One-Handed'],
  2: ['Двуручное', 'Two-Handed'],
  any: ['Одноручное/двуручное', 'One/Two-Handed']
};
export const EQ_CLS = { phy: ['Физическое', 'Physical'], mag: ['Магическое', 'Magic'] };

export const pick = (pair, lang) => (pair ? pair[lang === 'ru' ? 0 : 1] : '');
// Russian falls back to English per field; English never falls back (I18N.md).
export const nameOf = (x, lang) => (lang === 'ru' ? x.ru || x.en : x.en);
export const descOf = (x, lang) => (lang === 'ru' ? x.rud || x.ende : x.ende) || '';

// `opts` mirrors eqParts' noType/noTier in app/src/lib/i18n.ts.
export function eqLine(it, lang, opts = {}) {
  const t = TEXT[lang];
  const e = it.eq,
    out = opts.noType ? [] : [pick(EQ_TYPE[e.t], lang)];
  if (!opts.noTier)
    out.push(e.tier === 'A' ? t.artifact : e.tier ? t.tier + ' ' + e.tier : 'Wondrous');
  if (e.t === 'armor') {
    if (e.th) out.push(t.thresholds + ' ' + e.th[0] + '/' + e.th[1]);
    if (e.as != null) out.push(t.armor + ' ' + e.as);
  } else {
    // Every weapon names its class, secondary too (docs/specs/FEATURES.md, "Records").
    if (e.cls) out.push(pick(EQ_CLS[e.cls], lang));
    out.push(
      pick(EQ_TRAIT[e.tr], lang),
      pick(EQ_RANGE[e.rg], lang),
      e.dmg + (e.dt ? ' ' + pick(EQ_DT[e.dt], lang) : ''),
      pick(EQ_BURDEN[e.bu], lang)
    );
  }
  return out.filter(Boolean).join(' · ');
}

function isFrame(it) {
  return !!it.frame || it.src === 'frame';
}
export function provenance(it, lang) {
  const t = TEXT[lang];
  if (isFrame(it))
    return t.other + ' · ' + t.frames + ' · ' + (pick(FRAME_LABEL[it.frame], lang) || it.frame);
  if (it.starting) return t.other + ' · ' + t.starting;
  return '';
}

/* The record page's path words: copies of app/src/lib/tables.ts
   (TABLE_GROUPS labels, SUB_LABEL) and label.ts (tableOf, whereFrom) resolved
   through dict.ts; tests/app/contracts.js compares every table's stub with
   its record page, so a drift fails there. */
export const PATH_TEXT = {
  ru: {
    core: 'Core',
    hnf: 'Hope & Fear',
    wondrous: 'Wondrous Loot',
    dread: 'Dread GM Toolbox',
    voa: 'Vault of Ages',
    dv: "Dragon's Vault",
    arazo: "Arazo's Artifacts",
    community: 'Сообщества',
    mwt: 'Many Worlds Tavern',
    eq: 'Снаряжение',
    other: 'Прочее',
    alt: 'Альт. таблицы',
    items: 'Предметы',
    cons: 'Расходники',
    weapon: 'Оружие',
    secondary: 'Вторичное',
    armor: 'Броня',
    starting: 'Стартовые',
    frames: 'Сеттинги',
    artifact: 'Артефакт',
    cursed: 'Проклятый предмет',
    rollNo: 'номер',
    tier: 'Ранг'
  },
  en: {
    core: 'Core',
    hnf: 'Hope & Fear',
    wondrous: 'Wondrous Loot',
    dread: 'Dread GM Toolbox',
    voa: 'Vault of Ages',
    dv: "Dragon's Vault",
    arazo: "Arazo's Artifacts",
    community: 'Communities',
    mwt: 'Many Worlds Tavern',
    eq: 'Equipment',
    other: 'Other',
    alt: 'Alt. tables',
    items: 'Items',
    cons: 'Consumables',
    weapon: 'Weapons',
    secondary: 'Secondary',
    armor: 'Armor',
    starting: 'Starting',
    frames: 'Frames',
    artifact: 'Artifact',
    cursed: 'Cursed object',
    rollNo: 'roll',
    tier: 'Tier'
  }
};
/* table id -> [group word, sub word or none]. `tableOf` never returns the
   two alt tables: they hold no record of their own, only the table card names them. */
export const TABLE_PATH = {
  core_item: ['core', 'items'],
  core_consumable: ['core', 'cons'],
  hnf_item: ['hnf', 'items'],
  hnf_consumable: ['hnf', 'cons'],
  wondrous: ['wondrous'],
  dread: ['dread'],
  voa: ['voa'],
  dv: ['dv'],
  arazo: ['arazo'],
  community: ['community'],
  mwt: ['mwt'],
  eq_weapon: ['eq', 'weapon'],
  eq_secondary: ['eq', 'secondary'],
  eq_armor: ['eq', 'armor'],
  other_starting: ['other', 'starting'],
  other_frames: ['other', 'frames'],
  alt_item: ['alt', 'items'],
  alt_consumable: ['alt', 'cons']
};
const EQ_TABLE_OF = { weapon: 'eq_weapon', secondary: 'eq_secondary', armor: 'eq_armor' };

export function tableOf(it) {
  if (isFrame(it)) return 'other_frames';
  if (it.starting) return 'other_starting';
  if (it.src === 'voa') return 'voa';
  if (it.src === 'arazo') return 'arazo';
  if (it.src === 'mwt') return 'mwt';
  if (it.eq && !it.roll) return EQ_TABLE_OF[it.eq.t];
  if (['wondrous', 'dread', 'dv', 'community'].includes(it.src)) return it.src;
  if (it.src === 'core' || it.src === 'hnf')
    return it.src + (it.kind === 'consumable' ? '_consumable' : '_item');
  return null;
}

/** Returns a table's name in the stub's words: the group word and the sub word. */
export function tablePath(table, lang) {
  const p = PATH_TEXT[lang];
  const [group, sub] = TABLE_PATH[table];
  return sub ? p[group] + ' · ' + p[sub] : p[group];
}

// RecordPage.svelte's line under the heading: the path, then the roll number or the tier.
export function where(it, lang) {
  const p = PATH_TEXT[lang];
  const table = tableOf(it);
  if (!table) throw new Error('No table for record ' + it.id + '; extend tableOf');
  const bits = [tablePath(table, lang)];
  // the three tables sectioned by a value the record carries name its section
  if (it.frame) bits.push(pick(FRAME_LABEL[it.frame], lang) || it.frame);
  else if (it.community) bits.push(lang === 'ru' ? it.community_ru : it.community);
  else if (it.realm) bits.push(pick(REALM_LABEL[it.realm], lang) || it.realm);
  if (it.tier === 'A') bits.push(p.artifact);
  else if (it.tier === 'C') bits.push(p.cursed);
  if (it.roll) bits.push(p.rollNo + ' ' + it.roll);
  else if (it.eq && it.eq.tier !== 'A') bits.push(p.tier + ' ' + it.eq.tier);
  return bits.join(' · ');
}

/* The stat line follows, without the type word when the path is an equipment
   table and without the tier when the path already ends with it: a rolled
   record's path ends with its roll number, an artifact's carries the word. */
export function subtitle(it, lang) {
  const path = where(it, lang);
  if (!it.eq) return path;
  const opts = { noType: tableOf(it).startsWith('eq_'), noTier: !it.roll || it.tier === 'A' };
  return path + ' · ' + eqLine(it, lang, opts);
}

/** Returns a homebrew item's line under the heading: the app's `whereFrom` (the
 *  homebrew word, the source, the section), then the stat line. */
export function homebrewSubtitle(it, lang) {
  const book = it.book || {};
  const path = [TEXT[lang].srcHomebrew, book[lang], book.section && book.section[lang]]
    .filter(Boolean)
    .join(' · ');
  return it.eq ? path + ' · ' + eqLine(it, lang) : path;
}

/** Returns the form of `forms` ("one|few|many" in Russian, "one|other" in
 *  English) that agrees with `n`, with `%n` replaced: app/src/lib/plural.ts. */
const RULES = { ru: new Intl.PluralRules('ru'), en: new Intl.PluralRules('en') };
const INDEX = { ru: { one: 0, few: 1, many: 2 }, en: { one: 0 } };
export function plural(n, forms, lang) {
  const f = forms.split('|');
  const last = f.length - 1;
  const i = Math.min(INDEX[lang][RULES[lang].select(n)] ?? last, last);
  return String(f[i]).replaceAll('%n', String(n));
}

/** Parses an `f_` segment: a copy of app/src/lib/filters.ts `decodeFilter`. */
export function decodeFilter(segment, groups) {
  const out = {};
  if (!segment.startsWith('f_')) return out;
  const body = segment.slice(2);
  if (!body) return out;
  const legacy =
    !body.includes('.') &&
    body.split('_').every((g) => {
      const i = g.indexOf('-');
      return i > 0 && groups.includes(g.slice(0, i));
    });
  for (const group of legacy ? body.split('_') : body.split('.')) {
    const parts = group.split('-');
    const name = parts.shift();
    if (!name || !parts.length) continue;
    out[name] = [...new Set(parts)];
  }
  return out;
}

/** The filter groups of the three tables whose labels a table card draws:
 *  app/src/lib/filters.ts `groupsFor`. */
export const LABEL_GROUPS = {
  community: ['comm'],
  other_frames: ['kind', 'frame'],
  mwt: ['kind', 'realm']
};

const UTF8 = new TextEncoder();
const escBytes = (s) => UTF8.encode(esc(s)).length;

/** Returns `text`, or its start and `...` when its escaped UTF-8 form passes
 *  `bytes`: cut at a character boundary, at a word boundary when one is in the
 *  last 40 characters, before escaping, so no entity is split. */
export function fit(text, bytes) {
  if (escBytes(text) <= bytes) return text;
  const chars = Array.from(text);
  let n = 0;
  let used = 0;
  while (n < chars.length) {
    const b = escBytes(chars[n]);
    if (used + b > bytes - 3) break;
    used += b;
    n++;
  }
  for (;;) {
    let head = chars.slice(0, n).join('');
    const space = head.search(/\s\S*$/);
    if (space >= 0 && Array.from(head.slice(space)).length <= 41) head = head.slice(0, space);
    const out = head.replace(/\s+$/, '') + '...';
    if (escBytes(out) <= bytes || n === 0) return out;
    n--;
  }
}

/** Returns `label` and as many `names` as fit in `bytes` after escaping, joined
 *  with commas, then `more` («и ещё %n») with the count of the rest: `total`
 *  minus the names drawn, where `total` counts names the caller did not pass. */
export function fold(label, names, more, bytes, total = names.length) {
  const tail = (rest) => (rest > 0 ? ' ' + more.replace('%n', String(rest)) : '');
  let used = escBytes(label);
  let k = 0;
  for (; k < names.length; k++) {
    const add = escBytes((k > 0 ? ', ' : '') + names[k]);
    if (used + add + escBytes(tail(total - k - 1)) > bytes) break;
    used += add;
  }
  return label + names.slice(0, k).join(', ') + tail(total - k);
}

// The visible paragraph keeps the line breaks the meta description above
// flattens: a multi-line body (12 records use 94 "- " list lines) renders as one
// <p> per source line instead of a run-on paragraph once the newlines are gone.
// `raw` is plain text: a caller passes record text through `markupText` first.
export function descHtml(raw) {
  return raw
    .split('\n')
    .map((line) => `<p>${esc(line)}</p>`)
    .join('\n');
}

export const LOCALE = { ru: 'ru_RU', en: 'en_US' };

/* An English page stores English as the language only when nothing is stored:
   a reader's own choice always wins (docs/specs/I18N.md). Storage that throws
   is ignored, and the redirect still runs. */
export const SEED_EN =
  "try{if(!localStorage.getItem('dhloot.lang.v1'))localStorage.setItem('dhloot.lang.v1','en')}catch(e){}";

// The stylesheet of every page this file draws.
export const STYLE = `<style>
  body{background:#0e0c15;color:#ece8f6;font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
       margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
  .w{max-width:420px;text-align:center}
  img{width:100%;max-width:320px;border-radius:14px;display:block;margin:0 auto 18px}
  h1{font-size:22px;margin:0 0 6px}
  .s{color:#736b8c;font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;margin:0 0 14px}
  p{color:#cfc8e0;margin:0 0 20px}
  p.c{color:#9b93b3;font-size:13px;margin:-12px 0 14px}
  a{color:#d8ab5e}
</style>`;

/**
 * Returns one card page. `ctx`: `title` (the heading, `og:title`), `url` (the
 * card's own address), `app` (the redirect target), `img` (absolute
 * `og:image`), `imgSrc` (the visible picture, none when absent), `subtitle`,
 * `desc` (the start of the meta description), `body` (the visible text, line
 * breaks kept), `craft` and `set` (lines), `seed` (store English first),
 * `large` (the site picture, 1200x630), `caps` (`{ meta }` in escaped UTF-8
 * bytes; absent for the catalog).
 */
export function card(lang, ctx) {
  const t = TEXT[lang];
  if (!t) throw new Error('No share page text for language "' + lang + '". Use ru or en');
  const name = ctx.title;
  const craft = ctx.craft || [];
  const set = ctx.set || [];
  // the unfurl preview is one flat string, so the chain joins the description
  const joined =
    ctx.desc +
    (craft.length ? ' ' + craft.join('. ') + '.' : '') +
    (set.length ? ' ' + set.join('. ') : '');
  const desc = ctx.caps ? fit(joined, ctx.caps.meta) : joined;
  const docTitle = name === t.site ? t.site : `${esc(name)} — ${t.site}`;
  const script =
    (ctx.seed ? SEED_EN : '') + 'location.replace(' + JSON.stringify(ctx.app) + ');';
  const size = ctx.large
    ? `<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">`
    : `<meta property="og:image:width" content="640">
<meta property="og:image:height" content="640">`;
  const twitterCard = ctx.large
    ? `<meta name="twitter:card" content="summary_large_image">`
    : `<!-- the artwork is square, and a large-summary card would letterbox it -->
<meta name="twitter:card" content="summary">`;
  const picture = ctx.imgSrc ? `    <img src="${esc(ctx.imgSrc)}" alt="${esc(name)}">\n` : '';
  const sub = ctx.subtitle ? `    <p class="s">${esc(ctx.subtitle)}</p>\n` : '';
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- kept out of search results; see robots.txt for why crawling is allowed -->
<meta name="robots" content="noindex, nofollow">
<title>${docTitle}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(ctx.url)}">

<meta property="og:type" content="article">
<meta property="og:site_name" content="${t.site}">
<meta property="og:locale" content="${LOCALE[lang]}">
<meta property="og:title" content="${esc(name)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(ctx.url)}">
<meta property="og:image" content="${esc(ctx.img)}">
${size}
<meta property="og:image:alt" content="${esc(name)}">
${twitterCard}
<meta name="twitter:title" content="${esc(name)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(ctx.img)}">

<meta http-equiv="refresh" content="0; url=${esc(ctx.app)}">
${STYLE}
</head>
<body>
  <div class="w">
${picture}    <h1>${esc(name)}</h1>
${sub}    ${descHtml(ctx.body)}
${craft
  .concat(set)
  .map((c) => `    <p class="c">${esc(c)}</p>\n`)
  .join('')}    <a href="${esc(ctx.app)}">${t.open}</a>
  </div>
  <script>${script}</script>
</body>
</html>
`;
}
