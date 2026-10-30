/*
  The preview host (.claude/README.md, "Preview host"): one stateless Pages
  Functions worker that answers a card path with the app document and the
  link card in its head, so a messenger's crawler reads the card and a
  person's browser runs the app at the same URL. When the app document cannot
  be read, it answers the card page, which sends a person on to the app. It
  stores nothing, sets no cookie and caches nothing; it reads only what a
  signed-out reader reads. It answers only the families that
  public/_routes.json routes to it; Pages serves the site's files on every
  other path.

  Routes, each also under /en/: /h/<uuid> (a homebrew item), /s/<token>
  (a shared list), /p/<id> (a print set), /tables/<table>[/<tail>] (a catalog
  table). Every URL it writes is built from the parsed run and the language,
  never from the raw path or the query. The two card reads are
  get_item_preview (/h/) and get_shared_list_preview (/s/), lean projections
  that answer only what a card draws
  (supabase/migrations/20261014120200_link_previews.sql).
*/
import {
  TEXT,
  FRAME_LABEL,
  REALM_LABEL,
  LABEL_GROUPS,
  TABLE_PATH,
  TABLE_SLUG,
  appDocument,
  card,
  cardHead,
  decodeFilter,
  descOf,
  fit,
  fold,
  homebrewSubtitle,
  nameOf,
  pick,
  plural,
  tablePath
} from '../tools/share-card.mjs';
/* A card draws record text as it reads: no markup (docs/specs/CONTRACTS.md section 4).
   The Pages deploy bundles this import with esbuild, which reads TypeScript. */
import { markupText } from '../app/src/lib/markup.ts';

/** A card's caps, in escaped UTF-8 bytes (.claude/README.md, "Preview host", "Cross-host
 *  limits", "Page size"). get_item_preview cuts each line's names to `line`. */
const CAPS = { meta: 480, line: 1200 };
const READ_MS = 3000;
const NAMES_MS = 2000;
const NAMES_TTL_MS = 600000;
const NAMES_MAX = 196608;
/* Twice the answer size that tests/db/link-previews.test.mjs asserts: a defense in depth
   behind the lean reads (.claude/README.md, "Preview host", "Quotas, recovery and failure"). */
const ITEM_MAX = 65536;
const LIST_MAX = 8192;
const TAIL_MAX = 2048;
/* The app document: the built index.html is about 6 KB. */
const SHELL_MS = 2000;
const SHELL_MAX = 65536;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const OWN_ART = /^p\/[0-9a-f]{32}\.(webp|jpg)$/;
const CATALOG_ART = /^[A-Za-z0-9_-]+\.webp$/;

const isObject = (o) => o !== null && typeof o === 'object' && !Array.isArray(o);
const has = (o, k) => o != null && typeof o === 'object' && Object.hasOwn(o, k);
/* Not awaited: a cancel resolves only once every reader of the stream lets go. */
const drop = (body) => {
  if (body) body.cancel().catch(() => {});
};
const flat = (s) => String(s).replace(/\s*\n\s*/g, ' ');

const BASE_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'no-referrer'
};

/* The app document's: no Referrer-Policy, because no-referrer empties
   document.referrer, which the static pages' back script reads. no-store keeps a
   crawler from a stored old card; the cost is no back-forward cache
   (.claude/README.md, "Cross-host limits"). */
const APP_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow'
};

function answer(method, status, body, extra = {}, base = BASE_HEADERS) {
  const headers = { ...base, ...extra };
  if (body !== null) headers['Content-Type'] = 'text/html; charset=utf-8';
  return new Response(method === 'HEAD' || body === null ? null : body, { status, headers });
}

/* ---------- reads ---------- */

/** Returns `{ value }`, the text of a response whose body is at most `max` bytes, or
 *  `{ fail: 'big' }`. The stream is cancelled past the cap, before any decode. */
async function readText(res, max) {
  const length = Number(res.headers.get('Content-Length'));
  if (Number.isFinite(length) && length > max) {
    drop(res.body);
    return { fail: 'big' };
  }
  const chunks = [];
  let size = 0;
  if (res.body) {
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        reader.cancel().catch(() => {});
        return { fail: 'big' };
      }
      chunks.push(value);
    }
  }
  const bytes = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    bytes.set(c, at);
    at += c.byteLength;
  }
  return { value: new TextDecoder().decode(bytes) };
}

