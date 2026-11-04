# Batch 3b - The hide-and-show header (implement-ready)

This brief is the implementer's whole input for batch 3b. It has the shape of
`plan.md` section 10. The owner's answers are in `context.md` ("Feedback
answers", "Header batch", "Owner AFK from 2026-11-03"); the design input is
`feedback.md` section B, the B2 column, and its focus fix. `plan-fold.md` holds
the matching changes to `plan.md`.

Batch 3b runs after batch 3's review and fix pass, before batch 4, in wave 2.
The owner is AFK, so each choice below is the recommended option.

## Objective

Up to 760 px the whole header hides on scroll down and returns on scroll up, on
every page. Fix the backward focus defect at every width: a Shift+Tab stop never
lands under the header (WCAG 2.4.11). From 761 px the header stays sticky and
nothing else changes.

## Dispatch preflight

- `git fetch origin`; merge `origin/main` into `claude/57` if it moved (a merge,
  never a rebase).
- Read `git diff ef44bb5d HEAD -- app/src/components/Shell.svelte
  app/src/styles/tokens.css app/src/components/TablesPage.svelte`. The batch 3 fix
  pass can touch these files. A line of this brief that no longer matches is the
  implementer's to adapt, and `handoff.md` names the change.
- The mock is `mocks/F/` (`b-hide__360x640__ru.png` and its siblings). The batch
  adds no layout: the header is the header of `mocks/2/`, in or out of the
  window. No new mock is needed, so no owner step applies.
- Impeccable cannot run from a subagent. The orchestrator runs `polish` and
  `harden` after S9 (section "Impeccable").
- Steps are S1 to S11. The line "Session end partial progress" in `handoff.md`
  names the last finished step.

## Decisions of this refresh (planner defaults; the owner is away)

The orchestrator logs each one in the owner-AFK decisions file.

| # | Decision | Reason and trade-off |
|---|---|---|
| H1 | Scope: every page up to 760 px (`app.band === 'narrow'`), not the list pages only. | The owner's answer names no route. The header is the frame of every page, so one route-keyed rule would give two headers at one width and a route table in `Shell`. The catalog (458 rows), `/homebrew`, `/search` and `/s/` gain the same height as the list pages, and a list-only rule saves no code. Trade-off: a GM on a phone also loses the jobs on a scroll down on a roll page, and gets them back on the first scroll up. |
| H2 | The hide is `transform: translateY(-100%)` on the sticky `.topbar`. `position: sticky` stays. | A transform moves no layout: nothing under the header jumps, `scrollHeight` holds, and the drag zone arithmetic holds. Measured on production at 360 px with injected CSS: the box moves -111 px and its bottom edge reads 0. |
| H3 | The logic is one pure function in a new `lib/headerScroll.ts`. `Shell` keeps the state. | No other component reads it, so `AppState` takes nothing. A pure table test covers every branch. |
| H4 | A new port `scroll` reads the offset and the scroll events, and runs the app's own scrolls. | `CLAUDE.md`: a browser API sits behind `app/src/ports/`. |
| H5 | Departure from `feedback.md` (B2, "A `focusin` handler must show it"): the reveal is CSS, `.topbar.away:not(:focus-within)`. | No handler, no race with a scroll event, and focus inside the header wins in every state. Measured on production at 360 px: a focus on the language button draws the header at top 0. |
| H6 | Departure from `feedback.md` (B2, "a target then lands with a 111 px gap"): a navigation shows the header and holds it until the scroll settles, so an anchor lands 12 px under a shown header, as today. | Every anchor scroll follows a navigation or a language switch. `sweep.js`'s "within 40 px under the header bottom" keeps its meaning, and the reader does not see a 111 px strip of the previous section above the target. |
| H7 | Departure from `feedback.md` ("Add `--sticky-h`: 63 px from 761 px, 45 px up to 760 px"): `--sticky-h` is the measured height, set by `Shell` through a `ResizeObserver`, as `SelectionBar` sets `--selbar-h`. `tokens.css` keeps 63, 105 and 111 px for the first paint. | The worst case is not a constant. Measured on production 2026-11-03: 111 px at 345 and 360 px, but 152 px at 320 px in EN signed out, where «Sign in» wraps the brand row. A static 111 px leaves a 41 px covered band at 320 px. |
| H8 | `--anchor-gap` is 12 px at every width. `--anchor-top` becomes `calc(var(--sticky-h) + var(--anchor-gap))` and its two media overrides go. | Today's landings are 75, 118 and 132 px. After: 75, 117 and 123 px, inside `sweep.js`'s 40 px. One value replaces three. |
| H9 | Reduced motion: the header still hides, with no slide. | A jump on a direction change moves nothing across the screen. Keeping the behavior also keeps it provable in the browser suite, which forces this mode. Trade-off: a reader who asked for less motion sees the header appear at once. |
| H10 | The popup guard reads the page: `document.querySelector('[role="menu"], dialog[open]')`, plus `app.menuFor`. | Every `Menu` caller and every modal `<dialog>` matches with no wiring, also those of batches 4-9a. `feedback.md` names `menuOpen` and `dialogOpen`, which miss the supplements menu and the catalog's «Ещё». |
| H11 | Departure from `feedback.md` (B2, print: "plus a state reset"): no print handler. | `@media print` sets `.topbar` to `display: none`, so the state draws nothing, and it is still true after the print. A reset adds a listener with no reader. |
| H12 | Numbers: the dead zone is 10 px; the header never hides at or above its own height; a page whose `max` is under twice the header height is short and never hides it. The slide is `transform 0.2s ease-out`. | `feedback.md` gives 10 px. The top rule keeps the page at scroll 0 as `FIRST_SCREEN` measures it. |
| H13 | `Shell` holds its own copy of the eight `ResizeObserver` lines. No shared helper. | The rule "extract on the second use" is for shared UI. `SelectionBar` takes no `app`, and components import no port value, so a helper needs a new module for a saving of six lines. |

