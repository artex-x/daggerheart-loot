<script lang="ts" module>
  import {
    communityGroup,
    communityParts,
    realmGroup,
    realmParts,
    voaGroup,
    voaParts
  } from './lib/sections.js';
  import type { Index } from './lib/data.js';
  import type { Dict } from './lib/dict.js';
  import type { Part } from './lib/sections.js';
  import type { Lang, Record_, Section } from './lib/types.js';

  /* The sections that roll a single number over a whole table. Vault of Ages,
     Communities and Many Worlds Tavern roll one number too, but inside a part of
     their book, so `PICKER_ROLL` names the part and its rows for one shared panel.
     Core rules and the alternate tables roll several cards at once, and the
     alternate tables roll two dice, so both have panels of their own. */
  const ROLL_TABLE: Partial<Record<Section, { table: string; title: keyof Dict }>> = {
    'roll/wondrous': { table: 'wondrous', title: 'pageWondrous' },
    'roll/dread': { table: 'dread', title: 'pageDread' },
    'roll/dv': { table: 'dv', title: 'pageDv' },
    'roll/arazo': { table: 'arazo', title: 'pageArazo' }
  };

  interface PickerRoll {
    section: 'voa' | 'community' | 'mwt';
    title: keyof Dict;
    sub: keyof Dict;
    label: keyof Dict;
    parts: (t: Dict, lang: Lang, index: Index | null) => Part[];
    rows: (index: Index, id: string) => readonly Record_[];
  }

  const PICKER_ROLL: Partial<Record<Section, PickerRoll>> = {
    'roll/voa': {
      section: 'voa',
      title: 'pageVoa',
      sub: 'subVoa',
      label: 'voaSection',
      parts: (t) => voaParts(t),
      rows: voaGroup
    },
    'roll/community': {
      section: 'community',
      title: 'pageCommunity',
      sub: 'subCommunity',
      label: 'communityLabel',
      parts: (_t, lang, index) => communityParts(index, lang),
      rows: communityGroup
    },
    'roll/mwt': {
      section: 'mwt',
      title: 'pageMwt',
      sub: 'subMwt',
      label: 'realmLabel',
      parts: (_t, lang) => realmParts(lang),
      rows: realmGroup
    }
  };
</script>

<script lang="ts">
  /* The application. Routes are matched here and nowhere else; every branch
     below will become its own component as the phases go on. */
  import { untrack } from 'svelte';
  import AccountPage from './components/AccountPage.svelte';
  import AltPanel from './components/AltPanel.svelte';
  import Button from './components/Button.svelte';
  import HomebrewEditor from './components/HomebrewEditor.svelte';
  import HomebrewPage from './components/HomebrewPage.svelte';
  import ItemPage from './components/ItemPage.svelte';
  import ListPage from './components/ListPage.svelte';
  import ListsPage from './components/ListsPage.svelte';
  import NoData from './components/NoData.svelte';
  import PageTitle from './components/PageTitle.svelte';
  import PickerRollPanel from './components/PickerRollPanel.svelte';
  import PrintPage from './components/PrintPage.svelte';
  import RecordPage from './components/RecordPage.svelte';
  import RollPanel from './components/RollPanel.svelte';
  import SearchPage from './components/SearchPage.svelte';
  import SharedListPage from './components/SharedListPage.svelte';
  import Shell from './components/Shell.svelte';
  import StdPanel from './components/StdPanel.svelte';
  import TablesPage from './components/TablesPage.svelte';
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
      {@const pr = PICKER_ROLL[app.route.section]}
      {#if cfg}
        <!-- The three whole-table rolls share this branch; a number kept from one table
             points past the end of a shorter one (docs/specs/FEATURES.md, "Rolling"). -->
        {#key app.route.section}
          <RollPanel
            {app}
            section={cfg.table}
            title={app.t[cfg.title]}
            sub={app.t.subWondrous}
            rows={app.index?.rows.get(cfg.table) ?? []}
          />
        {/key}
      {:else if app.route.section === 'roll/std'}
        <StdPanel {app} />
      {:else if app.route.section === 'roll/alt'}
        <AltPanel {app} />
      {:else if pr}
        <!-- One panel serves three sections; the key gives each its own pick. -->
        {#key app.route.section}
          <PickerRollPanel
            {app}
            section={pr.section}
            title={app.t[pr.title]}
            sub={app.t[pr.sub]}
            label={app.t[pr.label]}
            parts={pr.parts(app.t, app.lang, app.index)}
            rowsOf={(id: string) => (app.index ? pr.rows(app.index, id) : [])}
          />
        {/key}
      {:else if app.route.section === 'lists'}
        <ListsPage {app} />
      {:else if app.route.section === 'search'}
        <SearchPage {app} />
      {/if}
    {:else if app.route.kind === 'record'}
      <RecordPage {app} id={app.route.id} />
    {:else if app.route.kind === 'item'}
      <!-- A new id remounts the page, so its view opens the item it names. -->
      {#key app.route.id}
        <ItemPage {app} id={app.route.id} />
      {/key}
    {:else if app.route.kind === 'tables' && (app.route.table !== 'homebrew' || app.homebrew)}
      <!-- With no sign-in configured `#/tables/homebrew` is not found, address kept. -->
      <TablesPage {app} />
    {:else if app.route.kind === 'storedList' || app.route.kind === 'sharedList'}
      <ListPage {app} />
    {:else if app.route.kind === 'share'}
      {#if app.index}
        <SharedListPage {app} index={app.index} token={app.route.token} />
      {:else}
        <NoData>{app.t.noData}</NoData>
      {/if}
    {:else if app.route.kind === 'printSet' && app.env.cloud}
      <!-- A new id remounts the page, so an answer for the old id has no page to land on. -->
      {#key app.route.id}
        <PrintPage {app} id={app.route.id} />
      {/key}
    {:else if app.route.kind === 'printRetired'}
      <!-- Every `#/print/...` address since 2026-10-08: nothing is read from it
           (docs/specs/ROUTES.md). -->
      <PageTitle title={app.t.printLinkRetired} sub={app.t.printLinkRetiredSub} />
      <Button variant="primary" href={sectionHash('roll/std')} sameTab>{app.t.toStart}</Button>
    {:else if app.route.kind === 'account' && app.env.cloud}
      <AccountPage {app} />
    {:else if app.route.kind === 'homebrew' && app.homebrew}
      <HomebrewPage {app} store={app.homebrew} tab={app.route.tab} openKey={app.route.key} />
    {:else if app.route.kind === 'homebrewItem' && app.homebrew}
      <!-- A real navigation remounts the editor; `replace()` after a save keeps it
           mounted, and the focus where it was. -->
      {#key app.navigations}
        <HomebrewEditor {app} store={app.homebrew} key={app.route.key} />
      {/key}
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
