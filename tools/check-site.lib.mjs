/* What "the published site is correct" actually means, as data rather than
 * as two hand-written implementations that can drift from each other.
 *
 * `checks()` returns one array of `{ path, test(body, meta), message }`
 * descriptors; a `path` is a string, or a function of the root page's body
 * for a hashed name. Nothing here knows how to fetch a path - that is an injected
 * `read(path)` reader, resolving to `{ status, type, body }` - so the exact
 * same list runs against a live URL (`fetchReader`, used by check-site.mjs
 * after a deploy) and against a local `_site/` build (`dirReader`, used by
 * the `--dir` steps of ci.yml's `deploy` and `deploy-replay` jobs before a
 * deploy even starts). Before this file existed, ci.yml's guard step
 * re-implemented a subset of these assertions as hand-written `grep`/`wc`
 * lines that had already drifted from check-site.mjs once.
 *
 * English throughout: this is a tool, not product text (docs/specs/META.md
 * section 6). The rest of tests/ still prints Russian and moves to English
 * in a later batch - this file is not that batch, it is a new one.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** A path with no plausible collision, used to prove the 404 fallback -
 *  both hosts serve /404.html, with a 404 status, for any path that does
 *  not exist. `dirReader` emulates that exact rule locally so this same
 *  check runs before a deploy has happened at all. */
export const UNKNOWN_PATH = 'this-path-does-not-exist-9f2c.html';

/** The 404 page's own marker (404.html carries `<div id="app-404">`,
 *  matching the convention `<div id="app">` already sets in index.html). */
export const NOT_FOUND_MARKER = 'id="app-404"';

const NOINDEX = /<meta\s+name="robots"\s+content="noindex/i;

/* The build writes `/assets/` since `base: '/'` (docs/specs/META.md section 4); `./assets/`
   is the form before it. */
const MODULE = /<script[^>]*type="module"[^>]*src="\.?\/(assets\/[^"]+\.js)"/g;
const SITE = 'https://daggerheart-loot.pages.dev/';

/** The hashed entry module the page references, `assets/<name>.js`, or null
 *  unless there is exactly one. */
export function entryOf(html) {
  const found = [...html.matchAll(MODULE)].map((m) => m[1]);
  return found.length === 1 ? found[0] : null;
}

/** The published schemas by path, each naming its own URL as its `$id`. */
export const SCHEMA_IDS = {
  'schema/import-v1.json': 'https://artex-x.github.io/daggerheart-loot/schema/import-v1.json',
  'schema/import-v2.json': 'https://artex-x.github.io/daggerheart-loot/schema/import-v2.json',
  'schema/import-v3.json': 'https://artex-x.github.io/daggerheart-loot/schema/import-v3.json',
  'schema/homebrew-v1.json':
    'https://artex-x.github.io/daggerheart-loot/schema/homebrew-v1.json',
  'schema/homebrew-v2.json':
    'https://artex-x.github.io/daggerheart-loot/schema/homebrew-v2.json'
};

/** The `$id` of a JSON body, or null when it is not JSON. */
function schemaId(body) {
  try {
    return JSON.parse(body).$id ?? null;
  } catch {
    return null;
  }
}

/** The `format` of a JSON body at version 1, or null. */
function namesFormat(body) {
  try {
    const v = JSON.parse(body);
    return v.version === 1 ? (v.format ?? null) : null;
  } catch {
    return null;
  }
}

