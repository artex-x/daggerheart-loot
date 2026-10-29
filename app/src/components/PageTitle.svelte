<script lang="ts">
  /* The heading pair every non-`PageHead` page draws - off `.page-h`
   * (`git show 23c00a6^:style.css`) and `.page-sub` (`git show 23c00a6^:style.css`).
   *
   * Extracted from eight identical pairs across `ListPage`,
   * `PrintPage`, `RecordPage` and `SharedListPage` (two each). `PageHead`
   * keeps its own copy: its `h1` sits inside a flex row with the home and
   * help buttons between it and the sub, under the live app's own
   * `.page-head .page-h{margin:0}` (`git show 23c00a6^:style.css`) - hosting that here would
   * need a wrapper prop no other caller uses. Both props take a plain
   * string or a snippet: `ListPage`'s
   * title is the rename input, `RecordPage`'s sub is today's whole `<p>`
   * body. */
  import type { Snippet } from 'svelte';

  interface Props {
    title: string | Snippet;
    /** None where a load line under the heading says it all. */
    sub?: string | Snippet;
    /** The id of the element that names the heading, where its content would name it
     *  twice. */
    labelledby?: string | undefined;
  }

  const { title, sub, labelledby }: Props = $props();
</script>

<!-- Each branch is a whole element, not a conditional inside one: Svelte's
     `{#if}` needs an anchor comment to track which branch is live, and
     nesting the check inside `<h1>`/`<p>` would land that comment as a
     child of the element, turning a plain-string caller's one text node
     into two - `sharedListPage.test.ts` caught it. Branching outside the
     element keeps the anchor a sibling instead. -->
{#if typeof title === 'string'}
  <h1 class="page-h" aria-labelledby={labelledby}>{title}</h1>
{:else}
  <h1 class="page-h" aria-labelledby={labelledby}>{@render title()}</h1>
{/if}
{#if typeof sub === 'string'}
  <p class="page-sub">{sub}</p>
{:else if sub}
  <p class="page-sub">{@render sub()}</p>
{/if}

<style>
  /* off `.page-h` (`git show 23c00a6^:style.css`), the tokens every caller already used */
  .page-h {
    margin: 0 0 4px;
    font-size: var(--t-page);
    font-weight: var(--h-page-weight);
    letter-spacing: var(--h-page-spacing);
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    overflow-wrap: anywhere;
  }

  /* off `.page-sub` (`git show 23c00a6^:style.css`) */
  .page-sub {
    margin: 0 0 18px;
    color: var(--muted);
    font-size: var(--t-small);
    max-width: 70ch;
    overflow-wrap: anywhere;
  }
</style>
