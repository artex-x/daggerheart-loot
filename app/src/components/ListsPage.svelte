<script lang="ts">
  /* The lists index, `#/lists` - off `renderLists` (`git show 23c00a6^:app.js`). One
   * group: the signed-in owner's account lists, newest edit first
   * (docs/specs/FEATURES.md, "Lists"). */
  import { tick, untrack } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import Actions from './Actions.svelte';
  import BatchBar from './BatchBar.svelte';
  import Button from './Button.svelte';
  import Empty from './Empty.svelte';
  import Field from './Field.svelte';
  import ImportPanel from './ImportPanel.svelte';
  import ListCard from './ListCard.svelte';
  import LoadState from './LoadState.svelte';
  import NoData from './NoData.svelte';
  import NumRow from './NumRow.svelte';
  import PageHead from './PageHead.svelte';
  import Panel from './Panel.svelte';
  import SearchBox from './SearchBox.svelte';
  import SignInPrompt from './SignInPrompt.svelte';
  import SyncSaid from './SyncSaid.svelte';
  import SyncStatus from './SyncStatus.svelte';
  import TextInput from './TextInput.svelte';
  import { agoText } from '../lib/ago.js';
  import { linkedOf, NAME_MAX, type CloudList } from '../lib/cloudLists.js';
  import { storedListHash } from '../lib/hash.js';
  import { helpFor } from '../lib/help.js';
  import { fewNames } from '../lib/i18n.js';
  import { LIST_PAGE, LIST_SEARCH_AT, matchLists, type StoredList } from '../lib/lists.js';
  import { countOf, plural } from '../lib/plural.js';
  import type { Record_ } from '../lib/types.js';
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
  const account = $derived<CloudList[]>(
    signedIn && cloud?.status === 'ready' ? cloud.lists : []
  );

  let draft = $state('');
  let nameInput = $state<HTMLInputElement | undefined>(undefined);
  let allBox = $state<HTMLInputElement | undefined>(undefined);
  let accountGrid = $state<HTMLDivElement | undefined>(undefined);

  /* Rule 20 (docs/specs/FEATURES.md): a delete removed the pressed control, so focus goes
     to the control now in its place, else the one before it, else the «Новый список» field,
     else `#main`. */
  function focusOr(...els: (HTMLElement | null | undefined)[]): void {
    const next = els.find((e) => e?.isConnected) ?? document.getElementById('main');
    next?.focus();
  }

  async function focusAfterCard(grid: HTMLDivElement | undefined, at: number): Promise<void> {
    await tick();
    const dels = grid?.isConnected
      ? [...grid.querySelectorAll<HTMLElement>('.btn.danger')]
      : [];
    focusOr(dels[at], dels[at - 1], nameInput);
  }

  /* The name filter and the fold run over the account lists
     (docs/specs/FEATURES.md, "Lists"). The query
     is page memory and starts empty on a return; the drawn count is
     `app.listsShown`, kept for the session. */
  let findQ = $state('');
  let groups = $state<HTMLDivElement | undefined>(undefined);
  const filtering = $derived(account.length >= LIST_SEARCH_AT);
  const foundAccount = $derived(filtering ? matchLists(account, findQ) : account);
  const drawnAccount = $derived(foundAccount.slice(0, app.listsShown));
  const hidden = $derived(foundAccount.length - drawnAccount.length);
  const nothing = $derived(account.length > 0 && foundAccount.length === 0);

  /* The ticked account lists: page memory, always a subset of the drawn
     cards, so «Удалить (N)» and «Скачать JSON (N)» never act on a list out of
     sight (docs/specs/FEATURES.md, "Lists"). */
  const sel = new SvelteSet<string>();
  const ticked = $derived(drawnAccount.filter((l) => sel.has(l.id)));
  $effect(() => {
    const drawn = new Set(drawnAccount.map((l) => l.id));
    untrack(() => {
      for (const id of [...sel]) if (!drawn.has(id)) sel.delete(id);
    });
  });

  /* «Импорт из файла»: the field under the name row, while the lists are read. */
  let importing = $state(false);
  let importSending = $state(false);
  let importRow = $state<HTMLDivElement | undefined>(undefined);
  const canImport = $derived(signedIn && cloud?.status === 'ready');

  function toggleImport(): void {
    if (importing) void closeImport();
    else importing = true;
  }

  /* Focus goes back to the toggle, which stays where the field was. */
  async function closeImport(): Promise<void> {
    importing = false;
    await tick();
    importRow?.querySelector('button')?.focus();
  }

  /* «Скачать JSON (N)» while the ticked lists' entries are read and the file is made. */
  let exporting = $state(false);
  async function exportTicked(): Promise<void> {
    exporting = true;
    await app.exportLists(ticked.map((l) => l.id));
    exporting = false;
  }

  function pickAllCards(on: boolean): void {
    sel.clear();
    if (on) for (const l of drawnAccount) sel.add(l.id);
  }

  /* One confirm names the lists; they go through the write buffer, with no
     undo, as one list does. */
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
    focusOr(allBox, nameInput);
  }

  /* An account list's pending, unexpired purchase requests and its unread notices, for its
     card. */
  const pending = $derived(app.ownerRequests?.pendingCounts(app.now));
  function waiting(listId: string): string | undefined {
    const owner = app.ownerRequests;
    const n = pending?.get(listId) ?? 0;
    const changed = owner?.unreadNotices(listId) ?? 0;
    const parts = [
      n ? plural(n, t.requestsWaitN, app.lang) : '',
      changed ? plural(changed, t.noticesN, app.lang) : ''
    ].filter(Boolean);
    return parts.length ? parts.join(' · ') : undefined;
  }

  /* Any edit to the query starts the new result folded. */
  function setQuery(v: string): void {
    findQ = v;
    app.listsShown = LIST_PAGE;
  }

  /* Focus goes to the first card the press revealed, so a keyboard user
     continues there and is not lost when the button goes. */
  async function showMore(): Promise<void> {
    const from = drawnAccount.length;
    app.listsShown = from + LIST_PAGE;
    await tick();
    groups?.querySelectorAll<HTMLElement>('.listcard-main')[from]?.focus();
  }

  /* The ids the data still knows, in list order - what the meta line counts
     and the thumbs draw from, not `l.ids` itself: a deleted or renamed record
     must not leave a gap the count holds as though it were still there. */
  function knownItems(l: StoredList): Record_[] {
    const linked = linkedOf(l);
    return l.ids
      .map((id) => index?.byId.get(id) ?? linked[id])
      .filter((it): it is Record_ => it !== undefined);
  }

  function create(): void {
    if (!draft.trim()) {
      app.say((t) => t.nameFirst, { error: true });
      nameInput?.focus();
      return;
    }
    if (!cloud || app.listsFull()) return;
    const l = cloud.create(draft);
    draft = '';
    if (findQ) setQuery('');
    /* A refused write has already said why: a "created" on top of it would bury the one
       message that matters. */
    const name = l.name;
    if (cloud.saved) app.say((t) => t.listCreated.replace('%s', name));
  }

  /* An account list goes for good: the confirm names its share links, and
     there is no undo. */
  function delAccount(l: CloudList, at: number): void {
    if (!app.env.dialog.confirm(t.deleteCloudConfirm.replace('%s', l.name))) return;
    const name = l.name;
    cloud?.remove(l.id);
    app.say((t) => t.listDeleted.replace('%s', name));
    void focusAfterCard(accountGrid, at);
  }
