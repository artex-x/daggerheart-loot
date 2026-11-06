<script lang="ts">
  /* The save status of the account lists in a sub line: «Сохранено», «Сохраняем...», or
     «Не сохранено» in the danger color with «Повторить», which sends the write buffer again
     (docs/specs/FEATURES.md, "Lists" and "Account and browser lists"). Its words are said
     through `SyncSaid`, which the page mounts with itself. */
  import { onDestroy, tick, untrack } from 'svelte';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    /** The page's lead control, which takes the focus when a pressed «Повторить» leaves. */
    after?: (() => HTMLElement | null | undefined) | undefined;
  }

  const { app, after }: Props = $props();

  const t = $derived(app.t);
  const cloud = $derived(app.cloudLists);
  const sync = $derived(cloud?.sync);
  const failed = $derived(sync === 'failed');
  const saving = $derived(sync === 'saving');

  let retry = $state<HTMLButtonElement | undefined>();
  /* Whether «Повторить» held the focus when it was pressed. */
  let pressed = false;

  /* Rule 20 (docs/specs/FEATURES.md): a focus that the leaving button dropped goes to
     `after()`, else `#main`, once the retry saves; a retry that fails gets it back. */
  function refocus(saved: boolean): void {
    pressed = false;
    void tick().then(() => {
      const at = document.activeElement;
      if (at && at !== document.body && at.isConnected) return;
      const next = saved ? after?.() : retry;
      (next?.isConnected ? next : document.getElementById('main'))?.focus();
    });
  }

  $effect(() => {
    const now = sync;
    untrack(() => {
      if (pressed && now !== 'saving') refocus(now !== 'failed');
    });
  });

  onDestroy(() => {
    if (pressed) refocus(true);
  });
</script>

<span class="sync" class:bad={failed} data-saving={saving || undefined}
  >{failed ? t.notSaved : saving ? t.saving : t.savedState}</span
>{#if failed}<button
    type="button"
    class="linkbtn"
    bind:this={retry}
    onclick={() => {
      pressed = document.activeElement === retry;
      cloud?.retry();
    }}>{t.retry}</button
  >{/if}

<style>
  .sync.bad {
    color: var(--danger-text);
    font-weight: 600;
  }

  /* The thumb target up to 600 px and 24 px from 601 px, the growth given back (DESIGN.md,
     "The Phone-First Rule"). */
  .linkbtn {
    position: relative;
    display: inline-block;
    min-width: var(--thumb);
    padding: max(0px, calc((max(24px, var(--thumb)) - 1lh) / 2)) 2px;
    margin: min(0px, calc((1lh - max(24px, var(--thumb))) / 2)) 0
      min(0px, calc((1lh - max(24px, var(--thumb))) / 2)) 4px;
    background: none;
    border: 0;
    color: var(--gold-soft);
    text-decoration: underline;
    font: inherit;
    cursor: pointer;
  }
</style>
