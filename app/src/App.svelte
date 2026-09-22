<script lang="ts" module>
  import type { Dict } from './lib/dict.js';
  import type { Section } from './lib/types.js';

  /* The sections that roll a single number over a whole table. Vault of Ages
     and Communities roll one number too, but inside a part of their book, so
     they have panels of their own that choose the part and hand the rows over.
     Core rules and the alternate tables roll several cards at once, and the
     alternate tables roll two dice, so both have panels of their own. */
  const ROLL_TABLE: Partial<Record<Section, { table: string; title: keyof Dict }>> = {
    'roll/wondrous': { table: 'wondrous', title: 'pageWondrous' },
    'roll/dread': { table: 'dread', title: 'pageDread' }
  };
</script>

<script lang="ts">
  /* The application. Routes are matched here and nowhere else; every branch
     below will become its own component as the phases go on. */
  import { untrack } from 'svelte';
  import AltPanel from './components/AltPanel.svelte';
  import Button from './components/Button.svelte';
  import CommunityPanel from './components/CommunityPanel.svelte';
  import ListPage from './components/ListPage.svelte';
  import ListsPage from './components/ListsPage.svelte';
  import PageTitle from './components/PageTitle.svelte';
  import PrintPage from './components/PrintPage.svelte';
  import RecordPage from './components/RecordPage.svelte';
  import RollPanel from './components/RollPanel.svelte';
  import SearchPage from './components/SearchPage.svelte';
  import Shell from './components/Shell.svelte';
  import StdPanel from './components/StdPanel.svelte';
  import TablesPage from './components/TablesPage.svelte';
  import VoaPanel from './components/VoaPanel.svelte';
  import { sectionHash } from './lib/hash.js';
  import { AppState } from './state/app.svelte.js';
  import type { Env } from './ports/index.js';

  interface Props {
    env: Env;
  }

  const { env }: Props = $props();
  /* Read once, on purpose: the outside world does not change under a running
     app, and rebuilding the state if it did would throw away everything the
     person had done. `untrack` says that rather than leaving a warning. */
  const app = new AppState(untrack(() => env));

  $effect(() => app.start());
</script>

<Shell {app}>
  <!-- S2/R7: the smallest boundary - a page that throws mid-render draws a
       named error and a way to try again, rather than leaving the tab bar
       standing over a blank middle with no explanation. The general
       error-handling framework (window.onerror, unhandledrejection
       reporting) is a separate ticket - resilience.md, "Noted, out of
       scope" - this is only the local patch for the one gap this batch
       found reachable. -->
  <svelte:boundary>
    {#if app.route.kind === 'section'}
      {@const cfg = ROLL_TABLE[app.route.section]}
      {#if cfg}
        <RollPanel
          {app}
          section={cfg.table}
          title={app.t[cfg.title]}
          sub={app.t.subWondrous}
          rows={app.index?.rows.get(cfg.table) ?? []}
        />
      {:else if app.route.section === 'roll/std'}
        <StdPanel {app} />
      {:else if app.route.section === 'roll/alt'}
        <AltPanel {app} />
      {:else if app.route.section === 'roll/voa'}
        <VoaPanel {app} />
      {:else if app.route.section === 'roll/community'}
        <CommunityPanel {app} />
      {:else if app.route.section === 'lists'}
        <ListsPage {app} />
      {:else if app.route.section === 'search'}
        <SearchPage {app} />
      {/if}
    {:else if app.route.kind === 'record'}
      <RecordPage {app} id={app.route.id} />
    {:else if app.route.kind === 'tables'}
      <TablesPage {app} />
    {:else if app.route.kind === 'storedList' || app.route.kind === 'sharedList'}
      <ListPage {app} />
    {:else if app.route.kind === 'print'}
      <PrintPage {app} ids={app.route.ids} dropped={app.route.dropped} qty={app.route.qty} />
    {:else}
      <!-- R7: `#fallback` keeps `app.hash` readable at boot and on every
           navigation, so a route kind with no branch above should not be
           reachable - but "should not" is not "cannot", and the live
           consequence of a route falling through silently was a blank
           middle under a working tab bar. Same block the record route
           draws for an id the data does not know. -->
      <PageTitle title={app.t.notFound} sub={app.t.notFoundSub} />
      <Button variant="primary" href={sectionHash('roll/std')} sameTab>{app.t.toStart}</Button>
    {/if}
    {#snippet failed(error, reset)}
      <PageTitle
        title={app.t.pageError}
        sub={error instanceof Error ? error.message : String(error)}
      />
      <Button variant="primary" onclick={reset}>{app.t.reloadPage}</Button>
    {/snippet}
  </svelte:boundary>
</Shell>
