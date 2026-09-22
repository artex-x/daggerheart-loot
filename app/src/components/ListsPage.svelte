<script lang="ts">
  /* The lists index, `#/lists` - off `renderLists` (app.js 2909-2931),
   * `storageWarning`/`hideWarn` (2865-2886, 4175) and `listCardHTML`
   * (2888-2907). The storage notice lives here and on the list page,
   * nowhere else - `Shell.svelte`'s own copy was the rewrite's invention. */
  import Badge from './Badge.svelte';
  import Button from './Button.svelte';
  import Empty from './Empty.svelte';
  import Field from './Field.svelte';
  import Icon from './Icon.svelte';
  import NoData from './NoData.svelte';
  import NumRow from './NumRow.svelte';
  import PageHead from './PageHead.svelte';
  import Panel from './Panel.svelte';
  import StorageNotice from './StorageNotice.svelte';
  import { artSrc } from '../lib/desc.js';
  import { sharedListHash } from '../lib/hash.js';
  import { helpFor } from '../lib/help.js';
  import { decodeList, encodeList, encodeListRaw } from '../lib/listLink.js';
  import { copyInit, type StoredList } from '../lib/lists.js';
  import type { Record_ } from '../lib/types.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  const t = $derived(app.t);
  const index = $derived(app.index);
  const lists = $derived(app.lists.lists);

  let draft = $state('');
  let importDraft = $state('');
  let nameInput = $state<HTMLInputElement | undefined>(undefined);

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
    const l = app.lists.create(draft);
    draft = '';
    /* `ListStore.save()` has already toasted `saveFailed` on a refusal - a
       "created" on top of it would bury the one message that matters. */
    if (app.lists.saved) app.say(t.listCreated.replace('%s', l.name));
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

  async function restore(): Promise<void> {
    const raw = importDraft.trim();
    /* `~` is in the capture on purpose: the live regex lacks it and so refuses
       its own "Поделиться" output whenever the packed form is shorter. */
    const m = /#\/l\/([~A-Za-z0-9_-]+)/.exec(raw);
    let pay = m?.[1] ?? raw;
    try {
      pay = await app.env.compress.unpack(pay);
    } catch {
      pay = '';
    }
    const data = decodeList(pay, (id) => index?.byId.has(id) ?? false);
    if (!data) {
      app.say(t.badShare, { error: true });
      return;
    }
    const l = app.lists.create(data.name, copyInit(data));
    importDraft = '';
    app.go(sharedListHash(encodeList(l, true)));
    /* This call site must not proceed silently - once created, a dropped
       entry is gone from the copy for good even if the data later knows it
       again. */
    if (data.dropped) app.say(t.droppedItems.replace('%n', String(data.dropped)));
  }
</script>

<PageHead {app} title={t.lists} sub={t.subLists} help={helpFor('lists', app.lang)} />

<StorageNotice {app} />

{#if !index}
  <NoData>{t.noData}</NoData>
{:else}
  <Panel style="margin-top:16px">
    <Field label={t.newList}>
      <NumRow>
        <div class="grow">
          <input
            type="text"
            bind:value={draft}
            bind:this={nameInput}
            placeholder={t.listNamePh}
            aria-label={t.newList}
          />
        </div>
        <Button variant="primary" onclick={create}>{t.create}</Button>
      </NumRow>
    </Field>
    <Field label={t.importList}>
      <NumRow>
        <div class="grow">
          <input
            type="text"
            bind:value={importDraft}
            placeholder={t.importPh}
            aria-label={t.importList}
          />
        </div>
        <Button onclick={restore}>{t.importBtn}</Button>
      </NumRow>
    </Field>
  </Panel>
  {#if lists.length}
    <div class="listgrid">
      {#each lists as l (l.id)}
        {@const items = knownItems(l)}
        <div class="listcard">
          <!-- Whitespace below is content, covering the whole link - see
               docs/specs/COVERAGE.md, "Whitespace text nodes are content". -->
          <!-- prettier-ignore -->
          <a class="listcard-main" href={sharedListHash(encodeList(l, false))}
            ><div class="listcard-top"><b>{l.name}</b><Badge cls="num"
                >{items.length}</Badge
              ></div
            >{#if items.length}<div class="listcard-thumbs"
                >{#each items.slice(0, 6) as it (it.id)}<img
                    src={artSrc(it.img, app.artBroken(it.id))}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onerror={() => {
                      app.markArtBroken(it.id);
                    }}
                  />{/each}</div
              >{:else}<p class="listcard-empty">{t.listEmpty}</p>{/if}</a
          >
          <div class="listcard-acts">
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
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <Empty>{t.noLists}</Empty>
  {/if}
{/if}

<style>
  /* `.miss` moved to `NoData.svelte`, `.numrow` to `NumRow.svelte`, `.panel`
     to `Panel.svelte` - the 16px margin-top is the live inline attribute,
     passed as `style`. */
  /* Was `.numrow .grow`: `.numrow` now belongs to `NumRow.svelte`, a
     different component, so a descendant selector naming it here would match
     nothing - `.grow` only ever appears inside this file's own two `NumRow`
     children anyway, so the ancestor is not needed to disambiguate it. */
  .grow {
    flex: 1 1 170px;
    min-width: 0;
  }

  /* off the global `input[type=text]` rule in style.css - `TablesPage.svelte`
     scopes its own search box the same way rather than sharing one. */
  input[type='text'] {
    width: 100%;
    height: 46px;
    padding: 0 14px;
    border-radius: var(--r-sm);
    background: var(--bg2);
    border: 1px solid var(--line2);
    color: var(--txt);
    font: inherit;
  }

  input[type='text']:focus {
    outline: none;
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgb(216 171 94 / 14%);
  }

  /* off `.listgrid`..`.listcard-acts` in style.css. No `@media` override
     touches any of these. */
  .listgrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 14px;
    margin-top: 18px;
  }

  .listcard {
    background: linear-gradient(180deg, var(--surface2), var(--surface));
    border: 1px solid var(--line);
    border-radius: var(--r);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: 0.16s;
  }

  .listcard:hover {
    border-color: var(--line2);
  }

  .listcard-main {
    display: block;
    padding: 14px 15px 12px;
    text-decoration: none;
    color: inherit;
    flex: 1;
  }

  .listcard-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 10px;
  }

  .listcard-top b {
    font-size: 15.5px;
    font-weight: 650;
    line-height: 1.3;
  }

  .listcard-main:hover .listcard-top b {
    color: var(--gold-soft);
  }

  .listcard-thumbs {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
  }

  .listcard-thumbs img {
    width: 40px;
    height: 40px;
    border-radius: 7px;
    object-fit: cover;
    background: #0a0810;
  }

  .listcard-empty {
    margin: 0;
    font-size: 12.5px;
    color: var(--muted2);
  }

  .listcard-acts {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    padding: 0 15px 14px;
  }
</style>
