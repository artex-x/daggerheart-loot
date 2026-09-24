<script lang="ts">
  /* One print card, both layouts - off `printCardHTML` (app.js 3364-3425),
   * `dmgStripHTML` (3298-3320), `dieHTML` (3323-3331), `thStripHTML`
   * (3333-3356) and `fitPrintCards` (3438-3508). The colour and the
   * black-and-white layout are drawn from the same markup below, branching
   * exactly where the live code does - `class:bw` and the `{#if bw}`
   * branches, not two components: they share every helper and the fit.
   *
   * `.pc-text` reproduces `descHtml`'s non-plain branch, not `RecordCard`'s
   * `<p>`s - see `descParts` and CLAUDE.md's leading-space rule: no
   * whitespace of any kind between the tags in that block. */
  import { artSrc, descParts } from '../lib/desc.js';
  import { dict } from '../lib/dict.js';
  import { EQ_CLS, EQ_DT, EQ_RANGE, EQ_TYPE, eqWord, nameOf } from '../lib/i18n.js';
  import { printSrc } from '../lib/label.js';
  import { qtySuffix } from '../lib/share.js';
  import {
    cardArt,
    CARD_DIR,
    dmgParts,
    DICE_WITH_ART,
    glyphKey,
    PRINT_GLYPH,
    printTrait
  } from '../lib/print.js';
  import type { DescPart } from '../lib/desc.js';
  import type { Equip, Lang, Record_ } from '../lib/types.js';

  const GROW_CAP = 5;

  interface Props {
    it: Record_;
    lang: Lang;
    bw: boolean;
    artBroken: boolean;
    /** Reported back to `PrintPage`/`app.markArtBroken`, the same as
     *  `RecordCard`'s own `onerror` - a print sheet reached directly (a
     *  shared `#/print/...` address) has no other page that could have
     *  already caught a missing picture. */
    onartfail: (id: string) => void;
    /** The list's count for this card - FEATURES.md, Print. */
    qty?: number | undefined;
    /** A set's shared bonus, drawn as the last text line. `PrintPage` builds
     *  it: the card has no index. */
    setLine?: { label: string; body: string } | undefined;
  }

  const { it, lang, bw, artBroken, onartfail, qty, setLine }: Props = $props();

  const t = $derived(dict(lang));
  const counter = $derived(qtySuffix(qty));
  const eq = $derived(it.eq ?? null);
  const kindKey = $derived(glyphKey(it));
  const armor = $derived(!!(eq && eq.t === 'armor'));
  const burden = $derived(eq && !armor && eq.bu ? eq.bu : 0);
  /* An artifact weapon reads as a loot artifact card: the section tag, the
     class tag, the damage strip, and no tier band (FEATURES.md, print). */
  const tier = $derived(
    eq
      ? eq.tier === 'A'
        ? ''
        : String(eq.tier)
      : typeof it.tier === 'number'
        ? String(it.tier)
        : ''
  );
  const artifact = $derived(it.tier === 'A' || it.tier === 'C');
  const tag1 = $derived(
    artifact
      ? it.tier === 'A'
        ? t.voaArtifact1
        : t.voaCursed1
      : eq
        ? eqWord(EQ_TYPE, eq.t, lang)
        : it.kind === 'consumable'
          ? t.cons
          : t.item
  );
  /* The ribbon and die follow the weapon's class (a magic weapon needs
     Spellcast), on both strips; the damage box names each strip's own type. */
  const magFrame = $derived(eq?.cls === 'mag');
  const tag2 = $derived(eq && eq.t !== 'armor' && eq.cls ? eqWord(EQ_CLS, eq.cls, lang) : '');
  const parts = $derived<DescPart[]>(
    setLine
      ? [
          ...descParts(it, lang),
          { kind: 'line', label: setLine.label, body: ' ' + setLine.body }
        ]
      : descParts(it, lang)
  );
  const src = $derived(printSrc(it, lang));
  const hasArt = $derived(!!it.img && !artBroken);
  const pkClass = $derived(
    eq ? `pk-${eq.t}` : `pk-${it.kind === 'consumable' ? 'cons' : 'item'}`
  );

  let card = $state<HTMLElement | undefined>(undefined);

  /**
   * `fitPrintCards`'s loop body for one card. The rules-text ladder is ported
   * verbatim: the same constants, the same `-= 0.1` / `-= 1.5` steps, the
   * same `toFixed(1)` and the same exits. One rung of it is new, not ported:
   * before the shrink ladder, a black-and-white card's rules text grows in
   * 0.1cqw steps while it fits, capped at `GROW_CAP`.
   *
   * The strip is fitted first, because the rules text measures the space it
   * leaves (FEATURES.md, "Print"). Each value first tries one line: it
   * shrinks in 0.1cqw steps from its computed size (its paper floor can be
   * over 3cqw on the compact card) while it is too wide, down to 4.5pt. If
   * one line does not fit, it wraps and shrinks the same way down to 2.2cqw,
   * until it fits its cell's width in at most two lines; two lines get 1.2
   * leading. Beside a modifier, the damage-type label shrinks the same way
   * until it fits its box. Last, a strip whose tallest block is taller than
   * the ribbon's inner band grows until the band holds it.
   *
   * The two values the ladders read back through - `.pc-text`'s font size and
   * `.pc-content`'s `--pcpad` - are reset first: the live app fits against a
   * freshly-built DOM every render, and a re-fit here has to start from the
   * same blank state or a card that already shrank would never grow back on
   * a shorter re-render (a language switch, a layout change). `.pc-art`'s
   * `height`, `--artw` and `display` are not reset, because nothing measures
   * them: they are written once at the end, from `pad` and two `offsetTop`s,
   * and `.pc-art` is absolutely positioned, so its own last value cannot move
   * what the next pass reads. Runs synchronously after the DOM this effect
   * reads - never awaits fonts or images, exactly as the live call inside
   * `render()` does not either.
   *
   * This loop is linear in card count, not quadratic, only because
   * `container-type: size` on `.pcard` (below) implies `contain: layout
   * style size`: every forced style-and-layout pass here re-lays this one
   * 63x88mm card, not the whole sheet. Weakening that declaration (to
   * `inline-size`, say, or dropping it while moving the `cqw` units
   * elsewhere) turns the same unchanged loop quadratic in card count -
   * unmeasured damage on a 180-card print sheet.
   */
  function fit(el: HTMLElement): void {
    const text = el.querySelector<HTMLElement>('.pc-text');
    const art = el.querySelector<HTMLElement>('.pc-art');
    const box = el.querySelector<HTMLElement>('.pc-content');

    const cq = (px: number): number => (px / el.clientWidth) * 100;
    const rng = document.createRange();
    /* Integer tenths of a cqw, so the 2.2cqw floor is exact, not a
       floating-point outcome of the steps. */
    const shrink = (e: HTMLElement, over: () => boolean): void => {
      e.style.fontSize = '';
      const px = parseFloat(getComputedStyle(e).fontSize);
      let z = el.clientWidth > 0 && Number.isFinite(px) ? Math.round(cq(px) * 10) : 30;
      while (over() && z > 22) {
        z -= 1;
        e.style.fontSize = (z / 10).toFixed(1) + 'cqw';
      }
    };
    const lines = (v: HTMLElement): { wide: number; tops: number } => {
      rng.selectNodeContents(v);
      const tops: number[] = [];
      let wide = 0;
      for (const r of rng.getClientRects()) {
        if (r.width <= 0) continue;
        wide = Math.max(wide, r.width);
        if (!tops.some((t) => Math.abs(t - r.top) < 1)) tops.push(r.top);
      }
      return { wide, tops: tops.length };
    };
    for (const strip of el.querySelectorAll<HTMLElement>('.pc-strip')) {
      for (const v of strip.querySelectorAll<HTMLElement>('.pc-box b')) {
        v.style.lineHeight = '';
        /* One line first, down to the label floor: 0.2pt under the value
           floor costs less than a third line. */
        v.style.whiteSpace = 'nowrap';
        v.style.fontSize = '';
        const px = parseFloat(getComputedStyle(v).fontSize);
        let z = el.clientWidth > 0 && Number.isFinite(px) ? Math.round(cq(px) * 10) : 30;
        const pt = (tenths: number): number => (tenths / 1000) * el.clientWidth * 0.75;
        while (lines(v).wide > v.clientWidth && pt(z - 1) >= 4.5) {
          z -= 1;
          v.style.fontSize = (z / 10).toFixed(1) + 'cqw';
        }
        if (lines(v).wide > v.clientWidth) {
          v.style.whiteSpace = '';
          shrink(v, () => {
            const l = lines(v);
            return l.wide > v.clientWidth || l.tops > 2;
          });
          if (lines(v).tops === 2) v.style.lineHeight = '1.2';
        }
      }
      const lab = strip.querySelector<HTMLElement>('.pc-c1.wbonus .pc-box small');
      if (lab) {
        shrink(lab, () => {
          rng.selectNodeContents(lab);
          return rng.getBoundingClientRect().width > lab.clientWidth;
        });
      }
      /* `.pc-cells` is the ribbon's inner band, 56% of the strip's height. */
      strip.style.height = '';
      const band = strip.querySelector<HTMLElement>('.pc-cells');
      let tall = 0;
      for (const b of strip.querySelectorAll<HTMLElement>('.pc-box, .pc-bonus')) {
        tall = Math.max(tall, b.getBoundingClientRect().height);
      }
      if (band && tall > band.clientHeight) {
        strip.style.height = (Math.ceil(cq(tall / 0.56) * 10) / 10).toFixed(1) + 'cqw';
      }
    }

    if (!text) return;
    text.style.fontSize = '';
    if (box) box.style.removeProperty('--pcpad');
    const tight = (): boolean => text.scrollHeight > text.clientHeight + 1;

    let pct = 3.5;
    /* Black and white only: the picture's space is blank paper there, so short
       text grows until it would spill, under the name's 5.8cqw. Colour never
       grows: the picture owns that space - FEATURES.md, "Print" (issue 61). */
    if (bw && !tight()) {
      while (!tight() && pct < GROW_CAP - 0.05) {
        pct += 0.1;
        text.style.fontSize = pct.toFixed(1) + 'cqw';
      }
      if (tight()) {
        pct -= 0.1;
        text.style.fontSize = pct.toFixed(1) + 'cqw';
      }
    }
    while (tight() && pct > 3) {
      pct -= 0.1;
      text.style.fontSize = pct.toFixed(1) + 'cqw';
    }
    let pad = bw ? 5.8 : 23;
    while (tight() && pad > (bw ? 3 : 8)) {
      pad -= 1.5;
      if (box) box.style.setProperty('--pcpad', `${String(pad)}cqw`);
    }
    while (tight() && pct > 2.6) {
      pct -= 0.1;
      text.style.fontSize = pct.toFixed(1) + 'cqw';
    }

    if (art && box) {
      const line = cq(box.offsetTop) + pad;
      const top = cq(art.offsetTop);
      art.style.height = `${String(Math.max(0, line - top + 6))}cqw`;
      const band = Math.min(100, line - top - 1);
      art.style.setProperty('--artw', `${String(band)}cqw`);
      art.style.display = line - top < 24 ? 'none' : '';
    }
  }

  $effect(() => {
    void lang;
    void bw;
    void it;
    void qty;
    void setLine;
    if (card) fit(card);
  });
