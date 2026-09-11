<script lang="ts">
  /* The search input, off `input[type=search]` in style.css. Extracted on its
     second real use - the tables toolbar had it first, and the search page
     needs the exact same element and the exact same two rules.

     The live `#sq` carries `autofocus`, and the search page opens with the
     box focused and its focus ring already painted - measured with a
     headless-Chrome probe, see `context.md`, "B6 planning facts". `focus`
     drives that from `onMount` instead of the `autofocus` attribute: Svelte
     5's runtime turns `autofocus` into a `focus()` gated on
     `document.activeElement === document.body` anyway, and the compiler
     flags it as an a11y warning under `--fail-on-warnings`. */
  import { onMount } from 'svelte';

  interface Props {
    value: string;
    placeholder: string;
    oninput: (value: string) => void;
    /** Whether this box takes focus as soon as it mounts. Default false: the
     *  tables toolbar's own box never has, and only search does. */
    focus?: boolean;
  }

  const { value, placeholder, oninput, focus = false }: Props = $props();

  let el = $state<HTMLInputElement | undefined>(undefined);

  onMount(() => {
    if (focus) el?.focus();
  });
</script>

<input
  bind:this={el}
  type="search"
  {value}
  {placeholder}
  oninput={(e) => {
    oninput(e.currentTarget.value);
  }}
/>

<style>
  /* off `input[type=search]` and its `:focus` rule in style.css - the tables
     toolbar's own two rules, moved here on this second use. */
  input[type='search'] {
    width: 100%;
    height: 46px;
    padding: 0 14px;
    border-radius: var(--r-sm);
    background: var(--bg2);
    border: 1px solid var(--line2);
    color: var(--txt);
    font: inherit;
  }

  input[type='search']:focus {
    outline: none;
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgb(216 171 94 / 14%);
  }
</style>
