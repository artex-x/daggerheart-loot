<script lang="ts">
  /* The `.row-main` button: a table row's clickable body, off `rowHTML` in
     `git show 23c00a6^:app.js`. Extracted out of `TableRows.svelte` on its second
     real use - the list page's own row draws the same body without
     `num` (`rnum` - only the alternate tables' columns override the roll
     number) or `tail` (`rtail` - the shared page's decoration, threaded
     through `TableRows`'s own `TableEntry.tail`). The third optional input,
     `gmOnly`, dims the art and names the state for a screen reader.
     The description's bold and italics come from MarkupInline: the scoped
     `.row-main .rt b` rule below draws any `<b>` written here as the name. */
  import ArtWell from './ArtWell.svelte';
  import Badge from './Badge.svelte';
  import Icon from './Icon.svelte';
  import Marked from './Marked.svelte';
  import MarkupInline from './MarkupInline.svelte';
  import { artSrc, descBlocks } from '../lib/desc.js';
  import { dict } from '../lib/dict.js';
  import { descOf, eqParts, nameOf } from '../lib/i18n.js';
  import { cardBadges, kindGlyph, relText, srcLabel } from '../lib/label.js';
  import { madeFrom, upgradesTo } from '../lib/data.js';
  import { isHomebrewRecord, oneLangOf } from '../lib/homebrew.js';
  import type { Index } from '../lib/data.js';
  import type { HiddenTags } from '../lib/rowTags.js';
  import type { Term } from '../lib/search.js';
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
    /** An entry marked «Только для мастера»: the art at 45% and the state for a
     *  screen reader after the name. */
    gmOnly?: boolean | undefined;
    /** The tags the catalog's page already says (`rowTags.ts`); none hidden elsewhere. */
    hide?: HiddenTags | undefined;
    /** The search terms whose matches the name marks. */
    terms?: readonly Term[] | undefined;
    /** The number reads «№ 89»: a page that names no table (search). */
    numLabeled?: boolean | undefined;
  }

  const {
    it,
    index,
    lang,
    artBroken,
    onartfail,
    onopen,
    num,
    tail,
    gmOnly,
    hide,
    terms,
    numLabeled
  }: Props = $props();

  const t = $derived(dict(lang));

  const eqClass = (eq: Equip): string => `eq-${eq.t}`;

  /* An own item written in one language: the tag names it where the other interface shows it. */
  const nameLang = $derived.by(() => {
    const one = isHomebrewRecord(it) ? oneLangOf(it.ru, it.en) : null;
    return one === lang ? null : one;
  });

  const into = $derived(upgradesTo(index, it));
  const from = $derived(madeFrom(index, it));

  /* The tags after the name: the kind tag first, the unique and tier tags, then the
     source. A tag the page already says is left out (`hide`). */
  const tags = $derived.by(() => {
    const out = cardBadges(it, lang, t).filter(
      (b, i) => !(i === 0 && hide?.kind) && !(b.cls === 'tier' && hide?.tier)
    );
    const src = srcLabel(it, lang);
    const core = it.src === 'core' && !it.frame && !it.realm;
    if (!hide?.src && !(hide?.core && core)) out.push({ cls: 'src', text: src });
    return out;
  });

  /* A separator is part of the value before it: a no-break space keeps «·» off the
     start of a line. */
  const stats = $derived(
    it.eq
      ? eqParts(
          it,
          lang,
          { tier: t.tier, thresholds: t.eqTh, armorScore: t.eqScore, artifact: t.voaArtifact1 },
          { noType: true, noTier: !!hide?.tier }
        ).join('\u00a0· ')
      : ''
  );
</script>

<!-- No aria-label: the live app left this button's name to its content, so
     the row's accessible name is the whole row - name, stat line, description
     and badges. Verbose, but faithful - matching it is what the structural
     goldens (tests/app/inventory.js) check byte for byte. -->
<button
  type="button"
  class="row-main"
  onclick={() => {
    onopen(it);
  }}