/** The parsed JSON of a body, or null when it is not JSON. */
function jsonOf(body) {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

/** The request of a cross-origin probe: a browser tool at another origin. */
const FROM_OTHER_ORIGIN = { method: 'GET', headers: { Origin: 'https://example.org' } };

/** Whether an answer is readable from another origin: `Access-Control-Allow-Origin: *` and no
 *  credentials. A reader that does not measure headers (a directory, a memory site) leaves
 *  `cors` undefined, and the check holds. */
const corsOpen = (meta) => meta.cors === undefined || (meta.cors === '*' && !meta.credentials);

/** The path of the first catalog record that has a picture, read through the bulk catalog:
 *  the index holds no picture URLs, so the first chunk it names gives it. */
async function firstPicture(root, get) {
  const index = jsonOf((await get('api/v1/catalog/index.json')).body);
  const url = String(index?.chunks?.[0] ?? '');
  const chunk = jsonOf((await get(url.startsWith(SITE) ? url.slice(SITE.length) : url)).body);
  const full = chunk?.records?.find((r) => r.image?.full)?.image?.full;
  return typeof full === 'string' && full.startsWith(SITE)
    ? full.slice(SITE.length)
    : 'img/no-picture-found';
}

/* A path that is never on disk, so a page with no entry fails the entry's
   own status check with a readable message. */
const NO_ENTRY = 'assets/no-entry-module.js';
const entryPath = (root) => entryOf(root) ?? NO_ENTRY;

const status200 = (name) => ({
  test: (body, meta) => meta.status === 200,
  message: (meta) => `${name} returned ${meta.status}, not 200`
});

/** The whole site's checks: the app (`appChecks`) and the files both hosts serve
 *  (`fileChecks`), the record and English-root paths as app documents. */
export function checks() {
  return [...appChecks(), ...fileChecks({ documents: true })];
}

/** The checks that `path` answers the app document: 200, html, noindex, `<div id="app">`
 *  and exactly one entry module; `<html lang="en">` when `en`. */
function appDocumentChecks(path, en = false) {
  return [
    { path, ...status200(path) },
    {
      path,
      test: (body, meta) => /html/i.test(meta.type) && NOINDEX.test(body),
      message: (meta) => `${path} is not an html page with noindex ("${meta.type}")`
    },
    {
      path,
      test: (body) => /<div\s+id="app"/.test(body) && entryOf(body) !== null,
      message: `${path} is not the app document: no <div id="app"> or not exactly one entry module`
    },
    ...(en
      ? [
          {
            path,
            test: (body) => body.includes('<html lang="en">'),
            message: `${path} is not the English app document: no <html lang="en">`
          }
        ]
      : [])
  ];
}

/** The app itself: the root page, its entry module, `data.js`, the manifest and the
 *  service worker. Only the site's host runs it; the old host's mirror does not. */
export function appChecks() {
  return [
    { path: '', ...status200('root') },
    {
      path: '',
      test: (body, meta) => /html/i.test(meta.type),
      message: (meta) => `root was served as "${meta.type}", not html`
    },
    {
      path: '',
      test: (body) => /<meta\s+name="robots"\s+content="noindex/i.test(body),
      message: 'the published page has no noindex - docs/specs/META.md section 1'
    },
    {
      path: '',
      test: (body) => entryOf(body) !== null,
      message: 'the published page does not reference exactly one assets/*.js module'
    },
    {
      path: '',
      test: (body) => /<div\s+id="app"/.test(body),
      message: 'the published page has no <div id="app">'
    },
    /* The assertion that the cut-over to the new app actually took: the old
     * app's entry script must be gone, not merely joined by the new one. */
    {
      path: '',
      test: (body) => !/src="\.?\/?app\.js"/.test(body),
      message: 'the published page mixes both apps - src="app.js" is still there'
    },

    /* The entry's name is hashed, so its path is read from the root page. */
    { path: entryPath, ...status200('the entry module') },
    {
      path: entryPath,
      test: (body) => body.length > 20000,
      message: (meta) => `the entry module is only ${meta.body.length} bytes - not a real build`
    },

    { path: 'data.js', ...status200('data.js') },
    {
      path: 'data.js',
      test: (body) => body.startsWith('window.LOOT'),
      message: 'data.js no longer starts by assigning window.LOOT'
    },
    /* The record links' card versions (docs/specs/CONTRACTS.md section 4). */
    {
      path: 'data.js',
      test: (body) => body.includes('\nwindow.LOOT_V = {'),
      message: 'data.js does not carry window.LOOT_V, the card version map'
    },

    /* The installable app (docs/specs/META.md section 9): build outputs
     * copied from app/public/, published by name. */
    { path: 'manifest.webmanifest', ...status200('manifest.webmanifest') },
    {
      path: 'manifest.webmanifest',
      test: (body) => {
        try {
          return JSON.parse(body).start_url === './';
        } catch {
          return false;
        }
      },
      message: 'manifest.webmanifest does not parse as JSON with start_url "./"'
    },
    { path: 'sw.js', ...status200('sw.js') },
    {
      path: 'sw.js',
      test: (body) => body.includes('dhloot-assets-v1') && !body.includes('dhloot-shell'),
      message: 'sw.js is not the current service worker - no dhloot-assets-v1, or a shell cache'
    }
  ];
}

/** The files the site's host and the old host's mirror both serve. `install` is false
 *  for the mirror, which drops the install guide (docs/specs/META.md section 9).
 *  `documents` is true for the site, whose record and English-root paths are app
 *  documents; the mirror's are the redirect pages (docs/specs/CONTRACTS.md section 5). */
export function fileChecks({ install = true, documents = false } = {}) {
  return [
    ...['data.json', 'catalog.csv', 'catalog-index.csv', 'llms.txt', 'robots.txt'].map((f) => ({
      path: f,
      ...status200(f)
    })),

    /* The preview host reads the names at request time (docs/specs/CONTRACTS.md
     * section 4); a card without them loses its craft, set and table lines. */
    { path: 'names.json', ...status200('names.json') },
    {
      path: 'names.json',
      test: (body) => namesFormat(body) === 'daggerheart-loot/names',
      message: (meta) => `names.json names another format: ${String(namesFormat(meta.body))}`
    },

    /* The read API's static files (docs/specs/CONTRACTS.md sections 5 and 6): the version
     * file is internal, so its CORS header is only reported; the bulk catalog's index and the
     * pictures a canvas client loads are public, so Pages must send
     * `Access-Control-Allow-Origin: *` on them (no line in _headers: a second value would break
     * CORS). */
    { path: 'apidata/version.json', ...status200('apidata/version.json') },
    {
      path: 'apidata/version.json',
      test: (body) => jsonOf(body)?.format === 'daggerheart-loot/api-version',
      message: 'apidata/version.json is not a daggerheart-loot/api-version file'
    },
    {
      path: 'apidata/version.json',
      init: FROM_OTHER_ORIGIN,
      info: (meta) =>
        `apidata/version.json sends Access-Control-Allow-Origin: ${meta.cors === undefined ? '(not measured)' : meta.cors || '(none)'}`,
      test: () => true,
      message: ''
    },
    { path: 'api/v1/catalog/index.json', ...status200('api/v1/catalog/index.json') },
    {
      path: 'api/v1/catalog/index.json',
      test: (body) => jsonOf(body)?.format === 'daggerheart-loot/api-catalog',
      message: 'api/v1/catalog/index.json is not a daggerheart-loot/api-catalog file'
    },
    {
      path: 'api/v1/catalog/index.json',
      init: FROM_OTHER_ORIGIN,
      test: (body, meta) => corsOpen(meta),
      message: (meta) =>
        `api/v1/catalog/index.json sends Access-Control-Allow-Origin "${meta.cors ?? ''}" and credentials "${meta.credentials ?? ''}", not * and none - a browser client cannot read the catalog`
    },
    { path: firstPicture, ...status200('a catalog picture'), init: FROM_OTHER_ORIGIN },
    {
      path: firstPicture,
      init: FROM_OTHER_ORIGIN,
      test: (body, meta) => corsOpen(meta),
      message: (meta) =>
        `a catalog picture sends Access-Control-Allow-Origin "${meta.cors ?? ''}", not * - a canvas client cannot load it`
    },

    /* The file schemas are public contracts, each named by its own `$id`
     * (docs/specs/CONTRACTS.md section 4). */
    ...Object.entries(SCHEMA_IDS).flatMap(([f, id]) => [
      { path: f, ...status200(f) },
      {
        path: f,
        test: (body) => schemaId(body) === id,
        message: (meta) => `${f} names another $id: ${String(schemaId(meta.body))}`
      }
    ]),

    /* The record's page is what a messenger fetches for a link preview, one per
     * language (docs/specs/I18N.md); its og:url is the extensionless record link
     * (docs/specs/CONTRACTS.md section 5). On the site it is the app document with
     * the card in its head; on the mirror, the stub that redirects to the site. */
    ...[
      ['i/w1.html', 'i/w1', false],
      ['i/en/w1.html', 'i/en/w1', true]
    ].flatMap(([f, link, en]) => [
      { path: f, ...status200(f) },
      {
        path: f,
        test: (body) => body.includes('og:image'),
        message: `${f} has lost its preview image (og:image)`
      },
      {
        path: f,
        test: (body) =>
          new RegExp(`<meta property="og:url" content="[^"]*/${link}">`).test(body),
        message: `${f} has an og:url that does not end with ${link}`
      },
      ...(documents
        ? [
            ...appDocumentChecks(f, en).slice(1),
            /* The record's text for a reader without JavaScript (llms.txt, "Data"). */
            {
              path: f,
              test: (body) => /<noscript>\s*<article[^>]*>\s*<h1>[^<]+<\/h1>/.test(body),
              message: `${f} does not carry the record's text in a <noscript> block`
            }
          ]
        : [
            {
              path: f,
              test: (body) => !/<div\s+id="app"/.test(body),
              message: `the stub ${f} is the app shell, not the record's own page`
            },
            {
              path: f,
              test: (body) =>
                body.includes('location.replace(' + JSON.stringify(SITE + link) + ')'),
              message: `the stub ${f} does not redirect to ${SITE + link}`
            }
          ])
    ]),

    /* The English entry document: the English card of every link the app
     * hands out in English (docs/specs/META.md section 2). */
    { path: 'en/index.html', ...status200('en/index.html') },
    {
      path: 'en/index.html',
      test: (body) => NOINDEX.test(body) && body.includes('og:title'),
      message: 'en/index.html lost its noindex or its og:title'
    },
    ...(documents
      ? appDocumentChecks('en/index.html', true).slice(2)
      : [
          {
            path: 'en/index.html',
            test: (body) =>
              body.includes(
                'location.replace(' + JSON.stringify(SITE + 'en/') + ' + location.hash)'
              ),
            message: `the mirror's en/index.html does not redirect to ${SITE}en/ with the fragment`
          }
        ]),

    /* One probe per symlinked folder: img/, og/ and card/ are links the
     * build makes, and a broken link is served as a 404 rather than as an
     * error. The row thumbnails ride the img/ link. */
    ...[
      'img/ci1.webp',
      'img/thumb/ci1.webp',
      'og/_share.jpg',
      'og/_share_en.jpg',
      'card/die-d12-bw.svg'
    ].map((f) => ({
      path: f,
      ...status200(f)
    })),

    { path: 'icons/icon-192.png', ...status200('icons/icon-192.png') },

    /* The generated site pages (docs/specs/META.md section 9, "Static
     * pages"): a plain URL outside the app, one copy per language, kept out
     * of search results too. */
    ...(install
      ? ['install', 'privacy', 'terms', 'ai', 'developers']
      : ['privacy', 'terms', 'ai', 'developers']
    )
      .flatMap((id) => ['pages/' + id + '.html', 'pages/en/' + id + '.html'])
      .flatMap((f) => [
        { path: f, ...status200(f) },
        {
          path: f,
          test: (body) =>
            NOINDEX.test(body) && body.includes('id="app-page"') && body.includes('og:title'),
          message: `${f} lost its noindex, its id="app-page" marker or its og:title`
        }
      ]),
    /* The address the Google console publishes against (docs/specs/META.md
     * section 9): the privacy page names the contact. */
    ...['pages/privacy.html', 'pages/en/privacy.html'].map((f) => ({
      path: f,
      test: (body) => body.includes('mailto:daggerheart.loot@gmail.com'),
      message: `${f} does not name the contact address`
    })),

    /* The 404 fallback, owner-approved: a hosted record link truncated by a
     * chat client, or a stub for a record a data change dropped, has to
     * land somewhere better than GitHub's own generic 404 - with no
     * `404.html` every wrong path got GitHub's generic 404 (verified live
     * on `i/zzzz.html`), no link back in either language. See
     * `docs/specs/META.md` section 7. */
    {
      path: UNKNOWN_PATH,
      test: (body, meta) => meta.status === 404,
      message: (meta) =>
        `an unknown path returned ${meta.status}, not 404 - the 404 fallback is not being served`
    },
    {
      path: UNKNOWN_PATH,
      test: (body) => body.includes(NOT_FOUND_MARKER),
      message: 'the 404 response body is not the bilingual way-home page (404.html)'
    }
  ];
}

/** The old host's mirror (docs/specs/META.md section 9, "The old host"): a root page
 *  that forwards to the site's host, a service worker that unregisters itself, no
 *  install guide, and every file the site's host serves. */
export function mirrorChecks() {
  return [
    { path: '', ...status200('root') },
    {
      path: '',
      test: (body, meta) => /html/i.test(meta.type),
      message: (meta) => `root was served as "${meta.type}", not html`
    },
    {
      path: '',
      test: (body) => NOINDEX.test(body) && body.includes('id="app-moved"'),
      message: 'the mirror root lost its noindex or its id="app-moved" text'
    },
    {
      path: '',
      test: (body) => body.includes('https://daggerheart-loot.pages.dev/'),
      message: "the mirror root does not name the site's host"
    },
    {
      path: '',
      test: (body) => !body.includes('type="module"'),
      message: 'the mirror root loads the app; it should only forward'
    },
    { path: 'sw.js', ...status200('sw.js') },
    {
      path: 'sw.js',
      test: (body) => body.includes('unregister') && !body.includes('dhloot-assets-v1'),
      message: "the mirror's sw.js is not the worker that unregisters itself"
    },
    {
      path: 'pages/install.html',
      test: (body, meta) => meta.status === 404,
      message: (meta) => `the mirror serves pages/install.html (${meta.status}), not 404`
    },
    ...fileChecks({ install: false })
  ];
}

/** The preview host's checks (docs/specs/CONTRACTS.md section 5), in the shape of
 *  `checks()`: the site's own robots.txt and the text files' X-Robots-Tag, the MCP
 *  endpoint, the record's app document at its versioned extensionless link, a 404 app
 *  document for each malformed run, for a well-formed uuid no item has and for a
 *  well-formed token no list holds - which prove the secrets, both card reads and the
 *  worker's read of the app document - a table card that read names.json, and the
 *  route paths that _redirects answers with the app document. */
export function previewChecks() {
  const isApp = (body) => /<div\s+id="app"/.test(body) && entryOf(body) !== null;
  const card404 = (path, why) => [
    {
      path,
      test: (body, meta) => meta.status === 404,
      message: (meta) =>
        `${path} returned ${meta.status}, not 404` + (meta.status === 503 ? ` - ${why}` : '')
    },
    {
      path,
      test: (body) => NOINDEX.test(body),
      message: `${path} has no noindex`
    },
    {
      path,
      test: isApp,
      message: `${path} is not the app document - the worker could not read the site's index.html`
    }
  ];
  return [
    {
      path: 'robots.txt',
      test: (body, meta) => meta.status === 200,
      message: (meta) => `robots.txt returned ${meta.status}, not 200`
    },
    {
      path: 'robots.txt',
      test: (body) => /^User-agent:/m.test(body),
      message: 'robots.txt has no User-agent line'
    },
    {
      path: 'robots.txt',
      test: (body) => body.includes('Readable data') && body.includes('Content-Signal:'),
      message: "robots.txt is not the site's own file (no Readable data or Content-Signal:)"
    },
    ...['llms.txt', 'catalog-index.csv'].map((f) => ({
      path: f,
      test: (body, meta) => /noindex/.test(meta.robots ?? ''),
      message: (meta) => `${f} has no X-Robots-Tag: noindex (got "${meta.robots ?? ''}")`
    })),
    ...mcpChecks(),
    ...apiChecks(),
    /* One 308 for a frozen `.html` stub URL (docs/fixtures/urls/record.json, `serve`). */
    {
      path: 'i/w1.html',
      manual: true,
      test: (body, meta) => meta.status === 308 && /(^|\/)i\/w1$/.test(meta.location ?? ''),
      message: (meta) =>
        `i/w1.html answered ${meta.status} to "${meta.location ?? ''}", not one 308 to /i/w1`
    },
    {
      path: 'i/w1?v=x',
      test: (body, meta) =>
        meta.status === 200 &&
        /og:image" content="[^"]*og\/[^"]+\.jpg"/.test(body) &&
        isApp(body),
      message: (meta) =>
        `i/w1?v=x returned ${meta.status}, or not the record's app document with its og:image`
    },
    /* A path that _redirects rewrites to the app document (docs/specs/CONTRACTS.md
     * section 1): a splat after a fixed prefix, an English one, and the bare /tables,
     * with and without its slash, that _routes.json excludes from the worker's /tables/*. */
    ...[
      ['roll/std'],
      ['tables'],
      ['tables/'],
      ['lists/x'],
      ['i/hb_aaaaaaaaaaaaaaaa'],
      ['en/search', true],
      ['en/tables', true],
      ['en/tables/', true],
      ['i/en/hb_aaaaaaaaaaaaaaaa', true]
    ].flatMap(([path, en]) =>
      /* Not following a redirect: a 302 home would read as the root's app document. */
      appDocumentChecks(path, en).map((c) => ({ ...c, manual: true }))
    ),
    /* The app never writes /en/i/; one 301 sends it to the record's English path. */
    {
      path: 'en/i/w1',
      manual: true,
      test: (body, meta) => meta.status === 301 && /(^|\/)i\/en\/w1$/.test(meta.location ?? ''),
      message: (meta) =>
        `en/i/w1 answered ${meta.status} to "${meta.location ?? ''}", not one 301 to /i/en/w1`
    },
    ...card404('h/not-a-uuid', 'a malformed id sends no read'),
    ...card404('s/x', 'a malformed token sends no read'),
    ...card404('p/x', 'a print set sends no read'),
    ...card404(
      'h/00000000-0000-4000-8000-000000000000',
      'the read get_item_preview failed: check the Pages secrets SUPABASE_URL and SUPABASE_KEY and the migration'
    ),
    ...card404(
      's/' + 'A'.repeat(43),
      'the read get_shared_list_preview failed: check the Pages secrets SUPABASE_URL and SUPABASE_KEY and the migration'
    ),
    {
      path: 'tables/core_item',
      test: (body, meta) => meta.status === 200,
      message: (meta) => `tables/core_item returned ${meta.status}, not 200`
    },
    {
      path: 'tables/core_item',
      test: (body) => NOINDEX.test(body) && body.includes('og:title'),
      message: 'tables/core_item lost its noindex or its og:title'
    },
    {
      path: 'tables/core_item',
      test: isApp,
      message: 'tables/core_item is not the app document with its card'
    },
    {
      path: 'tables/core_item',
      test: (body) =>
        /\d/.test(
          (/<meta property="og:description" content="([^"]*)"/.exec(body) || ['', ''])[1]
        ),
      message: 'tables/core_item has no count in its og:description - names.json was not read'
    }
  ];
}

