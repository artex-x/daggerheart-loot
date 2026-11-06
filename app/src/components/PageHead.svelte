<script lang="ts">
  /* The heading of a page: its name, the pin and the help beside it, the line under
     it, and the explanation the help folds open. The two buttons carry their labels;
     up to 760 px every page draws them in its «Ещё» instead (DESIGN.md, "The Same
     Label Rule").

     Extracted on the second use rather than designed: the roll panel and the
     Core rules panel had the same thirty lines and the same two hundred of
     style, and the alternate tables would have been a third copy. Both copies
     are gone; this is where the padding is decided now. */
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
    /** More of the heading row after the help (the catalog's group chips). */
    extra?: Snippet | undefined;
  }

  const { app, title, sub, help, home, pin = true, extra }: Props = $props();

  const t = $derived(app.t);
  const pinned = $derived(canonicalHash(home ?? app.hash));
  const on = $derived(app.home === pinned);

  let helpOpen = $state(false);
</script>

<!-- Keeps its own `.page-h`/`.page-sub` rather than `PageTitle.svelte`: this
     `h1` sits inside the `.page-head` flex row, between the home and help
     buttons, under the live `.page-head .page-h{margin:0}` (`git show 23c00a6^:style.css`) -
     hosting that in `PageTitle` would need a wrapper prop no other caller
     needs. -->
<div class="page-head">
  <h1 class="page-h">{title}</h1>
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
</div>
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
