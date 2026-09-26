<script lang="ts">
  /* The one-time notice under the header, on every page: the browser lists
     the move put into the account, and a damaged copy it could not read.
     Kept until «Скрыть», and drawn only for the account that owns them
     (docs/specs/FEATURES.md, "Account and browser lists"). */
  import Button from './Button.svelte';
  import NoticeBox from './NoticeBox.svelte';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  const t = $derived(app.t);
  const m = $derived(app.lists.migrated);
  const names = $derived(m.notice ?? []);
  const bad = $derived(m.bad === true);
  const shown = $derived(
    !!app.user && app.user.userId === m.owner && (names.length > 0 || bad)
  );
  /* The names first, then the damaged backup, either alone when only one applies. */
  const text = $derived(
    [
      names.length
        ? t.movedNotice.replace('%s', names.map((n) => t.quoted.replace('%s', n)).join(', '))
        : '',
      bad ? t.movedBad : ''
    ]
      .filter(Boolean)
      .join(' ')
  );
</script>

{#if shown}
  <div class="movenotice">
    <NoticeBox>
      {text}
      {#snippet actions()}
        <Button
          size="sm"
          onclick={() => {
            app.lists.dismissNotice();
          }}>{t.dismiss}</Button
        >
      {/snippet}
    </NoticeBox>
  </div>
{/if}

<style>
  /* Between the header and the page, at the page's width. */
  .movenotice {
    width: var(--wrap);
    margin: 14px auto 0;
  }

  @media print {
    .movenotice {
      display: none;
    }
  }
</style>
