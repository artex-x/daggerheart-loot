<script lang="ts">
  /* A list's compact row up to 760 px (docs/specs/FEATURES.md, "Lists"; DESIGN.md, "Compact
     row"): the picture with the true position on a plate, the name on up to two lines, the
     meta line and one clamped line, all one button that unfolds the full row. The quantity
     is a target of its own beside the button, never inside it: the caller's `field`, or the
     text `qtyText`. `ListPage` and `SharedListPage` draw it. */
  import type { Snippet } from 'svelte';
  import ArtWell from './ArtWell.svelte';
  import Badge from './Badge.svelte';
  import Icon from './Icon.svelte';
  import { artSrc } from '../lib/desc.js';
  import { dict } from '../lib/dict.js';
  import { nameOf } from '../lib/i18n.js';
  import { cardBadges, isCoreBook, kindGlyph, rowLine, srcLabel } from '../lib/label.js';
  import type { Lang, Record_ } from '../lib/types.js';

  interface Props {
    /** The entry's record; `null` for an entry the page has not read. */
    it: Record_ | null;
    /** The entry's key: the name of a row with no record, and the unfolded part's id. */
    id: string;
    /** The entry's true number in the list. */
    no: number;
    lang: Lang;
    artBroken: (id: string) => boolean;
    onartfail: (id: string) => void;
    open: boolean;
    ontoggle: () => void;
    /** The entry's price as text; the meta line names the source without one. */
    price?: string | undefined;
    note?: boolean;
    gmOnly?: boolean;
    /** The quantity as text where no field is drawn («×2»). */
    qtyText?: string | undefined;
    /** The live quantity field, beside the button. */
    field?: Snippet | undefined;
    /** The unfolded part, drawn while `open`. */
    children?: Snippet | undefined;
  }

  const {
    it,
    id,
    no,
    lang,
    artBroken,
    onartfail,
    open,
    ontoggle,
    price,
    note = false,
    gmOnly = false,
    qtyText,
    field,
    children
  }: Props = $props();

  const t = $derived(dict(lang));
  const kind = $derived(it ? cardBadges(it, lang, t)[0] : undefined);
  const src = $derived(it && !price && !isCoreBook(it) ? srcLabel(it, lang) : '');
  const line = $derived(it ? rowLine(it, lang, t) : '');
</script>

