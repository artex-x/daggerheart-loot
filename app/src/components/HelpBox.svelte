<script lang="ts">
  /* The box a `HelpButton` folds open - off `.helpbox` in style.css and the
   * paragraph renderer `PageHead.svelte` carried before this extraction.
   *
   * Extracted on its second use: the page-level help panel and the money
   * picker's own box (`ListPage.svelte`) draw the same shape, the
   * second one narrower and in a different slot - hence `class`. */
  import DialogClose from './DialogClose.svelte';
  import { isBold, isLink } from '../lib/help.js';
  import type { Help } from '../lib/help.js';

  interface Props {
    help: Help;
    /** An extra class on the root, for a caller that needs a different slot
     *  rule reaching in - `.money > :global(.money-help)` on the money
     *  picker's box. */
    class?: string;
    /** «Закрыть» in the box: a panel opened from a menu item, whose opener is gone. */
    close?: { label: string; onclose: () => void } | undefined;
  }

  const { help, class: extraClass, close }: Props = $props();
</script>

<div class={extraClass ? `helpbox ${extraClass}` : 'helpbox'}>
  {#if close}
    <div class="helpbox-x"><DialogClose label={close.label} onclick={close.onclose} /></div>
  {/if}
  {#each help.paragraphs as para, i (i)}
    <p>
      {#if para.lead}<b>{para.lead}</b
        >{/if}{#each para.parts as part, j (j)}{#if isLink(part)}<a
            href={part.href}
            target="_blank"
            rel="noopener">{part.label}</a
          >{:else if isBold(part)}<b>{part.b}</b>{:else}{part}{/if}{/each}
    </p>
  {/each}
</div>

<style>
  /* off `.helpbox` in style.css */
  .helpbox {
    margin: 0 0 22px;
    padding: 15px 17px;
    border-radius: var(--r);
    background: var(--surface);
    border: 1px solid var(--line2);
    /* As wide as its text: a box that holds only a passage (DESIGN.md, "The Measure Rule"). */
    width: fit-content;
    max-width: 100%;
    /* The panel folds open the same way the card and the modal do. The port
       had dropped this one line, and it is not only motion: an element that
       animates a transform is painted through its own layer, and the layer
       snaps the text to a different set of pixels. Every line box in here
       measures identical in the two apps to three decimals - it was the lines
       whose top lands on a .5-.8 fraction that came out one pixel apart,
       which is a paint difference, not a layout one. Left in the reduced-motion
       block deliberately: style.css turns off `.card`'s animation there and
       nothing else's. */
    animation: pop 0.2s cubic-bezier(0.2, 0.8, 0.3, 1) both;
  }

  @keyframes pop {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.985);
    }

    to {
      opacity: 1;
      transform: none;
    }
  }

  /* Above the text, at its end, so it never covers a line. */
  .helpbox-x {
    display: flex;
    justify-content: flex-end;
    margin: -6px -8px 6px 0;
  }

  .helpbox p {
    margin: 0 0 11px;
    color: var(--txt-soft);
    font-size: var(--t-small);
    line-height: 1.6;
    max-width: var(--measure-text);
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
</style>
