<script lang="ts">
  /* A `.tsection`'s own heading: a label and a button that copies a direct
     link to it. Off `sectionHead()` in app.js - the table-link button's
     sibling, one level down, and used identically by every sectioned body
     (tier, frame, community, and each alternate-table rarity). */
  import Icon from './Icon.svelte';

  interface Props {
    label: string;
    title: string;
    oncopy: () => void;
    /** The alternate tables follow this label with their own
     *  `<h3 class="altcol">` column pair, which used to sit straight under
     *  the page's `<h1>` with nothing between - a two-level jump `axe`'s
     *  `heading-order` rule caught. Every other caller leaves this unset and
     *  keeps the plain label: none of them has a heading following it, so
     *  there is no sequence to complete. */
    heading?: 2 | 3;
  }

  const { label, title, oncopy, heading }: Props = $props();

  /* A lookup rather than `'h' + String(heading)` (which
     widened to `string`, dropping the tag name out of the literal union
     `svelte:element` wants checked) or a ternary (which would be a branch
     `heading === 3` is never given to exercise, in production or in a
     test - see the prop's own doc comment above). A lookup is neither: one
     computed property read, no branch to leave half-covered. */
  const HEADING_TAG: Record<2 | 3, 'h2' | 'h3'> = { 2: 'h2', 3: 'h3' };
</script>

<div class="tsec-head">
  {#if heading}
    <svelte:element this={HEADING_TAG[heading]} class="lbl">{label}</svelte:element>
  {:else}
    <span class="lbl">{label}</span>
  {/if}
  <button type="button" class="tsec-link" {title} aria-label={title} onclick={oncopy}>
    <Icon name="link" />
  </button>
</div>

<style>
  /* off `.tsec-head` and `.tsec-link` in style.css:527-534 */
  .tsec-head {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .tsec-head .lbl {
    /* Zeroes a heading element's own default top/bottom margin too - the
       heading prop's `<h2>`/`<h3>` need to read exactly like the plain `<span>` every other
       caller still gets. */
    margin: 0 0 8px;
  }

  .tsec-link {
    border: 0;
    background: transparent;
    color: var(--muted2);
    padding: 3px;
    border-radius: 6px;
    line-height: 0;
    margin-bottom: 8px;
    transition: 0.15s;
  }

  .tsec-link:hover {
    color: var(--gold);
    background: var(--surface);
  }

  .tsec-link :global(svg) {
    width: 14px;
    height: 14px;
    fill: currentColor;
  }

  .lbl {
    display: block;
    font-size: 11.5px;
    font-weight: 650;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted2);
  }

  /* off the mobile block in style.css: a bare icon button was ~20px, too
     small to hit reliably, so it grows on a phone rather than staying the
     size a mouse pointer is fine with. */
  @media (max-width: 600px) {
    .tsec-link {
      padding: 11px;
      margin-bottom: 2px;
    }
  }
</style>
