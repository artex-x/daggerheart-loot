<script lang="ts">
  /* The item editor's print view: the print sheet's own card and fit, in one cell of
     the sheet's grid, at the printed size (docs/specs/FEATURES.md, "Homebrew" and
     "Print"). The card follows the draft `PREVIEW_FIT_MS` after the last change, so a
     burst of typing fits it once. */
  import { untrack } from 'svelte';
  import PrintCard from './PrintCard.svelte';
  import type { Index } from '../lib/data.js';
  import { PREVIEW_FIT_MS, setLineOf } from '../lib/print.js';
  import type { Lang, Record_ } from '../lib/types.js';

  interface Props {
    it: Record_;
    index: Index | null;
    lang: Lang;
    bw: boolean;
    compact: boolean;
    artBroken: boolean;
    onartfail: (id: string) => void;
    /** Told after each fit whether the card cuts off text. */
    onclipped: (clipped: boolean) => void;
  }

  const { it, index, lang, bw, compact, artBroken, onartfail, onclipped }: Props = $props();

  /* The first draw takes the draft and its index at once; a later change waits for the
     pause. The index moves with the item: the editor rebuilds it on every input, and a set
     member's set line read from the live index would re-fit the card per key. */
  let shown = $state.raw<{ it: Record_; index: Index | null }>(untrack(() => ({ it, index })));
  $effect(() => {
    const next = { it, index };
    const now = untrack(() => shown);
    if (next.it === now.it && next.index === now.index) return;
    const timer = setTimeout(() => {
      shown = next;
    }, PREVIEW_FIT_MS);
    return () => {
      clearTimeout(timer);
    };
  });
  const setLine = $derived(shown.index ? setLineOf(shown.index, shown.it, lang) : undefined);
</script>

<!-- A size change remounts the card, so `fit()` measures it at the size it prints. -->
<div class="pframe" class:compact>
  {#key compact}
    <PrintCard it={shown.it} {lang} {bw} {artBroken} {onartfail} {setLine} onfit={onclipped} />
  {/key}
</div>

<style>
  /* One cell of the sheet's grid: 63x88 mm, or 44x63 mm on the compact sheet
     (docs/specs/FEATURES.md, "Print"). No transform, zoom or scale here or on an
     ancestor: `fit()` compares layout sizes with rendered ones, and a scale moves only
     the second. */
  .pframe {
    display: grid;
    grid-template-columns: 63mm;
    grid-template-rows: 88mm;
    justify-content: center;
  }

  .pframe.compact {
    grid-template-columns: 44mm;
    grid-template-rows: 63mm;
  }

  .pframe > :global(.pcard) {
    box-shadow:
      0 0 0 1px rgb(0 0 0 / 50%),
      0 14px 40px rgb(0 0 0 / 45%);
  }
</style>
