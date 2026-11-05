<script lang="ts">
  /* A roll on one list of records: pick a number, or let the dice pick it, and
     read what came up.

     This is the shape five sections share. Wondrous, Dread and The Dragon's
     Vault roll over a whole table; Vault of Ages and Communities roll inside
     a part of one, and pass a `picker` that chooses which part. Core
     rules and the alternate tables roll several cards at once and get their
     own panels; what they share with this one is the number field and the
     result card.

     The rows are a prop rather than a table name, because two of the five
     callers do not have a table name to give - their rows are a slice. */
  import { untrack } from 'svelte';
  import Button from './Button.svelte';
  import Die from './Die.svelte';
  import Field from './Field.svelte';
  import NumberField from './NumberField.svelte';
  import RollPage from './RollPage.svelte';
  import RollResult from './RollResult.svelte';
  import { helpFor } from '../lib/help.js';
  import { pick, rollLabel as rollLabelFor } from '../lib/roll.js';
  import type { AppState } from '../state/app.svelte.js';
  import type { Record_ } from '../lib/types.js';
  import type { Snippet } from 'svelte';

  interface Props {
    app: AppState;
    /** The section, which is what the help panel is written against. */
    section: string;
    title: string;
    /** The line under the heading. */
    sub: string;
    /** What this roll picks from, already narrowed by any picker above. */
    rows: readonly Record_[];
    /** The choice beside the roll button, where the section has one. */
    picker?: Snippet;
    /**
     * What the picker chose. Changing it puts the roll back to one, because
     * the sections are different lengths and a number kept from the last one
     * would point somewhere nobody asked for.
     */
    pickerValue?: unknown;
  }

  const { app, section, title, sub, rows, picker, pickerValue }: Props = $props();

  const t = $derived(app.t);
  const index = $derived(app.index);
  const max = $derived(rows.length);

  let n = $state(1);

  /* Reading the prop is what subscribes this to it; the reset itself must not
     depend on `n`, or choosing the same section twice would fight the field. */
  $effect(() => {
    void pickerValue;
    untrack(() => {
      n = 1;
    });
  });

  /* The record for whatever number is in the field, from the first paint. The
     live app opens on row one rather than on an empty panel, and a page that
     shows nothing until it is pressed reads as not having loaded. */
  const result = $derived(rows[n - 1] ?? null);

  /* The record and the index together, so the card below is reached with both
     in hand: a result exists only where an index does, and pairing them says
     that once instead of asking twice. */
  const shown = $derived(index && result ? { index, it: result } : null);

  const help = $derived(helpFor(section, app.lang));

  const rollLabel = $derived(rollLabelFor(max, t));

  function roll(): void {
    n = pick(max, app.env.random);
  }

  function setN(v: number): void {
    n = v;
  }
</script>

<RollPage
  {app}
  {index}
  {title}
  {sub}
  {help}
  rolled={String(n)}
  said={shown ? [shown.it] : []}
  empty={max === 0 ? t.noData : undefined}
>
  {#snippet controls()}
    <!-- The picker comes first, because it decides what the number means: on Vault of Ages
         the range is the chosen section's length, not the book's. -->
    {@render picker?.()}
    <Button variant="primary" onclick={roll}>
      <Die faces={max} />{rollLabel}
    </Button>
  {/snippet}

  {#snippet settings()}
    <Field label="{t.rollLabelFor} (1-{max})">
      <NumberField
        value={n}
        min={1}
        {max}
        label={t.rollResult}
        stepDownLabel={t.stepDown}
        stepUpLabel={t.stepUp}
        onchange={setN}
      />
    </Field>
  {/snippet}

  {#snippet results(openRecord)}
    {#if shown}
      <!-- The result is the record card itself, as the live app draws it: a roll
           that produced a name and nothing else would send the reader to another
           page to find out what they got. -->
      <div class="results" data-primary>
        <!-- Keyed on the record, not the panel: without this Svelte patches the
             existing card in place on every roll, and the previous artwork sits
             on screen until the new <img> decodes - live rebuilds #view.innerHTML
             every time, so its <img> is always brand new. Rolling the
             *same* record twice is the one case this
             still keeps the node for; the image is identical, so nothing
             visible differs. -->
        {#key shown.it}
          <RollResult {app} index={shown.index} it={shown.it} onopen={openRecord} />
        {/key}
      </div>
    {/if}
  {/snippet}
</RollPage>

<style>
  /* The `faces` container: a lone result is the tall face, at most 380 px wide, from a
     641 px column, and the row face under it (DESIGN.md, "The Roll Page Rule"). */
  .results {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    container: faces / inline-size;
  }
</style>