/** Returns the parsed JSON of a response whose body is at most `max` bytes, or
 *  `{ fail: 'big' | 'bad' }`. */
async function readJson(res, max) {
  const text = await readText(res, max);
  if (text.fail) return text;
  try {
    return { value: JSON.parse(text.value) };
  } catch {
    return { fail: 'bad' };
  }
}

/** Returns `{ value }` for a 200 JSON answer of an RPC, else `{ fail }`. */
async function rpc(env, name, args, max) {
  try {
    const res = await globalThis.fetch(
      String(env.SUPABASE_URL).replace(/\/+$/, '') + '/rest/v1/rpc/' + name,
      {
        method: 'POST',
        headers: { apikey: env.SUPABASE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
        signal: AbortSignal.timeout(READ_MS)
      }
    );
    if (res.status !== 200) {
      drop(res.body);
      return { fail: 'status' };
    }
    return await readJson(res, max);
  } catch {
    return { fail: 'network' };
  }
}

/* The parsed names.json, kept while the isolate is warm, so a Pages deploy
   of new data reaches the next request with no worker deploy. */
let namesCache = null;

/** Returns the site's names.json, or null when it cannot be read or is invalid. The file
 *  comes from the same deployment's static files (`env.ASSETS`), not a subrequest. */
async function readNames(env) {
  const now = Date.now();
  if (namesCache && now - namesCache.at < NAMES_TTL_MS) return namesCache.value;
  try {
    const res = await env.ASSETS.fetch(env.SITE + 'names.json', {
      signal: AbortSignal.timeout(NAMES_MS)
    });
    if (res.status !== 200) {
      drop(res.body);
      return null;
    }
    const got = await readJson(res, NAMES_MAX);
    const v = got.value;
    if (!v || v.format !== 'daggerheart-loot/names' || v.version !== 1) return null;
    namesCache = { value: v, at: now };
    return v;
  } catch {
    return null;
  }
}

/** Returns the app document (the site's index.html) from the deployment's own files, or
 *  null when it cannot be read. Read on every request, never cached: an isolate can
 *  outlive a deployment, and the document must pair with that deployment's assets. */
async function readShell(env) {
  try {
    const res = await env.ASSETS.fetch(env.SITE, { signal: AbortSignal.timeout(SHELL_MS) });
    if (res.status !== 200) {
      drop(res.body);
      return null;
    }
    const got = await readText(res, SHELL_MAX);
    return got.fail ? null : got.value;
  } catch {
    return null;
  }
}

/** Returns the answer for a card: the app document with the card in its head, or the
 *  card page when the app document cannot be read or holds no card block. A route that
 *  reads its card first passes `started`, the app document read it began together with
 *  that read, so the answer waits for the slower of the two reads, not for their sum. */
async function respond(env, lang, method, status, ctx, started = readShell(env)) {
  const shell = await started;
  if (shell !== null) {
    try {
      const doc = appDocument(shell, cardHead(lang, ctx), lang);
      return answer(method, status, doc, {}, APP_HEADERS);
    } catch {
      /* no card block: the card page below */
    }
  }
  return answer(method, status, card(lang, ctx));
}

/* ---------- shared card parts ---------- */

function sitePicture(env, lang) {
  return env.SITE + (lang === 'ru' ? 'og/_share.jpg' : 'og/_share_en.jpg');
}

/** Returns a card with the site's picture: a list, a print set, a table, or a 404 or 503. */
function siteCtx(env, lang, { title, desc, url, app }) {
  return {
    title,
    desc,
    body: desc,
    url,
    app,
    img: sitePicture(env, lang),
    large: true,
    caps: CAPS
  };
}

/* The card page's way into the app, in the #/ form: a path form would ask the worker
   again, while <site>/ is static and the app converts #/ (docs/specs/ROUTES.md). */
function appUrl(env, lang, fragment) {
  return env.SITE + (lang === 'ru' ? '' : 'en/') + (fragment ? '#/' + fragment : '');
}

function hostUrl(env, lang, path) {
  return 'https://' + env.PAGES_HOST + (lang === 'ru' ? '' : '/en') + path;
}

/** The card for a read that failed: the site's words, the redirect kept. */
function siteText(env, lang, url, app) {
  const t = TEXT[lang];
  return siteCtx(env, lang, { title: t.site, desc: t.open, url, app });
}

/* ---------- /h/: a homebrew item ---------- */

/** Returns an own item's name with the homebrew tag, as `#/h/` draws it. */
function homebrewName(name, lang) {
  return TEXT[lang].hbTag.replace('%s', () => name);
}

function catalogName(names, id, lang) {
  if (!names || !has(names.items, id)) return null;
  const pair = names.items[id];
  if (!Array.isArray(pair)) return null;
  const name = lang === 'ru' ? pair[0] || pair[1] : pair[1];
  return typeof name === 'string' && name ? name : null;
}

const list = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);

