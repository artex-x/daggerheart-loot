<script lang="ts">
  /* The help as an item of «Ещё»: the panel's own name (DESIGN.md, "The Same Label Rule"). */
  import Icon from './Icon.svelte';
  import type { Dict } from '../lib/dict.js';
  import type { Help } from '../lib/help.js';

  interface Props {
    help: Help;
    open: boolean;
    t: Dict;
    ontoggle: () => void;
    /** Called first, so the menu closes and the focus returns before the panel moves. */
    onpicked: () => void;
  }

  const { help, open, t, ontoggle, onpicked }: Props = $props();
</script>

<button
  type="button"
  role="menuitem"
  tabindex="-1"
  aria-expanded={open}
  onclick={() => {
    onpicked();
    ontoggle();
  }}><Icon name="help" />{help.button ?? t.helpHint}</button
>
