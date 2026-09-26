<script lang="ts">
  /* The move's quiet status in the storage notice's slot, for a signed-in
     reader whose browser lists are this account's: moving, stopped on the
     network, and the lists that stayed - refused by the server on this page,
     or held because their account copy did not match. Nothing once the move
     is done with nothing left (docs/specs/FEATURES.md, "Account and browser
     lists"). */
  import NoticeBox from './NoticeBox.svelte';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  const t = $derived(app.t);
  const move = $derived(app.legacyMove);
  const quote = (names: readonly string[]): string =>
    names.map((n) => t.quoted.replace('%s', n)).join(', ');
  const refused = $derived(quote((move?.refused ?? []).map((r) => r.name)));
  /* A held list is named while it is still here: a delete takes it away. */
  const held = $derived.by(() => {
    const ids = app.lists.migrated.held ?? [];
    return quote(app.lists.lists.filter((l) => ids.includes(l.id)).map((l) => l.name));
  });
</script>

{#if move?.status === 'moving'}
  <div class="slot"><NoticeBox>{t.moving}</NoticeBox></div>
{:else if move?.status === 'failed'}
  <div class="slot"><NoticeBox warn>{t.moveFailed}</NoticeBox></div>
{/if}
{#if refused}
  <div class="slot">
    <NoticeBox warn
      ><b>{t.moveAttention.replace('%s', refused)}</b>{' ' + t.moveAttentionWhy}</NoticeBox
    >
  </div>
{/if}
{#if held}
  <div class="slot">
    <NoticeBox warn><b>{t.moveAttention.replace('%s', held)}</b>{' ' + t.moveHeldWhy}</NoticeBox
    >
  </div>
{/if}

<style>
  /* The storage notice's own gap below the slot. */
  .slot {
    margin-bottom: 16px;
  }

  b {
    color: var(--warn-strong);
    font-weight: 650;
  }
</style>
