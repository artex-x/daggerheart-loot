<script lang="ts">
  /* A record over the page it was opened from.
     A native <dialog>, so the browser supplies the focus trap, the backdrop and
     Escape rather than three hand-written approximations of them. */
  import RecordCard from './RecordCard.svelte';
  import type { AppState } from '../state/app.svelte.js';
  import type { Record_ } from '../lib/types.js';
  import type { Index } from '../lib/data.js';

  interface Props {
    app: AppState;
    index: Index;
    it: Record_;
    onclose: () => void;
  }

  /* The index is a prop rather than read off `app`: a modal is only ever opened
     from a screen that already has one, so asking again would add a branch
     nothing can take. */
  const { app, index, it, onclose }: Props = $props();

  let dialog = $state<HTMLDialogElement | null>(null);

  /* Opened as a modal rather than shown: that is what makes the rest of the
     page inert to a screen reader as well as to the mouse. */
  $effect(() => {
    dialog?.showModal();
  });
</script>

<dialog bind:this={dialog} aria-label={app.t.close} {onclose}>
  <div class="bar">
    <!-- close() rather than a method="dialog" form: it is the same thing to a
         browser, and it is one call rather than a submission nobody submits.
         Escape reaches the same place, because the browser fires `close`. -->
    <button
      type="button"
      aria-label={app.t.close}
      onclick={() => {
        dialog?.close();
      }}>&times;</button
    >
  </div>

  <RecordCard
    {it}
    {index}
    lang={app.lang}
    artBroken={app.artBroken(it.id)}
    onartfail={(bad: string) => {
      app.markArtBroken(bad);
    }}
  />
</dialog>

<style>
  dialog {
    width: min(46rem, 92vw);
    max-height: 90vh;
    padding: 0;
    border: 0;
    background: none;
    overflow: auto;
  }

  dialog::backdrop {
    background: rgb(0 0 0 / 60%);
  }

  .bar {
    display: flex;
    justify-content: flex-end;
    margin: 0 0 var(--gap-sm);
  }

  button {
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--line2);
    border-radius: var(--r-sm);
    background: var(--surface2);
    color: var(--txt);
    font: 700 var(--step-0) / 1 var(--ui);
    cursor: pointer;
  }
</style>
