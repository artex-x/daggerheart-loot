<script lang="ts">
  /* The lists index, `#/lists` - off `renderLists` (app.js 2909-2931),
   * `storageWarning`/`hideWarn` (2865-2886, 4175) and `listCardHTML`
   * (2888-2907). The storage notice lives here and on the list page (B5.4),
   * nowhere else - `Shell.svelte`'s own copy was the rewrite's invention. */
  import { untrack } from 'svelte';
  import Button from './Button.svelte';
  import Empty from './Empty.svelte';
  import Field from './Field.svelte';
  import Icon from './Icon.svelte';
  import PageHead from './PageHead.svelte';
  import { artSrc } from '../lib/desc.js';
  import { sharedListHash } from '../lib/hash.js';
  import { helpFor } from '../lib/help.js';
  import { decodeList, encodeList, encodeListRaw } from '../lib/listLink.js';
  import type { StoredList } from '../lib/lists.js';
  import type { Record_ } from '../lib/types.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  const t = $derived(app.t);
  const index = $derived(app.index);
  const lists = $derived(app.lists.lists);

  /* Read once: whether storage works does not change while the page is
     open, and asking on every render costs a write and a delete each
     time - the same reason `Shell.svelte` used to read it once. */
  const works = untrack(() => app.env.storage.works());

  const say = (msg: string, error?: boolean): void => {
    app.say(msg, { error });
  };

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

  function dismiss(e: MouseEvent): void {
    /* The cross sits inside the summary, so a plain click would also toggle
       the disclosure - the live `hideWarn` calls this first for the same
       reason. */
    e.preventDefault();
    app.hideWarn();
  }

  function create(): void {
    if (!draft.trim()) {
      say(t.nameFirst, true);
      nameInput?.focus();
      return;
    }
    const l = app.lists.create(draft);
    draft = '';
    /* `ListStore.save()` has already toasted `saveFailed` on a refusal - a
       "created" on top of it would bury the one message that matters. */
    if (app.lists.saved) say(t.listCreated.replace('%s', l.name));
  }

  async function share(l: StoredList): Promise<void> {
    if (!l.ids.length) {
      say(t.listEmpty);
      return;
    }
    const payload = await app.env.compress.pack(encodeListRaw(l, true));
    const ok = await app.env.clipboard.writeText(app.linkTo(sharedListHash(payload)));
    say(ok ? t.playersLinkCopied : t.copyFailed, !ok);
  }

  function del(l: StoredList): void {
    if (!app.env.dialog.confirm(t.deleteConfirm.replace('%s', l.name))) return;
    app.lists.remove(l.id);
  }

  async function restore(): Promise<void> {
    const raw = importDraft.trim();
    /* `~` is in the capture on purpose: the live regex lacks it and so refuses
       its own "Поделиться" output whenever the packed form is shorter - see
       plan.md, "B5.3 planned", "Decided in planning". */
    const m = /#\/l\/([~A-Za-z0-9_-]+)/.exec(raw);
    let pay = m?.[1] ?? raw;
    try {
      pay = await app.env.compress.unpack(pay);
    } catch {
      pay = '';
    }
    const data = decodeList(pay, (id) => index?.byId.has(id) ?? false);
    if (!data) {
      say(t.badShare, true);
      return;
    }
    const l = app.lists.create(data.name, {
      ids: data.ids,
      ...(data.meta ? { meta: data.meta } : {})
    });
    importDraft = '';
    app.go(sharedListHash(encodeList(l, true)));
  }
</script>

<PageHead {app} title={t.lists} sub={t.subLists} help={helpFor('lists', app.lang)} {say} />

