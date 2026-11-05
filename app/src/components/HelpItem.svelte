<script lang="ts">
  /* The help as an item of «Ещё»: the panel's own name (DESIGN.md, "The Same Label Rule"),
     with a check while the panel is open, as the pin item marks its state. */
  import Icon from './Icon.svelte';
  import type { Help } from '../lib/help.js';

  interface Props {
    help: Help;
    open: boolean;
    ontoggle: () => void;
    /** Called first, so the menu closes and the focus returns before the panel moves. */
    onpicked: () => void;
  }

  const { help, open, ontoggle, onpicked }: Props = $props();
</script>

<button
  type="button"
  role="menuitem"
  tabindex="-1"
  aria-expanded={open}
  onclick={() => {
    onpicked();
    ontoggle();
  }}><Icon name={open ? 'check' : 'help'} />{help.button}</button
>
