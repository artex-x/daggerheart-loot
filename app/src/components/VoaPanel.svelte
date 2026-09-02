<script lang="ts">
  /* Vault of Ages: choose a division of the book, then roll inside it.

     The book has no roll table of its own, so its six divisions are the choice
     - four tiers, then artifacts and cursed objects, which are categories
     rather than tiers. Rolling across all of them would put a tier 1 reward and
     an artifact on one die, and they are not rewards of the same weight. */
  import Chip from './Chip.svelte';
  import ChipRow from './ChipRow.svelte';
  import Field from './Field.svelte';
  import RollPanel from './RollPanel.svelte';
  import { VOA_SECTIONS, voaGroup, voaSectionName } from '../lib/sections.js';
  import type { AppState } from '../state/app.svelte.js';
  import type { VoaTier } from '../lib/types.js';

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  const t = $derived(app.t);
  let chosen = $state<VoaTier>(1);
  const rows = $derived(app.index ? voaGroup(app.index, chosen) : []);
</script>

<RollPanel {app} section="voa" title={t.pageVoa} sub={t.subVoa} {rows} pickerValue={chosen}>
  {#snippet picker()}
    <Field label={t.voaSection}>
      <ChipRow>
        {#each VOA_SECTIONS as k (k)}
          <Chip
            label={voaSectionName(k, t)}
            on={String(k) === String(chosen)}
            onclick={() => {
              chosen = k;
            }}
          />
        {/each}
      </ChipRow>
    </Field>
  {/snippet}
</RollPanel>
