<script lang="ts">
  /* The selection bar - ticking any row on a table raises it at the bottom of
     the window: a count, on a list page a total, a cross that clears
     everything, and three actions on the right. Reproduced from `renderSelBar` (app.js 3706-3721)
     and `#selBar` in index.html, right after `</footer>` and before the
     modal - `Shell.svelte` keeps that order.

     `{#if n}` is the honest equivalent of the live app's `hidden` plus an
     emptied `innerHTML`: it unmounts the bar's own `AddToList` and its
     document click listener when nothing is ticked, rather than leaving them
     idle for no reason. The shared page keeps the bar mounted, visually
     hidden while empty, so its live region exists before the first tick
     and announces it. */
  import { tick } from 'svelte';
  import AddToList from './AddToList.svelte';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import { printHash } from '../lib/hash.js';
  import type { ListEntryMeta } from '../lib/listLink.js';
  import { selCountText } from '../lib/i18n.js';
  import { takenQty, takenTotal } from '../lib/lists.js';
  import { moneyMode, totalParts } from '../lib/money.js';
  import { shareSelection } from '../lib/share.js';
  import type { AppState } from '../state/app.svelte.js';
  import type { Record_ } from '../lib/types.js';

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  const t = $derived(app.t);
  const n = $derived(app.sel.size);
  /* Tick order, not insertion into a Set by value - `Object.keys(S.sel)` in
     app.js keeps an existing key's position on select-all, which `SvelteSet`
     already matches. */
  const ids = $derived<string[]>([...app.sel]);

  /* Non-null only on the shared page - the same route gate `AddToList`
     reads. There, a ticked entry carries its taken count and price into the
     total, the copy and the add-to-list; a table or search selection
     carries none of them. */
  const shared = $derived(app.shared);
  const metaOf = (id: string): ListEntryMeta => shared?.meta?.[id] ?? {};
  const takenOf = (id: string): number => takenQty(metaOf(id), app.picked.get(id));
  const taken = $derived(shared ? takenTotal(ids, metaOf, takenOf) : null);
  const total = $derived(
    shared && taken ? totalParts(taken, moneyMode(shared), app.lang, t) : null
  );
  /* A list page names entries and pieces apart; a table or search selection
     has no stock, so it keeps the bare count. */
  const countText = $derived(
    taken ? selCountText(n, taken.pieces, app.lang, t) : `${t.selected} ${String(n)}`
  );
  const printHref = $derived(
    printHash(ids, shared ? Object.fromEntries(ids.map((id) => [id, takenOf(id)])) : undefined)
  );
  const takenMeta = $derived(
    shared
      ? Object.fromEntries(ids.map((id) => [id, { ...metaOf(id), qty: takenOf(id) }]))
      : undefined
  );

  /* A share link's reader other than its owner can send the ticked entries to the
     owner, and after an add from this bar is asked whether to (flow b). */
  const token = $derived(app.requestToken);
  const sender = $derived(app.requestSender);
  const lines = $derived(ids.map((id) => ({ item: id, qty: takenOf(id) })));
  const sent = $derived(token !== null && !!sender && sender.isSent(token, lines));
  const asking = $derived(
    sender?.asking && token !== null && sender.asking.token === token ? sender.asking : null
  );
  let remember = $state(false);
  let bar = $state<HTMLDivElement | undefined>(undefined);
  let question = $state<HTMLParagraphElement | undefined>(undefined);

  /* The question replaces the row that held the focused menu, so the focus
     moves to it, and back to «Добавить в список» after the answer. */
  $effect(() => {
    if (asking) question?.focus();
  });

  function answer(send: boolean): void {
    sender?.answer(send, remember);
    remember = false;
    void tick().then(() => {
      bar?.querySelector<HTMLElement>('.seldrop > .btn')?.focus();
    });
  }

  async function copySel(): Promise<void> {
    const index = app.index;
    if (!index) return;
    const items = ids.map((id) => index.byId.get(id)).filter((it): it is Record_ => !!it);
    if (!items.length) return;
    const priced = shared ? { metaOf, takenOf, mode: moneyMode(shared), t } : undefined;
    const { text, html } = shareSelection(items, index, app.lang, priced);
    await app.copied(() => app.env.clipboard.writeRich({ html, plain: text }), t.selCopied);
  }
</script>

