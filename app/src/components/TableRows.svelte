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
  import Icon from './Icon.svelte';
  import { artSrc, descParts } from '../lib/desc.js';
  import { dict } from '../lib/dict.js';
  import { descOf, eqLine, nameOf } from '../lib/i18n.js';
  import { cardBadges, srcLabel } from '../lib/label.js';
  import type { Index } from '../lib/data.js';
  import type { Equip, Lang, Record_ } from '../lib/types.js';

  export interface TableEntry {
    it: Record_;
    /** Overrides `it.roll` - only the alternate tables' own die-face number
     *  does this; every other body shows the record's real roll. */
    n?: number;
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
    ontoggleall
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

  const upgradeOf = (it: Record_): Record_ | undefined =>
    it.craft ? index.byId.get(it.craft) : undefined;
  const madeFromOf = (it: Record_): Record_ | undefined => {
    const from = index.craftedFrom.get(it.id);
    return from ? index.byId.get(from) : undefined;
  };
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
      {@const upgrade = upgradeOf(it)}
      {@const madeFrom = madeFromOf(it)}
      <div class="row" class:sel={selected(it.id)} data-row={it.id}>
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
        <!-- No aria-label: the live app leaves this button's name to its
             content, so the row's accessible name is the whole row - name,
             stat line, description and badges. Verbose, but a divergence here
             is a divergence the inventory spec would have to carry as an
             ACCEPTED entry forever. -->
        <button
          type="button"
          class="row-main"
          onclick={() => {
            onopen(it);
          }}
        >
          <img
            src={artSrc(it.img, artBroken(it.id))}
            alt=""
            loading="lazy"
            decoding="async"
            onerror={() => {
              onartfail(it.id);
            }}
          />
          <span class="rt"
            ><b
              >{#if rollNum}<span class="rnum">{rollNum}</span>{/if}{nameOf(it, lang)}</b
            >{#if it.eq}<span class="rstats {eqClass(it.eq)}"
                >{eqLine(
                  it,
                  lang,
                  { tier: t.tier, thresholds: t.eqTh, armorScore: t.eqScore },
                  { noType: true }
                )}</span
              >{/if}{#if descOf(it, lang)}{@const parts = descParts(it, lang)}<span
                >{#each parts as part, i (i)}{#if i > 0}<br
                    />{/if}{#if part.kind === 'list'}{#each part.items as line, j (j)}{#if j > 0}<br
                        />{/if}• {#if line.label}<i>{line.label}:</i
                        >{/if}{line.body}{/each}{:else}{#if part.label}<i>{part.label}:</i
                      >{/if}{part.body}{/if}{/each}</span
              >{/if}{#if upgrade || madeFrom}<span class="rcraft"
                ><Icon name="craft" />{#if upgrade}{t.craftInto}: {nameOf(
                    upgrade,
                    lang
                  )}{/if}{#if upgrade && madeFrom}·{/if}{#if madeFrom}{t.craftFrom}: {nameOf(
                    madeFrom,
                    lang
                  )}{/if}</span
              >{/if}</span
          ><span class="rm"
            >{#each cardBadges(it, lang, t) as b, i (i)}<span
                class="badge {b.cls}"
                title={b.title}>{b.text}</span
              >{/each}<span class="badge src">{srcLabel(it, lang)}</span></span
          >
        </button>
      </div>
    {:else}
      {@const sub = lang === 'ru' ? it.en : it.ru || ''}
      {@const n = rollNum ? String(rollNum) : tileTier(it)}
      <div class="tilewrap" class:sel={selected(it.id)} data-row={it.id}>
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

  .row-main {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    text-align: left;
    flex: 1;
    min-width: 0;
    background: none;
    border: 0;
    padding: 8px;
    color: inherit;
    font: inherit;
  }

  .row-main img {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    object-fit: cover;
    flex: none;
    background: #0a0810;
  }

  .row-main .rt {
    flex: 1;
    min-width: 0;
  }

  .row-main .rt b {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 620;
  }

  .row-main .rt .rnum {
    font: 650 11px/1 var(--mono);
    color: var(--gold-soft);
    flex: none;
    border: 1px solid rgb(216 171 94 / 40%);
    border-radius: 5px;
    padding: 3px 5px;
  }

  .row-main .rt span {
    display: block;
    font-size: 12.5px;
    color: var(--muted2);
    margin-top: 3px;
    line-height: 1.45;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .row-main .rt .rcraft {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px 4px;
    -webkit-line-clamp: none;
    line-clamp: none;
    min-width: 0;
    color: var(--muted);
    font-size: 11.5px;
    margin-top: 4px;
  }

  .row-main .rt .rcraft :global(svg) {
    fill: var(--muted2);
  }

  .row-main .rt .rstats {
    -webkit-line-clamp: none;
    line-clamp: none;
    display: block;
    margin-top: 3px;
    font: 600 11.5px/1.4 var(--mono);
    color: var(--muted);
  }

  .row-main .rm {
    flex: none;
    display: flex;
    gap: 5px;
    align-items: center;
  }

  /* off `.badge` in style.css - the row shares the card's badge palette. */
  .badge {
    font-size: 10.5px;
    font-weight: 650;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    padding: 3px 7px;
    border-radius: 6px;
    background: rgb(10 8 16 / 50%);
    border: 1px solid var(--line2);
    color: var(--muted);
  }

  .badge.item {
    color: var(--item);
    border-color: #7a8ee073;
  }

  .badge.cons {
    color: var(--cons);
    border-color: #9ec96a73;
  }

  .badge.eq-weapon {
    color: var(--eq-weapon);
    border-color: #d48e6a73;
  }

  .badge.eq-secondary {
    color: var(--eq-secondary);
    border-color: #cf7fa673;
  }

  .badge.eq-armor {
    color: var(--eq-armor);
    border-color: #5ec9c473;
  }

  .badge.uniq {
    color: var(--gold-soft);
    border-color: rgb(216 171 94 / 45%);
    border-style: dashed;
  }

  .badge.tier {
    color: var(--muted);
    border-color: var(--line2);
  }

  .badge.src {
    color: #9a9aa6;
  }

  @media (max-width: 600px) {
    .row-main {
      flex-wrap: wrap;
    }

    .row-main .rm {
      flex-basis: 100%;
      padding-left: 72px;
      margin-top: 2px;
      flex-wrap: wrap;
    }

    @media (max-width: 400px) {
      .row-main .rm {
        padding-left: 0;
      }
    }

    .row-main .rt span {
      -webkit-line-clamp: 3;
      line-clamp: 3;
    }
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
