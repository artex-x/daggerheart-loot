<script lang="ts">
  /* The shared panel box - off `.panel` in `git show 23c00a6^:style.css`.
   *
   * Extracted because `AltPanel`, `StdPanel`, `RollPanel`, `ListsPage` and
   * `SearchPage` each carried an identical copy of these five declarations.
   * `TablesPage`'s `.tablenav`, `FilterBar`'s `.ffilter` and `ListPage`'s
   * `<details class="panel lroll">` stay inline: each is the base rule plus a
   * variant margin or element the parent owns, and Svelte scopes a parent's
   * rule to the parent's own elements - giving this component a `class` prop
   * would make all three variants `:global()`, which is worse than three
   * five-line copies. */
  import type { Snippet } from 'svelte';

  /* `primary` marks the page's primary content (DESIGN.md, "The First-Screen Rule"). */
  const {
    children,
    style,
    primary = false
  }: { children: Snippet; style?: string; primary?: boolean } = $props();
</script>

<div class="panel" {style} data-primary={primary ? '' : undefined}>{@render children()}</div>

<style>
  /* off `.panel` in style.css */
  .panel {
    background: linear-gradient(180deg, var(--surface2), var(--surface));
    border: 1px solid var(--line);
    border-radius: var(--r);
    padding: 18px;
    box-shadow: var(--shadow);
  }
</style>
