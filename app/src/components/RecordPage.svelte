<script lang="ts">
  /* The page at #/i/<id>: the record as a dossier, its name the page's `h1` and a line
     under it saying where the record is from.
     Three states, and two of them happen - a link to a record that has been
     renumbered, and a deploy where data.js did not load. */
  import LoadState from './LoadState.svelte';
  import NoData from './NoData.svelte';
  import NoItem from './NoItem.svelte';
  import PageTitle from './PageTitle.svelte';
  import PickRow from './PickRow.svelte';
  import RecordCard from './RecordCard.svelte';
  import RecordHost from './RecordHost.svelte';
  import TableLink from './TableLink.svelte';
  import { isHomebrewKey } from '../lib/homebrew.js';
  import { tablesHash } from '../lib/hash.js';
  import { tableOf, whereFrom } from '../lib/label.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    id: string;
  }

  const { app, id }: Props = $props();

  const t = $derived(app.t);
  const index = $derived(app.index);
  const it = $derived(index?.byId.get(id));
  /* An own item's key waits for the session and the author's items: neither the not-found
     page nor the item flashes (docs/specs/FEATURES.md, "Records"). */
  const waiting = $derived(
    isHomebrewKey(id) &&
      (app.user === undefined ||
        (!!app.user && (app.homebrew?.status === 'idle' || app.homebrew?.status === 'loading')))
  );
  const failed = $derived(
    isHomebrewKey(id) && !!app.user && app.homebrew?.status === 'error' && !it
  );
  const retry = (): void => void app.homebrew?.load();

  /* The line under the heading: where the record is from, and its number in the
     table it is printed in. The link goes to the row itself rather than to the
     table - "open the table and then look for it" is not an answer to the
     question "where is it". */
  const table = $derived(it ? tableOf(it) : null);
  const where = $derived.by(() => {
    if (!it) return '';
    const bits = [whereFrom(it, app.lang)];
    if (it.tier === 'A') bits.push(t.voaArtifact1);
    else if (it.tier === 'C') bits.push(t.voaCursed1);
    if (it.roll) bits.push(`${t.rollNo} ${String(it.roll)}`);
    /* An artifact's section word above already stands where its tier would. */
    else if (it.eq && it.eq.tier !== 'A') bits.push(`${t.tier} ${String(it.eq.tier)}`);
    return bits.join(' · ');
  });
</script>

<!-- A record opened over this page: a rung of the tier ladder, which opens the
     modal rather than a navigation - `RecordHost`'s own state. -->
<RecordHost {app} {index}>
  {#snippet children(openRecord)}
    {#if !index}
      <NoData>{t.noData}</NoData>
    {:else if waiting}
      <LoadState {t} failed={false} text={t.hbLoadFailed} onretry={retry} />
    {:else if failed}
      <!-- The author's items did not load: the item may exist, so no not-found page. -->
      <PageTitle title={t.hbLoadFailedTitle} />
      <LoadState {t} failed page text={t.hbLoadFailed} onretry={retry} />
    {:else if !it}
      <!-- A link to a record that is no longer in the data: an old share, or an id
           that was renumbered. Saying which is kinder than an empty page. -->
      <NoItem {app} />
    {:else}
      {#snippet sub()}
        <p class="subline">
          {where}
          {#if table}
            <TableLink
              href={app.href(tablesHash(table, { anchor: it.id }))}
              label={t.showInTable}
            />
          {/if}
        </p>
      {/snippet}

      <div class="itempage" data-primary>
        <RecordCard
          dossier
          heading="h1"
          {sub}
          {it}
          {index}
          lang={app.lang}
          artBroken={app.artBroken(it.id)}
          onartfail={(bad: string) => {
            app.markArtBroken(bad);
          }}
          onopen={openRecord}
          manage={isHomebrewKey(it.id)}
        >
          {#snippet pick()}
            <PickRow {app} {it} {index} />
          {/snippet}
        </RecordCard>
      </div>
    {/if}
  {/snippet}
</RecordHost>
