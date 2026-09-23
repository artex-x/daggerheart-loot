<script lang="ts">
  /* The taken-count field under a ticked list entry whose stock is over 1 -
     on the shared page and on the own list (docs/specs/FEATURES.md, "Lists").
     It looks like the own list's "Кол-во" field, laid out in one line. */
  import { clamp } from '../lib/numField.js';

  interface Props {
    /** The count on screen: the picked count, or the whole stock. */
    value: number;
    /** The entry's stock. */
    max: number;
    /** The visible label. */
    label: string;
    /** The input's accessible name, which names the record. */
    name: string;
    onchange: (n: number) => void;
  }

  const { value, max, label, name, onchange }: Props = $props();

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

<label class="pickqty"
  ><span>{label}</span><input
    type="number"
    min="1"
    {max}
    inputmode="numeric"
    aria-label={name}
    {value}
    oninput={onInput}
    onchange={onCommit}
  /></label
>

<style>
  /* off `.lrow-meta label`, `span` and `input` in `ListPage.svelte`, in one
     line instead of a column. */
  .pickqty {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--gap-sm);
  }

  .pickqty span {
    font-size: 9.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted2);
  }

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
</style>