## In scope

- `feedback.md` section B, the B2 column, every row of its interaction table.
- The focus fix, at every width.
- The port, its fake and its tests. The `DragPort.active()` read.
- The specs and the decision file that the header's behavior needs.

## Out of scope

- B1 and B0: the owner answered B2. Do not reopen them.
- The header's content, its height, and the 320 px brand row wrap.
- The focus jump of the next section ("Measured facts", item 3).
- The compact row, the list filter and the head of `/lists/<uuid>` (batch 9a).
- The filter column and the editor preview: both draw from 800 px or wider, so
  both keep their `top`.

## Measured facts (production, 2026-11-03, the Browser pane, injected CSS only)

1. Header height: 111 px at 345 and 360 px, 63 px at 1180 px, 152 px at 320 px in
   EN signed out (three rows: the brand, then the language and «Sign in», then
   the jobs).
2. On `/en/tables/eq_weapon` at 320 px, 30 backward `focus()` stops from row 120:
   8 covered with no fix, 0 covered with `scroll-padding-top` at the measured
   height. A focused row lands at the same place, 367 px at 360 px, with the
   header shown or hidden.
3. An existing defect, not caused by this batch: a `focus()` on a header control
   moves the page up. At scroll 1500: to 1199 at 320 px, to 1115 at 1180 px, with
   no `scroll-padding-top` and no hide. `{ preventScroll: true }` stops it. It
   goes in `handoff.md` Deferred (see "Risks"). For this batch it is harmless: the
   upward move shows the header.
4. Not observed: the slide itself. The transition did not advance in the hidden
   Browser pane, so case 84 proves it in the browser suite.

## Files expected

| Step | Files |
|---|---|
| S1 | `app/src/styles/tokens.css`; `HomebrewCards.svelte`, `TableRows.svelte`, `TablesPage.svelte` (`scroll-margin-top`) |
| S2 | new `app/src/lib/headerScroll.ts`, new `headerScroll.test.ts` |
| S3 | new `app/src/ports/scroll.ts`; `ports/types.ts`, `ports/index.ts`, `ports/ports.test.ts` |
| S4 | `ports/drag.ts`, `ports/types.ts`, `ports/ports.test.ts` |
| S5 | `TablesPage.svelte`, `HomebrewCards.svelte` (the two `scrollIntoView` calls) |
| S6 | `Shell.svelte`, `shell.test.ts` |
| S7 | `tests/app/states.js`, `tests/app/driver.js`, `tests/app/inventory.js`; one golden pair |
| S8 | `docs/specs/FEATURES.md`, `STATE.md`, `COVERAGE.md`; `DESIGN.md`; new `docs/decisions/2026-11-03-the-header-hides-on-scroll-down-up-to-760-px.md`; `docs/DECISIONS.md` |
| S9 | `handoff.md` (the Impeccable outcome) |
| S10 | none (gates) |
| S11 | `issues/57/mocks/3b/built/`, `handoff.md` |

`tests/app/sweep.js` does not change: CI's sweep run re-checks its anchor line.

## Steps

### S1. The tokens and the focus fix

In `tokens.css`, replace the `--anchor-top` block and its two media blocks:

```css
  /* The header's height, for the first paint: `Shell.svelte` sets the measured one
     once it is mounted, because a narrow window can wrap the brand row. */
  --sticky-h: 63px;

  /* The space between the header and a linked section, row or card. */
  --anchor-gap: 12px;

  /* Where the filter column rests. */
  --anchor-top: calc(var(--sticky-h) + var(--anchor-gap));
}

@media (max-width: 760px) {
  :root {
    --sticky-h: 105px;
  }
}

@media (max-width: 600px) {
  :root {
    --sticky-h: 111px;
  }
}
```

In the `html` rule, before `scroll-padding-bottom`:

```css
  /* A focused control and a linked target stop clear of the header at its full height,
     whether it is shown or hidden (WCAG 2.4.11). */
  scroll-padding-top: var(--sticky-h);
```

