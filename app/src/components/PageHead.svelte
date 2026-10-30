<script lang="ts">
  /* The heading of a page: its name, the pin and the help beside it, the line under
     it, and the explanation the help folds open. From 761 px the two buttons carry
     their labels; up to 760 px they stay round with the same names until their page's
     batch moves them (DESIGN.md, "The Same Label Rule").

     Extracted on the second use rather than designed: the roll panel and the
     Core rules panel had the same thirty lines and the same two hundred of
     style, and the alternate tables would have been a third copy. Both copies
     are gone; this is where the padding is decided now. */
  import HelpBox from './HelpBox.svelte';
  import HelpButton from './HelpButton.svelte';
  import Icon from './Icon.svelte';
  import { canonicalHash } from '../lib/hash.js';
  import type { Help } from '../lib/help.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    title: string;
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
  }

  const { app, title, sub, help, home }: Props = $props();

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
  <!-- Round below 761 px: 26px of paint, 44px of target. It sits in the heading row
       and a mis-tap silently changes where the app opens. The pressed pin is the
       neutral pressed state (DESIGN.md, "Segmented control"), not gold. -->
  <button
    type="button"
    class="homebtn"
    class:on
    aria-pressed={on}
    onclick={() => {
      const wasHome = on;
      if (!app.toggleHome(home)) app.say((t) => t.saveFailed, { error: true });
      else app.say(wasHome ? (t) => t.homeReset : (t) => t.homeSet);
    }}
  >
    <Icon name={on ? 'check' : 'home'} /><span class="txt">{on ? t.homeOn : t.homeHint}</span>
  </button>
  {#if help}
    <HelpButton
      lang={app.lang}
      labeled
      open={helpOpen}
      onclick={() => {
        helpOpen = !helpOpen;
      }}
    />
  {/if}
</div>
<p class="page-sub">{sub}</p>

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
    width: 26px;
    height: 26px;
    flex: none;
    padding: 0;
    border-radius: 50%;
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

  /* The `.vh` rule of `styles/tokens.css` up to 760 px, where the label stays the name. */
  .txt {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (min-width: 761px) {
    .homebtn {
      width: auto;
      height: 32px;
      gap: 6px;
      padding: 0 12px 0 10px;
      border-radius: var(--r-sm);
      font: inherit;
      font-size: var(--t-data);
      font-weight: 600;
    }

    .txt {
      position: static;
      width: auto;
      height: auto;
      overflow: visible;
      clip-path: none;
    }
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
    max-width: 70ch;
  }

  @media (max-width: 600px) {
    .homebtn {
      width: 34px;
      height: 34px;
      font-size: var(--t-body);
    }

    .homebtn :global(svg) {
      width: 17px;
      height: 17px;
    }
  }
</style>
