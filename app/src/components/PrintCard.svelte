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
  import { EQ_CLS, EQ_DT, EQ_RANGE, EQ_TRAIT, EQ_TYPE, eqWord, nameOf } from '../lib/i18n.js';
  import { isFrameRecord, printSrc } from '../lib/label.js';
  import { cardArt, CARD_DIR, dmgParts, DIE_ART, glyphKey, PRINT_GLYPH } from '../lib/print.js';
  import type { Equip, Lang, Record_ } from '../lib/types.js';

  interface Props {
    it: Record_;
    lang: Lang;
    bw: boolean;
    artBroken: boolean;
  }

  const { it, lang, bw, artBroken }: Props = $props();

  const t = $derived(dict(lang));
  const eq = $derived(it.eq ?? null);
  const kindKey = $derived(glyphKey(it));
  const armor = $derived(!!(eq && eq.t === 'armor'));
  const burden = $derived(eq && !armor && eq.bu ? eq.bu : 0);
  const tier = $derived(
    eq?.tier && !isFrameRecord(it)
      ? String(eq.tier)
      : typeof it.tier === 'number'
        ? String(it.tier)
        : ''
  );
  const artifact = $derived((it.tier === 'A' || it.tier === 'C') && !eq);
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
  const tag2 = $derived(eq && eq.t !== 'armor' && eq.cls ? eqWord(EQ_CLS, eq.cls, lang) : '');
  const parts = $derived(descParts(it, lang));
  const src = $derived(printSrc(it, lang));
  const hasArt = $derived(!!it.img && !artBroken);
  const pkClass = $derived(
    eq ? `pk-${eq.t}` : `pk-${it.kind === 'consumable' ? 'cons' : 'item'}`
  );

  let card = $state<HTMLElement | undefined>(undefined);

  /**
   * `fitPrintCards`'s loop body for one card, ported verbatim: the same
   * constants, the same `-= 0.1` / `-= 1.5` steps, the same `toFixed(1)` and
   * the same exits. The measured `2.2cqw` floor on every strip value is a
   * floating-point outcome of eight subtractions of 0.1 from 3 - copy the
   * arithmetic, do not "improve" it.
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
   */
  function fit(el: HTMLElement): void {
    const text = el.querySelector<HTMLElement>('.pc-text');
    const art = el.querySelector<HTMLElement>('.pc-art');
    const box = el.querySelector<HTMLElement>('.pc-content');

    const cells = el.querySelectorAll<HTMLElement>('.pc-strip .pc-cells');
    for (const cell of cells) {
      const vals = cell.querySelectorAll<HTMLElement>('.pc-box b');
      const rng = document.createRange();
      const over = (): boolean => {
        for (const v of vals) {
          rng.selectNodeContents(v);
          if (rng.getBoundingClientRect().width > v.clientWidth - 2) return true;
        }
        return false;
      };
      let sz = 3;
      for (const v of vals) v.style.fontSize = '';
      while (over() && sz > 2.2) {
        sz -= 0.1;
        for (const v of vals) v.style.fontSize = sz.toFixed(1) + 'cqw';
      }
    }

    if (!text) return;
    text.style.fontSize = '';
    if (box) box.style.removeProperty('--pcpad');
    const tight = (): boolean => text.scrollHeight > text.clientHeight + 1;

    let pct = 3.5;
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
      const cq = (px: number): number => (px / el.clientWidth) * 100;
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
    if (card) fit(card);
  });
</script>