<div class="crow" class:open class:ro={!field}>
  <button
    type="button"
    class="cbody"
    aria-expanded={open}
    aria-controls={open ? `crow-${id}` : undefined}
    onclick={ontoggle}
  >
    <span class="cart" class:gm={gmOnly}
      ><ArtWell glyph={it ? kindGlyph(it.kind, it.eq?.t) : 'kindItem'}
        >{#if it?.img && !artBroken(it.id)}<img
            src={artSrc(it.img, false, 'thumb')}
            alt=""
            loading="lazy"
            decoding="async"
            onerror={() => {
              onartfail(it.id);
            }}
          />{/if}</ArtWell
      ><span class="cno">{no}</span></span
    >
    <span class="ctext"
      ><span class="cname">{it ? nameOf(it, lang) : id}</span><span class="cmeta"
        >{#if !it}<span class="csrc">{t.itemNotLoaded}</span>{:else}{#if kind}<Badge
              cls={kind.cls}>{kind.text}</Badge
            >{/if}{#if price}<span class="cpr">{price}</span>{:else if src}<span class="csrc"
              >{src}</span
            >{/if}{/if}{#if note}<span class="cmark"
            ><Icon name="note" /><span class="vh">{', ' + t.note}</span></span
          >{/if}{#if gmOnly}<span class="cmark"
            ><Icon name="eyeOff" /><span class="vh">{', ' + t.noteHid}</span></span
          >{/if}</span
      ></span
    >
    <span class="cchev"><Icon name="chevron" /></span>
    {#if line}<span class="cfx">{line}</span>{/if}
  </button>
  {#if field}{@render field()}{:else if qtyText}<span class="cqv">{qtyText}</span>{/if}
  {#if open}<div class="cfull" id="crow-{id}">{@render children?.()}</div>{/if}
</div>

<style>
  /* One column: the body and the quantity share the first cell, the quantity on the body's
     reserved last column; the unfolded part takes the second line. */
  .crow {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    flex: 1 1 0;
    min-width: 0;
  }

  .cbody,
  .crow > :global(.cqf),
  .cqv {
    grid-row: 1;
    grid-column: 1;
  }

  .crow > :global(.cqf),
  .cqv {
    justify-self: end;
    align-self: start;
    margin: 6px 8px 0 0;
    z-index: 1;
  }

  .cbody {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) 20px 50px;
    gap: 2px 8px;
    align-items: center;
    width: 100%;
    min-height: 56px;
    padding: 6px 8px;
    background: none;
    border: 0;
    color: inherit;
    text-align: left;
    font: inherit;
    cursor: pointer;
  }

  /* The row clips: the ring sits inside it. */
  .cbody:focus-visible {
    outline-offset: -2px;
  }

  .crow.ro .cbody {
    grid-template-columns: 44px minmax(0, 1fr) 20px 34px;
  }

  .cart {
    position: relative;
    display: block;
    width: 44px;
    height: 44px;
    border-radius: 8px;
    overflow: hidden;
  }

  .cart.gm :global(.well) {
    opacity: 0.45;
  }

  .cno {
    position: absolute;
    left: 0;
    bottom: 0;
    min-width: 18px;
    height: 16px;
    padding: 0 3px;
    border-radius: 0 6px 0 0;
    background: rgb(14 12 21 / 88%);
    color: var(--txt);
    font: 600 var(--t-label) / 16px var(--ui);
    font-variant-numeric: tabular-nums;
    text-align: center;
  }

  .ctext {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .cname {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    font-size: var(--t-control);
    font-weight: 600;
    line-height: 20px;
    overflow-wrap: anywhere;
  }

  .crow.open .cname {
    -webkit-line-clamp: none;
    line-clamp: none;
  }

  /* The price wraps to a second line and is never cut; the source is one line. */
  .cmeta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px 6px;
    min-width: 0;
    font-size: var(--t-data);
    line-height: 20px;
    color: var(--muted);
  }

  .cmeta :global(.badge) {
    flex: none;
    padding: 0 5px;
    font-size: var(--t-label);
    line-height: 16px;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  .cpr {
    font-weight: 600;
    color: var(--txt);
    font-variant-numeric: tabular-nums;
  }

  .csrc {
    flex: 0 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cmark {
    display: inline-flex;
    color: var(--muted2);
  }

  .cmark :global(svg) {
    width: 14px;
    height: 14px;
  }

  .cchev :global(svg) {
    display: block;
    width: 20px;
    height: 20px;
    color: var(--muted);
  }

  .crow.open .cchev :global(svg) {
    transform: rotate(180deg);
  }

  /* One line from the text column to the row's end, under the quantity. */
  .cfx {
    grid-column: 2 / -1;
    grid-row: 2;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--t-data);
    line-height: 18px;
    color: var(--muted);
  }

  .crow > :global(.cqf) {
    width: 42px;
    height: 44px;
    padding: 0;
    border: 1px solid var(--line2);
    border-radius: 8px;
    background: var(--bg2);
    color: var(--txt);
    font: 600 var(--t-control) / 1 var(--ui);
    font-variant-numeric: tabular-nums;
    text-align: center;
    touch-action: manipulation;
    appearance: textfield;
    -moz-appearance: textfield;
  }

  .crow > :global(.cqf::-webkit-outer-spin-button),
  .crow > :global(.cqf::-webkit-inner-spin-button) {
    -webkit-appearance: none;
    margin: 0;
  }

  .crow > :global(.cqf:focus) {
    outline: none;
    border-color: var(--gold);
  }

  /* 16 px: a smaller field makes iOS zoom the page on focus (as `RollSelect.svelte`). */
  @media (max-width: 600px) {
    .crow > :global(.cqf) {
      font-size: 16px;
    }
  }

  .cqv {
    height: 44px;
    line-height: 44px;
    color: var(--txt);
    font-size: var(--t-control);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  /* No fill: a background would cover the list's inset drop mark. */
  .cfull {
    grid-row: 2;
    grid-column: 1;
    min-width: 0;
    padding: 0 8px 10px 60px;
  }

  /* The flat list: one divider per row, no box (DESIGN.md, "Compact row"). A GM-only entry
     keeps its box on the darker ground; a ticked row keeps its lit ground. */
  :global(.rows:has(> .row > .crow)) {
    gap: 0;
    border-top: 1px solid var(--line2);
  }

  :global(.rows > .row:has(> .crow)) {
    border-width: 0 0 1px;
    border-radius: 0;
  }

  :global(.rows > .row:has(> .crow):not(.sel, .gm-only)) {
    background: none;
  }

  :global(.rows > .row.gm-only:has(> .crow)) {
    border-width: 1px;
    border-radius: 8px;
    margin: 2px 0;
    padding-inline: 6px;
  }
</style>
