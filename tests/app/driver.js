/* One page, driving the built app.
 *
 * The whole harness rests on this: a spec opens a route, finds controls by
 * the name a person would read, and returns what it saw - never a CSS
 * selector, so a spec reads the same whether the markup underneath it is
 * hand-written HTML or a Svelte component's output.
 *
 * This driver used to drive either of two targets - the live app at
 * the repository root, or the built rewrite in `dist/` (now the test build,
 * `dist-test/`) - and a
 * side-by-side comparison harness ran every spec against the pair, with the
 * live app read as the expectation. That harness and the live app it
 * compared against were both since deleted. `tests/app/*.js` drives the
 * test build through `next`; `tests/e2e/` is the second reader, driving the
 * configured `dist/` from its own server.
 */
/* Over HTTP from lib.js's per-process server; read when a driver is made,
   after `fresh()` or `sharedPage()` has started that server. Required
   lazily: lib.js requires this file first. */
const TARGETS = {
  get next() {
    return require('./lib.js').baseUrl() + 'index.html';
  }
};

/* ListPage.svelte's scheduleUrlSync debounces the address write this long.
   tests/app/golden.test.mjs asserts the two still agree. */
const URL_DEBOUNCE_MS = 150;

/** Waits until the app has drawn something. */
async function ready(page) {
  await page.waitForFunction(() => {
    const root = document.querySelector('#app');
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
 * A fixed pause is the wrong instrument here in principle, but
 * `tokens.css`'s blanket reduced-motion kill made it nearly what this
 * has become in practice: under `prepare()`'s emulated
 * `prefers-reduced-motion: reduce` plus that blanket rule,
 * `document.getAnimations()` reports only 0.01ms animations, so the animation
 * wait below resolves immediately and `settle()` returns after its own 80ms frame
 * alone (measured: dispatch returns ~19ms, `settle()` ~127ms, `location.hash`
 * changes ~174ms; the one running animation is `toastIn` at `duration: 0.01`;
 * before the fix `settle()` returned ~300ms). It is
 * kept anyway because it is still the correct instrument for an animation
 * the CSS rule cannot reach, and for whenever the emulation is scoped down.
 * What it does NOT do any more is stand in for anything a press defers past
 * 80ms - a debounce, a timer. Those need their own assertion, the way
 * `addressSettled()` below is one for `ListPage`'s URL sync.
 */
async function settle(page) {
  await page.evaluate(async () => {
    const running = document.getAnimations().map((a) => a.finished.catch(() => undefined));
    await Promise.race([Promise.all(running), new Promise((done) => setTimeout(done, 600))]);
  });
  /* One frame for the paint that follows the last effect. */
  await new Promise((r) => setTimeout(r, 80));
}

/**
 * The accessible name of an element, the way a screen reader would say it.
 *
 * Deliberately not a CSS selector: a class name is an implementation detail,
 * so anything a spec grips has to be something a person can see.
 */
const NAME_FN = `(el) => (
  el.getAttribute('aria-label') ||
  el.getAttribute('title') ||
  el.textContent ||
  ''
).replace(/\\s+/g, ' ').trim()`;

/* `url` is the page to drive; a caller with its own server (tests/e2e/)
   passes it and never reads `TARGETS`, whose getter needs lib.js's server. */
function makeDriver(page, target, url = TARGETS[target]) {
  /**
   * `confirm()` blocks the calling script until something answers it, and
   * `el.click()` inside `page.evaluate` never returns while one is open - so
   * without this, no state could ever press a destructive control. Every
   * dialog raised on this page is accepted, and its message kept so a spec
   * can compare it as data.
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
     *
     * `as` is the test build's signed-in switch: `?as=<user>` before the hash
     * signs that seed user into the fake cloud; without it the page is
     * signed out (docs/specs/COVERAGE.md, "Test layers"). A user the seed
     * does not have stops the boot with `#boot-error` (main.ts), which
     * fails here at once rather than as a page that never draws.
     */
    async open(route, { as } = {}) {
      await page.goto('about:blank');
      await page.goto(url + (as ? '?as=' + encodeURIComponent(as) : '') + route, {
        waitUntil: 'networkidle0'
      });
      await ready(page);
      const refused = await page.evaluate(
        () => document.getElementById('boot-error')?.textContent ?? null
      );
      if (refused !== null) {
        throw new Error(route + ': the test build refused to boot - ' + refused);
      }
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
        for (const el of document.querySelectorAll(
          'button, a[href], input, select, textarea'
        )) {
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
     * (the legacy app.js) waits for the field to be committed rather than
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
     * Includes `input` so a checkbox with an `aria-label` - a standalone
     * toggle that carries no text of its own - answers to the same verb as a
     * button. `has()` already searched inputs; `click()` had not.
     *
     * Every row checkbox is named after its own record, the same name
     * pressing the row itself opens - a name this method used to resolve by
     * "first exact match, DOM order", which now means the checkbox (an exact
     * match) pre-empts the row (whose own name usually carries a roll number
     * or a stat line too, so it is only ever a substring match) before the
     * `includes` fallback that would have found the row ever runs. Ranked in
     * three tiers instead: an exact non-checkbox match, then a substring
     * non-checkbox match, then an exact checkbox match - "click the row" now
     * means the row whenever a row exists to mean, and only falls back to a
     * bare checkbox for the controls that were always checkbox-only (a
     * standalone toggle with no competing row). `tick()` is the checkbox's
     * own door regardless of what else shares its name.
     *
     * `nth` picks among several controls that share one accessible name in
     * the same tier - several sections each carry their own "Скопировать
     * ссылку на этот раздел" button, for instance.
     *
     * Two ranking edges this method does not resolve correctly for a
     * checkbox, and does not need to: `exact[idx]` and `boxExact[idx]` index
     * two different arrays, so `click(name, 1)` can silently land on the
     * second checkbox when only one exact non-checkbox match exists; and a
     * substring non-checkbox match still pre-empts an exact checkbox, so a
     * box whose exact name is a substring of any button's name is
     * unreachable here at all. For a checkbox, always `tick()`.
     */
    async click(name, nth = 0) {
      const ok = await page.evaluate(
        (n, idx, nameSrc) => {
          const nameOf = eval(nameSrc);
          const els = [
            ...document.querySelectorAll('button, a[href], [role="button"], input, summary')
          ];
          const isBox = (e) => e.tagName === 'INPUT' && e.type === 'checkbox';
          const nonBox = els.filter((e) => !isBox(e));
          const exact = nonBox.filter((e) => nameOf(e) === n);
          const boxExact = els.filter((e) => isBox(e) && nameOf(e) === n);
          const el =
            exact[idx] ??
            (idx === 0 ? nonBox.find((e) => nameOf(e).includes(n)) : undefined) ??
            boxExact[idx];
          if (!el) return false;
          el.click();
          return true;
        },
        name,
        nth,
        NAME_FN
      );
      if (!ok)
        throw new Error(`${target}: no control named "${name}"${nth ? ` (nth ${nth})` : ''}`);
      d.pressed.add(name);
      await settle(page);
      return true;
    },

    /**
     * Ticks (or unticks) the checkbox named `name` - a row's own tick box,
     * which `click()` no longer resolves to when the same name also opens
     * the row. Used wherever a spec means the box specifically, not
     * whatever else on the row shares its name.
     */
    async tick(name, nth = 0) {
      const ok = await page.evaluate(
        (n, idx, nameSrc) => {
          const nameOf = eval(nameSrc);
          const boxes = [...document.querySelectorAll('input[type="checkbox"]')].filter(
            (e) => nameOf(e) === n
          );
          const el = boxes[idx];
          if (!el) return false;
          el.click();
          return true;
        },
        name,
        nth,
        NAME_FN
      );
      if (!ok)
        throw new Error(`${target}: no checkbox named "${name}"${nth ? ` (nth ${nth})` : ''}`);
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
     * (the defect it caught was the `isConnected` guard). `tests/app/` is what needs this; no parity state
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
            ...document.querySelectorAll('button, a[href], [role="button"], input, summary')
          ];
          /* Same three-tier ranking as `click()` - see its own comment. */
          const isBox = (e) => e.tagName === 'INPUT' && e.type === 'checkbox';
          const nonBox = els.filter((e) => !isBox(e));
          const exact = nonBox.filter((e) => nameOf(e) === n);
          const boxExact = els.filter((e) => isBox(e) && nameOf(e) === n);
          return (
            exact[idx] ??
            (idx === 0 ? nonBox.find((e) => nameOf(e).includes(n)) : undefined) ??
            boxExact[idx]
          );
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
        // The message already folds e.message in by hand; adding
        // { cause: e } too is a real improvement, left for whatever next
        // touches error handling here rather than a directory-wide
        // rule turn-off.
        // eslint-disable-next-line preserve-caught-error
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
     * Waits for the address bar to stop changing - specifically for
     * `ListPage.svelte`'s 150ms-debounced URL sync (`URL_DEBOUNCE_MS` above)
     * to land, which `settle()` no longer waits long enough to catch (see its
     * own doc comment). Polls `location.hash` every 40ms (the same cadence
     * `golden.js`'s `waitForToast` uses) and returns once it has been
     * unchanged for `quiet` ms.
     *
     * Two properties worth stating, because they are what makes this an
     * assertion rather than a papered-over failure:
     *  - it cannot hang - `cap` is an absolute ceiling, not a retry budget;
     *  - it cannot mask a genuine failure to sync - it is bounded, not
     *    skipped: it always pays one full quiet window (`quiet` ms, ~250ms
     *    by default, up to ~290ms with the 40ms poll) before returning,
     *    whether or not the address ever changes, so it never returns "at
     *    once". What it waits for is only a write landing within `quiet` of
     *    the call; a write that lands later is missed, and whatever reads
     *    the hash next still fails red on content, same as today.
     */
    async addressSettled({ quiet = URL_DEBOUNCE_MS + 100, cap = 2000 } = {}) {
      const start = Date.now();
      let prev = await page.evaluate(() => location.hash);
      let last = prev;
      let lastChange = start;
      for (;;) {
        const now = Date.now();
        if (now - lastChange >= quiet) return;
        if (now - start > cap) {
          throw new Error(`addressSettled: still changing after ${cap}ms (${prev} -> ${last})`);
        }
        await new Promise((r) => setTimeout(r, 40));
        const cur = await page.evaluate(() => location.hash);
        if (cur !== last) {
          prev = last;
          last = cur;
          lastChange = Date.now();
        }
      }
    },

    /**
     * Waits for a packed shared-list address to finish expanding.
     *
     * `ready()` alone is not enough here: on the live app nothing renders
     * before `expandHash()` replaces the hash (the legacy app.js: `if
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
     * Waits for a packed address that will never finish expanding:
     * the hash itself does not change any more once expansion fails, so
     * `expanded()`'s own wait would spin until its timeout. The bad-link
     * page's own heading is the first thing `ListPage` draws while the route
     * stays packed, so waiting for any heading to exist is the general
     * signal that the async unpack has settled one way or the other.
     */
    async expandFailed() {
      await page.waitForFunction(() => !!document.querySelector('main h1'));
      await settle(page);
    },

    /**
     * Reordering a row by dragging it, the way a pointer does: the page
     * renders `.lrow` in list order, so this grips row `from`'s own handle and
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
            new DragEvent('drop', {
              bubbles: true,
              cancelable: true,
              dataTransfer: dt,
              clientX,
              clientY
            })
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
          return [
            ...document.querySelectorAll('button, a[href], input, select, textarea')
          ].some((e) => (e.offsetParent || e.tagName === 'BODY') && nameOf(e) === n);
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
     * survives the clear rather than racing it. The live app's own suites
     * (since deleted, issue 47) did exactly this.
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
          /* The page heading is the one element every state certainly has and
             certainly means the same thing. "The first paragraph" does not:
             one route's first paragraph is a muted caption and another's is
             the record description, and comparing them reports a difference
             that is not one. */
          heading: type(document.querySelector('h1, .page-h'))
        };
      });
    },

    /**
     * Computed type, and the measured run of text, for named controls.
     *
     * The one place in this driver that takes a CSS selector. Everywhere else
     * grips a control by the name a person reads; this method instead measures
     * one specific *ported* control, and the class names are themselves
     * ported - every component in `app/src/components/` writes its CSS "off
     * `.x` in style.css" (the live stylesheet, since deleted but still
     * readable from history), and Svelte's scoping keeps the original class in
     * the `class` attribute alongside its hash. Selectors stay structural or
     * contract-level wherever one exists (`input[type=search]`, `[data-row]`)
     * and use a ported class only where none does.
     *
     * `probes` is a plain `{ name: selector }` map. A probe that resolves to
     * nothing returns `null` rather than throwing: a renamed class reports
     * `null` against real numbers and fails loudly, rather than silently
     * skipping the check.
     *
     * This exists because a whole-page pixel percentage cannot see a
     * control-sized defect: a wrong font-size on one line of a 1100x900 screen
     * scores well under one percent of the page. The same string in the same
     * face at the same size in the same browser produces the same advance, so
     * rounding is one decimal and no more.
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
     * never painted before this call - measured directly: the geometry stayed
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
        console.log(`       full-page shot: ${String(count)} tries to a settled frame`);
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
          out[name] = {
            x: round1(r.x),
            y: round1(r.y),
            w: round1(r.width),
            h: round1(r.height)
          };
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
            return {
              x: round1(r.x),
              y: round1(r.y),
              w: round1(r.width),
              h: round1(r.height),
              style
            };
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
  /* This emulation predates the current rewrite; its original reasoning
     (parity-era: "both apps fade a card in over 0.28s... takes timing out of
     the pixel comparison") died along with the parity harness, since
     deleted. It stays for a better
     reason: `tokens.css`'s blanket reduced-motion kill is the app's
     shipped behaviour for a visitor who asked for less motion, and only under
     this emulation does every browser suite exercise that branch - drop it
     and the kill is covered by `states.js` case 24 alone. It also keeps every run
     deterministic and fast: without it, every `settle()` wait would be a real
     0.2-0.28s instead of near-instant, and `sweep1180-ru` (already CI's
     longest row, ~372s, pressing hundreds of controls) would gain minutes.
     `print.js`/`driver.js` screenshots still mean a "lands mid-fade" hazard
     is not entirely gone.

     What it costs, so a later session can re-decide with the ledger in
     front of it rather than by guessing what this line was for: it blinds
     `settle()`'s animation wait (see that function's own comment) for
     anything a press defers past 80ms - a debounce or a timer needs its own
     assertion, e.g. `addressSettled()`. Do not flip this to fix a timing
     defect; add an assertion for what actually needs to be waited on. */
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);

  await page.evaluateOnNewDocument(() => {
    window.isSecureContext = true;
    window.__clip = null;
    // A plain constructor function, not a `class`, so it is not an
    // extraneous-class violation - it exists only to be `new`-able the way
    // the real DOM ClipboardItem is, with no static members.
    window.ClipboardItem = function (m) {
      this.map = m;
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        /* Mirrors `clipboard.ts`'s own `fakeClipboard.writeImage` contract
           (480c380): the real `navigator.clipboard.write` awaits each
           MIME-type entry of the `ClipboardItem` internally and rejects if
           one does, which is what lets `clipboard.ts`'s `try/catch` turn a
           rejected `pngOf()` (a tainted canvas) into `copied === false`.
           Resolving here without awaiting reported success no matter what
           the promise-valued entry did, so a rejection escaped as an
           unhandled page error instead. */
        write: async (i) => {
          const m = i[0].map;
          await Promise.all(Object.values(m));
          window.__clip = m;
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
