<script lang="ts">
  /* The lists index, `#/lists` - off `renderLists` (`git show 23c00a6^:app.js`): the head
     with «Новый список», the count line, the signed-in owner's account lists newest edit
     first, and the one selection bar (docs/specs/FEATURES.md, "Lists"). */
  import { onDestroy, tick, untrack } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import Button from './Button.svelte';
  import Empty from './Empty.svelte';
  import Icon from './Icon.svelte';
  import ImportPanel from './ImportPanel.svelte';
  import ListCard from './ListCard.svelte';
  import ListFind from './ListFind.svelte';
  import LoadState from './LoadState.svelte';
  import MoreMenu from './MoreMenu.svelte';
  import NoData from './NoData.svelte';
  import NumRow from './NumRow.svelte';
  import PageHead from './PageHead.svelte';
  import Panel from './Panel.svelte';
  import PinItem from './PinItem.svelte';
  import SelectionBar from './SelectionBar.svelte';
  import SelMode from './SelMode.svelte';
  import SignInPrompt from './SignInPrompt.svelte';
  import SyncSaid from './SyncSaid.svelte';
  import SyncStatus from './SyncStatus.svelte';
  import TextInput from './TextInput.svelte';
  import { agoText } from '../lib/ago.js';
  import { knownItems, NAME_MAX, type CloudList } from '../lib/cloudLists.js';
  import { sectionHash, storedListHash } from '../lib/hash.js';
  import { fewNames } from '../lib/i18n.js';
  import { LIST_PAGE, LIST_SEARCH_AT, matchLists } from '../lib/lists.js';
  import { countOf } from '../lib/plural.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  const t = $derived(app.t);
  const index = $derived(app.index);
  const target = $derived(app.newListTarget);
  const cloud = $derived(app.cloudLists);
  const signedIn = $derived(target === 'cloud');
  const ready = $derived(signedIn && cloud?.status === 'ready');
  const narrow = $derived(app.band === 'narrow');
  const account = $derived<CloudList[]>(ready && cloud ? cloud.lists : []);
  const atLimit = $derived(
    !!cloud && cloud.listLimit !== null && account.length >= cloud.listLimit
  );

  let newButton = $state<HTMLButtonElement | undefined>(undefined);
  let grid = $state<HTMLDivElement | undefined>(undefined);

  /* Rule 20 (docs/specs/FEATURES.md): a press that removed its control sends the focus to
     the first of these still on the page, else `#main`. */
  function focusOr(...els: (HTMLElement | null | undefined)[]): void {
    const next = els.find((e) => e?.isConnected) ?? document.getElementById('main');
    next?.focus();
  }

  /* After a card's delete: the next card's «Ещё», else the previous one's, else the primary. */
  async function focusAfterCard(at: number): Promise<void> {
    await tick();
    const mores = grid?.isConnected
      ? [...grid.querySelectorAll<HTMLElement>('.listcard-acts button')]
      : [];
    focusOr(mores[at], mores[at - 1], newButton);
  }

  /* The name filter and the fold run over the account lists. The query is page memory and
     starts empty on a return; the drawn count is `app.listsShown`, kept for the session. */
  let findQ = $state('');
  const filtering = $derived(account.length >= LIST_SEARCH_AT);
  const foundAccount = $derived(filtering ? matchLists(account, findQ) : account);
  const drawnAccount = $derived(foundAccount.slice(0, app.listsShown));
  const hidden = $derived(foundAccount.length - drawnAccount.length);
  const nothing = $derived(account.length > 0 && foundAccount.length === 0);

  /* The ticked account lists: page memory, always a subset of the drawn cards, so
     «Удалить (N)» and «Скачать JSON (N)» never act on a list out of sight. */
  const sel = new SvelteSet<string>();
  const ticked = $derived(drawnAccount.filter((l) => sel.has(l.id)));
  $effect(() => {
    const drawn = new Set(drawnAccount.map((l) => l.id));
    untrack(() => {
      for (const id of [...sel]) if (!drawn.has(id)) sel.delete(id);
    });
  });

  /* The selection mode: the ticks draw only in it, and its bar is this page's, drawn in the
     bar's one place through `app.pageBar`. Leaving it drops the ticks; a page with no drawn
     card leaves it. */
  const selecting = $derived(ready && app.selecting);
  $effect(() => {
    if (app.selecting) return;
    untrack(() => {
      sel.clear();
    });
  });
  $effect(() => {
    const on = selecting;
    untrack(() => {
      app.pageBar = on ? listsBar : null;
    });
  });
  $effect(() => {
    if (app.selecting && (!ready || !drawnAccount.length)) {
      untrack(() => {
        app.selecting = false;
      });
    }
  });
  onDestroy(() => {
    app.pageBar = null;
  });

  /* «Выбрать» opens the mode; the focus moves to the bar's «Все». */
  async function startSelecting(): Promise<void> {
    app.pageBar = listsBar;
    app.selecting = true;
    await tick();
    document.querySelector<HTMLElement>('.selbarwrap .selall input')?.focus();
  }

  /* «Снять выделение» leaves it; the focus returns to «Выбрать», else the primary. */
  async function leaveSelecting(): Promise<void> {
    app.clearSel();
    await tick();
    focusOr(document.querySelector<HTMLElement>('button.selmode'), newButton);
  }

  function pickAllCards(on: boolean): void {
    sel.clear();
    if (on) for (const l of drawnAccount) sel.add(l.id);
  }

  /* «Импорт из файла»: the panel under the head, while the lists are read. */
  let importing = $state(false);
  let importSending = $state(false);
  let importButton = $state<HTMLButtonElement | undefined>(undefined);
  /* What opened the panel: up to 760 px «Ещё», which has the focus back by then. */
  let importOpener: HTMLElement | null = null;
  const canImport = $derived(ready);

  function toggleImport(): void {
    if (importing) {
      void closeImport();
      return;
    }
    importOpener =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    importing = true;
  }

  /* Focus goes back to the toggle, else to what opened the panel. */
  async function closeImport(): Promise<void> {
    importing = false;
    await tick();
    focusOr(importButton, importOpener);
  }

  /* «Скачать JSON (N)» while the ticked lists' entries are read and the file is made. */
  let exporting = $state(false);
  async function exportTicked(): Promise<void> {
    exporting = true;
    await app.exportLists(ticked.map((l) => l.id));
    exporting = false;
  }

  /* One confirm names the lists; they go through the write buffer, with no undo, as one
     list does. The mode stays on. */
  async function delPicked(): Promise<void> {
    const gone = ticked;
    const names = fewNames(
      gone.map((l) => t.quoted.replace('%s', l.name || t.untitled)),
      t
    );
    const ask = t.deleteListsConfirm
      .replace('%n', String(gone.length))
      .replace('%s', () => names);
    if (!app.env.dialog.confirm(ask)) return;
    for (const l of gone) cloud?.remove(l.id);
    sel.clear();
    const n = gone.length;
    app.say((t) => t.listsDeleted.replace('%n', String(n)));
    await tick();
    focusOr(
      document.querySelector<HTMLElement>('.selbarwrap .selall input'),
      document.querySelector<HTMLElement>('button.selmode'),
      newButton
    );
  }

  /* An account list's pending, unexpired purchase requests and its unread notices, for its
     card's «Новое в списке (N)». */
  const pending = $derived(app.ownerRequests?.pendingCounts(app.now));
  function waiting(listId: string): string | undefined {
    const n = pending?.get(listId) ?? 0;
    const changed = app.ownerRequests?.unreadNotices(listId) ?? 0;
    return n + changed ? t.inboxHead.replace('%n', String(n + changed)) : undefined;
  }

  /* Any edit to the query starts the new result folded. */
  function setQuery(v: string): void {
    findQ = v;
    app.listsShown = LIST_PAGE;
  }

  /* Focus goes to the first card the press revealed, so a keyboard user continues there
     and is not lost when the button goes. */
  async function showMore(): Promise<void> {
    const from = drawnAccount.length;
    app.listsShown = from + LIST_PAGE;
    await tick();
    grid?.querySelectorAll<HTMLElement>('.listcard-main')[from]?.focus();
  }

  /* «Новый список» opens the name field in place (rule 8); at the limit it says so and
     stays closed (round 3, unit B). */
  let newOpen = $state(false);
  let draft = $state('');
  let nameInput = $state<HTMLInputElement | undefined>(undefined);

  async function openNew(): Promise<void> {
    if (app.listsFull()) return;
    newOpen = true;
    await tick();
    nameInput?.focus();
  }

  async function closeNew(): Promise<void> {
    newOpen = false;
    draft = '';
    await tick();
    focusOr(newButton);
  }

  function create(): void {
    if (!draft.trim()) {
      app.say((t) => t.nameFirst, { error: true });
      nameInput?.focus();
      return;
    }
    if (!cloud || app.listsFull()) return;
    const l = cloud.create(draft);
    if (findQ) setQuery('');
    /* A refused write has already said why: a "created" on top of it would bury the one
       message that matters. */
    const name = l.name;
    if (cloud.saved) app.say((t) => t.listCreated.replace('%s', name));
    void closeNew();
  }

  function onNameKey(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      create();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      void closeNew();
    }
  }

  /* An account list goes for good: the confirm names its share links, and there is no
     undo. */
  function delAccount(l: CloudList, at: number): void {
    if (!app.env.dialog.confirm(t.deleteCloudConfirm.replace('%s', l.name))) return;
    const name = l.name;
    cloud?.remove(l.id);
    app.say((t) => t.listDeleted.replace('%s', name));
    void focusAfterCard(at);
  }