<!-- eslint-disable @typescript-eslint/no-confusing-void-expression -- {@render}
     returns void by design; two calls sitting adjacent with no whitespace
     between them, as the live markup has no gap, reads to this rule as a void
     expression inside another one. ListPage.svelte disables the same rule for
     the same reason, one line at a time; this file has too many sites for
     that to stay readable. -->
{#snippet band()}
  {#if tier}
    <span class="pc-tier"
      ><img src={cardArt('banner', bw)} alt="" /><b>{tier}</b><i>{t.tier}</i></span
    >
  {/if}
{/snippet}

{#snippet mark()}
  {#if armor && eq && eq.as != null}
    <span class="pc-shield"
      ><img src={cardArt('shield', bw)} alt="" /><b>{String(eq.as)}</b><i>{t.pcArmor}</i></span
    >
  {:else if burden}
    <span class="pc-burden"
      ><small>{t.eqBurden}</small><img
        src={cardArt(burden > 1 ? 'burden-2' : 'burden-1', bw)}
        alt=""
      /></span
    >
  {/if}
{/snippet}

{#snippet tags()}
  <div class="pc-tags">
    <span class="pc-tag on">{tag1}</span>{#if tag2}<span class="pc-tag out">{tag2}</span>{/if}
  </div>
{/snippet}

{#snippet die(e: Pick<Equip, 'tr' | 'rg' | 'dmg' | 'dt'>)}
  {@const parts2 = dmgParts(e.dmg)}
  {@const own = DIE_ART.has(parts2.die)}
  {@const mag = e.dt === 'mag'}
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

{#snippet dmgStrip(e: Pick<Equip, 'tr' | 'rg' | 'dmg' | 'dt'>)}
  {@const parts2 = dmgParts(e.dmg)}
  <div class="pc-strip">
    <span class="pc-lead">{@render die(e)}</span><span class="pc-frame"
      ><img
        class="pc-ribbon"
        src={cardArt(e.dt === 'mag' ? 'ribbon-mag' : 'ribbon', bw)}
        alt=""
      /><span class="pc-cells"
        ><span class="pc-c1" class:wbonus={!!parts2.bonus}
          >{#if parts2.bonus}<span class="pc-bonus">{parts2.bonus}</span>{/if}{@render box(
            t.pcDmg,
            eqWord(EQ_DT, e.dt, lang) || '—'
          )}</span
        ><span class="pc-c2">{@render box(t.pcTrait, eqWord(EQ_TRAIT, e.tr, lang))}</span><span
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

<!-- The whole card is written with no whitespace between tags on purpose:
     `.pc-tier`/`.pc-bottom`/`.pc-cells` etc. read as one text node with no
     gap in the live markup, and the parity harness's control-name/text-advance
     checks read exactly that. `prettier-ignore` covers the whole subtree
     rather than each inner element, the same device TableRows.svelte uses -
     Prettier puts a short tag back on its own line on every format otherwise,
     which reintroduces the gap. -->
<!-- prettier-ignore -->
<article class="pcard {pkClass}" class:bw data-pid={it.id} bind:this={card}
  >{#if !bw}<div class="pc-art"
      >{#if hasArt}<img
          class="pc-back"
          src={artSrc(it.img, artBroken)}
          alt=""
          aria-hidden="true"
        /><img class="pc-img" src={artSrc(it.img, artBroken)} alt="" />{:else}<svg
          class="pc-glyph"
          viewBox="0 0 48 50"
          aria-hidden="true"><path d={PRINT_GLYPH[kindKey]} /></svg
        >{/if}</div
    >{@render band()}{@render mark()}{/if}<div class="pc-content"
    >{#if bw}<div class="pc-head" class:withtier={!!tier}
        >{@render band()}{@render tags()}{@render mark()}</div
      >{:else}{@render tags()}{/if}<h2 class="pc-name">{nameOf(it, lang)}</h2
    >{#if armor && eq}{@render thStrip(eq)}{:else if eq}{@render dmgStrip(
        eq
      )}{#if eq.alt}{@render dmgStrip(eq.alt)}{/if}{/if}<div class="pc-text"
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
    font: 700 2.6cqw/1 var(--ui);
    font-style: normal;
    letter-spacing: 0.04em;
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
    bottom: -3.2cqw;
    text-align: center;
    font: 700 2.4cqw/1 var(--ui);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #fff;
    text-shadow:
      0 0 0.6cqw #000,
      0 0 1.2cqw #000;
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
    font: 600 2.9cqw/1.2 var(--ui);
    letter-spacing: 0.06em;
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

  .pc-strip {
    position: relative;
    height: 14cqw;
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
    height: 9cqw;
    margin: 1.6cqw 0 0.8cqw;
    border: 0.28cqw solid #75788a;
    border-radius: 2.4cqw;
  }

  .pc-thstrip .pc-cells {
    gap: 0;
    padding: 0 1.6cqw;
    justify-content: space-between;
  }

  .pc-th-lab {
    flex: 1 1 0;
    min-width: 0;
    max-width: 13cqw;
    text-align: center;
    line-height: 1;
  }

  .pc-th-lab img {
    display: block;
    width: auto;
    height: 1.2cqw;
    margin: 0 auto 0.4cqw;
  }

  .pc-th-lab small {
    display: block;
    font: 800 1.9cqw/1.15 var(--ui);
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: #18171c;
    white-space: normal;
  }

  .pc-th-box {
    position: relative;
    flex: none;
    width: 9.6cqw;
    height: 9.6cqw;
    display: flex;
    align-items: center;
    justify-content: center;
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
    font: 900 3.4cqw/1 var(--ui);
    color: #fff;
  }

  .bw .pc-th-box b {
    color: #18171c;
  }

  .pc-th-arrow {
    flex: none;
    width: 1.5cqw;
    height: auto;
    margin: 0 0.4cqw 0 0.2cqw;
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
    font: 900 4cqw/1 var(--ui);
    color: #fff;
  }

  .pc-shield i {
    position: absolute;
    left: -2cqw;
    right: -2cqw;
    top: 109%;
    font: 800 2.2cqw/1 var(--ui);
    font-style: normal;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #fff;
    text-shadow:
      0 0 0.6cqw #000,
      0 0 1.2cqw #000;
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
    font-size: 2cqw;
  }

  .bw .pc-shield {
    width: 9.6cqw;
  }

  .bw .pc-shield b {
    font-size: 3.6cqw;
    color: #18171c;
  }

  .bw .pc-shield i,
  .bw .pc-burden small {
    color: #18171c;
    text-shadow: none;
  }

  .bw .pc-shield i {
    font-size: 1.9cqw;
  }

  .bw .pc-burden {
    align-self: flex-start;
  }

  .bw .pc-burden img {
    width: 18cqw;
  }

  .bw .pc-burden small {
    bottom: -2.6cqw;
    font-size: 1.9cqw;
  }

  .pc-head {
    padding-bottom: 3cqw;
  }

  .pc-tag.on {
    background: linear-gradient(180deg, #fcec9c 10%, #edc659 100%);
  }

  .bw .pc-tag.on {
    background: #75788a;
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

  .pc-strip .pc-cells {
    padding: 0 3% 0 7%;
    gap: 0;
  }

  .pc-strip .pc-c1,
  .pc-strip .pc-c2,
  .pc-strip .pc-c3 {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.9cqw;
    min-width: 0;
    flex-basis: 0;
  }

  .pc-strip .pc-c1 {
    flex-grow: 23.8;
  }

  .pc-strip .pc-c2 {
    flex-grow: 32.9;
  }

  .pc-strip .pc-c3 {
    flex-grow: 33.3;
  }

  .pc-strip .pc-c1.wbonus {
    justify-content: space-between;
    padding-right: 1.6cqw;
  }

  .pc-strip .pc-box {
    flex: 0 1 auto;
    min-width: 0;
    padding: 0 0.6cqw;
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
    font: 900 3.6cqw/1 var(--ui);
    color: #18171c;
  }

  .pc-die.own b {
    text-shadow:
      0 0 0.5cqw #fff,
      0 0 0.5cqw #fff,
      0 0 1cqw #fff;
  }

  .pcard:not(.bw) .pc-die.mag.own b {
    text-shadow:
      0 0 0.5cqw #1b1535,
      0 0 0.5cqw #1b1535,
      0 0 1cqw #1b1535;
  }

  .pc-die.own[data-die='d4'] b {
    margin-left: -2.1cqw;
    font-size: 2.9cqw;
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
    font-size: 3.1cqw;
  }

  .pc-bonus {
    flex: none;
    font: 900 3.2cqw/1 var(--ui);
    color: #18171c;
  }

  .pc-box {
    flex: 1 1 0;
    min-width: 0;
    text-align: center;
    line-height: 1.05;
  }

  .pc-box small {
    display: block;
    font: 600 2.2cqw/1.1 var(--ui);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #2f2f37;
  }

  .pc-box b {
    display: block;
    font: 800 3cqw/1.1 var(--ui);
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
    font: 600 italic 2.9cqw/1.4 var(--ui);
    color: #2f2f37;
    white-space: nowrap;
  }

  @media print {
    .pcard {
      break-inside: avoid;
    }
  }
</style>
