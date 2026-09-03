<script lang="ts">
  /* The plain table: chip nav, a toolbar, rows or tiles, selection, and a row
     opening the record modal. Reproduced from `renderTables()` in app.js.

     One component holds every table, including the ones this slice has not
     built: `#/tables/eq_weapon` and the rest draw the same nav and a `.todo`
     placeholder rather than crashing, so the address always resolves to
     something and the chip that leads there is never a dead link. Building
     five separate page components for one route would also fight the second
     use this component is heading for - search reuses the row wholesale.

     Only four tables have no facet to filter by (`docs/specs/ROUTES.md`,
     "Filter grammar"), which is why this slice can draw them whole: nothing
     deferred is on screen for `core_item`, `core_consumable`, `hnf_item` and
     `hnf_consumable`. Every other table still shows the nav and falls through
     to the placeholder until the filter (B2), the sectioned bodies (B3) and
     the equipment facets (B4) land. */
  import { untrack } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import Button from './Button.svelte';
  import Chip from './Chip.svelte';
  import ChipRow from './ChipRow.svelte';
  import Icon from './Icon.svelte';
  import PageHead from './PageHead.svelte';
  import RecordModal from './RecordModal.svelte';
  import { artSrc, descParts } from '../lib/desc.js';
  import { tablesHash } from '../lib/hash.js';
  import { helpFor } from '../lib/help.js';
  import { descOf, eqLine, nameOf } from '../lib/i18n.js';
  import { cardBadges, srcLabel } from '../lib/label.js';
  import { matches } from '../lib/search.js';
  import { TABLE_GROUPS, groupOf, subLabelOf } from '../lib/tables.js';
  import type { AppState } from '../state/app.svelte.js';
  import type { Equip, Record_, TableId } from '../lib/types.js';

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  const t = $derived(app.t);
  const index = $derived(app.index);

  /* The four tables with no facet to narrow by - checked against data.js in
     tables.test.ts rather than assumed. Every other table id still resolves
     through the nav, and falls through to the placeholder below. */
  const KNOWN: readonly TableId[] = [
    'core_item',
    'core_consumable',
    'hnf_item',
    'hnf_consumable'
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

  /* A selection belongs to the page it was made on. Route strings cannot tell
     one table from another - they all read "tables" - so the hash, which
     changes on every table, anchor and filter move, is the honest signal that
     the visitor went somewhere else. A hash-only move keeps this component
     alive, which is why the reset lives in an effect rather than on
     destroy. */
  const sel = new SvelteSet<string>();
  $effect(() => {
    void app.hash;
    untrack(() => {
      sel.clear();
    });
  });

  let open = $state<Record_ | null>(null);
  let said = $state('');
  const say = (msg: string): void => {
    said = msg;
  };

  const help = $derived(helpFor('tables', app.lang));

  const rows = $derived(index?.rows.get(table) ?? []);
  const filtered = $derived.by(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    const labels = { tier: t.tier, thresholds: t.eqTh, armorScore: t.eqScore };
    return rows.filter((it) =>
      matches(it, query, (r) => eqLine(r, app.lang, labels, { noType: true }))
    );
  });

  const allSelected = $derived(filtered.length > 0 && filtered.every((it) => sel.has(it.id)));

  function toggleSel(id: string): void {
    if (sel.has(id)) sel.delete(id);
    else sel.add(id);
  }

  function toggleAll(): void {
    const on = !allSelected;
    for (const it of filtered) {
      if (on) sel.add(it.id);
      else sel.delete(it.id);
    }
  }

  async function copyTableLink(): Promise<void> {
    const ok = await app.env.clipboard.writeText(app.linkTo(tablesHash(table)));
    say(ok ? t.tableLinkCopied : t.copyFailed);
  }

  /** The rank shown on a tile with no roll number - equipment's own tier, or
   *  nothing at all. Off `tileTier()` in app.js. */
  function tileTier(it: Record_): string {
    if (it.tier === 'A' || it.tier === 'C') return it.tier;
    if (it.eq?.tier) return `${t.tier} ${String(it.eq.tier)}`;
    return '';
  }

  /** Takes the stat block rather than the record: both call sites already know
   *  it is equipment, and a ternary that can never take its other branch is
   *  not a branch worth having. */
  const eqClass = (eq: Equip): string => `eq-${eq.t}`;

  const upgradeOf = (it: Record_): Record_ | undefined =>
    it.craft ? index?.byId.get(it.craft) : undefined;
  const madeFromOf = (it: Record_): Record_ | undefined => {
    const from = index?.craftedFrom.get(it.id);
    return from ? index?.byId.get(from) : undefined;
  };
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

  {#if filtered.length === 0}
    <div class="empty">{t.nothing}</div>
  {:else}
    <label class="selall">
      <span class="selbox" data-on={allSelected ? '1' : undefined}>
        <input type="checkbox" checked={allSelected} onchange={toggleAll} />
      </span>
      <span>{t.selectAll} ({filtered.length})</span>
    </label>

    <div class={view === 'list' ? 'rows' : 'tgrid'}>
      {#each filtered as it (it.id)}
        {#if view === 'list'}
          {@const upgrade = upgradeOf(it)}
          {@const madeFrom = madeFromOf(it)}
          <div class="row" class:sel={sel.has(it.id)} data-row={it.id}>
            <label class="selbox" data-on={sel.has(it.id) ? '1' : undefined}>
              <input
                type="checkbox"
                checked={sel.has(it.id)}
                aria-label={t.selected}
                onchange={() => {
                  toggleSel(it.id);
                }}
              />
            </label>
            <!-- No aria-label: the live app leaves this button's name to its
                 content, so the row's accessible name is the whole row -
                 name, stat line, description and badges. Verbose, but a
                 divergence here is a divergence the inventory spec would have
                 to carry as an ACCEPTED entry forever. -->
            <button
              type="button"
              class="row-main"
              onclick={() => {
                open = it;
              }}
            >
              <img
                src={artSrc(it.img, app.artBroken(it.id))}
                alt=""
                loading="lazy"
                decoding="async"
                onerror={() => {
                  app.markArtBroken(it.id);
                }}
              />
              <span class="rt"
                ><b
                  >{#if it.roll}<span class="rnum">{it.roll}</span>{/if}{nameOf(
                    it,
                    app.lang
                  )}</b
                >{#if it.eq}<span class="rstats {eqClass(it.eq)}"
                    >{eqLine(
                      it,
                      app.lang,
                      { tier: t.tier, thresholds: t.eqTh, armorScore: t.eqScore },
                      { noType: true }
                    )}</span
                  >{/if}{#if descOf(it, app.lang)}{@const parts = descParts(it, app.lang)}<span
                    >{#each parts as part, i (i)}{#if i > 0}<br
                        />{/if}{#if part.kind === 'list'}{#each part.items as line, j (j)}{#if j > 0}<br
                            />{/if}• {#if line.label}<i>{line.label}:</i
                            >{/if}{line.body}{/each}{:else}{#if part.label}<i>{part.label}:</i
                          >{/if}{part.body}{/if}{/each}</span
                  >{/if}{#if upgrade || madeFrom}<span class="rcraft"
                    ><Icon name="craft" />{#if upgrade}{t.craftInto}: {nameOf(
                        upgrade,
                        app.lang
                      )}{/if}{#if upgrade && madeFrom}·{/if}{#if madeFrom}{t.craftFrom}: {nameOf(
                        madeFrom,
                        app.lang
                      )}{/if}</span
                  >{/if}</span
              ><span class="rm"
                >{#each cardBadges(it, app.lang, t) as b, i (i)}<span
                    class="badge {b.cls}"
                    title={b.title}>{b.text}</span
                  >{/each}<span class="badge src">{srcLabel(it, app.lang)}</span></span
              >
            </button>
          </div>
        {:else}
          {@const sub = app.lang === 'ru' ? it.en : it.ru || ''}
          {@const n = it.roll ? String(it.roll) : tileTier(it)}
          <div class="tilewrap" class:sel={sel.has(it.id)} data-row={it.id}>
            <label class="selbox" data-on={sel.has(it.id) ? '1' : undefined}>
              <input
                type="checkbox"
                checked={sel.has(it.id)}
                aria-label={t.selected}
                onchange={() => {
                  toggleSel(it.id);
                }}
              />
            </label>
            <!-- No aria-label, matching the row above: its name is its content. -->
            <!-- The number and the name must butt against each other with no
                 whitespace between them, the way the live app's string
                 concatenation does - `.tile-img` and `.tile-b` are
                 display:block, so a stray space here is invisible on screen
                 but still lands in textContent, which is what the parity
                 harness's control-name check reads. The ignore below has to
                 cover the whole button rather than each inner div: Prettier
                 reformats a short tag like `<div class="tile-b">` back onto
                 its own line on every format, reintroducing the gap, unless
                 the whole subtree is protected at once. -->
            <!-- prettier-ignore -->
            <button type="button" class="tile" onclick={() => { open = it; }}
              ><div class="tile-img"
                >{#if n}<span class="tile-n">{n}</span>{/if}<span
                  class="tile-k {it.eq ? eqClass(it.eq) : it.kind === 'consumable' ? 'cons' : 'item'}"
                  title={it.eq ? cardBadges(it, app.lang, t)[0]?.text : it.kind === 'consumable' ? t.cons : t.item}
                ></span><img
                  src={artSrc(it.img, app.artBroken(it.id))}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  onerror={() => { app.markArtBroken(it.id); }}
                /></div
              ><div class="tile-b"
                ><b>{nameOf(it, app.lang)}</b>{#if sub}<span>{sub}</span>{/if}</div
              ></button
            >
          </div>
        {/if}
      {/each}
    </div>
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
