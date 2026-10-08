<script lang="ts">
  /* A list somebody shared, read-only: `#/l/<payload>` for a payload that is
     nobody's own list (off `renderSharedList`, app.js 3130-3170; mounted by
     `ListPage.svelte`'s `{:else if route.kind === 'sharedList' && !own}`
     branch), or `#/s/<token>`, an account list's share link, read through
     `app.sharedView` (mounted by `App.svelte`). Both are mounted only once
     `app.index` is confirmed non-null. docs/specs/FEATURES.md, "Lists" and
     "Account and browser lists".

     From 8 drawn entries, or once a query or a filter value is set, the page
     draws the tables' search box and filter strip over the entries it draws;
     on `#/s/` the filter lives in the address (`#/s/<token>/f_<filter>`), on
     `#/l/` in page memory (docs/specs/FEATURES.md, "Lists"). */
  import { onDestroy, untrack } from 'svelte';
  import Actions from './Actions.svelte';
  import Button from './Button.svelte';
  import Empty from './Empty.svelte';
  import FilterBar from './FilterBar.svelte';
  import HitNote from './HitNote.svelte';
  import Icon from './Icon.svelte';
  import PageTitle from './PageTitle.svelte';
  import PickQty from './PickQty.svelte';
  import RecordHost from './RecordHost.svelte';
  import SearchBox from './SearchBox.svelte';
  import SignInPrompt from './SignInPrompt.svelte';
  import TableRows from './TableRows.svelte';
  import { agoText } from '../lib/ago.js';
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
  import { sectionHash, shareHash, storedListHash } from '../lib/hash.js';
  import { nameOf } from '../lib/i18n.js';
  import { plural } from '../lib/plural.js';
  import { decodeList, type ListEntryMeta } from '../lib/listLink.js';
  import { copyInit, gmOnlyCount, itemMeta, LIST_SEARCH_AT, takenQty } from '../lib/lists.js';
  import { moneyMode, priceText } from '../lib/money.js';
  import { hayFor, matches, parseQuery, statLineFor } from '../lib/search.js';
  import type { Record_ } from '../lib/types.js';
  import type { AppState } from '../state/app.svelte.js';

  /* Exactly one of `payload` and `token`. */
  interface Props {
    app: AppState;
    index: Index;
    payload?: string;
    token?: string;
  }

  const { app, index: base, payload, token }: Props = $props();

  const t = $derived(app.t);

  const view = $derived(token === undefined ? null : app.sharedView);
  /* A share link's frozen copies, and its owner's items for a reader who is not the owner,
     join this page's index; the reader's own items stay live (`withRecords`). A `#/l/` link
     holds catalog ids only. */
  const index = $derived(
    token === undefined ? base : withRecords(base, [], snapshotRecords(view?.shared))
  );
  const knows = (id: string): boolean => index.byId.has(id);
  /* Keyed on the token and the session only: `open` reads and writes the
     view's own state, which must not re-run this. */
  $effect(() => {
    if (token === undefined) return;
    const user = app.user;
    const v = view;
    untrack(() => {
      void v?.open(token, user === undefined ? undefined : (user?.userId ?? null));
    });
  });
  onDestroy(() => {
    view?.close();
  });
  const shared = $derived(
    token === undefined
      ? /* A `#/l/` link holds catalog ids only: a crafted payload never decodes an own key. */
        decodeList(payload ?? '', (id) => app.catalog?.byId.has(id) ?? false)
      : view?.status === 'ready' && view.shared
        ? sharedListOf(view.shared, knows)
        : null
  );
  /* The key the dropped-entries toast is told once for. */
  const shownFor = $derived(token ?? payload ?? '');

  /* `decodeList` has already dropped every id the data does not know, so this
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
  let memPicked = $state<FilterState>({});
  let filterOpen = $state(false);
  let seenSeg = $state('');
  let seenList = $state<string | null>(null);
  /* Whether the search box and the strip are drawn. Latched per list: dropping the
     last pill, clearing the query or a re-read that shrinks the list never removes
     the control that has the focus. */
  let finding = $state(false);
  const picked = $derived<FilterState>(
    token === undefined ? memPicked : app.route.kind === 'share' ? app.route.filter : {}
  );
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

  /* Another list starts unfiltered; on `#/s/` a segment this page did not write (a
     filter link) opens the panel, as `TablesPage`'s does. */
  $effect(() => {
    const list = shownFor;
    const route = app.route;
    untrack(() => {
      if (seenList !== list) {
        seenList = list;
        q = '';
        memPicked = {};
        seenSeg = '';
        filterOpen = false;
        finding = false;
      }
      if (token === undefined) return;
      const seg = route.kind === 'share' ? encodeFilter(route.filter, LIST_GROUPS) : '';
      if (seg !== seenSeg) filterOpen = true;
      seenSeg = seg;
    });
  });

  $effect(() => {
    if (
      !finding &&
      (items.length >= LIST_SEARCH_AT || q !== '' || chosenCount(inForce, LIST_GROUPS) > 0)
    )
      finding = true;
  });

  /** Writes a filter: the address on `#/s/`, marked as this page's own edit; page
   *  memory on `#/l/`, whose payload cannot carry a segment. */
  function applyFilter(next: FilterState): void {
    if (token === undefined) {
      memPicked = next;
      return;
    }
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

  /* The audience and the link are read at the press: the toast is drawn later, and a
     re-read in between must not change what it says. */
  async function copyFilterLink(at: string): Promise<void> {
    const gm = view?.shared?.audience === 'gm';
    const link = app.linkTo(shareHash(at, { filter: inForce }));
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
     0 until the account list is read. */
  const hiddenN = $derived.by((): number => {
    const mine = view?.mine;
    if (!mine || view.shared?.audience !== 'player') return 0;
    const l = app.cloudLists?.get(mine);
    return l ? gmOnlyCount(l.ids, (id) => itemMeta(l, id)) : 0;
  });
  const sub = $derived(`${t.sharedList} · ${plural(items.length, t.itemsN, app.lang)}`);

  /* The live `S.shared` (app.js 51, 3140-3141): every add-to-list menu on
     this page - the bar's, a card's - reads its meta from it. The same
     two-part shape `ListPage.svelte` uses for `syncListUrl`/`clearOpenList`,
     for the same reason. */
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
    if (target === 'cloud') {
      if (token === undefined) app.saveCopyOf(s);
      else void app.saveShareCopy(token);
      return;
    }
    if (target === 'prompt') {
      prompting = !prompting;
      return;
    }
    if (target === 'wait') return;
    const l = app.lists.create(s.name, copyInit(s));
    /* `ListStore.save()` has already toasted `saveFailed` on a refusal. */
    const name = l.name;
    if (app.lists.saved) app.say((t) => t.listCreated.replace('%s', name));
    app.openNewList(l);
  }

  /* Toasted once per distinct payload, not once per component instance -
     this page is never remounted between two plain shared-list addresses,
     so a component-lifetime flag would miss every payload after the first. */
  let toldFor = $state('');
  $effect(() => {
    const s = shared;
    if (s && s.dropped > 0 && toldFor !== shownFor) {
      toldFor = shownFor;
      const n = s.dropped;
      app.say((t, lang) => plural(n, t.droppedItems, lang));
    }
  });
</script>

<RecordHost {app} {index}>
  {#snippet children(openRecord)}
    {#if token !== undefined && (!view || view.status === 'gone')}
      <PageTitle title={t.shareGone} sub={t.shareGoneSub} />
      <Button variant="primary" href={sectionHash('roll/std')} sameTab>{t.toStart}</Button>
    {:else if token !== undefined && view?.status === 'error'}
      <PageTitle title={t.sharedFailed} sub={t.sharedFailedSub} />
      <Button variant="primary" onclick={() => void view.retry()}>{t.retry}</Button>
    {:else if token !== undefined && !shared}
      <!-- The link is being read: nothing yet, so no "no longer available"
           flashes. -->
    {:else if !shared}
      <PageTitle title={t.notFound} sub={t.badShare} />
      <Button variant="primary" href={sectionHash('roll/std')} sameTab>{t.toStart}</Button>
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
        <p class="updated">
          {agoText(Date.parse(view.shared.updated_at), app.now, app.lang, t, 'updated')}
        </p>
      {/if}
      <Actions style="margin-bottom:18px">
        <!-- Only the open prompt is announced: an aria-expanded=false on
             every signed-out shared page would name a panel nobody opened. -->
        <Button
          size="sm"
          variant="primary"
          on={prompting}
          expanded={prompting || undefined}
          disabled={app.cloning || app.legacyMove?.status === 'moving'}
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
      {#if token === undefined}
        <p class="legacy">{t.legacyLinks}</p>
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
            oncopylink={token === undefined
              ? undefined
              : () => {
                  void copyFilterLink(token);
                }}
          />
        </div>
      {/if}
      {#if items.length > 0 && entries.length === 0}
        <Empty>
          {t.nothing}
          {#if chosenCount(inForce, LIST_GROUPS) > 0}
            <Button size="sm" onclick={resetFacets}>{t.resetAll}</Button>
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
          {#snippet after(it: Record_)}
            <HitNote icon="eye" label={t.notePub} text={metaOf(it.id).note} />
            <HitNote icon="eyeOff" label={t.noteHid} text={metaOf(it.id).hnote} />
          {/snippet}
        </TableRows>
      {/if}
      {#if token !== undefined}
        <!-- Says a re-read changed what the page draws; keyed, so a second
             change is announced again. `data-live` marks a joined topic for
             the hosted E2E and draws nothing. -->
        <div class="said" role="status" data-live={view?.live ? 'live' : undefined}>
          {#key view?.changes}{#if view?.changes}<span>{t.listUpdated}</span>{/if}{/key}
        </div>
      {/if}
    {/if}
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

  /* Under the title, as the index card's «изменён N назад». */
  .updated {
    margin: -14px 0 18px;
    font-size: 12.5px;
    color: var(--muted2);
  }

  .legacy {
    margin: 0 0 18px;
    font-size: 12.5px;
    color: var(--muted2);
    max-width: 70ch;
  }

  /* Visually hidden, as `ListPage.svelte`'s `.lsaid`. */
  .said {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .ownline {
    margin: 0 0 16px;
    padding: 10px 12px;
    border: 1px solid rgb(var(--gold-rgb) / 45%);
    border-radius: var(--r-sm);
    background: rgb(var(--gold-rgb) / 6%);
    font-size: 13.5px;
  }

  /* The take line inside a ticked row, under the art: the 42px select box
     plus the row's 11px inset (docs/specs/FEATURES.md, "Lists"). No fill -
     the row's own selected wash shows through. */
  .pickrow {
    flex: 0 0 100%;
    display: flex;
    align-items: center;
    border-top: 1px solid rgb(216 171 94 / 22%);
    padding: 8px 11px 8px 53px;
  }

  @media (max-width: 600px) {
    .pickrow {
      padding-left: 49px;
    }
  }
</style>
