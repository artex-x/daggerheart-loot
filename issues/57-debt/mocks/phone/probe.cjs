/* Planner probe for 57-debt plan-phone.md: measures the shipped test build (dist-test/ of
   the VW1 tree) and prototypes the stat columns and the shared-page bar fold in the DOM. */
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

  /* D141: the filter column at page top, and with the cap following its real top. */
  for (const [w, h] of [
    [1920, 950],
    [1180, 720],
    [1000, 720]
  ]) {
    await run(`D141 fcol ${w}x${h}`, async () => {
      const { ctx, page } = await open('#/tables/eq_weapon', { width: w, height: h });
      const r = await page.evaluate(() => {
        const c = document.querySelector('aside.fcol');
        if (!c) return null;
        const b = c.getBoundingClientRect();
        const last = c.lastElementChild?.lastElementChild ?? c.lastElementChild;
        const lb = last?.getBoundingClientRect();
        const before = {
          top: b.top,
          bottom: b.bottom,
          clientH: c.clientHeight,
          scrollH: c.scrollHeight,
          lastBottom: lb?.bottom,
          win: innerHeight
        };
        c.style.maxHeight = `${innerHeight - b.top - 16}px`;
        const b2 = c.getBoundingClientRect();
        const fitsWhole = c.scrollHeight <= c.clientHeight;
        c.scrollTop = c.scrollHeight;
        const lb2 = last?.getBoundingClientRect();
        return {
          before,
          protoB: {
            bottom: b2.bottom,
            clientH: c.clientHeight,
            scrollH: c.scrollHeight,
            fitsWhole,
            lastBottomAtEnd: lb2?.bottom
          }
        };
      });
      await ctx.close();
      return r;
    });
  }

  /* D141: the editor preview. */
  for (const [w, h] of [
    [1180, 720],
    [1920, 950]
  ]) {
    await run(`D141 preview ${w}x${h}`, async () => {
      const { ctx, page } = await open('#/homebrew/new', { width: w, height: h, as: 'gm1' });
      const r = await page.evaluate(() => {
        const p = document.querySelector('.preview');
        if (!p) return null;
        const b = p.getBoundingClientRect();
        return {
          top: b.top,
          bottom: b.bottom,
          clientH: p.clientHeight,
          scrollH: p.scrollHeight,
          win: innerHeight,
          pos: getComputedStyle(p).position,
          maxH: getComputedStyle(p).maxHeight
        };
      });
      await ctx.close();
      return r;
    });
  }

  /* D127: the stat sentence now, then a DOM prototype of right-aligned stat columns. */
  for (const table of ['eq_weapon', 'eq_armor']) {
    for (const lang of ['ru', 'en']) {
      for (const [w, h] of [
        [1440, 900],
        [1920, 950]
      ]) {
        await run(`D127 ${table} ${lang} ${w}`, async () => {
          const { ctx, page } = await open('#/tables/' + table, { width: w, height: h, lang });
          const r = await page.evaluate(() => {
            const rows = [...document.querySelectorAll('button.row-main')].slice(0, 60);
            const partsCount = {};
            const used = (el) => {
              if (!el) return 0;
              const range = document.createRange();
              range.selectNodeContents(el);
              return [...range.getClientRects()].reduce((s, x) => s + x.width, 0);
            };
            const cut = (el) => (el ? el.scrollHeight > el.clientHeight + 1 : false);
            const before = rows.map((row) => {
              const rt = row.querySelector('.rt');
              const st = row.querySelector('.rstats');
              const desc = [...rt.children].find(
                (c) => !c.classList.contains('rh') && !c.classList.contains('rstats')
              );
              const n = st ? st.textContent.split('\u00a0· ').length : 0;
              partsCount[n] = (partsCount[n] || 0) + 1;
              const lines = (el) =>
                el
                  ? [
                      ...(() => {
                        const g = document.createRange();
                        g.selectNodeContents(el);
                        return g.getClientRects();
                      })()
                    ]
                      .map((x) => Math.round(x.top))
                      .filter((v, i, a) => a.indexOf(v) === i).length
                  : 0;
              const textArea = used(st) + used(desc);
              const lineN = lines(st) + lines(desc) + 1;
              return {
                h: row.getBoundingClientRect().height,
                rtW: rt.getBoundingClientRect().width,
                empty:
                  1 - textArea / (rt.getBoundingClientRect().width * Math.max(lineN - 1, 1)),
                cut: cut(desc),
                stats: st?.textContent ?? ''
              };
            });
            /* The widest value per column index, measured in the row's own stat face. */
            const probe = document.createElement('span');
            const st0 = document.querySelector('.rstats');
            probe.className = st0 ? st0.className : '';
            Object.assign(probe.style, {
              position: 'absolute',
              visibility: 'hidden',
              whiteSpace: 'nowrap',
              font: st0 ? getComputedStyle(st0).font : ''
            });
            document.body.append(probe);
            const colMax = [];
            for (const b of before) {
              b.stats.split('\u00a0· ').forEach((p, i) => {
                probe.textContent = p;
                colMax[i] = Math.max(colMax[i] || 0, probe.getBoundingClientRect().width);
              });
            }
            probe.remove();
            /* The prototype: the stats leave the text column for k right-aligned cells. */
            for (const row of rows) {
              const rt = row.querySelector('.rt');
              const st = row.querySelector('.rstats');
              if (!st) continue;
              const parts = st.textContent.split('\u00a0· ');
              const box = document.createElement('span');
              Object.assign(box.style, {
                display: 'flex',
                gap: '16px',
                alignItems: 'baseline',
                flex: 'none',
                paddingTop: '2px'
              });
              parts.forEach((p, i) => {
                const c = document.createElement('span');
                c.textContent = p;
                Object.assign(c.style, {
                  width: Math.ceil(colMax[i]) + 'px',
                  textAlign: 'right',
                  font: getComputedStyle(st).font,
                  color: getComputedStyle(st).color,
                  whiteSpace: 'nowrap',
                  fontVariantNumeric: 'tabular-nums'
                });
                c.className = 'proto-cell';
                box.append(c);
              });
              st.remove();
              row.append(box);
            }
            const after = rows.map((row) => {
              const rt = row.querySelector('.rt');
              const desc = [...rt.children].find((c) => !c.classList.contains('rh'));
              const edges = [...row.querySelectorAll('.proto-cell')].map((c) =>
                Math.round(c.getBoundingClientRect().right)
              );
              return {
                h: row.getBoundingClientRect().height,
                rtW: rt.getBoundingClientRect().width,
                cut: desc ? desc.scrollHeight > desc.clientHeight + 1 : false,
                edges
              };
            });
            const med = (a) => {
              const s = [...a].sort((x, y) => x - y);
              return s[Math.floor(s.length / 2)];
            };
            const sum = (a) => a.reduce((s, x) => s + x, 0);
            const edgeSets = {};
            for (const a of after) {
              const k = a.edges.length;
              (edgeSets[k] ||= new Set()).add(a.edges.join(','));
            }
            return {
              rows: rows.length,
              partsCount,
              colMax: colMax.map(Math.ceil),
              statsWidth: Math.ceil(sum(colMax) + 16 * (colMax.length - 1)),
              before: {
                medRowH: med(before.map((b) => b.h)),
                sumRowH: Math.round(sum(before.map((b) => b.h))),
                rtW: Math.round(before[0]?.rtW),
                medEmpty: +med(before.map((b) => b.empty)).toFixed(2),
                cut: before.filter((b) => b.cut).length
              },
              proto: {
                medRowH: med(after.map((b) => b.h)),
                sumRowH: Math.round(sum(after.map((b) => b.h))),
                rtW: Math.round(after[0]?.rtW),
                cut: after.filter((b) => b.cut).length,
                distinctEdgeSetsByCount: Object.fromEntries(
                  Object.entries(edgeSets).map(([k, v]) => [k, v.size])
                )
              }
            };
          });
          await page.screenshot({ path: path.join(OUT, `d127-${table}-${lang}-${w}.png`) });
          await ctx.close();
          return r;
        });
      }
    }
  }

  /* D133 and D129: the shared page's bar and first entry at 360x640. */
  for (const lang of ['ru', 'en']) {
    await run(`D133 s ${lang}`, async () => {
      const { ctx, page } = await open('#/s/player-token-1', { width: 360, height: 640, lang });
      const first = await page.evaluate(() => {
        const r =
          document.querySelector('[data-primary]') ??
          document.querySelector('main .row, main li');
        return r ? Math.round(r.getBoundingClientRect().top * 10) / 10 : null;
      });
      await page.evaluate((l) => {
        const want = l === 'ru' ? 'Выбрать' : 'Select';
        const b = [...document.querySelectorAll('button')].find(
          (x) => x.textContent.trim() === want
        );
        b?.click();
      }, lang);
      await new Promise((r) => setTimeout(r, 400));
      const bar = await page.evaluate(() => {
        const s = document.querySelector('.selbar');
        if (!s) return null;
        const btns = [...s.querySelectorAll('button, a')]
          .filter((b) => b.getBoundingClientRect().width > 0)
          .map((b) => ({
            t: b.textContent.trim().replace(/\s+/g, ' '),
            top: Math.round(b.getBoundingClientRect().top),
            w: Math.round(b.getBoundingClientRect().width)
          }));
        return { h: s.getBoundingClientRect().height, btns };
      });
      await page.screenshot({ path: path.join(OUT, `d133-s-${lang}-now.png`) });
      /* Prototype: «Скопировать текст» and «Сообщить владельцу» fold into a 40 px «Ещё». */
      const proto = await page.evaluate((l) => {
        const s = document.querySelector('.selbar');
        if (!s) return null;
        const words =
          l === 'ru'
            ? ['Скопировать текст', 'Сообщить владельцу']
            : ['Copy text', 'Notify the owner', 'Tell the owner'];
        const hide = [...s.querySelectorAll('button')].filter((b) =>
          words.some((w) => b.textContent.includes(w))
        );
        let anchor = null;
        for (const b of hide) {
          anchor = b;
          b.style.display = 'none';
        }
        if (anchor) {
          const more = anchor.cloneNode(false);
          more.style.display = '';
          more.textContent = l === 'ru' ? '··· Ещё' : '··· More';
          anchor.after(more);
        }
        return { hidden: hide.length, h: s.getBoundingClientRect().height };
      }, lang);
      await page.screenshot({ path: path.join(OUT, `d133-s-${lang}-proto.png`) });
      await ctx.close();
      return { firstEntryTop: first, bar, proto };
    });
  }

  /* D132: the record dialog's «Ещё» and «В список» on a short wide window. */
  for (const [w, h] of [
    [1000, 720],
    [1180, 720]
  ]) {
    await run(`D132 ci1 ${w}x${h}`, async () => {
      const { ctx, page } = await open('#/tables/core_item/ci1', { width: w, height: h });
      const read = () =>
        page.evaluate(() => {
          const card = document.querySelector('dialog[open] .modal-card');
          const scroller = card
            ? [card, ...card.querySelectorAll('*')].find(
                (e) =>
                  e.scrollHeight > e.clientHeight + 1 &&
                  /auto|scroll/.test(getComputedStyle(e).overflowY)
              )
            : null;
          const m = document.querySelector(
            'dialog[open] [role="menu"], dialog[open] .dropmenu'
          );
          const cb = card?.getBoundingClientRect();
          const mb = m?.getBoundingClientRect();
          const field = m?.querySelector('input');
          return {
            scrollTop: scroller?.scrollTop ?? null,
            scroller: scroller?.className ?? null,
            card: cb && { top: Math.round(cb.top), bottom: Math.round(cb.bottom) },
            menu: mb && {
              top: Math.round(mb.top),
              bottom: Math.round(mb.bottom),
              up: m.classList.contains('up')
            },
            field: field && Math.round(field.getBoundingClientRect().top)
          };
        });
      const at0 = await read();
      const clickIn = (word) =>
        page.evaluate((wd) => {
          const b = [...document.querySelectorAll('dialog[open] button')].find((x) =>
            x.textContent.includes(wd)
          );
          b?.click();
          return !!b;
        }, word);
      const okMore = await clickIn('Ещё');
      await new Promise((r) => setTimeout(r, 400));
      const more = await read();
      await page.screenshot({ path: path.join(OUT, `d132-more-${w}.png`) });
      await page.keyboard.press('Escape');
      await new Promise((r) => setTimeout(r, 300));
      const okList = await clickIn('В список');
      await new Promise((r) => setTimeout(r, 500));
      const list = await read();
      await page.screenshot({ path: path.join(OUT, `d132-list-${w}.png`) });
      await ctx.close();
      return { at0, okMore, more, okList, list };
    });
  }

  /* D125: the Russian header tabs at 320 px. */
  await run('D125 tabs 320 ru', async () => {
    const { ctx, page } = await open('#/search', { width: 320, height: 568 });
    const r = await page.evaluate(() => {
      const n = document.querySelector('nav.tabs');
      return {
        tabsRight: n && n.getBoundingClientRect().right,
        bodyW: document.body.clientWidth,
        scrollW: document.documentElement.scrollWidth
      };
    });
    await ctx.close();
    return r;
  });

  fs.writeFileSync(path.join(OUT, 'probe.json'), JSON.stringify(out, null, 2));
  await browser.close();
  server.closeAllConnections();
  server.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
