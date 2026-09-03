<script lang="ts">
  /* The plain table: chip nav, a toolbar, rows or tiles, selection, and a row
     opening the record modal. Reproduced from `renderTables()` in app.js.

     One component holds every table, including the ones this slice has not
     built: `#/tables/eq_weapon` and the rest draw the same nav and a `.todo`
     placeholder rather than crashing, so the address always resolves to
     something and the chip that leads there is never a dead link. Building
     five separate page components for one route would also fight the second
     use this component is heading for - search reuses the row wholesale.

     Four tables have no facet to filter by at all (`docs/specs/ROUTES.md`,
     "Filter grammar"): `core_item`, `core_consumable`, `hnf_item` and
     `hnf_consumable`. Two more offer exactly one - `kind` - and nothing else:
     `wondrous` and `dread`. Both groups draw in full; every other table still
     shows the nav and falls through to the placeholder until the sectioned
     bodies (B3) and the equipment facets (B4) land. */
  import { untrack } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import Button from './Button.svelte';
  import Chip from './Chip.svelte';
  import ChipRow from './ChipRow.svelte';
  import FilterBar from './FilterBar.svelte';
  import Icon from './Icon.svelte';
  import PageHead from './PageHead.svelte';
  import RecordModal from './RecordModal.svelte';
  import SectionHead from './SectionHead.svelte';
  import TableRows from './TableRows.svelte';
  import type { TableEntry } from './TableRows.svelte';
  import { RARITIES, rarityLabel } from '../lib/alt.js';
  import { plainFacets, type AltKind } from '../lib/data.js';
  import { facetRows } from '../lib/facets.js';
  import {
    chosenCount,
    encodeFilter,
    groupsFor,
    passes,
    type FilterState
  } from '../lib/filters.js';
  import { FRAME_ORDER, frameName } from '../lib/frames.js';
  import { tablesHash } from '../lib/hash.js';
  import { helpFor } from '../lib/help.js';
  import { eqLine } from '../lib/i18n.js';
  import { matches } from '../lib/search.js';
  import { communities, communityName, voaSectionName, VOA_SECTIONS } from '../lib/sections.js';
  import { TABLE_GROUPS, groupOf, subLabelOf } from '../lib/tables.js';
  import type { AppState } from '../state/app.svelte.js';
  import type { Record_, TableId } from '../lib/types.js';

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  const t = $derived(app.t);
  const index = $derived(app.index);

  /* The tables this slice draws in full - checked against data.js in
     tables.test.ts rather than assumed. Every other table id still resolves
     through the nav, and falls through to the placeholder below. */
  const KNOWN: readonly TableId[] = [
    'core_item',
    'core_consumable',
    'hnf_item',
    'hnf_consumable',
    'wondrous',
    'dread',
    'voa',
    'frames',
    'community',
    'alt_item',
    'alt_consumable'
  ];

  /* `S.tables.t`'s default off app.js: the name in the address may be missing
     or unknown, and the live app keeps whichever table was on screen rather
     than resetting. `core_item` is what a bare `#/tables` opens on. */
  let lastTable = $state<TableId>('core_item');
  $effect(() => {
    const route = app.route;
    if (route.kind === 'tables' && route.table) lastTable = route.table;
  });
  const table = $derived(
    app.route.kind === 'tables' ? (app.route.table ?? lastTable) : lastTable
  );

  const group = $derived(groupOf(table));
  const known = $derived(KNOWN.includes(table));

  /* View and the search box are memory only, same as the live app -
     docs/specs/STATE.md is explicit that what was asked on a page is not
     remembered, and neither touches the address. */
  let q = $state('');
  let view = $state<'list' | 'grid'>('list');

  /* A selection belongs to the page it was made on, and so does an open
     modal. `app.navigations` counts a real move - `go()`, or the address
     changing under the app - and not a filter pick, which rewrites the
     address with `replace()` and must keep both. Route strings cannot tell
     one table from another on their own - they all read "tables" - which is
     why a hash-only move needs this signal rather than `app.hash` itself. */
  const sel = new SvelteSet<string>();
  let open = $state<Record_ | null>(null);
  $effect(() => {
    void app.navigations;
    untrack(() => {
      sel.clear();
      open = null;
    });
  });

  let said = $state('');
  const say = (msg: string): void => {
    said = msg;
  };

  const help = $derived(helpFor('tables', app.lang));

  /* The filter is read from the address rather than mirrored - `app.route`
     already is the picked state. `seenSeg` is the one mirror this needs: the
     exact segment this component last wrote, so an effect can tell "the
     address changed under us" (open the panel, the way a filter link does)
     apart from "we just wrote it" (round-tripping is stable, so folding the
     panel and then dropping a pill does not spring it open again). */
  const facetGroups = $derived(groupsFor(table));
  const filterState = $derived<FilterState>(
    app.route.kind === 'tables' ? app.route.filter : {}
  );
  const facRows = $derived(index ? facetRows(index, table, t, app.lang) : []);

  let filterOpen = $state(false);
  let seenSeg = $state('');
  let seenTable = $state<TableId | null>(null);
  $effect(() => {
    const route = app.route;
    const tbl = table;
    const groups = groupsFor(tbl);
    untrack(() => {
      if (seenTable !== tbl) {
        seenTable = tbl;
        seenSeg = '';
        filterOpen = false;
      }
      const seg = route.kind === 'tables' ? encodeFilter(route.filter, groups) : '';
      if (seg !== seenSeg) filterOpen = true;
      seenSeg = seg;
    });
  });

  /** Writes a filter through `replace()`, and marks it as our own edit so the
   *  effect above does not treat it as a link arriving from elsewhere. */
  function applyFilter(next: FilterState): void {
    seenSeg = encodeFilter(next, facetGroups);
    app.replace(tablesHash(table, { filter: next }));
  }

  function pickFacet(group: string, value: string): void {
    const row = facRows.find((r) => r.group === group);
    const order = row?.values.map((v) => v.value) ?? [];
    const current = filterState[group] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : order.filter((v) => current.includes(v) || v === value);
    applyFilter({ ...filterState, [group]: next });
  }

  function resetFacets(): void {
    applyFilter({});
  }

  async function copyFilterLink(): Promise<void> {
    const ok = await app.env.clipboard.writeText(
      app.linkTo(tablesHash(table, { filter: filterState }))
    );
    say(ok ? t.filterLinkCopied : t.copyFailed);
  }

  const rows = $derived(index?.rows.get(table) ?? []);
  const facPassed = $derived.by(() => {
    if (!facetGroups.length) return rows;
    return rows.filter((it) =>
      passes(filterState, facetGroups, (g) => plainFacets(it)[g] ?? '')
    );
  });
  const filtered = $derived.by(() => {
    const query = q.trim().toLowerCase();
    if (!query) return facPassed;
    const labels = { tier: t.tier, thresholds: t.eqTh, armorScore: t.eqScore };
    return facPassed.filter((it) =>
      matches(it, query, (r) => eqLine(r, app.lang, labels, { noType: true }))
    );
  });

  function toggleSel(id: string): void {
    if (sel.has(id)) sel.delete(id);
    else sel.add(id);
  }

  /** "Select all" always means all of one list - the whole table for the
   *  plain body, or one section's own rows where the body is split.
   *  `TableRows` computes its own checkbox state; this only has to carry the
   *  toggle out to the shared selection. */
  function toggleAllIn(ids: readonly string[]): void {
    const on = ids.some((id) => !sel.has(id));
    for (const id of ids) {
      if (on) sel.add(id);
      else sel.delete(id);
    }
  }

  async function copyTableLink(): Promise<void> {
    const ok = await app.env.clipboard.writeText(app.linkTo(tablesHash(table)));
    say(ok ? t.tableLinkCopied : t.copyFailed);
  }

  async function copySectionLink(key: string): Promise<void> {
    const ok = await app.env.clipboard.writeText(
      app.linkTo(tablesHash(table, { anchor: key }))
    );
    say(ok ? t.sectionLinkCopied : t.copyFailed);
  }

  /* Which body shape this table draws, off `renderTables()`'s own branches:
     a plain list, or one split by tier, frame, community, or the alternate
     tables' rarity/hope-fear columns. */
  type BodyKind = 'plain' | 'tier' | 'frame' | 'comm' | 'alt';
  const bodyKind = $derived<BodyKind>(
    table === 'voa'
      ? 'tier'
      : table === 'frames'
        ? 'frame'
        : table === 'community'
          ? 'comm'
          : table === 'alt_item' || table === 'alt_consumable'
            ? 'alt'
            : 'plain'
  );

  interface Section {
    key: string;
    label: string;
    entries: TableEntry[];
  }

  const tierSections = $derived.by<Section[]>(() =>
    bodyKind !== 'tier'
      ? []
      : VOA_SECTIONS.map((k) => ({
          key: `t${String(k)}`,
          label: voaSectionName(k, t),
          entries: filtered.filter((it) => String(it.tier) === String(k)).map((it) => ({ it }))
        })).filter((s) => s.entries.length > 0)
  );

  const frameSections = $derived.by<Section[]>(() =>
    bodyKind !== 'frame'
      ? []
      : FRAME_ORDER.map((id) => ({
          key: id,
          label: frameName(id, app.lang),
          entries: filtered.filter((it) => it.frame === id).map((it) => ({ it }))
        })).filter((s) => s.entries.length > 0)
  );

  const commSections = $derived.by<Section[]>(() => {
    if (bodyKind !== 'comm' || !index) return [];
    return communities(index)
      .map((c) => ({
        key: c.id,
        label: communityName(c, app.lang),
        entries: filtered.filter((it) => it.community === c.id).map((it) => ({ it }))
      }))
      .filter((s) => s.entries.length > 0);
  });

  /* One list, whichever of the three above is actually populated - `bodyKind`
     gates them so only one ever is, and the template draws them through a
     single branch rather than three copies of the same markup. */
  const activeSections = $derived<Section[]>(
    bodyKind === 'tier'
      ? tierSections
      : bodyKind === 'frame'
        ? frameSections
        : bodyKind === 'comm'
          ? commSections
          : []
  );

  interface AltCol {
    key: 'hope' | 'fear';
    label: string;
    entries: TableEntry[];
  }
  interface AltSection {
    key: string;
    label: string;
    cols: AltCol[];
  }

  const altKind = $derived<AltKind | null>(
    table === 'alt_item' ? 'item' : table === 'alt_consumable' ? 'consumable' : null
  );

  const altSections = $derived.by<AltSection[]>(() => {
    if (!altKind || !index) return [];
    const query = q.trim().toLowerCase();
    const labels = { tier: t.tier, thresholds: t.eqTh, armorScore: t.eqScore };
    const statLine = (r: Record_): string => eqLine(r, app.lang, labels, { noType: true });
    return RARITIES.map((r) => {
      const cols: AltCol[] = (['hope', 'fear'] as const)
        .map((col) => ({
          key: col,
          label: col === 'hope' ? t.hope : t.fear,
          entries: index
            .altColumn(altKind, r, col)
            .filter((x) => !query || matches(x.it, query, statLine))
        }))
        .filter((c) => c.entries.length > 0);
      return { key: r, label: rarityLabel(r, t), cols };
    }).filter((s) => s.cols.length > 0);
  });

  /* The row/section anchor - `#/tables/<table>/<key>` - off the scroll-and-
     flash block at the end of `render()` in app.js. One mechanism for both: a
     row anchor names a record id, a section anchor names a section's own key.
     Guarded on `app.navigations` rather than firing on every re-render - a
     search or a filter pick must not re-trigger the scroll a link already
     played once.

     The flash starts immediately, same as the live app's own synchronous
     `render()` call - it is a decorative outline and does not depend on
     layout. The *scroll* waits for the page's own fonts first:
     `scrollIntoView` computes its target from the layout at the moment it is
     called, and the monospace numerals in `.rnum`/the toolbar are wide enough
     that swapping from the fallback face to the real one shifts the row a few
     pixels - a race between that swap and this effect, invisible on a fast
     machine and real on a slow one, landed the target a handful of pixels off
     in exactly the way a growing-drift bug would. Splitting the two matters:
     gating the flash behind the same wait made it start visibly later than
     the live app's, which is its own small, avoidable difference.
     `document.fonts` does not exist in jsdom, so component tests fall through
     to an already-resolved promise. */
  let anchoredAt = $state(-1);
  $effect(() => {
    const route = app.route;
    const anchor = route.kind === 'tables' ? route.anchor : '';
    const nav = app.navigations;
    const ready = known && !!index;
    if (!anchor || !ready) return;
    if (anchoredAt === nav) return;
    anchoredAt = nav;
    untrack(() => {
      const target =
        document.getElementById('sec-' + anchor) ??
        document.querySelector<HTMLElement>(`[data-row="${anchor}"]`);
      if (!target) return;
      target.classList.add('flash');
      setTimeout(() => {
        target.classList.remove('flash');
      }, 1600);
      /* `document.fonts` is declared non-optional in lib.dom, but jsdom does
         not implement it - the cast is what lets a component test run this
         effect without FontFaceSet existing at all. */
      const fonts = (document as unknown as { fonts?: { ready: Promise<unknown> } }).fonts;
      void (fonts?.ready ?? Promise.resolve()).then(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  });
</script>

<PageHead {app} title={t.tables} sub={t.subTables} {help} {say} />

<div class="panel tablenav">
  <ChipRow>
    {#each TABLE_GROUPS as g (g.id)}
      <Chip label={t[g.label]} on={g.id === group.id} href={tablesHash(g.top)} />
    {/each}
  </ChipRow>
  {#if group.subs.length > 1}
    <ChipRow sub>
      {#each group.subs as sub (sub)}
        <Chip size="sm" label={t[subLabelOf(sub)]} on={sub === table} href={tablesHash(sub)} />
      {/each}
    </ChipRow>
  {/if}
</div>

{#if !known}
  <!-- Every table this slice has not reached yet: the nav still resolves, so
       no chip is a dead end, but nothing renders a body for it. -->
  <p class="todo">{app.hash}</p>
{:else if !index}
  <p class="miss">{t.noData}</p>
{:else}
  <div class="toolbar">
    <div class="grow">
      <input
        type="search"
        value={q}
        placeholder={t.searchPh}
        oninput={(e) => {
          q = e.currentTarget.value;
        }}
      />
    </div>
    <Button title={t.tableLink} label={t.tableLink} onclick={() => void copyTableLink()}>
      <Icon name="link" /><span class="btn-lbl">{t.tableLink}</span>
    </Button>
    <div class="seg small" role="group" aria-label={t.view}>
      <button
        type="button"
        class:on={view === 'list'}
        onclick={() => {
          view = 'list';
        }}>{t.viewList}</button
      >
      <button
        type="button"
        class:on={view === 'grid'}
        onclick={() => {
          view = 'grid';
        }}>{t.viewGrid}</button
      >
    </div>
  </div>

  <FilterBar
    rows={facRows}
    picked={filterState}
    shown={filtered.length}
    total={rows.length}
    open={filterOpen}
    {t}
    ontoggle={() => {
      filterOpen = !filterOpen;
    }}
    onpick={pickFacet}
    onreset={resetFacets}
    oncopylink={() => void copyFilterLink()}
  />

  {#if bodyKind === 'alt'}
    {#if altSections.length === 0}
      <div class="empty">{t.nothing}</div>
    {:else}
      {#each altSections as s (s.key)}
        <div class="tsection" id={'sec-' + s.key} style="margin-top:20px">
          <SectionHead
            label={s.label}
            title={t.copySection}
            oncopy={() => {
              void copySectionLink(s.key);
            }}
          />
          {#each s.cols as col (col.key)}
            <h4 class="altcol {col.key}">{col.label}</h4>
            <TableRows
              entries={col.entries}
              {view}
              {index}
              lang={app.lang}
              selected={(id: string) => sel.has(id)}
              artBroken={(id: string) => app.artBroken(id)}
              ontoggle={toggleSel}
              onartfail={(id: string) => {
                app.markArtBroken(id);
              }}
              onopen={(it: Record_) => {
                open = it;
              }}
            />
          {/each}
        </div>
      {/each}
    {/if}
  {:else if filtered.length === 0}
    <div class="empty">
      {t.nothing}
      {#if chosenCount(filterState, facetGroups) > 0}
        <Button size="sm" onclick={resetFacets}>{t.resetAll}</Button>
      {/if}
    </div>
  {:else if bodyKind === 'tier' || bodyKind === 'frame' || bodyKind === 'comm'}
    {#each activeSections as s (s.key)}
      <div class="tsection" id={'sec-' + s.key} style="margin-top:22px">
        <SectionHead
          label={s.label}
          title={t.copySection}
          oncopy={() => {
            void copySectionLink(s.key);
          }}
        />
        <TableRows
          entries={s.entries}
          {view}
          {index}
          lang={app.lang}
          selected={(id: string) => sel.has(id)}
          artBroken={(id: string) => app.artBroken(id)}
          ontoggle={toggleSel}
          onartfail={(id: string) => {
            app.markArtBroken(id);
          }}
          onopen={(it: Record_) => {
            open = it;
          }}
          ontoggleall={(ids: string[]) => {
            toggleAllIn(ids);
          }}
        />
      </div>
    {/each}
  {:else}
    <TableRows
      entries={filtered.map((it) => ({ it }))}
      {view}
      {index}
      lang={app.lang}
      selected={(id: string) => sel.has(id)}
      artBroken={(id: string) => app.artBroken(id)}
      ontoggle={toggleSel}
      onartfail={(id: string) => {
        app.markArtBroken(id);
      }}
      onopen={(it: Record_) => {
        open = it;
      }}
      ontoggleall={(ids: string[]) => {
        toggleAllIn(ids);
      }}
    />
  {/if}
{/if}

<p class="sr-only" role="status" aria-live="polite">{said}</p>

{#if open && index}
  <RecordModal
    {app}
    {index}
    it={open}
    onclose={() => {
      open = null;
    }}
    onopen={(r: Record_) => {
      open = r;
    }}
  />
{/if}

<style>
  /* off `.page-h`, `.itemtable` and friends were already covered; what
     follows is the tables screen's own furniture. */
  .todo {
    color: var(--muted2);
    font-family: var(--mono);
    font-size: var(--step--1);
  }

  .miss {
    margin: 0;
    color: var(--muted);
  }

  /* off `.panel` in style.css */
  .tablenav {
    background: linear-gradient(180deg, var(--surface2), var(--surface));
    border: 1px solid var(--line);
    border-radius: var(--r);
    padding: 18px;
    box-shadow: var(--shadow);
  }

  /* off `.toolbar` */
  .toolbar {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
    /* off `.toolbar` in style.css - the 18px margin-bottom, plus the 16px
       margin-top that the live app writes inline on this specific toolbar.
       The body below it also opens with a 6px margin-top, which collapses
       against this one and never wins: adjacent margins take the larger. */
    margin: 16px 0 18px;
  }

  .toolbar .grow {
    flex: 1;
    min-width: 220px;
  }

  .toolbar input[type='search'] {
    width: 100%;
    height: 46px;
    padding: 0 14px;
    border-radius: var(--r-sm);
    background: var(--bg2);
    border: 1px solid var(--line2);
    color: var(--txt);
    font: inherit;
    font-size: 14px;
  }

  .toolbar input[type='search']:focus {
    outline: none;
    border-color: var(--gold);
  }

  @media (max-width: 900px) {
    .toolbar :global(.btn-lbl) {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    .toolbar :global(.btn) {
      padding: 0 13px;
    }
  }

  /* off `.seg` and `.seg.small` in style.css - LangSwitch draws the same rule
     for the language pair; this is the segmented control's second shape and
     not yet worth extracting on its own. */
  .seg {
    display: flex;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 3px;
  }

  .seg button {
    border: 0;
    background: transparent;
    color: var(--muted);
    border-radius: 999px;
    font-weight: 650;
    letter-spacing: 0.05em;
    transition: 0.16s;
  }

  .seg.small {
    align-self: stretch;
  }

  .seg.small button {
    padding: 4px 12px;
    font-size: 12px;
  }

  .seg button.on {
    background: var(--gold);
    color: #1a1206;
  }

  .seg button:not(.on):hover {
    color: var(--txt);
  }

  @media (max-width: 600px) {
    .seg button,
    .seg.small button {
      padding: 8px 14px;
    }
  }

  /* off `.empty` */
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 40px 0;
    text-align: center;
    color: var(--muted2);
  }

  /* off `.tsection` and its flash keyframes - style.css:536-544. The heading
     itself (`.tsec-head`, `.tsec-link`) is `SectionHead.svelte`'s own; the
     row/tile anchor's outline (`.row.flash`, `.tilewrap.flash`) is
     `TableRows.svelte`'s. This is only the section anchor's. */
  .tsection {
    scroll-margin-top: 110px;
    border-radius: var(--r);
  }

  .tsection.flash {
    animation: flash 1.6s ease-out;
  }

  @keyframes flash {
    0% {
      box-shadow:
        0 0 0 2px var(--gold),
        0 0 26px -4px rgb(216 171 94 / 50%);
    }
    70% {
      box-shadow:
        0 0 0 2px var(--gold),
        0 0 26px -4px rgb(216 171 94 / 50%);
    }
    100% {
      box-shadow: 0 0 0 0 transparent;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .tsection.flash {
      animation: none;
      outline: 2px solid var(--gold);
    }
  }

  /* off `.altcol` */
  .altcol {
    margin: 16px 0 8px;
    font: 650 11px/1 var(--mono);
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  .altcol.hope {
    color: var(--hope);
  }

  .altcol.fear {
    color: var(--fear);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