</script>

<!-- eslint-disable @typescript-eslint/no-confusing-void-expression -- a `{@render}` tag of a
     local snippet reads as a void expression to this rule. -->
{#snippet newList(md: boolean)}
  <Button
    variant="primary"
    size={md ? 'md' : 'sm'}
    expanded={newOpen}
    bind:el={newButton}
    onclick={() => void openNew()}><Icon name="plus" />{t.newList}</Button
  >
{/snippet}

{#snippet narrowHead()}
  <span class="headx">
    {#if signedIn}{@render newList(false)}{/if}
    <MoreMenu {app} id="lists-more" size="sm">
      {#snippet children(close: () => void)}
        {#if canImport}
          <button
            type="button"
            role="menuitem"
            tabindex="-1"
            disabled={importSending}
            onclick={() => {
              close();
              toggleImport();
            }}><Icon name="upload" />{t.importOpen}</button
          >
        {/if}
        <PinItem {app} onpicked={close} />
      {/snippet}
    </MoreMenu>
  </span>
{/snippet}

{#snippet wideHead()}
  {#if signedIn}
    <span class="headx">
      {#if canImport}
        <Button
          size="sm"
          caret
          on={importing}
          expanded={importing}
          disabled={importSending}
          bind:el={importButton}
          onclick={toggleImport}><Icon name="upload" />{t.importOpen}</Button
        >
      {/if}
      {@render newList(true)}
    </span>
  {/if}
{/snippet}

{#snippet countLine()}
  <!-- The status shows only while a write fails; the list page keeps it always. -->
  <p class="count" class:over={atLimit}>
    {countOf(
      account.length,
      cloud?.listLimit ?? null,
      t.listsN,
      app.lang,
      t.ofLimit
    )}{#if cloud?.sync === 'failed'}&#32;·
      <SyncStatus {app} />{/if}
  </p>
{/snippet}

<!-- The bar of the selection mode, drawn by `SelBar` through `app.pageBar` (a top-level
     snippet, so the script can hand it over): the ticks are this page's own. -->
{#snippet listsBar()}
  <SelectionBar
    label={t.selRegion}
    total={drawnAccount.length}
    picked={ticked.length}
    allLabel={t.selectAll}
    allText={t.allShort}
    count={t.selCount.replace('%n', String(ticked.length))}
    clearText={t.clearSel}
    onall={pickAllCards}
    onclear={() => void leaveSelecting()}
  >
    {#snippet actions()}
      <Button
        size="sm"
        disabled={exporting || !ticked.length}
        onclick={() => void exportTicked()}
        >{`${t.exportJson} (${String(ticked.length)})`}</Button
      >
      <Button
        size="sm"
        variant="danger"
        disabled={!ticked.length}
        onclick={() => void delPicked()}>{`${t.del} (${String(ticked.length)})`}</Button
      >
    {/snippet}
  </SelectionBar>
{/snippet}

{#if narrow}
  <PageHead {app} title={t.menuLists} sub="" help={null} pin={false} extra={narrowHead} />
{:else}
  <PageHead {app} title={t.menuLists} sub="" help={null} extra={wideHead} />
{/if}

{#if !index}
  <NoData>{t.noData}</NoData>
{:else if target === 'prompt'}
  <div class="stack">
    <Empty glyph="kindItem">
      <div class="signedout">
        <SignInPrompt {app} lead={t.signInToCreate} after={{ hash: '#/lists' }} />
      </div>
    </Empty>
  </div>
{:else if signedIn && cloud}
  <!-- Outside the grid: an empty region would take a row and its gap. -->
  <SyncSaid {app} />
  <div class="stack">
    {#if importing && canImport}
      <Panel>
        <ImportPanel {app} bind:sending={importSending} onclose={() => void closeImport()} />
      </Panel>
    {/if}
    {#if newOpen}
      <Panel>
        <label class="newlbl" for="list-new-name">{t.listNameLabel}</label>
        <NumRow>
          <div class="grow">
            <TextInput
              id="list-new-name"
              bind:value={draft}
              bind:el={nameInput}
              placeholder={t.listNamePh}
              maxlength={NAME_MAX}
              onkeydown={onNameKey}
            />
          </div>
          <Button variant="primary" onclick={create}>{t.create}</Button>
          <Button variant="ghost" onclick={() => void closeNew()}>{t.cancel}</Button>
        </NumRow>
      </Panel>
    {/if}
    {#if cloud.status !== 'ready'}
      <!-- A block: as a grid item of `.stack` the retry would stretch across the column. -->
      <div>
        <LoadState
          {t}
          failed={cloud.status === 'error'}
          text={t.cloudLoadFailed}
          onretry={() => void app.retryLists()}
          after={() => newButton}
        />
      </div>
    {:else}
      <div class="collection">
        {#if filtering}
          <ListFind
            {app}
            query={findQ}
            onquery={setQuery}
            placeholder={t.findList}
            label={t.findList}
            selectable={!!drawnAccount.length && !selecting}
            onselect={() => void startSelecting()}
            beside={narrow ? undefined : countLine}
          />
          {#if narrow}{@render countLine()}{/if}
        {:else}
          <div class="lhead">
            {@render countLine()}
            {#if drawnAccount.length && !selecting}
              <SelMode label={t.selectMode} onclick={() => void startSelecting()} />
            {/if}
          </div>
        {/if}
        {#if !account.length}
          <Empty glyph="kindItem" title={t.listsNoneTitle}>
            <p class="hint">{t.listsNoneHint}</p>
            <Button href={app.href(sectionHash('tables'))} sameTab>{t.openTables}</Button>
          </Empty>
        {:else if nothing}
          <Empty>{t.nothing}</Empty>
        {:else}
          <div class="listgrid" data-primary bind:this={grid}>
            {#each drawnAccount as l, i (l.id)}
              {#snippet cardMore()}
                <MoreMenu
                  {app}
                  id={'lcard-' + l.id}
                  size="sm"
                  label={t.moreOf.replace('%s', l.name || t.untitled)}
                >
                  {#snippet children(close: () => void)}
                    <a
                      role="menuitem"
                      tabindex="-1"
                      href={app.href(storedListHash(l.id))}
                      onclick={close}>{t.listOpen}</a
                    >
                    <button
                      type="button"
                      role="menuitem"
                      tabindex="-1"
                      onclick={() => {
                        close();
                        void app.exportLists([l.id]);
                      }}>{t.exportJson}</button
                    >
                    <div role="separator" class="msep"></div>
                    <button
                      type="button"
                      role="menuitem"
                      tabindex="-1"
                      class="danger"
                      onclick={() => {
                        close();
                        delAccount(l, i);
                      }}>{t.listDeleteItem}</button
                    >
                  {/snippet}
                </MoreMenu>
              {/snippet}
              <ListCard
                {app}
                list={l}
                href={app.href(storedListHash(l.id))}
                items={knownItems(l, index?.byId)}
                edited={agoText(l.updated, app.now, app.lang, t)}
                inbox={waiting(l.id)}
                picked={sel.has(l.id)}
                onpick={selecting
                  ? (on: boolean) => {
                      if (on) sel.add(l.id);
                      else sel.delete(l.id);
                    }
                  : undefined}
                actions={selecting ? undefined : cardMore}
              />
            {/each}
          </div>
        {/if}
        {#if hidden > 0}
          <div class="listmore">
            <Button onclick={() => void showMore()}
              >{`${t.showMore} (${String(hidden)})`}</Button
            >
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<!-- eslint-enable @typescript-eslint/no-confusing-void-expression -->

<style>
  .stack {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
    margin-top: 14px;
  }

  /* The head's end: the import toggle and the primary at the column's right edge; up to
     760 px the primary and «Ещё», positioned so the row anchors the menu (`MoreMenu`). */
  .headx {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  /* Up to 760 px the `h1`, the primary and «Ещё» share one line from 360 px (RU 307 of 313 px,
     measured 2026-11-05); at 320 px the primary and «Ещё» wrap under the `h1` together. 44 px:
     the page's primary is a full touch target. */
  @media (max-width: 760px) {
    .headx {
      gap: 4px;
    }

    /* `.btn.btn`: `Button's` own `.btn.sm` rule ties this one on specificity. */
    .headx :global(.btn.btn.sm) {
      flex: none;
      height: 44px;
      gap: 4px;
      padding-inline: 6px;
    }
  }

  .newlbl {
    display: block;
    margin: 0 0 8px;
    font-size: var(--t-label);
    font-weight: 650;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted2);
  }

  .grow {
    flex: 1 1 170px;
    min-width: 0;
  }

  /* Up to 760 px the field takes its own line and «Создать» and «Отмена» share the next one,
     as in the add-to-list menu: at 360 px «Отмена» otherwise wrapped alone. */
  @media (max-width: 760px) {
    .grow {
      flex-basis: 100%;
    }
  }

  /* The head of the collection: the count, then «Выбрать» at its end. */
  .lhead {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .count {
    margin: 0;
    font-size: var(--t-data);
    line-height: 1.3;
    color: var(--muted2);
  }

  .count.over {
    color: var(--danger-text);
  }

  /* Up to 760 px the count sits under the search row; with 30 lists the first card starts
     under 256 px at 360x640 (case 83). */
  .collection > .count {
    margin: -4px 0 6px;
  }

  @media (max-width: 760px) {
    .stack {
      margin-top: 8px;
    }
  }

  /* The plate centers its text, so «Войти» centers too when it wraps under the lead. */
  .signedout {
    width: 100%;
  }

  .signedout :global(.signin) {
    justify-content: center;
  }

  .hint {
    margin: 0;
    max-width: 46ch;
    font-size: var(--t-small);
  }

  /* The grid's own gap above the button. */
  .listmore {
    display: flex;
    justify-content: center;
    margin-top: 14px;
  }

  /* off `.listgrid` in style.css. */
  .listgrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
    gap: 14px;
  }
</style>
