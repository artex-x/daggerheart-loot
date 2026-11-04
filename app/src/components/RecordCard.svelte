<script lang="ts">
  /* One record in full, reproduced from the live app.
     The markup mirrors `cardHTML(it, {full:true})` in app.js and the styles are
     copied out of style.css - `.card`, `.card-media`, `.card-body`,
     `.card-meta`, `.badge`, `.card-name`, `.card-desc`, `.craft`, `.refs`,
     `.card-acts`. This was a refactor: the parity harness (deleted, issue
     47) compared the two apps pixel for pixel, so a value that was
     nearly right was a value that failed.

     Nothing here injects HTML. The description, the set bonus and the rule
     card text arrive parsed (lib/markup.ts) and draw through Markup.svelte,
     so a label is an <i> element and a list is a real <ul>.

     The image review page draws this card's head too: docs/artwork.md, "The
     card follows the site's card". */
  import Actions from './Actions.svelte';
  import ArtWell from './ArtWell.svelte';
  import Badge from './Badge.svelte';
  import FoldButton from './FoldButton.svelte';
  import Icon from './Icon.svelte';
  import Markup from './Markup.svelte';
  import { artSrc, descBlocks } from '../lib/desc.js';
  import { dict } from '../lib/dict.js';
  import { pathOf } from '../lib/address.js';
  import { homebrewTabHash, recordHref } from '../lib/hash.js';
  import {
    FOLD_OWN,
    cardBadges,
    foldOwn,
    isCoreBook,
    kindGlyph,
    relName,
    relOrder,
    setFolds,
    srcLabel
  } from '../lib/label.js';
  import {
    madeFrom,
    refsOf,
    setBonusOf,
    setKeyOf,
    setOf,
    upgradeLine,
    upgradesTo
  } from '../lib/data.js';
  import { isHomebrewKey, isHomebrewRecord, oneLangOf, textLangOf } from '../lib/homebrew.js';
  import { eqParts, nameOf } from '../lib/i18n.js';
  import { parseMarkup } from '../lib/markup.js';
  import type { AltCol, Index } from '../lib/data.js';
  import type { Lang, Record_ } from '../lib/types.js';
  import type { Snippet } from 'svelte';

  interface Props {
    /**
     * `full` is the whole record: the picture on top, at full width, on a plate.
     * `compact` is a result or a table row: the picture beside the text at
     * 132px, and the name is a link to the page rather than a heading of it.
     * `face` is a roll result: the picture 4:3 above the text with a fade from 601 px, 96px
     * beside it below (DESIGN.md, "Cards"); the name is a link as on `compact`.
     */
    variant?: 'full' | 'compact' | 'face';
    /** The record page and the dialog: no plate, the picture beside the text from 761 px
     *  and 4:3 above it below (DESIGN.md, "The Dossier Rule"). */
    dossier?: boolean;
    /** `h1` where the card is the page. */
    heading?: 'h1' | 'h2';
    /** The lines under the name: where the record is from, when it changed. */
    sub?: Snippet | undefined;
    it: Record_;
    index: Index;
    lang: Lang;
    /** The language the card's links open in, where it differs from the card's: the
     *  editor's preview of the other language. Defaults to `lang`. */
    linkLang?: Lang;
    /** Whether the picture failed to load earlier in this session. */
    artBroken: boolean;
    /**
     * The number badge, where the row it came up on is not its own row number.
     *
     * The alternate tables are twelve rows per column, and a record keeps the
     * number it has in the book it was printed in - so the badge has to say
     * which face found it, not where it sits in Core.
     */
    rollLabel?: number | undefined;
    /** Which duality column found it, badged in that column's color. */
    col?: AltCol | undefined;
    onartfail: (id: string) => void;
    /**
     * Opens a record over whatever is on screen.
     *
     * It carries the record because it is not always this one: the tier ladder
     * opens a different rung of the same upgrade line.
     */
    onopen?: ((r: Record_) => void) | undefined;
    /** The record dialog: the picture links to the record's page. */
    pageLink?: boolean;
    /** The two icon buttons beside the name on a compact card: copy the name, copy the link. */
    nameActions?: Snippet;
    /** The labeled row under the description: send, picture, text. */
    actions?: Snippet;
    /** The action row, or the add-to-list control in the editor's preview - only the full
     *  card draws it, the same as `actions`. */
    pick?: Snippet | undefined;
    /** The viewer is the author: an own set's name and each own rule card link to their
     *  tabs on «Мои предметы». The account's own card on a catalog record links there too. */
    manage?: boolean;
  }

  const {
    variant = 'full',
    dossier = false,
    heading = 'h2',
    sub,
    it,
    index,
    lang,
    linkLang,
    artBroken,
    rollLabel,
    col,
    onartfail,
    onopen,
    pageLink = false,
    nameActions,
    actions,
    pick,
    manage = false
  }: Props = $props();

  const hrefLang = $derived(linkLang ?? lang);
  const t = $derived(dict(lang));
  const name = $derived(nameOf(it, lang));
  /* Chips rather than a sentence, as the live app draws them, and without the
     type word: the badge row above already says what kind of thing this is. */
  const stats = $derived(
    eqParts(
      it,
      lang,
      { tier: t.tier, thresholds: t.eqTh, armorScore: t.eqScore, artifact: t.voaArtifact1 },
      { noType: true }
    )
  );
  const blocks = $derived(descBlocks(it, lang));
  /* A homebrew text written in one language only, shown on a screen of the other. */
  const textLang = $derived.by(() => {
    const l = textLangOf(it);
    return l && l !== lang ? l : undefined;
  });
  const art = $derived(it.img && !artBroken ? artSrc(it.img) : null);
  const badges = $derived(cardBadges(it, lang, t));
  /* The same as `textLang` for a homebrew set bonus or rule card text, whose language the
     stored card decides, not the record. */
  const cardLang = (key: string, c: { rud?: string; ende?: string }): Lang | undefined => {
    const l = isHomebrewKey(key) ? oneLangOf(c.rud, c.ende) : null;
    return l && l !== lang ? l : undefined;
  };

  /* The relation lines, the set and the ladder are the full card's (DESIGN.md, "Cards"). */
  const whole = $derived(variant === 'full');

  const into = $derived(relOrder(upgradesTo(index, it), lang));
  const from = $derived(relOrder(madeFrom(index, it), lang));

  /* The tier ladder: every rung of this upgrade line, in tier order. A line of
     one is not a ladder, and the live app leaves it out. */
  const ladder = $derived.by(() => {
    const line = it.eq?.line ? upgradeLine(index, it) : [];
    return line.length > 1 ? line : [];
  });
  const setKey = $derived(setKeyOf(index, it));
  const setMembers = $derived(relOrder(setOf(index, it), lang));

  /* Each relation line and the ladder fold their homebrew records past the third
     (docs/specs/FEATURES.md, "Records"). The open lines live in this card only, keyed by
     record, so another record drawn in the same card starts closed. */
  type Line = 'from' | 'into' | 'set' | 'ladder';
  let opened = $state<string[]>([]);
  const isOpen = (line: Line): boolean => opened.includes(`${it.id}:${line}`);
  function toggle(line: Line): void {
    const key = `${it.id}:${line}`;
    opened = isOpen(line) ? opened.filter((k) => k !== key) : [...opened, key];
  }
  function fold(
    list: readonly Record_[],
    line: Line
  ): { shown: readonly Record_[]; more: number } {
    const folded = foldOwn(
      list,
      FOLD_OWN,
      it.id,
      line === 'set' ? setFolds(setKey) : undefined
    );
    return isOpen(line) ? { shown: list, more: folded.more } : folded;
  }
  const fromFold = $derived(fold(from, 'from'));
  const intoFold = $derived(fold(into, 'into'));
  const setFold = $derived(fold(setMembers, 'set'));
  const ladderFold = $derived(fold(ladder, 'ladder'));
  const setBonus = $derived.by(() => {
    const b = setBonusOf(index, it);
    if (!b) return undefined;
    const text = lang === 'ru' ? b.rud : b.ende;
    return {
      name: lang === 'ru' ? b.ru : b.en,
      blocks: parseMarkup(text),
      lang: setKey ? cardLang(setKey, b) : undefined
    };
  });
  /* The account's own set or rule card on a catalog record (`index.ownSetOf`). */
  const ownSet = $derived(
    !!setKey && isHomebrewKey(setKey) && (manage || index.ownSetOf.get(it.id) === setKey)
  );
  const ownRef = (key: string): boolean =>
    isHomebrewKey(key) && (manage || !!index.ownRefsOf.get(it.id)?.includes(key));
  const refs = $derived(
    refsOf(index, it).flatMap((key) => {
      const card = index.refs[key];
      return card ? [{ key, card }] : [];
    })
  );
  /* An own rule card links to its address as written, with the host as the text; a
     catalog card links to daggerheart.su in the language on screen. */
  const hostOf = (url: string): string => {
    try {
      return new URL(url).host;
    } catch {
      return url;
    }
  };