/** Returns the catalog names of `ids` from names.json, once each, in their order; an id
 *  names.json does not hold (an own key never is in it) is dropped. */
function catalogNames(ids, names, lang) {
  const out = [];
  for (const id of new Set(ids)) {
    const n = catalogName(names, id, lang);
    if (n) out.push(n);
  }
  return out;
}

/** Returns a line of the read: its names (strings only) and its count. */
function readLine(lines, key) {
  const l = has(lines, key) && lines[key] && typeof lines[key] === 'object' ? lines[key] : {};
  const names = list(l.names);
  return { names, n: Number.isInteger(l.n) && l.n >= 0 ? l.n : names.length };
}

/** Returns the craft and set lines of a homebrew item: the catalog names first, then the
 *  read's own names in the read's order, folded to `CAPS.line`. */
function homebrewLines(answer, names, lang) {
  const t = TEXT[lang];
  const it = answer.item;
  const line = (label, catalog, read) =>
    fold(
      label,
      [...catalog, ...read.names.map((n) => homebrewName(n, lang))],
      t.andMore,
      CAPS.line,
      catalog.length + read.n
    );

  const craft = [];
  const from = catalogNames(list(it.craft_from), names, lang);
  const fromRead = readLine(answer.lines, 'from');
  if (from.length + fromRead.n > 0) craft.push(line(t.craftFrom, from, fromRead));
  const into = catalogNames(list(it.craft), names, lang);
  const intoRead = readLine(answer.lines, 'into');
  if (into.length + intoRead.n > 0) craft.push(line(t.craftInto, into, intoRead));

  const set = [];
  const key = typeof it.set === 'string' ? it.set : '';
  if (key) {
    const catalogSet = names && has(names.sets, key) ? names.sets[key] : null;
    const carried =
      answer.set_card && typeof answer.set_card === 'object' ? answer.set_card : null;
    const members = catalogNames(list(catalogSet && catalogSet.members), names, lang);
    const setRead = readLine(answer.lines, 'set');
    const drawn = members.length + setRead.n > 1;
    if (drawn) set.push(line(t.set, members, setRead));
    const bonus = drawn ? catalogSet || carried : carried;
    if (bonus) {
      const text =
        lang === 'ru'
          ? bonus.ru + ': ' + markupText(String(bonus.rud))
          : bonus.en + ': ' + markupText(String(bonus.ende));
      set.push(fit(text, CAPS.line));
    }
  }
  return { craft, set };
}

/**
 * Returns the picture of a homebrew item's card: a catalog picture (its square `og/` card),
 * an own picture (the bucket file), or, with neither, the site card of the language
 * (1200x630) as a large card with no visible picture on the card page.
 */
function homebrewImage(env, img, lang) {
  if (typeof img === 'string' && CATALOG_ART.test(img))
    return {
      img: env.SITE + 'og/' + img.replace(/\.webp$/, '.jpg'),
      src: env.SITE + 'img/' + img
    };
  if (typeof img === 'string' && OWN_ART.test(img)) {
    const url =
      String(env.SUPABASE_URL).replace(/\/+$/, '') +
      '/storage/v1/object/public/homebrew-art/' +
      img;
    return { img: url, src: url };
  }
  return { img: sitePicture(env, lang), src: '', large: true };
}

