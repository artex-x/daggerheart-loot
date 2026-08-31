/* One page, pointed at either app.
 *
 * The whole harness rests on this: a spec never knows which app it is driving.
 * It opens a route, finds controls by the name a person would read, and returns
 * what it saw. tests/parity.js then runs the same spec against both and
 * compares. Nothing is hardcoded as "expected" - the live app is the
 * expectation, which is the only definition of "ported correctly" that does not
 * depend on somebody remembering.
 *
 * The two targets are separate files, so they never clash:
 *   legacy -> index.html at the repository root, what Pages serves today
 *   next   -> dist/index.html, the built rewrite
 */
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

const TARGETS = {
  legacy: 'file://' + path.join(ROOT, 'index.html'),
  next: 'file://' + path.join(ROOT, 'dist', 'index.html')
};

/** Waits until the app has drawn something, whichever app it is. */
async function ready(page) {
  await page.waitForFunction(() => {
    const root = document.querySelector('#view') || document.querySelector('#app');
    return !!root && root.children.length > 0;
  });
  /* One frame for the effects that run after the first paint. */
  await new Promise((r) => setTimeout(r, 120));
}

/**
 * The accessible name of an element, the way a screen reader would say it.
 *
 * Deliberately not a CSS selector: the two apps share no class names and never
 * will, so anything a spec grips has to be something a person can see.
 */
const NAME_FN = `(el) => (
  el.getAttribute('aria-label') ||
  el.getAttribute('title') ||
  el.textContent ||
  ''
).replace(/\\s+/g, ' ').trim()`;

function makeDriver(page, target) {
  const url = TARGETS[target];

  const d = {
    target,

    async open(route) {
      await page.goto(url + route, { waitUntil: 'networkidle0' });
      await ready(page);
    },

    /** Every control on screen, by name - the inventory a spec compares. */
    controls() {
      return page.evaluate((nameSrc) => {
        const name = eval(nameSrc);
        const out = [];
        for (const el of document.querySelectorAll('button, a[href], input, select, textarea')) {
          if (!el.offsetParent && el.tagName !== 'BODY') continue;
          const n = name(el);
          if (n) out.push(n);
        }
        return [...new Set(out)].sort();
      }, NAME_FN);
    },

    /** Clicks the control a person would click, by what it says. */
    async click(name) {
      const ok = await page.evaluate(
        (n, nameSrc) => {
          const nameOf = eval(nameSrc);
          const els = [...document.querySelectorAll('button, a[href], [role="button"]')];
          const el = els.find((e) => nameOf(e) === n) || els.find((e) => nameOf(e).includes(n));
          if (!el) return false;
          el.click();
          return true;
        },
        name,
        NAME_FN
      );
      if (!ok) throw new Error(`${target}: no control named "${name}"`);
      await new Promise((r) => setTimeout(r, 150));
      return true;
    },

    /** Whether a control is on screen at all. */
    has(name) {
      return page.evaluate(
        (n, nameSrc) => {
          const nameOf = eval(nameSrc);
          return [...document.querySelectorAll('button, a[href], input, select, textarea')].some(
            (e) => (e.offsetParent || e.tagName === 'BODY') && nameOf(e) === n
          );
        },
        name,
        NAME_FN
      );
    },

    /** The visible text of the main region, collapsed. */
    text() {
      return page.evaluate(() => {
        const main = document.querySelector('main') || document.body;
        return (main.innerText || '').replace(/\s+/g, ' ').trim();
      });
    },

    /** What the clipboard was handed, both flavours. */
    clipboard() {
      return page.evaluate(async () => {
        const m = window.__clip;
        if (!m) return null;
        const read = async (k) => (m[k] ? await m[k].text() : null);
        return { html: await read('text/html'), text: await read('text/plain') };
      });
    },

    /** Whether an image reached the clipboard, and of what type. */
    clipboardImage() {
      return page.evaluate(async () => {
        const m = window.__clip;
        if (!m) return null;
        const key = Object.keys(m).find((k) => k.startsWith('image/'));
        if (!key) return null;
        const blob = await (m[key].arrayBuffer ? m[key] : null);
        return { type: key, empty: blob ? blob.byteLength === 0 : null };
      });
    },

    resetClipboard() {
      return page.evaluate(() => {
        window.__clip = null;
      });
    },

    hash() {
      return page.evaluate(() => location.hash);
    },

    /**
     * The look, as numbers rather than as pixels.
     *
     * A pixel diff says "40% differs" and sends nobody anywhere. These say
     * "the heading is 24px and was 23px", which is a thing to go and fix - and
     * they are what drives most of the pixels anyway. Landmarks are found by
     * role, because that is the only thing the two apps have in common.
     */
    metrics() {
      return page.evaluate(() => {
        /* Typography and colour only. Position and size are deliberately not
           here: two layouts mid-port disagree about them by definition, and a
           metric that always differs teaches everyone to ignore the report.
           Geometry is what the pixel budget measures, and that number comes
           down slice by slice. */
        const type = (el) => {
          if (!el) return null;
          const c = getComputedStyle(el);
          return {
            font: `${c.fontWeight} ${c.fontSize}/${c.lineHeight}`,
            spacing: c.letterSpacing,
            color: c.color
          };
        };
        const body = getComputedStyle(document.body);
        return {
          page: {
            background: body.backgroundColor,
            color: body.color,
            family: body.fontFamily.split(',')[0].replace(/["']/g, '')
          },
          /* The page heading is the one element both apps certainly have and
             certainly means the same thing. "The first paragraph" does not:
             in one app it is a muted caption and in the other the description,
             and comparing them reports a difference that is not one. */
          heading: type(document.querySelector('h1, .page-h'))
        };
      });
    },

    /** A screenshot of the page, for the look comparison. */
    shot() {
      return page.screenshot({ type: 'png', fullPage: false });
    }
  };
  return d;
}

/* Both apps get the same stubbed clipboard and the same starting storage, so a
   difference in what comes back is a difference in the app rather than in the
   conditions it was run under. */
async function prepare(page) {
  await page.evaluateOnNewDocument(() => {
    window.isSecureContext = true;
    window.__clip = null;
    window.ClipboardItem = class {
      constructor(m) {
        this.map = m;
      }
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        write: (i) => {
          window.__clip = i[0].map;
          return Promise.resolve();
        },
        /* Some paths hand over a promise of a blob rather than a blob. */
        writeImage: (b) => {
          window.__clip = { 'image/png': b };
          return Promise.resolve();
        },
        writeText: (t) => {
          window.__clip = { 'text/plain': { text: () => Promise.resolve(t) } };
          return Promise.resolve();
        }
      }
    });
    try {
      localStorage.clear();
    } catch (e) {
      void e;
    }
  });
}

module.exports = { TARGETS, makeDriver, prepare, ready };
