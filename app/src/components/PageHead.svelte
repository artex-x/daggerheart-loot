<script lang="ts">
  /* The heading of a page in one order (DESIGN.md, "The Head Order Rule"): its name, the
     sibling pages' pills, the pin, the help, the primary; then the line under it and the
     explanation the help folds open. The two buttons carry their labels;
     up to 760 px every page draws them in its «Ещё» instead (DESIGN.md, "The Same
     Label Rule").

     Extracted on the second use rather than designed: the roll panel and the
     Core rules panel had the same thirty lines and the same two hundred of
     style, and the alternate tables would have been a third copy. Both copies
     are gone; this is where the padding is decided now. */
  import { tick, untrack } from 'svelte';
  import type { Snippet } from 'svelte';
  import HelpBox from './HelpBox.svelte';
  import HelpButton from './HelpButton.svelte';
  import Icon from './Icon.svelte';
  import { canonicalHash } from '../lib/hash.js';
  import type { Help } from '../lib/help.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    title: string;
    /** The line under the heading; none where it is empty. */
    sub: string;
    /** What this section explains about itself, where anything is written. */
    help: Help | null;
    /**
     * The address this page pins, where it differs from the address bar. Two
     * callers pass it: `TablesPage`, because a bare `#/tables` still shows a
     * named table underneath, which `AppState` cannot see on its own
     * (`app.svelte.ts`'s `toggleHome`); and `HomebrewPage`, whose four tabs
     * share one pin, `#/homebrew`. Every other caller leaves this unset and
     * pins the bar itself.
     */
    home?: string;
    /** Whether the pin draws: `HomebrewPage` draws it only once the page is ready
     *  (docs/specs/FEATURES.md, "Homebrew"). */
    pin?: boolean;
    /** The page's primary actions; the caller's box takes `margin-left: auto`, so they end
     *  the row. */
    extra?: Snippet | undefined;
    /** The sibling pages' pills, drawn after the heading (DESIGN.md, "The Head Order Rule"). */
    nav?: Snippet | undefined;
    /** From 761 to 999 px the pills take the next row, after the primary. */
    navBelow?: boolean;
    /** The third level, under the head (the catalog's tabs). */
    below?: Snippet | undefined;
  }

  const {
    app,
    title,
    sub,
    help,
    home,
    pin = true,
    extra,
    nav,
    navBelow = false,
    below
  }: Props = $props();

  const t = $derived(app.t);
  const pinned = $derived(canonicalHash(home ?? app.hash));
  const on = $derived(app.home === pinned);

  let helpOpen = $state(false);

  /* The pills remount in the other place of the DOM across 1000 px; a focused pill keeps
     the focus by its index. */
  let row = $state<HTMLDivElement | undefined>(undefined);
  let keep = -1;
  const PILLS = '.headnav a, .headnav button';
  $effect.pre(() => {
    void navBelow;
    untrack(() => {
      const active = document.activeElement;
      keep = row && active ? [...row.querySelectorAll(PILLS)].indexOf(active) : -1;
    });
  });
  $effect(() => {
    void navBelow;
    untrack(() => {
      const at = keep;
      if (at < 0) return;
      keep = -1;
      void tick().then(() => {
        row?.querySelectorAll<HTMLElement>(PILLS)[at]?.focus();
      });
    });
  });
</script>

<!-- Keeps its own `.page-h`/`.page-sub` rather than `PageTitle.svelte`: this
     `h1` sits inside the `.page-head` flex row, before the pills, the home and help
     buttons, under the live `.page-head .page-h{margin:0}` (`git show 23c00a6^:style.css`) -
     hosting that in `PageTitle` would need a wrapper prop no other caller
     needs. -->
<div class="page-head" class:hasnav={nav} class:navbelow={nav && navBelow} bind:this={row}>
  <h1 class="page-h">{title}</h1>
  {#if nav && !navBelow}<div class="headnav">{@render nav()}</div>{/if}
  <!-- A 44px target: it sits in the heading row, and a mis-tap silently changes where
       the app opens. The pressed pin is the neutral pressed state (DESIGN.md,
       "Segmented control"), not gold. -->
  {#if pin}
    <button
      type="button"
      class="homebtn"
      class:on
      aria-pressed={on}
      onclick={() => {
        app.pinHome(home);
      }}
    >
      <Icon name={on ? 'check' : 'home'} />{on ? t.homeOn : t.homeHint}
    </button>
  {/if}
  {#if help}
    <HelpButton
      label={help.button}
      open={helpOpen}
      onclick={() => {
        helpOpen = !helpOpen;
      }}
    />
  {/if}
  {@render extra?.()}
  {#if nav && navBelow}<div class="headnav below">{@render nav()}</div>{/if}
</div>
{#if below}<div class="page-below">{@render below()}</div>{/if}
{#if sub}<p class="page-sub">{sub}</p>{/if}

{#if help && helpOpen}
  <HelpBox {help} />
{/if}

<style>
  /* off `.page-head`, `.page-h`, `.homebtn`, `.page-sub`, `.helpbtn` and
     `.helpbox` in style.css */
  .page-head {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 4px;
  }

  /* From 1000 px a head with pills is one row: the pills wrap inside their own box where
     the row is short (DESIGN.md, "The Head Order Rule"). */
  .page-head.hasnav:not(.navbelow) {
    flex-wrap: nowrap;
  }

  .page-h,
  .page-head > :global(.helpbtn) {
    flex: none;
  }

  .headnav {
    flex: 0 1 auto;
  }

  .headnav.below {
    flex: 1 0 100%;
  }

  /* The pills' row stands further from the lead (12 px) than from the title row (10 px).
     The head's 4 px bottom margin collapses into these. */
  .page-head.navbelow + .page-sub {
    margin-top: 12px;
  }

  /* 10 px: the head's row gap. */
  .page-below {
    margin-top: 10px;
  }

  .page-h {
    margin: 0;
    font-size: var(--t-page);
    font-weight: var(--h-page-weight);
    letter-spacing: var(--h-page-spacing);
  }

  .homebtn {
    height: 32px;
    flex: none;
    gap: 6px;
    padding: 0 12px 0 10px;
    border-radius: var(--r-sm);
    position: relative;
    border: 1px solid var(--line2);
    background: transparent;
    color: var(--muted2);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: 0.15s;
    vertical-align: middle;
    cursor: pointer;
    font: inherit;
    font-size: var(--t-data);
    font-weight: 600;
  }

  .homebtn:hover {
    border-color: var(--gold);
    color: var(--txt);
  }

  .homebtn.on {
    background: var(--surface2);
    border-color: var(--muted2);
    color: var(--txt);
  }

  .homebtn :global(svg) {
    width: 14px;
    height: 14px;
    fill: currentcolor;
  }

  .homebtn::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 44px;
    height: 44px;
    transform: translate(-50%, -50%);
  }

  .page-sub {
    margin: 0 0 18px;
    color: var(--muted);
    font-size: var(--t-small);
    /* A lead of one or two sentences takes one line while the column allows it (DESIGN.md,
       "The Measure Rule"). */
    max-width: var(--measure-line);
    text-wrap: balance;
  }
</style>
