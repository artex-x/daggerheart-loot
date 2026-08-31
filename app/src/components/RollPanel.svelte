<script lang="ts">
  /* A roll on one table: pick a number, or let the dice pick it, and read what
     came up.

     This is the shape the single-number sections share - Wondrous and Dread.
     Core rules and the alternate tables roll differently and get their own
     panels; what they will share with this one is the number field and the
     result, which is why both are already components. */
  import Button from './Button.svelte';
  import NumberField from './NumberField.svelte';
  import RecordModal from './RecordModal.svelte';
  import { hasRealDie, pick } from '../lib/roll.js';
  import { nameOf } from '../lib/i18n.js';
  import type { AppState } from '../state/app.svelte.js';
  import type { Record_ } from '../lib/types.js';

  interface Props {
    app: AppState;
    /** The key in `index.rows` this section rolls on. */
    table: string;
    title: string;
  }

  const { app, table, title }: Props = $props();

  const t = $derived(app.t);
  const rows = $derived(app.index?.rows.get(table) ?? []);
  const max = $derived(rows.length);

  let n = $state(1);
  /* Nothing is shown until somebody asks for something: the page opens as an
     invitation rather than as a record chosen for them. */
  let rolled = $state(false);
  let open = $state<Record_ | null>(null);

  const result = $derived(rolled ? (rows[n - 1] ?? null) : null);

  /* A real die where the range has one, and "Random 1-N" where it does not -
     119 and 29 are not dice anybody owns. */
  const rollLabel = $derived(
    /* An en dash in the range, as the live app prints it - tests/parity.js
       compares this string character for character, and it is read aloud. */
    hasRealDie(max) ? `${t.roll} d${String(max)}` : `${t.randomIn} 1\u2013${String(max)}`
  );

  function roll(): void {
    n = pick(max, app.env.random);
    rolled = true;
  }

  function setN(v: number): void {
    n = v;
    rolled = true;
  }
</script>

<h1>{title}</h1>

{#if max === 0}
  <p class="miss">{t.noData}</p>
{:else}
  <div class="controls">
    <NumberField
      value={n}
      min={1}
      {max}
      label={t.rollResult}
      stepDownLabel={t.stepDown}
      stepUpLabel={t.stepUp}
      onchange={setN}
    />
    <Button onclick={roll}>{rollLabel}</Button>
  </div>

  {#if result}
    <ul class="results">
      <li>
        <button
          type="button"
          onclick={() => {
            open = result;
          }}
        >
          <span class="n">{n}</span>
          <span class="name">{nameOf(result, app.lang)}</span>
        </button>
      </li>
    </ul>
  {/if}
{/if}

{#if open && app.index}
  <RecordModal
    {app}
    index={app.index}
    it={open}
    onclose={() => {
      open = null;
    }}
  />
{/if}

<style>
  h1 {
    margin: 0 0 var(--gap);
    font: var(--h-page-weight) var(--h-page-size) / 1.6 var(--ui);
    letter-spacing: var(--h-page-spacing);
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--gap-sm);
  }

  .miss {
    margin: 0;
    color: var(--muted);
  }

  .results {
    margin: var(--gap) 0 0;
    padding: 0;
    list-style: none;
  }

  .results button {
    display: flex;
    align-items: baseline;
    gap: var(--gap-sm);
    width: 100%;
    padding: var(--gap-sm) var(--gap);
    background: var(--surface);
    color: var(--txt);
    border: 1px solid var(--line);
    border-radius: var(--r-sm);
    font: 600 var(--step-0) / 1.3 var(--ui);
    text-align: left;
    cursor: pointer;
  }

  .n {
    color: var(--muted2);
    font-family: var(--mono);
    font-size: var(--step--1);
  }

  @media (hover: hover) {
    .results button:hover {
      border-color: var(--gold);
    }
  }
</style>
