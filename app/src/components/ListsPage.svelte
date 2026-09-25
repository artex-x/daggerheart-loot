<script lang="ts">
  /* The lists index, `#/lists` - off `renderLists` (app.js 2909-2931). Two
   * groups: the signed-in owner's account lists, newest edit first, then
   * this browser's lists with the storage notice at their head. The browser
   * group is one block, so the release that retires local lists deletes it
   * whole (docs/specs/FEATURES.md, "Lists"). */
  import { tick } from 'svelte';
  import Button from './Button.svelte';
  import Empty from './Empty.svelte';
  import Field from './Field.svelte';
  import Icon from './Icon.svelte';
  import ListCard from './ListCard.svelte';
  import NoData from './NoData.svelte';
  import NumRow from './NumRow.svelte';
  import PageHead from './PageHead.svelte';
  import Panel from './Panel.svelte';
  import SearchBox from './SearchBox.svelte';
  import SignInPrompt from './SignInPrompt.svelte';
  import StorageNotice from './StorageNotice.svelte';
  import TextInput from './TextInput.svelte';
  import { agoText } from '../lib/ago.js';
  import type { CloudList } from '../lib/cloudLists.js';
  import { sharedListHash, storedListHash } from '../lib/hash.js';
  import { helpFor } from '../lib/help.js';
  import { encodeList, encodeListRaw } from '../lib/listLink.js';
  import { LIST_PAGE, LIST_SEARCH_AT, matchLists, type StoredList } from '../lib/lists.js';
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
  const local = $derived(app.lists.lists);
  const account = $derived<CloudList[]>(
    signedIn && cloud?.status === 'ready' ? cloud.lists : []
  );
  /* Drawn with no sign-in configured, and otherwise only while it has
     something to say. */
  const browserGroup = $derived(
    !cloud || local.length > 0 || !app.storageWorks || app.lists.unreadable
  );

  let draft = $state('');
  let nameInput = $state<HTMLInputElement | undefined>(undefined);

  /* The name filter and the fold run over the account lists, then the
     browser's, as one sequence (docs/specs/FEATURES.md, "Lists"). The query
     is page memory and starts empty on a return; the drawn count is
     `app.listsShown`, kept for the session. */
  let findQ = $state('');
  let groups = $state<HTMLDivElement | undefined>(undefined);
  const filtering = $derived(account.length + local.length >= LIST_SEARCH_AT);
  const foundAccount = $derived(filtering ? matchLists(account, findQ) : account);
  const foundLocal = $derived(filtering ? matchLists(local, findQ) : local);
  const drawnAccount = $derived(foundAccount.slice(0, app.listsShown));
  const drawnLocal = $derived(
    foundLocal.slice(0, Math.max(0, app.listsShown - foundAccount.length))
  );
  const hidden = $derived(
    foundAccount.length + foundLocal.length - drawnAccount.length - drawnLocal.length
  );
  const nothing = $derived(
    account.length + local.length > 0 && foundAccount.length + foundLocal.length === 0
  );

  /* Any edit to the query starts the new result folded. */
  function setQuery(v: string): void {
    findQ = v;
    app.listsShown = LIST_PAGE;
  }

  /* Focus goes to the first card the press revealed, so a keyboard user
     continues there and is not lost when the button goes. */
  async function showMore(): Promise<void> {
    const from = drawnAccount.length + drawnLocal.length;
    app.listsShown = from + LIST_PAGE;
    await tick();
    groups?.querySelectorAll<HTMLElement>('.listcard-main')[from]?.focus();
  }

  /* The ids the data still knows, in list order - what the badge counts and
     the thumbs draw from, not `l.ids` itself: a deleted or renamed record
     must not leave a gap the badge counts as though it were still there. */
  function knownItems(l: StoredList): Record_[] {
    return l.ids
      .map((id) => index?.byId.get(id))
      .filter((it): it is Record_ => it !== undefined);
  }

  function create(): void {
    if (!draft.trim()) {
      app.say(t.nameFirst, { error: true });
      nameInput?.focus();
      return;
    }
    const store = signedIn && cloud ? cloud : app.lists;
    const l = store.create(draft);
    draft = '';
    if (findQ) setQuery('');
    /* `ListStore.save()` has already toasted `saveFailed` on a refusal - a
       "created" on top of it would bury the one message that matters. */
    if (store.saved) app.say(t.listCreated.replace('%s', l.name));
  }

  async function share(l: StoredList): Promise<void> {
    if (!l.ids.length) {
      app.say(t.listEmpty);
      return;
    }
    const payload = await app.env.compress.pack(encodeListRaw(l, true));
    await app.copied(
      () => app.env.clipboard.writeText(app.linkTo(sharedListHash(payload))),
      t.playersLinkCopied
    );
  }

  function del(l: StoredList): void {
    if (!app.env.dialog.confirm(t.deleteConfirm.replace('%s', l.name))) return;
    const removed = app.lists.remove(l.id);
    /* Delete gets an undo, like every other destructive action here. */
    if (removed) {
      app.say(t.listDeleted.replace('%s', l.name), {
        action: {
          label: t.undo,
          run: () => {
            app.lists.restoreList(removed.list, removed.index);
          }
        }
      });
    }
  }

  /* An account list goes for good: the confirm names its share links, and
     there is no undo. */
  function delAccount(l: CloudList): void {
    if (!app.env.dialog.confirm(t.deleteCloudConfirm.replace('%s', l.name))) return;
    cloud?.remove(l.id);
    app.say(t.listDeleted.replace('%s', l.name));
  }
