<script lang="ts">
  /* One record in full, reproduced from the live app.
     The markup mirrors `cardHTML(it, {full:true})` in app.js and the styles are
     copied out of style.css - `.card`, `.card-media`, `.card-body`,
     `.card-meta`, `.badge`, `.card-name`, `.card-desc`, `.craft`, `.refs`,
     `.card-acts`. This was a refactor: the parity harness (deleted, issue
     47) compared the two apps pixel for pixel, so a value that was
     nearly right was a value that failed.

     Nothing here injects HTML. The description arrives parsed - see
     lib/desc.ts - so a label is an <i> element and a list is a real <ul>.

     The image review page draws this card's head too: docs/artwork.md, "The
     card follows the site's card". */
  import Actions from './Actions.svelte';
  import Badge from './Badge.svelte';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import { artSrc, descParts } from '../lib/desc.js';
  import { dict } from '../lib/dict.js';
  import { recordHash } from '../lib/hash.js';
  import { FOLD_OWN, cardBadges, foldOwn, relName, relOrder, srcLabel } from '../lib/label.js';
  import { madeFrom, setBonusOf, setOf, upgradeLine, upgradesTo } from '../lib/data.js';
  import { isHomebrewKey, isHomebrewRecord } from '../lib/homebrew.js';
  import { eqParts, nameOf } from '../lib/i18n.js';
  import type { AltCol, Index } from '../lib/data.js';
  import type { Lang, Record_ } from '../lib/types.js';
  import type { Snippet } from 'svelte';

  interface Props {
    /**
     * `full` is the record's own page: the picture on top, at full width.
     * `compact` is a result or a table row: the picture beside the text at
     * 132px, and the name is a link to the page rather than a heading of it.
     */
    variant?: 'full' | 'compact';
    it: Record_;
    index: Index;
    lang: Lang;
    /** Whether the picture failed to load earlier in this session. */
    artBroken: boolean;
    /**
     * The number badge, where the row it came up on is not its own row number.
     *
     * The alternate tables are twelve rows per column, and a record keeps the
     * number it has in the book it was printed in - so the badge has to say
     * which face found it, not where it sits in Core.
     */
    rollLabel?: number;
    /** Which duality column found it, badged in that column's colour. */
    col?: AltCol;
    onartfail: (id: string) => void;
    /**
     * Opens a record over whatever is on screen.
     *
     * It carries the record because it is not always this one: the tier ladder
     * opens a different rung of the same upgrade line.
     */
    onopen?: ((r: Record_) => void) | undefined;
    /** The two icon buttons beside the name: copy the name, copy the link. */
    nameActions?: Snippet;
    /** The labelled row under the description: send, picture, text. */
    actions?: Snippet;
    /** The add-to-list control and the print link, off `listPicker` in app.js -
     *  only the full card draws it, the same as `actions`. */
    pick?: Snippet | undefined;
  }

  const {
    variant = 'full',
    it,
    index,
    lang,
    artBroken,
    rollLabel,
    col,
    onartfail,
    onopen,
    nameActions,
    actions,
    pick
  }: Props = $props();

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
  const parts = $derived(descParts(it, lang));
  const art = $derived(artSrc(it.img, artBroken));
  const badges = $derived(cardBadges(it, lang, t));

  const into = $derived(relOrder(upgradesTo(index, it), lang));
  const from = $derived(relOrder(madeFrom(index, it), lang));

  /* The tier ladder: every rung of this upgrade line, in tier order. A line of
     one is not a ladder, and the live app leaves it out. */
  const ladder = $derived.by(() => {
    const line = it.eq?.line ? upgradeLine(index, it) : [];
    return line.length > 1 ? line : [];
  });
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
    const folded = foldOwn(list, FOLD_OWN, it.id);
    return isOpen(line) ? { shown: list, more: folded.more } : folded;
  }
  const fromFold = $derived(fold(from, 'from'));
  const intoFold = $derived(fold(into, 'into'));
  const setFold = $derived(fold(setMembers, 'set'));
  const ladderFold = $derived(fold(ladder, 'ladder'));
  const setBonus = $derived.by(() => {
    const b = setBonusOf(index, it);
    if (!b) return undefined;
    return lang === 'ru' ? { name: b.ru, text: b.rud } : { name: b.en, text: b.ende };
  });
  const refs = $derived(
    (it.refs ?? []).flatMap((key) => {
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
  <Button
    variant="bare"
    size="sm"
    caret
    expanded={isOpen(line)}
    onclick={() => {
      toggle(line);
    }}>{isOpen(line) ? t.relLess : t.andMore.replace('%n', String(more))}</Button
  >
{/snippet}

<!-- eslint-disable @typescript-eslint/no-confusing-void-expression, svelte/no-useless-mustaches --
     a `{@render}` tag reads as a void expression to the first rule; `{' '}` keeps the space
     before a fold button, which a block's edge would trim. -->
<article class="card {variant}" data-id={it.id}>
  <!-- A button rather than a figure: on a table row it opens the record, and
       the full card keeps the element so the two stay one component. -->
  <button type="button" class="card-media" aria-label={t.openPage} onclick={() => onopen?.(it)}>
    <img
      src={art}
      alt=""
      loading="lazy"
      decoding="async"
      onerror={() => {
        onartfail(it.id);
      }}
    />
  </button>

  <div class="card-body">
    <div class="card-meta">
      {#if it.roll}
        <Badge cls="num">{rollLabel ?? it.roll}</Badge>
      {/if}
      {#if col}
        <Badge cls={col}>{col === 'hope' ? t.hope : t.fear}</Badge>
      {/if}
      {#each badges as b, i (i)}
        <Badge cls={b.cls} title={b.title}>{b.text}</Badge>
      {/each}
      <Badge cls="src">{srcLabel(it, lang)}</Badge>
    </div>

    <h2 class="card-name">
      {#if variant === 'compact'}
        <!-- A link, because from a result the name is the way to the page. -->
        <a href={recordHash(it.id)} title={t.openPage}>{name}</a>
      {:else}
        <span>{name}</span>
      {/if}
      {#if nameActions}
        <span class="card-name-acts">{@render nameActions()}</span>
      {/if}
    </h2>

    {#if stats.length}
      <div class="eqstats">
        {#each stats as chip, i (i)}
          <span>{chip}</span>
        {/each}
      </div>
    {/if}

    <div class="card-desc">
      {#each parts as part, i (i)}
        {#if part.kind === 'list'}
          <ul>
            {#each part.items as line, j (j)}
              <li>
                {#if line.label}<i>{line.label}:</i>{/if}{line.body}
              </li>
            {/each}
          </ul>
        {:else}
          <p>
            {#if part.label}<i>{part.label}:</i>{/if}{part.body}
          </p>
        {/if}
      {/each}
    </div>

    {#if ladder.length}
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

    {#if into.length || from.length || setMembers.length || setBonus}
      <!-- Both directions in chain order: where a thing came from, then where
           it goes, each with its own arrow. Only the forward one travels into
           a copied message. -->
      <div class="craft">
        {#if from.length}
          <p>
            <Icon name="craftFrom" />
            <span class="craft-l">{t.craftFrom}</span>
            <span
              >{#each fromFold.shown as r, i (r.id)}{i > 0 ? ', ' : ''}<a
                  href={recordHash(r.id)}>{relName(r, lang)}</a
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
              >{#each intoFold.shown as r, i (r.id)}{i > 0 ? ', ' : ''}<a
                  href={recordHash(r.id)}>{relName(r, lang)}</a
                >{/each}{#if intoFold.more}{' '}{@render moreButton(
                  'into',
                  intoFold.more
                )}{/if}</span
            >
          </p>
        {/if}
        {#if setMembers.length}
          <!-- Every catalogue member in its order, then the own ones by name,
               the record itself inert: the tier ladder's own rule for the rung you are on
               (`.step.on[aria-current]` above), reused here for the piece
               of the set you are looking at. One flex item holding the
               whole comma-joined run, so the punctuation flows as prose
               rather than each name picking up the row's own flex gap. -->
          <p>
            <Icon name="craft" />
            <span class="craft-l">{t.setLabel}</span>
            <span
              >{#each setFold.shown as member, i (member.id)}{i > 0
                  ? ', '
                  : ''}{#if member.id === it.id}<span aria-current="true"
                    >{relName(member, lang)}</span
                  >{:else}<a href={recordHash(member.id)}>{relName(member, lang)}</a
                  >{/if}{/each}{#if setFold.more}{' '}{@render moreButton(
                  'set',
                  setFold.more
                )}{/if}</span
            >
          </p>
        {/if}
        {#if setBonus}
          <!-- One span, so the row's flex gap does not split the label from
               the text. A frozen copy alone in its set draws the bonus with no
               set line. -->
          <p>
            <span><i>{setBonus.name}:</i> {setBonus.text}</span>
          </p>
        {/if}
      </div>
    {/if}
    <!-- eslint-enable svelte/no-useless-mustaches -->

    {#if refs.length}
      <!-- Folded by default, so a card that quotes a spell is no taller than
           one that does not. -->
      <div class="refs">
        {#each refs as { key, card: r }, i (i)}
          <details>
            <summary>
              <Icon name="ref" />
              <span class="ref-n">{lang === 'ru' ? r.ru : r.en}</span>
              <i class="ref-s">{lang === 'ru' ? r.rusub : r.ensub}</i>
            </summary>
            <p>
              {#each (lang === 'ru' ? r.rud : r.ende).split('\n') as line, j (j)}{#if j > 0}<br
                  />{/if}{line}{/each}
            </p>
            {#if !isHomebrewKey(key)}
              <a
                href={lang === 'ru' ? r.url : r.url.replace('//ru.', '//en.')}
                target="_blank"
                rel="noopener">daggerheart.su</a
              >
            {:else if r.url}
              <a href={r.url} target="_blank" rel="noopener">{hostOf(r.url)}</a>
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
    background: #0a0810;
    overflow: hidden;
    flex: none;
    border: 0;
    padding: 0;
    display: block;
    cursor: zoom-in;
  }

  .card.full .card-media {
    width: 100%;
    aspect-ratio: 1;
    max-height: 420px;
    cursor: default;
  }

  .card.compact .card-media {
    width: 132px;
    aspect-ratio: 1;
  }

  @media (hover: hover) {
    .card.compact .card-media:hover img {
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
     is a real button flush against `.card`, and `.card` is `overflow: clip`.
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
    font: 650 10.5px/1 var(--mono);
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
    font: 650 12.5px/1 var(--ui);
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
    font-size: 17px;
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
    font-size: 19px;
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
    font: 600 11.5px/1 var(--mono);
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
    font-size: 13.5px;
    line-height: 1.55;
  }

  .card.full .card-desc {
    font-size: 14px;
    line-height: 1.62;
  }

  .card-desc :global(p) {
    margin: 0;
  }

  /* off `.dlist` in style.css. The values are the live ones, not a tidier
     equivalent: 1.2em of padding read the same and cost four pixels a row on
     the Vault of Ages cards, which are the ones with long lists. */
  .card-desc ul {
    margin: 4px 0 0;
    padding-left: 18px;
  }

  .card-desc li {
    margin: 1px 0;
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
    font-size: 12.5px;
    line-height: 1.45;
    min-width: 0;
  }

  .craft p > :global(*) {
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
    font-size: 10.5px;
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
    font-size: 12.5px;
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

  /* off style.css:400 - measured live, closed: offsetParent false, display
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
    font-size: 12px;
    line-height: 1.35;
    flex-wrap: wrap;
  }

  .refs summary::-webkit-details-marker {
    display: none;
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
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .refs details[open] summary {
    border-bottom: 1px solid var(--line);
  }

  .refs p {
    margin: 0;
    padding: 7px 9px 5px;
    color: var(--muted);
    font-size: 12.5px;
    line-height: 1.5;
  }

  .refs details > a {
    display: inline-block;
    padding: 0 9px 8px;
    font-size: 11px;
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
      font-size: 15.5px;
      /* The icon buttons grow to a hittable size here and the name was
         aligned on its baseline, so on a one-line name the text and the
         icons drifted apart vertically. */
      align-items: center;
    }

    .card-desc {
      font-size: 13px;
    }

    .card-name-acts {
      gap: 0;
    }

    /* Room is tight, so the wording goes and the icons stay - the button
       keeps its name through aria-label. `:has` rather than a blanket rule
       because the list toolbar sits in the same row and keeps its words. */
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
</style>
