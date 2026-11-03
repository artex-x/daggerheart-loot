<script lang="ts">
  /* The plain table: chip nav, a toolbar, rows or tiles, selection, and a row
     opening the record modal. Reproduced from `renderTables()` in app.js.

     One component holds every table - each `TableId` draws a real body, and
     `homebrew` (the signed-in author's own items, body `hb`) is sectioned by
     source and section the way `#/homebrew` is; with two or more sources one
     source chip (the `src` filter with one value) picks the source, and the
     headings are its sections
     (docs/decisions/2026-10-08-a-source-chip-on-the-homebrew-table-is-the-src-filter-with-one-value.md).
     Building separate page components for one route would fight the second
     use this component is heading for - search reuses the row wholesale.

     Four tables have no facet to filter by at all (`docs/specs/ROUTES.md`,
     "Filter grammar"): `core_item`, `core_consumable`, `hnf_item` and
     `hnf_consumable`. Two more offer exactly one - `kind` - and nothing else:
     `wondrous` and `dread`. `voa`, `frames` and `community` split their body
     into sections and offer `tier`, `frame` or `comm` on top of `kind`. The
     three equipment tables (`eq_weapon`, `eq_secondary`, `eq_armor`) are a
     second shape entirely: their pool is every piece of gear in the
     catalog rather than one book's rows, split into four tier sections of
     their own, with up to seven facet rows - `eqKind`, `eqFacetRows` and
     `equipOfKind`/`equipFacets` are what tell that shape apart from the
     plain one below. */
  import { onDestroy, tick, untrack } from 'svelte';
  import Button from './Button.svelte';
  import Empty from './Empty.svelte';
  import FilterPanel from './FilterPanel.svelte';
  import HelpBox from './HelpBox.svelte';
  import Icon from './Icon.svelte';
  import LoadState from './LoadState.svelte';
  import Menu from './Menu.svelte';
  import NoData from './NoData.svelte';
  import PageHead from './PageHead.svelte';
  import RecordHost from './RecordHost.svelte';
  import SearchBox from './SearchBox.svelte';
  import SectionHead from './SectionHead.svelte';
  import Seg from './Seg.svelte';
  import SignInPrompt from './SignInPrompt.svelte';
  import Switch from './Switch.svelte';
  import TableNav from './TableNav.svelte';
  import TableRows from './TableRows.svelte';
  import type { TableEntry } from './TableRows.svelte';
  import { RARITIES, rarityLabel } from '../lib/alt.js';
  import {
    equipFacets,
    equipOfKind,
    otherTableRows,
    plainFacets,
    type AltKind
  } from '../lib/data.js';
  import { facetRows, narrowRows } from '../lib/facets.js';
  import {
    chosenCount,
    chosenLabels,
    EQ_TABLE,
    groupsFor,
    passes,
    type FilterState
  } from '../lib/filters.js';
  import { FRAME_ORDER, frameName } from '../lib/frames.js';
  import { REALM_ORDER, realmName } from '../lib/realms.js';
  import { canonicalHash, homebrewItemHash, tablesHash } from '../lib/hash.js';
  import { helpFor } from '../lib/help.js';
  import {
    groupsOf,
    hbFilterFix,
    isHomebrewKey,
    isHomebrewRecord,
    pickSource,
    sectionKeysOf,
    sourceGroups,
    sourceKeyOf,
    sourcesOf
  } from '../lib/homebrew.js';
  import { kindGlyph } from '../lib/label.js';
  import { hiddenTags } from '../lib/rowTags.js';
  import { hayFor, matches, parseQuery, statLineFor } from '../lib/search.js';
  import { communities, communityName, voaSectionName, VOA_SECTIONS } from '../lib/sections.js';
  import type { AppState } from '../state/app.svelte.js';
  import { BARE_TABLE, type Record_, type TableId } from '../lib/types.js';

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  const t = $derived(app.t);
  const band = $derived(app.band);
  const index = $derived(app.index);
  /* The row pool and the facets only: `RecordHost` and `TableRows` keep `index`, so the
     «Свои предметы» switch never hides an own record inside a dialog or a row. */
  const browse = $derived(app.browse);

  /* `S.tables.t`'s default off app.js: the name in the address may be missing
     or unknown, and the live app keeps whichever table was on screen rather
     than resetting. */
  let lastTable = $state<TableId>(BARE_TABLE);
  $effect(() => {
    const route = app.route;
    if (route.kind === 'tables' && route.table) {
      /* Style only: this effect's own dependency is `app.route`, never
         `lastTable` itself, but writing a `$state` from inside an effect
         that also reads reactive state reads better with the "this is a
         write, not a two-way binding" intent made explicit, the same as
         `SearchPage.svelte`'s reset effect already does. */
      const routeTable = route.table;
      untrack(() => {
        lastTable = routeTable;
      });
    }
  });
  const table = $derived(
    app.route.kind === 'tables' ? (app.route.table ?? lastTable) : lastTable
  );

  /* The equipment tables draw a second body shape - see the header comment. */
  const eqKind = $derived(EQ_TABLE[table]);

  /* The search box is memory only - docs/specs/STATE.md is explicit that
     what was asked on a page is not remembered, and it does not touch the
     address. The view switch changes this visit; the default is the Display
     section's (docs/specs/FEATURES.md, "Tables and search"). */
  let q = $state('');
  const terms = $derived(parseQuery(q));
  const view = $derived(app.shownTablesView);
  const VIEWS = $derived([
    { value: 'list', label: t.viewList },
    { value: 'grid', label: t.viewGrid }
  ] as const);

  const help = $derived(helpFor('tables', app.lang));
  /* «Об этих данных» below 761 px opens from «Ещё»; from 761 px `PageHead` holds its own. */
  let helpOpen = $state(false);

  /* The filter is read from the address rather than mirrored - `app.route`
     already is the picked state. A filter link that arrives opens no sheet: the count
     line states the picks (docs/specs/FEATURES.md, "Tables and search"). */
  const facetGroups = $derived(groupsFor(table));
  const filterState = $derived<FilterState>(
    app.route.kind === 'tables' ? app.route.filter : {}
  );

  /* The source tabs of `#/tables/homebrew`: `hbSource` is the chosen one, null with fewer
     than two sources. On this table `src` is the tab only: the facets and `passes` leave
     it out, and every facet write carries it. */
  const hbBooks = $derived(app.homebrew?.books ?? []);
  const hbOwn = $derived(
    table === 'homebrew' ? (browse?.rows.get('homebrew') ?? []).filter(isHomebrewRecord) : []
  );
  const hbSources = $derived(sourcesOf(hbBooks, hbOwn, app.lang, t.srcHomebrew));
  const hbSource = $derived(
    table === 'homebrew'
      ? pickSource(
          hbSources,
          filterState,
          app.route.kind === 'tables' ? app.route.anchor : '',
          hbOwn,
          hbBooks
        )
      : null
  );
  /* The filter sheet below 1000 px: page memory, closed on another table. */
  let filterOpen = $state(false);
  let seenTable = $state<TableId | null>(null);
  $effect(() => {
    const tbl = table;
    untrack(() => {
      if (seenTable !== tbl) {
        seenTable = tbl;
        filterOpen = false;
      }
    });
  });

  /** Writes a filter through `replace()`. */
  function applyFilter(next: FilterState): void {
    const filter = hbSource === null ? next : { ...next, src: [hbSource] };
    app.replace(tablesHash(table, { filter }));
  }

  /* An address that disagrees with the chosen chip is written once: more than one `src`
     value, a `src` that names no held source, or a `sect` of another source. */
  $effect(() => {
    const chosen = hbSource;
    if (chosen === null) return;
    const fix = hbFilterFix(filterState, chosen, sectionKeysOf(hbBooks, chosen));
    if (fix) {
      untrack(() => {
        applyFilter(fix);
      });
    }
  });

  function pickFacet(group: string, value: string): void {
    const row = facRows.find((r) => r.group === group);
    const order = row?.values.map((v) => v.value) ?? [];
    const current = filterState[group] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : order.filter((v) => current.includes(v) || v === value);
    applyFilter({ ...filterState, [group]: next });
  }

  function clearFacet(group: string): void {
    applyFilter({ ...filterState, [group]: [] });
  }

  function resetFacets(): void {
    applyFilter({});
  }

  /* Rule 20: the empty state's «Сбросить фильтры» goes with the empty state; the focus
     goes to the first «Все» of the column, or to «Фильтры», else `#main`. */
  let filterToggle = $state<HTMLButtonElement | undefined>(undefined);
  async function resetFromEmpty(): Promise<void> {
    resetFacets();
    await tick();
    const first = document.querySelector<HTMLElement>('.fcol .frow .chip');
    (
      first ?? (filterToggle?.isConnected ? filterToggle : document.getElementById('main'))
    )?.focus();
  }

  /* The homebrew table hands out no link: its address opens nothing for anyone else
     (docs/specs/FEATURES.md, rule 17). */
  const linkable = $derived(table !== 'homebrew');

  /* Hiding the own items also drops their `src` values: a hidden value would empty the
     table. */
  function toggleOwn(): void {
    const hiding = app.homebrewShown;
    app.toggleHomebrew();
    if (!hiding) return;
    const src = filterState['src'] ?? [];
    const rest = src.filter((v) => v !== 'hb' && !isHomebrewKey(v));
    if (rest.length !== src.length) applyFilter({ ...filterState, src: rest });
  }

  async function copyFilterLink(): Promise<void> {
    await app.copied(
      () => app.env.clipboard.writeText(app.linkTo(tablesHash(table, { filter: filterState }))),
      (t) => t.filterLinkCopied
    );
  }

  const rows = $derived(
    eqKind
      ? browse
        ? equipOfKind(browse, eqKind)
        : []
      : (table === 'other_starting' || table === 'other_frames') && browse
        ? otherTableRows(browse, table)
        : (browse?.rows.get(table) ?? [])
  );
  /* The chosen chip's rows; every row of the table elsewhere. */
  const shownRows = $derived.by<readonly Record_[]>(() => {
    if (hbSource === null) return rows;
    const known = new Set(hbBooks.map((b) => b.key));
    return hbOwn.filter((r) => sourceKeyOf(r, known) === hbSource);
  });
  /* The filter the rows pass: `src` is the chip on `homebrew`, never a facet. */
  const facetState = $derived<FilterState>(
    table === 'homebrew' ? { ...filterState, src: [] } : filterState
  );
  const valueOf = $derived(
    eqKind
      ? (it: Record_, g: string) => equipFacets(it)[g] ?? ''
      : (it: Record_, g: string) => plainFacets(it)[g] ?? ''
  );
  const facPassed = $derived.by(() => {
    if (!facetGroups.length) return shownRows;
    return shownRows.filter((it) => passes(facetState, facetGroups, (g) => valueOf(it, g)));
  });
  /* The panel offers the values the shown rows answer (the chosen chip's on `homebrew`);
     a picked value stays offered, so its pill stays (docs/specs/FEATURES.md, "Tables and search"). */
  const facRows = $derived(
    browse
      ? narrowRows(
          facetRows(browse, table, t, app.lang, hbSource),
          shownRows,
          valueOf,
          facetState
        )
      : []
  );
  /* The stat line `matches` searches - shared with `altSections` below, so
     the rule lives once. `statLineFor`'s own doc comment carries the reason:
     the type word is kept here, unlike the row's own display. */
  const statLine = $derived(statLineFor(app.lang, t));
  const hay = $derived(hayFor(statLine));

  const filtered = $derived.by(() => {
    if (!terms.length) return facPassed;
    return facPassed.filter((it) => matches(it, terms, statLine, hay));
  });

  /* The count line: the chosen values in text, then the shown count, while a filter or
     a query narrows the view. */
  const chosen = $derived(chosenLabels(facRows, facetState));
  const narrowed = $derived(chosen.length > 0 || terms.length > 0);
  const countText = $derived(
    t.shownOf.replace('%n', String(filtered.length)).replace('%m', String(shownRows.length))
  );
  const values = $derived(chosen.map((c) => c.label).join(', '));

  /* The empty state's cause names the query, the values, or both. */
  const emptyCause = $derived(
    chosen.length && terms.length
      ? t.emptyBoth.replace('%q', q.trim()).replace('%v', values)
      : chosen.length
        ? t.emptyFilters.replace('%v', values)
        : t.emptyQuery.replace('%q', q.trim())
  );
  const emptyGlyph = $derived(
    eqKind === 'armor'
      ? 'kindArmor'
      : eqKind
        ? 'kindWeapon'
        : kindGlyph(table.endsWith('consumable') ? 'consumable' : 'item', undefined)
  );

  /* The tags a row hides: the ones the page already says (`rowTags.ts`). The tier and
     equipment bodies head each section with its tier. */
  const hide = $derived.by(() =>
    hiddenTags(table, facetState, bodyKind === 'tier' || bodyKind === 'eq')
  );

  async function copyTableLink(): Promise<void> {
    await app.copied(
      () =>
        app.env.clipboard.writeText(
          app.linkTo(
            tablesHash(table, hbSource === null ? {} : { filter: { src: [hbSource] } })
          )
        ),
      (t) => t.tableLinkCopied
    );
  }

  /* The «Ещё» menu below 761 px: the table link, the pin and «Об этих данных». */
  let moreOpen = $state(false);
  let moreButton = $state<HTMLButtonElement | undefined>(undefined);
  const home = $derived(tablesHash(table));
  const pinned = $derived(app.home === canonicalHash(home));

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

  async function copySectionLink(key: string): Promise<void> {
    await app.copied(
      () => app.env.clipboard.writeText(app.linkTo(tablesHash(table, { anchor: key }))),
      (t) => t.sectionLinkCopied
    );
  }

  /* Which body shape this table draws, off `renderTables()`'s own branches:
     a plain list, or one split by tier, frame, community, realm, the equipment
     tables' own tier sections, or the alternate tables' rarity/hope-fear
     columns. */
  type BodyKind = 'plain' | 'tier' | 'other' | 'comm' | 'realm' | 'eq' | 'alt' | 'hb';
  const bodyKind = $derived<BodyKind>(
    eqKind
      ? 'eq'
      : table === 'homebrew'
        ? 'hb'
        : table === 'voa'
          ? 'tier'
          : table === 'other_frames'
            ? 'other'
            : table === 'community'
              ? 'comm'
              : table === 'mwt'
                ? 'realm'
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

  const otherSections = $derived.by<Section[]>(() =>
    bodyKind !== 'other'
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

  const realmSections = $derived.by<Section[]>(() =>
    bodyKind !== 'realm'
      ? []
      : REALM_ORDER.map((id) => ({
          key: id,
          label: realmName(id, app.lang),
          entries: filtered.filter((it) => it.realm === id).map((it) => ({ it }))
        })).filter((s) => s.entries.length > 0)
  );

  /* The equipment tables' own tier sections, off `renderEquipTable`
     (`git show 23c00a6^:app.js`): `voa`'s tier body without cursed objects (`t1`-`t4`,
     then `tA` for artifact equipment) and a different source field
     (`it.eq.tier`, not `it.tier`). */
  const EQ_SECTIONS = [1, 2, 3, 4, 'A'] as const;
  const eqSections = $derived.by<Section[]>(() =>
    bodyKind !== 'eq'
      ? []
      : EQ_SECTIONS.map((n) => ({
          key: `t${String(n)}`,
          label: voaSectionName(n, t),
          entries: filtered.filter((it) => it.eq?.tier === n).map((it) => ({ it }))
        })).filter((s) => s.entries.length > 0)
  );

  /* The own items' sections, as `#/homebrew` heads them: a section's key, a source's key
     (its items outside its sections) or `hb` (no source) is the anchor. Inside a chosen
     chip the headings are that source's sections, then «Без раздела». */
  const hbSections = $derived.by<Section[]>(() =>
    bodyKind !== 'hb' || !app.homebrew
      ? []
      : (hbSource === null
          ? groupsOf(hbBooks, filtered.filter(isHomebrewRecord), app.lang, t.srcHomebrew)
          : sourceGroups(hbBooks, filtered.filter(isHomebrewRecord), hbSource, app.lang, t)
        ).map((g) => ({
          key: g.id,
          label: g.label,
          entries: g.items.map((it) => ({ it }))
        }))
  );

  /* One list, whichever of the six above is actually populated - `bodyKind`
     gates them so only one ever is, and the template draws them through a
     single branch rather than six copies of the same markup. */
  const activeSections = $derived<Section[]>(
    bodyKind === 'tier'
      ? tierSections
      : bodyKind === 'other'
        ? otherSections
        : bodyKind === 'comm'
          ? commSections
          : bodyKind === 'realm'
            ? realmSections
            : bodyKind === 'eq'
              ? eqSections
              : bodyKind === 'hb'
                ? hbSections
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
    return RARITIES.map((r) => {
      const cols: AltCol[] = (['hope', 'fear'] as const)
        .map((col) => ({
          key: col,
          label: col === 'hope' ? t.hope : t.fear,
          entries: index
            .altColumn(altKind, r, col)
            .filter((x) => !terms.length || matches(x.it, terms, statLine, hay))
        }))
        .filter((c) => c.entries.length > 0);
      return { key: r, label: rarityLabel(r, t), cols };
    }).filter((s) => s.cols.length > 0);
  });

  /* The row/section anchor - `#/tables/<table>/<key>` - off the scroll-and-
     flash block at the end of `render()` in app.js. One mechanism for both: a
     row anchor names a record id, a section anchor names a section's own key.
     Guarded on a `${navigations}|${lang}` stamp rather than firing on every
     re-render - a search or a filter pick must not re-trigger the scroll a
     link already played once, but the live app *does* re-play the scroll and
     the flash on a language switch (`render()` re-parses the anchor and runs
     the scroll-and-flash block on every call, `git show 23c00a6^:app.js`),
     so this is keyed on `app.lang` as well as `app.navigations`. The live app
     also re-plays on every other `render()` with the anchor still in the
     address - a tables search keystroke included (`git show 23c00a6^:app.js`: `S.tables.q
     = el.value; render()`) - which would drag the reader back to the anchor
     on every keystroke. That is a live defect, not reproduced here: no parity
     state types or ticks with an anchor in the address, so nothing keys it
     (`docs/specs/FEATURES.md`, "Tables and search").

     The flash is state (`flashKey`), not a class written straight onto the
     element: a view switch (list <-> grid) replaces the row's DOM node
     outright, and only a keyed re-render survives that - a plain
     `element.classList.add` would flash a node about to be discarded. It
     still *starts* immediately, same as the live app's own synchronous
     `render()` call - it is a decorative outline and does not depend on
     layout. The *scroll* waits, and the reason is not the one this comment
     used to give. It said the wait was for a font face to swap in. Measured
     before the UI font was self-hosted: no face existed, so `fonts.ready`
     settled before the first paint and the row still landed low. The face
     now loads from `/assets/`, and the wait covers it as well.

     The wait is load-bearing for a layout reason: this component's
     first layout is not its final one. Scrolling synchronously here lands the
     row 8px low - `[data-row="ci1"]`'s absolute top reads 493.97 at effect
     time against 485.97 once the page settles, and `scrollHeight` 5909
     against 5890 - so `#/tables/core_item ~ row anchor` went from exact to
     6-8% at 1100 and 768 when this was tried. `document.fonts.ready` is doing
     duty as "the document has finished loading", which is what it actually
     tracks with an empty font set, and by then the layout is final.

     What that costs is determinism, and it is the harness that pays: it
     arrives at 1100 and then sweeps the viewport down through 768 to 375, so
     a scroll deferred to the load could land on either side of a resize -
     and which side decides whether the browser's own scroll anchoring gets
     to adjust it, which is one machine giving two stable answers, 7.92% and
     8.47%, for `#/tables/core_item ~ row anchor @ en 375`. That is fixed
     where it belongs, in `tests/app/driver.js`: `ready()` now waits for
     the same promise, so the sweep cannot start before this scroll has
     happened.
     `document.fonts` does not exist in jsdom, so component tests fall through
     to an already-resolved promise. */
  let flashKey = $state('');
  let played = '';
  let flashTimer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => {
    const route = app.route;
    const anchor = route.kind === 'tables' ? route.anchor : '';
    const nav = app.navigations;
    const lang = app.lang;
    /* The own items' rows exist only once the store has read them. */
    const ready = !!index && (table !== 'homebrew' || app.homebrew?.status === 'ready');
    if (!anchor || !ready) {
      /* A route change that drops the anchor - to the same table with none,
         or to a different one entirely - has to clear a flash already in
         flight. The live app's render() rebuilds the DOM from scratch on
         every call and cannot carry a stale highlight forward; this effect
         reuses whatever row is already on screen, and the alternate tables
         reuse `ci*`/`q*` ids across tables, so a flash left running would
         light an unrelated row on the next table over. No parity state
         keys this - none navigates away from an anchor inside the 1.6s
         window - so it is a campsite fix, not a measured one. */
      untrack(() => {
        clearTimeout(flashTimer);
        flashKey = '';
      });
      return;
    }
    const stamp = `${String(nav)}|${lang}`;
    if (played === stamp) return;
    played = stamp;
    untrack(() => {
      clearTimeout(flashTimer);
      flashKey = anchor;
      flashTimer = setTimeout(() => {
        flashKey = '';
      }, 1600);
      /* `document.fonts` is declared non-optional in lib.dom, but jsdom does
         not implement it - the cast is what lets a component test run this
         effect without FontFaceSet existing at all. */
      const fonts = (document as unknown as { fonts?: { ready: Promise<unknown> } }).fonts;
      void (fonts?.ready ?? Promise.resolve()).then(() => {
        /* The lookup happens here, not above: the element the effect saw at
           trigger time can be replaced by a keyed re-render (a language
           switch swaps the row's text nodes; a view switch swaps list rows
           for grid tiles) before this promise resolves, and it is the
           element live *now* that has to scroll into view. */
        const target =
          document.getElementById('sec-' + anchor) ??
          document.querySelector<HTMLElement>(`[data-row="${anchor}"]`);
        /* A call-site `behavior` overrides tokens.css's reduced-motion
           `scroll-behavior` rule, so the choice is made here. */
        target?.scrollIntoView({
          behavior: app.env.motion.reduced() ? 'auto' : 'smooth',
          block: 'start'
        });
      });
    });
  });
  $effect(() => () => {
    clearTimeout(flashTimer);
  });

  /* The selection bar's «Все» ticks every row drawn here, all sections. */
  const drawnIds = $derived(
    bodyKind === 'alt'
      ? altSections.flatMap((s) =>
          s.cols.flatMap((c) => c.entries.map((e: { it: Record_ }) => e.it.id))
        )
      : filtered.map((it) => it.id)
  );
  $effect(() => {
    const ids = drawnIds;
    untrack(() => {
      app.setSelectable(ids);
    });
  });
  onDestroy(() => {
    app.setSelectable([]);
  });
