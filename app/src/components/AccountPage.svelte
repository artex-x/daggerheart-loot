<script lang="ts">
  /* `#/account`: the display defaults, the providers they sign in with (the one in use
     marked), the account's data export, signing out, and deleting the account - or,
     signed out, the way in. Two columns from 1000 px, in the DOM order of the one column.
     Drawn only in a build with sign-in configured; `App.svelte` shows the not-found page
     otherwise (docs/specs/FEATURES.md, "Account"). */
  import { tick } from 'svelte';
  import Badge from './Badge.svelte';
  import Button from './Button.svelte';
  import Field from './Field.svelte';
  import LoadState from './LoadState.svelte';
  import NumRow from './NumRow.svelte';
  import PageTitle from './PageTitle.svelte';
  import Panel from './Panel.svelte';
  import ProviderLogo from './ProviderLogo.svelte';
  import { PROVIDER_NAME, PROVIDERS } from './providers.js';
  import Seg from './Seg.svelte';
  import SessionLine from './SessionLine.svelte';
  import SignInPanel from './SignInPanel.svelte';
  import TextInput from './TextInput.svelte';
  import { longDate, type AppGrant } from '../lib/apps.js';
  import { sectionLabel } from '../lib/dict.js';
  import { plural } from '../lib/plural.js';
  import { HOMEBREW_HASH, parseHash, sectionHash, tablesHash } from '../lib/hash.js';
  import type { NotifyGm } from '../lib/prefs.js';
  import { BARE_TABLE, SECTIONS, type Lang, type Section } from '../lib/types.js';
  import type { AppsRead, AuthResult, Identity, Provider } from '../ports/index.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  const PANEL = 'margin-top:16px';

  const t = $derived(app.t);
  const cloud = $derived(app.env.cloud);
  const userId = $derived(app.user?.userId ?? null);

  /* null until the identities of this user are known: no row claims a
     provider is "not connected" before the answer. */
  let ids = $state<Identity[] | null>(null);
  /* The signed-in read failed: no row, and no Connect for a provider the
     reader may already hold. */
  let idsFailed = $state(false);
  /* Bumped after a change the session does not announce by a new user id. */
  let reread = $state(0);
  let busy = $state(false);
  /* The account delete runs: its button reads «Удаляем...». */
  let deleting = $state(false);
  let going = $state<Provider | null>(null);
  let confirming = $state(false);
  let typed = $state('');
  let typedEl = $state<HTMLInputElement | undefined>(undefined);
  let deleteOpener = $state<HTMLButtonElement | undefined>(undefined);
  /* «Скачать мои данные (ZIP)» while its zip is built. */
  let exporting = $state(false);

  async function exportData(): Promise<void> {
    exporting = true;
    await app.exportData();
    exporting = false;
  }

  const typedOk = $derived(typed.trim().toLowerCase() === t.deleteWord);

  /* The Display section: each control writes through the setter its page
     already uses, so the account row follows (docs/specs/STATE.md, "Account
     preferences"). */
  const LANGS: readonly { value: Lang; label: string }[] = [
    { value: 'ru', label: 'RU' },
    { value: 'en', label: 'EN' }
  ];
  const views = $derived([
    { value: 'list' as const, label: t.viewList },
    { value: 'grid' as const, label: t.viewGrid }
  ]);
  const art = $derived([
    { value: 'color' as const, label: t.printColor },
    { value: 'bw' as const, label: t.printBW }
  ]);
  const sizes = $derived([
    { value: 'std' as const, label: t.printStd },
    { value: 'compact' as const, label: t.printCompact }
  ]);

  /* What the delete takes, from the stores already read: a count never read is never
     drawn, and a count of zero is left out. */
  const goes = $derived.by(() => {
    const out: string[] = [];
    const cl = app.cloudLists;
    if (cl?.status === 'ready' && cl.lists.length > 0) {
      out.push(plural(cl.lists.length, t.listsN, app.lang));
    }
    const hb = app.homebrew;
    if (hb?.status === 'ready') {
      const own = [
        [hb.items.length, t.hbItemsN],
        [hb.books.length, t.hbSourcesN],
        [hb.cards.filter((c) => c.kind === 'set').length, t.hbSetsN],
        [hb.cards.filter((c) => c.kind === 'ref').length, t.hbRefsN]
      ] as const;
      const line = own
        .filter(([n]) => n > 0)
        .map(([n, forms]) => plural(n, forms, app.lang))
        .join(', ');
      if (line) out.push(line);
    }
    out.push(t.deleteGoesRest);
    return out;
  });
  const notify = $derived<{ value: NotifyGm; label: string }[]>([
    { value: 'ask', label: t.notifyAsk },
    { value: 'always', label: t.notifyAlways },
    { value: 'never', label: t.notifyNever }
  ]);
  /* The app writes the named form of a Tables pin, never a bare `#/tables`
     (docs/specs/STATE.md, "localStorage keys"). */
  const TABLES_HOME = tablesHash(BARE_TABLE);
  const optionOf = (s: Section): string => (s === 'tables' ? TABLES_HOME : sectionHash(s));
  /* Any Tables pin reads as the Tables option and keeps its address until
     another section is chosen; an old section name reads as its section. */
  const homeValue = $derived.by(() => {
    const r = parseHash(app.home);
    if (r.kind === 'tables') return TABLES_HOME;
    return r.kind === 'section' ? optionOf(r.section) : app.home;
  });

  function setHome(e: Event & { currentTarget: HTMLSelectElement }): void {
    const select = e.currentTarget;
    if (app.setHome(select.value)) return;
    select.value = homeValue;
    app.say((t) => t.saveFailed, { error: true });
  }

  function setNotify(e: Event & { currentTarget: HTMLSelectElement }): void {
    const picked = e.currentTarget.value;
    const v = notify.find((o) => o.value === picked)?.value;
    if (v) app.setNotifyGm(v);
  }

  let loadedFor: string | null = null;

  /* An answer that arrives after the user changed is somebody else's. */
  $effect(() => {
    void reread;
    const id = userId;
    if (id !== loadedFor) {
      ids = null;
      idsFailed = false;
      loadedFor = id;
    }
    if (!cloud || !id) return;
    let live = true;
    void cloud.auth.identities().then((list) => {
      if (!live) return;
      ids = list;
      idsFailed = list === null;
    });
    return () => {
      live = false;
    };
  });

  async function act(
    run: () => Promise<AuthResult>,
    done?: (r: AuthResult) => void
  ): Promise<void> {
    if (busy) return;
    busy = true;
    app.alreadyLinked = null;
    try {
      const r = await run();
      if (done) done(r);
      else if (!r.ok) app.say((t) => t.accountFailed, { error: true });
    } finally {
      busy = false;
      going = null;
    }
  }

  /* Sign-in and Connect leave for the provider; the port saves the way back,
     and a sign-in carries the prompt that led here (`app.signInFor`). The
     fake links in place, so identities are read again on success. */
  function leave(p: Provider, run: () => Promise<AuthResult>): void {
    going = p;
    void act(run, (r) => {
      if (r.ok) reread++;
      else if (r.error === 'alreadyLinked') app.alreadyLinked = p;
      else app.say((t) => t.accountFailed, { error: true });
    });
  }

  function disconnect(id: string): void {
    void act(
      () => cloud?.auth.unlink(id) ?? Promise.resolve({ ok: false, error: 'failed' }),
      (r) => {
        if (r.ok) reread++;
        else app.say((t) => t.accountFailed, { error: true });
      }
    );
  }

  function signOut(scope: 'local' | 'global'): void {
    void act(
      () => app.signOut(scope),
      (r) => {
        app.say(r.ok ? (t) => t.signedOut : (t) => t.accountFailed, { error: !r.ok });
      }
    );
  }

  function deleteAccount(): void {
    if (busy) return;
    deleting = true;
    void act(
      () => cloud?.auth.deleteAccount() ?? Promise.resolve({ ok: false, error: 'failed' }),
      (r) => {
        if (r.ok) closeConfirm();
        app.say(r.ok ? (t) => t.accountDeleted : (t) => t.accountFailed, { error: !r.ok });
      }
    ).finally(() => {
      deleting = false;
    });
  }

  /* «Подключённые приложения»: null while the grants are read. */
  let apps = $state<AppsRead | null>(null);
  let appsRead = $state(0);
  let appRows = $state<HTMLUListElement | undefined>(undefined);
  const grants = $derived<AppGrant[]>(apps?.ok && 'apps' in apps ? apps.apps : []);

  /* A retry, and a user that changed, read the grants again; an answer for an earlier
     user is dropped. */
  $effect(() => {
    void appsRead;
    const id = userId;
    apps = null;
    if (!cloud || !id) return;
    let live = true;
    void cloud.apps.list().then((r) => {
      if (live) apps = r;
    });
    return () => {
      live = false;
    };
  });

  /* A revoke cannot be written back, so it asks first (rule 10). A removed row hands the
     focus to the next row's «Отключить», else the one before, else `#main` (rule 20). */
  async function revoke(a: AppGrant): Promise<void> {
    if (busy || !cloud) return;
    if (!app.env.dialog.confirm(t.appDisconnectConfirm.replace('%s', a.name))) return;
    busy = true;
    try {
      const done = await cloud.apps.revoke(a.clientId);
      if (!done) {
        app.say((t) => t.accountFailed, { error: true });
        return;
      }
      if (apps?.ok && 'apps' in apps) {
        const at = apps.apps.findIndex((x) => x.clientId === a.clientId);
        apps = { ok: true, apps: apps.apps.filter((x) => x.clientId !== a.clientId) };
        busy = false;
        await tick();
        const buttons = [...(appRows?.querySelectorAll('button') ?? [])];
        (buttons[at] ?? buttons[at - 1] ?? document.getElementById('main'))?.focus();
      }
      app.say((t) => t.appDisconnected.replace('%s', a.name));
    } finally {
      busy = false;
    }
  }

  async function toggleConfirm(): Promise<void> {
    if (confirming) {
      closeConfirm();
      return;
    }
    confirming = true;
    await tick();
    typedEl?.focus();
  }

  function closeConfirm(): void {
    confirming = false;
    typed = '';
  }

  /* «Отмена» leaves with the confirm, so the focus returns to its opener (rule 20). */
  function cancelConfirm(): void {
    closeConfirm();
    deleteOpener?.focus();
  }