</script>

<PageHead {app} title={t.menuLists} sub={t.subLists} help={helpFor('lists', app.lang)} />

{#if !index}
  <NoData>{t.noData}</NoData>
{:else}
  {#if target === 'cloud'}
    <Panel style="margin-top:16px">
      <Field label={t.newList}>
        <NumRow>
          <div class="grow">
            <TextInput
              bind:value={draft}
              bind:el={nameInput}
              placeholder={t.listNamePh}
              label={t.newList}
              maxlength={NAME_MAX}
            />
          </div>
          <Button variant="primary" onclick={create}>{t.create}</Button>
        </NumRow>
        {#if canImport}
          <div bind:this={importRow}>
            <Actions style="margin-top:10px"
              ><Button
                size="sm"
                variant="ghost"
                caret
                on={importing}
                expanded={importing}
                disabled={importSending}
                onclick={toggleImport}>{t.importOpen}</Button
              ></Actions
            >
          </div>
        {/if}
      </Field>
      {#if importing && canImport}
        <ImportPanel {app} bind:sending={importSending} onclose={() => void closeImport()} />
      {/if}
    </Panel>
  {:else if target === 'prompt'}
    <Panel style="margin-top:16px">
      <Field label={t.newList} heading>
        <SignInPrompt {app} lead={t.signInToCreate} after={{ hash: '#/lists' }} />
      </Field>
    </Panel>
  {/if}
  {#if filtering}
    <div class="listfind">
      <SearchBox value={findQ} placeholder={t.findList} oninput={setQuery} />
    </div>
  {/if}
  <div bind:this={groups}>
    {#if signedIn && cloud}
      <SyncSaid {app} />
      <div class="group">
        <Field label={t.groupAccount} heading>
          {#if cloud.status !== 'ready'}
            <LoadState
              {t}
              failed={cloud.status === 'error'}
              text={t.cloudLoadFailed}
              onretry={() => void app.retryLists()}
              after={() => nameInput}
            />
          {:else}
            {#if cloud.listLimit !== null || account.length || cloud.sync === 'failed'}
              <!-- The status shows only while a write fails; the list page keeps it always. -->
              <p class="grouptext count">
                {countOf(
                  account.length,
                  cloud.listLimit,
                  t.listsN,
                  app.lang,
                  t.ofLimit
                )}{#if cloud.sync === 'failed'}&#32;· <SyncStatus {app} />{/if}
              </p>
            {/if}
            {#if !account.length}
              <p class="grouptext">{t.noCloudLists}</p>
            {/if}
          {/if}
          {#if cloud.status === 'ready' && drawnAccount.length}
            <BatchBar
              total={drawnAccount.length}
              picked={ticked.length}
              label={t.pickAll}
              count={`${t.selected} ${String(ticked.length)}`}
              onall={pickAllCards}
              bind:allBox
            >
              {#snippet actions()}
                <Button size="sm" disabled={exporting} onclick={() => void exportTicked()}
                  >{`${t.exportJson} (${String(ticked.length)})`}</Button
                >
                <Button size="sm" variant="danger" onclick={() => void delPicked()}
                  >{`${t.del} (${String(ticked.length)})`}</Button
                >
              {/snippet}
            </BatchBar>
            <div class="listgrid" bind:this={accountGrid}>
              {#each drawnAccount as l, i (l.id)}
                <ListCard
                  {app}
                  list={l}
                  href={app.href(storedListHash(l.id))}
                  items={knownItems(l)}
                  edited={agoText(l.updated, app.now, app.lang, t)}
                  requests={waiting(l.id)}
                  picked={sel.has(l.id)}
                  onpick={(on) => {
                    if (on) sel.add(l.id);
                    else sel.delete(l.id);
                  }}
                >
                  {#snippet actions()}
                    <Button
                      size="sm"
                      variant="danger"
                      onclick={() => {
                        delAccount(l, i);
                      }}>{t.del}</Button
                    >
                  {/snippet}
                </ListCard>
              {/each}
            </div>
          {/if}
        </Field>
      </div>
    {/if}
  </div>
  {#if nothing}
    <Empty>{t.nothing}</Empty>
  {/if}
  {#if hidden > 0}
    <div class="listmore">
      <Button onclick={() => void showMore()}>{`${t.showMore} (${String(hidden)})`}</Button>
    </div>
  {/if}
{/if}

<style>
  /* `.miss` moved to `NoData.svelte`, `.numrow` to `NumRow.svelte`, `.panel`
     to `Panel.svelte` - the 16px margin-top is the live inline attribute,
     passed as `style`. */
  .grow {
    flex: 1 1 170px;
    min-width: 0;
  }

  /* The grid's own top margin, which the filter takes over. */
  .listfind {
    margin-top: 18px;
  }

  /* A group sits the panel's own gap below what comes before it. */
  .group {
    margin-top: 22px;
  }

  .grouptext {
    margin: 0;
    font-size: 12.5px;
    color: var(--muted2);
  }

  .grouptext.count {
    margin-bottom: 8px;
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
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 14px;
  }
</style>
