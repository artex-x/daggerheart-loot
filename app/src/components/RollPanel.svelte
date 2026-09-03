<script lang="ts">
  /* A roll on one list of records: pick a number, or let the dice pick it, and
     read what came up.

     This is the shape four sections share. Wondrous and Dread roll over a whole
     table; Vault of Ages and Communities roll inside a part of one, and pass a
     `picker` row that chooses which part. Core rules and the alternate tables
     roll several cards at once and get their own panels; what they share with
     this one is the number field and the result card.

     The rows are a prop rather than a table name, because two of the four
     callers do not have a table name to give - their rows are a slice. */
  import { untrack } from 'svelte';
  import Button from './Button.svelte';
  import Die from './Die.svelte';
  import Field from './Field.svelte';
  import NumberField from './NumberField.svelte';
  import PageHead from './PageHead.svelte';
  import RecordActions from './RecordActions.svelte';
  import RecordCard from './RecordCard.svelte';
  import RecordModal from './RecordModal.svelte';
  import { helpFor } from '../lib/help.js';
  import { hasRealDie, pick } from '../lib/roll.js';
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
    /** A row of choices above the number field, where the section has one. */
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

  let open = $state<Record_ | null>(null);
  /* What the last action said - a refused setting, or a copy that did not go
     through. Announced rather than drawn; see the region at the end. */
  let said = $state('');

  const say = (msg: string): void => {
    said = msg;
  };

  /* The record for whatever number is in the field, from the first paint. The
     live app opens on row one rather than on an empty panel, and a page that
     shows nothing until it is pressed reads as not having loaded. */
  const result = $derived(rows[n - 1] ?? null);

  /* The record and the index together, so the card below is reached with both
     in hand: a result exists only where an index does, and pairing them says
     that once instead of asking twice. */
  const shown = $derived(index && result ? { index, it: result } : null);

  /* A real die where the range has one, and "Random 1-N" where it does not -
     119 and 29 are not dice anybody owns. */
  const help = $derived(helpFor(section, app.lang));

  const rollLabel = $derived(
    /* An en dash in the range, as the live app prints it - tests/parity.js
       compares this string character for character, and it is read aloud. */
    hasRealDie(max) ? `${t.roll} d${String(max)}` : `${t.randomIn} 1\u2013${String(max)}`
  );

  function roll(): void {
    n = pick(max, app.env.random);
  }

  function setN(v: number): void {
    n = v;
  }
</script>

<PageHead {app} {title} {sub} {help} {say} />

{#if max === 0}
  <p class="miss">{t.noData}</p>
{:else}
  <div class="panel">
    <!-- The picker comes first, because it decides what the number means: on
         Vault of Ages the range is the chosen section's length, not the book's. -->
    {@render picker?.()}
    <Field label="{t.rollLabelFor} (1–{max})">
      <div class="numrow">
        <NumberField
          value={n}
          min={1}
          {max}
          label={t.rollResult}
          stepDownLabel={t.stepDown}
          stepUpLabel={t.stepUp}
          onchange={setN}
        />
        <Button variant="primary" onclick={roll}>
          <Die faces={max} />{rollLabel}
        </Button>
      </div>
    </Field>
  </div>

  {#if shown}
    <!-- The result is the record card itself, as the live app draws it: a roll
         that produced a name and nothing else would send the reader to another
         page to find out what they got. -->
    <div class="results">
      <RecordCard
        variant="compact"
        it={shown.it}
        index={shown.index}
        lang={app.lang}
        artBroken={app.artBroken(shown.it.id)}
        onartfail={(bad: string) => {
          app.markArtBroken(bad);
        }}
        onopen={(r: Record_) => {
          open = r;
        }}
      >
        {#snippet nameActions()}
          <RecordActions {app} index={shown.index} it={shown.it} row="name" {say} />
        {/snippet}
        {#snippet actions()}
          <RecordActions {app} index={shown.index} it={shown.it} row="card" {say} />
        {/snippet}
      </RecordCard>
    </div>
  {/if}
{/if}

<!-- Announced but not drawn: the live app reports a refused setting in a toast,
     which is a later slice, and a message painted here that the original does
     not have would be a visual difference. Saying nothing at all would leave a
     button that quietly lies. -->
<p class="sr-only" role="status" aria-live="polite">{said}</p>

{#if open && app.index}
  <RecordModal
    {app}
    index={app.index}
    it={open}
    onclose={() => {
      open = null;
    }}
    onopen={(r: Record_) => {
      open = r;
    }}
  />
{/if}

<style>
  /* off `.panel`, `.field`, `.lbl`, `.numrow` and `.btn` in style.css */
  .panel {
    background: linear-gradient(180deg, var(--surface2), var(--surface));
    border: 1px solid var(--line);
    border-radius: var(--r);
    padding: 18px;
    box-shadow: var(--shadow);
  }

  .numrow {
    display: flex;
    gap: 10px;
    align-items: stretch;
    flex-wrap: wrap;
  }
  .miss {
    margin: 0;
    color: var(--muted);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  /* off `.results` in style.css */
  .results {
    margin-top: 26px;
  }
</style>
