<script lang="ts">
  /* The two print switches, colour and size, of the print bar and the item editor's
     print view. Both write the visit's pick on `AppState`, so a pick in one is the
     pick in the other; the default is the Display section's (docs/specs/FEATURES.md,
     "Print"). */
  import Seg from './Seg.svelte';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  const t = $derived(app.t);
  const ART = $derived([
    { value: 'color', label: t.printColor },
    { value: 'bw', label: t.printBW }
  ] as const);
  const SIZE = $derived([
    { value: 'std', label: t.printStd },
    { value: 'compact', label: t.printCompact }
  ] as const);
</script>

<Seg
  small
  options={ART}
  value={app.shownPrintBW ? 'bw' : 'color'}
  label={t.printTitle}
  onchange={(v: 'color' | 'bw') => {
    app.showPrintBW(v === 'bw');
  }}
/>
<Seg
  small
  options={SIZE}
  value={app.shownPrintCompact ? 'compact' : 'std'}
  label={t.printSize}
  onchange={(v: 'std' | 'compact') => {
    app.showPrintCompact(v === 'compact');
  }}
/>
