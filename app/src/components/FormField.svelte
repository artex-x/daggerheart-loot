<script lang="ts">
  /* One field of a form: its caption, the control, and the field's error line. The homebrew
     editor and the quick item share it. Field.svelte is the roll panels' uppercase row. */
  import type { Snippet } from 'svelte';

  interface Props {
    /** The caption; omitted while the control has none, as a source being named. */
    label?: string | undefined;
    /** The control's id: the caption becomes its `<label>`. Without it the caption is
     *  hidden from the accessible tree, and the control carries its own name. */
    for?: string | undefined;
    /** Draws the required mark after the caption. */
    required?: boolean;
    /** The field's problem, drawn after the control. */
    error?: string | undefined;
    /** The error line's id, which the control's `aria-describedby` names. */
    errorId?: string | undefined;
    children: Snippet;
  }

  const { label, for: forId, required = false, error, errorId, children }: Props = $props();
</script>

<div class="fld">
  {#if label && forId}
    <label class="flabel" for={forId}
      >{label}{#if required}<span class="req">*</span>{/if}</label
    >
  {:else if label}
    <span class="flabel" aria-hidden="true"
      >{label}{#if required}<span class="req">*</span>{/if}</span
    >
  {/if}
  {@render children()}
  {#if error}<p class="ferr" id={errorId}>{error}</p>{/if}
</div>

<style>
  .fld {
    display: grid;
    gap: var(--gap-sm);
    min-width: 0;
  }

  .flabel {
    font-size: 13px;
    font-weight: 600;
    color: var(--muted);
  }

  .req {
    margin-left: 0.25em;
    color: var(--danger-text);
  }

  .ferr {
    margin: 0;
    font-size: 13px;
    color: var(--danger-text);
  }
</style>
