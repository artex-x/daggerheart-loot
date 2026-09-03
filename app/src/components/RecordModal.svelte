<script lang="ts">
  /* A record over the page it was opened from, reproduced from the live app.

     The markup is `#modal` in index.html and the styles are `.modal`,
     `.modal-back`, `.modal-card` and `.modal-x` in style.css. What is inside is
     `cardHTML(it, {full:true})` - the same card the record page draws, actions
     and all. The rewrite drew a bare card here for a while, at four times the
     width, and no route-level parity spec could see it: a modal is a state, not
     a URL. tests/parity/specs.js now visits it.

     The one deliberate deviation is the element. The live app is a div with
     role="dialog" and hand-written Escape handling, which leaves the page
     behind it reachable by Tab and by a screen reader; a native <dialog> opened
     with showModal() gets the focus trap, the inert background and Escape from
     the browser. It is recorded in ACCEPTED as an accessibility fix, and it
     changes nothing about how the thing looks. */
  import RecordActions from './RecordActions.svelte';
  import RecordCard from './RecordCard.svelte';
  import type { AppState } from '../state/app.svelte.js';
  import type { Record_ } from '../lib/types.js';
  import type { Index } from '../lib/data.js';

  interface Props {
    app: AppState;
    index: Index;
    it: Record_;
    onclose: () => void;
    /* A rung of the tier ladder swaps which record the modal is showing, the
       way the live app replaces the modal's body rather than stacking one. */
    onopen?: ((r: Record_) => void) | undefined;
  }

  /* The index is a prop rather than read off `app`: a modal is only ever opened
     from a screen that already has one, so asking again would add a branch
     nothing can take. */
  const { app, index, it, onclose, onopen }: Props = $props();

  let dialog = $state<HTMLDialogElement | null>(null);

  /* What the last action said. The card's own buttons report a refusal, and
     without a region of its own the message would land on the page underneath,
     which the browser has just made inert. */
  let said = $state('');

  const say = (msg: string): void => {
    said = msg;
  };

  /* Opened as a modal rather than shown: that is what makes the rest of the
     page inert to a screen reader as well as to the mouse. */
  $effect(() => {
    dialog?.showModal();
  });
</script>

<!-- Pressing the backdrop closes it, as pressing `.modal-back` does in the live
     app. The backdrop is not an element, so that press arrives on the dialog
     itself; anything inside the card arrives on the card. Escape is the
     browser's, and reaches `close` the same way. -->
<dialog
  bind:this={dialog}
  aria-label={app.t.close}
  {onclose}
  onclick={(e) => {
    if (e.target === dialog) dialog?.close();
  }}
>
  <div class="modal-card">
    <!-- close() rather than a method="dialog" form: it is the same thing to a
         browser, and it is one call rather than a submission nobody submits.
         Escape reaches the same place, because the browser fires `close`. -->
    <button
      type="button"
      class="modal-x"
      title={app.t.close}
      aria-label={app.t.close}
      onclick={() => {
        dialog?.close();
      }}>&times;</button
    >

    <RecordCard
      {it}
      {index}
      lang={app.lang}
      artBroken={app.artBroken(it.id)}
      {onopen}
      onartfail={(bad: string) => {
        app.markArtBroken(bad);
      }}
    >
      {#snippet nameActions()}
        <RecordActions {app} {index} {it} row="name" {say} />
      {/snippet}
      {#snippet actions()}
        <RecordActions {app} {index} {it} row="card" {say} />
      {/snippet}
    </RecordCard>

    <p class="sr-only" role="status" aria-live="polite">{said}</p>
  </div>
</dialog>

<style>
  /* off `.modal` and `.modal-back` in style.css. A native dialog fills the top
     layer itself, so the fixed positioning and the padding move onto it and the
     backdrop layer becomes ::backdrop. */
  dialog[open] {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 18px;
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    border: 0;
    background: none;
    overflow: hidden;
  }

  dialog::backdrop {
    background: rgb(6 4 12 / 78%);
    backdrop-filter: blur(5px);
  }

  /* off `.modal-card` */
  .modal-card {
    position: relative;
    z-index: 2;
    width: min(440px, 100%);
    max-height: 88vh;
    overflow: auto;
    border-radius: var(--r);
    animation: pop 0.22s cubic-bezier(0.2, 0.8, 0.3, 1) both;
  }

  /* The card fades itself in on a page. Here the modal is what arrives, and two
     entrances at once read as a stutter - as `.modal-card .card` says. */
  .modal-card :global(.card) {
    animation: none;
  }

  @keyframes pop {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.985);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  /* off `.modal-x` */
  .modal-x {
    position: absolute;
    right: 10px;
    top: 10px;
    z-index: 5;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1px solid var(--line2);
    background: rgb(10 8 16 / 80%);
    color: var(--txt);
    font-size: 22px;
    line-height: 1;
    backdrop-filter: blur(6px);
  }

  .modal-x:hover {
    border-color: var(--gold);
    color: var(--gold);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
