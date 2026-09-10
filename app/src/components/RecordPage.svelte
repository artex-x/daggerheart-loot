<script lang="ts">
  /* The page at #/i/<id>, reproduced from `itemPage()` in app.js: a heading, a
     line saying where the record is from, and the card.
     Three states, and two of them happen - a link to a record that has been
     renumbered, and a deploy where data.js did not load. */
  import AddToList from './AddToList.svelte';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import RecordActions from './RecordActions.svelte';
  import RecordCard from './RecordCard.svelte';
  import RecordModal from './RecordModal.svelte';
  import { printHash, tablesHash } from '../lib/hash.js';
  import { nameOf } from '../lib/i18n.js';
  import { tableOf, whereFrom } from '../lib/label.js';
  import type { AppState } from '../state/app.svelte.js';
  import type { Record_ } from '../lib/types.js';

  interface Props {
    app: AppState;
    id: string;
  }

  const { app, id }: Props = $props();

  const t = $derived(app.t);
  const index = $derived(app.index);
  const it = $derived(index?.byId.get(id));

  /** Says what the last action did - the toast, off `app.say`. */
  const say = (msg: string, error?: boolean): void => {
    app.say(msg, { error });
  };

  /* A record opened over this page: a rung of the tier ladder, or the picture,
     both of which the live app answers with the modal rather than a
     navigation. */
  let open = $state<Record_ | null>(null);

  /* The line under the heading: where the record is from, and its number in the
     table it is printed in. The link goes to the row itself rather than to the
     table - "open the table and then look for it" is not an answer to the
     question "where is it". */
  const table = $derived(it ? tableOf(it) : null);
  const where = $derived.by(() => {
    if (!it) return '';
    const bits = [whereFrom(it, app.lang)];
    if (it.roll) bits.push(`${t.rollNo} ${String(it.roll)}`);
    else if (it.eq) bits.push(`${t.tier} ${String(it.eq.tier)}`);
    return bits.join(' · ');
  });
</script>

{#if !index}
  <p class="miss">{t.noData}</p>
{:else if !it}
  <!-- A link to a record that is no longer in the data: an old share, or an id
       that was renumbered. Saying which is kinder than an empty page. -->
  <h1 class="page-h">{t.notFound}</h1>
  <p class="miss">{t.notFoundSub}</p>
{:else}
  <h1 class="page-h">{nameOf(it, app.lang)}</h1>
  <p class="page-sub">
    {where}
    {#if table}
      <a class="itemtable" href={tablesHash(table, { anchor: it.id })}
        >{t.showInTable}<Icon name="external" /></a
      >
    {/if}
  </p>

  <div class="itempage">
    <RecordCard
      {it}
      {index}
      lang={app.lang}
      artBroken={app.artBroken(it.id)}
      onartfail={(bad: string) => {
        app.markArtBroken(bad);
      }}
      onopen={(r: Record_) => {
        open = r;
      }}
    >
      {#snippet nameActions()}
        <RecordActions {app} {index} {it} row="name" {say} />
      {/snippet}
      {#snippet actions()}
        <RecordActions {app} {index} {it} row="card" {say} />
      {/snippet}
      {#snippet pick()}
        <AddToList {app} key={it.id} ids={[it.id]} primary />
        <Button size="sm" href={printHash([it.id])} sameTab title={t.printHint}
          ><Icon name="print" />{t.print}</Button
        >
      {/snippet}
    </RecordCard>
  </div>
{/if}

{#if open && index}
  <RecordModal
    {app}
    {index}
    it={open}
    onclose={() => {
      open = null;
    }}
    onopen={(r: Record_) => {
      open = r;
    }}
  />
{/if}

<style>
  /* off `.page-h` and `.page-sub` in style.css */
  .page-h {
    margin: 0 0 4px;
    font-size: var(--h-page-size);
    font-weight: var(--h-page-weight);
    letter-spacing: var(--h-page-spacing);
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .page-sub {
    margin: 0 0 18px;
    color: var(--muted);
    font-size: 14px;
    max-width: 70ch;
  }

  .itemtable {
    white-space: nowrap;
    font-size: 13px;
    text-decoration: none;
    border-bottom: 1px solid transparent;
    color: var(--gold-soft);
  }

  .itemtable:hover {
    border-bottom-color: currentcolor;
  }

  .itemtable :global(svg) {
    width: 12px;
    height: 12px;
    fill: currentcolor;
    margin-left: 4px;
    vertical-align: -1px;
  }

  /* off `.itempage` */
  .itempage {
    max-width: 520px;
  }

  .miss {
    margin: 0;
    color: var(--muted);
  }
</style>