>
  <span class="ra" class:gm={gmOnly}
    ><ArtWell glyph={kindGlyph(it.kind, it.eq?.t)}
      >{#if it.img && !artBroken(it.id)}<img
          src={artSrc(it.img, false, 'thumb')}
          alt=""
          loading="lazy"
          decoding="async"
          onerror={() => {
            onartfail(it.id);
          }}
        />{/if}</ArtWell
    ></span
  >
  <span class="rt"
    ><span class="rh"
      ><b
        >{#if num}<span class="rnum"
            >{numLabeled ? t.rowNo.replace('%n', String(num)) : num}</span
          >{/if}<span class="rname"><Marked text={nameOf(it, lang)} {terms} /></span
        >{#if gmOnly}<span class="gmstate vh">{', ' + t.noteHid}</span>{/if}{#if tail}<i
            class="rtail">{tail}</i
          >{/if}</b
      >{#each tags as b, i (i)}<Badge cls={b.cls} title={b.title}>{b.text}</Badge
        >{/each}{#if nameLang}<span class="lt" lang={nameLang}>{nameLang.toUpperCase()}</span
        >{/if}</span
    >{#if it.eq && stats}<span class="rstats {eqClass(it.eq)}">{stats}</span
      >{/if}{#if descOf(it, lang)}{@const blocks = descBlocks(it, lang)}<span
        >{#each blocks as b, i (i)}{#if i > 0}<br />{/if}{#if b.t === 'p'}<MarkupInline
              c={b.c}
            />{:else if b.t === 'table'}{#each [b.head, ...b.rows] as row, j (j)}{#if j > 0}<br
                />{/if}{#each row as cell, k (k)}{k > 0 ? ' | ' : ''}<MarkupInline
                  c={cell}
                />{/each}{/each}{:else}{#each b.items as item, j (j)}{#if j > 0}<br
                />{/if}{b.t === 'ol' ? String(b.start + j) + '. ' : '• '}<MarkupInline
                c={item}
              />{/each}{/if}{/each}</span
      >{/if}{#if into.length || from.length}<span class="rcraft"
        >{#if from.length}<Icon name="craftFrom" />{t.craftFrom}: {relText(
            from,
            lang,
            1
          )}{/if}{#if into.length && from.length}<span class="rsep">·</span
          >{/if}{#if into.length}<Icon name="craft" />{t.craftInto}: {relText(
            into,
            lang,
            1
          )}{/if}</span
      >{/if}</span
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

  /* This component's own 8px-radius override deleted - the
     global `:focus-visible` rule (tokens.css) already reaches every control,
     at the one radius the owner chose. */

  .row-main .ra {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    overflow: hidden;
    flex: none;
  }

  .row-main .ra.gm {
    opacity: 0.45;
  }

  /* The line length holds at 70 characters. */
  .row-main .rt {
    flex: 1;
    min-width: 0;
    max-width: 70ch;
  }

  /* The name line: the name, then its tags after it, wrapping as a whole. */
  .row-main .rt .rh {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
  }

  /* `.rname` keeps the name's runs one flex item: the gap is for the number and the tail. */
  .row-main .rt b {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--t-small);
    font-weight: 620;
  }

  .row-main .rt .lt {
    padding: 1px 5px;
    border: 1px solid var(--line2);
    border-radius: var(--r-sm);
    color: var(--muted2);
    font-size: var(--t-label);
    font-weight: 600;
  }

  .row-main .rt .rnum {
    font: 650 var(--t-badge)/1 var(--ui);
    font-variant-numeric: tabular-nums;
    color: var(--txt);
    flex: none;
    border: 1px solid var(--line2);
    border-radius: 6px;
    padding: 3px 5px;
  }

  .row-main .rt > span:where(:not(.rh)) {
    display: block;
    font-size: var(--t-data);
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
    font-size: var(--t-data);
    margin-top: 4px;
  }

  .row-main .rt .rcraft :global(svg) {
    fill: var(--muted2);
  }

  /* Its own flex item, so the row gap spaces both sides of the dot. */
  .row-main .rt .rcraft .rsep {
    display: block;
  }

  .row-main .rt .rstats {
    -webkit-line-clamp: none;
    line-clamp: none;
    display: block;
    margin-top: 3px;
    font: 600 var(--t-data)/1.4 var(--ui);
    font-variant-numeric: tabular-nums;
    color: var(--muted);
  }

  /* off the `.rtail` rule (`git show 23c00a6^:style.css`) - the shared page's decoration. */
  .rtail {
    font-style: normal;
    font-weight: 600;
    color: var(--gold-soft);
    margin-left: 7px;
    font-size: var(--t-data);
  }

  @media (max-width: 600px) {
    .row-main .rt > span:where(:not(.rh)) {
      -webkit-line-clamp: 3;
      line-clamp: 3;
    }
  }
</style>
