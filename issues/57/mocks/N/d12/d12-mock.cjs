/* Mock of owner item 12 on the live site (read-only; DOM and CSS injected): the round «Н» / «С»
   badges before «Кость Надежды» / «Кость Страха» become the d12 of the page's own roll button. */
const puppeteer = require('E:/dev/daggerheart-loot/.claude/worktrees/57/node_modules/puppeteer');
const fs = require('fs');
const BASE = 'https://daggerheart-loot.pages.dev/#/roll/alt';
const OUT = process.argv[2];
const SIZES = [
  [360, 640],
  [1180, 720]
];
const VARIANTS = ['today', 'prop', 'fill'];

async function apply(page, variant) {
  return page.evaluate((variant) => {
    const die = document.querySelector('main .btn.primary .dieicon');
    const badges = [...document.querySelectorAll('.dielbl .dv')];
    if (variant === 'today' || !die) return { badges: badges.length, die: !!die };
    for (const b of badges) {
      const svg = die.cloneNode(true);
      svg.style.cssText = 'height:18px;width:auto;display:block;stroke-width:1.3';
      if (variant === 'fill') {
        for (const p of svg.querySelectorAll('path'))
          p.style.fill = 'color-mix(in srgb, currentcolor 22%, transparent)';
        svg.querySelector('path:last-child').style.fill = 'none';
      }
      b.replaceChildren(svg);
      b.style.cssText = 'border:0;border-radius:0;width:auto;height:auto';
    }
    return { badges: badges.length, die: true };
  }, variant);
}

async function measure(page) {
  return page.evaluate(() => {
    const r = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return {
        top: Math.round(b.top + scrollY),
        h: Math.round(b.height),
        w: Math.round(b.width)
      };
    };
    const lbls = [...document.querySelectorAll('.dielbl')];
    return {
      labels: lbls.map((l) => ({
        text: l.textContent.trim(),
        box: r(l),
        icon: r(l.querySelector('.dv'))
      })),
      field: r(
        lbls[0]?.closest('.field, fieldset, [role=group]') ??
          lbls[0]?.parentElement?.parentElement
      ),
      primary: r(
        [...document.querySelectorAll('[data-primary]')].find(
          (e) => e.getBoundingClientRect().height > 0
        )
      ),
      a11yName: [...document.querySelectorAll('.dieblock input')].map((i) =>
        i.getAttribute('aria-label')
      )
    };
  });
}

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const log = [];
  try {
    for (const lang of ['ru', 'en']) {
      for (const [w, h] of SIZES) {
        for (const v of VARIANTS) {
          const page = await browser.newPage();
          await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
          await page.evaluateOnNewDocument(
            (l) => localStorage.setItem('dhloot.lang.v1', l),
            lang
          );
          await page.goto(BASE, { waitUntil: 'networkidle0' });
          await page.waitForSelector('[data-primary]', { timeout: 15000 });
          if (w < 761) {
            const opened = await page.evaluate(() => {
              const b = [...document.querySelectorAll('.reshead button')].find(
                (x) =>
                  x.getAttribute('aria-expanded') === 'false' &&
                  /Настроить|Set up/.test(x.textContent)
              );
              if (!b) return false;
              b.click();
              return true;
            });
            if (!opened) console.log('no set-up button', lang, w);
            await page.waitForSelector('.dielbl', { timeout: 5000 });
          }
          await page.evaluate(async () => {
            await document.fonts.ready;
          });
          const info = await apply(page, v);
          const m = await measure(page);
          const field = await page.$('.dielbl');
          const group = await field.evaluateHandle(
            (l) => l.closest('.field') ?? l.parentElement.parentElement.parentElement
          );
          await group.evaluate((g) => g.scrollIntoView({ block: 'center' }));
          await new Promise((r) => setTimeout(r, 150));
          const name = `d12-label__${w}__${lang}__${v}`;
          const gb = await group.boundingBox();
          await page.screenshot({
            path: OUT + name + '__zoom.png',
            clip: {
              x: Math.max(0, gb.x - 12),
              y: Math.max(0, gb.y - 12),
              width: Math.min(w, gb.width + 24),
              height: gb.height + 24
            }
          });
          await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
          await new Promise((r) => setTimeout(r, 300));
          await apply(page, v);
          if (w >= 761) await page.evaluate(() => scrollTo(0, 0));
          else
            await page.evaluate(() =>
              document
                .querySelector('.dielbl')
                .closest('.field, .panel, div')
                .scrollIntoView({ block: 'center' })
            );
          await new Promise((r) => setTimeout(r, 150));
          await page.screenshot({ path: OUT + name + '.png' });
          log.push({ lang, w, h, variant: v, ...info, ...m });
          console.log(name, JSON.stringify(m.labels));
          await page.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(OUT + 'd12-label.json', JSON.stringify(log, null, 1) + '\n');
})();
