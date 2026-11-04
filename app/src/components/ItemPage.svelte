<script lang="ts">
  /* The page at #/h/<uuid>: one homebrew item by its id, for everyone, in the record page's
     shape. A reader sees «Предмет другого игрока» first in the line under the heading, and
     «Сохранить себе» in «Ещё» instead of «Изменить»; the author sees the own record's
     controls. A related item of the author opens its own page; a catalog record opens over
     this one. The page draws the item's latest edit, and says a changed re-read and an item
     that goes while drawn (docs/specs/FEATURES.md, "Records"). */
  import { onDestroy, tick, untrack } from 'svelte';
  import Button from './Button.svelte';
  import ErrorPage from './ErrorPage.svelte';
  import LoadState from './LoadState.svelte';
  import NoData from './NoData.svelte';
  import NoItem from './NoItem.svelte';
  import PickRow from './PickRow.svelte';
  import RecordCard from './RecordCard.svelte';
  import RecordHost from './RecordHost.svelte';
  import StatusRegion from './StatusRegion.svelte';
  import TableLink from './TableLink.svelte';
  import UpdatedLine from './UpdatedLine.svelte';
  import { isCloudId } from '../lib/cloudLists.js';
  import { cardVersion, itemHash, tablesHash } from '../lib/hash.js';
  import { isHomebrewRecord } from '../lib/homebrew.js';
  import { tableOf, whereFrom } from '../lib/label.js';
  import type { Record_ } from '../lib/types.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    id: string;
  }

  const { app, id }: Props = $props();

  /* Read once: `App.svelte` mounts a page per id, and the prop already reads the next id
     while this page goes. */
  const ownId = untrack(() => id);
  const t = $derived(app.t);
  const view = $derived(app.itemView);
  const readable = $derived(!!view && isCloudId(ownId));

  /* Opened once the session is known, so the author never sees a reader's controls flash;
     a sign-in or a sign-out reads again for the new `mine`. */
  $effect(() => {
    const v = view;
    const user = app.user;
    if (!v || !readable || user === undefined) return;
    void v.open(ownId, user?.userId ?? null);
  });
  /* Only its own item: the page for the next id may have opened it already. */
  onDestroy(() => {
    if (app.itemView?.id === ownId) app.itemView.close();
  });

  /* A sign-in that came back to an item no button copies forgets the copy it asked for. */
  $effect(() => {
    const v = view;
    if (!v || app.saveItemFor === null || app.saveItemFor !== ownId || v.id !== ownId) return;
    if (v.status === 'gone' || (v.status === 'ready' && v.mine)) app.saveItemFor = null;
  });

  const it = $derived(view?.status === 'ready' && view.id === ownId ? view.record : null);
  /* Whether this page drew its item: only then is a gone item said. */
  let wasReady = $state(false);
  $effect(() => {
    if (view?.status === 'ready' && view.id === ownId) wasReady = true;
  });
  const lost = $derived(wasReady && view?.status === 'gone' && view.id === ownId);
  /* The bar carries the version the copy hands out once the item is read
     (docs/specs/CONTRACTS.md section 5), on the address this page was drawn for. */
  $effect(() => {
    const r = it;
    const hash = app.hash;
    const route = app.route;
    if (!r || route.kind !== 'item' || route.id !== ownId) return;
    untrack(() => {
      app.setBarVersion(hash, cardVersion(r));
    });
  });
  const index = $derived(view?.index ?? null);
  const table = $derived(it && view?.mine ? tableOf(it) : null);
  const where = $derived.by(() => {
    if (!it) return '';
    const bits = [whereFrom(it, app.lang)];
    if (!view?.mine) bits.unshift(t.itemFrom);
    if (it.tier === 'A') bits.push(t.voaArtifact1);
    else if (it.tier === 'C') bits.push(t.voaCursed1);
    else if (it.eq && it.eq.tier !== 'A') bits.push(`${t.tier} ${String(it.eq.tier)}`);
    return bits.join(' · ');
  });

  /* The press takes «Повторить» out of the DOM, so the focus goes to `#main` (rule 20). */
  function retry(): void {
    void view?.retry();
    void tick().then(() => document.getElementById('main')?.focus());
  }

  /* A rung or a picture of the author's item opens its own page; a catalog record opens
     over this page. */
  function opener(openRecord: (r: Record_) => void): (r: Record_) => void {
    return (r) => {
      if (isHomebrewRecord(r) && typeof r.hid === 'string') {
        if (r.hid !== view?.id) app.go(itemHash(r.hid));
      } else openRecord(r);
    };
  }
</script>

<RecordHost {app} {index}>
  {#snippet children(openRecord: (r: Record_) => void)}
    {#if !app.catalog}
      <NoData>{t.noData}</NoData>
    {:else if !readable || view?.status === 'gone'}
      <NoItem {app} />
    {:else if view?.status === 'error'}
      <ErrorPage title={t.itemFailed}>
        {t.sharedFailedSub}
        {#snippet actions()}
          <Button variant="primary" onclick={retry}>{t.retry}</Button>
        {/snippet}
      </ErrorPage>
    {:else if !it || !index}
      <LoadState {t} failed={false} text={t.itemFailed} onretry={() => void view?.retry()} />
    {:else}
      {#snippet sub()}
        <p class="subline">
          {where}
          {#if table}
            <TableLink
              href={app.href(tablesHash(table, { anchor: it.id }))}
              label={t.showInTable}
            />
          {/if}
        </p>
        {#if view?.updatedAt}<UpdatedLine {app} at={view.updatedAt} />{/if}
      {/snippet}

      <div class="itempage" data-primary>
        <RecordCard
          dossier
          heading="h1"
          {sub}
          {it}
          {index}
          lang={app.lang}
          artBroken={app.artBroken(it.id)}
          onartfail={(bad: string) => {
            app.markArtBroken(bad);
          }}
          onopen={opener(openRecord)}
          manage={view?.mine ?? false}
        >
          {#snippet pick()}
            <PickRow {app} {it} {index} owner={view?.mine ?? false} />
          {/snippet}
        </RecordCard>
      </div>
    {/if}
    {#if readable}
      <!-- Mounted across the ready, gone and error branches; keyed, so a second change
           is said again. -->
      <StatusRegion
        text={lost ? t.noItem : view?.changes ? t.itemUpdated : ''}
        key={lost ? -1 : view?.changes}
      />
    {/if}
  {/snippet}
</RecordHost>
