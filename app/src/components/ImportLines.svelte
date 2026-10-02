<script lang="ts">
  /* The lines of an import report, the first ten (or `shown`) and then «...и ещё N»: the lists import's
     and the homebrew import's, extracted on its second use (docs/specs/FEATURES.md,
     "Lists" and "Homebrew"). The colour of the code comes from the caller's box. */
  import type { ReportLine as Line } from '../lib/types.js';

  interface Props {
    lines: readonly Line[];
    /** The text past the first ten, for the count of the rest. */
    more: (n: number) => string;
    /** A class on every line (the lists preview's muted skips). */
    cls?: string | undefined;
    /** How many lines are drawn before the count. */
    shown?: number;
  }

  const { lines, more, cls, shown = 10 }: Props = $props();
</script>

<!-- A `{@render}` tag reads as a void expression to this rule wherever it sits among text. -->
<!-- eslint-disable @typescript-eslint/no-confusing-void-expression -->
{#snippet lineOf(
  l: Line
)}{#if l.pos}{l.pos}{#if l.name || l.item},&#32;{#if l.name && l.item}{l.name}&#32;(<code
          >{l.item}</code
        >){:else if l.item}<code>{l.item}</code
        >{:else}{l.name}{/if}{/if}:&#32;{/if}{l.text}{l.path ? ' ' : ''}{#if l.path}<code
      >{l.path}</code
    >{/if}{/snippet}

<ul>
  {#each lines.slice(0, shown) as l, i (i)}
    <li class={cls}>{@render lineOf(l)}</li>
  {/each}
  {#if lines.length > shown}
    <li class={cls}>{more(lines.length - shown)}</li>
  {/if}
</ul>

<!-- eslint-enable @typescript-eslint/no-confusing-void-expression -->

<style>
  ul {
    margin: 4px 0 0;
    padding-left: 18px;
  }

  code {
    font: 12px/1.4 var(--mono);
  }
</style>