/** The tool names of the MCP endpoint: the `x-mcp-tool` operations of openapi.json without
 *  `security`, in document order. */
function mcpToolNames() {
  const openapi = JSON.parse(
    readFileSync(new URL('../preview/api/openapi.json', import.meta.url), 'utf8')
  );
  return Object.values(openapi.paths)
    .flatMap((ops) => Object.values(ops))
    .filter((op) => op['x-mcp-tool'] && !op.security)
    .map((op) => op['x-mcp-tool']);
}

/** The MCP endpoint's probes on the preview host (docs/specs/CONTRACTS.md section 6): `GET` is
 *  405 with `Allow: POST` and no CORS header, a legacy `tools/list` lists the tools of
 *  openapi.json, the same request with an `Origin` is 403, and `/mcp/me` stays reserved. */
function mcpChecks() {
  const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
  const headers = { 'Content-Type': 'application/json', 'MCP-Protocol-Version': '2025-06-18' };
  const LIST = { method: 'POST', headers, body };
  const FROM_PAGE = {
    method: 'POST',
    headers: { ...headers, Origin: 'https://example.org' },
    body
  };
  return [
    {
      path: 'mcp',
      test: (b, meta) => meta.status === 405,
      message: (meta) =>
        `GET mcp returned ${meta.status}, not 405 - the endpoint takes POST only`
    },
    {
      path: 'mcp',
      test: (b, meta) => meta.allow === 'POST',
      message: (meta) => `GET mcp sends Allow "${meta.allow ?? ''}", not POST`
    },
    {
      path: 'mcp',
      test: (b, meta) => !meta.cors,
      message: 'GET mcp sends Access-Control-Allow-Origin; the endpoint sends no CORS header'
    },
    {
      path: 'mcp',
      init: LIST,
      test: (b, meta) => meta.status === 200,
      message: (meta) => `POST mcp tools/list returned ${meta.status}, not 200`
    },
    {
      path: 'mcp',
      init: LIST,
      test: (b) =>
        JSON.stringify(jsonOf(b)?.result?.tools?.map((t) => t.name)) ===
        JSON.stringify(mcpToolNames()),
      message: 'POST mcp tools/list does not list the tools of openapi.json'
    },
    {
      path: 'mcp',
      init: LIST,
      test: (b, meta) => !meta.cors,
      message: 'POST mcp sends Access-Control-Allow-Origin; the endpoint sends no CORS header'
    },
    {
      path: 'mcp',
      init: FROM_PAGE,
      test: (b, meta) => meta.status === 403,
      message: (meta) => `POST mcp with an Origin header returned ${meta.status}, not 403`
    },
    {
      path: 'mcp/me',
      test: (b, meta) => meta.status === 404,
      message: (meta) => `mcp/me returned ${meta.status}, not 404 - the path is reserved`
    }
  ];
}

