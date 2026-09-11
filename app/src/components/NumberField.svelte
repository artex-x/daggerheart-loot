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
    /**
     * Which die this field is, where it is one of a named pair.
     *
     * The alternate tables roll Hope and Fear rather than a sum, and the live
     * app colours each field's focus ring to match its label. Everywhere else
     * the number has no name and the ring stays gold.
     */
    tone?: 'hope' | 'fear';
    /**
     * The live #16 rule (`numBox`, app.js 2096-2107, comment): a value below
     * `min` means "no roll yet" and draws as an empty field rather than as
     * the number. On the list page this also changes how the field commits -
     * every keystroke applies at once, an emptied field commits `0` rather
     * than waiting for `change` to land on `min`, and a step from empty
     * starts counting at 0 - so a first `+` or `-` both land on `min`. A
     * roll page never passes this and keeps waiting for `change`.
     */
    empty?: boolean;
    onchange: (n: number) => void;
  }

  const { value, min, max, label, stepDownLabel, stepUpLabel, tone, empty, onchange }: Props =
    $props();

  /** What the field shows for a given number - `''` below `min` when `empty`
   *  is set (the live app's own reading of "no roll yet"), the number itself
   *  otherwise. */
  const shownText = (v: number): string => (empty && v < min ? '' : String(v));

  /* What the field shows while it is being edited, which is not always a
     number: an empty field and a half-typed one both have to be allowed. */
  let text = $state(untrack(() => shownText(value)));

  /* A roll, or a step, changes the number from outside; typing changes it from
     inside and must not be overwritten mid-word. Comparing what the field
     currently *means* against the number tells the two apart without a second
     copy of the value to keep in step. */
  $effect(() => {
    const v = value;
    untrack(() => {
      /* The second half is for a range that shrank under the field. Switching
         Vault of Ages from a tier with two entries to one with a single entry
         left "2" on screen: it *means* 1 once clamped, so the first test was
         satisfied, and the live app - which redraws the input every time -
         showed 1. What the field shows has to be the number, not something
         that rounds to it. */
      const shownNum = text === '' ? null : Number(text);
      if (committed(text, min, max) !== v || (shownNum !== null && shownNum !== v)) {
        text = shownText(v);
      }
    });
  });

  function oninput(e: Event): void {
    const el = e.currentTarget as HTMLInputElement;
    const next = typed(el.value, el.selectionStart ?? el.value.length, max, min);
    text = next.value;
    el.value = next.value;
    el.setSelectionRange(next.caret, next.caret);
    /* The live list page applies every keystroke rather than waiting for
       `change` (app.js 4315-4331): an emptied field commits 0 at once, and a
       digit commits clamped into range at once. A roll page passes no
       `empty` and keeps the old `change`-only commit below. */
    if (empty) onchange(next.value === '' ? 0 : committed(next.value, min, max));
  }

  function commit(): void {
    /* The live `change` handler leaves an empty field alone on the list page
       (app.js comment above `numBox`) - `oninput` already committed 0 for
       it, and `change` re-committing `min` over that would undo the "no
       roll yet" state the moment the field loses focus. */
    if (empty && text.trim() === '') return;
    const n = committed(text, min, max);
    text = shownText(n);
    onchange(n);
  }

  /* Focus is left where the browser put it - on the button that was pressed.
     Moving it into the input looked helpful and was not the live behaviour:
     the ring ends up on a field whose outline is suppressed instead of on the
     stepper, so a keyboard user loses sight of where they are, and the parity
     diff charged the whole box for the glow. */
  function step(by: number): void {
    /* An empty field starts counting at 0, not at `min` - the live
       `(parseInt('') || 0) + by`, so a first `+` or `-` both land on `min`. */
    const current = empty && text.trim() === '' ? 0 : committed(text, min, max);
    const n = committed(String(current + by), min, max);
    text = shownText(n);
    onchange(n);
  }
</script>

<div class="numbox {tone ?? ''}">
  <button
    type="button"
    aria-label={stepDownLabel}
    disabled={value <= min}
    onclick={() => {
      step(-1);
    }}>&minus;</button
  >
  <input
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

  .numbox.hope:focus-within {
    border-color: var(--hope);
    box-shadow: 0 0 0 3px rgb(233 185 73 / 14%);
  }

  .numbox.fear:focus-within {
    border-color: var(--fear);
    box-shadow: 0 0 0 3px rgb(138 114 214 / 16%);
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

  /* style.css has `.numbox input[type=text]{width:56px}` here too, and it is
     dead: the base rule that sets 74px is written *after* the media block at
     the same specificity, so it wins at every width. The live field is 74px on
     a phone, this one has to be, and copying the intent instead of the
     behaviour cost eighteen pixels on the parity diff. The button rule does
     apply, because its base rule comes before the block. */
  @media (max-width: 430px) {
    button {
      width: 36px;
    }
  }
</style>
