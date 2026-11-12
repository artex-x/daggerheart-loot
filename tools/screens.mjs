// Captures the README screenshots from the built app: npm run screens
// (builds both directories first), or node tools/screens.mjs [--only=<name>] after a build.
// A file is rewritten only when more than 0.1 % of its pixels change, so a recapture
// of an unchanged screen leaves git alone. The procedure: .claude/README.md, "Screenshots".

import { mkdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import {
  FILE_BUDGET,
  LANGS,
  PIXEL_TOLERANCE,
  SHOTS,
  SCREENS_DIR,
  changedShare,
  outPath
} from './screens.lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SETTLE_MS = 15_000;

const { assertBuilt, serveDist } = createRequire(import.meta.url)('../tests/app/serve.js');

const only = process.argv.find((a) => a.startsWith('--only='))?.slice('--only='.length);
const shots = only ? SHOTS.filter((s) => s.name === only) : SHOTS;
if (shots.length === 0)
  fail(
    'No shot is named ' + String(only) + '. Use one of: ' + SHOTS.map((s) => s.name).join(', ')
  );

function fail(sentence) {
  console.log('screens: ' + sentence);
  process.exit(1);
}

/* The server takes a native path: a forward-slash path on Windows makes every request a 404. */
const builds = [...new Set(shots.map((s) => s.build))];
const servers = new Map();
const listening = [];
for (const dir of builds) {
  assertBuilt(path.resolve(ROOT, dir), dir + '/');
  const server = await serveDist(path.resolve(ROOT, dir));
  listening.push(server);
  servers.set(dir, 'http://127.0.0.1:' + String(server.address().port));
}

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
});

/* The page is settled when its fonts are loaded, every picture in view is decoded and
   no animation runs. Returns the missing condition, or '' when none is missing. */
async function missingCondition(page) {
  return page.evaluate(async () => {
    await document.fonts.ready;
    const inView = (el) => {
      const r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
    };
    const pictures = [...document.images].filter(inView);
    for (const img of pictures) {
      if (!img.complete || img.naturalWidth === 0)
        return 'a picture in view is not loaded: ' + img.src;
      await img.decode().catch(() => undefined);
    }
    if (document.querySelector('#app')?.children.length === 0) return 'the app has not mounted';
    if (document.getAnimations().some((a) => a.playState === 'running')) {
      return 'an animation is still running';
    }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return '';
  });
}

async function settle(page, label) {
  const until = Date.now() + SETTLE_MS;
  let missing = 'the page has not started';
  while (Date.now() < until) {
    missing = await missingCondition(page).catch((e) => String(e));
    if (missing === '') return;
    await new Promise((r) => setTimeout(r, 200));
  }
  fail(label + ' did not settle in 15 s: ' + missing);
}

/* Compares the new image with the file on disk after decoding both, in the browser, the
   one decoder that reads WebP here. Returns the share of changed pixels. */
async function changedBetween(page, oldBytes, newBytes) {
  return page.evaluate(
    async (src, a, b) => {
      const pixels = async (b64) => {
        const img = new Image();
        img.src = 'data:image/webp;base64,' + b64;
        await img.decode();
        const c = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, c.width, c.height).data;
      };
      return new Function('return ' + src)()(await pixels(a), await pixels(b));
    },
    changedShare.toString(),
    oldBytes.toString('base64'),
    newBytes.toString('base64')
  );
}

mkdirSync(path.resolve(ROOT, SCREENS_DIR), { recursive: true });
const compare = await browser.newPage();
await compare.goto('about:blank');

let total = 0;
for (const shot of shots) {
  for (const lang of LANGS) {
    const label = shot.name + '-' + lang;
    /* A context of its own: the stored language of one capture must not reach the next. */
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport({ ...shot.viewport, deviceScaleFactor: 2 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.goto(servers.get(shot.build) + shot.route[lang], { waitUntil: 'networkidle0' });
    if (shot.roll) {
      const field = await page.$('input[type="text"]');
      if (!field) fail(label + ' has no roll field to type the value in.');
      await field.focus();
      await field.evaluate((el) => el.select());
      await page.keyboard.type(shot.roll);
      await page.keyboard.press('Enter');
    }
    await page.addStyleTag({ content: '* { caret-color: transparent !important; }' });
    await settle(page, label);
    const bytes = Buffer.from(await page.screenshot({ type: 'webp', quality: 80 }));
    await context.close();
    if (bytes.length > FILE_BUDGET) {
      fail(
        label +
          ' is ' +
          String(bytes.length) +
          ' bytes, over the ' +
          String(FILE_BUDGET) +
          ' byte budget.'
      );
    }
    const file = path.resolve(ROOT, outPath(shot, lang));
    let state = 'written';
    if (existsSync(file)) {
      const share = await changedBetween(compare, readFileSync(file), bytes);
      if (share <= PIXEL_TOLERANCE) state = 'unchanged';
    }
    if (state === 'written') writeFileSync(file, bytes);
    total += statSync(file).size;
    console.log(label + ' ' + state + ' ' + String(statSync(file).size) + ' bytes');
  }
}

await browser.close();
for (const server of listening) {
  server.closeAllConnections();
  server.close();
}
console.log('total ' + String(total) + ' bytes');
