<script lang="ts">
  /* The shared empty state - off `.empty` in style.css.
   *
   * Second real use: the tables screen's two "nothing found" branches already
   * carried their own copy of the rule, and the lists index's "no lists yet"
   * needs the same box. Extracted here per the campsite rule - on the second
   * use, both inline copies go. */
  import type { Snippet } from 'svelte';

  const { children }: { children: Snippet } = $props();
</script>

<div class="empty">{@render children()}</div>

<style>
  /* off `.empty` */
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 40px 0;
    text-align: center;
    color: var(--muted2);
  }
</style>
