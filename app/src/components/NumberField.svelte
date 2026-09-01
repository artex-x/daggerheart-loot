<script lang="ts">
  /* A number in a range, with a stepper either side.
     Deliberately type="text": a number input refuses setSelectionRange, and
     putting the caret back is the whole point here - see lib/numField.ts and
     defect #64. The steppers are ours anyway, so the native ones cost nothing
     to give up. */
  import { untrack } from 'svelte';
  import { committed, typed } from '../lib/numField.js';

  interface Props {
    value: number;
    min: number;
    max: number;
    label: string;
    stepDownLabel: string;
    stepUpLabel: string;
    onchange: (n: number) => void;
  }

  const { value, min, max, label, stepDownLabel, stepUpLabel, onchange }: Props = $props();

  /* What the field shows while it is being edited, which is not always a
     number: an empty field and a half-typed one both have to be allowed. */
  let text = $state(untrack(() => String(value)));
  let input = $state<HTMLInputElement | null>(null);

  /* A roll, or a step, changes the number from outside; typing changes it from
     inside and must not be overwritten mid-word. Comparing what the field
     currently *means* against the number tells the two apart without a second
     copy of the value to keep in step. */
  $effect(() => {
    const v = value;
    untrack(() => {
      if (committed(text, min, max) !== v) text = String(v);
    });
  });

  function oninput(e: Event): void {
    const el = e.currentTarget as HTMLInputElement;
    const next = typed(el.value, el.selectionStart ?? el.value.length, max);
    text = next.value;
    el.value = next.value;
    el.setSelectionRange(next.caret, next.caret);
  }

  function commit(): void {
    const n = committed(text, min, max);
    text = String(n);
    onchange(n);
  }

  function step(by: number): void {
    const n = committed(String(committed(text, min, max) + by), min, max);
    text = String(n);
    onchange(n);
    input?.focus();
  }
</script>

<div class="numbox">
  <button
    type="button"
    aria-label={stepDownLabel}
    disabled={value <= min}
    onclick={() => {
      step(-1);
    }}>&minus;</button
  >
  <input
    bind:this={input}
    type="text"
    inputmode="numeric"
    pattern="[0-9]*"
    autocomplete="off"
    aria-label={label}
    value={text}
    {oninput}
    onchange={commit}
  />
  <button
    type="button"
    aria-label={stepUpLabel}
    disabled={value >= max}
    onclick={() => {
      step(1);
    }}>+</button
  >
</div>

<style>
  /* off `.numbox` in style.css */
  .numbox {
    display: flex;
    align-items: center;
    background: var(--bg2);
    border: 1px solid var(--line2);
    border-radius: var(--r-sm);
    overflow: hidden;
  }

  /* The type selector is load-bearing: the field is a text input, and a generic
     input rule would otherwise stretch it to the full width. */
  input[type='text'] {
    width: 74px;
    height: 46px;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: var(--txt);
    text-align: center;
    font: 650 20px/1 var(--mono);
  }

  input[type='text']:focus {
    outline: none;
    box-shadow: none;
    border-color: transparent;
  }

  .numbox:focus-within {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgb(216 171 94 / 14%);
  }

  button {
    border: 0;
    background: transparent;
    color: var(--muted);
    width: 40px;
    height: 46px;
    font-size: 19px;
    line-height: 1;
    transition: 0.14s;
  }

  button:hover {
    background: var(--surface2);
    color: var(--gold);
  }

  button:disabled {
    opacity: 0.4;
    cursor: default;
  }

  @media (max-width: 430px) {
    input[type='text'] {
      width: 56px;
    }

    button {
      width: 36px;
    }
  }
</style>
