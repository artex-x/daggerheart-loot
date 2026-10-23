<script lang="ts">
  /* The one button of a fold that shows the rest of a cut list (docs/specs/FEATURES.md,
     rule 12): «и ещё N ...» closed and «свернуть» open, so the focus stays on it. */
  import Button from './Button.svelte';
  import type { Dict } from '../lib/dict.js';

  interface Props {
    open: boolean;
    /** The closed text: «и ещё N», or a counted noun («и ещё N источников»). */
    more: string;
    t: Dict;
    ontoggle: () => void;
  }

  const { open, more, t, ontoggle }: Props = $props();
</script>

<Button variant="bare" size="sm" caret expanded={open} onclick={ontoggle}
  >{open ? t.relLess : more}</Button
>