/** Returns the card of a `get_item_preview` answer. */
function homebrewCtx(answer, lang, env, names, id) {
  const it = answer.item;
  const sub = homebrewSubtitle(it, lang);
  const raw = markupText(String(descOf(it, lang)));
  const lines = homebrewLines(answer, names, lang);
  const pic = homebrewImage(env, has(answer, 'img') ? answer.img : null, lang);
  return {
    title: nameOf(it, lang),
    desc: sub + '. ' + flat(raw),
    body: raw,
    craft: lines.craft,
    set: lines.set,
    img: pic.img,
    imgSrc: pic.src,
    large: pic.large,
    url: hostUrl(env, lang, '/h/' + id),
    app: appUrl(env, lang, 'h/' + id),
    subtitle: sub,
    caps: CAPS
  };
}

async function itemRoute(rest, lang, env, method) {
  let run = (/^[0-9A-Fa-f-]*/.exec(rest)?.[0] ?? '').toLowerCase();
  if (run.length > TAIL_MAX) run = '';
  const t = TEXT[lang];
  const notFound = (shell) =>
    respond(
      env,
      lang,
      method,
      404,
      siteCtx(env, lang, {
        title: t.notFound,
        desc: t.notFoundSub,
        url: hostUrl(env, lang, '/h/' + run),
        app: appUrl(env, lang, run ? 'h/' + run : '')
      }),
      shell
    );
  if (!UUID.test(run)) return notFound();
  const url = hostUrl(env, lang, '/h/' + run);
  const app = appUrl(env, lang, 'h/' + run);
  const shell = readShell(env);
  const [read, names] = await Promise.all([
    rpc(env, 'get_item_preview', { p_id: run, p_lang: lang }, ITEM_MAX),
    readNames(env)
  ]);
  if (read.fail === 'big')
    return respond(env, lang, method, 200, siteText(env, lang, url, app), shell);
  if (read.fail) return respond(env, lang, method, 503, siteText(env, lang, url, app), shell);
  if (read.value === null) return notFound(shell);
  const v = read.value;
  if (!isObject(v) || !isObject(v.item) || !isObject(v.lines))
    return respond(env, lang, method, 503, siteText(env, lang, url, app), shell);
  return respond(env, lang, method, 200, homebrewCtx(v, lang, env, names, run), shell);
}

/* ---------- /s/: a shared list ---------- */

/** Returns the card of a `get_shared_list_preview` answer: the name, the count that the
 *  link's audience sees and the players' note without its markup; the read holds no GM
 *  note. */
function listCtx(answer, lang, env, token, filter) {
  const t = TEXT[lang];
  const name = (typeof answer.name === 'string' && answer.name) || t.untitled;
  const note = typeof answer.note === 'string' ? answer.note.trim() : '';
  const desc = fit(
    plural(answer.n, t.itemsN, lang) + (note ? '. ' + flat(markupText(note)) : ''),
    CAPS.meta
  );
  return siteCtx(env, lang, {
    title: answer.audience === 'gm' ? name + ' · ' + t.shareLinkGm : name,
    desc,
    url: hostUrl(env, lang, '/s/' + token),
    app: appUrl(env, lang, 's/' + token + (filter ? '/' + filter : ''))
  });
}