/** The read API's probes on the preview host (docs/specs/CONTRACTS.md section 6): a read, the
 *  CORS preflight, a record, the JSON 404 with its CORS header, bare `/api`, one roll, one
 *  search and one file check. */
function apiChecks() {
  const errorCode = (body) => jsonOf(body)?.error?.code;
  const ROLL = 'api/v1/rolls/std';
  const PREFLIGHT = {
    method: 'OPTIONS',
    headers: { Origin: 'https://example.org', 'Access-Control-Request-Method': 'POST' }
  };
  const POST = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ total: 1 })
  };
  const SEARCH = 'api/v1/records?q=sword';
  const CHECK = 'api/v1/file-checks';
  const CHECKED = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      format: 'daggerheart-loot/lists',
      version: 1,
      lists: [{ name: 'Loot', entries: [{ id: 'ci1' }] }]
    })
  };
  return [
    { path: 'api/v1/rolls', ...status200('api/v1/rolls'), init: FROM_OTHER_ORIGIN },
    {
      path: 'api/v1/rolls',
      init: FROM_OTHER_ORIGIN,
      test: (body) => jsonOf(body)?.format === 'daggerheart-loot/api-rolls',
      message: 'api/v1/rolls is not a daggerheart-loot/api-rolls answer'
    },
    {
      path: 'api/v1/rolls',
      init: FROM_OTHER_ORIGIN,
      test: (body, meta) => corsOpen(meta),
      message: (meta) =>
        `api/v1/rolls sends Access-Control-Allow-Origin "${meta.cors ?? ''}" and credentials "${meta.credentials ?? ''}", not * and none`
    },
    {
      path: ROLL,
      init: PREFLIGHT,
      test: (body, meta) => meta.status === 204,
      message: (meta) => `the preflight of ${ROLL} returned ${meta.status}, not 204`
    },
    {
      path: ROLL,
      init: PREFLIGHT,
      test: (body, meta) =>
        meta.cors === undefined ||
        (meta.cors === '*' &&
          !meta.credentials &&
          meta.allowMethods === 'GET, POST, OPTIONS' &&
          meta.allowHeaders === 'Content-Type' &&
          meta.maxAge === '86400'),
      message: (meta) =>
        `the preflight of ${ROLL} sends origin "${meta.cors ?? ''}", methods "${meta.allowMethods ?? ''}", headers "${meta.allowHeaders ?? ''}", max-age "${meta.maxAge ?? ''}"`
    },
    { path: 'api/v1/records/ci1', ...status200('api/v1/records/ci1') },
    {
      path: 'api/v1/records/zzzz',
      init: FROM_OTHER_ORIGIN,
      test: (body, meta) => meta.status === 404 && errorCode(body) === 'not_found',
      message: (meta) =>
        `api/v1/records/zzzz returned ${meta.status}, not the JSON 404 not_found`
    },
    {
      path: 'api/v1/records/zzzz',
      init: FROM_OTHER_ORIGIN,
      test: (body, meta) => corsOpen(meta),
      message:
        'api/v1/records/zzzz sends no Access-Control-Allow-Origin: *, so a browser client cannot read the error'
    },
    {
      path: 'api',
      test: (body, meta) => meta.status === 404 && errorCode(body) === 'not_found',
      message: (meta) => `api returned ${meta.status}, not the JSON 404 of the worker`
    },
    {
      path: ROLL,
      init: POST,
      test: (body, meta) =>
        meta.status === 200 && jsonOf(body)?.format === 'daggerheart-loot/api-roll',
      message: (meta) =>
        `POST ${ROLL} returned ${meta.status}, not a daggerheart-loot/api-roll answer`
    },
    {
      path: ROLL,
      init: POST,
      test: (body) => (jsonOf(body)?.results?.length ?? 99) <= 4,
      message: `POST ${ROLL} answered more than four results`
    },
    {
      path: SEARCH,
      test: (body, meta) =>
        meta.status === 200 && jsonOf(body)?.format === 'daggerheart-loot/api-search',
      message: (meta) =>
        `${SEARCH} returned ${meta.status}, not a daggerheart-loot/api-search answer`
    },
    {
      path: CHECK,
      init: CHECKED,
      test: (body, meta) => meta.status === 200 && jsonOf(body)?.ok === true,
      message: (meta) =>
        `POST ${CHECK} of a one-list lists file returned ${meta.status}, not ok`
    }
  ];
}

