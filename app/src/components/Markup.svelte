<script lang="ts">
  /* Formatted text as card blocks (lib/markup.ts): a paragraph per line, a list,
     a numbered list, a table. The list and table rules are global under `mdtext`, a class
     each caller puts on its wrapper; the caller keeps its font, colour and box. The
     image review page reads these rules too (tools/artwork/lib.test.mjs, `CARD_FILES`). */
  import MarkupInline from './MarkupInline.svelte';
  import { afterLead, type MarkupBlock } from '../lib/markup.js';
  import type { Snippet } from 'svelte';

  interface Props {
    blocks: readonly MarkupBlock[];
    /** Drawn at the head of the first paragraph, then a space: a set bonus's name. */
    lead?: Snippet | undefined;
  }

  const { blocks, lead }: Props = $props();
</script>

<!-- eslint-disable @typescript-eslint/no-confusing-void-expression -- a `{@render}` tag reads
     as a void expression to this rule. -->
<!-- prettier-ignore -->
{#if lead && blocks[0]?.t !== 'p'}<p>{@render lead()}</p>{/if}{#each blocks as b, i (i)}{#if b.t === 'p'}<p
    >
      {#if lead && i === 0}{@render lead()}<MarkupInline
          c={afterLead(b.c)}
        />{:else}<MarkupInline c={b.c} />{/if}
    </p>{:else if b.t === 'ul'}<ul>
      {#each b.items as item, j (j)}<li><MarkupInline c={item} /></li>{/each}
    </ul>{:else if b.t === 'ol'}<ol start={b.start}>
      {#each b.items as item, j (j)}<li><MarkupInline c={item} /></li>{/each}
    </ol>{:else}<table>
      <thead
        ><tr
          >{#each b.head as cell, j (j)}<th scope="col"><MarkupInline c={cell} /></th
            >{/each}</tr
        ></thead
      ><tbody
        >{#each b.rows as row, j (j)}<tr
            >{#each row as cell, k (k)}<td><MarkupInline c={cell} /></td>{/each}</tr
          >{/each}</tbody
      >
    </table>{/if}{/each}

<style>
  :global(.mdtext p) {
    margin: 0;
  }

  /* off `.dlist` in style.css. The values are the live ones, not a tidier
     equivalent: 1.2em of padding read the same and cost four pixels a row on
     the Vault of Ages cards, which are the ones with long lists. */
  :global(.mdtext :is(ul, ol)) {
    margin: 4px 0 0;
    padding-left: 18px;
  }

  :global(.mdtext li) {
    margin: 1px 0;
  }

  /* A table never grows wider than its box: fixed columns, words broken anywhere. */
  :global(.mdtext table) {
    table-layout: fixed;
    width: 100%;
    margin: 4px 0 0;
    border-collapse: collapse;
    overflow-wrap: anywhere;
  }

  :global(.mdtext :is(th, td)) {
    border: 1px solid var(--line);
    padding: 0 var(--gap-sm);
    text-align: left;
    vertical-align: top;
  }
</style>
