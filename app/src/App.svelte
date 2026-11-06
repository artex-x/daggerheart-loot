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
  const ROLL_TABLE: Partial<Record<Section, { table: string }>> = {
    'roll/wondrous': { table: 'wondrous' },
    'roll/dread': { table: 'dread' },
    'roll/dv': { table: 'dv' },
    'roll/arazo': { table: 'arazo' }
  };

  interface PickerRoll {
    section: 'voa' | 'community' | 'mwt';
    sub: keyof Dict;
    label: keyof Dict;
    parts: (t: Dict, lang: Lang, index: Index | null) => Part[];
    rows: (index: Index, id: string) => readonly Record_[];
  }

  const PICKER_ROLL: Partial<Record<Section, PickerRoll>> = {
    'roll/voa': {
      section: 'voa',
      sub: 'subVoa',
      label: 'voaSection',
      parts: (t) => voaParts(t),
      rows: voaGroup
    },
    'roll/community': {
      section: 'community',
      sub: 'subCommunity',
      label: 'communityLabel',
      parts: (_t, lang, index) => communityParts(index, lang),
      rows: communityGroup
    },
    'roll/mwt': {
      section: 'mwt',
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
  import { tick, untrack } from 'svelte';
  import AccountPage from './components/AccountPage.svelte';
  import AltPanel from './components/AltPanel.svelte';
  import Button from './components/Button.svelte';
  import ErrorPage from './components/ErrorPage.svelte';
  import HomebrewEditor from './components/HomebrewEditor.svelte';
  import HomebrewPage from './components/HomebrewPage.svelte';
  import ItemPage from './components/ItemPage.svelte';
  import ListPage from './components/ListPage.svelte';
  import ListsPage from './components/ListsPage.svelte';
  import NoData from './components/NoData.svelte';
  import NoPage from './components/NoPage.svelte';
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

  /* The press takes «Обновить страницу» out of the DOM, so the focus goes to `#main`
     (rule 20). */
  function resetPage(reset: () => void): void {
    reset();
    void tick().then(() => document.getElementById('main')?.focus());
  }
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
            sub={app.t[pr.sub]}
            label={app.t[pr.label]}
            parts={pr.parts(app.t, app.lang, app.index)}
            rowsOf={(id: string) => (app.index ? pr.rows(app.index, id) : [])}
          />
        {/key}
      {:else if app.route.section === 'lists' && app.cloudLists}
        <ListsPage {app} />
      {:else if app.route.section === 'lists'}
        <!-- A build with no sign-in has no lists (docs/specs/ROUTES.md). -->
        <NoPage {app} />
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
    {:else if app.route.kind === 'storedList' && app.cloudLists}
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
      <ErrorPage title={app.t.printLinkRetired} said>
        {app.t.printLinkRetiredSub}
        {#snippet actions()}
          <Button variant="primary" href={app.href(sectionHash('roll/std'))} sameTab
            >{app.t.toStart}</Button
          >
        {/snippet}
      </ErrorPage>
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
      <!-- An old list link, and a route that needs sign-in in a build without it
           (docs/specs/ROUTES.md). The address is kept. -->
      <NoPage {app} />
    {/if}
    {#snippet failed(error: unknown, reset: () => void)}
      <ErrorPage title={app.t.pageError} said>
        {error instanceof Error ? error.message : String(error)}
        {#snippet actions()}
          <Button
            variant="primary"
            onclick={() => {
              resetPage(reset);
            }}>{app.t.reloadPage}</Button
          >
        {/snippet}
      </ErrorPage>
    {/snippet}
  </svelte:boundary>
</Shell>
