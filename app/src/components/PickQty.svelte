<script lang="ts">
  /* The take line inside a ticked list entry whose stock is over 1 - on the
     shared page and on the own list (docs/specs/FEATURES.md, "Lists"):
     "Взять [Мин|2|Макс] из 5 = 1 мешок", the sum only for a priced entry. The
     two ends set the count to one and to the whole stock (docs/DECISIONS.md,
     2026-09-30, "The take count sits between Min and Max in one control"). */
  import { clamp } from '../lib/numField.js';

  interface Props {
    /** The count on screen: the picked count, or the whole stock. */
    value: number;
    /** The entry's stock. */
    max: number;
    /** The visible label. */
    label: string;
    /** "из N" after the field, which ties the count to the stock. */
    ofText: string;
    /** The line sum, price x count; empty for an unpriced entry. */
    sum?: string;
    /** The input's accessible name, which names the record. */
    name: string;
    /** The visible text of the end that sets the count to one. */
    minText: string;
    /** The visible text of the end that sets the count to the stock. */
    maxText: string;
    /** The accessible names of the two ends, which name the record. */
    minName: string;
    maxName: string;
    onchange: (n: number) => void;
  }

  const {
    value,
    max,
    label,
    ofText,
    sum,
    name,
    minText,
    maxText,
    minName,
    maxName,
    onchange
  }: Props = $props();

  /* An emptied field mid-edit is left alone until it is committed; a count
     over the stock is written back at once, because the prop does not change
     when the stock was already the count. */
  function onInput(e: Event & { currentTarget: HTMLInputElement }): void {
    const el = e.currentTarget;
    const n = parseInt(el.value, 10);
    if (!(n >= 1)) return;
    const held = clamp(n, 1, max);
    if (held !== n) el.value = String(held);
    onchange(held);
  }

  function onCommit(e: Event & { currentTarget: HTMLInputElement }): void {
    const el = e.currentTarget;
    if (!(parseInt(el.value, 10) >= 1)) el.value = String(value);
  }
</script>

<!-- A span, not a label: a label may not hold the two buttons; the input keeps its name
     through aria-label. -->
<span class="take"
  ><span class="pickqty"
    ><span class="lbl">{label}</span><span class="qgroup"
      ><button
        type="button"
        aria-label={minName}
        disabled={value <= 1}
        onclick={() => {
          onchange(1);
        }}>{minText}</button
      ><input
        type="number"
        min="1"
        {max}
        inputmode="numeric"
        aria-label={name}
        {value}
        oninput={onInput}
        onchange={onCommit}
      /><button
        type="button"
        aria-label={maxName}
        disabled={value >= max}
        onclick={() => {
          onchange(max);
        }}>{maxText}</button
      ></span
    ></span
  >&#32;<span class="of">{ofText}</span>&#32;{#if sum}<span class="sum">= {sum}</span
    >{/if}</span
>

<style>
  .take {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .pickqty {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  .lbl {
    font-size: 13px;
    font-weight: 650;
    color: var(--gold-soft);
  }

  /* The count and its two ends as one box, off `.numbox` in `NumberField.svelte`
     at the shipped field's 30 px and 7 px radius. */
  .qgroup {
    display: inline-flex;
    align-items: stretch;
    height: 30px;
    border: 1px solid var(--line2);
    border-radius: 7px;
    background: var(--bg2);
    overflow: hidden;
  }

  .qgroup:focus-within {
    border-color: var(--gold);
  }

  .qgroup input {
    width: 48px;
    height: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--txt);
    font: 600 13px/1 var(--mono);
    text-align: center;
  }

  /* The box draws the focus. */
  .qgroup input:focus {
    outline: none;
  }

  .qgroup button {
    border: 0;
    background: transparent;
    color: var(--muted);
    min-width: 34px;
    padding: 0 8px;
    font: 600 12.5px/1 var(--ui);
    cursor: pointer;
    transition: 0.14s;
  }

  .qgroup button:first-child {
    border-right: 1px solid var(--line2);
  }

  .qgroup button:last-child {
    border-left: 1px solid var(--line2);
  }

  .qgroup button:hover:not(:disabled) {
    background: var(--surface2);
    color: var(--gold);
  }

  .qgroup button:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .qgroup button:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: -2px;
  }

  .of {
    font: 600 13px/1 var(--mono);
    color: var(--muted);
  }

  .sum {
    font-size: 12.5px;
    color: var(--muted2);
  }

  /* A touch target at phone width (DESIGN.md, "The Two Breakpoints Rule"). */
  @media (max-width: 600px) {
    .qgroup {
      height: 36px;
    }

    .qgroup button {
      min-width: 44px;
    }
  }
</style>
