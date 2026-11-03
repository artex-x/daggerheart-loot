<script lang="ts">
  /* The shared empty state: a dashed plate (DESIGN.md, "Shapes"). The catalog passes a
     heading and its kind glyph; every other caller draws the plate around its text. */
  import type { Snippet } from 'svelte';
  import ArtWell from './ArtWell.svelte';
  import type { IconName } from '../lib/icons.js';

  interface Props {
    /** The heading of the plate («Ничего не найдено»). */
    title?: string | undefined;
    /** The kind glyph in its art well, the plate's only picture. */
    glyph?: IconName | undefined;
    children: Snippet;
  }

  const { title, glyph, children }: Props = $props();
</script>

<div class="empty">
  {#if glyph}<span class="glyph"><ArtWell {glyph} /></span>{/if}
  {#if title}<p class="title">{title}</p>{/if}
  {@render children()}
</div>

<style>
  /* off `.empty` */
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 32px 16px;
    text-align: center;
    color: var(--muted2);
    border: 1px dashed var(--line2);
    border-radius: var(--r);
  }

  .glyph {
    width: 56px;
    height: 56px;
    border-radius: 8px;
    overflow: hidden;
  }

  .title {
    margin: 0 0 -8px;
    font-size: var(--t-body);
    font-weight: 650;
    color: var(--txt);
  }
</style>
