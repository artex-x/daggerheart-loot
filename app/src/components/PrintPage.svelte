<script lang="ts">
  /* `#/print/<ids>` - off `renderPrint` (app.js 3510-3558) and the print
   * handlers (`printBack`/`doPrint`/`printArt`/`printLink`, app.js
   * 4236-4245). No `PageHead`: the live markup writes a bare `h1`+`p`, no
   * pin, no help. */
  import Actions from './Actions.svelte';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import NoData from './NoData.svelte';
  import PageTitle from './PageTitle.svelte';
  import PrintCard from './PrintCard.svelte';
  import Seg from './Seg.svelte';
  import { setBonusOf, setOf } from '../lib/data.js';
  import { PRINT_MAX, printHash, sectionHash } from '../lib/hash.js';
  import { namesOf } from '../lib/i18n.js';
  import { COMPACT_PER_SHEET, pages } from '../lib/print.js';
  import type { Record_ } from '../lib/types.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    ids: string[];
    dropped: number;
    qty: Record<string, number>;
  }

  const { app, ids, dropped, qty }: Props = $props();

  const t = $derived(app.t);
  const index = $derived(app.index);
  const items = $derived(
    index
      ? ids.flatMap((id) => {
          const it = index.byId.get(id);
          return it ? [it] : [];
        })
      : []
  );
  const per = $derived(app.printCompact ? COMPACT_PER_SHEET : 9);
  const sheet = $derived(pages(items, per));
  /** Just the keys `{#each}` needs for the blank places after the last
   *  card - an index array, built here so the template needs no unused
   *  item binding of its own. */
  const blankKeys = $derived(Array.from({ length: sheet.blanks }, (_, k) => k));

  /** The set's shared bonus as a card's last text line. The label names the
   *  members, so a card read alone still says the bonus needs the others. */
  function setLine(it: Record_): { label: string; body: string } | undefined {
    const bonus = index ? setBonusOf(index, it) : undefined;
    if (!index || !bonus) return undefined;
    const ru = app.lang === 'ru';
    return {
      label: `${ru ? bonus.ru : bonus.en} (${t.setLabel}: ${namesOf(setOf(index, it), app.lang)})`,
      body: ru ? bonus.rud : bonus.ende
    };
  }

  /* Both print switches are session memory on `AppState`, the way live's
     `S.printBW` (app.js:49) was - they survive leaving the page, unlike
     search's `q` and TablesPage's `q`, which stay component-local on
     purpose. `app.printBW` and `app.printCompact` directly, not local
     mirrors: this page remounts on every navigation, so a local copy would
     have to be re-synced from `app` on mount anyway. */

  const ART = $derived([
    { value: 'color', label: t.printColor },
    { value: 'bw', label: t.printBW }
  ] as const);
  const SIZE = $derived([
    { value: 'std', label: t.printStd },
    { value: 'compact', label: t.printCompact }
  ] as const);

  const sub = $derived(
    (app.printCompact ? t.printSubCompact : t.printSub)
      .replace('%n', String(items.length))
      .replace('%p', String(Math.ceil(items.length / per)))
  );
  const tooMany = $derived(
    t.printTooMany.replace('%n', String(PRINT_MAX)).replace('%d', String(dropped))
  );

  function back(): void {
    if (app.env.router.canGoBack()) app.env.router.back();
    else app.go(sectionHash('lists'));
  }

  function print(): void {
    app.env.dialog.print();
  }

  async function copyLink(): Promise<void> {
    await app.copied(
      () => app.env.clipboard.writeText(app.linkTo(printHash(ids, qty))),
      t.linkCopied
    );
  }
</script>

