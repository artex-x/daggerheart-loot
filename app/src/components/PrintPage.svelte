<script lang="ts">
  /* `#/p/<id>` - a stored print set (docs/specs/FEATURES.md, "Print"); the sheet itself is
   * off `renderPrint` (`git show 23c00a6^:app.js`) and the print handlers
   * (`printBack`/`doPrint`/`printArt`/`printLink`, `git show 23c00a6^:app.js`). No `PageHead`:
   * the way back and the heading share one row (`Crumb`), no pin, no help. */
  import Button from './Button.svelte';
  import Crumb from './Crumb.svelte';
  import ErrorPage from './ErrorPage.svelte';
  import Icon from './Icon.svelte';
  import MoreMenu from './MoreMenu.svelte';
  import { tick } from 'svelte';
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
  import {
    COMPACT_PER_SHEET,
    pages,
    previewScale,
    setLineOf,
    sheetScale
  } from '../lib/print.js';
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
  /* Up to 760 px the screen draws one card per row at the column's width (at most 420 px);
     from 761 px the sheet, scaled to the column when A4 does not fit (FEATURES.md, "Print"). */
  const narrow = $derived(app.band === 'narrow');
  const fit = $derived(
    narrow ? previewScale(column, app.shownPrintCompact) : sheetScale(column)
  );

  /* The cards fit again once a face that was loading has arrived, and «Напечатать» waits
     for that answer (FEATURES.md, "Print"). An answer after the effect re-ran is dropped. */
  let refit = $state(0);
  let faceReady = $state(false);
  /* A string, so a recomputed list of the same cards starts no second wait. */
  const drawn = $derived(
    `${cards.map((c) => c.key).join(' ')}|${String(per)}|${String(app.shownPrintBW)}|${app.lang}`
  );
  $effect(() => {
    void drawn;
    faceReady = false;
    let live = true;
    void tick()
      .then(() => app.env.fonts.settled())
      .then((loading) => {
        if (!live) return;
        if (loading) refit++;
        faceReady = true;
      });
    return () => {
      live = false;
    };
  });

  /* The dock's height, so a focused control and the page's toast stop clear of it. */
  let dock = $state<HTMLDivElement | undefined>(undefined);
  $effect(() => {
    const el = dock;
    if (!el || typeof ResizeObserver !== 'function') return;
    const root = document.documentElement;
    const watch = new ResizeObserver(() => {
      root.style.setProperty('--ebar-h', `${String(el.offsetHeight)}px`);
    });
    watch.observe(el);
    return () => {
      watch.disconnect();
      root.style.removeProperty('--ebar-h');
    };
  });

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

  /* A handed-over link may have no history to step back to: the link's own address, home,
     not the lists. */
  function back(e: MouseEvent): void {
    if (!app.env.router.canGoBack()) return;
    e.preventDefault();
    app.env.router.back();
  }

  /* The press takes «Повторить» out of the DOM, so the focus goes to `#main` (rule 20). */
  function retry(): void {
    attempt++;
    void tick().then(() => document.getElementById('main')?.focus());
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
{:else if read === 'failed'}
  <!-- The failure replaces the page (docs/specs/FEATURES.md, rule 6). -->
  <ErrorPage title={t.printLoadFailedTitle} said>
    {t.printLoadFailed}
    {#snippet actions()}
      <Button variant="primary" onclick={retry}>{t.retry}</Button>
    {/snippet}
  </ErrorPage>
{:else if read === 'loading'}
  <PageTitle title={t.printTitle} />
  <LoadState {t} failed={false} text={t.printLoadFailed} onretry={retry} />
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
    <Crumb
      href={app.href(sectionHash('roll/std'))}
      label={t.back}
      title={t.printTitle}
      onback={back}
    />
    <div class="prow">
      {#if !narrow}
        <Button variant="primary" disabled={!faceReady} onclick={print}
          ><Icon name="print" />{t.printNow}</Button
        >
      {/if}
      <PrintSwitches {app} />
      {#if !narrow}
        <Button onclick={() => void copyLink()}><Icon name="link" />{t.printLink}</Button>
      {/if}
    </div>
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
  </div>
  <!-- From 761 px to about 840 px the screen draws the sheets scaled to the column, and up
       to 760 px one card per row; print media draws the sheets at full size, and each card
       divides the scale out of its fit. -->
  <div
    class="pfit"
    class:one={narrow}
    class:scaled={!narrow && fit < 1}
    style:--pfit={narrow || fit < 1 ? fit : undefined}
    style:--pfit-n={!narrow && fit < 1 ? sheet.pages.length : undefined}
    bind:clientWidth={column}
  >
    <div class="pfit-in">
      <!-- A size change remounts every card, so `fit()` measures it at the size
           it prints - PrintCard's effect does not track the sheet's size. -->
      {#key per}
        {#each sheet.pages as page, i (i)}
          {#if i > 0}
            <p class="psheet-n">
              {t.printSheetN
                .replace('%n', String(i + 1))
                .replace('%m', String(sheet.pages.length))}
            </p>
          {/if}
          <div
            class="psheet"
            data-primary
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
                compact={app.shownPrintCompact}
                {refit}
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
  <div class="pfoot">
    <p class="psub">{sub}</p>
  </div>
  {#if narrow}
    <div class="pdock" bind:this={dock}>
      <Button variant="primary" disabled={!faceReady} onclick={print}
        ><Icon name="print" />{t.printNow}</Button
      >
      <span class="dockmore">
        <MoreMenu {app} id="print-more" up>
          {#snippet children(close: () => void)}
            <button
              type="button"
              role="menuitem"
              tabindex="-1"
              onclick={() => {
                close();
                void copyLink();
              }}><Icon name="link" />{t.printLink}</button
            >
          {/snippet}
        </MoreMenu>
      </span>
    </div>
  {/if}
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

  /* From 761 px the primary, the two switches and the link; up to 760 px the switches. */
  .prow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--gap-sm);
    margin-top: 8px;
  }

  /* The page's sub line follows the last sheet (the First-Screen Rule). The sheet prints
     its fills with no «Фоновые изображения» (`print-color-adjust: exact`), so no hint says
     to turn it on (measured 2026-11-06: 0% of pixels differ). */
  .psub {
    margin: 0;
    color: var(--muted);
    font-size: var(--t-small);
    max-width: var(--measure-line);
    overflow-wrap: anywhere;
  }

  .psheet-n {
    margin: 0 0 8px;
    text-align: center;
    color: var(--muted);
    font-size: var(--t-data);
  }

  /* Up to 760 px: the primary and «Ещё» on the ground of the editor's bar. */
  .pdock {
    display: flex;
    gap: var(--gap-sm);
    margin: 12px -16px 0;
    padding: 10px 18px calc(10px + env(safe-area-inset-bottom));
    background: var(--surface);
    border-top: 1px solid var(--line);
  }

  .pdock > :global(.btn) {
    flex: 1 1 auto;
    justify-content: center;
  }

  /* The dock's button sits at the window's edge: this box anchors the menu. */
  .dockmore {
    position: relative;
    display: flex;
    flex: none;
  }

  @media (min-height: 481px) {
    .pdock {
      position: sticky;
      bottom: 0;
      z-index: 3;
    }
  }

  .printnote {
    margin: 8px 0 0;
    font-size: var(--t-data);
    line-height: 1.55;
    color: var(--muted2);
    max-width: var(--measure-text);
  }

  .printnote.warnnote {
    color: var(--danger);
    font-weight: 600;
  }

  .clipwarn {
    margin-top: 12px;
    max-width: var(--measure-text);
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
     182x258 mm of cards centered on A4 - FEATURES.md, "Print". */
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
    /* One card per row, each drawn at its paper size and scaled by the transform. */
    .pfit.one .psheet {
      --pcard-w: 63mm;
      --pcard-h: 88mm;
      width: auto;
      height: auto;
      padding: 0;
      margin: 0 0 12px;
      background: none;
      box-shadow: none;
      grid-template-columns: calc(var(--pcard-w) * var(--pfit));
      grid-template-rows: none;
      grid-auto-rows: calc(var(--pcard-h) * var(--pfit));
      gap: 12px;
      justify-content: center;
    }

    .pfit.one .psheet.compact {
      --pcard-w: 44mm;
      --pcard-h: 63mm;
    }

    .pfit.one .psheet > :global(.pcard) {
      width: var(--pcard-w);
      height: var(--pcard-h);
      transform: scale(var(--pfit));
      transform-origin: 0 0;
    }

    .pfit.one .psheet > .pcard.blank {
      display: none;
    }

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
    .printbar,
    .pfoot,
    .pdock,
    .psheet-n {
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
       sheet tall - the extra millimeter below is that page. */
    .psheet:last-child {
      height: 296.9mm;
    }

    :global(*) {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
</style>
