<script lang="ts">
  /* One folded print vector, drawn inline from its exported geometry
     (`lib/cardVectors.ts`) and coloured by `styles/card-vectors.css`: each paint slot is a
     gradient whose two stops read the slot's custom properties, so the colour and the
     black-and-white card draw one shape with their own paints (docs/specs/FEATURES.md,
     "Print"). The gradient ids come from `$props.id()`: unique per card on a 180-card
     sheet. `data-vector` and `data-paint` name what is drawn for the browser suites. */
  import {
    CARD_VECTORS,
    lineOf,
    type VectorName,
    type VectorPaint
  } from '../lib/cardVectors.js';

  interface Props {
    /** The shape, by the file name its colour layout exports (`banner`, `die-d8`). */
    shape: VectorName;
    paint: VectorPaint;
    class?: string | undefined;
  }

  const { shape, paint, class: cls }: Props = $props();

  const uid = $props.id();
  const art = $derived(CARD_VECTORS[shape]);
  const slots = $derived(
    (['fill', 'stroke'] as const).filter((s) => art.paths.some((p) => p[s] === s))
  );
  /* The six dice share one paint per layout, as their files do. */
  const paintOf = $derived(shape.startsWith('die-') ? 'die' : shape);
  const vars = (slot: string): [string, string] => [
    `stop-color: var(--pv-${paintOf}-${slot}-0)`,
    `stop-color: var(--pv-${paintOf}-${slot}-1)`
  ];
</script>

<svg
  class={cls}
  viewBox={art.viewBox}
  preserveAspectRatio={art.stretch ? 'none' : undefined}
  fill="none"
  aria-hidden="true"
  focusable="false"
  data-vector={shape}
  data-paint={paint}
>
  <defs>
    {#each slots as slot (slot)}
      {@const line = lineOf(art, paint, slot)}
      {@const [from, to] = vars(slot)}
      <linearGradient
        id="{uid}-{slot}"
        x1={line.x1}
        y1={line.y1}
        x2={line.x2}
        y2={line.y2}
        gradientUnits={line.box ? 'objectBoundingBox' : 'userSpaceOnUse'}
        ><stop style={from} /><stop offset="1" style={to} /></linearGradient
      >
    {/each}
  </defs>
  {#each art.paths as p, i (i)}
    <path
      d={p.d}
      fill={p.fill ? `url(#${uid}-fill)` : undefined}
      stroke={p.stroke ? `url(#${uid}-stroke)` : undefined}
      stroke-width={p.width}
      stroke-linecap={p.cap}
      stroke-linejoin={p.join}
    />
  {/each}
</svg>
