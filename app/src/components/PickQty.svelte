<script lang="ts">
  /* The take line inside a ticked list entry whose stock is over 1 - on the
     shared page and on the own list (docs/specs/FEATURES.md, "Lists"):
     "Взять [2] из 5 = 1 мешок", the sum only for a priced entry. */
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
    onchange: (n: number) => void;
  }

  const { value, max, label, ofText, sum, name, onchange }: Props = $props();

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

<span class="take"
  ><label class="pickqty"
    ><span class="lbl">{label}</span><input
      type="number"
      min="1"
      {max}
      inputmode="numeric"
      aria-label={name}
      {value}
      oninput={onInput}
      onchange={onCommit}
    /></label
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

  /* off `.lrow-meta input` in `ListPage.svelte` */
  .pickqty input {
    width: 70px;
    height: 30px;
    padding: 0 2px 0 8px;
    border-radius: 7px;
    background: var(--bg2);
    border: 1px solid var(--line2);
    color: var(--txt);
    font: 600 13px/1 var(--mono);
    text-align: center;
  }

  .pickqty input:focus {
    outline: none;
    border-color: var(--gold);
  }

  .of {
    font: 600 13px/1 var(--mono);
    color: var(--muted);
  }

  .sum {
    font-size: 12.5px;
    color: var(--muted2);
  }
</style>
