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
 *   legacy -> index.html at the repository root, the pre-cutover fallback -
 *             not what Pages serves since B13's flip
 *   next   -> dist/index.html, the built rewrite, what Pages serves now
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

  /* And until the artwork has arrived. A card is mostly its picture, so a
     screenshot that races it reports a blank square as a five percent
     difference and sends the next session hunting for a layout bug that is not
     there. `loading="lazy"` keeps these out of networkidle0, so waiting on the
     images themselves is the only honest signal. */
  await page.evaluate(
    () =>
      new Promise((done) => {
        const pending = [...document.images].filter((i) => !i.complete);
        if (!pending.length) return done(undefined);
        let left = pending.length;
        const tick = () => {
          if (--left === 0) done(undefined);
        };
        for (const img of pending) {
          img.addEventListener('load', tick, { once: true });
          img.addEventListener('error', tick, { once: true });
        }
        /* A picture that never arrives is a difference the screenshot should
           show, not a run that hangs. */
        setTimeout(() => {
          done(undefined);
        }, 5000);
      })
  );

  /* And until the document has finished loading, which is what an empty
     `document.fonts` set makes `fonts.ready` mean.
     Not decoration: `TablesPage.svelte`'s row/section anchor defers its
     `scrollIntoView` behind that same promise, because its first layout is
     8px short of its final one. Without this wait the run could start the
     width sweep while that scroll was still outstanding, and whether it
     landed before or after a resize decided whether the browser's own scroll
     anchoring got to adjust it - one machine reporting 7.92% and 8.47% for
     `#/tables/core_item ~ row anchor @ en 375` on alternate runs. A state
     that has not stopped moving is not a state, so this belongs to arrival
     rather than to the app. */
  await page.evaluate(async () => {
    await document.fonts?.ready;
  });

  /* One frame for the effects that run after the first paint. */
  await new Promise((r) => setTimeout(r, 120));
}

/**
 * Waits for whatever a press started to finish moving.
 *
 * A fixed pause is the wrong instrument here: the modal opens with a 0.22s
 * `pop` animation in both apps (style.css:591, RecordModal.svelte:159 - B9
 * deleted the rewrite's blanket reduced-motion kill, so this now runs under
 * reduced motion too, on both sides), and a screenshot taken on a timer
 * catches either app mid-flight, with the number moving with how busy the
 * machine is. Asking the browser which animations are running answers
 * exactly the question. The cap is for anything that loops forever.
 */
