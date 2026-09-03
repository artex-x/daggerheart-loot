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
  }

  const { label, title, oncopy }: Props = $props();
</script>

<div class="tsec-head">
  <span class="lbl">{label}</span>
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
    margin-bottom: 8px;
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
