<script lang="ts">
  /* One table's rows or tiles, plus the "select all" bar above them - off
     `renderList()`/`selectAllHTML()`/`rowHTML()`/`tileHTML()` in app.js.

     A genuine component rather than a snippet local to `TablesPage.svelte`:
     every sectioned body (tier, frame, community, and each alternate-table
     column) draws this exact markup, so it is past "extracted on the second
     use" several times over by the time they are all added in one commit. A
     child component also sidesteps calling a locally-declared snippet through
     its own `{@render}`, which eslint-plugin-svelte's void-expression rule
     currently flags even for a snippet with no return value of its own -
     confirmed with a two-line reproduction outside this file - while a real
     component, called the way every other one in this codebase already is,
     does not trip it.

     `ontoggleall` draws the «Выбрать все (N)» strip for the shared page. The catalog and
     search pass none: their selection bar's «Все» is the one select-all control.

     `ticks` false (the catalog outside its selection mode) draws no tick column and no
     tile box. */
  import type { Snippet } from 'svelte';
  import ArtWell from './ArtWell.svelte';
  import Badge from './Badge.svelte';
  import Marked from './Marked.svelte';
  import RowMain from './RowMain.svelte';
  import { artSrc } from '../lib/desc.js';
  import { dict } from '../lib/dict.js';
  import { eqParts, nameOf } from '../lib/i18n.js';
  import { cardBadges, kindGlyph } from '../lib/label.js';
  import type { Index } from '../lib/data.js';
  import type { HiddenTags } from '../lib/rowTags.js';
  import type { Term } from '../lib/search.js';
  import type { Lang, Record_ } from '../lib/types.js';

  export interface TableEntry {
    it: Record_;
    /** Overrides `it.roll` - only the alternate tables' own die-face number
     *  does this; every other body shows the record's real roll. */
    n?: number;
    /** The shared page's `×qty · price` after the name - `RowMain`'s `rtail`. */
    tail?: string;
    /** The shared page's GM-only entry on a GM's link: the row's dashed look
     *  and `RowMain`'s `gmOnly`. */
    gmOnly?: true;
  }

  interface Props {
    entries: TableEntry[];
    view: 'list' | 'grid';
    index: Index;
    lang: Lang;
    selected: (id: string) => boolean;
    artBroken: (id: string) => boolean;
    ontoggle: (id: string) => void;
    onartfail: (id: string) => void;
    onopen: (it: Record_) => void;
    ontoggleall?: (ids: string[]) => void;
    /** Drawn under `RowMain` in a list-view row's second column, at most two
     *  lines (`.row`'s grid) - the shared page's entry notes and take line.
     *  The tile view draws nothing. */
    inside?: Snippet<[Record_]>;
    /** The id of the row the anchor effect is outlining right now - state
     *  rather than a DOM write, so a keyed re-render (a view switch, a
     *  language switch) keeps the outline on the right element instead of
     *  losing it to a replaced node. `TablesPage`'s `flashKey`; `undefined`
     *  for `SearchPage` and `SharedListPage`, which pass nothing. */
    flash?: string;
    /** Marks the rows as the page's primary content (DESIGN.md, "The First-Screen Rule"). */
    primary?: boolean;
    /** The tick column and the tile box; the catalog draws them in its selection mode
     *  only. */
    ticks?: boolean;
    /** The tags the page already says (`rowTags.ts`). */
    hide?: HiddenTags | undefined;
    /** The search terms the names mark. */
    terms?: readonly Term[] | undefined;
    /** A row's number reads «№ 89» (`RowMain`); a tile keeps its bare badge. */
    numLabeled?: boolean | undefined;
  }

  const {
    entries,
    view,
    index,
    lang,
    selected,
    artBroken,
    ontoggle,
    onartfail,
    onopen,
    ontoggleall,
    inside,
    flash,
    primary = false,
    ticks = true,
    hide,
    terms,
    numLabeled
  }: Props = $props();

  const t = $derived(dict(lang));

  const allSelected = $derived(entries.length > 0 && entries.every((e) => selected(e.it.id)));

  /** The rank shown on a tile with no roll number - equipment's own tier, or
   *  nothing at all. Off `tileTier()` in app.js. */
  function tileTier(it: Record_): string {
    if (it.tier === 'A' || it.tier === 'C') return it.tier;
    if (it.eq?.tier) return `${t.tier} ${String(it.eq.tier)}`;
    return '';
  }

  /** The tile's second line: the stat line for equipment, else the other-language name. */
  function tileSub(it: Record_): string {
    if (it.eq) {
      return eqParts(
        it,
        lang,
        { tier: t.tier, thresholds: t.eqTh, armorScore: t.eqScore, artifact: t.voaArtifact1 },
        { noType: true, noTier: true }
      ).join('\u00a0· ');
    }
    return (lang === 'ru' ? it.en : it.ru) || '';
  }
