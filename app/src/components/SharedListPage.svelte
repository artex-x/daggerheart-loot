<script lang="ts">
  /* A list somebody shared, read-only: `#/s/<token>`, an account list's share link, read
     through `app.sharedView` (off `renderSharedList` in `git show 23c00a6^:app.js`; mounted by
     `App.svelte` once `app.index` is confirmed non-null). docs/specs/FEATURES.md, "Lists"
     and "Account and browser lists".

     From 8 drawn entries, or once a query or a filter value is set, the page
     draws the tables' search box and filter strip over the entries it draws;
     the filter lives in the address (`#/s/<token>/f_<filter>`; docs/specs/FEATURES.md,
     "Lists"). */
  import { onDestroy, tick, untrack } from 'svelte';
  import Actions from './Actions.svelte';
  import Button from './Button.svelte';
  import Empty from './Empty.svelte';
  import FilterBar from './FilterBar.svelte';
  import HitNote from './HitNote.svelte';
  import Icon from './Icon.svelte';
  import LoadState from './LoadState.svelte';
  import PageTitle from './PageTitle.svelte';
  import PickQty from './PickQty.svelte';
  import RecordHost from './RecordHost.svelte';
  import SearchBox from './SearchBox.svelte';
  import SignInPrompt from './SignInPrompt.svelte';
  import StatusRegion from './StatusRegion.svelte';
  import TableRows from './TableRows.svelte';
  import UpdatedLine from './UpdatedLine.svelte';
  import { sharedListOf, snapshotRecords } from '../lib/cloudLists.js';
  import { withRecords } from '../lib/homebrew.js';
  import { listFacets, type Index } from '../lib/data.js';
  import { listFacetRows } from '../lib/facets.js';
  import {
    chosenCount,
    encodeFilter,
    LIST_GROUPS,
    passes,
    type FilterState
  } from '../lib/filters.js';
  import { cardVersion, sectionHash, shareHash, storedListHash } from '../lib/hash.js';
  import { nameOf } from '../lib/i18n.js';
  import { plural } from '../lib/plural.js';
  import {
    gmOnlyCount,
    itemMeta,
    LIST_SEARCH_AT,
    takenQty,
    type ListEntryMeta
  } from '../lib/lists.js';
  import { moneyMode, priceText } from '../lib/money.js';
  import { hayFor, matches, parseQuery, statLineFor } from '../lib/search.js';
  import type { Record_ } from '../lib/types.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    index: Index;
    token: string;
  }

  const { app, index: base, token }: Props = $props();

  const t = $derived(app.t);

  const view = $derived(app.sharedView);
  /* A share link's frozen copies, and its owner's items for a reader who is not the owner,
     join this page's index; the reader's own items stay live (`withRecords`). */
  const index = $derived(withRecords(base, [], snapshotRecords(view?.shared)));
  const knows = (id: string): boolean => index.byId.has(id);
  /* Keyed on the token and the session only: `open` reads and writes the
     view's own state, which must not re-run this. */
  $effect(() => {
    const at = token;
    const user = app.user;
    const v = view;
    untrack(() => {
      void v?.open(at, user === undefined ? undefined : (user?.userId ?? null));
    });
  });
  onDestroy(() => {
    view?.close();
  });
  const shared = $derived(
    view?.status === 'ready' && view.shared ? sharedListOf(view.shared, knows) : null
  );

  /* `sharedListOf` has already dropped every id the data does not know, so this
     never filters anything out in practice - the guard is only what keeps
     `byId`'s possible `undefined` out of the array's type. */
  const byId = (id: string): Record_ | undefined => index.byId.get(id);
  const items = $derived(
    shared ? shared.ids.map(byId).filter((it): it is Record_ => it != null) : []
  );
  const mode = $derived(moneyMode(shared));
  const metaOf = (id: string): ListEntryMeta => shared?.meta?.[id] ?? {};

  /* The live `rowHTML(it, '', tail)`'s own `tail`: a bare quantity, a
     quantity with a price, or a bare price - '×' is U+00D7, the separator
     U+00B7, the same bytes the live app prints. */
  function tailOf(id: string): string | undefined {
    const m = metaOf(id);
    const bits: string[] = [];
    if ((m.qty ?? 0) > 1) bits.push('×' + String(m.qty));
    if ((m.gold ?? 0) > 0) bits.push(priceText(m.gold ?? 0, mode, app.lang));
    return bits.length ? bits.join(' · ') : undefined;
  }

  /* The filter. The facets read only `items`, what this reader's page draws, so a
     players' link never offers a GM-only entry's value. A picked value no row offers
     is not in force: no pill, no narrowing (docs/specs/ROUTES.md, "Filter grammar"). */
  let q = $state('');
  let filterOpen = $state(false);
  let seenSeg = $state('');
  let seenList = $state<string | null>(null);
  /* The token the view was ready for: a revoke is said only for a link this page drew,
     never for a first read that finds nothing, also right after another token. */
  let readyFor = $state<string | null>(null);
  /* Whether the search box and the strip are drawn. Latched per list: dropping the
     last pill, clearing the query or a re-read that shrinks the list never removes
     the control that has the focus. */
  let finding = $state(false);
  const picked = $derived<FilterState>(app.route.kind === 'share' ? app.route.filter : {});
  const facRows = $derived(listFacetRows(items, t, app.lang));
  const inForce = $derived.by<FilterState>(() => {
    const out: FilterState = {};
    for (const row of facRows) {
      const on = picked[row.group] ?? [];
      const kept = row.values.map((v) => v.value).filter((v) => on.includes(v));
      if (kept.length) out[row.group] = kept;
    }
    return out;
  });

  /* Another list starts unfiltered; a segment this page did not write (a filter link)
     opens the panel, as `TablesPage`'s does. */
  $effect(() => {
    const list = token;
    const route = app.route;
    untrack(() => {
      if (seenList !== list) {
        seenList = list;
        q = '';
        seenSeg = '';
        filterOpen = false;
        finding = false;
        readyFor = null;
      }
      const seg = route.kind === 'share' ? encodeFilter(route.filter, LIST_GROUPS) : '';
      if (seg !== seenSeg) filterOpen = true;
      seenSeg = seg;
    });
  });

  $effect(() => {
    if (view?.status === 'ready' && view.token === token) readyFor = token;
  });
  const revoked = $derived(
    view?.status === 'gone' && view.token === token && readyFor === token
  );

  $effect(() => {
    if (
      !finding &&
      (items.length >= LIST_SEARCH_AT || q !== '' || chosenCount(inForce, LIST_GROUPS) > 0)
    )
      finding = true;
  });

  /** Writes a filter into the address, marked as this page's own edit. */
  function applyFilter(next: FilterState): void {
    seenSeg = encodeFilter(next, LIST_GROUPS);
    app.replace(shareHash(token, { filter: next }));
  }

  function pickFacet(group: string, value: string): void {
    const order = facRows.find((r) => r.group === group)?.values.map((v) => v.value) ?? [];
    const current = inForce[group] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : order.filter((v) => current.includes(v) || v === value);
    applyFilter({ ...inForce, [group]: next });
  }

  function resetFacets(): void {
    applyFilter({});
  }

  /* Rule 20: the empty state's «Сбросить всё» goes with it; focus goes to «Фильтры». */
  let filterToggle = $state<HTMLButtonElement | undefined>(undefined);
  async function resetFromEmpty(): Promise<void> {
    resetFacets();
    await tick();
    (filterToggle?.isConnected ? filterToggle : document.getElementById('main'))?.focus();
  }

  /* The audience and the link are read at the press: the toast is drawn later, and a
     re-read in between must not change what it says. */
  async function copyFilterLink(at: string): Promise<void> {
    const s = view?.shared;
    const gm = s?.audience === 'gm';
    /* The share panel's version: a players' projection holds no GM-only entry and a GM's
       holds every entry, so its length is the count the token's card shows. */
    const v = s ? cardVersion([s.list.name, s.list.player_note, s.entries.length]) : undefined;
    const link = app.linkTo(shareHash(at, { filter: inForce }), v);
    await app.copied(
      () => app.env.clipboard.writeText(link),
      (t) => (gm ? t.gmFilterLinkCopied : t.filterLinkCopied)
    );
  }

  const statLine = $derived(statLineFor(app.lang, t));
  const hay = $derived(hayFor(statLine));
  const shownItems = $derived.by(() => {
    const passed = items.filter((it) => {
      const f = listFacets(it);
      return passes(inForce, LIST_GROUPS, (g) => f[g] ?? '');
    });
    const terms = parseQuery(q);
    return terms.length ? passed.filter((it) => matches(it, terms, statLine, hay)) : passed;
  });

  const entries = $derived(
    shownItems.map((it) => {
      const tail = tailOf(it.id);
      const entry = tail === undefined ? { it } : { it, tail };
      return metaOf(it.id).gmOnly === true ? { ...entry, gmOnly: true as const } : entry;
    })
  );
  /* The owner on the own players' link: how many entries the link leaves out.
     0 until that list's entries are read, and after a failed read (the count is a hint). */
  const hiddenN = $derived.by((): number => {
    const mine = view?.mine;
    const cloud = app.cloudLists;
    if (!mine || view.shared?.audience !== 'player' || cloud?.detailOf(mine) !== 'ready') {
      return 0;
    }
    const l = cloud.get(mine);
    return l ? gmOnlyCount(l.ids, (id) => itemMeta(l, id)) : 0;
  });
  $effect(() => {
    const mine = view?.mine;
    const cloud = app.cloudLists;
    if (
      mine &&
      view.shared?.audience === 'player' &&
      cloud?.status === 'ready' &&
      cloud.get(mine) &&
      cloud.detailOf(mine) === 'absent'
    ) {
      void cloud.detail([mine]);
    }
  });
  const sub = $derived(`${t.sharedList} · ${plural(items.length, t.itemsN, app.lang)}`);

  /* The live `S.shared` (`git show 23c00a6^:app.js`): every add-to-list menu on
     this page - the bar's, a card's - reads its meta from it. Cleared in
     `onDestroy`, not in an effect cleanup, which runs before every re-run. */
  $effect(() => {
    app.shared = shared;
    /* An entry the list no longer holds leaves the selection, so the bar counts only drawn rows. */
    if (shared) {
      const ids = shared.ids;
      untrack(() => {
        app.keepTicksIn(ids);
      });
    }
  });
  onDestroy(() => {
    app.shared = null;
  });

  /* Signed out, «Сохранить себе» opens the sign-in prompt under it; the
     sign-in comes back here and saves into the account by itself. */
  let prompting = $state(false);

  function saveShared(): void {
    const s = shared;
    if (!s) return;
    const target = app.newListTarget;
    if (target === 'cloud') void app.saveShareCopy(token);
    else if (target === 'prompt') prompting = !prompting;
  }

  /* Toasted once per distinct token, not once per component instance -
     this page is never remounted between two share links, so a
     component-lifetime flag would miss every token after the first. */
  let toldFor = $state('');
  $effect(() => {
    const s = shared;
    if (s && s.dropped > 0 && toldFor !== token) {
      toldFor = token;
      const n = s.dropped;
      app.say((t, lang) => plural(n, t.droppedItems, lang));
    }
  });