/** Runs `list` (default: the whole `checks()`) against `read`, caching one
 *  read per distinct path - several checks share a path (root, for
 *  instance), and re-reading it once per check would be wasteful for a
 *  network reader and pointless for a filesystem one. A check with
 *  `manual: true` reads its path without following a redirect. Returns the
 *  list of failure messages, empty when everything held. */
export async function runChecks(read, list = checks(), { onInfo } = {}) {
  const cache = new Map();
  const get = async (path, manual = false, init = undefined) => {
    const key = (manual ? 'manual:' : '') + (init ? JSON.stringify(init) + ' ' : '') + path;
    if (!cache.has(key)) cache.set(key, await read(path, { manual, init }));
    return cache.get(key);
  };
  const bad = [];
  for (const c of list) {
    /* A function path is read from the root page's body; it may read other paths too. */
    const path =
      typeof c.path === 'function' ? await c.path((await get('')).body, get) : c.path;
    const meta = await get(path, c.manual === true, c.init);
    if (c.info && onInfo) onInfo(c.info(meta));
    if (!c.test(meta.body, meta)) {
      bad.push(typeof c.message === 'function' ? c.message(meta) : c.message);
    }
  }
  return bad;
}

/** The live-URL reader: plain `fetch`, no dependency, so it can run in a job
 *  that has not necessarily installed anything. `AbortSignal.timeout` gives
 *  every request a hard ceiling so one stalled CDN socket cannot hang this
 *  step indefinitely (the existing catch below already
 *  treats an abort as a retry) - it bounds a single request, not the whole
 *  retry loop below: `checks()`'s 25 distinct paths, `TRIES=6` and
 *  `WAIT_MS=10_000` between attempts add up to a worst case of roughly
 *  25 x 15s x 6 + 5 x 10s, about 38 minutes, if every request on every try
 *  stalls to its own ceiling - past `deploy`'s own 20-minute job timeout.
 *  That worst case needs every request to fail
 *  identically on every attempt, unlike the few-seconds-of-stale-CDN read
 *  this retry loop actually exists for; the job timeout is still what bounds
 *  it in the end. */
