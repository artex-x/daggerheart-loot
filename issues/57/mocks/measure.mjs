// First-screen measure of the batch mocks: the top of each main state's primary
// content below the top of the app header, at 360x640 and 1180x720, RU and EN.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const req = createRequire('E:/dev/daggerheart-loot/.claude/worktrees/57/package.json');
const puppeteer = req('puppeteer');
const base = 'E:/dev/daggerheart-loot/.claude/worktrees/57/issues/57/mocks/';
const STATES = [
  ['2', 'header', '.frame main, main', 'page content under the header and mode row'],
  ['3', 'catalog', '.rl, tbody tr, .trow', 'first table row'],
  ['4', 'item', 'article.dossier, article', 'the item'],
  ['5', 'roller', 'article.scard', 'first roll result'],
  ['6', 'homebrew-items', '.rl', 'first item row'],
  ['6', 'editor', '.eform .ef, .ef', 'first form field'],
  ['7', 'search-results', '.rl', 'first result'],
  ['7', 'account-settings', 'section.panel', 'first settings panel'],
  ['7', 'print-preview', 'img.sheetimg, .sheet', 'the sheet'],
  ['8', 'lists-index', 'article.lcard', 'first list card'],
  ['9', 'list', '.lrow', 'first list entry'],
  ['9', 'shared-player', '.rl', 'first list entry']
];
const VIEWS = [
  [360, 640],
  [1180, 720]
];
const browser = await puppeteer.launch({ headless: true });
const rows = [];
for (const [folder, state, sel, what] of STATES) {
  for (const [w, h] of VIEWS) {
    for (const lang of ['ru', 'en']) {
      const page = await browser.newPage();
      await page.setViewport({ width: w, height: h });
      await page.goto(pathToFileURL(base + folder + '/state.html').href + '?s=' + state + '&lang=' + lang, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const r = await page.evaluate((sel) => {
        const head = document.querySelector('header.top');
        const top0 = head ? head.getBoundingClientRect().top : 0;
        const el = [...document.querySelectorAll(sel)].find((e) => e.getBoundingClientRect().height > 0);
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return { top: Math.round(b.top - top0), height: Math.round(b.height), head: head ? Math.round(head.getBoundingClientRect().height) : 0 };
      }, sel);
      rows.push({ folder, state, what, w, h, lang, ...(r || { top: null }) });
      await page.close();
    }
  }
}
await browser.close();
for (const x of rows) {
  const cap = Math.round(x.h * 0.4);
  const verdict = x.top === null ? 'not found' : x.top <= cap ? 'pass' : x.top < x.h ? 'fail (in screen, controls > 40%)' : 'fail (below the fold)';
  console.log([x.folder + '/' + x.state, x.what, x.w + 'x' + x.h, x.lang, x.top, cap, x.head, x.height, verdict].join(' | '));
}
