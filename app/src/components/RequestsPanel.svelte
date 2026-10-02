<script lang="ts">
  /* The owner's purchase requests on an account list page: each pending,
     unexpired request with its lines against the stock now, «Принять» and
     «Отклонить», the refused apply's short lines and «Принять доступное», and
     the requests decided on this page load, folded, each with the items it
     asked for, and «Скрыть», which forgets them until the next page load. Drawn
     only while there is one of either. A request shows its first lines and the first
     requests show, each rest behind one fold button, so the panel stays about one screen
     at three times the limits (docs/specs/FEATURES.md, "Account and browser lists"). */
  import { tick } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import Actions from './Actions.svelte';
  import Button from './Button.svelte';
  import { frozenOf } from '../lib/cloudLists.js';
  import { nameOf } from '../lib/i18n.js';
  import type { StoredList } from '../lib/lists.js';
  import { moneyMode, priceText, totalParts } from '../lib/money.js';
  import { plural } from '../lib/plural.js';
  import { ageText, requestTotal, shortText, whoText } from '../lib/requests.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    list: StoredList;
  }

  const { app, list }: Props = $props();

  const t = $derived(app.t);
  const owner = $derived(app.ownerRequests);
  const pending = $derived(owner?.forList(list.id, app.now) ?? []);
  const decided = $derived(owner?.decidedFor(list.id) ?? []);
  const mode = $derived(moneyMode(list));

  const LINES_SHOWN = 5;
  const REQUESTS_SHOWN = 3;

  let open = $state(false);
  let head = $state<HTMLHeadingElement | undefined>(undefined);
  /* The requests whose every line is drawn, and whether every request is. */
  const linesOpen = new SvelteSet<string>();
  let allOpen = $state(false);
  const shown = $derived(allOpen ? pending : pending.slice(0, REQUESTS_SHOWN));

  /* The focus stays in the panel while it stays, and goes to the page's main when it goes. */
  async function hide(): Promise<void> {
    owner?.forget(list.id);
    open = false;
    await tick();
    if (head?.isConnected) head.focus();
    else document.getElementById('main')?.focus({ preventScroll: true });
  }

  const itemName = (item: string): string => {
    const it = app.index?.byId.get(item) ?? frozenOf(list)[item];
    return it ? nameOf(it, app.lang) : item;
  };
  const held = $derived(new Set(list.ids));
  /* The stock now; null when the list no longer holds the item. */
  const stockOf = (item: string): number | null =>
    held.has(item) ? (list.meta?.[item]?.qty ?? 1) : null;
</script>