</script>

<PageHead {app} title={t.lists} sub={t.subLists} help={helpFor('lists', app.lang)} />

{#if !index}
  <StorageNotice {app} />
  <NoData>{t.noData}</NoData>
{:else}
  {#if target === 'local' || target === 'cloud'}
    <Panel style="margin-top:16px">
      <Field label={t.newList}>
        <NumRow>
          <div class="grow">
            <TextInput
              bind:value={draft}
              bind:el={nameInput}
              placeholder={t.listNamePh}
              label={t.newList}
            />
          </div>
          <Button variant="primary" onclick={create}>{t.create}</Button>
        </NumRow>
      </Field>
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
      <div class="group">
        <Field label={t.groupAccount} heading>
          {#if cloud.status === 'error'}
            <p class="grouptext err">{t.cloudLoadFailed}</p>
            <Button size="sm" onclick={() => void cloud.load()}>{t.retry}</Button>
          {:else if cloud.status !== 'ready'}
            <p class="grouptext">{t.cloudLoading}</p>
          {:else if !account.length}
            <p class="grouptext">{t.noCloudLists}</p>
          {:else if drawnAccount.length}
            <div class="listgrid">
              {#each drawnAccount as l (l.id)}
                <ListCard
                  {app}
                  list={l}
                  href={storedListHash(l.id)}
                  items={knownItems(l)}
                  edited={agoText(l.updated, app.now, app.lang, t)}
                >
                  {#snippet actions()}
                    <Button
                      size="sm"
                      variant="danger"
                      onclick={() => {
                        delAccount(l);
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
    {#if browserGroup}
      <div class="group" class:first={!signedIn}>
        <Field label={signedIn ? t.groupBrowser : undefined} heading>
          <StorageNotice {app} />
          {#if drawnLocal.length}
            <div class="listgrid">
              {#each drawnLocal as l (l.id)}
                <ListCard
                  {app}
                  list={l}
                  href={sharedListHash(encodeList(l, false))}
                  items={knownItems(l)}
                >
                  {#snippet actions()}
                    <Button size="sm" onclick={() => void share(l)}
                      ><Icon name="link" />{t.share}</Button
                    >
                    <Button
                      size="sm"
                      variant="danger"
                      onclick={() => {
                        del(l);
                      }}>{t.del}</Button
                    >
                  {/snippet}
                </ListCard>
              {/each}
            </div>
          {:else if !cloud && !local.length}
            <Empty>{t.noLists}</Empty>
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

  /* With no heading, the browser group keeps the grid's own 18px. */
  .group.first {
    margin-top: 18px;
  }

  .grouptext {
    margin: 0;
    font-size: 12.5px;
    color: var(--muted2);
  }

  .grouptext.err {
    color: var(--danger-text);
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
