<script lang="ts">
  /* The item editor's print view: the print sheet's own card and fit, in one cell of
     the sheet's grid, drawn at the preview column's width, at most 420 px
     (docs/specs/FEATURES.md, "Homebrew" and "Print"). The card follows the draft
     `PREVIEW_FIT_MS` after the last change, so a burst of typing fits it once. */
  import { untrack } from 'svelte';
  import PrintCard from './PrintCard.svelte';
  import type { Index } from '../lib/data.js';
  import { PREVIEW_FIT_MS, previewScale, setLineOf } from '../lib/print.js';
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
     pause. The index moves with the item: the editor rebuilds it on every input but the
     description's, and a set member's set line read from the live index would re-fit the
     card per key. */
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

  let width = $state(0);
  const scale = $derived(previewScale(width, compact));
</script>

<!-- A size or scale change remounts the card, so `fit()` measures it at the size it is
     drawn. -->
<div class="pwrap" bind:clientWidth={width}>
  <div class="pframe" class:compact style:--pv-scale={scale}>
    {#key `${String(compact)}:${String(scale)}`}
      <PrintCard
        it={shown.it}
        {lang}
        {bw}
        {artBroken}
        {onartfail}
        {setLine}
        {scale}
        onfit={onclipped}
      />
    {/key}
  </div>
</div>

<style>
  /* One cell of the sheet's grid: 63x88 mm, or 44x63 mm on the compact sheet
     (docs/specs/FEATURES.md, "Print"), times the preview's scale. No transform, zoom or
     scale here or on an ancestor (the print sheet's screen scale is the one transform the
     fit divides out: `screenScale`): `fit()` compares layout sizes with rendered ones, and
     a transform moves only the second; the card multiplies its own mm and pt values. */
  .pframe {
    display: grid;
    grid-template-columns: calc(63mm * var(--pv-scale, 1));
    grid-template-rows: calc(88mm * var(--pv-scale, 1));
    justify-content: center;
  }

  .pframe.compact {
    grid-template-columns: calc(44mm * var(--pv-scale, 1));
    grid-template-rows: calc(63mm * var(--pv-scale, 1));
  }

  .pframe > :global(.pcard) {
    box-shadow:
      0 0 0 1px rgb(0 0 0 / 50%),
      0 14px 40px rgb(0 0 0 / 45%);
  }
</style>
