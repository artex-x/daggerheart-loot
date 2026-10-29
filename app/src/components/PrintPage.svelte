<script lang="ts">
  /* `#/p/<id>` - a stored print set (docs/specs/FEATURES.md, "Print"); the sheet itself is
   * off `renderPrint` (`git show 23c00a6^:app.js`) and the print handlers
   * (`printBack`/`doPrint`/`printArt`/`printLink`, `git show 23c00a6^:app.js`). No `PageHead`: the
   * live markup writes a bare `h1`+`p`, no pin, no help. */
  import Actions from './Actions.svelte';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import KeepNote from './KeepNote.svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import LoadState from './LoadState.svelte';
  import NoData from './NoData.svelte';
  import NoticeBox from './NoticeBox.svelte';
  import PageTitle from './PageTitle.svelte';
  import PrintCard from './PrintCard.svelte';
  import PrintSwitches from './PrintSwitches.svelte';
  import StatusRegion from './StatusRegion.svelte';
  import { printSetHash, sectionHash } from '../lib/hash.js';
  import { withRecords } from '../lib/homebrew.js';
  import { COMPACT_PER_SHEET, pages, setLineOf, sheetScale } from '../lib/print.js';
  import { PRINT_SET_ID, type PrintSetRow } from '../lib/printSet.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    id: string;
  }

  const { app, id }: Props = $props();

  const t = $derived(app.t);
  /* Only a 12-character id is read; any other draws the gone state with no read, signed in
     or out (docs/specs/ROUTES.md). */
  const valid = $derived(PRINT_SET_ID.test(id));
  let read = $state<'loading' | 'failed' | 'gone' | 'ready'>('loading');
  let rows = $state.raw<PrintSetRow[]>([]);
  let missing = $state(0);
  let attempt = $state(0);
  /* The account, not the session object: a token refresh reads nothing again. */
  const userId = $derived(app.user?.userId);

  /* One read when the page opens, again on «Повторить» and after a sign-in; no live
     re-read. An answer that lands after the effect re-ran is dropped. */
  $effect(() => {
    void attempt;
    if (!valid || !userId) return;
    let live = true;
    read = 'loading';
    void app.loadPrintSet(id).then((r) => {
      if (!live) return;
      if (!r.ok) {
        read = 'failed';
        return;
      }
      if (!r.set) {
        read = 'gone';
        return;
      }
      rows = r.set.rows;
      missing = r.set.missing;
      read = 'ready';
    });
    return () => {
      live = false;
    };
  });

  /* A homebrew row draws the set's own record, never an own record of the same key: two
     authors can hold one key. */
  const cards = $derived(
    rows.flatMap((row) => {
      const it = 'record' in row ? row.record : app.recordFor(row.id);
      if (!it) return [];
      const hid = 'record' in row ? row.record.hid : undefined;
      return [{ it, q: row.q, key: hid ?? it.id }];
    })
  );
  const records = $derived(rows.flatMap((row) => ('record' in row ? [row.record] : [])));
  /* The set line names the members that the sheet holds. */
  const index = $derived(app.index ? withRecords(app.index, [], records) : null);
  const per = $derived(app.shownPrintCompact ? COMPACT_PER_SHEET : 9);
  const sheet = $derived(pages(cards, per));
  /** Just the keys `{#each}` needs for the blank places after the last
   *  card - an index array, built here so the template needs no unused
   *  item binding of its own. */
  const blankKeys = $derived(Array.from({ length: sheet.blanks }, (_, k) => k));

  let column = $state(0);
  /* The sheet's screen scale: the column's width over A4, 1 when the sheet fits
     (FEATURES.md, "Print"). */
  const fit = $derived(sheetScale(column));

  /* Whether each card still cuts off text after its fit, by the card's key; written only
     on a change, so a report cannot re-render the bar in a loop (FEATURES.md, "Print"). */
  const clippedBy = new SvelteMap<string, boolean>();
  const clippedCount = $derived([...clippedBy.values()].filter(Boolean).length);

  const sub = $derived(
    (app.shownPrintCompact ? t.printSubCompact : t.printSub)
      .replace('%n', String(cards.length))
      .replace('%p', String(Math.ceil(cards.length / per)))
  );
  const missingNote = $derived(t.printSetMissing.replace('%d', String(missing)));

  /* A handed-over link may have no history to step back to: home, not the lists. */
  function back(): void {
    if (app.env.router.canGoBack()) app.env.router.back();
    else app.go(sectionHash('roll/std'));
  }

  function print(): void {
    app.env.dialog.print();
  }

  async function copyLink(): Promise<void> {
    await app.copied(
      () => app.env.clipboard.writeText(app.linkTo(printSetHash(id))),
      (t) => t.linkCopied
    );
  }
</script>

