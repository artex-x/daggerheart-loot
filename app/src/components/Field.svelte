<script lang="ts">
  /* A labelled row inside a panel, off `.field` and `.lbl` in style.css.

     Extracted because four places want it: the number row on every roll page,
     and the section, source, kind and rarity rows of the four modes. The label
     is the small uppercase caption, and what it labels is whatever is inside. */
  import type { Snippet } from 'svelte';

  interface Props {
    label: string;
    children: Snippet;
  }

  const { label, children }: Props = $props();
</script>

<div class="field">
  <span class="lbl">{label}</span>
  {@render children()}
</div>

<style>
  /* off `.field` and `.lbl` in style.css. The last-child rule is the live app's
     and it is what keeps a one-field panel from carrying a trailing gap. */
  .field {
    margin-bottom: 16px;
  }

  .field:last-child {
    margin-bottom: 0;
  }

  .lbl {
    display: block;
    font-size: 11.5px;
    font-weight: 650;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted2);
    margin-bottom: 8px;
  }
</style>
