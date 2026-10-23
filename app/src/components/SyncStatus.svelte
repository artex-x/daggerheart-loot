<script lang="ts">
  /* The save status of the account lists in a sub line: «Сохранено», «Сохраняем...», or
     «Не сохранено» in the danger colour with «Повторить», which sends the write buffer again
     (docs/specs/FEATURES.md, "Lists" and "Account and browser lists"). Its words are said
     through `SyncSaid`, which the page mounts with itself. */
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  const t = $derived(app.t);
  const cloud = $derived(app.cloudLists);
  const failed = $derived(cloud?.sync === 'failed');
  const saving = $derived(cloud?.sync === 'saving');
</script>

<span class="sync" class:bad={failed} data-saving={saving || undefined}
  >{failed ? t.notSaved : saving ? t.saving : t.savedState}</span
>{#if failed}<button
    type="button"
    class="linkbtn"
    onclick={() => {
      cloud?.retry();
    }}>{t.retry}</button
  >{/if}

<style>
  .sync.bad {
    color: var(--danger-text);
    font-weight: 600;
  }

  .linkbtn {
    background: none;
    border: 0;
    padding: 0 2px;
    margin-left: 4px;
    color: var(--gold-soft);
    text-decoration: underline;
    font: inherit;
    cursor: pointer;
  }
</style>
