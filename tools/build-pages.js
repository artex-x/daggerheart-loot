/*
  Builds the site's static pages into pages/<id>.html from the authored body
  fragments in pages/src/<id>.html. One template for all of them: the head,
  the style, the <main id="app-page"> shell and its two back links. Both languages sit on one
  page, Russian first, as 404.html does.

  One more page is one PAGES entry below (its id and its two titles), one
  source file pages/src/<id>.html, and one link in the footer nav
  (Shell.svelte, with a dict.ts key pair). The nav's {#if app.showInstall}
  guard is for the install link only: with a second link, move it onto the
  install <a>. pages/src/ is authored and never published; pages/*.html is
  generated and never committed.
  docs/specs/META.md section 9, "Static pages".

  Run after editing a source:   node tools/build.js
*/
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'pages');
const SRC = path.join(OUT, 'src');

const PAGES = [
  { id: 'install', title: { ru: 'Установить как приложение', en: 'Install as an app' } }
];

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/* Both languages in one link: it sits above and below the two
   sections. The script below turns it into history.back(). */
const BACK =
  '<a class="back" href="../" data-back><span lang="ru">Назад к генератору</span>' +
  ' / <span lang="en">Back to the generator</span></a>';

/* Links inside a page are relative ("../" is the app): unlike 404.html, a page
   here is always served at its own path. */
function page({ title, body }) {
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<!-- kept out of search results, same as every other page - docs/specs/META.md
     section 1 -->
<meta name="robots" content="noindex, nofollow">
<title>${esc(title.ru)} / ${esc(title.en)} — Daggerheart Loot</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ctext y='26' font-size='26'%3E%F0%9F%97%9D%3C/text%3E%3C/svg%3E">
<style>
  body{background:#0e0c15;color:#ece8f6;font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
       margin:0;padding:24px}
  main{max-width:640px;margin:0 auto}
  h1{font-size:22px;margin:0 0 10px}
  h2{font-size:16px;margin:22px 0 6px;color:#d8ab5e}
  p,li{color:#cfc8e0}
  p{margin:0 0 12px}
  ol{margin:0 0 12px;padding-left:22px}
  hr{border:none;border-top:1px solid #2a2438;margin:28px 0}
  a{color:#d8ab5e}
  .back{display:inline-block;margin:8px 0 16px}
</style>
</head>
<body>
<main id="app-page">
${BACK}
${body}${BACK}
</main>
<script>
  /* A referrer carries no fragment; history.back() returns to the exact
     hash route. docs/specs/META.md section 9, "Static pages". */
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target instanceof Element ? e.target.closest('a[data-back]') : null;
    if (!a || !document.referrer || history.length < 2) return;
    var app = new URL('../', location.href);
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

function render(id) {
  const entry = PAGES.find((p) => p.id === id);
  if (!entry)
    throw new Error('No site page "' + id + '". Add it to PAGES in tools/build-pages.js');
  const body = fs.readFileSync(path.join(SRC, id + '.html'), 'utf8');
  return page({ title: entry.title, body });
}

/* Exported so tests/derived.js can compare every page on disk with a fresh
   render, the way it compares the share stubs. */
module.exports = { PAGES, BACK, page, render };

if (require.main === module) {
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of fs.readdirSync(OUT)) {
    const full = path.join(OUT, f);
    if (f.endsWith('.html') && fs.statSync(full).isFile()) fs.unlinkSync(full);
  }
  for (const { id } of PAGES)
    fs.writeFileSync(path.join(OUT, id + '.html'), render(id), 'utf8');
  console.log('wrote ' + PAGES.length + ' site pages into pages/');
}
