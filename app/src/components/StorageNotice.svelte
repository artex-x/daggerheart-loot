<script lang="ts">
  /* The storage warning, off `storageWarning`/`hideWarn` (app.js 2872-2886,
   * 4175). Two live forms in one slot: storage does not work at all (no
   * dismiss - nothing would remember it), or it works and the "lists live
   * only in this browser" notice has not been dismissed yet.
   *
   * Extracted here on its second use - the lists index and the list page
   * (B5.4) both draw it in the same slot, and nowhere else. */
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  const t = $derived(app.t);

  function dismiss(e: MouseEvent): void {
    /* The cross sits inside the summary, so a plain click would also toggle
       the disclosure - the live `hideWarn` calls this first for the same
       reason. */
    e.preventDefault();
    app.hideWarn();
  }
</script>

{#if !app.storageWorks}
  <!-- Nothing dismisses this one - there is nothing to remember it with. -->
  <div class="warn"><b>{t.noStorageTitle}</b>{' ' + t.noStorage}</div>
{:else if app.lists.unreadable}
  <!-- R1: storage itself works, but the lists key held something that would
       not parse. Not dismissable either - the notice has to keep saying so
       until a write actually clears it, and there is no state to remember a
       dismissal against that would survive the next reload finding the same
       bad value again. -->
  <div class="warn"><b>{t.badStorageTitle}</b>{' ' + t.badStorage}</div>
{:else if !app.warnHidden}
  <!-- The live `render()` builds this notice fresh on a language switch, and
       `restoreOpen` (app.js 3769) only re-applies a person's fold/unfold to
       `[data-keep]` elements - this is not one. Keyed on `app.lang` so the
       rewrite's own `<details>` is destroyed and re-created the same way. -->
  {#key app.lang}
    <details class="warn">
      <summary
        ><b>{t.localOnlyTitle}</b><i>{t.readMore}</i><button
          type="button"
          class="warn-x"
          title={t.dismiss}
          aria-label={t.dismiss}
          onclick={dismiss}>&times;</button
        ></summary
      >
      <p>{t.localOnly}</p>
    </details>
  {/key}
{/if}

<style>
  /* off `.warn` in style.css, declared twice there (855-861, 963) - merged
     into one rule here. */
  .warn {
    padding: 11px 14px;
    border-radius: var(--r-sm);
    line-height: 1.5;
    background: rgb(224 104 95 / 9%);
    border: 1px solid rgb(224 104 95 / 30%);
    color: #e0b6b1;
    font-size: 13px;
    position: relative;
    margin-bottom: 16px;
  }

  .warn b {
    color: #f5c0ba;
    font-weight: 650;
  }

  .warn summary {
    list-style: none;
    cursor: pointer;
    display: flex;
    gap: 8px;
    align-items: baseline;
    flex-wrap: wrap;
    padding-right: 26px;
  }

  .warn summary::-webkit-details-marker {
    display: none;
  }

  .warn summary i {
    font-style: normal;
    font-size: 12px;
    color: #e0b6b1;
    opacity: 0.75;
    text-decoration: underline;
  }

  .warn[open] summary i {
    visibility: hidden;
  }

  .warn p {
    margin: 9px 0 0;
  }

  .warn-x {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 26px;
    height: 26px;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--muted2);
    font-size: 19px;
    line-height: 1;
    border-radius: 7px;
    transition: 0.15s;
  }

  .warn-x:hover {
    background: rgb(255 255 255 / 7%);
    color: var(--txt);
  }

  /* off the keyboard-focus block in style.css, `.warn-x`'s own share of it */
  .warn-x:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
    border-radius: 8px;
  }
</style>