{#if !index}
  <NoData>{t.noData}</NoData>
{:else if !items.length}
  <PageTitle title={t.printTitle} sub={t.printEmpty} />
  <Button variant="primary" href={sectionHash('lists')} sameTab>{t.lists}</Button>
{:else}
  <div class="printbar">
    <PageTitle title={t.printTitle} {sub} />
    <Actions>
      <Button onclick={back}><Icon name="back" />{t.back}</Button>
      <Button variant="primary" onclick={print}><Icon name="print" />{t.printNow}</Button>
      <Seg
        small
        options={ART}
        value={app.printBW ? 'bw' : 'color'}
        label={t.printTitle}
        onchange={(v: 'color' | 'bw') => {
          app.printBW = v === 'bw';
        }}
      />
      <Seg
        small
        options={SIZE}
        value={app.printCompact ? 'compact' : 'std'}
        label={t.printSize}
        onchange={(v: 'std' | 'compact') => {
          app.printCompact = v === 'compact';
        }}
      />
      <Button onclick={() => void copyLink()}><Icon name="link" />{t.printLink}</Button>
    </Actions>
    {#if dropped}
      <p class="printnote warnnote">{tooMany}</p>
    {/if}
    <p class="printnote">{t.printNote}</p>
  </div>
  <!-- A size change remounts every card, so `fit()` measures it at the size
       it prints - PrintCard's effect does not track the sheet's size. -->
  {#key per}
    {#each sheet.pages as page, i (i)}
      <div
        class="psheet"
        class:bw={app.printBW}
        class:compact={app.printCompact}
        data-next={i ? '1' : undefined}
      >
        {#each page as it (it.id)}
          <PrintCard
            {it}
            lang={app.lang}
            bw={app.printBW}
            qty={qty[it.id]}
            setLine={setLine(it)}
            artBroken={app.artBroken(it.id)}
            onartfail={(bad: string) => {
              app.markArtBroken(bad);
            }}
          />
        {/each}
        {#if i === sheet.pages.length - 1}
          {#each blankKeys as k (k)}
            <div class="pcard blank"></div>
          {/each}
        {/if}
      </div>
    {/each}
  {/key}
{/if}

<style>
  /* `.page-h`/`.page-sub` moved to `PageTitle.svelte`, `.miss` to
     `NoData.svelte`, `.card-acts` to `Actions.svelte` (though this
     component's own `.miss` read `--muted2` where `NoData`'s reads
     `--muted` - never photographed either way).

     off `.printbar`, `.printnote`, `.printnote.warnnote` (style.css:1112-1116) */
  .printbar {
    margin-bottom: 18px;
  }

  .printnote {
    margin: 12px 0 0;
    font-size: 12.5px;
    line-height: 1.55;
    color: var(--muted2);
    max-width: 62ch;
  }

  .printnote.warnnote {
    color: var(--danger);
    font-weight: 600;
  }

  /* off `.psheet` (style.css:1118-1126) */
  .psheet {
    box-sizing: border-box;
    width: 210mm;
    height: 297mm;
    padding: 14.5mm 8.5mm;
    margin: 0 auto 18px;
    display: grid;
    grid-template-columns: repeat(3, 63mm);
    grid-template-rows: repeat(3, 88mm);
    gap: 2mm;
    background: #fff;
    color: #000;
    box-shadow:
      0 0 0 1px rgb(0 0 0 / 50%),
      0 14px 40px rgb(0 0 0 / 45%);
  }

  /* The opt-in compact sheet: 4x4 cards of 44x63 mm, the same 2 mm gutters,
     182x258 mm of cards centred on A4 - FEATURES.md, "Print". */
  .psheet.compact {
    padding: 19.5mm 14mm;
    grid-template-columns: repeat(4, 44mm);
    grid-template-rows: repeat(4, 63mm);
  }

  /* off `.pcard.blank` (style.css:1139) - this component's own element, so
     `PrintCard`'s `.pcard` rules cannot reach it; the grid sizes the box. */
  .pcard.blank {
    box-sizing: border-box;
    background: #fff;
    border: 0;
  }

  @media print {
    .printbar {
      display: none !important;
    }

    .psheet {
      margin: 0;
      box-shadow: none;
      break-inside: avoid;
    }

    .psheet[data-next] {
      break-before: page;
    }

    /* Chrome sometimes adds an empty page after the last block, exactly one
       sheet tall - the extra millimetre below is that page. */
    .psheet:last-child {
      height: 296.9mm;
    }

    :global(*) {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
</style>