{#if !works}
  <!-- Nothing dismisses this one - there is nothing to remember it with. -->
  <div class="warn"><b>{t.noStorageTitle}</b>{' ' + t.noStorage}</div>
{:else if !app.warnHidden}
  <!-- The live `render()` builds this notice fresh on a language switch, and
       `restoreOpen` (app.js 3769) only re-applies a person's fold/unfold to
       `[data-keep]` elements - this is not one. Keyed on `app.lang` so the
       rewrite's own `<details>` is destroyed and re-created the same way. -->
  {#key app.lang}
    <details class="warn">
      <summary
        ><b>{t.localOnlyTitle}</b><i>{t.readMore}</i><button
          type="button"
          class="warn-x"
          title={t.dismiss}
          aria-label={t.dismiss}
          onclick={dismiss}>&times;</button
        ></summary
      >
      <p>{t.localOnly}</p>
    </details>
  {/key}
{/if}

{#if !index}
  <p class="miss">{t.noData}</p>
{:else}
  <div class="panel">
    <Field label={t.newList}>
      <div class="numrow">
        <div class="grow">
          <input
            type="text"
            bind:value={draft}
            bind:this={nameInput}
            placeholder={t.listNamePh}
          />
        </div>
        <Button variant="primary" onclick={create}>{t.create}</Button>
      </div>
    </Field>
    <Field label={t.importList}>
      <div class="numrow">
        <div class="grow">
          <input type="text" bind:value={importDraft} placeholder={t.importPh} />
        </div>
        <Button onclick={restore}>{t.importBtn}</Button>
      </div>
    </Field>
  </div>
  {#if lists.length}
    <div class="listgrid">
      {#each lists as l (l.id)}
        {@const items = knownItems(l)}
        <div class="listcard">
          <!-- The live link's accessible name has no space between the name,
               the badge and the thumbs/empty paragraph - "Клад дракона7",
               "Лавка в порту0Список пуст". `.listcard-top` and the thumbs/empty
               element are display:block, so a stray whitespace text node here
               is invisible on screen but still lands in textContent, which is
               what the parity harness's control-name check reads. Prettier
               reformats a short block tag back onto its own line on every
               format, reintroducing the gap - the ignore has to cover the
               whole link, the same fix TableRows.svelte already needed. -->
          <!-- prettier-ignore -->
          <a class="listcard-main" href={sharedListHash(encodeList(l, true))}
            ><div class="listcard-top"><b>{l.name}</b><span class="badge num"
                >{items.length}</span
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
  .miss {
    margin: 0;
    color: var(--muted);
  }

  /* off `.panel` in style.css, plus the 16px margin-top the live markup
     writes inline on this specific panel. */
  .panel {
    background: linear-gradient(180deg, var(--surface2), var(--surface));
    border: 1px solid var(--line);
    border-radius: var(--r);
    padding: 18px;
    box-shadow: var(--shadow);
    margin-top: 16px;
  }

  .numrow {
    display: flex;
    gap: 10px;
    align-items: stretch;
    flex-wrap: wrap;
  }

  .numrow .grow {
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

  /* off `.badge` and `.badge.num` in style.css - the card and the table row
     already carry their own copies; this is the third, recorded rather than
     extracted (plan.md, "B5.3 planned", "Decided in planning"). */
  .badge {
    font-size: 10.5px;
    font-weight: 650;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    padding: 3px 7px;
    border-radius: 6px;
    background: rgb(10 8 16 / 50%);
    border: 1px solid var(--line2);
    color: var(--muted);
  }

  .badge.num {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0;
    color: var(--gold-soft);
    border-color: rgb(216 171 94 / 50%);
  }

  /* off `.warn` in style.css, declared twice there (855-861, 963) - merged
     into one rule here. */
  .warn {
    padding: 11px 14px;
    border-radius: var(--r-sm);
    line-height: 1.5;
    background: rgb(224 104 95 / 9%);
    border: 1px solid rgb(224 104 95 / 30%);
    color: #e0b6b1;
    font-size: 13px;
    position: relative;
    margin-bottom: 16px;
  }

  .warn b {
    color: #f5c0ba;
    font-weight: 650;
  }

  .warn summary {
    list-style: none;
    cursor: pointer;
    display: flex;
    gap: 8px;
    align-items: baseline;
    flex-wrap: wrap;
    padding-right: 26px;
  }

  .warn summary::-webkit-details-marker {
    display: none;
  }

  .warn summary i {
    font-style: normal;
    font-size: 12px;
    color: #e0b6b1;
    opacity: 0.75;
    text-decoration: underline;
  }

  .warn[open] summary i {
    visibility: hidden;
  }

  .warn p {
    margin: 9px 0 0;
  }

  .warn-x {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 26px;
    height: 26px;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--muted2);
    font-size: 19px;
    line-height: 1;
    border-radius: 7px;
    transition: 0.15s;
  }

  .warn-x:hover {
    background: rgb(255 255 255 / 7%);
    color: var(--txt);
  }

  /* off the keyboard-focus block in style.css, `.warn-x`'s own share of it */
  .warn-x:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
    border-radius: 8px;
  }
</style>
