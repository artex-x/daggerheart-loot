<script lang="ts">
  /* The heading pair every non-`PageHead` page draws - off `.page-h`
   * (style.css:105) and `.page-sub` (style.css:140).
   *
   * Extracted from eight identical pairs across `ListPage`,
   * `PrintPage`, `RecordPage` and `SharedListPage` (two each). `PageHead`
   * keeps its own copy: its `h1` sits inside a flex row with the home and
   * help buttons between it and the sub, under the live app's own
   * `.page-head .page-h{margin:0}` (style.css:104) - hosting that here would
   * need a wrapper prop no other caller uses. Both props take a plain
   * string or a snippet: `ListPage`'s
   * title is the rename input, `RecordPage`'s sub is today's whole `<p>`
   * body. */
  import type { Snippet } from 'svelte';

  interface Props {
    title: string | Snippet;
    sub: string | Snippet;
  }

  const { title, sub }: Props = $props();
</script>

<!-- Each branch is a whole element, not a conditional inside one: Svelte's
     `{#if}` needs an anchor comment to track which branch is live, and
     nesting the check inside `<h1>`/`<p>` would land that comment as a
     child of the element, turning a plain-string caller's one text node
     into two - `sharedListPage.test.ts` caught it. Branching outside the
     element keeps the anchor a sibling instead. -->
{#if typeof title === 'string'}
  <h1 class="page-h">{title}</h1>
{:else}
  <h1 class="page-h">{@render title()}</h1>
{/if}
{#if typeof sub === 'string'}
  <p class="page-sub">{sub}</p>
{:else}
  <p class="page-sub">{@render sub()}</p>
{/if}

<style>
  /* off `.page-h` (style.css:105), the tokens every caller already used */
  .page-h {
    margin: 0 0 4px;
    font-size: var(--h-page-size);
    font-weight: var(--h-page-weight);
    letter-spacing: var(--h-page-spacing);
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  /* off `.page-sub` (style.css:140) */
  .page-sub {
    margin: 0 0 18px;
    color: var(--muted);
    font-size: 14px;
    max-width: 70ch;
  }
</style>
