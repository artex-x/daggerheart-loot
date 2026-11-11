/* Planner probe 2 for 57-debt plan-phone.md: D132 (record dialog «Ещё» and «В список» on a
   short wide window, opened from the catalog row) and D141 (the editor preview with a long record). */
const path = require('path');
const fs = require('fs');
const WT = 'E:/dev/daggerheart-loot/.claude/worktrees/57-debt';
const puppeteer = require('E:/dev/daggerheart-loot/node_modules/puppeteer');
const { makeDriver, prepare } = require(WT + '/tests/app/driver.js');
const { serveDist } = require(WT + '/tests/app/serve.js');
const OUT = __dirname;
const out = {};

async function main() {
  const server = await serveDist(path.join(WT, 'dist-test'));
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-gpu'],
    protocolTimeout: 300000
  });
  async function open(route, { width, height, lang = 'ru', as } = {}) {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    await prepare(page);
    await page.evaluateOnNewDocument((l) => {
      try {
        localStorage.setItem('dhloot.lang.v1', l);
      } catch (e) {
        void e;
      }
    }, lang);
    await page.setViewport({ width, height });
    const d = makeDriver(page, 'next', base);
    await d.open(route, as ? { as } : {});
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 400));
    return { ctx, page, d };
  }
  const run = async (name, fn) => {
    try {
      out[name] = await fn();
    } catch (e) {
      out[name] = { error: String((e && e.message) || e) };
    }
    console.log(name, JSON.stringify(out[name]));
  };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  for (const as of [undefined, 'gm1']) {
    for (const [w, h] of [
      [1000, 720],
      [1180, 720],
      [1920, 950]
    ]) {
      await run(`D132 ci1 ${w}x${h} ${as || 'signed-out'}`, async () => {
        const { ctx, page, d } = await open('#/tables/core_item', { width: w, height: h, as });
        await d.press('Первоклассный Спальный Мешок');
        for (let i = 0; i < 40 && !(await page.$('dialog[open] .modal-card')); i++)
          await wait(100);
        await wait(400);
        const read = () =>
          page.evaluate(() => {
            const card = document.querySelector('dialog[open] .modal-card');
            const cb = card.getBoundingClientRect();
            const m =
              document.querySelector('dialog[open] [role="menu"]') ??
              document.querySelector('dialog[open] .dropmenu');
            const mb = m?.getBoundingClientRect();
            const field = m?.querySelector('input');
            const btns = [
              ...card.querySelectorAll(
                '.cardpick > .btn, .cardpick .morewrap > .btn, .cardpick .seldrop > .btn'
              )
            ].map((b) => ({
              t: b.textContent.trim().replace(/\s+/g, ' '),
              top: Math.round(b.getBoundingClientRect().top),
              bottom: Math.round(b.getBoundingClientRect().bottom)
            }));
            const img = card.querySelector('img');
            return {
              scrollTop: card.scrollTop,
              scrollH: card.scrollHeight,
              clientH: card.clientHeight,
              card: { top: Math.round(cb.top), bottom: Math.round(cb.bottom) },
              img: img ? Math.round(img.getBoundingClientRect().top) : null,
              btns,
              menu: mb
                ? {
                    top: Math.round(mb.top),
                    bottom: Math.round(mb.bottom),
                    h: Math.round(mb.height),
                    up: m.classList.contains('up'),
                    cropTop: Math.max(0, Math.round(cb.top - mb.top)),
                    cropBottom: Math.max(0, Math.round(mb.bottom - cb.bottom))
                  }
                : null,
              field: field ? Math.round(field.getBoundingClientRect().top) : null,
              focus: document.activeElement?.textContent?.trim().slice(0, 30) ?? null
            };
          });
        const at0 = await read();
        await page.click('dialog[open] .cardpick .morewrap > .btn');
        await wait(500);
        const more = await read();
        await page.screenshot({ path: path.join(OUT, `d132b-more-${w}-${as || 'out'}.png`) });
        await page.keyboard.press('Escape');
        await wait(300);
        const afterEsc = await page.evaluate(
          () => document.querySelector('dialog[open] .modal-card')?.scrollTop ?? null
        );
        await page.evaluate(() => {
          const c = document.querySelector('dialog[open] .modal-card');
          if (c) c.scrollTop = 0;
        });
        await page.click('dialog[open] .seldrop > .btn');
        await wait(600);
        const list = await read();
        await page.screenshot({ path: path.join(OUT, `d132b-list-${w}-${as || 'out'}.png`) });
        await ctx.close();
        return { at0, more, afterEsc, list };
      });
    }
  }

  /* D141: the editor preview with gm4's 3000-character item. */
  for (const [w, h] of [
    [1180, 720],
    [1920, 950],
    [1000, 720]
  ]) {
    await run(`D141 preview long ${w}x${h}`, async () => {
      const { ctx, page } = await open('#/homebrew/hb_longtextaaaaaaaa', {
        width: w,
        height: h,
        as: 'gm4'
      });
      await wait(600);
      const r = await page.evaluate(async () => {
        const p = document.querySelector('.preview');
        if (!p) return null;
        const at = () => {
          const b = p.getBoundingClientRect();
          return {
            top: Math.round(b.top),
            bottom: Math.round(b.bottom),
            clientH: p.clientHeight,
            scrollH: p.scrollHeight
          };
        };
        const s0 = at();
        p.scrollTop = p.scrollHeight;
        const last = p.lastElementChild?.getBoundingClientRect();
        const s0end = { ...at(), lastBottom: last ? Math.round(last.bottom) : null };
        p.scrollTop = 0;
        window.scrollTo(0, 400);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const s400 = at();
        return {
          win: innerHeight,
          docH: document.documentElement.scrollHeight,
          pos: getComputedStyle(p).position,
          maxH: getComputedStyle(p).maxHeight,
          s0,
          s0end,
          s400
        };
      });
      await page.screenshot({ path: path.join(OUT, `d141-preview-long-${w}.png`) });
      await ctx.close();
      return r;
    });
  }

  fs.writeFileSync(path.join(OUT, 'probe2.json'), JSON.stringify(out, null, 2));
  await browser.close();
  server.closeAllConnections();
  server.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