async function listRoute(rest, lang, env, method) {
  const m = /^([A-Za-z0-9_-]*)(?:\/(f_[A-Za-z0-9_.-]*))?/.exec(rest);
  const run = m[1].length > TAIL_MAX ? '' : m[1];
  const filter = m[2] && m[2].length <= TAIL_MAX ? m[2] : '';
  const t = TEXT[lang];
  const gone = (app, shell) =>
    respond(
      env,
      lang,
      method,
      404,
      siteCtx(env, lang, {
        title: t.shareGone,
        desc: t.shareGoneSub,
        url: hostUrl(env, lang, '/s/' + run),
        app
      }),
      shell
    );
  if (run.length !== 43) return gone(appUrl(env, lang, run ? 's/' + run : ''));
  const url = hostUrl(env, lang, '/s/' + run);
  const app = appUrl(env, lang, 's/' + run + (filter ? '/' + filter : ''));
  const shell = readShell(env);
  const read = await rpc(env, 'get_shared_list_preview', { p_token: run }, LIST_MAX);
  if (read.fail === 'big')
    return respond(env, lang, method, 200, siteText(env, lang, url, app), shell);
  if (read.fail) return respond(env, lang, method, 503, siteText(env, lang, url, app), shell);
  if (read.value === null) return gone(app, shell);
  const v = read.value;
  if (!isObject(v) || !Number.isInteger(v.n) || v.n < 0)
    return respond(env, lang, method, 503, siteText(env, lang, url, app), shell);
  return respond(env, lang, method, 200, listCtx(read.value, lang, env, run, filter), shell);
}

/* ---------- /p/: a print set ---------- */

/** Returns the generic print set card: `get_print_set` is for signed-in readers only. */
function printCtx(lang, env, id) {
  const t = TEXT[lang];
  return siteCtx(env, lang, {
    title: t.printTitle,
    desc: t.signInToPrint,
    url: hostUrl(env, lang, '/p/' + id),
    app: appUrl(env, lang, 'p/' + id)
  });
}

async function printRoute(rest, lang, env, method) {
  let run = /^[A-Za-z0-9_-]*/.exec(rest)[0];
  if (run.length > TAIL_MAX) run = '';
  if (run.length === 12) return respond(env, lang, method, 200, printCtx(lang, env, run));
  const t = TEXT[lang];
  return respond(
    env,
    lang,
    method,
    404,
    siteCtx(env, lang, {
      title: t.printTitle,
      desc: t.printSetGone,
      url: hostUrl(env, lang, '/p/' + run),
      app: appUrl(env, lang, run ? 'p/' + run : '')
    })
  );
}

/* ---------- /tables/: a catalog table ---------- */

/* An alias, a slug or an old id names the same table; the URL stays as written. */
const TABLE_ALIASES = {
  frames: 'other_frames',
  ...Object.fromEntries(Object.entries(TABLE_SLUG).map(([id, slug]) => [slug, id]))
};

function communityLabel(names, c, lang) {
  if (!names || !has(names.communities, c)) return null;
  return lang === 'ru' ? names.communities[c].ru : c;
}

function frameLabel(f, lang) {
  return has(FRAME_LABEL, f) ? pick(FRAME_LABEL[f], lang) : null;
}

function realmLabel(r, lang) {
  return has(REALM_LABEL, r) ? pick(REALM_LABEL[r], lang) : null;
}

/** Returns the card of the catalog table `table`, with the anchor or the filter `tail`. */
function tableCtx(table, tail, lang, names, env, run) {
  const t = TEXT[lang];
  const n = (o, k) => (has(o, k) && typeof o[k].n === 'number' ? o[k].n : null);
  let title = tablePath(table, lang);
  let desc = plural(n(names.tables, table) ?? 0, t.itemsN, lang);
  if (tail.startsWith('f_')) {
    const groups = has(LABEL_GROUPS, table) ? LABEL_GROUPS[table] : [];
    const state = decodeFilter(tail, groups);
    const parts = [];
    const label = (group, word, nameFor) => {
      if (!groups.includes(group) || !has(state, group)) return;
      const values = state[group].map(nameFor);
      if (values.length && values.every(Boolean)) parts.push(word + ': ' + values.join(', '));
    };
    if (table === 'community') label('comm', t.commF, (c) => communityLabel(names, c, lang));
    if (table === 'other_frames') label('frame', t.frameF, (f) => frameLabel(f, lang));
    if (table === 'mwt') label('realm', t.realmF, (r) => realmLabel(r, lang));
    desc = parts.length ? parts.join('. ') : t.open;
  } else if (tail && table === 'community' && communityLabel(names, tail, lang)) {
    const name = communityLabel(names, tail, lang);
    title += ' · ' + name;
    desc =
      t.communityLabel +
      ': ' +
      name +
      '. ' +
      plural(n(names.communities, tail) ?? 0, t.itemsN, lang);
  } else if (tail && table === 'other_frames' && frameLabel(tail, lang)) {
    const name = frameLabel(tail, lang);
    title += ' · ' + name;
    desc = t.frameF + ': ' + name + '. ' + plural(n(names.frames, tail) ?? 0, t.itemsN, lang);
  } else if (tail && table === 'mwt' && realmLabel(tail, lang)) {
    const name = realmLabel(tail, lang);
    title += ' · ' + name;
    desc = t.realmF + ': ' + name + '. ' + plural(n(names.realms, tail) ?? 0, t.itemsN, lang);
  }
  const path = run + (tail ? '/' + tail : '');
  return siteCtx(env, lang, {
    title,
    desc,
    url: hostUrl(env, lang, '/tables/' + path),
    app: appUrl(env, lang, 'tables/' + path)
  });
}

