<script lang="ts">
  /* The shared card-actions row - off `.card-acts` in style.css (405).
   *
   * Extracted in B10: `RecordCard`, `ListPage`, `PrintPage` and
   * `SharedListPage` each carried an identical copy of these six
   * declarations. The live app writes each caller's own margin as an inline
   * `style=` attribute, never a rule (`app.js` 2972, 3154) - so this
   * component takes `style?: string` and emits it the same way, rather than
   * folding a caller's margin into a rule of its own (plan.md, "B10
   * planned", decided 2). */
  import type { Snippet } from 'svelte';

  const { children, style }: { children: Snippet; style?: string } = $props();
</script>

<div class="card-acts" {style}>{@render children()}</div>

<style>
  /* off `.card-acts` in style.css */
  .card-acts {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
    margin-top: auto;
    padding-top: 3px;
  }
</style>
