<script lang="ts">
  /* The supplements panel: one chip per supplement roll section, under the
     heading of each of them. The header has one tab for all six (`TabBar.svelte`),
     so this row is how a reader moves between them. Each chip reads its section's
     own word, the one the header tab used to carry. */
  import Chip from './Chip.svelte';
  import ChipRow from './ChipRow.svelte';
  import Panel from './Panel.svelte';
  import { SECTION_LABEL } from '../lib/dict.js';
  import { sectionHash } from '../lib/hash.js';
  import { SUPPLEMENTS } from '../lib/nav.js';
  import type { AppState } from '../state/app.svelte.js';

  const { app }: { app: AppState } = $props();

  const t = $derived(app.t);
</script>

<Panel style="margin-bottom: 16px">
  <nav aria-label={t.grpSupplements}>
    <ChipRow>
      {#each SUPPLEMENTS as s (s)}
        <Chip href={sectionHash(s)} label={t[SECTION_LABEL[s]]} on={s === app.section} />
      {/each}
    </ChipRow>
  </nav>
</Panel>
