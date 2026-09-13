<script lang="ts">
  /* The heading of a roll page: its name, the two round buttons beside it, the
     line under it, and the explanation those buttons fold open.

     Extracted on the second use rather than designed: the roll panel and the
     Core rules panel had the same thirty lines and the same two hundred of
     style, and the alternate tables would have been a third copy. Both copies
     are gone; this is where the padding is decided now. */
  import HelpBox from './HelpBox.svelte';
  import HelpButton from './HelpButton.svelte';
  import Icon from './Icon.svelte';
  import type { Help } from '../lib/help.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    title: string;
    sub: string;
    /** What this section explains about itself, where anything is written. */
    help: Help | null;
    /** How the page says something that has no place on screen - the toast,
     *  off `toast`/`showToast` in app.js. */
    say: (msg: string, error?: boolean) => void;
    /**
     * The address this page is really showing, where it differs from the
     * address bar - only `TablesPage` passes this: a bare `#/tables` still
     * shows a named table underneath, which `AppState` cannot see on its own
     * (`app.svelte.ts`'s `toggleHome`). Every other caller leaves this unset
     * and pins the bar itself, exactly as before.
     */
    home?: string;
  }

  const { app, title, sub, help, say, home }: Props = $props();

  const t = $derived(app.t);
  const pinned = $derived(home ?? app.hash);
  const on = $derived(app.home === pinned);

  let helpOpen = $state(false);
</script>

<!-- Keeps its own `.page-h`/`.page-sub` rather than `PageTitle.svelte`: this
     `h1` sits inside the `.page-head` flex row, between the home and help
     buttons, under the live `.page-head .page-h{margin:0}` (style.css:104) -
     hosting that in `PageTitle` would need a wrapper prop no other caller
     needs (plan.md, "B10 planned", decided 1). -->
<div class="page-head">
  <h1 class="page-h">{title}</h1>
  <!-- 26px of paint, 44px of target: it sits in the heading row and a mis-tap
       silently changes where the app opens. -->
  <button
    type="button"
    class="homebtn"
    class:on
    title={on ? t.homeOn : t.homeHint}
    aria-label={on ? t.homeOn : t.homeHint}
    aria-pressed={on}
    onclick={() => {
      const wasHome = on;
      if (!app.toggleHome(home)) say(t.saveFailed, true);
      else say(wasHome ? t.homeReset : t.homeSet);
    }}
  >
    <Icon name="home" />
  </button>
  {#if help}
    <HelpButton
      lang={app.lang}
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
    font-size: var(--h-page-size);
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
    color: var(--gold-soft);
  }

  .homebtn.on {
    background: var(--gold);
    border-color: var(--gold);
    color: #1a1206;
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
    font-size: 14px;
    max-width: 70ch;
  }

  @media (max-width: 600px) {
    .homebtn {
      width: 34px;
      height: 34px;
      font-size: 16px;
    }

    .homebtn :global(svg) {
      width: 17px;
      height: 17px;
    }
  }
</style>