</script>

<!-- The fold of a relation line or the ladder: «и ещё N» closed, «свернуть» open; the same
     button both ways, so the focus stays on it. -->
{#snippet moreButton(line: Line, more: number)}
  <FoldButton
    open={isOpen(line)}
    more={t.andMore.replace('%n', String(more))}
    {t}
    ontoggle={() => {
      toggle(line);
    }}
  />
{/snippet}

<!-- eslint-disable @typescript-eslint/no-confusing-void-expression, svelte/no-useless-mustaches --
     a `{@render}` tag reads as a void expression to the first rule; `{' '}` keeps the space
     before a fold button, which a block's edge would trim, and `{'\u00a0'}` keeps a badge on
     its name's line. -->
<!-- A homebrew record's mark in a relation line. The text outside the card keeps «(HB)»
     (`relName`). -->
{#snippet hbBadge(r: Record_)}
  {#if isHomebrewRecord(r)}{'\u00a0'}<Badge cls="hb">{t.srcHomebrew}</Badge>{/if}
{/snippet}

{#snippet picture()}
  <ArtWell glyph={kindGlyph(it.kind, it.eq?.t ?? it.eqType)}>
    {#if art}
      <img
        src={art}
        alt=""
        loading="lazy"
        decoding="async"
        onerror={() => {
          onartfail(it.id);
        }}
      />
    {/if}
  </ArtWell>
{/snippet}

<article class="card {variant}" class:dossier data-id={it.id}>
  <!-- The picture goes one step deeper than where it is drawn: a result opens the dialog,
       the dialog links to the page, and on the page or the editor's preview it is a
       picture only (docs/specs/FEATURES.md, "Records"). -->
  {#if pageLink}
    <a class="card-media" href={pathOf(recordHref(it), hrefLang)} aria-label={t.openPage}
      >{@render picture()}</a
    >
  {:else if onopen && variant !== 'full'}
    <button
      type="button"
      class="card-media"
      aria-label={t.openCard}
      onclick={() => {
        onopen(it);
      }}>{@render picture()}</button
    >
  {:else}
    <div class="card-media">{@render picture()}</div>
  {/if}

  <div class="card-body">
    <!-- The path line under the name already gives the number and the source. -->
    <div class="card-meta">
      {#if it.roll && !sub}
        <Badge cls="num">{rollLabel ?? it.roll}</Badge>
      {/if}
      {#if col}
        <Badge cls={col}>{col === 'hope' ? t.hope : t.fear}</Badge>
      {/if}
      {#each badges as b, i (i)}
        <Badge cls={b.cls} title={b.title}>{b.text}</Badge>
      {/each}
      {#if !sub && (whole || !isCoreBook(it))}
        <Badge cls="src">{srcLabel(it, lang)}</Badge>
      {/if}
    </div>

    <svelte:element this={heading} class="card-name">
      {#if variant !== 'full'}
        <!-- A link, because from a result the name is the way to the page. -->
        <a href={pathOf(recordHref(it), hrefLang)} title={t.openPage}>{name}</a>
      {:else}
        <span>{name}</span>
      {/if}
      {#if nameActions}
        <span class="card-name-acts">{@render nameActions()}</span>
      {/if}
    </svelte:element>
    {#if sub}
      <div class="card-sub">{@render sub()}</div>
    {/if}

    {#if stats.length}
      <div class="eqstats">
        {#each stats as chip, i (i)}
          <span>{chip}</span>
        {/each}
      </div>
    {/if}

    {#if textLang}
      <p class="text-lang">{textLang === 'en' ? t.textEnOnly : t.textRuOnly}</p>
    {/if}
    <div class="card-desc mdtext" lang={textLang}>
      <Markup {blocks} />
    </div>

    {#if whole && ladder.length}
      <!-- Улучшенный / Продвинутый / Легендарный are the same weapon four
           times over, so the card offers the ladder rather than making a
           person search for the next rung. The one they are on is a label
           rather than a button: it goes nowhere. -->
      <div class="steps">
        <span class="steps-l">{t.tier}</span>
        {#each ladderFold.shown as rung (rung.id)}
          {#if rung.id === it.id}
            <span class="step on" aria-current="true"
              >{rung.eq?.tier}{isHomebrewRecord(rung) ? ' ' + t.hbMark : ''}</span
            >
          {:else}
            <!-- Named as well as titled. The live app gives the rung a title
                 and a digit for its content, and content wins the accessible
                 name - so a screen reader hears "button, 2" three times over
                 with nothing saying where any of them goes. The label is the
                 same string the title carries, so the parity inventory reads
                 the same on both apps. -->
            <button
              type="button"
              class="step"
              title={relName(rung, lang)}
              aria-label={relName(rung, lang)}
              onclick={() => onopen?.(rung)}
              >{rung.eq?.tier}{isHomebrewRecord(rung) ? ' ' + t.hbMark : ''}</button
            >
          {/if}
        {/each}
        {#if ladderFold.more}{@render moreButton('ladder', ladderFold.more)}{/if}
      </div>
    {/if}

    {#if whole && (into.length || from.length || setMembers.length || setBonus)}
      <!-- Both directions in chain order: where a thing came from, then where
           it goes, each with its own arrow. Only the forward one travels into
           a copied message. -->
      <div class="craft">
        {#if from.length}
          <p>
            <Icon name="craftFrom" />
            <span class="craft-l">{t.craftFrom}</span>
            <span
              >{#each fromFold.shown as r, i (r.id)}{i > 0 ? ', ' : ''}<span class="rel"
                  ><a href={pathOf(recordHref(r), hrefLang)}>{nameOf(r, lang)}</a
                  >{@render hbBadge(r)}</span
                >{/each}{#if fromFold.more}{' '}{@render moreButton(
                  'from',
                  fromFold.more
                )}{/if}</span
            >
          </p>
        {/if}
        {#if into.length}
          <p>
            <Icon name="craft" />
            <span class="craft-l">{t.craftInto}</span>
            <span
              >{#each intoFold.shown as r, i (r.id)}{i > 0 ? ', ' : ''}<span class="rel"
                  ><a href={pathOf(recordHref(r), hrefLang)}>{nameOf(r, lang)}</a
                  >{@render hbBadge(r)}</span
                >{/each}{#if intoFold.more}{' '}{@render moreButton(
                  'into',
                  intoFold.more
                )}{/if}</span
            >
          </p>
        {/if}
        {#if setMembers.length}
          <!-- Every catalog member in its order, then the own ones by name,
               the record itself inert: the tier ladder's own rule for the rung you are on
               (`.step.on[aria-current]` above), reused here for the piece
               of the set you are looking at. One flex item holding the
               whole comma-joined run, so the punctuation flows as prose
               rather than each name picking up the row's own flex gap. -->
          <p>
            <Icon name="craft" />
            <span class="craft-l">{t.setLabel}</span>
            <span
              >{#each setFold.shown as member, i (member.id)}{i > 0 ? ', ' : ''}<span
                  class="rel"
                  >{#if member.id === it.id}<span aria-current="true"
                      >{nameOf(member, lang)}</span
                    >{:else}<a href={pathOf(recordHref(member), hrefLang)}
                      >{nameOf(member, lang)}</a
                    >{/if}{@render hbBadge(member)}</span
                >{/each}{#if setFold.more}{' '}{@render moreButton(
                  'set',
                  setFold.more
                )}{/if}</span
            >
          </p>
        {/if}
        {#if setBonus}
          <!-- The name leads the first paragraph of the bonus text in bold italic, as a
               feature name. A frozen copy alone in its set draws the bonus with no
               set line. -->
          {@const bonus = setBonus}
          {#if bonus.lang}
            <p class="text-lang">{bonus.lang === 'en' ? t.textEnOnly : t.textRuOnly}</p>
          {/if}
          <div class="set-bonus mdtext" lang={bonus.lang}>
            <Markup blocks={bonus.blocks}>
              {#snippet lead()}<b
                  ><i
                    >{#if ownSet && setKey}<a
                        href={pathOf(homebrewTabHash('sets', setKey), hrefLang)}>{bonus.name}</a
                      >:{:else}{bonus.name}:{/if}</i
                  ></b
                >{/snippet}
            </Markup>
          </div>
        {/if}
      </div>
    {/if}
    <!-- eslint-enable svelte/no-useless-mustaches -->

    {#if refs.length}
      <!-- Folded by default, so a card that quotes a spell is no taller than
           one that does not. -->
      <div class="refs">
        {#each refs as { key, card: r }, i (i)}
          {@const refLang = cardLang(key, r)}
          <details>
            <summary>
              <Icon name="ref" />
              <span class="ref-n">{lang === 'ru' ? r.ru : r.en}</span>
              <i class="ref-s">{lang === 'ru' ? r.rusub : r.ensub}</i>
            </summary>
            {#if refLang}
              <p class="text-lang ref-lang">
                {refLang === 'en' ? t.textEnOnly : t.textRuOnly}
              </p>
            {/if}
            <div class="ref-text mdtext" lang={refLang}>
              <Markup blocks={parseMarkup(lang === 'ru' ? r.rud : r.ende)} />
            </div>
            {#if !isHomebrewKey(key)}
              <a
                href={lang === 'ru' ? r.url : r.url.replace('//ru.', '//en.')}
                target="_blank"
                rel="noopener">daggerheart.su</a
              >
            {:else if r.url}
              <a href={r.url} target="_blank" rel="noopener">{hostOf(r.url)}</a>
            {/if}
            {#if ownRef(key)}
              <a href={pathOf(homebrewTabHash('rules', key), hrefLang)}>{t.hbCardManage}</a>
            {/if}
          </details>
        {/each}
      </div>
    {/if}

    {#if actions}
      <Actions>{@render actions()}</Actions>
    {/if}

    {#if pick}
      <div class="cardpick">{@render pick()}</div>
    {/if}
  </div>
</article>

<style>
  /* ---------- card, off style.css ---------- */
  .card {
    background: linear-gradient(180deg, var(--surface2), var(--surface));
    border: 1px solid var(--line);
    border-radius: var(--r);
    /* `clip` rather than `hidden`: the add-to-list menu's
       placement effect no longer calls `scrollIntoView` on the wrong button
       and pulls this article's own scroll position along with it, but
       `clip` is what stops a programmatic scroll from moving the content at
       all - `hidden` still creates a scroll container a script can scroll.
       The rounded corners still clip either way. */
    overflow: clip;
    display: flex;
    box-shadow: var(--shadow);
    animation: pop 0.28s cubic-bezier(0.2, 0.8, 0.3, 1) both;
  }

  @keyframes pop {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.985);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .card {
      animation: none;
    }
  }

  .card.full {
    flex-direction: column;
  }

  .card.compact {
    flex-direction: row;
    align-items: stretch;
  }

  .card-media {
    position: relative;
    background: var(--art-well);
    overflow: hidden;
    flex: none;
    border: 0;
    padding: 0;
    display: block;
  }

  /* It opens the record's dialog, whose picture is larger. */
  button.card-media {
    cursor: zoom-in;
  }

  .card.full .card-media {
    width: 100%;
    aspect-ratio: 1;
    max-height: 420px;
  }

  .card.compact .card-media {
    width: 132px;
    aspect-ratio: 1;
  }

  @media (hover: hover) {
    .card.compact .card-media:hover img,
    .card.face .card-media:hover img {
      transform: scale(1.05);
    }
  }

  .card-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.25s;
  }

  /* Mostly paid off, but this one override was not a no-op: `.card-media`
     is a real control flush against `.card`, and `.card` is `overflow: clip`.
     The global rule's `+2px` offset (tokens.css) draws the ring outside this
     button's border box, which is outside `.card`'s padding box, so it is
     clipped on three sides and survives as a single line on one interior
     edge. The inset `-2px` keeps the ring inside the button instead. */
  .card-media:focus-visible {
    outline-offset: -2px;
  }

  .card-body {
    padding: 13px 15px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  .card-meta {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
    align-items: center;
  }

  /* off `.steps`, `.steps-l` and `.step` in style.css. The rungs are a fixed
     26px square whatever digit is in them, so a line of four reads as a row of
     equal steps rather than as text. */
  .steps {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 10px 0 0;
    flex-wrap: wrap;
  }

  .steps-l {
    font: 650 var(--t-badge)/1 var(--mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted2);
  }

  .steps .step {
    min-width: 26px;
    height: 26px;
    padding: 0 6px;
    border-radius: 7px;
    border: 1px solid var(--line2);
    background: var(--surface);
    color: var(--muted);
    font: 650 var(--t-data)/1 var(--ui);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: 0.15s;
  }

  .steps button.step:hover {
    color: var(--txt);
    border-color: var(--gold);
    cursor: pointer;
  }

  .steps .step.on {
    background: var(--gold);
    border-color: var(--gold);
    color: #191320;
  }

  .card-name {
    margin: 0;
    font-size: var(--t-title);
    font-weight: 680;
    letter-spacing: -0.01em;
    line-height: 1.28;
    display: flex;
    align-items: baseline;
    gap: 7px;
  }

  /* Without this the card cannot shrink below its longest word, which pushed
     the results grid past a 320px screen. */
  .card.full .card-name {
    font-size: var(--t-section);
  }

  .card-name > span,
  .card-name a {
    min-width: 0;
    overflow-wrap: break-word;
  }

  .card-name a {
    color: var(--txt);
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: 0.15s;
  }

  .card-name a:hover {
    color: var(--gold-soft);
    border-bottom-color: currentcolor;
  }

  .card-name-acts {
    display: inline-flex;
    gap: 2px;
    flex: none;
    align-self: center;
  }

  /* `.card-name svg` in style.css, and it is not the icon's own size: this row
     pins its icons to 14px whatever they arrive as. One pixel each way, which
     made the name row a pixel taller and moved everything under it. */
  .card-name :global(svg) {
    width: 14px;
    height: 14px;
    fill: currentcolor;
  }

  /* off `.eqstats` in style.css */
  .eqstats {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin: 2px 0 10px;
  }

  .eqstats span {
    font: 600 var(--t-data)/1 var(--ui);
    font-variant-numeric: tabular-nums;
    color: var(--muted);
    background: rgb(255 255 255 / 3.5%);
    border: 1px solid var(--line2);
    border-radius: 6px;
    padding: 4px 7px;
    white-space: nowrap;
  }

  .card-desc {
    margin: 0;
    color: #cfc8e0;
    font-size: var(--t-small);
    line-height: 1.55;
    overflow-wrap: anywhere;
  }

  /* The body's 8px gap less 2px: the line belongs to the text under it. */
  .text-lang {
    margin: 0 0 -2px;
    font-size: var(--t-data);
    color: var(--muted2);
  }

  .card.full .card-desc {
    font-size: var(--t-small);
    line-height: 1.62;
  }

  /* ---------- the upgrade chain ---------- */
  .craft {
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin: -1px 0 1px;
  }

  .craft p {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 5px;
    margin: 0;
    overflow-wrap: anywhere;
    font-size: var(--t-data);
    line-height: 1.45;
    min-width: 0;
  }

  .craft p > :global(*) {
    min-width: 0;
  }

  /* An atomic badge's margin enters the line box, so the lines around it keep 2 px
     (DESIGN.md, "Badges"): 2 px of margin left 1.8 px to a wrapped name above (measured
     2026-11-04 at 360 px). */
  .craft :global(.badge) {
    margin-block: 3px;
  }

  /* A name and its badge: no break between them, a long name still wraps inside itself. */
  .craft .rel {
    white-space: nowrap;
  }

  .craft .rel > :global(*) {
    white-space: normal;
  }

  /* Inside the chain's 3px gap the line needs no pull toward its text. */
  .craft .text-lang {
    margin: 0;
  }

  /* The rule card text's own inset. */
  .ref-lang {
    padding: 7px 9px 0;
    margin: 0;
  }

  /* The bonus is a block of its own, not a flex row: its first paragraph holds the name. */
  .set-bonus {
    font-size: var(--t-data);
    line-height: 1.45;
    min-width: 0;
  }

  .craft :global(svg) {
    align-self: center;
    fill: var(--muted2);
  }

  .craft-l {
    color: var(--muted2);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: var(--t-badge);
    white-space: nowrap;
  }

  .craft a {
    color: var(--gold-soft);
    text-decoration: none;
    border-bottom: 1px dotted rgb(240 208 145 / 45%);
  }

  .craft a:hover {
    border-bottom-style: solid;
  }

  /* The fold button reads at the line's own size; this outranks Button's `.btn.bare`. */
  .craft p :global(.btn.bare),
  .steps :global(.btn.bare) {
    font-size: var(--t-data);
  }

  /* `.card-acts` moved to `Actions.svelte`; its two 600px descendant
     rules below are re-anchored on this component's own root, `.card`,
     since a scoped rule cannot otherwise reach inside a child component. */

  /* off `.cardpick` in style.css - the add-to-list control and the print
     link, under `.card-acts`. */
  .cardpick {
    border-top: 1px solid var(--line);
    margin-top: 12px;
    padding-top: 12px;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
  }

  /* off `.cardpick .dropmenu` / `.cardpick .dropmenu.up`: the card opens its
     menu downward by default and flips up only when there is no room below,
     the opposite of `AddToList.svelte`'s own base rule (the future selection
     bar's). Two classes deep, same as the live rule, so this beats both the
     bare `.dropmenu` and its own 600px override at equal specificity - see
     issue 47. */
  .cardpick :global(.dropmenu) {
    bottom: auto;
    top: calc(100% + 8px);
    left: 0;
    right: auto;
  }

  .cardpick :global(.dropmenu.up) {
    top: auto;
    bottom: calc(100% + 8px);
  }

  /* ---------- referenced rulebook cards ---------- */
  .refs {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 1px 0 2px;
  }

  .refs details {
    border: 1px solid var(--line);
    border-radius: 8px;
    background: rgb(255 255 255 / 2%);
  }

  /* off `git show 23c00a6^:style.css` - measured live, closed: offsetParent false, display
     none. The `<a>` below sets its own `display: inline-block`, an author
     rule that beats the browser's own closed-<details> default, so without
     this line the link (and the referenced text) stayed hittable and in the
     accessible-controls list with the panel visually closed - the same
     reason live carries this rule rather than trusting the element alone. */
  .refs details:not([open]) > *:not(summary) {
    display: none;
  }

  .refs summary {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 8px;
    cursor: pointer;
    list-style: none;
    font-size: var(--t-label);
    line-height: 1.35;
    flex-wrap: wrap;
  }

  .refs summary::-webkit-details-marker {
    display: none;
  }

  /* The fold's own mark, the look of `Button`'s caret: the box would read as a button
     without it. */
  .refs summary::after {
    content: '';
    margin-left: auto;
    border: 4px solid transparent;
    border-top-color: var(--muted2);
    transform: translateY(2px);
  }

  .refs details[open] summary::after {
    border-top-color: transparent;
    border-bottom-color: var(--muted2);
    transform: translateY(-2px);
  }

  .refs summary :global(svg) {
    fill: var(--muted2);
  }

  .refs summary:hover .ref-n {
    color: var(--gold-soft);
  }

  .ref-n {
    font-weight: 650;
    color: var(--txt);
    min-width: 0;
    overflow-wrap: break-word;
  }

  .ref-s {
    font-style: normal;
    color: var(--muted2);
    font-size: var(--t-badge);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .refs details[open] summary {
    border-bottom: 1px solid var(--line);
  }

  .ref-text {
    padding: 7px 9px 5px;
    color: var(--muted);
    font-size: var(--t-data);
    line-height: 1.5;
  }

  .refs details > a {
    display: inline-block;
    padding: 0 9px 8px;
    font-size: var(--t-data);
    color: var(--gold-soft);
  }

  /* ---------- the phone, off the two 600px blocks in style.css ----------
     Kept last, as they are there: these override base rules of equal
     specificity. */
  @media (max-width: 600px) {
    .card.compact .card-media {
      width: 96px;
    }

    .card-body {
      padding: 11px 12px 12px;
    }

    .card-name {
      font-size: var(--t-control);
      /* The icon buttons grow to a hittable size here and the name was
         aligned on its baseline, so on a one-line name the text and the
         icons drifted apart vertically. */
      align-items: center;
    }

    .card-desc {
      font-size: var(--t-data);
    }

    .card-name-acts {
      gap: 0;
    }

    /* Room is tight, so the wording goes and the icons stay - the button
       keeps its name through aria-label. `:has` rather than a blanket rule
       because the list toolbar sits in the same row and keeps its words. The `.vh`
       rule of `styles/tokens.css`, under a media query a class cannot carry. */
    .card :global(.card-acts .btn-lbl) {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    .card :global(.card-acts .btn.sm:has(.btn-lbl)) {
      padding: 0 10px;
      gap: 0;
    }
  }

  /* ---------- the roll card face ----------
     The row face is the base: the picture 96px beside the text, no number. The tall face needs
     a `faces` container of 641px, which a roll provides only while it sits on one line
     (DESIGN.md, "The Roll Page Rule"); up to 600px no container is that wide, so the phone
     keeps the row face. */
  .card.face {
    position: relative;
    flex-direction: row;
    align-items: flex-start;
    isolation: isolate;
  }

  .card.face .card-media {
    width: 96px;
    aspect-ratio: 1;
    margin: 10px 0 10px 10px;
    border-radius: 8px;
  }

  .card.face .card-body {
    padding: 10px 12px;
    gap: 4px;
  }

  .card.face :global(.badge.num) {
    display: none;
  }

  /* The tall face: the body is not positioned, so the number badge anchors to the card. The
     picture sits at `z-index: -1` inside the card's own stacking context: a mask would paint
     it over the body's foot otherwise. */
  @container faces (min-width: 641px) {
    .card.face {
      flex-direction: column;
      align-items: stretch;
    }

    .card.face .card-media {
      z-index: -1;
      width: 100%;
      aspect-ratio: 4 / 3;
      margin: 0;
      border-radius: 0;
      mask-image: linear-gradient(180deg, #000 72%, transparent);
    }

    /* The fade would take the ring's bottom edge with it. */
    .card.face .card-media:focus-visible {
      mask-image: none;
    }

    /* The body's badges paint over the sunk picture's own ring, so the card repeats it on top. */
    .card.face:has(.card-media:focus-visible)::after {
      content: '';
      position: absolute;
      inset: 0 0 auto;
      aspect-ratio: 4 / 3;
      box-sizing: border-box;
      border: 2px solid var(--gold);
      border-radius: var(--r-sm);
      pointer-events: none;
    }

    .card.face .card-body {
      margin-top: -26px;
      padding: 0 14px 12px;
      gap: 7px;
    }

    .card.face :global(.badge.num) {
      display: inline-block;
      position: absolute;
      top: 10px;
      right: 10px;
    }
  }

  /* ---------- the dossier ----------
     Last: these override the card's base and phone rules of equal specificity. */
  .card.dossier {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
    background: none;
    border: 0;
    box-shadow: none;
    overflow: visible;
    animation: none;
  }

  .card.dossier .card-media {
    max-height: none;
    aspect-ratio: 4 / 3;
    border-radius: var(--r);
  }

  .card.dossier .card-body {
    padding: 0;
  }

  .card.dossier .card-name {
    font-size: var(--t-page);
    font-weight: var(--h-page-weight);
    letter-spacing: var(--h-page-spacing);
  }

  .card-sub {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .card-sub :global(.subline) {
    margin: 0;
    font-size: var(--t-small);
    color: var(--muted);
    overflow-wrap: anywhere;
  }

  .card-sub :global(.updated) {
    margin: 0;
  }

  /* `position` anchors «Ещё» up to 760 px (PickRow.svelte). */
  .card.dossier .cardpick {
    position: relative;
    gap: 8px;
    margin-top: 6px;
    padding-top: 0;
    border-top: 0;
  }

  @media (max-width: 760px) {
    .card.dossier .cardpick :global(.seldrop) {
      flex: 1 0 100%;
    }

    .card.dossier .cardpick :global(.seldrop > .btn) {
      width: 100%;
      justify-content: center;
    }

    /* `.btn.sm`'s insets: «Поделиться», «Печать» and «Ещё» share one line at 360 in RU. */
    .card.dossier .cardpick > :global(.btn),
    .card.dossier .cardpick :global(.morewrap > .btn) {
      padding: 0 11px;
      gap: 6px;
    }
  }

  @media (min-width: 761px) {
    .card.dossier {
      grid-template-columns: clamp(260px, 40%, 460px) minmax(0, 1fr);
      gap: 32px;
      align-items: start;
    }

    .card.dossier .card-media {
      aspect-ratio: 1;
    }
  }
</style>
