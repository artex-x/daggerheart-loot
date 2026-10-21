<script lang="ts">
  /* A roll inside a chosen part of a book: pick the part, then roll inside it.

     Three sections share this shape. Vault of Ages has no roll table of its
     own, so its six divisions are the choice - a tier 1 reward and an artifact
     are not rewards of the same weight, and one die over both would mix them.
     Community items roll a d10 inside one community, whose records run from
     the plainest to the strongest. Many Worlds Tavern rolls inside one realm's
     deck. The parts and their rows come from the caller; see lib/sections.ts. */
  import Chip from './Chip.svelte';
  import ChipRow from './ChipRow.svelte';
  import Field from './Field.svelte';
  import RollPanel from './RollPanel.svelte';
  import type { AppState } from '../state/app.svelte.js';
  import type { Part } from '../lib/sections.js';
  import type { Record_ } from '../lib/types.js';

  interface Props {
    app: AppState;
    /** The section, which is what the help panel is written against. */
    section: 'voa' | 'community' | 'mwt';
    title: string;
    /** The line under the heading. */
    sub: string;
    /** The caption above the picker. */
    label: string;
    parts: readonly Part[];
    /** The rows of one part, in the order its roll numbers them. */
    rowsOf: (id: string) => readonly Record_[];
  }

  const { app, section, title, sub, label, parts, rowsOf }: Props = $props();

  let chosen = $state('');
  /* The first part until somebody picks another, which is what the live app
     opens on. Held as an id rather than an index so it survives the list being
     rebuilt when the language changes. */
  const current = $derived(parts.some((p) => p.id === chosen) ? chosen : (parts[0]?.id ?? ''));
  const rows = $derived(current ? rowsOf(current) : []);
</script>

<RollPanel {app} {section} {title} {sub} {rows} pickerValue={current}>
  {#snippet picker()}
    <Field {label}>
      <ChipRow>
        {#each parts as p (p.id)}
          <Chip
            label={p.label}
            on={p.id === current}
            onclick={() => {
              chosen = p.id;
            }}
          />
        {/each}
      </ChipRow>
    </Field>
  {/snippet}
</RollPanel>
