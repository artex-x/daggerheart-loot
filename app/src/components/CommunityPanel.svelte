<script lang="ts">
  /* Community items: choose an origin, then roll a d10 inside it.

     Ten records per community, ordered by rarity - one is the plainest and ten
     the strongest - so the die is a real d10 and the number means something on
     its own. The communities come from the records rather than from a list
     written down twice; see lib/sections.ts. */
  import Chip from './Chip.svelte';
  import ChipRow from './ChipRow.svelte';
  import Field from './Field.svelte';
  import RollPanel from './RollPanel.svelte';
  import { communities, communityGroup, communityName } from '../lib/sections.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  const t = $derived(app.t);
  const all = $derived(app.index ? communities(app.index) : []);
  let chosen = $state('');
  /* The first one until somebody picks another, which is what the live app
     opens on. Held as a name rather than an index so it survives the list
     being rebuilt when the language changes. */
  const current = $derived(chosen || (all[0]?.id ?? ''));
  const rows = $derived(app.index && current ? communityGroup(app.index, current) : []);
</script>

<RollPanel
  {app}
  section="community"
  title={t.pageCommunity}
  sub={t.subCommunity}
  {rows}
  pickerValue={current}
>
  {#snippet picker()}
    <Field label={t.communityLabel}>
      <ChipRow>
        {#each all as c (c.id)}
          <Chip
            label={communityName(c, app.lang)}
            on={c.id === current}
            onclick={() => {
              chosen = c.id;
            }}
          />
        {/each}
      </ChipRow>
    </Field>
  {/snippet}
</RollPanel>
