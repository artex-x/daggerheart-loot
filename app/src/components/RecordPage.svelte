<script lang="ts">
  /* The page at #/i/<id>: one record and what can be done with it.
     Three states, and two of them are things that actually happen - a link to a
     record that has been renumbered, and a deploy where data.js did not load. */
  import RecordActions from './RecordActions.svelte';
  import RecordCard from './RecordCard.svelte';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    id: string;
  }

  const { app, id }: Props = $props();

  const t = $derived(app.t);
  const index = $derived(app.index);
  const it = $derived(index?.byId.get(id));

  /* What the last action did. A live region rather than a toast: it has to be
     announced, and a message that only appears is one a screen reader misses. */
  let said = $state('');
</script>

{#if !index}
  <p class="miss">{t.noData}</p>
{:else if !it}
  <!-- A link to a record that is no longer in the data: an old share, or an id
       that was renumbered. Saying which is kinder than an empty page. -->
  <h1>{t.notFound}</h1>
  <p class="miss">{t.notFoundSub}</p>
{:else}
  <RecordCard
    {it}
    {index}
    lang={app.lang}
    artBroken={app.artBroken(it.id)}
    onartfail={(bad: string) => {
      app.markArtBroken(bad);
    }}
  >
    {#snippet actions()}
      <RecordActions
        {app}
        {index}
        {it}
        say={(msg: string) => {
          said = msg;
        }}
      />
    {/snippet}
  </RecordCard>
{/if}

<!-- Present from the start and empty: a live region has to be in the page
     before its text changes, or the change is not announced. -->
<p class="said" role="status" aria-live="polite">{said}</p>

<style>
  h1 {
    margin: 0 0 var(--gap);
    font: var(--h-page-weight) var(--h-page-size) / 1.6 var(--ui);
    letter-spacing: var(--h-page-spacing);
  }

  .miss {
    margin: 0;
    color: var(--muted);
  }

  .said {
    margin: var(--gap) 0 0;
    min-height: 1.2em;
    color: var(--muted);
    font-size: var(--step--1);
  }
</style>