export function fetchReader(root, timeoutMs = 15_000) {
  return async (path, { manual = false, init = {} } = {}) => {
    const url = root + path;
    const res = await fetch(url, {
      ...init,
      cache: 'no-store',
      redirect: manual ? 'manual' : 'follow',
      signal: AbortSignal.timeout(timeoutMs)
    });
    const body = await res.text();
    return {
      url,
      status: res.status,
      type: res.headers.get('content-type') || '',
      robots: res.headers.get('x-robots-tag') || '',
      location: res.headers.get('location') || '',
      cors: res.headers.get('access-control-allow-origin') || '',
      credentials: res.headers.get('access-control-allow-credentials') || '',
      allow: res.headers.get('allow') || '',
      allowMethods: res.headers.get('access-control-allow-methods') || '',
      allowHeaders: res.headers.get('access-control-allow-headers') || '',
      maxAge: res.headers.get('access-control-max-age') || '',
      body
    };
  };
}

/** The local-`_site/`-build reader, used before a deploy exists at all
 *  (the `--dir` steps of ci.yml's `deploy` and `deploy-replay`). Emulates
 *  only the one Pages rule this file's checks depend on: a path that is not
 *  on disk is served as 404.html's content with a 404 status - not GitHub
 *  Pages' missing-path behavior in
 *  general, which measurably diverges from this locally (an extensionless
 *  path is 200 live but 404 here; a directory path throws `EISDIR`; a
 *  case-insensitive filesystem 200s where Pages 404s). None of that matters
 *  to `checks()` above: every path it asserts against is an exact file,
 *  never one of those three shapes, so the one rule this reader does
 *  emulate is the only one any check here relies on. This is what makes the
 *  404-fallback checks above meaningful against a plain directory, not only
 *  against the live site. */
export function dirReader(dir) {
  return async (path) => {
    const rel = path === '' ? 'index.html' : path;
    const full = join(dir, rel);
    if (existsSync(full)) {
      return {
        url: full,
        status: 200,
        type: typeOf(rel),
        robots: '',
        body: readFileSync(full, 'utf8')
      };
    }
    const fallback = join(dir, '404.html');
    if (existsSync(fallback)) {
      return {
        url: full,
        status: 404,
        type: typeOf('404.html'),
        robots: '',
        body: readFileSync(fallback, 'utf8')
      };
    }
    return { url: full, status: 404, type: '', robots: '', body: '' };
  };
}

function typeOf(rel) {
  if (rel.endsWith('.html')) return 'text/html';
  if (rel.endsWith('.js')) return 'application/javascript';
  if (rel.endsWith('.json')) return 'application/json';
  if (rel.endsWith('.csv')) return 'text/csv';
  if (rel.endsWith('.txt')) return 'text/plain';
  if (rel.endsWith('.svg')) return 'image/svg+xml';
  if (rel.endsWith('.webmanifest')) return 'application/manifest+json';
  if (rel.endsWith('.png')) return 'image/png';
  return '';
}
