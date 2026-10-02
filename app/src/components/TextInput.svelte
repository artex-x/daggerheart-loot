<script lang="ts">
  /* The one-line text box - off the global `input[type=text]` rule in
     style.css. Extracted on its third use: the lists index's two boxes and
     the account page's typed confirmation. */
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props {
    value?: string;
    /** The element, for a caller that moves focus into it. */
    el?: HTMLInputElement | undefined;
    placeholder?: string;
    /** The name, when no `<label>` points at `id`. */
    label?: string | undefined;
    id?: string;
    autocomplete?: HTMLInputAttributes['autocomplete'];
    inputmode?: HTMLInputAttributes['inputmode'];
    /** A form field that must be filled: `aria-required`. */
    required?: boolean;
    /** The field has a problem: `aria-invalid`. */
    invalid?: boolean;
    /** The id of the field's error line. */
    describedby?: string | undefined;
    /** The most the database keeps (docs/specs/FEATURES.md, "Consistency rules"). */
    maxlength?: number | undefined;
    oninput?: () => void;
  }

  let {
    value = $bindable(''),
    el = $bindable(),
    placeholder,
    label,
    id,
    autocomplete,
    inputmode,
    required = false,
    invalid = false,
    describedby,
    maxlength,
    oninput
  }: Props = $props();
</script>

<input
  type="text"
  bind:value
  bind:this={el}
  {placeholder}
  aria-label={label}
  {id}
  {autocomplete}
  {inputmode}
  aria-required={required || undefined}
  aria-invalid={invalid || undefined}
  aria-describedby={describedby}
  {maxlength}
  {oninput}
/>

<style>
  input {
    width: 100%;
    height: 46px;
    padding: 0 14px;
    border-radius: var(--r-sm);
    background: var(--bg2);
    border: 1px solid var(--line2);
    color: var(--txt);
    font: inherit;
  }

  input:focus {
    outline: none;
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgb(216 171 94 / 14%);
  }
</style>
