<script lang="ts">
  /* The shared empty state: a plate with a seam border on the Vault Wall ground (DESIGN.md,
     "Empty state"), `--gap-plate` under the block above it. The catalog passes a
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
    border: 1px solid var(--line);
    background: var(--bg2);
    border-radius: var(--r);
    margin-top: var(--gap-plate);
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