async function tablesRoute(rest, lang, env, method) {
  const m = /^([a-z_]+)(?:\/([A-Za-z0-9_.-]+))?/.exec(rest);
  if (!m || m[1].length > TAIL_MAX) return redirectHome(env, lang, method);
  const run = m[1];
  const tail = m[2] && m[2].length <= TAIL_MAX ? m[2] : '';
  const path = run + (tail ? '/' + tail : '');
  const url = hostUrl(env, lang, '/tables/' + path);
  const app = appUrl(env, lang, 'tables/' + path);
  const table = has(TABLE_ALIASES, run) ? TABLE_ALIASES[run] : run;
  if (table === 'homebrew')
    return respond(env, lang, method, 200, siteText(env, lang, url, app));
  if (!has(TABLE_PATH, table)) {
    const home = appUrl(env, lang, 'tables/' + run);
    const at = hostUrl(env, lang, '/tables/' + run);
    return respond(env, lang, method, 404, siteText(env, lang, at, home));
  }
  const shell = readShell(env);
  const names = await readNames(env);
  if (!names) return respond(env, lang, method, 200, siteText(env, lang, url, app), shell);
  return respond(env, lang, method, 200, tableCtx(table, tail, lang, names, env, run), shell);
}

/* ---------- the entry ---------- */

function redirectHome(env, lang, method) {
  return answer(method, 302, null, { Location: appUrl(env, lang, '') });
}

async function handle(request, env) {
  const url = new URL(request.url);
  const method = request.method;
  /* A deployment host or a branch alias shows the production code only. The
     Location keeps the path and the query; it is a header, never markup. */
  if (url.hostname !== env.PAGES_HOST) {
    return answer(method, 301, null, {
      Location: 'https://' + env.PAGES_HOST + url.pathname + url.search
    });
  }
  if (method !== 'GET' && method !== 'HEAD') {
    return answer(method, 405, null, { Allow: 'GET, HEAD' });
  }
  let p = url.pathname;
  let lang = 'ru';
  if (p === '/en' || p.startsWith('/en/')) {
    lang = 'en';
    p = p.slice(3);
  }
  if (p.startsWith('/h/')) return itemRoute(p.slice(3), lang, env, method);
  if (p.startsWith('/s/')) return listRoute(p.slice(3), lang, env, method);
  if (p.startsWith('/p/')) return printRoute(p.slice(3), lang, env, method);
  if (p.startsWith('/tables/')) return tablesRoute(p.slice(8), lang, env, method);
  return redirectHome(env, lang, method);
}

/** Returns the 503 card with the site's words and the way home, for a thrown error. */
function failed(request, env) {
  let lang = 'ru';
  try {
    const p = new URL(request.url).pathname;
    if (p === '/en' || p.startsWith('/en/')) lang = 'en';
  } catch {
    /* the Russian card */
  }
  return answer(
    request.method,
    503,
    card(lang, siteText(env, lang, hostUrl(env, lang, '/'), appUrl(env, lang, '')))
  );
}

export default {
  async fetch(request, env) {
    try {
      return await handle(request, env);
    } catch {
      // Cloudflare's own error page has no way back to the app.
      return failed(request, env);
    }
  }
};
