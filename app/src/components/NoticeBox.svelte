<script lang="ts">
  /* The warning box (docs/specs/FEATURES.md, rule 19): the editor's conflict and gone
     banners and the two print clip warnings. The caller places it. It has no
     `role="status"`: a box inserted with its text is not said, so a page that shows it
     while open says its fact through `StatusRegion`. */
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    actions?: Snippet | undefined;
  }

  const { children, actions }: Props = $props();
</script>

<!-- `warn` stays a static class: the browser suites and two unit files find the box by
     `.box.warn`. -->
<div class="box warn">
  <div class="lead">{@render children()}</div>
  {#if actions}{@render actions()}{/if}
</div>

<style>
  .box {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
    padding: 11px 14px;
    border: 1px solid var(--warn-line);
    border-radius: var(--r-sm);
    background: var(--warn-bg);
    color: var(--warn-text);
    font-size: var(--t-data);
    line-height: 1.5;
  }

  .lead {
    flex: 1 1 320px;
    min-width: 0;
  }
</style>