{#if owner && (pending.length || decided.length)}
  <section class="reqpanel" aria-labelledby="reqpanel-h">
    <h2 id="reqpanel-h" tabindex="-1" bind:this={head}>
      {t.requestsHead.replace('%n', String(pending.length))}
    </h2>
    {#each shown as r (r.id)}
      {@const short = owner.short[r.id]}
      {@const total = totalParts(requestTotal(r.lines), mode, app.lang, t)}
      {@const all = linesOpen.has(r.id)}
      {@const rest = r.lines.length - LINES_SHOWN}
      <div class="req">
        <div class="who">{whoText(r, app.now, app.lang, t)}</div>
        <table>
          <tbody>
            {#each all ? r.lines : r.lines.slice(0, LINES_SHOWN) as l (l.item)}
              {@const stock = stockOf(l.item)}
              <tr>
                <td>{itemName(l.item)}</td>
                <td class="n" class:short={l.qty > (stock ?? 0)}
                  >{stock === null
                    ? t.requestNotInList
                    : t.requestOf.replace('%w', String(l.qty)).replace('%h', String(stock))}</td
                >
                <td class="n"
                  >{l.price === null ? '-' : priceText(l.price * l.qty, mode, app.lang)}</td
                >
              </tr>
            {/each}
          </tbody>
        </table>
        {#if rest > 0}
          <div class="more">
            <Button
              size="sm"
              variant="bare"
              caret
              expanded={all}
              onclick={() => {
                if (all) linesOpen.delete(r.id);
                else linesOpen.add(r.id);
              }}>{all ? t.relLess : plural(rest, t.requestLinesMoreN, app.lang)}</Button
            >
          </div>
        {/if}
        {#if total}
          <div class="total">
            {total.label} <b>{total.value}</b>{total.unpriced ? ' ' + total.unpriced : ''}
          </div>
        {/if}
        {#if short}
          <p class="shortmsg" role="alert">{shortText(short, itemName, t)}</p>
        {/if}
        <Actions>
          {#if !short}
            <Button
              size="sm"
              variant="primary"
              disabled={owner.busy !== null}
              onclick={() => void owner.apply(r.id, false)}>{t.requestApply}</Button
            >
          {:else if r.lines.some((l) => (stockOf(l.item) ?? 0) > 0)}
            <Button
              size="sm"
              variant="primary"
              disabled={owner.busy !== null}
              onclick={() => void owner.apply(r.id, true)}>{t.requestApplyAvailable}</Button
            >
          {/if}
          <Button
            size="sm"
            disabled={owner.busy !== null}
            onclick={() => void owner.decline(r.id)}>{t.requestDecline}</Button
          >
        </Actions>
      </div>
    {/each}
    {#if pending.length > REQUESTS_SHOWN}
      <div class="more">
        <Button
          size="sm"
          variant="bare"
          caret
          expanded={allOpen}
          onclick={() => {
            allOpen = !allOpen;
          }}
          >{allOpen
            ? t.relLess
            : plural(pending.length - REQUESTS_SHOWN, t.requestsMoreN, app.lang)}</Button
        >
      </div>
    {/if}
    {#if decided.length}
      <div class="decided">
        <div class="dhead">
          <Button
            size="sm"
            variant="bare"
            caret
            expanded={open}
            onclick={() => {
              open = !open;
            }}>{t.requestsDecided.replace('%n', String(decided.length))}</Button
          >
          <span class="hide"
            ><Button
              size="sm"
              variant="bare"
              label={t.requestsHideName}
              onclick={() => void hide()}>{t.requestsHide}</Button
            ></span
          >
        </div>
        {#if open}
          <ul>
            {#each decided as d (d.id)}
              <li>
                {ageText(d, app.now, app.lang, t)} ·
                {#if d.verdict === 'declined'}<span class="st-no">{t.requestDeclinedLine}</span
                  >{:else if d.verdict === 'taken'}<span class="st-ok"
                    >{t.requestTakenLine.replace('%n', String(d.taken))}</span
                  >{:else}<span class="st-ok">{t.requestAppliedLine}</span>{/if}
                <table class="dlines">
                  <tbody>
                    {#each d.lines as l (l.item)}
                      <tr><td>{itemName(l.item)}</td><td class="n">×{l.qty}</td></tr>
                    {/each}
                  </tbody>
                </table>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {/if}
  </section>
{/if}
{#if owner}
  <!-- Mounted before any request, outside the panel, so the first arrival is a
       change to a live region that already exists; keyed, so a second arrival is
       announced again. -->
  <div class="rsaid" role="status">
    {#key owner.arrived}{#if owner.arrived && owner.arrivedList === list.id}<span
          >{t.requestNew}</span
        >{/if}{/key}
  </div>
{/if}

<style>
  .reqpanel {
    margin: 0 0 18px;
    border: 1px solid rgb(var(--gold-rgb) / 45%);
    border-radius: var(--r);
    background: rgb(var(--gold-rgb) / 6%);
    padding: 12px 14px;
  }

  .reqpanel > h2 {
    margin: 0 0 8px;
    font-size: var(--step-0);
    font-weight: 650;
  }

  .req {
    border-top: 1px solid var(--line);
    padding: 10px 0;
  }

  .req:first-of-type {
    border-top: 0;
    padding-top: 0;
  }

  .who {
    font-size: 12.5px;
    color: var(--muted2);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0;
    font-size: 13.5px;
  }

  td {
    padding: 3px 0;
    vertical-align: top;
  }

  td.n {
    text-align: right;
    white-space: nowrap;
    padding-left: 12px;
  }

  td.short {
    color: var(--danger-text);
  }

  .total {
    font-size: 13.5px;
    color: var(--gold-soft);
    margin-bottom: 8px;
  }

  .total b {
    font-weight: 650;
  }

  .more {
    margin: 0 0 8px;
  }

  .shortmsg {
    font-size: 13.5px;
    color: var(--danger-text);
    margin: 0 0 8px;
  }

  .decided {
    border-top: 1px solid var(--line);
    padding-top: 8px;
  }

  ul {
    margin: 6px 0 0;
    padding: 0;
    list-style: none;
    font-size: 13.5px;
  }

  li + li {
    margin-top: 10px;
  }

  .dhead {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .dhead .hide {
    margin-left: auto;
  }

  table.dlines {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--muted);
  }

  table.dlines td:first-child {
    color: var(--txt);
  }

  .st-ok {
    color: var(--gold-soft);
  }

  .st-no {
    color: var(--danger-text);
  }

  /* Heard, not seen: a new request is announced once (the `.said` pattern of
     SharedListPage.svelte). */
  .rsaid {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (max-width: 600px) {
    .req :global(.btn) {
      flex: 1 1 0;
      justify-content: center;
    }

    /* A touch target at phone width, as every control here (DESIGN.md, "The Two
       Breakpoints Rule"). */
    .decided :global(.btn),
    .more :global(.btn) {
      min-height: 36px;
    }
  }
</style>
