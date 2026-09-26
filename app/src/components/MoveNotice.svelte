<script lang="ts">
  /* Under the header, on every page. Signed in: the one-time notice of the
     browser lists the move put into the account, and a damaged copy it
     could not read, kept until «Скрыть» and drawn only for the account that
     owns them. Signed out, before the cutoff: the banner that asks a reader
     with browser lists to sign in, hidden by «Скрыть» until the next page
     load (docs/specs/FEATURES.md, "Account and browser lists"). */
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

  /* Memory only: `Shell` never remounts this component, so the banner stays
     hidden across navigations and comes back on the next page load. */
  let hidden = $state(false);
  /* Not on `#/account`, which is the sign-in; not for a browser whose lists
     another account owns, which would move nothing. */
  const banner = $derived(
    !hidden &&
      app.user === null &&
      app.legacyWritable &&
      app.route.kind !== 'account' &&
      app.lists.lists.length > 0 &&
      m.owner === undefined
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
{:else if banner}
  <div class="movenotice">
    <NoticeBox>
      {`${t.moveBannerLead} ${t.localOnlyMove}`}
      {#snippet actions()}
        <div class="acts">
          <Button
            size="sm"
            variant="primary"
            label={t.moveBannerSignIn}
            onclick={() => {
              app.askSignIn({ hash: app.hash });
            }}>{t.signIn}</Button
          >
          <Button
            size="sm"
            label={t.moveBannerHide}
            onclick={() => {
              hidden = true;
            }}>{t.dismiss}</Button
          >
        </div>
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

  .acts {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  @media print {
    .movenotice {
      display: none;
    }
  }
</style>
