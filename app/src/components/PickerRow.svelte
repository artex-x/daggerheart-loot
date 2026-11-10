<script lang="ts">
  /* The first row of a page up to 760 px: the picker that names the page, the page's own
     tools, «Ещё» last (docs/specs/FEATURES.md, "Tables and search"). The roll pages, the
     tables and «Мои предметы» share it. */
  import type { Snippet } from 'svelte';

  const { children }: { children: Snippet } = $props();
</script>

<div class="pickrow">{@render children()}</div>

<style>
  /* Positioned: the row anchors the menu of «Ещё» (`MoreMenu`). */
  .pickrow {
    position: relative;
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 6px;
  }

  /* The row sits 8 px under the header on every page that draws it, 18 px above the tables'
     old place, so the roll pages keep their first result on the first screen (DESIGN.md,
     "The Head Order Rule"). */
  :global(#main:has(> .pickrow)) {
    padding-top: 8px;
  }

  .pickrow :global(.btn.sm) {
    flex: none;
    height: 40px;
  }

  .pickrow :global(.morewrap) {
    flex: none;
  }

  .pickrow :global(.morewrap .btn.sm) {
    height: 40px;
  }

  /* Up to 600 px the 42 px switch track of the tables takes its 2 px from this margin
     (DESIGN.md, "The First-Screen Rule"). */
  @media (max-width: 600px) {
    .pickrow {
      margin-bottom: 4px;
    }
  }
</style>