</script>

<RecordHost {app} {index}>
  {#snippet children(openRecord)}
    {#if !view || view.status === 'gone'}
      <PageTitle title={t.shareGone} sub={t.shareGoneSub} />
      <Button variant="primary" href={sectionHash('roll/std')} sameTab>{t.toStart}</Button>
    {:else if view.status === 'error'}
      <PageTitle title={t.sharedFailed} sub={t.sharedFailedSub} />
      <Button variant="primary" onclick={() => void view.retry()}>{t.retry}</Button>
    {:else if !shared}
      <!-- The first read: no heading, which is the list's name. -->
      <LoadState {t} failed={false} text={t.sharedFailed} onretry={() => void view.retry()} />
    {:else}
      {#if view?.mine}
        <p class="ownline">
          {t.ownList}
          {#if hiddenN > 0}{`${t.ownGmOnly.replace('%n', String(hiddenN))} `}{/if}<a
            href={storedListHash(view.mine)}>{t.ownListEdit}</a
          >
        </p>
      {/if}
      <PageTitle title={shared.name || t.untitled} {sub} />
      {#if view?.shared}
        <UpdatedLine {app} at={view.shared.updated_at} />
      {/if}
      <Actions style="margin-bottom:18px">
        <!-- Only the open prompt is announced: an aria-expanded=false on
             every signed-out shared page would name a panel nobody opened. -->
        <Button
          size="sm"
          variant="primary"
          on={prompting}
          expanded={prompting || undefined}
          disabled={app.cloning}
          onclick={saveShared}><Icon name="plus" />{t.saveShared}</Button
        >
      </Actions>
      {#if prompting && app.newListTarget === 'prompt'}
        <SignInPrompt
          {app}
          lead={t.signInToSave}
          after={{ hash: app.hash, action: { do: 'saveList' } }}
          boxed
        />
      {/if}
      {#if shared.note || shared.hnote}
        <div class="notes">
          <HitNote icon="eye" label={t.notePub} text={shared.note} />
          <HitNote icon="eyeOff" label={t.noteHid} text={shared.hnote} />
        </div>
      {/if}
      {#if finding}
        <div class="lfind">
          <SearchBox
            value={q}
            placeholder={t.searchPh}
            oninput={(v: string) => {
              q = v;
            }}
          />
          <FilterBar
            rows={facRows}
            picked={inForce}
            shown={entries.length}
            total={items.length}
            open={filterOpen}
            {t}
            ontoggle={() => {
              filterOpen = !filterOpen;
            }}
            onpick={pickFacet}
            onreset={resetFacets}
            oncopylink={() => {
              void copyFilterLink(token);
            }}
            bind:toggleEl={filterToggle}
          />
        </div>
      {/if}
      {#if items.length > 0 && entries.length === 0}
        <Empty>
          {t.nothing}
          {#if chosenCount(inForce, LIST_GROUPS) > 0}
            <Button size="sm" onclick={() => void resetFromEmpty()}>{t.resetAll}</Button>
          {/if}
        </Empty>
      {:else}
        <TableRows
          {entries}
          view="list"
          {index}
          lang={app.lang}
          selected={(id: string) => app.sel.has(id)}
          artBroken={(id: string) => app.artBroken(id)}
          ontoggle={(id: string) => {
            app.toggleSel(id);
          }}
          onartfail={(id: string) => {
            app.markArtBroken(id);
          }}
          onopen={openRecord}
          ontoggleall={(ids: string[]) => {
            app.toggleAllIn(ids);
          }}
        >
          {#snippet inside(it: Record_)}
            {@const m = metaOf(it.id)}
            {#if m.note || m.hnote}
              <!-- Inside the row's border, as the owner's list page draws them: drawn after
                   the row they read as the next entry's notes. -->
              <div class="rnotes">
                <HitNote icon="eye" label={t.notePub} text={m.note} />
                <HitNote icon="eyeOff" label={t.noteHid} text={m.hnote} />
              </div>
            {/if}
            {#if app.sel.has(it.id) && (m.qty ?? 0) > 1}
              {@const taken = takenQty(m, app.picked.get(it.id))}
              <div class="pickrow">
                <PickQty
                  value={taken}
                  max={m.qty ?? 1}
                  label={t.pickQty}
                  ofText={t.pickOf.replace('%n', String(m.qty ?? 1))}
                  sum={priceText((m.gold ?? 0) * taken, mode, app.lang)}
                  name={t.pickQtyOf.replace('%s', nameOf(it, app.lang))}
                  minText={t.pickMin}
                  maxText={t.pickMax}
                  minName={t.pickMinOf.replace('%s', nameOf(it, app.lang))}
                  maxName={t.pickMaxOf.replace('%s', nameOf(it, app.lang))}
                  onchange={(n: number) => {
                    app.pick(it.id, n);
                  }}
                />
              </div>
            {/if}
          {/snippet}
        </TableRows>
      {/if}
    {/if}
    <!-- Mounted across every branch, so a revoke of a drawn link is said once
         (docs/specs/FEATURES.md, "Account and browser lists"). Says a re-read
         changed what the page draws; keyed, so a second change is announced
         again. `data-live` marks a joined topic for the hosted E2E and draws
         nothing. -->
    <StatusRegion
      text={revoked ? t.shareGone : view?.changes ? t.listUpdated : ''}
      key={revoked ? -1 : view?.changes}
      live={view?.live}
    />
  {/snippet}
</RecordHost>

<style>
  /* `.page-h`/`.page-sub` moved to `PageTitle.svelte`, `.card-acts` to
     `Actions.svelte` - `margin-bottom:18px` is the live inline style
     on this specific block, now passed as `style` rather than folded into a
     rule of this component's own. */
  .notes {
    margin-bottom: 18px;
  }

  /* The search box and the filter strip, between the notes and the rows; the
     strip sits 12px under the box. */
  .lfind {
    margin: 0 0 18px;
  }

  .lfind :global(.fbar) {
    margin-top: 12px;
  }

  .ownline {
    margin: 0 0 16px;
    padding: 10px 12px;
    border: 1px solid rgb(var(--gold-rgb) / 45%);
    border-radius: var(--r-sm);
    background: rgb(var(--gold-rgb) / 6%);
    font-size: 13.5px;
  }

  /* The take line inside a ticked row, in the column right of the select box
     at the row's 11px inset (docs/specs/FEATURES.md, "Lists"). No fill -
     the row's own selected wash shows through. */
  .pickrow {
    display: flex;
    align-items: center;
    border-top: 1px solid rgb(216 171 94 / 22%);
    padding: 8px 11px;
  }

  /* An entry's notes, under its main line at the take line's inset. */
  .rnotes {
    min-width: 0;
    padding: 0 11px 11px;
  }

  .rnotes :global(.hitnote:first-child) {
    margin-top: 0;
  }
</style>