{#if n || shared}
  <div class="selbarwrap" class:idle={!n}>
    <div class="selbar" bind:this={bar}>
      <span class="selsumm" aria-live={shared ? 'polite' : undefined}
        >{#if n}<span class="selcount">{countText}</span>&#32;{#if total}<span class="seltotal"
              >{total.label} <b>{total.value}</b>&#32;{#if total.unpriced}
                <span class="np">{total.unpriced}</span>{/if}</span
            >{/if}{/if}</span
      >{#if n}<button
          type="button"
          class="selx"
          title={t.clearSel}
          aria-label={t.clearSel}
          onclick={() => {
            app.clearSel();
          }}>&times;</button
        >
        {#if asking}
          <div class="notifyq" role="group" aria-labelledby="notifyq-text">
            <p id="notifyq-text" tabindex="-1" bind:this={question}>{t.notifyQuestion}</p>
            <Button
              size="sm"
              variant="primary"
              onclick={() => {
                answer(true);
              }}>{t.notifyYes}</Button
            >
            <Button
              size="sm"
              onclick={() => {
                answer(false);
              }}>{t.notifyNever}</Button
            >
            <label><input type="checkbox" bind:checked={remember} />{t.notifyRemember}</label>
          </div>
        {:else}
          <div class="selacts">
            <AddToList {app} key="sel" {ids} meta={takenMeta} primary />
            <Button size="sm" href={printHref} sameTab title={t.printHint}
              ><Icon name="print" />{t.print}</Button
            >
            <Button size="sm" onclick={() => void copySel()}
              ><Icon name="copy" />{t.copySel}</Button
            >
            {#if token !== null && sender}
              <span class="notify"
                ><Button
                  size="sm"
                  disabled={sender.sending || sent}
                  onclick={() => void sender.send(token, lines)}
                  >{sent
                    ? t.requestSentDone
                    : sender.sending
                      ? t.requestSending
                      : t.requestSend}</Button
                ></span
              >
            {/if}
          </div>
        {/if}{/if}
    </div>
  </div>
{/if}

<style>
  /* off `.selbarwrap` in style.css - declared twice, at line 54 (the safe-area
     padding, which applies everywhere the bar can appear) and at 799 (the
     sticky block, above the sticky topbar so the menu can open upward and
     never slide under it, the gradient, the gold top border and the blur).
     Both are merged into the one rule here. */
  .selbarwrap {
    padding-bottom: env(safe-area-inset-bottom);
    position: sticky;
    bottom: 0;
    z-index: 45;
    background: linear-gradient(180deg, rgb(20 17 30 / 86%), rgb(16 14 24 / 98%));
    border-top: 1px solid rgb(216 171 94 / 35%);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .selbarwrap.idle {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  /* off `.selbar` plus `.wrap` (style.css 52-53) - the rewrite has no global
     `.wrap` class; every frame element composes the same four properties off
     `--wrap` instead, as `Shell.svelte`'s `.foot` and `TabBar` already do. */
  .selbar {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    padding: 10px 0;
    width: var(--wrap);
    margin-inline: auto;
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }

  /* On a list page, a live region: a changed taken count re-reads the
     count and the total. A table keeps its old tree; the clear button stays
     outside the region. */
  .selsumm {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: 12px;
    row-gap: 6px;
    font-size: 13.5px;
    line-height: 1.3;
    color: var(--gold-soft);
  }

  .selcount {
    font-weight: 650;
    white-space: nowrap;
  }

  .seltotal b {
    font-weight: 650;
  }

  .seltotal .np {
    color: var(--muted);
  }

  .selx {
    width: 26px;
    height: 26px;
    flex: none;
    border-radius: 7px;
    border: 1px solid rgb(216 171 94 / 35%);
    background: transparent;
    color: var(--gold-soft);
    font-size: 17px;
    line-height: 1;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: 0.15s;
    position: relative;
  }

  .selx:hover {
    background: rgb(216 171 94 / 16%);
    border-color: var(--gold);
  }

  /* P12: 26px of paint, 44px of target - the same `PageHead.svelte`
     `.homebtn::after` shape, off `PageHead.svelte:133-141`. */
  .selx::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 44px;
    height: 44px;
    transform: translate(-50%, -50%);
  }

  .selacts {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-left: auto;
  }

  .notify {
    display: flex;
  }

  /* Flow b's question takes the action row's place. */
  .notifyq {
    flex: 1 1 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    font-size: 13.5px;
    color: var(--txt);
  }

  .notifyq p {
    margin: 0;
    flex: 1 1 260px;
  }

  .notifyq label {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    color: var(--muted);
  }

  /* TableRows.svelte's row checkbox. */
  .notifyq input {
    accent-color: var(--gold);
    width: 17px;
    height: 17px;
    margin: 0;
    cursor: pointer;
  }

  @media (max-width: 600px) {
    /* The summary wraps inside itself, so the clear button keeps its line. */
    .selsumm {
      flex: 1 1 0;
      min-width: 0;
    }

    .selx {
      width: 32px;
      height: 32px;
    }

    .selacts {
      width: 100%;
      margin-left: 0;
    }

    .selacts :global(.seldrop),
    .notify {
      flex: 1 1 100%;
    }

    .notifyq :global(.btn) {
      flex: 1 1 0;
      justify-content: center;
    }

    .selacts :global(.btn) {
      flex: 1 1 0;
      min-width: 0;
      width: 100%;
      justify-content: center;
      overflow: hidden;
    }
  }

  /* off `#selBar` in the live `@media print` block (style.css:1409) */
  @media print {
    .selbarwrap {
      display: none;
    }
  }
</style>