async function settle(page) {
  await page.evaluate(async () => {
    const running = document.getAnimations().map((a) => a.finished.catch(() => undefined));
    await Promise.race([
      Promise.all(running),
      new Promise((done) => setTimeout(done, 600))
    ]);
  });
  /* One frame for the paint that follows the last effect. */
  await new Promise((r) => setTimeout(r, 80));
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

  /**
   * `confirm()` blocks the calling script until something answers it, and
   * `el.click()` inside `page.evaluate` never returns while one is open - so
   * without this, no state could ever press a destructive control. Every
   * dialog raised on this page is accepted, and its message kept so a spec
   * can compare it as data (`deletedList`, `tests/parity/specs.js`).
   */
  let dialog = null;
  page.on('dialog', (dlg) => {
    dialog = dlg.message();
    dlg.accept().catch(() => {});
  });

  const d = {
    target,

    /**
     * Every control this run has pressed, and every one it has seen.
     *
     * The difference is the honest measure of how much of the app the states
     * actually exercise: a control nobody presses is compared as a name in a
     * list and in no other way, so whatever it does is unported until proven
     * otherwise. Reported at the end of every run rather than guessed at.
     */
    pressed: new Set(),
    seen: new Map(),

    /**
     * A route, from a document that has just been made.
     *
     * The trip through about:blank is load-bearing. Two states on the same
     * route differ only by the hash, and a hash-only navigation does not
     * reload: the page keeps its variables, and `prepare` - which is what
     * clears storage and stubs the clipboard - never runs again. The help panel
     * one state opened was still open in the next one, and it took an hour to
     * see that the harness was reporting its own leak.
     */
    async open(route) {
      await page.goto('about:blank');
      await page.goto(url + route, { waitUntil: 'networkidle0' });
      await ready(page);
    },

    /** The window a state is looked at through; the breakpoints depend on it. */
    viewport(width, height) {
      return page.setViewport({ width, height });
    },

    /** Records what is on this route, for the coverage report at the end. */
    note(route, names) {
      const at = d.seen.get(route) ?? new Set();
      for (const n of names) at.add(n);
      d.seen.set(route, at);
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

    /**
     * Types into a field found by its placeholder, or by its accessible name
     * where it has none - a table's query lives in memory and never reaches
     * the address, so a placeholder is the only thing a spec has to grip
     * there, but the list page's title input and position field are named
     * instead (`aria-label`), the way a person reads them.
     *
     * `event` is `'change'` for the position field, whose live handler
     * (app.js 4545-4549) waits for the field to be committed rather than
     * acting on every keystroke; every other field keeps the default
     * `'input'`.
     */
    async type(placeholder, text, event = 'input') {
      const ok = await page.evaluate(
        (ph, val, ev, nameSrc) => {
          const nameOf = eval(nameSrc);
          const inputs = [...document.querySelectorAll('input, textarea')];
          const el =
            inputs.find((i) => i.placeholder === ph) ?? inputs.find((i) => nameOf(i) === ph);
          if (!el) return false;
          el.focus();
          el.value = val;
          el.dispatchEvent(new Event(ev, { bubbles: true }));
          return true;
        },
        placeholder,
        text,
        event,
        NAME_FN
      );
      if (!ok) throw new Error(`${target}: no field with placeholder "${placeholder}"`);
      d.pressed.add(`type:${placeholder}`);
      await settle(page);
      return true;
    },

    /**
     * Clicks the control a person would click, by what it says.
     *
     * Includes `input` so a checkbox with an `aria-label` - the row selection
     * box, which carries no text of its own - answers to the same verb as a
     * button. `has()` already searched inputs; `click()` had not.
     *
     * `nth` picks among several controls that share one accessible name - every
     * row checkbox on a table is named "Выбрано", and select-all has no
     * accessible name of its own for a spec to grip at all, so a second row is
     * reached by index rather than by naming select-all. The loose `includes`
     * fallback only applies at `nth` 0, matching the exact-match behaviour this
     * always had before a second match could exist.
     */
    async click(name, nth = 0) {
      const ok = await page.evaluate(
        (n, idx, nameSrc) => {
          const nameOf = eval(nameSrc);
          const els = [
            ...document.querySelectorAll(
              'button, a[href], [role="button"], input, summary'
            )
          ];
          const exact = els.filter((e) => nameOf(e) === n);
          const el = exact[idx] ?? (idx === 0 ? els.find((e) => nameOf(e).includes(n)) : undefined);
          if (!el) return false;
          el.click();
          return true;
        },
        name,
        nth,
        NAME_FN
      );
      if (!ok) throw new Error(`${target}: no control named "${name}"${nth ? ` (nth ${nth})` : ''}`);
      d.pressed.add(name);
      await settle(page);
      return true;
    },

    /**
     * Presses the control a person would click, by what it says - the same
     * lookup as `click`, a different dispatch.
     *
     * `click()` runs `el.click()` inside `page.evaluate`, a synthetic event on
     * an empty call stack: nothing checkpoints between it and whatever else is
     * listening. A real click is a Chrome `Input.dispatchMouseEvent`, and
     * Chrome runs a microtask checkpoint between listeners on the same event -
     * which is exactly when Svelte 5 flushes state
     * (`node_modules/svelte/src/internal/client/dom/task.js`, `queueMicrotask`).
     * Between the app root's delegated handler and a `<svelte:document
     * onclick>` listener, a block the first handler opened or closed can
     * already have replaced its target by the time the second one runs - the
     * class `el.click()` and jsdom's `userEvent` cannot reach by construction
     * (`plan.md`, "Phase 5 planned", decided 6; the defect it caught was B11's
     * `isConnected` guard). `tests/app/` is what needs this; no parity state
     * does, so `click`'s synthetic dispatch - and every debt figure measured
     * against it - is untouched.
     *
     * Resolving to a puppeteer `ElementHandle` and calling its own `.click()`
     * is what makes the click trusted: puppeteer scrolls the element into view
     * first (where `click()` does not) and throws its own error when the
     * element cannot actually be clicked (zero box, covered, detached) rather
     * than succeeding on a target nothing could reach. Recorded into the same
     * `d.pressed` set as `click`, so the coverage report does not split one
     * control into two entries.
     */
    async press(name, nth = 0) {
      const handle = await page.evaluateHandle(
        (n, idx, nameSrc) => {
          const nameOf = eval(nameSrc);
          const els = [
            ...document.querySelectorAll(
              'button, a[href], [role="button"], input, summary'
            )
          ];
          const exact = els.filter((e) => nameOf(e) === n);
          return exact[idx] ?? (idx === 0 ? els.find((e) => nameOf(e).includes(n)) : undefined);
        },
        name,
        nth,
        NAME_FN
      );
      const el = handle.asElement();
      if (!el) {
        await handle.dispose();
        throw new Error(`${target}: no control named "${name}"${nth ? ` (nth ${nth})` : ''}`);
      }
      try {
        await el.click();
      } catch (e) {
        await handle.dispose();
        throw new Error(
          `${target}: "${name}"${nth ? ` (nth ${nth})` : ''} is not clickable - ${e.message}`
        );
      }
      await handle.dispose();
      d.pressed.add(name);
      await settle(page);
      return true;
    },

    /** Waits for whatever is in flight - a resize, or a press. */
    settle() {
      return settle(page);
    },

    /**
     * Waits for a packed shared-list address to finish expanding.
     *
     * `ready()` alone is not enough here: on the live app nothing renders
     * before `expandHash()` replaces the hash (app.js 4636, `if
     * (!expandHash()) render()`), so its own wait for `#view`/`#app` to have
     * children already implies the expansion landed. The rewrite's `Shell`
     * mounts at once and the replace lands a few milliseconds later, so
     * without this the packed cell would race the expansion on one side only.
     */
    async expanded() {
      await page.waitForFunction(() => !location.hash.startsWith('#/l/~'));
      await settle(page);
    },

    /**
     * Reordering a row by dragging it, the way a pointer does: both apps
     * render `.lrow` in list order, so this grips row `from`'s own handle and
     * drops it above or below row `to`'s midpoint - a name-based lookup would
     * have to read a row's own text, which is the description, not the grip.
     * Chrome constructs `DataTransfer` and `DragEvent`, and puppeteer's Chrome
     * is the only browser this runs in.
     */
    async drag(from, to, after) {
      await page.evaluate(
        (f, t, aft) => {
          const rows = document.querySelectorAll('.lrow');
          const grip = rows[f].querySelector('[data-drag]');
          const target = rows[t];
          const dt = new DataTransfer();
          grip.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
          const rect = target.getBoundingClientRect();
          const clientX = rect.left + 10;
          const clientY = rect.top + rect.height * (aft ? 0.75 : 0.25);
          target.dispatchEvent(
            new DragEvent('dragover', {
              bubbles: true,
              cancelable: true,
              dataTransfer: dt,
              clientX,
              clientY
            })
          );
          target.dispatchEvent(
            new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt, clientX, clientY })
          );
          grip.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt }));
        },
        from,
        to,
        after
      );
      d.pressed.add(`drag:${from}->${to}`);
      await settle(page);
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

    /** How many elements match a selector - a row count, which `inventory`
     *  cannot see: it reads names off `button, a[href], input, select,
     *  textarea` and dedupes them, so the search cap has nothing else to
     *  pin it with. */
    count(selector) {
      return page.$$eval(selector, (els) => els.length);
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

    /** The message the last `confirm()` on this page carried, or null if none
     *  has fired yet. */
    dialog() {
      return dialog;
    },

    /**
     * Writes storage entries before the page's first paint.
     *
     * Lists live in `localStorage`, and every state opens a fresh page whose
     * `prepare()` clears it - so a state that needs a list to already exist
     * cannot be *entered*, it has to be *seeded*. Registered with
     * `evaluateOnNewDocument`, the same way `prepare()` clears storage, and
     * called after it (from `arrive()`, before `open()`) so this write
     * survives the clear rather than racing it. `tests/select.js` and
     * `tests/lists2.js` already do exactly this on the live app.
     */
    async seed(entries) {
      await page.evaluateOnNewDocument((kv) => {
        try {
          for (const k of Object.keys(kv)) localStorage.setItem(k, kv[k]);
        } catch (e) {
          void e;
        }
      }, entries);
    },

    /** Reads one storage key back, so a write path is compared as data and
     *  not only as the tick on a chip. */
    storage(key) {
      return page.evaluate((k) => localStorage.getItem(k), key);
    },

    /** What the tab says. Off screen, so no screenshot can catch it drifting. */
    title() {
      return page.title();
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

    /**
     * Computed type, and the measured run of text, for named controls.
     *
     * The one place in this driver that takes a CSS selector. Everywhere else
     * grips a control by the name a person reads, because a spec must not know
     * which app it is driving; this method measures one specific *ported*
     * control, and the class names are themselves ported - every component in
     * `app/src/components/` writes its CSS "off `.x` in style.css", and
     * Svelte's scoping keeps the original class in the `class` attribute
     * alongside its hash. Selectors stay structural or contract-level wherever
     * one exists (`input[type=search]`, `[data-row]`) and use a ported class
     * only where none does.
     *
     * `probes` is a plain `{ name: selector }` map. A probe that resolves to
     * nothing returns `null` rather than throwing: the live app certainly has
     * these controls, so a class the rewrite renamed reports `null` against
     * real numbers and fails loudly. The one silent case is a control missing
     * from *both* apps, which means style.css changed - and style.css is
     * frozen.
     *
     * This exists because a whole-page pixel percentage cannot see a
     * control-sized defect: a wrong font-size on one line of a 1100x900 screen
     * scores about 0.09%, under JITTER. Two apps drawing the same string in the
     * same face at the same size in the same browser produce the same advance,
     * so rounding is one decimal and no more - a difference smaller than that
     * with no visible cause belongs in ACCEPTED with the measured reason, not
     * in a wider tolerance.
     */
    async typeAt(probes) {
      /* Fonts are the one thing neither ready() nor settle() waits on for a
         page that has already painted - see the comment on ready(). A probe
         read before a font swap has finished could move between runs on the
         same machine; this makes that the same non-issue it already is for the
         anchor scroll. */
      await page.evaluate(async () => {
        await document.fonts?.ready;
      });
      return page.evaluate((map) => {
        const out = {};
        for (const [name, sel] of Object.entries(map)) {
          const el = document.querySelector(sel);
          if (!el) {
            out[name] = null;
            continue;
          }
          const c = getComputedStyle(el);
          const range = document.createRange();
          range.selectNodeContents(el);
          const round1 = (n) => Math.round(n * 10) / 10;
          out[name] = {
            font: `${c.fontWeight} ${c.fontSize}/${c.lineHeight}`,
            family: c.fontFamily.split(',')[0].replace(/["']/g, ''),
            /* Whitespace runs collapsed, not trimmed at the ends - a missing
               separator (the `любое` hint sitting flush against the label) has
               to stay visible rather than being trimmed away. */
            text: (el.textContent || '').replace(/\s+/g, ' '),
            advance: round1(range.getBoundingClientRect().width),
            width: round1(el.getBoundingClientRect().width)
          };
        }
        return out;
      }, probes);
    },

    /**
     * A screenshot, for the look comparison.
     *
     * The fold by default. `whole` takes the page end to end, which is the only
     * way to compare a record card - it is taller than the window, so the
     * description, the craft chain and the footer are all below the default
     * shot and were never being looked at.
     *
     * A full-page capture rasterises the whole document in one go, most of it
     * never painted before this call - B5.1 measured the geometry
     * byte-identical across readings while the pixels swung 0.00-7.31% on an
     * unchanged build, worse under load: a capture handed back before the
     * raster finished, not anything the app drew. Same invariant `settle()`
     * already applies to animations, applied to the capture itself: retake
     * until two in a row agree, so what is compared is a page that has
     * actually stopped moving. Capped at four - under real load the second
     * capture can be the unfinished one too.
     */
    async shot(whole) {
      if (!whole) return page.screenshot({ type: 'png', fullPage: false });
      let prev = await page.screenshot({ type: 'png', fullPage: true });
      let count = 1;
      let next;
      do {
        next = await page.screenshot({ type: 'png', fullPage: true });
        count++;
        if (next.equals(prev)) break;
        prev = next;
      } while (count < 4);
      if (count > 2) {
        console.log(`       снимок целиком: ${String(count)} попытки до устойчивого кадра`);
      }
      return next;
    },

    /**
     * A control's rect, for the one state whose shot is `whole` - so a full-
     * page capture that misbehaves can be told apart from a real layout
     * change by reading a number rather than probing by hand. `probes` is a
     * plain `{ name: selector }` map, the same policy `typeAt` documents:
     * selectors stay structural or contract-level wherever one exists and use
     * a ported class only where none does. A probe that resolves to nothing
     * returns `null` rather than throwing - a class the rewrite renamed
     * reports `null` against a real rect and fails loudly.
     */
    async rectsAt(probes) {
      await page.evaluate(async () => {
        await document.fonts?.ready;
      });
      return page.evaluate((map) => {
        const round1 = (n) => Math.round(n * 10) / 10;
        const out = {};
        for (const [name, sel] of Object.entries(map)) {
          const el = document.querySelector(sel);
          if (!el) {
            out[name] = null;
            continue;
          }
          const r = el.getBoundingClientRect();
          out[name] = { x: round1(r.x), y: round1(r.y), w: round1(r.width), h: round1(r.height) };
        }
        out.docHeight = round1(document.documentElement.scrollHeight);
        return out;
      }, probes);
    },

    /** Switches the emulated media type - `'print'` to see the sheet as a
     *  printer would, `undefined` to switch back before the next shot. Runs
     *  before the shots on the same page: leaving print media on would
     *  photograph the wrong medium. */
    media(type) {
      return page.emulateMediaType(type);
    },

    /**
     * The first match's computed style, for the named properties - `null`
     * when nothing matches, the same policy `typeAt`/`rectsAt` document: a
     * class the rewrite renamed reports `null` against a real value and
     * fails loudly rather than silently comparing nothing to nothing.
     */
    computed(selector, props) {
      return page.evaluate(
        (sel, keys) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const c = getComputedStyle(el);
          const out = {};
          for (const k of keys) out[k] = c.getPropertyValue(k);
          return out;
        },
        selector,
        props
      );
    },

    /**
     * Every match's rect and its own inline style properties - what the
     * print fit sets and nothing else records: `fitPrintCards` writes its
     * decision straight onto `style`, never into a class, so the inline
     * value is the only place a divergent fit shows up.
     */
    eachAt(selector, props) {
      return page.$$eval(
        selector,
        (els, keys) => {
          const round1 = (n) => Math.round(n * 10) / 10;
          return els.map((el) => {
            const r = el.getBoundingClientRect();
            const style = {};
            for (const k of keys) style[k] = el.style.getPropertyValue(k);
            return { x: round1(r.x), y: round1(r.y), w: round1(r.width), h: round1(r.height), style };
          });
        },
        props
      );
    }
  };
  return d;
}

/* Both apps get the same stubbed clipboard and the same starting storage, so a
   difference in what comes back is a difference in the app rather than in the
   conditions it was run under. */
async function prepare(page) {
  /* Both apps fade a card in over 0.28s, and both stop doing it when the
     visitor has asked for less motion. Asking for it here takes timing out of
     the pixel comparison entirely: without it the screenshot lands mid-fade and
     the number moves by half a percent depending on how busy the machine is. */
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);

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