{#if !app.index}
  <PageTitle title={t.printTitle} />
  <NoData>{t.noData}</NoData>
{:else if !valid}
  <PageTitle title={t.printTitle} sub={t.printSetGone} />
  <Button variant="primary" href={app.href(sectionHash('roll/std'))} sameTab>{t.toStart}</Button
  >
{:else if app.user === undefined}
  <!-- The session is not known yet: the heading alone, so no other state flashes (rule 7). -->
  <PageTitle title={t.printTitle} />
{:else if app.user === null}
  <PageTitle title={t.printTitle} sub={t.signInToPrint} />
  <Button
    variant="primary"
    onclick={() => {
      app.askSignIn({ hash: app.hash });
    }}>{t.signIn}</Button
  >
{:else if read === 'loading' || read === 'failed'}
  <PageTitle title={t.printTitle} />
  <LoadState
    {t}
    failed={read === 'failed'}
    text={t.printLoadFailed}
    onretry={() => {
      attempt++;
    }}
  />
{:else if read === 'gone'}
  <PageTitle title={t.printTitle} sub={t.printSetGone} />
  <Button variant="primary" href={app.href(sectionHash('roll/std'))} sameTab>{t.toStart}</Button
  >
{:else if !cards.length}
  <PageTitle title={t.printTitle} sub={t.printEmpty} />
  {#if missing > 0}
    <p class="printnote warnnote">{missingNote}</p>
  {/if}
  <Button variant="primary" href={app.href(sectionHash('roll/std'))} sameTab>{t.toStart}</Button
  >
{:else}
  <div class="printbar">
    <PageTitle title={t.printTitle} {sub} />
    <Actions>
      <Button onclick={back}><Icon name="back" />{t.back}</Button>
      <Button variant="primary" onclick={print}><Icon name="print" />{t.printNow}</Button>
      <PrintSwitches {app} />
      <Button onclick={() => void copyLink()}><Icon name="link" />{t.printLink}</Button>
    </Actions>
    {#if app.printChanged}<KeepNote {app} />{/if}
    {#if missing > 0}
      <p class="printnote warnnote">{missingNote}</p>
    {/if}
    <StatusRegion
      text={clippedCount ? t.printClipped.replace('%d', String(clippedCount)) : ''}
    />
    {#if clippedCount}
      <div class="clipwarn">
        <NoticeBox>{t.printClipped.replace('%d', String(clippedCount))}</NoticeBox>
      </div>
    {/if}
    <p class="printnote">{t.printNote}</p>
  </div>
  <!-- Below about 840 px the screen draws the sheets scaled to the column; print
       media draws them at full size, and each card divides the scale out of its fit. -->
  <div
    class="pfit"
    class:scaled={fit < 1}
    style:--pfit={fit < 1 ? fit : undefined}
    style:--pfit-n={fit < 1 ? sheet.pages.length : undefined}
    bind:clientWidth={column}
  >
    <div class="pfit-in">
      <!-- A size change remounts every card, so `fit()` measures it at the size
           it prints - PrintCard's effect does not track the sheet's size. -->
      {#key per}
        {#each sheet.pages as page, i (i)}
          <div
            class="psheet"
            class:bw={app.shownPrintBW}
            class:compact={app.shownPrintCompact}
            data-next={i ? '1' : undefined}
          >
            {#each page as c (c.key)}
              <PrintCard
                it={c.it}
                lang={app.lang}
                bw={app.shownPrintBW}
                qty={c.q}
                setLine={index ? setLineOf(index, c.it, app.lang) : undefined}
                screenScale={fit}
                artBroken={app.artBroken(c.it.id)}
                onartfail={(bad: string) => {
                  app.markArtBroken(bad);
                }}
                onfit={(cut: boolean) => {
                  if (clippedBy.get(c.key) !== cut) clippedBy.set(c.key, cut);
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
    </div>
  </div>
{/if}

<style>
  /* `.page-h`/`.page-sub` moved to `PageTitle.svelte`, `.miss` to
     `NoData.svelte`, `.card-acts` to `Actions.svelte` (though this
     component's own `.miss` read `--muted2` where `NoData`'s reads
     `--muted` - never photographed either way).

     off `.printbar`, `.printnote`, `.printnote.warnnote` (`git show 23c00a6^:style.css`) */
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

  .clipwarn {
    margin-top: 12px;
    max-width: 62ch;
  }

  /* off `.psheet` (`git show 23c00a6^:style.css`) */
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

  /* off `.pcard.blank` (`git show 23c00a6^:style.css`) - this component's own element, so
     `PrintCard`'s `.pcard` rules cannot reach it; the grid sizes the box. */
  .pcard.blank {
    box-sizing: border-box;
    background: #fff;
    border: 0;
  }

  /* The screen only: a transform moves no layout box, so the fit and the printed sheet
     stay the paper ones; the box takes the scaled height (FEATURES.md, "Print"). */
  @media screen {
    .pfit.scaled {
      height: calc(var(--pfit-n) * (297mm + 18px) * var(--pfit));
    }

    .pfit.scaled > .pfit-in {
      display: flow-root;
      width: 210mm;
      transform: scale(var(--pfit));
      transform-origin: 0 0;
    }
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
