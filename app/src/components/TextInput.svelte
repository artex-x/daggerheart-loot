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
    label?: string;
    id?: string;
    autocomplete?: HTMLInputAttributes['autocomplete'];
  }

  let {
    value = $bindable(''),
    el = $bindable(),
    placeholder,
    label,
    id,
    autocomplete
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
