<script lang="ts">
  /* One field of a form: its caption, the control, and the field's error line. The homebrew
     editor and the quick item share it. Field.svelte is the roll panels' uppercase row. */
  import type { Snippet } from 'svelte';
  import HelpButton from './HelpButton.svelte';
  import { dict } from '../lib/dict.js';
  import type { Lang } from '../lib/types.js';

  interface Props {
    /** The caption; omitted while the control has none, as a source being named. */
    label?: string | undefined;
    /** The control's id: the caption becomes its `<label>`. Without it the caption is
     *  hidden from the accessible tree, and the control carries its own name. */
    for?: string | undefined;
    /** The muted word after the caption of an optional field; a required field has none
     *  (DESIGN.md, "Forms"). Outside the `<label>`: the control's name stays the caption. */
    optional?: string | undefined;
    /** The field's problem, drawn after the control. */
    error?: string | undefined;
    /** The error line's id, which the control's `aria-describedby` names. */
    errorId?: string | undefined;
    /** A «?» after the caption, named «Подсказка: <caption>», that shows `text` under it;
     *  `id` is the hint's (docs/specs/FEATURES.md, "Consistency rules", rule 15). */
    help?: { id: string; text: string; lang: Lang } | undefined;
    children: Snippet;
  }

  const { label, for: forId, optional, error, errorId, help, children }: Props = $props();

  let open = $state(false);
</script>

<!-- eslint-disable @typescript-eslint/no-confusing-void-expression -- a `{@render}` tag of a
     local snippet reads as a void expression to this rule. -->
{#snippet caption()}
  {#if label && forId}
    <label class="flabel" for={forId}>{label}</label>
  {:else if label}
    <span class="flabel" aria-hidden="true">{label}</span>
  {/if}
{/snippet}

<div class="fld">
  {#if label && (help || optional)}
    <div class="fhead">
      {@render caption()}
      <!-- A hidden caption hides its word too: alone it reads as a stray "optional". -->
      {#if optional}<span class="opt" aria-hidden={forId ? undefined : 'true'}>{optional}</span
        >{/if}
      {#if help}
        <HelpButton
          lang={help.lang}
          size="sm"
          {open}
          label={dict(help.lang).fieldHelp.replace('%s', label)}
          controls={help.id}
          onclick={() => {
            open = !open;
          }}
        />
      {/if}
    </div>
    {#if help}<p class="fhelp" id={help.id} hidden={!open}>{help.text}</p>{/if}
  {:else}
    {@render caption()}
  {/if}
  {@render children()}
  {#if error}<p class="ferr" id={errorId}>{error}</p>{/if}
</div>

<style>
  /* minmax(0, 1fr): a select's long option never widens the field (rule 16). */
  .fld {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--gap-sm);
    min-width: 0;
  }

  .flabel {
    font-size: var(--t-data);
    font-weight: 600;
    color: var(--muted);
  }

  .fhead {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* A hint of several sentences keeps its line breaks (`mdHelp`). */
  .fhelp {
    margin: 0;
    font-size: var(--t-data);
    color: var(--muted2);
    white-space: pre-line;
  }

  .opt {
    font-size: var(--t-label);
    font-weight: 400;
    color: var(--muted2);
  }

  .ferr {
    margin: 0;
    font-size: var(--t-data);
    color: var(--danger-text);
  }
</style>
