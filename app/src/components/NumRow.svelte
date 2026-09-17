<script lang="ts">
  /* The row a number field shares with its roll button (and sometimes a
     second button beside it) - off `.numrow` in style.css.
     Extracted on its fifth use: `AltPanel`, `RollPanel`, `StdPanel` and
     `ListPage` each carried the same four declarations; `ListsPage` reused
     the class name for an unrelated row (its own `.grow` child, not moved
     here - see that component's own styles). */
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  const { children }: Props = $props();
</script>

<div class="numrow">
  {@render children()}
</div>

<style>
  /* off `.numrow` in style.css */
  .numrow {
    display: flex;
    gap: 10px;
    align-items: stretch;
    flex-wrap: wrap;
  }
</style>