</script>

<!-- eslint-disable @typescript-eslint/no-confusing-void-expression -- {@render}
     returns void by design; two calls sitting adjacent with no whitespace
     between them, as the live markup has no gap, reads to this rule as a void
     expression inside another one. ListPage.svelte disables the same rule for
     the same reason, one line at a time; this file has too many sites for
     that to stay readable. `ignoreVoidReturningFunctions` (eslint.config.mjs)
     was tried instead and did not clear any of the three sites - it exposed
     more pre-existing violations here than it fixed, so this stays. -->
{#snippet band()}
  {#if tier}
    <span class="pc-tier"
      ><img src={cardArt('banner', bw)} alt="" /><b>{tier}</b><i>{t.tier}</i></span
    >
  {/if}
{/snippet}

{#snippet mark()}
  <!-- `width`/`height` reserve each mark's box before its image loads: in
       black and white the mark sits in the head that `fit()` measures. -->
  {#if armor && eq && eq.as != null}
    <span class="pc-shield"
      ><img src={cardArt('shield', bw)} alt="" width="33" height="36" /><b>{String(eq.as)}</b><i
        >{t.pcArmor}</i
      ></span
    >
  {:else if burden}
    <!-- `bu: 'any'` draws the one-handed mark captioned "1/2"; no two-handed
         pair is exported (docs/DECISIONS.md, "Gryphon Hammer `bu: 'any'`"). -->
    <span class="pc-burden"
      ><small>{burden === 'any' ? '1/2' : t.eqBurden}</small><img
        src={cardArt(burden === 2 ? 'burden-2' : 'burden-1', bw)}
        alt=""
        width="62"
        height="36"
      /></span
    >
  {/if}
{/snippet}

{#snippet tags()}
  <div class="pc-tags">
    <span class="pc-tag on">{tag1}</span>{#if tag2}<span class="pc-tag out">{tag2}</span>{/if}
  </div>
{/snippet}

{#snippet die(e: Pick<Equip, 'tr' | 'rg' | 'dmg' | 'dt'>, mag: boolean)}
  {@const parts2 = dmgParts(e.dmg)}
  {@const own = DICE_WITH_ART.has(parts2.die)}
  <span class="pc-die" class:own class:mag data-die={parts2.die}
    >{#if own}<img
        src={cardArt(`die-${parts2.die}-${mag ? 'mag' : 'phy'}`, bw)}
        alt=""
      />{/if}<b>{parts2.die}</b></span
  >
{/snippet}

{#snippet box(label: string, value: string)}
  <span class="pc-box"><small>{label}</small><b>{value}</b></span>
{/snippet}

{#snippet dmgStrip(e: Pick<Equip, 'tr' | 'rg' | 'dmg' | 'dt'>, mag: boolean)}
  {@const parts2 = dmgParts(e.dmg)}
  <div class="pc-strip">
    <span class="pc-lead">{@render die(e, mag)}</span><span class="pc-frame"
      ><img class="pc-ribbon" src={cardArt(mag ? 'ribbon-mag' : 'ribbon', bw)} alt="" /><span
        class="pc-cells"
        ><span class="pc-c1" class:wbonus={!!parts2.bonus}
          >{#if parts2.bonus}<span class="pc-bonus">{parts2.bonus}</span>{/if}{@render box(
            t.pcDmg,
            eqWord(EQ_DT, e.dt, lang) || '—'
          )}</span
        ><span class="pc-c2">{@render box(t.pcTrait, printTrait(e.tr, lang))}</span><span
          class="pc-c3">{@render box(t.pcRange, eqWord(EQ_RANGE, e.rg, lang))}</span
        ></span
      ></span
    >
  </div>
{/snippet}

{#snippet thStrip(e: Equip)}
  {@const th = e.th ?? (['—', '—'] as const)}
  <div class="pc-thstrip">
    <div class="pc-cells">
      <span class="pc-th-lab"
        ><img src="{CARD_DIR}dots1.svg" alt="" /><small>{t.thLight}</small></span
      ><span class="pc-th-box"
        ><img src={cardArt('thbox', bw)} alt="" /><b>{String(th[0])}</b></span
      ><img class="pc-th-arrow" src="{CARD_DIR}arrow.svg" alt="" /><span class="pc-th-lab"
        ><img src="{CARD_DIR}dots2.svg" alt="" /><small>{t.thMajor}</small></span
      ><span class="pc-th-box"
        ><img src={cardArt('thbox', bw)} alt="" /><b>{String(th[1])}</b></span
      ><img class="pc-th-arrow" src="{CARD_DIR}arrow.svg" alt="" /><span class="pc-th-lab"
        ><img src="{CARD_DIR}dots3.svg" alt="" /><small>{t.thSevere}</small></span
      >
    </div>
  </div>
{/snippet}

<!-- Whitespace below is content, covering the whole card - see
     docs/specs/COVERAGE.md, "Whitespace text nodes are content". -->
<!-- prettier-ignore -->
<article class="pcard {pkClass}" class:bw data-pid={it.id} bind:this={card}
  >{#if !bw}<div class="pc-art"
      >{#if hasArt}<img
          class="pc-back"
          src={artSrc(it.img, artBroken)}
          alt=""
          aria-hidden="true"
          onerror={() => onartfail(it.id)}
        /><img
          class="pc-img"
          src={artSrc(it.img, artBroken)}
          alt=""
          onerror={() => onartfail(it.id)}
        />{:else}<svg
          class="pc-glyph"
          viewBox="0 0 48 50"
          aria-hidden="true"><path d={PRINT_GLYPH[kindKey]} /></svg
        >{/if}</div
    >{@render band()}{@render mark()}{/if}<div class="pc-content"
    >{#if bw}<div class="pc-head" class:withtier={!!tier}
        >{@render band()}{@render tags()}{@render mark()}</div
      >{:else}{@render tags()}{/if}<h2 class="pc-name">{nameOf(it, lang)}{#if counter}<span class="pc-qty">{counter}</span>{/if}</h2
    >{#if armor && eq}{@render thStrip(eq)}{:else if eq}{@render dmgStrip(
        eq,
        magFrame
      )}{#if eq.alt}{@render dmgStrip(eq.alt, magFrame)}{/if}{/if}<div class="pc-text"
      >{#each parts as part, i (i)}{#if part.kind === 'list'}<ul class="dlist"
          >{#each part.items as line, k (k)}<li
              >{#if line.label}<i>{line.label}:</i>{/if}{line.body}</li
            >{/each}</ul
        >{:else}{#if i > 0 && parts[i - 1]?.kind === 'line'}<br
          />{/if}{#if part.label}<i>{part.label}:</i>{/if}{part.body}{/if}{/each}</div
    ><div class="pc-bottom"><span>Daggerheart</span><span>{src}</span></div></div
  ></article
>

<!-- This block is style.css 1128-1395, ported verbatim in order - including
     `.pc-text p`, `.pc-text ol` and `.pc-text em`, which this component never
     draws (`descHtml`'s non-plain branch emits neither a `<p>` nor an `<ol>`,
     and no label uses `<em>`). A full copy is easier to audit against
     style.css than a pruned one, so the ignore below covers the whole
     stylesheet rather than pruning three rules a future diff would then
     have to reconcile by hand. -->
<!-- svelte-ignore css_unused_selector -->
<style>
  .pcard {
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
    container-type: size;
    border: 0.4mm dashed #c9c4d2;
    background: #fff;
    color: #000;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    font-family: var(--ui);
    /* The paper floor for small text (docs/DECISIONS.md, "Print card small
       text keeps the ribbon and gets one paper floor in every view"). */
    --pc-min-label: 4.5pt;
    --pc-min-value: 5pt;
  }

  .pc-art {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 100cqw;
    z-index: 1;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    overflow: hidden;
    background: #0a0810;
  }

  .pc-img {
    width: var(--artw, 62%);
    height: auto;
    object-fit: contain;
    display: block;
    position: relative;
    z-index: 1;
    -webkit-mask-image: linear-gradient(
      90deg,
      transparent 0,
      #000 5%,
      #000 95%,
      transparent 100%
    );
    mask-image: linear-gradient(90deg, transparent 0, #000 5%, #000 95%, transparent 100%);
  }

  .pc-back {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1.25);
    filter: blur(5cqw) brightness(0.62) saturate(0.85);
  }

  .pc-glyph {
    width: 34cqw;
    height: 36cqw;
    fill: #e6e3ec;
    margin: auto;
  }

  .pc-tier {
    position: absolute;
    left: 6.9cqw;
    top: 0;
    width: 12.8cqw;
    z-index: 4;
    display: block;
    text-align: center;
    color: #000;
  }

  .pc-tier img {
    display: block;
    width: 100%;
    height: auto;
  }

  .pc-tier b {
    position: absolute;
    left: 0;
    top: 2.6cqw;
    width: 100%;
    font: 900 6.4cqw/1 var(--ui);
  }

  .pc-tier i {
    position: absolute;
    left: 0;
    top: 9.6cqw;
    width: 100%;
    font: 500 max(2.6cqw, 4pt) / 1 var(--ui);
    font-style: normal;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .pc-burden {
    position: absolute;
    right: 6.9cqw;
    top: 5.8cqw;
    z-index: 4;
    display: block;
  }

  .pc-burden img {
    width: 18cqw;
    height: auto;
    display: block;
  }

  .pc-burden small {
    position: absolute;
    left: 0;
    right: 0;
    top: 100%;
    margin-top: 0.3cqw;
    text-align: center;
    font: 500 max(2.4cqw, var(--pc-min-label)) / 1 var(--ui);
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: #fff;
    -webkit-text-stroke: 0.9cqw #000;
    paint-order: stroke fill;
  }

  .pc-content {
    --pcpad: 23cqw;
    position: relative;
    z-index: 3;
    max-height: 100%;
    overflow: hidden;
    padding: var(--pcpad) 6.9cqw 5.8cqw;
    background: linear-gradient(
      180deg,
      rgb(255 255 255 / 0%) 0,
      rgb(255 255 255 / 0%) max(0cqw, calc(var(--pcpad) - 18cqw)),
      #fff var(--pcpad),
      #fff 100%
    );
    display: flex;
    flex-direction: column;
    gap: 1.2cqw;
  }

  .pc-tags {
    display: flex;
    gap: 1.2cqw;
    flex-wrap: wrap;
    padding-bottom: 1.2cqw;
  }

  .pc-tag {
    padding: 0.6cqw 2.3cqw;
    border-radius: 9cqw;
    white-space: nowrap;
    font: 500 max(2.9cqw, var(--pc-min-label)) / 1.2 var(--ui);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #000;
  }

  .pc-tag.on {
    background: linear-gradient(180deg, #fcec9c 10%, #edc659 100%);
  }

  .pc-tag.out {
    background: #fff;
    border: 0.25cqw solid #000;
    padding: 0.35cqw 2.05cqw;
  }

  .pc-name {
    margin: 0;
    font: 900 5.8cqw/1.1 var(--ui);
    text-transform: uppercase;
    letter-spacing: -0.01em;
  }

  .pc-qty {
    white-space: nowrap;
  }

  /* 14cqw is the design height; the compact card needs 20pt so a label
     and a value fit between the ribbon's ornament lines. */
  .pc-strip {
    position: relative;
    height: max(14cqw, 20pt);
    margin: 1.2cqw 0 0.6cqw;
  }

  .pc-lead {
    position: absolute;
    left: -0.7%;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    display: flex;
    align-items: center;
  }

  .pc-frame {
    position: absolute;
    left: 8%;
    right: 0;
    top: 0;
    bottom: 0;
  }

  .pc-thstrip {
    position: relative;
    height: max(10.4cqw, 18.5pt);
    margin: 1.6cqw 0 0.8cqw;
    border: 0.28cqw solid #75788a;
    border-radius: 2.4cqw;
  }

  .bw .pc-thstrip {
    border-color: #000;
  }

  .pc-thstrip .pc-cells {
    gap: 0;
    padding: 0 0.4cqw;
    justify-content: space-between;
  }

  /* Top-aligned, so the diamonds sit 0.6 mm clear of the frame's inner
     edge on either sheet. */
  .pc-th-lab {
    flex: 1 1 auto;
    align-self: stretch;
    min-width: 0;
    padding-top: max(1cqw, 0.6mm);
    text-align: center;
    line-height: 1;
  }

  .pc-th-lab img {
    display: block;
    width: auto;
    height: max(2.6cqw, 1.3mm);
    margin: 0 auto max(0.9cqw, 0.4mm);
  }

  .pc-th-lab small {
    display: block;
    font: 500 max(1.9cqw, var(--pc-min-label)) / 1.1 var(--ui);
    letter-spacing: -0.01em;
    text-transform: uppercase;
    color: #000;
    white-space: normal;
  }

  .pc-th-box {
    position: relative;
    flex: none;
    width: 8.8cqw;
    height: max(11.2cqw, 20pt);
    /* Room for the arrow's tip, 4.27pt right of the notch (x 33 of 36). */
    margin-right: calc(4.27pt - 0.733cqw + 0.2cqw);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* The arrow grows from the box's right notch (docs/DECISIONS.md, "Print
     card small text keeps the ribbon and gets one paper floor in every
     view"). The box is 36x36 units at 20pt tall on both sheets, so the %
     heights match. Outer: base on the notch stroke (x 33), corners inside
     its diagonals. Inner: a rim of the frame's 2 units; its base at x 30,
     inside the box, so no hairline shows. */
  .pc-th-box::before,
  .pc-th-box::after {
    content: '';
    position: absolute;
    z-index: 1;
    top: 50%;
    aspect-ratio: 7 / 12;
    transform: translateY(-50%);
    clip-path: polygon(0 0, 100% 50%, 0 100%);
  }

  .pc-th-box::before {
    left: 91.667%;
    height: 36.59%;
    background: #18171c;
  }

  .pc-th-box::after {
    left: 83.333%;
    width: calc(0.7333cqw + 2.97pt);
    background: #18171c;
  }

  /* The frame's gradient over the rim's height, as an SVG: a CSS gradient
     prints as tiled images. */
  .pcard:not(.bw) .pc-th-box::before {
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1' preserveAspectRatio='none'%3E%3ClinearGradient id='g' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop stop-color='%23f7df85'/%3E%3Cstop offset='1' stop-color='%23f1d16c'/%3E%3C/linearGradient%3E%3Crect width='1' height='1' fill='url(%23g)'/%3E%3C/svg%3E")
      0 0 / 100% 100% no-repeat;
  }

  /* Black and white: a solid arrow in the box stroke's ink. */
  .bw .pc-th-box::after {
    display: none;
  }

  .pc-th-box img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .pc-th-box b {
    position: relative;
    z-index: 2;
    font: 700 max(3.4cqw, var(--pc-min-value)) / 1 var(--ui);
    color: #fff;
  }

  .bw .pc-th-box b {
    color: #000;
  }

  /* Kept in the markup; the box's `::before` draws the arrow. */
  .pc-th-arrow {
    display: none;
  }

  .pc-shield {
    position: absolute;
    right: 6.9cqw;
    top: 5.8cqw;
    z-index: 4;
    display: block;
    width: 9.6cqw;
    text-align: center;
  }

  .pc-shield img {
    display: block;
    width: 100%;
    height: auto;
  }

  .pc-shield b {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font: 700 max(4cqw, var(--pc-min-value)) / 1 var(--ui);
    color: #fff;
  }

  .pc-shield i {
    position: absolute;
    left: -2cqw;
    right: -2cqw;
    top: 109%;
    font: 500 max(2.2cqw, var(--pc-min-label)) / 1 var(--ui);
    font-style: normal;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: #fff;
    -webkit-text-stroke: 0.9cqw #000;
    paint-order: stroke fill;
  }

  .pcard.bw {
    justify-content: flex-start;
  }

  .pcard.bw .pc-content {
    padding-top: 5.8cqw;
    background: none;
    flex: 1 1 auto;
  }

  .pc-head {
    display: flex;
    align-items: flex-start;
    gap: 2.4cqw;
    margin-bottom: 1.6cqw;
  }

  .pc-head .pc-tags {
    padding: 0;
    flex: 1 1 auto;
    align-items: flex-start;
  }

  .bw .pc-shield,
  .bw .pc-burden {
    position: relative;
    flex: none;
    top: auto;
    left: auto;
    right: auto;
  }

  .bw .pc-tier {
    width: 9.4cqw;
    left: 6.9cqw;
    top: 0;
  }

  .bw .pc-head.withtier {
    padding-left: 11.8cqw;
  }

  .bw .pc-tier b {
    top: 1.4cqw;
    font-size: 4.6cqw;
  }

  .bw .pc-tier i {
    top: 6.6cqw;
    font-size: max(2cqw, 4pt);
  }

  .bw .pc-shield {
    width: 9.6cqw;
  }

  .bw .pc-shield b {
    font-size: max(3.6cqw, var(--pc-min-value));
    color: #000;
  }

  .bw .pc-shield i,
  .bw .pc-burden small {
    color: #000;
    -webkit-text-stroke: 0;
  }

  .bw .pc-shield i {
    font-size: max(1.9cqw, var(--pc-min-label));
  }

  .bw .pc-burden {
    align-self: flex-start;
  }

  .bw .pc-burden img {
    width: 18cqw;
  }

  .bw .pc-burden small {
    font-size: max(1.9cqw, var(--pc-min-label));
  }

  .pc-head {
    padding-bottom: 3cqw;
  }

  .bw .pc-tag.on {
    background: #000;
    color: #fff;
  }

  .pc-ribbon {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }

  .pc-cells {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 0.9cqw;
  }

  /* The cells sit on the ribbon SVG's own geometry (275.5x47.9): its top
     ornament lines end at y 10.4 (22%), and the band is symmetric about the
     die's centre, so it ends at 78% - above the lower lines (y 38.9, 81.2%)
     and the diagonal at x 53.75-58.25 (y 36.9, 77%). The brackets span
     x 83.25-85.25 and 175.25-177.25, so the cells stop short of 30.2% and
     63.6%. `fit()` reads the 56% band. */
  .pc-strip .pc-cells {
    top: 22%;
    bottom: 22%;
    padding: 0;
    gap: 0;
  }

  .pc-strip .pc-c1,
  .pc-strip .pc-c2,
  .pc-strip .pc-c3 {
    position: absolute;
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    min-width: 0;
  }

  .pc-strip .pc-c1 {
    left: 6%;
    right: 70.4%;
  }

  .pc-strip .pc-c2 {
    left: 31.5%;
    right: 37%;
  }

  .pc-strip .pc-c3 {
    left: 65%;
    right: 2%;
  }

  .pc-strip .pc-c1.wbonus {
    justify-content: flex-start;
    gap: 0.5cqw;
  }

  .pc-die {
    position: relative;
    flex: none;
    width: 9.6cqw;
    height: 10.6cqw;
    display: flex;
    align-items: center;
    justify-content: center;
    clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
    background: #d09101;
  }

  .pc-die::before {
    content: '';
    position: absolute;
    inset: 0.5cqw;
    clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
    background: linear-gradient(180deg, #fefbd5 0%, #f7ef83 100%);
  }

  .bw .pc-die {
    background: #18171c;
  }

  .bw .pc-die::before {
    background: #fff;
  }

  .pc-die b {
    position: relative;
    z-index: 2;
    font: 700 max(3.6cqw, var(--pc-min-value)) / 1 var(--ui);
    color: #000;
  }

  /* Air after the `d` only: spacing the whole value reads `d10` as `d 1 0`. */
  .pc-die b::first-letter {
    margin-right: 0.12em;
  }

  /* A vector halo: a blurred `text-shadow` prints as a raster patch. */
  .pc-die.own b {
    -webkit-text-stroke: 0.6cqw #fff;
    paint-order: stroke fill;
  }

  .pcard:not(.bw) .pc-die.mag.own b {
    -webkit-text-stroke-color: #1b1535;
  }

  .pc-die.own[data-die='d4'] b {
    margin-left: -2.1cqw;
    font-size: max(2.9cqw, var(--pc-min-label));
  }

  .pcard:not(.bw) .pc-die.mag.own b {
    color: #fff;
  }

  .pc-die.own {
    clip-path: none;
    background: none;
    width: 11.6cqw;
    height: 11.6cqw;
    padding: 0;
  }

  .pc-die.own::before {
    display: none;
  }

  .pc-die.own img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .pc-die.own[data-die='d10'] b,
  .pc-die.own[data-die='d12'] b,
  .pc-die.own[data-die='d20'] b {
    font-size: max(3.1cqw, var(--pc-min-value));
  }

  .pc-bonus {
    flex: none;
    font: 700 max(3.2cqw, var(--pc-min-value)) / 1 var(--ui);
    color: #000;
  }

  .pc-box {
    display: block;
    flex: 1 1 auto;
    min-width: 0;
    text-align: center;
  }

  /* Labels in tracked capitals, values as the data writes them, so the two
     read apart (docs/DECISIONS.md, "Print card small text keeps the ribbon
     and gets one paper floor in every view"). */
  .pc-box small {
    display: block;
    margin-bottom: 0.25em;
    font: 500 max(2.2cqw, var(--pc-min-label)) / 1.05 var(--ui);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #000;
  }

  /* `fit()` shrinks this one label to its width beside the modifier. */
  .pc-strip .pc-c1.wbonus .pc-box small {
    letter-spacing: 0;
  }

  /* No clipping box: a clip cut the tops of the capitals on paper. A value
     keeps one line or wraps to two, and `fit()` shrinks it. */
  .pc-box b {
    display: block;
    font: 600 max(3cqw, var(--pc-min-value)) / 1 var(--ui);
    text-transform: none;
    color: #000;
  }

  /* The damage type is one word; `::first-letter` would break `fit()`'s
     `Range` width. */
  .pc-strip .pc-c1 .pc-box b {
    text-transform: capitalize;
  }

  .pc-text {
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
    font-size: 3.5cqw;
    line-height: 1.25;
  }

  .pc-text p {
    margin: 0 0 1.4cqw;
  }

  .pc-text ul,
  .pc-text ol {
    margin: 0 0 1.4cqw;
    padding-left: 4cqw;
  }

  /* The global `.dlist li` rule (style.css:725) still applies to a live list
     item; ported here since the card's list is this component's own markup
     and no global `.dlist` rule exists in `app/`. */
  .pc-text li {
    margin: 1px 0;
  }

  .pc-text i,
  .pc-text em {
    color: #000;
  }

  .pc-bottom {
    margin-top: auto;
    display: flex;
    justify-content: space-between;
    gap: 2cqw;
    padding-top: 1.4cqw;
    font: italic 400 max(2.9cqw, var(--pc-min-label)) / 1.4 var(--ui);
    color: #000;
    white-space: nowrap;
  }

  @media print {
    .pcard {
      break-inside: avoid;
    }
  }
</style>
