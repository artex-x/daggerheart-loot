/**
 * Measure the live app against the rewrite, on one route, for one selector.
 *
 *   node tools/probe.mjs "#/tables/community" ".toolbar input[type=search]"
 *   node tools/probe.mjs "#/tables" ".row" --width 375 --all
 *
 * Written because three sessions in a row wrote this script from scratch, and
 * two of them got a different answer than the parity harness because they
 * launched Chrome differently. The launch args below are the harness's own
 * (tests/app/driver.js): without them Chrome takes the GPU rendering path
 * and results stop being comparable to a parity run - or reproducible at all.
 *
 * Reads computed styles and geometry, never pixels. A pixel percentage is what
 * the harness reports; this is for finding out *why* it reports it.
 */
import puppeteer from 'puppeteer';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const ARGS = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = ARGS.indexOf(`--${name}`);
  return i === -1 ? fallback : ARGS[i + 1];
};

const route = ARGS[0];
const selector = ARGS[1];
if (!route || !selector || route.startsWith('--')) {
  console.log('usage: node tools/probe.mjs <route> <selector> [--width 1100] [--all] [--lang ru]');
  process.exit(1);
}

/* Git Bash rewrites an argument that looks like a POSIX path, so `#/tables/x`
   arrives as `#C:/Program Files/Git/tables/x`. Catch it rather than probing a
   route that does not exist and reporting "no match". */
if (/^#[A-Za-z]:[\/]/.test(route)) {
  console.log(`the shell rewrote the route into a Windows path: ${route}`);
  console.log('re-run it as:  MSYS_NO_PATHCONV=1 node tools/probe.mjs "<route>" "<selector>"');
  process.exit(1);
}

const width = Number(flag('width', '1100'));
const height = Number(flag('height', '900'));
const lang = flag('lang', 'ru');
const all = ARGS.includes('--all');

/* The same fields every one of those hand-written scripts ended up reading,
   plus the text advance - a font-size bug moves that and nothing else. */
const READ = `(sel, all) => {
  const els = all ? [...document.querySelectorAll(sel)] : [document.querySelector(sel)];
  return els.filter(Boolean).map((el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(el);
    const advance = range.getBoundingClientRect().width;
    range.detach();
    return {
      text: (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 48),
      html: el.innerHTML.slice(0, 120),
      x: +r.x.toFixed(2), y: +r.y.toFixed(2),
      w: +r.width.toFixed(2), h: +r.height.toFixed(2),
      advance: +advance.toFixed(2),
      font: cs.font || [cs.fontWeight, cs.fontSize, cs.lineHeight, cs.fontFamily].join(' '),
      fontSize: cs.fontSize, lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing,
      fontFamily: cs.fontFamily.split(',')[0],
      padding: cs.padding, margin: cs.margin, display: cs.display, gap: cs.gap,
      placeholder: el.placeholder || undefined
    };
  });
}`;

const targets = {
  legacy: pathToFileURL(path.join(ROOT, 'index.html')).href,
  next: pathToFileURL(path.join(ROOT, 'dist', 'index.html')).href
};

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
});

const seen = {};
for (const [name, url] of Object.entries(targets)) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.goto(url + route, { waitUntil: 'networkidle0' });
  if (lang !== 'ru') {
    /* The language is a press, the same way the harness reaches it. */
    const btn = await page.$(`::-p-text(${lang.toUpperCase()})`);
    if (btn) await btn.click();
  }
  /* B3 lost a session to a font-swap race: layout read before the real font
     lands is a different layout. */
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 400));
  seen[name] = await page.evaluate(new Function('sel', 'all', `return (${READ})(sel, all)`), selector, all); // eslint-disable-line no-new-func
  seen[`${name}_scrollY`] = await page.evaluate(() => window.scrollY);
  await page.close();
}
await browser.close();

console.log(`${route}  ${selector}  @ ${lang} ${String(width)}`);
console.log(`scrollY: legacy ${String(seen.legacy_scrollY)}  next ${String(seen.next_scrollY)}`);

const rows = Math.max(seen.legacy.length, seen.next.length);
if (!rows) {
  console.log('no match in either app');
  process.exit(1);
}

let differing = 0;
for (let i = 0; i < rows; i++) {
  const a = seen.legacy[i];
  const b = seen.next[i];
  if (!a || !b) {
    differing++;
    console.log(`\n[${String(i)}] present in ${a ? 'legacy' : 'next'} only`);
    console.log(JSON.stringify(a || b, null, 1));
    continue;
  }
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  const diff = keys.filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
  if (!diff.length) continue;
  differing++;
  console.log(`\n[${String(i)}] ${a.text || a.html.slice(0, 32)}`);
  for (const k of diff) console.log(`  ${k}:  legacy ${JSON.stringify(a[k])}  ->  next ${JSON.stringify(b[k])}`);
}

console.log(
  differing
    ? `\n${String(differing)} of ${String(rows)} differ`
    : `\nall ${String(rows)} match on every field read`
);
