<script lang="ts">
  /* One table's rows or tiles, plus the "select all" bar above them - off
     `renderList()`/`selectAllHTML()`/`rowHTML()`/`tileHTML()` in app.js.

     A genuine component rather than a snippet local to `TablesPage.svelte`:
     every sectioned body (tier, frame, community, and each alternate-table
     column) draws this exact markup, so it is past "extracted on the second
     use" several times over by the time B3 adds them all in one commit. A
     child component also sidesteps calling a locally-declared snippet through
     its own `{@render}`, which eslint-plugin-svelte's void-expression rule
     currently flags even for a snippet with no return value of its own -
     confirmed with a two-line reproduction outside this file - while a real
     component, called the way every other one in this codebase already is,
     does not trip it.

     `ontoggleall` is left `undefined` for the alternate tables' own columns:
     the live app draws those straight from `rowHTML`/`tileHTML` with no
     `selectAllHTML` wrapper, unlike every other body, which goes through
     `renderList` and always gets one. */
  import type { Snippet } from 'svelte';
  import RowMain from './RowMain.svelte';
  import { artSrc } from '../lib/desc.js';
  import { dict } from '../lib/dict.js';
  import { nameOf } from '../lib/i18n.js';
  import { cardBadges } from '../lib/label.js';
  import type { Index } from '../lib/data.js';
  import type { Equip, Lang, Record_ } from '../lib/types.js';

  export interface TableEntry {
    it: Record_;
    /** Overrides `it.roll` - only the alternate tables' own die-face number
     *  does this; every other body shows the record's real roll. */
    n?: number;
    /** The shared page's `×qty · price` after the name - `RowMain`'s `rtail`. */
    tail?: string;
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
    /** Drawn right after a list-view row - the shared page's per-entry
     *  hitnotes, which the live `renderSharedList` puts between the rows,
     *  app.js 3163-3166. */
    after?: Snippet<[Record_]>;
    /** The id of the row the anchor effect is outlining right now - state
     *  rather than a DOM write, so a keyed re-render (a view switch, a
     *  language switch) keeps the outline on the right element instead of
     *  losing it to a replaced node. `TablesPage`'s `flashKey`; `undefined`
     *  for `SearchPage` and `SharedListPage`, which pass nothing. */
    flash?: string;
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
    after,
    flash
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

  const eqClass = (eq: Equip): string => `eq-${eq.t}`;
</script>

{#if ontoggleall && entries.length}
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

<div class={view === 'list' ? 'rows' : 'tgrid'}>
  {#each entries as entry (entry.it.id)}
    {@const it = entry.it}
    {@const rollNum = entry.n ?? it.roll}
    {#if view === 'list'}
      <div
        class="row"
        class:sel={selected(it.id)}
        class:flash={flash === it.id}
        data-row={it.id}
      >
        <label class="selbox" data-on={selected(it.id) ? '1' : undefined}>
          <input
            type="checkbox"
            checked={selected(it.id)}
            aria-label={t.selected}
            onchange={() => {
              ontoggle(it.id);
            }}
          />
        </label>
        <RowMain
          {it}
          {index}
          {lang}
          {artBroken}
          {onartfail}
          {onopen}
          num={rollNum}
          tail={entry.tail}
        />
      </div>
      {#if after}{@render after(it)}{/if}
    {:else}
      {@const sub = lang === 'ru' ? it.en : it.ru || ''}
      {@const n = rollNum ? String(rollNum) : tileTier(it)}
      <div
        class="tilewrap"
        class:sel={selected(it.id)}
        class:flash={flash === it.id}
        data-row={it.id}
      >
        <label class="selbox" data-on={selected(it.id) ? '1' : undefined}>
          <input
            type="checkbox"
            checked={selected(it.id)}
            aria-label={t.selected}
            onchange={() => {
              ontoggle(it.id);
            }}
          />
        </label>
        <!-- No aria-label, matching the row above: its name is its content. -->
        <!-- The number and the name must butt against each other with no
             whitespace between them, the way the live app's string
             concatenation does - `.tile-img` and `.tile-b` are display:block,
             so a stray space here is invisible on screen but still lands in
             textContent, which is what the parity harness's control-name
             check reads. The ignore below has to cover the whole button
             rather than each inner div: Prettier reformats a short tag like
             `<div class="tile-b">` back onto its own line on every format,
             reintroducing the gap, unless the whole subtree is protected at
             once. -->
        <!-- prettier-ignore -->
        <button type="button" class="tile" onclick={() => { onopen(it); }}
          ><div class="tile-img"
            >{#if n}<span class="tile-n">{n}</span>{/if}<span
              class="tile-k {it.eq ? eqClass(it.eq) : it.kind === 'consumable' ? 'cons' : 'item'}"
              title={it.eq ? cardBadges(it, lang, t)[0]?.text : it.kind === 'consumable' ? t.cons : t.item}
            ></span><img
              src={artSrc(it.img, artBroken(it.id))}
              alt=""
              loading="lazy"
              decoding="async"
              onerror={() => { onartfail(it.id); }}
            /></div
          ><div class="tile-b"
            ><b>{nameOf(it, lang)}</b>{#if sub}<span>{sub}</span>{/if}</div
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
    accent-color: var(--gold);
    width: 17px;
    height: 17px;
    margin: 0;
    cursor: pointer;
  }

  .selbox[data-on] {
    background: rgb(216 171 94 / 10%);
  }

  /* off `style.css:1013`. The row clips everything past its edge, so an
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
    font-size: 12.5px;
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
    background: none;
    width: 42px;
    align-self: stretch;
  }

  /* off `[data-row]{scroll-margin-top:...}` and `.row.flash,.tilewrap.flash`
     in style.css - the row anchor's own target, unused since B1 shipped but
     wired up for the first time in this batch. */
  :global([data-row]) {
    scroll-margin-top: 118px;
  }

  @media (max-width: 600px) {
    :global([data-row]) {
      scroll-margin-top: 132px;
    }

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

  .row {
    display: flex;
    align-items: stretch;
    width: 100%;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 11px;
    transition: 0.15s;
    overflow: hidden;
  }

  @media (hover: hover) {
    .row:hover {
      border-color: var(--gold);
    }
  }

  .row.sel {
    border-color: rgb(216 171 94 / 55%);
    background: rgb(216 171 94 / 5%);
  }

  .row.sel .selbox[data-on] {
    background: none;
  }

  /* off `.tgrid` and the `.tile*` family */
  .tgrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
    gap: 12px;
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
    border-color: var(--gold);
  }

  .tilewrap.sel .tile {
    border-color: var(--gold);
    background: rgb(216 171 94 / 7%);
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
    background: #0a0810;
  }

  .tile-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .tile-n {
    position: absolute;
    left: 7px;
    bottom: 7px;
    font: 700 11.5px/1 var(--mono);
    color: var(--gold-soft);
    background: rgb(10 8 16 / 80%);
    border-radius: 6px;
    padding: 4px 6px;
    border: 1px solid rgb(216 171 94 / 40%);
  }

  .tile-k {
    position: absolute;
    right: 7px;
    top: 7px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
  }

  .tile-k.item {
    background: var(--item);
  }

  .tile-k.cons {
    background: var(--cons);
  }

  .tile-k.eq-weapon {
    background: var(--eq-weapon);
  }

  .tile-k.eq-secondary {
    background: var(--eq-secondary);
  }

  .tile-k.eq-armor {
    background: var(--eq-armor);
  }

  .tile-b {
    padding: 9px 10px 11px;
  }

  .tile-b b {
    display: block;
    font-size: 13px;
    font-weight: 620;
    line-height: 1.32;
  }

  .tile-b span {
    display: block;
    font-size: 11px;
    color: var(--muted2);
    margin-top: 3px;
    line-height: 1.3;
  }
</style>