</script>

<!-- eslint-disable @typescript-eslint/no-confusing-void-expression -- a `{@render}` tag of a
     local snippet reads as a void expression to this rule. -->
{#snippet viewSwitch()}
  <Seg
    small
    neutral
    options={VIEWS}
    value={view}
    label={t.view}
    onchange={(v: 'list' | 'grid') => {
      app.showTablesView(v);
    }}
  />
{/snippet}

{#snippet nav()}
  <TableNav {app} {table} sources={hbSources} source={hbSource} filter={filterState} />
{/snippet}

<!-- The list head (docs/specs/FEATURES.md, "Tables and search"): below 761 px the page
     name is read, not drawn, and the picker row holds the table, the view and «Ещё». -->
{#if band === 'narrow'}
  <h1 class="vh">{t.tables}</h1>
  <div class="pickrow">
    {@render nav()}
    {@render viewSwitch()}
    <div class="morewrap">
      <button
        type="button"
        class="morebtn"
        aria-haspopup="menu"
        aria-expanded={moreOpen}
        aria-controls={moreOpen ? 'tables-more' : undefined}
        bind:this={moreButton}
        onclick={() => {
          moreOpen = !moreOpen;
        }}><Icon name="more" /><span>{t.moreMenu}</span></button
      >
      {#if moreOpen && moreButton}
        <Menu
          control={moreButton}
          label={t.moreMenu}
          id="tables-more"
          cls="moremenu"
          onclose={() => {
            moreOpen = false;
          }}
        >
          {#if linkable}
            <button
              type="button"
              role="menuitem"
              tabindex="-1"
              onclick={() => {
                moreOpen = false;
                void copyTableLink();
              }}><Icon name="link" />{t.tableLink}</button
            >
          {/if}
          <button
            type="button"
            role="menuitem"
            tabindex="-1"
            onclick={() => {
              moreOpen = false;
              app.pinHome(home);
            }}><Icon name={pinned ? 'check' : 'home'} />{pinned ? t.homeOn : t.homeHint}</button
          >
          {#if help}
            <button
              type="button"
              role="menuitem"
              tabindex="-1"
              aria-expanded={helpOpen}
              onclick={() => {
                moreOpen = false;
                helpOpen = !helpOpen;
              }}>{help.button ?? t.helpHint}</button
            >
          {/if}
        </Menu>
      {/if}
    </div>
  </div>
  {#if help && helpOpen}
    <HelpBox {help} />
  {/if}
{:else}
  <PageHead {app} title={t.tables} sub="" {help} {home} extra={nav} />
{/if}

<RecordHost {app} {index}>
  {#snippet children(openRecord)}
    {#if !index}
      <NoData>{t.noData}</NoData>
    {:else if table === 'homebrew' && app.user === null}
      <div class="hbstate">
        <SignInPrompt {app} lead={t.hbTablesSignIn} after={{ hash: tablesHash('homebrew') }} />
      </div>
    {:else if table === 'homebrew' && app.homebrew?.status === 'error'}
      <div class="hbstate">
        <LoadState {t} failed text={t.hbLoadFailed} onretry={() => void app.homebrew?.load()} />
      </div>
    {:else if table === 'homebrew' && (app.user === undefined || app.homebrew?.status !== 'ready')}
      <div class="hbstate">
        <LoadState
          {t}
          failed={false}
          text={t.hbLoadFailed}
          onretry={() => void app.homebrew?.load()}
        />
      </div>
    {:else if table === 'homebrew' && !rows.length}
      <Empty>
        {t.hbEmptyTable}
        <Button href={app.href(homebrewItemHash(null))} sameTab>{t.hbNewItem}</Button>
      </Empty>
    {:else}
      {@const own = eqKind && (app.homebrew?.records.length ?? 0) > 0}
      <div class="searchrow">
        <div class="grow">
          <SearchBox
            value={q}
            placeholder={t.searchShort}
            label={t.searchPh}
            oninput={(v: string) => {
              q = v;
            }}
          />
        </div>
        {#if band !== 'wide' && facRows.length}
          <Button
            size="sm"
            variant={chosen.length ? 'toggle' : 'plain'}
            expanded={filterOpen}
            bind:el={filterToggle}
            onclick={() => {
              filterOpen = true;
            }}
            >{chosen.length
              ? t.filtersN.replace('%n', String(chosen.length))
              : t.filters}</Button
          >
        {/if}
        {#if band !== 'narrow'}
          {@render viewSwitch()}
          {#if own}
            <Switch label={t.ownSwitch} on={app.homebrewShown} onchange={toggleOwn} />
          {/if}
          {#if linkable}
            <Button title={t.tableLink} onclick={() => void copyTableLink()}>
              <Icon name="link" /><span>{t.tableLink}</span>
            </Button>
          {/if}
          {#if narrowed}<span class="count"
              ><span class="vals">{values}</span>{#if values}<span>&nbsp;·&#32;</span>{/if}<span
                class="n">{countText}</span
              ></span
            >{/if}
        {/if}
        {#if !app.selecting}
          <button
            type="button"
            class="selmode"
            onclick={() => {
              void startSelecting();
            }}>{t.selectMode}</button
          >
        {/if}
      </div>
      {#if band === 'narrow' && narrowed}
        <p class="count line">
          <span class="vals">{values}</span>{#if values}<span>&nbsp;·&#32;</span>{/if}<span
            class="n">{countText}</span
          >
        </p>
      {/if}

      <div class="body" class:withcol={band === 'wide' && facRows.length > 0}>
        {#if facRows.length}
          <FilterPanel
            {app}
            rows={facRows}
            picked={filterState}
            shown={filtered.length}
            {band}
            open={filterOpen}
            onclose={() => {
              filterOpen = false;
              filterToggle?.focus();
            }}
            onpick={pickFacet}
            onclear={clearFacet}
            onreset={resetFacets}
            oncopylink={linkable ? () => void copyFilterLink() : undefined}
            own={own && band !== 'wide'
              ? { on: app.homebrewShown, onchange: toggleOwn }
              : undefined}
          />
        {/if}
        <!-- The table, its section heads included, is the page's primary content (DESIGN.md,
             "The First-Screen Rule"); the filter column beside it is not. -->
        <div class="rowscol" data-primary>
          {#if bodyKind === 'alt'}
            {#if altSections.length === 0}
              <Empty title={t.nothing} glyph={emptyGlyph}>
                <p class="cause">{emptyCause}</p>
              </Empty>
            {:else}
              {#each altSections as s (s.key)}
                <div class="tsection" class:flash={flashKey === s.key} id={'sec-' + s.key}>
                  <SectionHead
                    label={s.label}
                    title={t.copySection}
                    oncopy={linkable
                      ? () => {
                          void copySectionLink(s.key);
                        }
                      : undefined}
                  />
                  {#each s.cols as col (col.key)}
                    <h3 class="altcol {col.key}">{col.label}</h3>
                    <TableRows
                      entries={col.entries}
                      {view}
                      {index}
                      lang={app.lang}
                      flash={flashKey}
                      ticks={app.selecting}
                      {hide}
                      {terms}
                      selected={(id: string) => app.sel.has(id)}
                      artBroken={(id: string) => app.artBroken(id)}
                      ontoggle={(id: string) => {
                        app.toggleSel(id);
                      }}
                      onartfail={(id: string) => {
                        app.markArtBroken(id);
                      }}
                      onopen={openRecord}
                    />
                  {/each}
                </div>
              {/each}
            {/if}
          {:else if filtered.length === 0}
            <Empty title={t.nothing} glyph={emptyGlyph}>
              <p class="cause">{emptyCause}</p>
              {#if chosenCount(facetState, facetGroups) > 0}
                <Button variant="primary" onclick={() => void resetFromEmpty()}
                  >{t.resetFilters}</Button
                >
              {/if}
            </Empty>
          {:else if bodyKind === 'tier' || bodyKind === 'other' || bodyKind === 'comm' || bodyKind === 'realm' || bodyKind === 'eq' || bodyKind === 'hb'}
            {#each activeSections as s (s.key)}
              <div class="tsection" class:flash={flashKey === s.key} id={'sec-' + s.key}>
                <SectionHead
                  label={s.label}
                  title={t.copySection}
                  oncopy={linkable
                    ? () => {
                        void copySectionLink(s.key);
                      }
                    : undefined}
                />
                <TableRows
                  entries={s.entries}
                  {view}
                  {index}
                  lang={app.lang}
                  flash={flashKey}
                  ticks={app.selecting}
                  {hide}
                  {terms}
                  selected={(id: string) => app.sel.has(id)}
                  artBroken={(id: string) => app.artBroken(id)}
                  ontoggle={(id: string) => {
                    app.toggleSel(id);
                  }}
                  onartfail={(id: string) => {
                    app.markArtBroken(id);
                  }}
                  onopen={openRecord}
                />
              </div>
            {/each}
          {:else}
            <TableRows
              entries={filtered.map((it) => ({ it }))}
              {view}
              {index}
              lang={app.lang}
              flash={flashKey}
              ticks={app.selecting}
              {hide}
              {terms}
              selected={(id: string) => app.sel.has(id)}
              artBroken={(id: string) => app.artBroken(id)}
              ontoggle={(id: string) => {
                app.toggleSel(id);
              }}
              onartfail={(id: string) => {
                app.markArtBroken(id);
              }}
              onopen={openRecord}
            />
          {/if}
        </div>
      </div>
    {/if}
  {/snippet}
</RecordHost>

<style>
  /* off `.page-h`, `.itemtable` and friends were already covered; what
     follows is the tables screen's own furniture. `.miss` moved to
     `NoData.svelte`. */

  /* The homebrew table's states before its rows: the search row's top margin. */
  .hbstate {
    margin-top: 16px;
  }

  /* Below 761 px: the picker, the view switch and «Ещё» on one row. */
  .pickrow {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
  }

  /* The picker is the page's only visible name here: the switch gives it the width. */
  .pickrow :global(.seg.small button) {
    padding-inline: 6px;
  }

  .morewrap {
    position: relative;
    flex: none;
  }

  .morebtn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 40px;
    padding: 0 10px;
    border: 1px solid var(--line2);
    border-radius: var(--r-sm);
    background: var(--surface);
    color: var(--txt);
    font: 600 var(--t-data) / 1 var(--ui);
  }

  .morebtn:hover {
    border-color: var(--muted2);
  }

  /* The search row: the search first, «Выбрать» last. */
  .searchrow {
    display: flex;
    gap: 8px 10px;
    flex-wrap: wrap;
    align-items: center;
    margin: 16px 0 12px;
  }

  .searchrow .grow {
    flex: 1 1 140px;
    min-width: 140px;
  }

  .selmode {
    height: 32px;
    padding: 0 11px;
    border: 1px solid var(--line2);
    border-radius: var(--r-sm);
    background: var(--surface);
    color: var(--txt);
    font: 600 var(--t-data) / 1 var(--ui);
  }

  .selmode:hover {
    border-color: var(--muted2);
  }

  /* The count line: the chosen values cut to one line, the count never cut. */
  .count {
    display: flex;
    align-items: baseline;
    min-width: 0;
    max-width: 100%;
    font-size: var(--t-data);
    color: var(--muted);
    white-space: nowrap;
  }

  .count .vals {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .count .n {
    flex: none;
    margin-left: auto;
    padding-left: 8px;
    font-variant-numeric: tabular-nums;
  }

  .count.line {
    margin: -4px 0 6px;
    line-height: 16px;
  }

  /* Below 761 px the search row is one 40 px line: the search, «Фильтры», «Выбрать». */
  @media (max-width: 760px) {
    .searchrow {
      margin: 0 0 8px;
      gap: 5px;
    }

    .searchrow :global(input[type='search']),
    .searchrow :global(.btn.sm),
    .selmode {
      height: 40px;
      padding: 0 9px;
    }
  }

  .searchrow .count {
    flex: 0 1 auto;
  }

  /* From 1000 px the filter column sits beside the rows. */
  .body.withcol {
    display: flex;
    gap: 20px;
    align-items: flex-start;
  }

  .rowscol {
    flex: 1;
    min-width: 0;
  }

  .tsection + .tsection {
    margin-top: 22px;
  }

  .cause {
    margin: 0;
    max-width: 60ch;
  }

  /* off `.tsection` and its flash keyframes - `git show 23c00a6^:style.css`. The heading
     itself (`.tsec-head`, `.tsec-link`) is `SectionHead.svelte`'s own; the
     row/tile anchor's outline (`.row.flash`, `.tilewrap.flash`) is
     `TableRows.svelte`'s. This is only the section anchor's. */
  .tsection {
    scroll-margin-top: var(--anchor-top);
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
    font: 650 var(--t-label)/1 var(--mono);
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  .altcol.hope {
    color: var(--hope);
  }

  .altcol.fear {
    color: var(--fear);
  }
</style>
