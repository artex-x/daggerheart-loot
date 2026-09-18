<script lang="ts">
  /* The "data did not load" line - the rewrite's own state, not a live one.
   *
   * `app.js:7` dereferences `window.LOOT.items` and throws, so with `data.js`
   * missing only `index.html`'s static shell draws; the live app has no
   * `.miss` rule and no such screen. Every rewrite page draws this instead
   * (`docs/specs/FEATURES.md`, "Records"), which is why the rule is a plain
   * invention rather than a port. Extracted from seven identical
   * copies (`ListPage`, `ListsPage`, `PrintPage`, `RecordPage`, `RollPanel`,
   * `SearchPage`, `TablesPage`) - `var(--muted)` because five of the seven
   * already used it and it is the live tone for `.page-sub`. */
  import type { Snippet } from 'svelte';

  const { children }: { children: Snippet } = $props();
</script>

<p class="miss">{@render children()}</p>

<style>
  .miss {
    margin: 0;
    color: var(--muted);
  }
</style>