</script>

{#if ticks && ontoggleall && entries.length}
  {@const ids = entries.map((e) => e.it.id)}
  <label class="selall">
    <span class="selbox" data-on={allSelected ? '1' : undefined}>
      <input
        type="checkbox"
        checked={allSelected}
        onchange={() => {
          ontoggleall(ids);
        }}
      />
    </span>
    <span>{t.selectAll} ({entries.length})</span>
  </label>
{/if}

<div class={view === 'list' ? 'rows' : 'tgrid'} data-primary={primary ? '' : undefined}>
  {#each entries as entry (entry.it.id)}
    {@const it = entry.it}
    {@const rollNum = entry.n ?? it.roll}
    {#if view === 'list'}
      <div
        class="row"
        class:sel={ticks && selected(it.id)}
        class:noticks={!ticks}
        class:flash={flash === it.id}
        class:gm-only={entry.gmOnly === true}
        data-row={it.id}
      >
        {#if ticks}
          <label class="selbox" data-on={selected(it.id) ? '1' : undefined}>
            <input
              type="checkbox"
              checked={selected(it.id)}
              aria-label={nameOf(it, lang)}
              onchange={() => {
                ontoggle(it.id);
              }}
            />
          </label>
        {/if}
        <RowMain
          {it}
          {index}
          {lang}
          {artBroken}
          {onartfail}
          {onopen}
          num={rollNum}
          tail={entry.tail}
          gmOnly={entry.gmOnly}
          {hide}
          {terms}
          {numLabeled}
        />
        {#if inside}{@render inside(it)}{/if}
      </div>
    {:else}
      {@const sub = tileSub(it)}
      {@const n = rollNum ? String(rollNum) : hide?.tier ? '' : tileTier(it)}
      {@const kind = cardBadges(it, lang, t)[0]}
      <div
        class="tilewrap"
        class:sel={ticks && selected(it.id)}
        class:flash={flash === it.id}
        data-row={it.id}
      >
        {#if ticks}
          <label class="selbox" data-on={selected(it.id) ? '1' : undefined}>
            <input
              type="checkbox"
              checked={selected(it.id)}
              aria-label={nameOf(it, lang)}
              onchange={() => {
                ontoggle(it.id);
              }}
            />
          </label>
        {/if}
        <!-- No aria-label, matching the row above: its name is its content. -->
        <!-- Whitespace below is content, covering the whole button - see
             docs/specs/COVERAGE.md, "Whitespace text nodes are content". -->
        <!-- prettier-ignore -->
        <button type="button" class="tile" onclick={() => { onopen(it); }}
          ><div class="tile-img"
            >{#if n}<span class="tile-n">{n}</span>{/if}{#if kind && !hide?.kind}<span class="tile-k"
                ><Badge cls={kind.cls}>{kind.text}</Badge></span
              >{/if}<ArtWell glyph={kindGlyph(it.kind, it.eq?.t)}
              >{#if it.img && !artBroken(it.id)}<img
                src={artSrc(it.img)}
                alt=""
                loading="lazy"
                decoding="async"
                onerror={() => { onartfail(it.id); }}
              />{/if}</ArtWell
            ></div
          ><div class="tile-b"
            ><b><Marked text={nameOf(it, lang)} {terms} /></b>{#if sub}<span>{sub}</span>{/if}</div
          ></button
        >
      </div>
    {/if}
  {/each}
</div>

<style>
  /* off `.selbox` and `.selall` */
  .selbox {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 42px;
    border-right: 1px solid var(--line);
    cursor: pointer;
    transition: 0.15s;
  }

  .selbox input {
    accent-color: var(--txt);
    width: 17px;
    height: 17px;
    margin: 0;
    cursor: pointer;
  }

  /* off the row rule of `git show 23c00a6^:style.css`. The row clips everything past its edge, so an
     outside ring would only ever show one sliver of itself - a gold streak
     along the checkbox. It also fired from the mouse: `:focus-within` does
     not know how a control was reached. This rule keeps the ring inside and
     keyboard-only. */
  .selbox:has(:focus-visible) {
    outline: 2px solid var(--gold);
    outline-offset: -3px;
    border-radius: 8px;
  }

  .selall {
    display: inline-flex;
    align-items: center;
    margin-bottom: 8px;
    color: var(--muted2);
    font-size: var(--t-data);
    cursor: pointer;
    border-radius: 9px;
    padding-right: 12px;
    min-height: 38px;
    transition: 0.15s;
  }

  .selall:hover {
    color: var(--muted);
    background: rgb(255 255 255 / 3%);
  }

  .selall .selbox {
    border-right: 0;
    width: 42px;
    align-self: stretch;
  }

  /* off `[data-row]{scroll-margin-top:...}` and `.row.flash,.tilewrap.flash`
     in style.css - the row anchor's own target, unused until now, wired up
     here for the first time. */
  :global([data-row]) {
    scroll-margin-top: var(--anchor-gap);
  }

  @media (max-width: 600px) {
    .selbox {
      width: 38px;
    }
  }

  .row.flash,
  .tilewrap.flash {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
    border-radius: var(--r-sm);
  }

  /* off `.rows` and `.row` */
  .rows {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* Two columns: the select box, then `RowMain` with each `inside` line
     under it. The box spans three lines - the main line, the shared page's
     notes and its take line; a row without them keeps two empty, zero-tall lines. */
  .row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    width: 100%;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 11px;
    transition: 0.15s;
    overflow: hidden;
  }

  /* The divider and the tick target run the row's full height; the subgrid
     keeps the checkbox centered on the main line, not on the whole row. */
  .row > .selbox {
    grid-row: 1 / span 3;
    display: grid;
    grid-template-rows: subgrid;
    place-items: center;
  }

  /* Before hover and `.sel`, so they still win (docs/specs/FEATURES.md, "Account and browser lists"). */
  .row.gm-only {
    border-style: dashed;
    border-color: var(--line2);
    background: var(--bg2);
  }

  @media (hover: hover) {
    .row:hover {
      border-color: var(--gold);
    }
  }

  /* A row outside the selection mode: `RowMain` alone. */
  .row.noticks {
    grid-template-columns: minmax(0, 1fr);
  }

  /* A ticked row is lit and neutral (DESIGN.md, "The Seal Rule"): never gold, no stripe. */
  .row.sel {
    border-color: var(--muted2);
    background: var(--surface2);
  }

  /* off `.tgrid` and the `.tile*` family: two columns up to 600 px. */
  .tgrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
    gap: 12px;
  }

  @media (max-width: 600px) {
    .tgrid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
  }

  .tilewrap {
    position: relative;
  }

  .tilewrap .selbox {
    position: absolute;
    top: 6px;
    left: 6px;
    z-index: 2;
    width: 30px;
    height: 30px;
    border: 1px solid var(--line2);
    border-radius: 8px;
    background: rgb(14 12 21 / 82%);
  }

  .tilewrap.sel .selbox {
    border-color: var(--muted2);
  }

  .tilewrap.sel .tile {
    border-color: var(--muted2);
    background: var(--surface2);
  }

  .tile {
    width: 100%;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 11px;
    overflow: hidden;
    text-align: left;
    padding: 0;
    transition: 0.16s;
    display: flex;
    flex-direction: column;
  }

  @media (hover: hover) {
    .tile:hover {
      border-color: var(--gold);
      transform: translateY(-2px);
    }
  }

  .tile-img {
    flex: none;
    position: relative;
    aspect-ratio: 1;
    background: var(--art-well);
  }

  /* The roll number: Chalk on a seam border, as the row's `.rnum`; never gold. */
  .tile-n {
    position: absolute;
    left: 7px;
    bottom: 7px;
    z-index: 1;
    font: 650 var(--t-badge)/1 var(--ui);
    font-variant-numeric: tabular-nums;
    color: var(--txt);
    background: rgb(10 8 16 / 80%);
    border-radius: 6px;
    padding: 3px 5px;
    border: 1px solid var(--line2);
  }

  /* The kind on a table of more than one kind: a labeled badge, not a dot. */
  .tile-k {
    position: absolute;
    right: 7px;
    top: 7px;
    z-index: 1;
    max-width: calc(100% - 44px);
  }

  .tile-b {
    padding: 9px 10px 11px;
  }

  .tile-b b {
    display: block;
    font-size: var(--t-data);
    font-weight: 620;
    line-height: 1.32;
  }

  .tile-b span {
    display: block;
    font-size: var(--t-data);
    color: var(--muted2);
    margin-top: 3px;
    line-height: 1.3;
  }
</style>