`scroll-margin-top` adds to `scroll-padding-top`. So the rules in
`HomebrewCards.svelte` (`.cards > li` block, the comment reads "under the sticky
top bar"), `TableRows.svelte` and `TablesPage.svelte` change from
`var(--anchor-top)` to `var(--anchor-gap)`. `FilterPanel.svelte` keeps
`--anchor-top`.

### S2. The pure logic

`app/src/lib/headerScroll.ts`:

```ts
/* Whether the header is shown while the page scrolls (DESIGN.md, "The Hidden Header
   Rule"). `turn` is the offset of the last change of direction. */

/** The distance a scroll travels before the header answers it. */
export const DEAD_ZONE = 10;

export interface HeaderState {
  shown: boolean;
  turn: number;
}

export interface ScrollRead {
  /** The offset, already clamped to 0..max. */
  y: number;
  /** The furthest offset. */
  max: number;
  /** The header's own height. */
  height: number;
  /** True while something else owns the page's movement. */
  held: boolean;
}

/** Returns the state of a page that has just arrived at `y`: the header shown. */
export function headerAt(y: number): HeaderState {
  return { shown: true, turn: y };
}

/** Returns the state after one scroll read. */
export function nextHeader(s: HeaderState, r: ScrollRead): HeaderState {
  if (r.y <= r.height || r.max < 2 * r.height) return headerAt(r.y);
  if (r.held) return { shown: s.shown, turn: r.y };
  const moved = r.y - s.turn;
  if (s.shown) {
    return moved >= DEAD_ZONE
      ? { shown: false, turn: r.y }
      : { shown: true, turn: Math.min(s.turn, r.y) };
  }
  return moved <= -DEAD_ZONE
    ? { shown: true, turn: r.y }
    : { shown: false, turn: Math.max(s.turn, r.y) };
}
```

The order is load-bearing: the top and short-page line comes before `held`, so a
search that shrinks the page under a focused field still shows the header at the
top.

### S3. The port

`ports/types.ts`, after `ViewportPort`:

```ts
/** The page's vertical scroll. */
export interface ScrollPort {
  /** Returns the offset, clamped to 0..max: an overscroll bounce reads as the edge. */
  y(): number;
  /** Returns the furthest offset the page reaches now. */
  max(): number;
  /** Calls `fn` at most once per frame while the page scrolls. Returns an unsubscribe. */
  onscroll(fn: () => void): () => void;
  /** Scrolls `el` into view; `busy()` answers true until the scroll settles. */
  into(el: Element, options: ScrollIntoViewOptions): void;
  /** Marks the page as moved by the app or the browser, until the scroll settles. */
  settle(): void;
  /** Whether a scroll that no reader asked for is still running. */
  busy(): boolean;
}
```

Add `scroll: ScrollPort;` to `Env` after `viewport`.

`ports/scroll.ts`. Touch `window` only inside the methods: Node loads this module
for the hosted E2E. The quiet timer serves every browser, so `scrollend` is not
used (Safari gained it late).

```ts
/* The page's scroll. A port because jsdom scrolls nothing, and a component test needs
 * to move it. */

import type { ScrollPort } from './types.js';

/* A smooth scroll, or the browser's own restore on Back, starts within a frame or two
   and sends an event each frame; this long with no event ends it. */
const QUIET_MS = 150;
/* A page that never goes quiet still gives the header back. */
const CAP_MS = 2000;

export function browserScroll(): ScrollPort {
  let busy = false;
  let quiet: ReturnType<typeof setTimeout> | undefined;
  let cap: ReturnType<typeof setTimeout> | undefined;

  const done = (): void => {
    busy = false;
    clearTimeout(quiet);
    clearTimeout(cap);
    window.removeEventListener('scroll', again);
  };
  const again = (): void => {
    clearTimeout(quiet);
    quiet = setTimeout(done, QUIET_MS);
  };
  const settle = (): void => {
    if (!busy) {
      busy = true;
      window.addEventListener('scroll', again, { passive: true });
    }
    clearTimeout(cap);
    cap = setTimeout(done, CAP_MS);
    again();
  };
  const max = (): number =>
    Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  return {
    y: () => Math.min(Math.max(window.scrollY, 0), max()),
    max,
    onscroll(fn) {
      let frame = 0;
      const on = (): void => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          fn();
        });
      };
      window.addEventListener('scroll', on, { passive: true });
      return () => {
        window.removeEventListener('scroll', on);
        cancelAnimationFrame(frame);
      };
    },
    into(el, options) {
      settle();
      el.scrollIntoView(options);
    },
    settle,
    busy: () => busy
  };
}

export interface FakeScroll extends ScrollPort {
  /** Moves the fake to `y` and tells every listener. */
  to(y: number, max?: number): void;
  /** Ends the settling, as a quiet page does. */
  quiet(): void;
}

export function fakeScroll(): FakeScroll {
  let y = 0;
  let top = 10000;
  let busy = false;
  const subs = new Set<() => void>();
  return {
    y: () => y,
    max: () => top,
    onscroll(fn) {
      subs.add(fn);
      return () => {
        subs.delete(fn);
      };
    },
    into(el, options) {
      busy = true;
      el.scrollIntoView(options);
    },
    settle() {
      busy = true;
    },
    busy: () => busy,
    to(next, max = top) {
      top = max;
      y = next;
      for (const fn of subs) fn();
    },
    quiet() {
      busy = false;
    }
  };
}
```

`fakeScroll().into` calls the element's own `scrollIntoView`, so the spies of
`tables.test.ts`, `homebrewCatalog.test.ts` and `homebrewPage.test.ts` keep their
meaning with no edit.

`ports/index.ts`: import and export both, `export type { FakeScroll }`, then
`scroll: browserScroll()` in `browserEnv` and `scroll: fakeScroll()` in `fakeEnv`,
each after `viewport`.

### S4. The drag read

`DragPort` gains:

```ts
  /** Whether a drag is live now: its edge scroll is not the reader's. */
  active(): boolean;
```

- `nativeDrag()`: one `let live = false;` before `return`. `onStart` sets it true
  after the grip check; `reset` sets it false. `active: () => live`.
- `noDrag()`: `active: () => false`.
- `fakeDrag()`: a `live: false` field on the port, `active: () => port.live`. Its
  type gains `live: boolean`.

`nativeDrag` has a test at `ports.test.ts` near `bind(box, handlers)`, and
`listPage.test.ts` reads `fakeDrag`. No other implementer exists.

### S5. The two app scrolls

- `TablesPage.svelte`, the anchor effect: replace `target?.scrollIntoView({...})`
  with `if (target) app.env.scroll.into(target, { behavior: ..., block: 'start' })`.
  The comment on the `behavior` choice stays.
- `HomebrewCards.svelte`: the same for `hb-card-`, `{ block: 'start' }`.

Leave `AddToList.svelte` (`block: 'nearest'`, an open menu holds the header) and
`ItemPicker.svelte` (inside a listbox) as they are.

### S6. The shell

Script of `Shell.svelte`:

```ts
import { untrack } from 'svelte';
import { headerAt, nextHeader } from '../lib/headerScroll.js';

let topbar = $state<HTMLElement | undefined>(undefined);
let head = $state.raw(headerAt(0));

/* A text field: the on-screen keyboard moves the page without the reader. */
const FIELD =
  'input:not([type="checkbox"], [type="radio"], [type="button"], [type="submit"], [type="file"], [type="range"]), textarea, select, [contenteditable]';

/* Every popup is a `Menu`, the add-to-list menu or a modal `<dialog>`; while one is open,
   a page movement is not the reader's. */
function held(): boolean {
  const { scroll, drag } = app.env;
  return (
    scroll.busy() ||
    drag.active() ||
    app.menuFor !== '' ||
    document.querySelector('[role="menu"], dialog[open]') !== null ||
    document.activeElement?.matches(FIELD) === true
  );
}

/* The header hides up to 760 px only (DESIGN.md, "The Hidden Header Rule"). */
$effect(() => {
  if (app.band !== 'narrow') return;
  const scroll = app.env.scroll;
  return scroll.onscroll(() => {
    head = nextHeader(head, {
      y: scroll.y(),
      max: scroll.max(),
      height: topbar?.offsetHeight ?? 0,
      held: held()
    });
  });
});

/* An arrival shows the header and waits out the scroll that comes with it: a linked
   target, the browser's restore on Back or a reload, a shorter page. */
$effect(() => {
  void app.navigations;
  void app.band;
  untrack(() => {
    app.env.scroll.settle();
    head = headerAt(app.env.scroll.y());
  });
});

/* The focus fix reads the header's real height: a narrow window wraps the brand row. */
$effect(() => {
  const el = topbar;
  if (!el || typeof ResizeObserver !== 'function') return;
  const root = document.documentElement;
  const watch = new ResizeObserver(() => {
    root.style.setProperty('--sticky-h', `${String(el.offsetHeight)}px`);
  });
  watch.observe(el);
  return () => {
    watch.disconnect();
    root.style.removeProperty('--sticky-h');
  };
});
```

Markup: `<header class="topbar" class:away={!head.shown} bind:this={topbar}>`.

Style, inside the existing `@media (max-width: 760px)` block:

```css
    .topbar {
      transition: transform 0.2s ease-out;
    }

    /* A focus inside the header brings it back, so a Tab never lands out of sight. */
    .topbar.away:not(:focus-within) {
      transform: translateY(-100%);
    }
```

Update the `.topbar` comment: "Sticky and translucent: the tabs stay reachable
while a long table scrolls under them; up to 760 px the header leaves on a scroll
down and returns on a scroll up."

Do not use `visibility: hidden`, `inert` or `aria-hidden` on the hidden header:
each removes the keyboard's path back into it.

### S7. Suites

`tests/app/driver.js`: add `d.scrollPage(y)`. It waits 200 ms first, which is the
port's `QUIET_MS` plus a frame, so the arrival hold has ended. Then it scrolls
with `window.scrollTo(0, y)`, then it calls `settle(page)`. A comment names the
reason for the fixed wait.

`tests/app/states.js`, two new cases after case 83.

**Case 84, "the header hides and returns up to 760 px"**, at 360x640 in RU unless
a line says otherwise. Read the header through `.topbar`'s rect, never through a
duration. Each line is one `ok`.

| Guard | Check |
|---|---|
| Hide and return | On `#/tables/eq_weapon`, `d.scrollPage(800)`: bottom at most 0. `scrollBy(0, -20)`: top 0. `document.documentElement.scrollHeight` is the same in both. |
| Dead zone | Hidden, `scrollBy(0, -5)`: still hidden. |
| Scroll 0 | `scrollTo(0, 0)`: top 0, and the `[data-primary]` top is the same as before the first scroll. |
| Focus into the header | Hidden, `page.focus('.topbar .seg button')`: top 0, and `elementFromPoint` at the button's center is the button. |
| A field and the keyboard | Focus «Поиск», `d.scrollPage(800)`: top 0. A blur and a scroll down: bottom at most 0. |
| An open menu | At scroll 0 press «Ещё», then `d.scrollPage(800)`: top 0. |
| A sheet | Press «Фильтры», `scrollTo(0, 800)` behind it: top 0. After «Закрыть», a scroll down hides the header. |
| The record dialog | The same with a row's dialog on `#/tables/eq_weapon`. |
| Navigation | Hidden, `d.go('#/roll/std')`: top 0. `page.goBack()`: top 0 after the browser's restore. |
| Anchor | Hidden, `d.go('#/tables/vault_of_ages/tA')`: the section top lies from the header bottom to 40 px under it, and the header top is 0. |
| Short page | `#/i/nope` at its maximum scroll: top 0. |
| Print | Hidden, `page.emulateMediaType('print')`: `.topbar` computes `display: none`. Back to `screen`: the same rect as before. |
| From 761 px | At 1180x720, `d.scrollPage(800)`: top 0, no `.away`. |
| Motion | Under `no-preference` (`page.emulateMediaFeatures`, as the drop mark's check in `states.js` does): the `.topbar` `transition-duration` is `0.2s` and `transition-property` is `transform`; a scroll down, a wait for `transitionend`, then bottom at most 0. Under `reduce` again: `0s`. Restore in a `finally`. |

**Case 85, "a backward Tab never lands under the header"**, at 360x640 and
1180x720, on `#/tables/eq_weapon`:

1. Scroll to row 120 and focus a control there.
2. Press Shift+Tab 30 times with `page.keyboard`.
3. After each press, read the focused rect and the header's rect. A stop is covered
   when its top is above the header bottom less 1 px, or when `elementFromPoint` at
   its center is outside the element. Assert 0 covered, and print the count.

Then assert `getComputedStyle(root).scrollPaddingTop` equals
`.topbar`'s `offsetHeight` at 320 (EN, signed out, the wrapped brand row: 152 px),
360, 768 and 1180 px.

`tests/app/inventory.js`, after the sheet states:

```js
  {
    id: '#/tables/eq_weapon ~ header hidden',
    route: '#/tables/eq_weapon',
    width: 360,
    why: 'the header out of sight after a scroll down: it stays in the tree and the tab order',
    enter: async (d) => {
      await d.scrollPage(800);
    }
  },
```

### S8. Prose, in the same commit

`FEATURES.md`, "Chrome", after the bullet "From 761 px the brand, the jobs...":

> Up to 760 px the whole header leaves on a scroll down and returns on a scroll
> up, on every page, past a 10 px dead zone. It stays at the top of the page, on a
> short page, after a navigation and while a menu, a sheet, a dialog, a text field
> or a drag owns the page; a focus inside it brings it back. A focused control and
> a linked target stop clear of its full height, so a Tab never lands under it.

In the same section, the reduced-motion bullet adds "and the header's slide, which
then appears at once". The "Relations" sentence "the sticky top bar" stays, because
`ItemPicker` reads the header's rect.

`STATE.md`, row UI, after `band`: `` `head` (whether the header is shown up to 760
px and where the scroll last turned: `Shell`, memory, reset on a navigation) ``.

`COVERAGE.md`: in the `app/states` row add cases 84 and 85 in the file's style, and
raise its count of states by two.

`DESIGN.md`:

- "Layout", first paragraph: after "(63px from 761px, 111px at 360px)" add "; up to
  760px it leaves on a scroll down and returns on a scroll up".
- The Two Breakpoints Rule: replace "A linked section, row or card lands under the
  header by `--anchor-top`, set at the same two steps: 75px, 118px up to 760px and
  132px up to 600px." with "A linked section, row or card lands `--anchor-gap`
  (12px) under the header; `--sticky-h`, the header's measured height, is the
  page's `scroll-padding-top`, so a focused control stops clear of it."
- A new named rule after The Two Breakpoints Rule:

  > **The Hidden Header Rule.** Up to 760px the whole header leaves on a scroll down
  > and returns on a scroll up, on every page, because a phone reader needs the rows
  > more than the jobs. It slides in 0.2s, or appears at once under reduced motion. It
  > is shown at the top of a page, on a short page and after a navigation; a menu, a
  > sheet, a dialog, a text field or a drag freezes it; a focus inside brings it back.
  > It never leaves the tab order.

The decision file:

```markdown
# 2026-11-03 - Up to 760 px the header hides on scroll down and returns on scroll up

- Task: `57` (owner, 2026-11-03, end-user feedback F2, answer Q2).
- Decision: on every page up to 760 px the whole header leaves on a scroll down and returns on a scroll up; `app/src/lib/headerScroll.ts` holds the rule, the `scroll` port the reads, `DESIGN.md` "The Hidden Header Rule" the guards. `--sticky-h`, the measured height, is the page's `scroll-padding-top` at every width (WCAG 2.4.11).
- Rejected: the brand row scrolls away and the jobs stay (six lines of CSS and no state, but the header never returns, and the owner asked that it does); no change (1.5 fewer rows at 360x640); the list pages only (two headers at one width and a route table in the shell); a `focusin` handler for the reveal (`:focus-within` has no race with a scroll); a fixed `--sticky-h` (the header is 152 px at 320 px in English, not 111 px).
- Accepted trade-off: the header moves under the thumb, and the language and account controls need a scroll up.
```

Then `node tools/decisions.js`.

### S9. Impeccable

The orchestrator runs `polish` and `harden` on `Shell.svelte` from the built app at
360 px. `handoff.md` gives the outcome. Fallback if the orchestrator cannot run
them: `impeccable:impeccable-finish-reviewer`, as `plan.md` section 10 names it.

### S10. Gates

See "Verification".

### S11. Evidence

Write `issues/57/mocks/3b/built/shoot.js` from `mocks/3/built/shoot.js`. Capture at
360x640, RU and EN: the header at scroll 0, hidden at scroll 800, back after a
scroll up, revealed by a focus; and at 1180x720 the header at scroll 800.

## Acceptance criteria

Each line is observable in a suite, a unit case or the built app.

- Up to 760 px, on every page: past the header's height and a 10 px scroll down the
  header is out of the window; after a 10 px scroll up it is back. Layout does not
  move. From 761 px nothing hides.
- Programmatic scroll and anchors: a linked section or row lands at most 40 px
  under a shown header at 360, 390 and 768 px; the scroll does not hide the header
  on the way (`sweep.js`, case 84).
- Keyboard focus into the header: the header is drawn at top 0 and the control is
  hit at its center (case 84).
- On-screen keyboard: while a text field holds the focus, no scroll changes the
  header; a checkbox tick does not count as a field (`shell.test.ts`, case 84).
- An open menu, sheet or dialog freezes the header: the account menu, the
  supplements menu, the catalog's «Ещё», the add-to-list menu, `Sheet`,
  `RecordModal`, `CropDialog` (`shell.test.ts`; case 84 for three). The first
  scroll after a close does not jump, because `turn` followed the page.
- Drag auto-scroll freezes the header (`ports.test.ts` for `active()`,
  `shell.test.ts` for the freeze).
- iOS bounce: the port clamps a negative offset and an offset past `max`, and a
  bottom bounce back reads as no movement (`ports.test.ts`, `headerScroll.test.ts`).
  A real device is not verified; `plan-fold.md` places it in the post-release check.
- Reduced motion: the header moves with no slide; the declared `0.2s` and its
  `0s` are read with the emulation relaxed and restored (case 84).
- Short pages: a page whose `max` is under twice the header height never hides it.
- Navigation reset: a `go()`, Back, Forward and a reload arrive with the header
  shown, and the restore does not hide it. A band change resets it too.
- Print: the hidden header prints nothing and returns as it was (case 84).
- Port: `ports/scroll.ts` is reached by `ports.test.ts`, with its fake; no file
  under `app/src/` outside `app/src/ports/` reads `scrollY` or `pageYOffset`.
- Focus fix: `--sticky-h` is the measured header height and the `html`
  `scroll-padding-top`; `--anchor-gap` serves the three `scroll-margin-top` rules;
  0 covered stops in 30 Shift+Tab presses at 360 and 1180 px (case 85), and the case
  fails without the fix: CI's run shows the pass, and the failing direction comes
  from the local Shift+Tab probe or a test (Verification, step 5).
- The hidden state has its `inventory.js` entry, its RU and EN golden and an axe
  case (`shell.test.ts`, ending in `expectNoA11yViolations`).
- The header's tab order and accessibility tree do not change: no other golden
  moves.
- `FIRST_SCREEN` is unchanged and passes; no row moves, no limit moves.
- The specs, DESIGN.md rules and decision file of S8 match what ships.
- From "Each of batches 2-9": the detector line, American spelling in new prose,
  the screenshot set in `mocks/3b/built/`, and the `polish` and `harden` outcome are
  in `handoff.md`.
- `handoff.md` Deferred names the focus jump of "Measured facts", item 3.
- The gates pass and CI is green on the pushed tip.

## First-screen row (plan section 14)

No row changes. The rule is measured at scroll 0 (`primaryTop` calls `scrollTo(0,
0)`), and at scroll 0 the header is shown, because `nextHeader` returns shown at any
offset up to the header's height. The transform takes no layout, so `main` starts at
the same offset in both states. The rule counts the header as a control above the
primary content, and the header is still there at scroll 0. The 1.5 rows that B2
gives with C1b at 360x640 appear only after a scroll down, so they change no offset.

## Goldens and new states

| State id | Width | Entry |
|---|---|---|
| `#/tables/eq_weapon ~ header hidden` | 360 | `d.scrollPage(800)` (new) |

A golden is accessibility-tree text. The class and the transform change no node, so
no other golden moves. Seed the new pair with `--only`; do not run the four shards.
A `git diff --stat tests/app/snapshots` with any other file is a defect to read, not
to re-seed.

## DESIGN.md rules this batch writes

The Hidden Header Rule (new); The Two Breakpoints Rule (`--anchor-top` sentence);
"Layout" (the header sentence). Texts are in S8.

## Tests

| File | Cases |
|---|---|
| `headerScroll.test.ts` | a table: shown at `y` equal to `height`; hidden at `height` + 1 after 10 px down; 9 px down stays; the turn follows the lowest offset while shown and the highest while hidden; 10 px up shows; `held` keeps `shown` and moves `turn`; `max` under `2 * height` shows from a hidden state; the top line beats `held` |
| `ports.test.ts` | `browserScroll`: `y()` clamps `-40` to 0 and `max + 60` to `max`; `max()` is never negative; two scroll events in one frame call `fn` once; the unsubscribe stops it; `into` calls `scrollIntoView` with the options and is `busy` until `QUIET_MS` after the last event (`vi.useFakeTimers`); a page that never goes quiet ends at `CAP_MS`. `fakeScroll`: `to`, `quiet`, the unsubscribe. `nativeDrag`: `active()` is false, true after a grip's `dragstart`, false after `dragend` and after a drop. `noDrag`, `fakeDrag` |
| `shell.test.ts` | with `fakeViewport('narrow')` and `fakeScroll` (call `quiet()` after mount): a scroll down sets `.away`; a scroll up clears it; no `.away` at `wide`; a band change clears it; `app.go` clears it and leaves `busy` true; each hold: a `role="menu"` box in the page, a `dialog[open]`, `app.menuFor`, a focused text input, a focused checkbox (does not hold), `drag.live`, `busy`; `--sticky-h` follows a stubbed `ResizeObserver` and leaves on unmount, as `selectionBar.test.ts` does; the hidden state ends in `expectNoA11yViolations` |
| `tests/app/states.js` | cases 84 and 85 (S7) |

The browser suite forces `prefers-reduced-motion: reduce` (`tests/app/driver.js`,
`prepare()`), and `tokens.css` answers with `transition-duration: 0s`. So a timing
assertion in `tests/app/` proves nothing there: both sides read `0s`. Assert
geometry after the state changes. The one timing read in this batch runs with the
emulation relaxed, pairs the non-zero value with the `0s` one, and restores the
emulation in a `finally`, because the suite shares one page.

## Verification

In this order, after S8. One command per call.

1. While editing: `npx vitest run app/src/lib/headerScroll.test.ts
   app/src/ports/ports.test.ts app/src/components/shell.test.ts
   app/src/components/tables.test.ts app/src/components/listPage.test.ts`, then
   `npm run lint:untyped`, `npm run lint:typed`.
2. `npm run build:test`, then `node tests/app/golden.js --update --only="header
   hidden"`, then `git diff --stat tests/app/snapshots`: two new files and nothing
   else. This is the golden re-seed; no other browser suite runs locally.
3. `node tools/decisions.js`.
4. `npm run check:built`.
5. The focus fix needs no local browser suite. CI's run of cases 84 and 85 on the
   pushed tip shows the pass (`app/contracts`, `app/states`, and `sweep.js` at 360,
   390, 768 and 1180: the anchor line passes with the section at about 123 px under a
   111 px header bottom at 360). The failing direction comes from the Shift+Tab
   probe of "Measured facts" (30 backward `focus()` stops at 320 px EN: 8 covered
   without the fix, 0 with `scroll-padding-top` at the measured height) or from a
   unit test of the token. Give the probe counts in `handoff.md`. No local revert
   build runs.
6. `impeccable detect --json --no-inline-ignores app/src`, and the spelling grep of
   batch 2's word list over the touched files.
7. `rtk npm run check:fast` (Bash timeout 600000), last.
8. Commit, push, the CI credit (`ci-credit.mjs`). The batch review follows
    (trigger: new or changed UI; `tests/app/` changed).

## Risks and do-nots

- Do not add a route list to the header. H1 is settled.
- Do not write `transition` outside the 760 px media block: from 761 px the header
  does not move.
- Do not use `visibility`, `inert` or `aria-hidden` on the hidden header.
- Do not hide in `tokens.css`: a scoped rule needs the class.
- Do not move the top line of `nextHeader` under `held`.
- Do not change `--anchor-top` readers: `FilterPanel` stays; a fourth
  `scroll-margin-top` needs `--anchor-gap`.
- A case at 360 px that scrolls and then reads `.topbar` can now see a hidden
  header. `ItemPicker`'s `place()` reads the rect, and `Math.max` with
  `vv.offsetTop` handles a negative bottom. Case 79 holds a focused field. A failing
  case of this kind is a case to adapt, and `handoff.md` names it.
- `d.click` calls `el.click()`, so a hidden header does not stop a driver press. A
  real mouse click in a case does stop: use `page.focus` or scroll up first.
- The keyboard's close moves the page after the blur, so the header can flip once.
  This is accepted: no stored state and no covered focus.
- The focus jump ("Measured facts", item 3) stays. `{ preventScroll: true }` fits
  only a control that is always in view, and `Menu` also serves controls that scroll
  away, so the fix needs its own look. `handoff.md` Deferred takes it; at closeout it
  goes to `docs/specs/DEBT.md` unless a later batch fixes it.
- VoiceOver can move its cursor into the hidden header with no DOM focus, so the
  header stays out of sight. Not verified on a device.
- The transition did not advance in the hidden Browser pane. Case 84's `transitionend`
  wait is the first real proof. If it times out in headless Chrome, read the computed
  value on a shown page before changing the design.
- Review order: `headerScroll.ts`, `scroll.ts`, `Shell.svelte`, `tokens.css`, the
  suites, the prose.

## Standing checks for batch 3b

1. Scale. The batch adds no collection and no cap. States:

   | State | Shows | Proof |
   |---|---|---|
   | Empty or short page (`max` under twice the header) | the header stays | `headerScroll.test.ts`, case 84 |
   | One screen plus a little (`max` at twice the header) | the header hides past its height, returns at the top | `headerScroll.test.ts` |
   | Many: 458 rows; 100 and 300 list entries | the same; a scroll read is one per frame and does not scale with rows, because the popup query runs once per frame on an attribute selector | `ports.test.ts`, case 84 |
   | Longest name | unchanged: the header draws no record name | unchanged |
   | 360 px | the header out of the window, 111 px returned | case 84, golden |
   | 1180 px | unchanged, sticky at 63 px | case 84 |
   | 320 px EN signed out | 152 px header; `--sticky-h` follows | case 85 |

   Row order and the primary action do not change. Sticky regions: the header (at
   most 152 px at 320 px) and the selection bar (149 px at 360). Neither can pass the
   viewport height. With the on-screen keyboard open at 360x640 about 380 px stay
   (an estimate, `feedback.md`). A shown header takes 111 px of them and is frozen
   while the field holds focus, as it is today.
2. Error scenarios. No write path and no stored shape change. Loading and a failed
   read: the page is short, so the header stays; when rows arrive the rule applies.
   Failed write and conflict: none. A re-read that shrinks the page: the browser
   clamps the offset, the scroll event arrives, and the top line shows the header.
   A named record deleted: none. Offline: none. A stale tab: the previous bundle keeps
   the sticky header until a reload. A revert: nothing is stored, so nothing is
   left behind. No path can lose stored data.
3. Consistency. Followed: `FEATURES.md` rules 11 (a close leaves the header as it
   was) and 20 (focus stays visible), the Same Label Rule (no label changes), The Two
   Breakpoints Rule (no new step: the port's `narrow` and the 760 px query). One
   behavior on every page at one width. Named difference: from 761 px the header
   stays sticky, because 63 px is little and a laptop has height to spare. Toasts, the
   selection bar and the mode row do not change: the first two sit at the bottom
   edge, and the third scrolls with the page.
4. RU/EN parity: not applicable - the batch adds no string. Cases 84 and 85 read
   controls in RU, and case 85 reads EN at 320 px, where the EN label wraps the row.

## Gate cost

`plan.md` section 8: one code batch, 45-60 min, plus these extra local gates. Browser
suites and sweeps run on CI (owner, `context.md`, "Local gates").

| Gate | Minutes |
|---|---|
| `build:test` and the golden re-seed of one pair | about 5 |
| `check:built`, both lints, decisions and the detector | about 5 |
| the orchestrator's `polish` and `harden` | 5-10 |

Total: 15-20 min of extra gates.

## Writer tests

Facts for the orchestrator's dispatch, not a model choice.

| Test | Answer |
|---|---|
| 1 (a step asks for a choice, or an `Open design question:`) | no: every choice is decided above |
| 2 (public contract, route, stored state, product law, migration, hook, configuration) | no |
| 3 (visual judgment: print fitting, a golden re-seed, parity with a design node) | one new golden pair, seeded with `--only`; no re-seed of other states and no design node |

## Split criterion

A different route set: the header is on every route and has no filter set, while
batch 3 owns `/tables/*` and batch 4 owns `/i/`, `/h/` and the dialog
(`CLAUDE.md`, "Task and session protocol"). It shares no component, seed or filter
with either, and the owner ordered it as its own batch right after batch 3 ("Header
batch"). A merge into batch 3 would also restart a review that is running now.

## Plan review

Not required (no trigger fired): no migration or SECURITY DEFINER function, no
public contract (`routes.json`, `CONTRACTS.md`, `llms.txt`, `tests/contracts.js` and
`docs/fixtures/` do not change), no stored data or `localStorage` key, no write or
sync protocol. `DragPort` and `Env` are internal.

A batch review is required after the implementer (trigger: new or changed UI).
