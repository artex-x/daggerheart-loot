<script lang="ts">
  /* The selection bar's logic for the catalog, search, the own items and the shared page: add
     to a list, print, copy, the shared page's total and its send line. `SelectionBar.svelte`
     draws it (one bar shape on every list page). `Shell.svelte` keeps it after the
     footer, before the modal, as `#selBar` in the live index.html.

     It mounts while a row is ticked or the catalog's selection mode is on. The shared
     page keeps it mounted, visually hidden while empty, so its live region exists
     before the first tick and announces it. */
  import { tick } from 'svelte';
  import AddToList from './AddToList.svelte';
  import Button from './Button.svelte';
  import HomebrewBulk from './HomebrewBulk.svelte';
  import Icon from './Icon.svelte';
  import SelectionBar from './SelectionBar.svelte';
  import SignInPrompt from './SignInPrompt.svelte';
  import type { ListEntryMeta } from '../lib/lists.js';
  import { selCountText } from '../lib/i18n.js';
  import { takenQty, takenTotal } from '../lib/lists.js';
  import { moneyMode, totalParts } from '../lib/money.js';
  import { printAction } from '../lib/pending.js';
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
  /* The Items tab of «Мои предметы» adds its move, download and delete. */
  const hb = $derived(
    app.route.kind === 'homebrew' && app.route.tab === 'items' ? app.homebrew : null
  );
  const metaOf = (id: string): ListEntryMeta => shared?.meta?.[id] ?? {};
  const takenOf = (id: string): number => takenQty(metaOf(id), app.picked.get(id));
  const taken = $derived(shared ? takenTotal(ids, metaOf, takenOf) : null);
  const total = $derived(
    shared && taken ? totalParts(taken, moneyMode(shared), app.lang, t) : null
  );
  /* A list page names entries and pieces apart; a table or search selection
     has no stock, so it keeps the bare count. */
  const countText = $derived(
    taken ? selCountText(n, taken.pieces, app.lang, t) : t.selCount.replace('%n', String(n))
  );
  /* «Все» ticks the rows the page draws (`app.selectable`), every section. */
  const drawn = $derived(app.selectable);
  const drawnPicked = $derived(drawn.filter((id) => app.sel.has(id)).length);

  function all(checked: boolean): void {
    for (const id of drawn) {
      if (checked) app.sel.add(id);
      else {
        app.sel.delete(id);
        app.picked.delete(id);
      }
    }
  }

  /* Rule 20: «Снять выделение» leaves the mode; the focus returns to «Выбрать», else
     `#main` (the bar has left). */
  async function clear(): Promise<void> {
    app.clearSel();
    await tick();
    (
      document.querySelector<HTMLElement>('button.selmode') ?? document.getElementById('main')
    )?.focus();
  }
  /* On a list page the taken counts print; a table or search selection prints one each. */
  const printCounts = $derived(
    shared ? Object.fromEntries(ids.map((id) => [id, takenOf(id)])) : undefined
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
  /* What was sent and how long it waits, or the owner's decision, while the sent mark
     holds; plain text, not a live region: the toasts say the send and the decision. */
  const sentLine = $derived(token !== null && sender ? sender.lineFor(token, lines) : null);
  const asking = $derived(
    sender?.asking && token !== null && sender.asking.token === token ? sender.asking : null
  );
  let remember = $state(false);
  let question = $state<HTMLParagraphElement | undefined>(undefined);
  /* Signed out, «Печать» replaces the action row with the sign-in prompt, as the notify
     question replaces it; an empty bar forgets it. */
  let printAsking = $state(false);
  let printButton = $state<HTMLButtonElement | undefined>(undefined);
  let printPrompt = $state<HTMLDivElement | undefined>(undefined);

  $effect(() => {
    if (!n) printAsking = false;
  });

  $effect(() => {
    if (printAsking) printPrompt?.querySelector<HTMLElement>('.btn')?.focus();
  });

  function pressPrint(): void {
    const target = app.printTarget;
    if (target === 'prompt') printAsking = true;
    else if (target === 'cloud') void app.print(ids, printCounts);
  }

  function cancelPrint(): void {
    printAsking = false;
    void tick().then(() => {
      printButton?.focus();
    });
  }

  /* The question replaces the row that held the focused menu, so the focus
     moves to it, and back to «В список» after the answer. */
  $effect(() => {
    if (asking) question?.focus();
  });

  function answer(send: boolean): void {
    sender?.answer(send, remember);
    remember = false;
    void tick().then(() => {
      document.querySelector<HTMLElement>('.selbarwrap .seldrop > .btn')?.focus();
    });
  }

  async function copySel(): Promise<void> {
    const index = app.index;
    if (!index) return;
    const items = ids.map((id) => app.recordFor(id)).filter((it): it is Record_ => !!it);
    if (!items.length) return;
    const priced = shared ? { metaOf, takenOf, mode: moneyMode(shared), t } : undefined;
    const { text, html } = shareSelection(items, index, app.lang, priced);
    await app.copied(
      () => app.env.clipboard.writeRich({ html, plain: text }),
      (t) => t.selCopied
    );
  }
</script>

{#if n || shared || app.selecting}
  <SelectionBar
    label={t.selRegion}
    total={drawn.length}
    picked={drawnPicked}
    allLabel={t.selectAll}
    allText={t.allShort}
    count={countText}
    clearText={t.clearSel}
    onall={all}
    onclear={() => void clear()}
    idle={!n && !app.selecting}
  >
    {#snippet summary()}
      {#if n && total}
        <span class="seltotal"
          >{total.label} <b>{total.value}</b>&#32;{#if total.unpriced}
            <span class="np">{total.unpriced}</span>{/if}</span
        >
      {/if}
    {/snippet}
    {#snippet actions()}
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
      {:else if printAsking && app.printTarget === 'prompt'}
        <div class="printq" bind:this={printPrompt}>
          <SignInPrompt
            {app}
            compact
            lead={t.signInToPrint}
            after={{
              hash: app.hash,
              action: printAction(app.printEntriesOf(ids, printCounts))
            }}
            oncancel={cancelPrint}
          />
        </div>
      {:else}
        <AddToList {app} key="sel" {ids} meta={takenMeta} primary disabled={!n} />
        {#if app.printTarget !== 'none'}
          <Button
            size="sm"
            title={t.printHint}
            disabled={!n || app.printing || app.printTarget === 'wait'}
            bind:el={printButton}
            onclick={pressPrint}><Icon name="print" />{t.print}</Button
          >
        {/if}
        {#if !hb || app.band !== 'narrow'}
          <Button size="sm" disabled={!n} onclick={() => void copySel()}
            ><Icon name="copy" />{t.copyText}</Button
          >
        {/if}
        {#if hb}
          <HomebrewBulk {app} store={hb} {ids} copy={() => void copySel()} />
        {/if}
        {#if token !== null && sender}
          <span class="notify"
            ><Button
              size="sm"
              disabled={!n || sender.sending || sent}
              onclick={() => void sender.send(token, lines)}
              >{sent
                ? t.requestSentDone
                : sender.sending
                  ? t.requestSending
                  : t.requestSend}</Button
            ></span
          >
        {/if}
      {/if}
    {/snippet}
    {#snippet below()}
      {#if n && sentLine && !asking && !printAsking}
        <p class="sentline">{sentLine(t, app.lang)}</p>
      {/if}
    {/snippet}
  </SelectionBar>
{/if}

<style>
  .seltotal b {
    font-weight: 650;
  }

  .seltotal .np {
    color: var(--muted);
  }

  .notify {
    display: flex;
  }

  /* Information under the action row, not a warning (rule 19). */
  .sentline {
    margin: 0;
    font-size: var(--t-data);
    color: var(--muted);
    overflow-wrap: anywhere;
  }

  /* The print sign-in prompt takes the action row's place, as the question does. */
  .printq {
    flex: 1 1 100%;
  }

  /* Flow b's question takes the action row's place. */
  .notifyq {
    flex: 1 1 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    font-size: var(--t-small);
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

  .notifyq input {
    accent-color: var(--txt);
    width: 17px;
    height: 17px;
    margin: 0;
    cursor: pointer;
  }

  @media (max-width: 760px) and (min-height: 481px) {
    .notify {
      flex: 1 1 100%;
    }
  }

  @media (max-width: 760px) {
    .notifyq :global(.btn) {
      flex: 1 1 0;
      justify-content: center;
    }
  }
</style>
