<script lang="ts">
  /* The supplements panel: one chip per supplement roll section, under the
     heading of each of them. The header has one tab for all six (`TabBar.svelte`),
     so this row is how a reader moves between them. Each chip reads its source's
     product name, with a short form under 640 px where `CHIP_SHORT` gives one. */
  import Chip from './Chip.svelte';
  import ChipRow from './ChipRow.svelte';
  import Panel from './Panel.svelte';
  import { SECTION_LABEL } from '../lib/dict.js';
  import { sectionHash } from '../lib/hash.js';
  import { SUPPLEMENTS } from '../lib/nav.js';
  import { CHIP_SHORT } from '../lib/tables.js';
  import type { TableId } from '../lib/types.js';
  import type { AppState } from '../state/app.svelte.js';

  const { app }: { app: AppState } = $props();

  const t = $derived(app.t);
  /* `SUPPLEMENTS` entries are `roll/<table id>` (nav.test.ts). */
  const shortOf = (s: string): string | undefined => {
    const key = CHIP_SHORT[s.slice(5) as TableId];
    return key ? t[key] : undefined;
  };
</script>

<Panel style="margin-bottom: 16px">
  <nav aria-label={t.grpSupplements}>
    <ChipRow>
      {#each SUPPLEMENTS as s (s)}
        <Chip
          href={app.href(sectionHash(s))}
          label={t[SECTION_LABEL[s]]}
          short={shortOf(s)}
          on={s === app.section}
        />
      {/each}
    </ChipRow>
  </nav>
</Panel>