</script>

{#if cloud}
  <div class="col">
    {#if app.user === undefined}
      <PageTitle title={t.account} sub="" />
      <LoadState {t} failed={false} text="" onretry={() => undefined} />
    {:else if app.user === null}
      <PageTitle title={t.account} sub={t.signInLead} />
      <SignInPanel {app} />
    {:else}
      {@const session = app.user}
      <!-- No sub signed in: the section headings name what the page holds. The empty
           line keeps the spacing of the loading state. -->
      <PageTitle title={t.account} sub="" />

      <div class="acc">
        <div class="colA">
          <Panel style={PANEL} primary>
            <Field label={t.displayHead} heading>
              <div class="set">
                <span class="setname">{t.langLabel}</span>
                <Seg
                  neutral
                  options={LANGS}
                  value={app.lang}
                  label={t.langLabel}
                  onchange={(l: Lang) => {
                    app.setLang(l);
                  }}
                />
              </div>
              <div class="set">
                <label class="setname" for="display-home">{t.displayHome}</label>
                <select id="display-home" value={homeValue} onchange={setHome}>
                  {#each SECTIONS as s (s)}
                    <option value={optionOf(s)}>{sectionLabel(s, t)}</option>
                  {/each}
                  <option value={HOMEBREW_HASH}>{t.myItems}</option>
                </select>
              </div>
              <div class="set">
                <span class="setname">{t.defaultTablesView}</span>
                <Seg
                  neutral
                  options={views}
                  value={app.tablesView}
                  label={t.defaultTablesView}
                  onchange={(v: 'list' | 'grid') => {
                    app.setTablesView(v);
                  }}
                />
              </div>
              <!-- The two print defaults carry the group names of the `/p/` toolbar. -->
              <div class="set">
                <span class="setname">{t.printInk}</span>
                <Seg
                  neutral
                  small
                  options={art}
                  value={app.printBW ? 'bw' : 'color'}
                  label={t.printInk}
                  onchange={(v: 'color' | 'bw') => {
                    app.setPrintBW(v === 'bw');
                  }}
                />
              </div>
              <div class="set">
                <span class="setname">{t.printSize}</span>
                <Seg
                  neutral
                  small
                  options={sizes}
                  value={app.printCompact ? 'compact' : 'std'}
                  label={t.printSize}
                  onchange={(v: 'std' | 'compact') => {
                    app.setPrintCompact(v === 'compact');
                  }}
                />
              </div>
              <!-- A select at every width: three answers of the owner's length do not
                   fit a segmented control at 360 px. -->
              <div class="set">
                <label class="setname" for="display-notify">{t.displayNotify}</label>
                <select id="display-notify" value={app.notifyGm} onchange={setNotify}>
                  {#each notify as o (o.value)}
                    <option value={o.value}>{o.label}</option>
                  {/each}
                </select>
              </div>
            </Field>
          </Panel>

          <Panel style={PANEL}>
            <Field label={t.providers} heading>
              <!-- The session says who is signed in until a row can: while the identities are
                   unread, and for a sign-in no row names (an email link). -->
              {#if !ids || !ids.some((i) => i.provider === session.provider)}
                <SessionLine {t} {session} />
              {/if}
              {#if ids}
                <ul class="ids">
                  {#each PROVIDERS as p (p)}
                    {@const identity = ids.find((i) => i.provider === p)}
                    <li>
                      <span class="pv"
                        ><ProviderLogo provider={p} /><span
                          ><span class="pvname"
                            ><b>{PROVIDER_NAME[p]}</b
                            >{#if identity && session.provider === p}<Badge cls="tier"
                                >{t.signedInNow}</Badge
                              >{/if}</span
                          ><small>{identity ? identity.email : t.notConnected}</small></span
                        ></span
                      >
                      {#if identity && ids.length > 1}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          label={`${t.disconnect} ${PROVIDER_NAME[p]}`}
                          onclick={() => {
                            disconnect(identity.id);
                          }}>{t.disconnect}</Button
                        >
                      {:else if !identity}
                        <Button
                          size="sm"
                          disabled={busy}
                          onclick={() => {
                            leave(p, () => cloud.auth.link(p));
                          }}
                          >{(going === p ? t.redirecting : t.connect).replace(
                            '%s',
                            PROVIDER_NAME[p]
                          )}</Button
                        >
                      {/if}
                      {#if app.alreadyLinked === p}
                        <p class="err" role="alert">
                          {t.alreadyLinked.replace('%s', PROVIDER_NAME[p])}
                        </p>
                      {/if}
                    </li>
                  {/each}
                </ul>
                {#if ids.length === 1 && ids[0]}
                  <p class="hint">
                    {t.onlyMethod.replace('%s', PROVIDER_NAME[ids[0].provider])}
                  </p>
                {/if}
              {:else if idsFailed}
                <p class="err" role="alert">{t.accountFailed}</p>
              {/if}
            </Field>
          </Panel>

          {#if apps === null || !('off' in apps)}
            <Panel style={PANEL}>
              <Field label={t.apps} heading>
                {#if apps === null || !apps.ok}
                  <LoadState
                    {t}
                    failed={apps !== null}
                    text={t.appsLoadFailed}
                    onretry={() => {
                      appsRead++;
                    }}
                  />
                {:else if grants.length === 0}
                  <p class="hint lead flush">{t.appsEmpty}</p>
                {:else}
                  <ul class="ids" bind:this={appRows}>
                    {#each grants as a (a.clientId)}
                      <li>
                        <span class="pv"
                          ><span
                            ><b class="appname">{a.name}</b><small
                              >{(a.host ? a.host + ' · ' : '') +
                                t.appsSince.replace(
                                  '%s',
                                  longDate(a.grantedAt, app.lang)
                                )}</small
                            ></span
                          ></span
                        >
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          label={`${t.disconnect} ${a.name}`}
                          onclick={() => void revoke(a)}>{t.disconnect}</Button
                        >
                      </li>
                    {/each}
                  </ul>
                {/if}
              </Field>
            </Panel>
          {/if}
        </div>

        <div class="colB">
          <Panel style={PANEL}>
            <Field label={t.yourData} heading>
              <p class="hint lead">{t.yourDataHint}</p>
              {#if app.homebrew?.items.some((r) => r.art)}
                <p class="hint lead">{t.zipNoArt}</p>
              {/if}
              <div class="row-btns">
                <Button
                  disabled={exporting || app.cloudLists?.status !== 'ready'}
                  onclick={() => void exportData()}>{t.exportData}</Button
                >
              </div>
              {#if app.cloudLists?.status === 'error'}
                <div style="margin-top:10px">
                  <LoadState
                    {t}
                    failed
                    text={t.cloudLoadFailed}
                    onretry={() => void app.retryLists()}
                  />
                </div>
              {/if}
            </Field>
          </Panel>

          <Panel style={PANEL}>
            <Field label={t.signOutHead} heading>
              <div class="row-btns">
                <Button
                  disabled={busy}
                  onclick={() => {
                    signOut('local');
                  }}>{t.signOut}</Button
                >
                <Button
                  variant="ghost"
                  disabled={busy}
                  onclick={() => {
                    signOut('global');
                  }}>{t.signOutAll}</Button
                >
              </div>
            </Field>
          </Panel>

          <Panel style={PANEL}>
            <Field label={t.deleteHead} heading>
              <p class="hint lead">{t.deleteHint}</p>
              <Button
                variant="danger"
                expanded={confirming}
                disabled={busy}
                bind:el={deleteOpener}
                onclick={() => void toggleConfirm()}>{t.deleteOpen}</Button
              >
              {#if confirming}
                <div class="confirm">
                  <div>
                    <p class="goes">{t.deleteGoes}</p>
                    <ul class="goes">
                      {#each goes as line (line)}<li>{line}</li>{/each}
                    </ul>
                  </div>
                  <label for="account-delete-word"
                    >{t.deleteTypeWord} <b>{t.deleteWord}</b></label
                  >
                  <NumRow>
                    <div class="grow">
                      <TextInput
                        id="account-delete-word"
                        autocomplete="off"
                        bind:value={typed}
                        bind:el={typedEl}
                      />
                    </div>
                    <Button
                      variant="danger-fill"
                      disabled={busy || !typedOk}
                      onclick={deleteAccount}>{deleting ? t.deleting : t.deleteFinal}</Button
                    >
                    <Button variant="ghost" onclick={cancelConfirm}>{t.cancel}</Button>
                  </NumRow>
                </div>
              {/if}
            </Field>
          </Panel>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  /* Signed out the sign-in panel keeps the passage measure and the lead takes the line
     measure (DESIGN.md, "The Measure Rule"); signed in, one column at the passage measure,
     two from 1000 px, the left one first in the DOM, so the tab order reads as the page. */
  .col:has(.acc) {
    max-width: var(--measure-text);
  }

  .col:not(:has(.acc)) > :global(.panel) {
    max-width: var(--measure-text);
  }

  @media (min-width: 1000px) {
    .col:has(.acc) {
      max-width: 1100px;
    }

    .acc {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0 16px;
      align-items: start;
    }
  }

  .hint {
    margin: 10px 0 0;
    font-size: var(--t-data);
    color: var(--muted);
  }

  .hint.lead {
    margin: 0 0 12px;
  }

  .hint.lead.flush {
    margin: 0;
  }

  /* A client names itself, up to 200 characters: the name wraps (rule 16). */
  .appname {
    overflow-wrap: anywhere;
  }

  .row-btns {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .ids {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .ids li,
  .set {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }

  .ids li:first-child,
  .set:first-of-type {
    border-top: 0;
    padding-top: 2px;
  }

  .setname {
    flex: 1 1 180px;
    font-size: var(--t-small);
  }

  /* TextInput.svelte's box at a button's height. */
  select {
    height: max(38px, var(--thumb));
    width: auto;
    max-width: 100%;
    padding: 0 10px;
    border-radius: var(--r-sm);
    background: var(--bg2);
    border: 1px solid var(--line2);
    color: var(--txt);
    font: inherit;
  }

  select:focus {
    outline: none;
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgb(216 171 94 / 14%);
  }

  @media (max-width: 600px) {
    select {
      height: 44px;
    }
  }

  .pv {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex: 1 1 200px;
  }

  .pv :global(svg) {
    width: 18px;
    height: 18px;
    flex: none;
  }

  .pv > span {
    display: flex;
    flex-direction: column;
    line-height: 1.35;
    min-width: 0;
  }

  .pvname {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  /* A long address wraps; it is never cut short. */
  .pv small {
    font-size: var(--t-data);
    color: var(--muted2);
    overflow-wrap: anywhere;
  }

  .err {
    flex-basis: 100%;
    margin: 0;
    font-size: var(--t-data);
    color: var(--danger-text);
  }

  .confirm {
    margin-top: 12px;
    display: grid;
    gap: 10px;
  }

  .confirm label {
    font-size: var(--t-small);
  }

  .goes {
    margin: 0 0 6px;
    font-size: var(--t-small);
    color: var(--muted);
  }

  ul.goes {
    padding-left: 20px;
  }

  .grow {
    flex: 1 1 170px;
    min-width: 0;
  }
</style>
