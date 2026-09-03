<script lang="ts">
  /* The heading of a roll page: its name, the two round buttons beside it, the
     line under it, and the explanation those buttons fold open.

     Extracted on the second use rather than designed: the roll panel and the
     Core rules panel had the same thirty lines and the same two hundred of
     style, and the alternate tables would have been a third copy. Both copies
     are gone; this is where the padding is decided now. */
  import Icon from './Icon.svelte';
  import { isBold, isBreak, isLink } from '../lib/help.js';
  import type { Help } from '../lib/help.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    title: string;
    sub: string;
    /** What this section explains about itself, where anything is written. */
    help: Help | null;
    /** How the page says something that has no place on screen. */
    say: (msg: string) => void;
  }

  const { app, title, sub, help, say }: Props = $props();

  const t = $derived(app.t);

  let helpOpen = $state(false);
</script>

<div class="page-head">
  <h1 class="page-h">{title}</h1>
  <!-- 26px of paint, 44px of target: it sits in the heading row and a mis-tap
       silently changes where the app opens. -->
  <button
    type="button"
    class="homebtn"
    class:on={app.isHome}
    title={app.isHome ? t.homeOn : t.homeHint}
    aria-label={app.isHome ? t.homeOn : t.homeHint}
    aria-pressed={app.isHome}
    onclick={() => {
      if (!app.toggleHome()) say(t.copyFailed);
    }}
  >
    <Icon name="home" />
  </button>
  {#if help}
    <button
      type="button"
      class="helpbtn"
      class:on={helpOpen}
      title={t.helpHint}
      aria-label={t.helpHint}
      aria-expanded={helpOpen}
      onclick={() => {
        helpOpen = !helpOpen;
      }}>?</button
    >
  {/if}
</div>
<p class="page-sub">{sub}</p>

{#if help && helpOpen}
  <div class="helpbox">
    {#each help.paragraphs as para, i (i)}
      <p>
        {#if para.lead}<b>{para.lead}</b
          >{/if}{#each para.parts as part, j (j)}{#if isLink(part)}<a
              href={part.href}
              target="_blank"
              rel="noopener">{part.label}</a
            >{:else if isBold(part)}<b>{part.b}</b>{:else if isBreak(part)}<br
            />{:else}{part}{/if}{/each}
      </p>
    {/each}
  </div>
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

  .helpbtn {
    flex: none;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 1px solid var(--line2);
    background: var(--surface);
    color: var(--muted);
    font: 700 14px/1 var(--mono);
    transition: 0.15s;
    position: relative;
    cursor: pointer;
  }

  .helpbtn:hover {
    border-color: var(--gold);
    color: var(--gold);
  }

  .helpbtn.on {
    background: var(--gold);
    border-color: var(--gold);
    color: #1a1206;
  }

  .helpbtn::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 44px;
    height: 44px;
    transform: translate(-50%, -50%);
  }

  .helpbox {
    margin: 0 0 22px;
    padding: 15px 17px;
    border-radius: var(--r);
    background: var(--surface);
    border: 1px solid var(--line2);
  }

  .helpbox p {
    margin: 0 0 11px;
    color: #cfc8e0;
    font-size: 13.5px;
    line-height: 1.6;
    max-width: 78ch;
  }

  .helpbox p:last-child {
    margin-bottom: 0;
  }

  .helpbox a {
    color: var(--gold-soft);
  }

  .helpbox b {
    color: var(--gold-soft);
    font-weight: 650;
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

    .helpbtn {
      width: 34px;
      height: 34px;
      font-size: 16px;
    }
  }
</style>
