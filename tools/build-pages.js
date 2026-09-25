/*
  Builds the site's static pages, one page per language: pages/<id>.html in
  Russian from the body fragment pages/src/<id>.html, and pages/en/<id>.html
  in English from pages/src/en/<id>.html. One template for all of them: the
  head (with a text preview card from the PAGES entry's title and desc
  pairs), the style, the <main id="app-page"> shell, the back link at the
  top and the bottom (its script returns to the screen the reader left) and
  the link to the page in the other language right under the top back link.
  The template owns these links because their depth differs between the two
  outputs, so a fragment is content only and links an app route only as
  %APP%#/<route>, which page() resolves to that output's own back link.

  One more page is one PAGES entry below (its id, its two titles and its two
  descriptions), two fragments, and one footer link in Shell.svelte that
  starts from pagesDir, so a reader lands on the page of the language on
  screen. pages/src/ is authored and never published; pages/*.html and
  pages/en/*.html are generated and never committed.
  docs/specs/META.md section 9, "Static pages".

  Run after editing a source:   node tools/build.js
*/
const fs = require('fs');
const path = require('path');
const { SITE } = require('./build-share-pages.js');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'pages');
const OUT_EN = path.join(OUT, 'en');
const SRC = path.join(OUT, 'src');
const SRC_EN = path.join(SRC, 'en');

const LANGS = ['ru', 'en'];

const PAGES = [
  {
    id: 'install',
    title: { ru: 'Установить как приложение', en: 'Install as an app' },
    desc: {
      ru: 'Как поставить сайт на телефон или компьютер как приложение.',
      en: 'How to put the site on a phone or a computer as an app.'
    }
  },
  {
    id: 'privacy',
    title: { ru: 'Конфиденциальность', en: 'Privacy' },
    desc: {
      ru: 'Что хранит генератор лута, где это лежит и как это удалить.',
      en: 'What the loot generator stores, where it is kept, and how to delete it.'
    }
  },
  {
    id: 'terms',
    title: { ru: 'Условия использования', en: 'Terms of use' },
    desc: {
      ru: 'Правила пользования сайтом, отсутствие гарантий и лицензия на игровые материалы.',
      en: 'Rules for using the site, no uptime promise, and the licence for the game content.'
    }
  }
];

const TEXT = {
  ru: {
    site: 'Генератор лута Daggerheart',
    locale: 'ru_RU',
    back: 'Назад к генератору',
    backHref: '../',
    other: 'English',
    otherLang: 'en',
    otherHref: (id) => 'en/' + id + '.html'
  },
  en: {
    site: 'Daggerheart Loot Generator',
    locale: 'en_US',
    back: 'Back to the generator',
    backHref: '../../',
    other: 'Русский',
    otherLang: 'ru',
    otherHref: (id) => '../' + id + '.html'
  }
};

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/* A fragment links an app route only through %APP%: the app root sits at
   a different depth from each output, and only the template knows which. */
function appLinks(body, backHref) {
  return body.replaceAll('%APP%', backHref);
}

/* Links inside a page are relative: unlike 404.html, a page here is always
   served at its own path. */
function page({ id, lang, title, desc, body }) {
  const t = TEXT[lang];
  const other = TEXT[t.otherLang];
  const url = SITE + (lang === 'ru' ? 'pages/' : 'pages/en/') + id + '.html';
  const backLink = '<a class="back" href="' + t.backHref + '" data-back>' + t.back + '</a>';
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<!-- kept out of search results, same as every other page - docs/specs/META.md
     section 1 -->
<meta name="robots" content="noindex, nofollow">
<title>${esc(title[lang])} — ${t.site}</title>
<meta name="description" content="${esc(desc[lang])}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${t.site}">
<meta property="og:title" content="${esc(title[lang])}">
<meta property="og:description" content="${esc(desc[lang])}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="${t.locale}">
<meta property="og:locale:alternate" content="${other.locale}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(title[lang])}">
<meta name="twitter:description" content="${esc(desc[lang])}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ctext y='26' font-size='26'%3E%F0%9F%97%9D%3C/text%3E%3C/svg%3E">
<style>
  body{background:#0e0c15;color:#ece8f6;font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
       margin:0;padding:24px}
  main{max-width:640px;margin:0 auto}
  h1{font-size:22px;margin:0 0 10px}
  h2{font-size:16px;margin:22px 0 6px;color:#d8ab5e}
  h3{font-size:15px;margin:16px 0 4px}
  p,li{color:#cfc8e0}
  p{margin:0 0 12px}
  ol,ul{margin:0 0 12px;padding-left:22px}
  a{color:#d8ab5e}
  .lang{font-size:13px;margin:0 0 16px}
  .back{display:inline-block;margin:8px 0 16px}
</style>
</head>
<body>
<main id="app-page">
${backLink}
<nav class="lang"><a href="${t.otherHref(id)}" lang="${t.otherLang}" hreflang="${t.otherLang}">${t.other}</a></nav>
${appLinks(body, t.backHref)}${backLink}
</main>
<script>
  /* A referrer carries no fragment; history.back() returns to the exact
     hash route. The link's own href names the app root at either depth.
     docs/specs/META.md section 9, "Static pages". */
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target instanceof Element ? e.target.closest('a[data-back]') : null;
    if (!a || !document.referrer || history.length < 2) return;
    var app = new URL(a.getAttribute('href'), location.href);
    var from = new URL(document.referrer);
    if (from.origin !== app.origin || from.pathname.indexOf(app.pathname) !== 0) return;
    var rel = from.pathname.slice(app.pathname.length);
    if (rel !== '' && rel !== 'index.html') return;
    e.preventDefault();
    history.back();
  });
</script>
</body>
</html>
`;
}

function render(id, lang = 'ru') {
  const entry = PAGES.find((p) => p.id === id);
  if (!entry)
    throw new Error('No site page "' + id + '". Add it to PAGES in tools/build-pages.js');
  if (!TEXT[lang]) throw new Error('No site page language "' + lang + '". Use ru or en');
  const src = lang === 'ru' ? path.join(SRC, id + '.html') : path.join(SRC_EN, id + '.html');
  if (!fs.existsSync(src))
    throw new Error(
      'pages/src/' +
        (lang === 'ru' ? '' : 'en/') +
        id +
        '.html is missing: every site page has both languages'
    );
  const body = fs.readFileSync(src, 'utf8');
  return page({ id, lang, title: entry.title, desc: entry.desc, body });
}

/* Exported so tests/derived.js can compare every page on disk with a fresh
   render, the way it compares the share stubs. */
module.exports = { PAGES, LANGS, page, render };

if (require.main === module) {
  for (const dir of [OUT, OUT_EN]) {
    fs.mkdirSync(dir, { recursive: true });
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (f.endsWith('.html') && fs.statSync(full).isFile()) fs.unlinkSync(full);
    }
  }
  for (const { id } of PAGES) {
    fs.writeFileSync(path.join(OUT, id + '.html'), render(id, 'ru'), 'utf8');
    fs.writeFileSync(path.join(OUT_EN, id + '.html'), render(id, 'en'), 'utf8');
  }
  console.log(
    'wrote ' + PAGES.length + ' site pages into pages/ and ' + PAGES.length + ' into pages/en/'
  );
}
