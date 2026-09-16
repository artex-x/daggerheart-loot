<script lang="ts">
  /* The `.row-main` button: a table row's clickable body, off `rowHTML` in
     app.js (2785-2803). Extracted out of `TableRows.svelte` on its second
     real use - the list page's own row (B5.4) draws the same body without
     `num` (`rnum` - only the alternate tables' columns override the roll
     number) or `tail` (`rtail` - the shared page's decoration, threaded
     through `TableRows`'s own `TableEntry.tail`). */
  import Icon from './Icon.svelte';
  import { artSrc, descParts } from '../lib/desc.js';
  import { dict } from '../lib/dict.js';
  import { descOf, eqLine, nameOf } from '../lib/i18n.js';
  import { cardBadges, isFrameRecord, srcLabel } from '../lib/label.js';
  import type { Index } from '../lib/data.js';
  import type { Equip, Lang, Record_ } from '../lib/types.js';

  interface Props {
    it: Record_;
    index: Index;
    lang: Lang;
    artBroken: (id: string) => boolean;
    onartfail: (id: string) => void;
    onopen: (it: Record_) => void;
    /** Overrides `it.roll` - only the alternate tables' own die-face number
     *  does this; the list page's row does not pass one. */
    num?: number | undefined;
    /** The shared-list decoration after the name - `TableRows`'s
     *  `TableEntry.tail`, from the shared page. */
    tail?: string | undefined;
  }

  const { it, index, lang, artBroken, onartfail, onopen, num, tail }: Props = $props();

  const t = $derived(dict(lang));

  const eqClass = (eq: Equip): string => `eq-${eq.t}`;

  const upgradeOf = (rec: Record_): Record_ | undefined =>
    rec.craft ? index.byId.get(rec.craft) : undefined;
  const madeFromOf = (rec: Record_): Record_ | undefined => {
    const from = index.craftedFrom.get(rec.id);
    return from ? index.byId.get(from) : undefined;
  };

  const upgrade = $derived(upgradeOf(it));
  const madeFrom = $derived(madeFromOf(it));
</script>

<!-- No aria-label: the live app leaves this button's name to its content, so
     the row's accessible name is the whole row - name, stat line, description
     and badges. Verbose, but a divergence here is a divergence the inventory
     spec would have to carry as an ACCEPTED entry forever. -->
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
      >{#if num}<span class="rnum">{num}</span>{/if}{nameOf(it, lang)}{#if tail}<i class="rtail"
          >{tail}</i
        >{/if}</b
    >{#if it.eq}<span class="rstats {eqClass(it.eq)}"
        >{eqLine(
          it,
          lang,
          { tier: t.tier, thresholds: t.eqTh, armorScore: t.eqScore },
          { noType: true, noTier: isFrameRecord(it) }
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
    >{#each cardBadges(it, lang, t) as b, i (i)}<span class="badge {b.cls}" title={b.title}
        >{b.text}</span
      >{/each}<span class="badge src">{srcLabel(it, lang)}</span></span
  >
</button>

<style>
  /* off `.row-main` and its family in style.css */
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

  /* off the keyboard-focus block in style.css (1001), this component's own
     share of it. */
  .row-main:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
    border-radius: 8px;
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

  /* off the `.rtail` rule, style.css:785 - the shared page's decoration. */
  .rtail {
    font-style: normal;
    font-weight: 600;
    color: var(--gold-soft);
    margin-left: 7px;
    font-size: 12.5px;
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
</style>
