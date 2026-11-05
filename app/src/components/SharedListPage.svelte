<script lang="ts">
  /* A list somebody shared, read-only: `#/s/<token>`, an account list's share link, read
     through `app.sharedView` (off `renderSharedList` in `git show 23c00a6^:app.js`; mounted by
     `App.svelte` once `app.index` is confirmed non-null). docs/specs/FEATURES.md, "Lists"
     and "Account and browser lists".

     From 8 drawn entries, or once a query or a filter value is set, the page
     draws the search row (`ListFind`) over the entries it draws; the filter lives in the
     address (`#/s/<token>/f_<filter>`; docs/specs/FEATURES.md, "Lists"). Up to 760 px a
     row folds (`CompactRow`). */
  import { onDestroy, tick, untrack } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import Actions from './Actions.svelte';
  import Button from './Button.svelte';
  import CompactRow from './CompactRow.svelte';
  import Empty from './Empty.svelte';
  import ErrorPage from './ErrorPage.svelte';
  import HitNote from './HitNote.svelte';
  import Icon from './Icon.svelte';
  import ListFind from './ListFind.svelte';
  import LoadState from './LoadState.svelte';
  import PageTitle from './PageTitle.svelte';
  import PickQty from './PickQty.svelte';
  import RecordHost from './RecordHost.svelte';
  import RowMain from './RowMain.svelte';
  import SelMode from './SelMode.svelte';
  import SignInPrompt from './SignInPrompt.svelte';
  import StatusRegion from './StatusRegion.svelte';
  import TableRows from './TableRows.svelte';
  import { agoText } from '../lib/ago.js';
  import { sharedListOf, snapshotRecords } from '../lib/cloudLists.js';
  import { withRecords } from '../lib/homebrew.js';
  import { listFacets, type Index } from '../lib/data.js';
  import { listFacetRows } from '../lib/facets.js';
  import {
    chosenCount,
    encodeFilter,
    inForceOf,
    LIST_GROUPS,
    passes,
    toggledFilter,
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

  /* The share panel's version: a players' projection holds no GM-only entry and a GM's
     holds every entry, so its length is the count the token's card shows. */
  function shareVersion(s: NonNullable<NonNullable<typeof view>['shared']>): string {
    return cardVersion([s.list.name, s.list.player_note, s.entries.length]);
  }
  /* The bar carries the version the copy hands out once the list is read
     (docs/specs/CONTRACTS.md section 5), on the address this page is drawn for; a
     filter pick rewrites the address, and this writes the version again. */
  $effect(() => {
    const s = view?.status === 'ready' ? view.shared : null;
    const hash = app.hash;
    const route = app.route;
    if (!s || route.kind !== 'share' || route.token !== token) return;
    untrack(() => {
      app.setBarVersion(hash, shareVersion(s));
    });
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
  const inForce = $derived(inForceOf(facRows, picked));
  /* Up to 760 px a row folds; a press unfolds it (memory only, per link). */
  const narrow = $derived(app.band === 'narrow');
  const openRows = new SvelteSet<string>();
  /* The lead line's two note buttons, closed on arrival. */
  let pubOpen = $state(false);
  let gmOpen = $state(false);
  /* A row's number is its place in the list the reader holds, also while filtered. */
  const posOf = $derived(new Map((shared?.ids ?? []).map((id, i) => [id, i + 1])));
  $effect(() => {
    const ids = new Set(shared?.ids ?? []);
    untrack(() => {
      for (const id of [...openRows]) if (!ids.has(id)) openRows.delete(id);
    });
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
        openRows.clear();
        pubOpen = false;
        gmOpen = false;
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
    applyFilter(toggledFilter(facRows, inForce, group, value));
  }

  function resetFacets(): void {
    applyFilter({});
  }

  /* Rule 20: the empty state's «Сбросить всё» clears the query and the filter and goes with
     the empty state; the focus goes to «Фильтры», else the search box, else `#main`. */
  let filterToggle = $state<HTMLButtonElement | undefined>(undefined);
  async function resetFromEmpty(): Promise<void> {
    q = '';
    resetFacets();
    await tick();
    (
      (filterToggle?.isConnected ? filterToggle : null) ??
      document.querySelector<HTMLElement>('.lfind input[type="search"]') ??
      document.getElementById('main')
    )?.focus();
  }

  /* The audience and the link are read at the press: the toast is drawn later, and a
     re-read in between must not change what it says. */
  async function copyFilterLink(at: string): Promise<void> {
    const s = view?.shared;
    const gm = s?.audience === 'gm';
    const v = s ? shareVersion(s) : undefined;
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
  /* The lead line's count: the whole list, or what a query or a filter leaves of it. */
  const narrowed = $derived(q.trim() !== '' || chosenCount(inForce, LIST_GROUPS) > 0);
  const countText = $derived(
    narrowed
      ? t.shownOf.replace('%n', String(entries.length)).replace('%m', String(items.length))
      : plural(items.length, t.itemsN, app.lang)
  );

  /* Ticks that arrive with the page (a sign-in that returns with them) open the mode. */
  $effect(() => {
    if (app.sel.size > 0 && !app.selecting) {
      untrack(() => {
        app.selecting = true;
      });
    }
  });

  /* «Выбрать» opens the selection mode; the focus moves to the bar's «Все». */
  async function startSelecting(): Promise<void> {
    app.selecting = true;
    await tick();
    document.querySelector<HTMLElement>('.selbarwrap .selall input')?.focus();
  }

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

  /* The selection bar's «Все» ticks the rows drawn here. */
  $effect(() => {
    const ids = entries.map((e) => e.it.id);
    untrack(() => {
      app.setSelectable(ids);
    });
  });
  onDestroy(() => {
    app.setSelectable([]);
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
  {#snippet children(openRecord: (it: Record_) => void)}
    {#if !view || view.status === 'gone'}
      <ErrorPage title={t.shareGone}>
        {t.shareGoneSub}
        {#snippet actions()}
          <Button variant="primary" href={app.href(sectionHash('roll/std'))} sameTab
            >{t.toStart}</Button
          >
        {/snippet}
      </ErrorPage>
    {:else if view.status === 'error'}
      <ErrorPage title={t.sharedFailed}>
        {t.sharedFailedSub}
        {#snippet actions()}
          <Button variant="primary" onclick={() => void view.retry()}>{t.retry}</Button>
        {/snippet}
      </ErrorPage>
    {:else if !shared}
      <!-- The first read: no heading, which is the list's name. -->
      <LoadState {t} failed={false} text={t.sharedFailed} onretry={() => void view.retry()} />
    {:else}
      {#if view?.mine}
        <p class="ownline">
          {t.ownList}
          {#if hiddenN > 0}{`${t.ownGmOnly.replace('%n', String(hiddenN))} `}{/if}<a
            href={app.href(storedListHash(view.mine))}>{t.ownListEdit}</a
          >
        </p>
      {/if}
      <!-- The lead line: the count, the update, and a button for each note the link holds. -->
      {#snippet sub()}
        {countText}{#if view?.shared}{` · ${agoText(
            Date.parse(view.shared.updated_at),
            app.now,
            app.lang,
            app.t,
            'updated'
          )}`}{/if}{#if shared?.note}&#32;·&#32;<Button
            size="sm"
            variant="bare"
            expanded={pubOpen}
            onclick={() => {
              pubOpen = !pubOpen;
            }}>{t.note}</Button
          >{/if}{#if shared?.hnote}&#32;·&#32;<Button
            size="sm"
            variant="bare"
            expanded={gmOpen}
            onclick={() => {
              gmOpen = !gmOpen;
            }}>{t.noteGmLink}</Button
          >{/if}
      {/snippet}
      <div class="shhead">
        <PageTitle title={shared.name || t.untitled} {sub} />
      </div>
      {#if (pubOpen && shared.note) || (gmOpen && shared.hnote)}
        <div class="notes">
          {#if pubOpen}<HitNote icon="eye" label={t.notePub} text={shared.note} />{/if}
          {#if gmOpen}<HitNote icon="eyeOff" label={t.noteHid} text={shared.hnote} />{/if}
        </div>
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
        {#if !finding && entries.length && !app.selecting}
          <SelMode label={t.selectMode} onclick={() => void startSelecting()} />
        {/if}
      </Actions>
      {#if prompting && app.newListTarget === 'prompt'}
        <SignInPrompt
          {app}
          lead={t.signInToSave}
          after={{ hash: app.hash, action: { do: 'saveList' } }}
          boxed
          oncancel={() => {
            prompting = false;
          }}
        />
      {/if}
      {#if finding}
        <ListFind
          {app}
          rows={facRows}
          picked={inForce}
          shown={entries.length}
          query={q}
          onquery={(v: string) => {
            q = v;
          }}
          open={filterOpen}
          onopen={() => {
            filterOpen = true;
          }}
          onclose={() => {
            filterOpen = false;
          }}
          onpick={pickFacet}
          onclear={(group: string) => {
            applyFilter({ ...inForce, [group]: [] });
          }}
          onreset={resetFacets}
          oncopylink={() => {
            void copyFilterLink(token);
          }}
          selectable={!app.selecting && entries.length > 0}
          onselect={() => void startSelecting()}
          bind:toggle={filterToggle}
        />
      {/if}
      {#snippet compactRow(entry: { it: Record_; gmOnly?: true })}
        {@const it = entry.it}
        {@const m = metaOf(it.id)}
        <CompactRow
          {it}
          id={it.id}
          no={posOf.get(it.id) ?? 0}
          lang={app.lang}
          artBroken={(id: string) => app.artBroken(id)}
          onartfail={(id: string) => {
            app.markArtBroken(id);
          }}
          open={openRows.has(it.id)}
          ontoggle={() => {
            if (openRows.has(it.id)) openRows.delete(it.id);
            else openRows.add(it.id);
          }}
          price={(m.gold ?? 0) > 0 ? priceText(m.gold ?? 0, mode, app.lang) : undefined}
          note={!!(m.note || m.hnote)}
          gmOnly={entry.gmOnly === true}
          qtyText={(m.qty ?? 0) > 1 ? '×' + String(m.qty) : undefined}
        >
          <RowMain
            full
            {it}
            lang={app.lang}
            artBroken={(id: string) => app.artBroken(id)}
            onartfail={(id: string) => {
              app.markArtBroken(id);
            }}
            onopen={openRecord}
          />
          <HitNote icon="eye" label={t.notePub} text={m.note} />
          <HitNote icon="eyeOff" label={t.noteHid} text={m.hnote} />
          <div class="cacts">
            <Button
              size="sm"
              onclick={() => {
                openRecord(it);
              }}>{t.openCard}</Button
            >
          </div>
        </CompactRow>
      {/snippet}
      {#if items.length > 0 && entries.length === 0}
        <Empty title={t.nothing}>
          <Button size="sm" onclick={() => void resetFromEmpty()}>{t.resetAll}</Button>
        </Empty>
      {:else}
        <TableRows
          primary
          {entries}
          view="list"
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
          ticks={app.selecting}
          row={narrow ? compactRow : undefined}
        >
          {#snippet inside(it: Record_)}
            {@const m = metaOf(it.id)}
            {#if !narrow && (m.note || m.hnote)}
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
  /* `.card-acts` moved to `Actions.svelte` - `margin-bottom:18px` is the live inline style
     on this specific block, now passed as `style`. */
  .notes {
    margin: -8px 0 16px;
  }

  /* The list's name: one line up to 760 px, three lines from 761 px, cut with an ellipsis. */
  .shhead :global(.page-h) {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    overflow: hidden;
  }

  @media (max-width: 760px) {
    .shhead :global(.page-h) {
      -webkit-line-clamp: 1;
      line-clamp: 1;
    }
  }

  .shhead :global(.page-sub .btn) {
    min-height: 24px;
    padding: 0;
    vertical-align: baseline;
  }

  .ownline {
    margin: 0 0 16px;
    padding: 10px 12px;
    border: 1px solid rgb(var(--gold-rgb) / 45%);
    border-radius: var(--r-sm);
    background: rgb(var(--gold-rgb) / 6%);
    font-size: var(--t-small);
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

  .cacts {
    display: flex;
    margin-top: 8px;
  }
</style>
