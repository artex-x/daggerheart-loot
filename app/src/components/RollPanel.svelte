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
  import Icon from './Icon.svelte';
  import NumberField from './NumberField.svelte';
  import RecordActions from './RecordActions.svelte';
  import RecordCard from './RecordCard.svelte';
  import RecordModal from './RecordModal.svelte';
  import { helpFor, isLink } from '../lib/help.js';
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
  let helpOpen = $state(false);

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

<div class="page-head">
  <h1 class="page-h">{title}</h1>
  <!-- 26px of paint, 44px of target: it sits in the heading row and a mis-tap
       silently changes where the app opens. -->
  <button
    type="button"
    class="homebtn"
    class:on={app.isHome}
    title={app.isHome ? t.homeOn : t.homeHint}
    aria-label={app.isHome ? t.homeOn : t.homeHint}
    aria-pressed={app.isHome}
    onclick={() => {
      if (!app.toggleHome()) said = t.copyFailed;
    }}
  >
    <Icon name="home" />
  </button>
  {#if help}
    <button
      type="button"
      class="helpbtn"
      class:on={helpOpen}
      title={t.helpHint}
      aria-label={t.helpHint}
      aria-expanded={helpOpen}
      onclick={() => {
        helpOpen = !helpOpen;
      }}>?</button
    >
  {/if}
</div>
<p class="page-sub">{sub}</p>

{#if help && helpOpen}
  <div class="helpbox">
    {#each help.paragraphs as para, i (i)}
      <p>
        {#if para.lead}<b>{para.lead}</b
          >{/if}{#each para.parts as part, j (j)}{#if isLink(part)}<a
              href={part.href}
              target="_blank"
              rel="noopener">{part.label}</a
            >{:else}{part}{/if}{/each}
      </p>
    {/each}
  </div>
{/if}

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
        onopen={() => {
          open = shown.it;
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
  />
{/if}

<style>
  /* off `.page-head`, `.page-h`, `.homebtn`, `.page-sub`, `.panel`, `.field`,
     `.lbl`, `.numrow` and `.btn` in style.css */
  .page-head {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 4px;
  }

  .page-h {
    margin: 0;
    font-size: var(--h-page-size);
    font-weight: var(--h-page-weight);
    letter-spacing: var(--h-page-spacing);
  }

  .homebtn {
    width: 26px;
    height: 26px;
    flex: none;
    padding: 0;
    border-radius: 50%;
    position: relative;
    border: 1px solid var(--line2);
    background: transparent;
    color: var(--muted2);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: 0.15s;
    vertical-align: middle;
    cursor: pointer;
  }

  .homebtn:hover {
    border-color: var(--gold);
    color: var(--gold-soft);
  }

  .homebtn.on {
    background: var(--gold);
    border-color: var(--gold);
    color: #1a1206;
  }

  .homebtn :global(svg) {
    width: 14px;
    height: 14px;
    fill: currentcolor;
  }

  /* The paint is 26px and the target is 44: a mis-tap here changes where the
     app opens, silently. */
  .homebtn::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 44px;
    height: 44px;
    transform: translate(-50%, -50%);
  }

  /* off `.helpbtn` in style.css */
  .helpbtn {
    flex: none;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 1px solid var(--line2);
    background: var(--surface);
    color: var(--muted);
    font: 700 14px/1 var(--mono);
    transition: 0.15s;
    position: relative;
    cursor: pointer;
  }

  .helpbtn:hover {
    border-color: var(--gold);
    color: var(--gold);
  }

  .helpbtn.on {
    background: var(--gold);
    border-color: var(--gold);
    color: #1a1206;
  }

  .helpbtn::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 44px;
    height: 44px;
    transform: translate(-50%, -50%);
  }

  /* off `.helpbox` */
  .helpbox {
    margin: 0 0 22px;
    padding: 15px 17px;
    border-radius: var(--r);
    background: var(--surface);
    border: 1px solid var(--line2);
  }

  .helpbox p {
    margin: 0 0 11px;
    color: #cfc8e0;
    font-size: 13.5px;
    line-height: 1.6;
    max-width: 78ch;
  }

  .helpbox p:last-child {
    margin-bottom: 0;
  }

  .helpbox a {
    color: var(--gold-soft);
  }

  /* The bold lead-in of a Vault of Ages paragraph, off `.helpbox b`. */
  .helpbox b {
    color: var(--gold-soft);
    font-weight: 650;
  }

  .page-sub {
    margin: 0 0 18px;
    color: var(--muted);
    font-size: 14px;
    max-width: 70ch;
  }

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

  /* Both buttons in the heading row are one size on a phone: side by side they
     read as a pair. Off the mobile block in style.css. */
  @media (max-width: 600px) {
    .helpbtn,
    .homebtn {
      width: 34px;
      height: 34px;
      font-size: 16px;
    }

    .homebtn :global(svg) {
      width: 17px;
      height: 17px;
    }
  }
</style>
