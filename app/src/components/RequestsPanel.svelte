<script lang="ts">
  /* The owner's purchase requests on an account list page: each pending,
     unexpired request with its lines against the stock now, «Принять» and
     «Отклонить», the refused apply's short lines and «Принять доступное», and
     the requests decided on this page load, folded. Drawn only while there is
     one of either (docs/specs/FEATURES.md, "Account and browser lists"). */
  import Actions from './Actions.svelte';
  import Button from './Button.svelte';
  import { nameOf } from '../lib/i18n.js';
  import type { StoredList } from '../lib/lists.js';
  import { moneyMode, priceText, totalParts } from '../lib/money.js';
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

  let open = $state(false);

  const itemName = (item: string): string => {
    const it = app.index?.byId.get(item);
    return it ? nameOf(it, app.lang) : item;
  };
  /* The stock now; null when the list no longer holds the item. */
  const stockOf = (item: string): number | null =>
    list.ids.includes(item) ? (list.meta?.[item]?.qty ?? 1) : null;
</script>

{#if owner && (pending.length || decided.length)}
  <section class="reqpanel" aria-labelledby="reqpanel-h">
    <h2 id="reqpanel-h">{t.requestsHead.replace('%n', String(pending.length))}</h2>
    {#each pending as r (r.id)}
      {@const short = owner.short[r.id]}
      {@const total = totalParts(requestTotal(r.lines), mode, app.lang, t)}
      <div class="req">
        <div class="who">{whoText(r, app.now, app.lang, t)}</div>
        <table>
          <tbody>
            {#each r.lines as l (l.item)}
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
    {#if decided.length}
      <div class="decided">
        <Button
          size="sm"
          variant="bare"
          caret
          expanded={open}
          onclick={() => {
            open = !open;
          }}>{t.requestsDecided.replace('%n', String(decided.length))}</Button
        >
        {#if open}
          <ul>
            {#each decided as d (d.id)}
              <li>
                {ageText(d, app.now, app.lang, t)} ·
                {#if d.verdict === 'declined'}<span class="st-no">{t.requestDeclinedLine}</span
                  >{:else if d.verdict === 'taken'}<span class="st-ok"
                    >{t.requestTakenLine.replace('%n', String(d.taken))}</span
                  >{:else}<span class="st-ok">{t.requestAppliedLine}</span>{/if}
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
    margin-top: 4px;
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
    .decided :global(.btn) {
      min-height: 36px;
    }
  }
</style>
