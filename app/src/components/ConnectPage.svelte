<script lang="ts">
  /* `#/connect/<id>`: the consent page of the Supabase OAuth 2.1 server. It reads one
     connection request, says what the app can and cannot do, and goes back to the app with
     the answer. Drawn only in a build with sign-in configured (docs/specs/FEATURES.md,
     "Connect an app"). */
  import Button from './Button.svelte';
  import ErrorPage from './ErrorPage.svelte';
  import Field from './Field.svelte';
  import LoadState from './LoadState.svelte';
  import PageTitle from './PageTitle.svelte';
  import Panel from './Panel.svelte';
  import SessionLine from './SessionLine.svelte';
  import SignInPanel from './SignInPanel.svelte';
  import { isAuthorizationId } from '../lib/apps.js';
  import { connectHash, sectionHash } from '../lib/hash.js';
  import type { AppRequestRead, CloudPort } from '../ports/index.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    cloud: CloudPort;
    id: string;
  }

  const { app, cloud, id }: Props = $props();

  const t = $derived(app.t);
  /* A framed page answers nothing: a click on it could be someone else's
     (frame-ancestors covers the host's paths; this covers any it misses). */
  const known = $derived(!app.env.page.framed() && isAuthorizationId(id));
  const userId = $derived(app.user?.userId ?? null);

  let read = $state<AppRequestRead | null>(null);
  let reread = $state(0);
  /* Which answer runs: both buttons are disabled meanwhile, and after a sent answer the
     page is leaving, so they stay so. */
  let answering = $state<'approve' | 'deny' | null>(null);

  $effect(() => {
    void reread;
    const user = userId;
    read = null;
    if (!known || !user) return;
    let live = true;
    void cloud.apps.details(id).then((r) => {
      if (live) read = r;
    });
    return () => {
      live = false;
    };
  });

  async function answer(how: 'approve' | 'deny'): Promise<void> {
    if (answering) return;
    answering = how;
    const r = await (how === 'approve' ? cloud.apps.approve(id) : cloud.apps.deny(id));
    if (!r.ok) {
      answering = null;
      app.say((t) => t.accountFailed, { error: true });
    }
  }

  const scope = $derived([
    t.connectCanLists,
    t.connectCanItems,
    t.connectCanShared,
    t.connectCanFiles,
    t.connectCanPersonal
  ]);
</script>

{#if !known || (read?.ok && 'gone' in read)}
  <ErrorPage title={t.connectExpired} said>
    {t.connectExpiredText}
    {#snippet actions()}
      <Button href={app.href(sectionHash('roll/std'))} sameTab>{t.toStart}</Button>
    {/snippet}
  </ErrorPage>
{:else if read?.ok && 'done' in read}
  <!-- An answered request: the port is leaving for the app's address. -->
  <PageTitle title={t.connectTitle} sub="" />
{:else}
  <div class="col">
    {#if app.user === undefined || (app.user && read === null)}
      <PageTitle title={t.connectTitle} sub="" />
      <LoadState {t} failed={false} text="" onretry={() => undefined} />
    {:else if app.user === null}
      <PageTitle title={t.connectTitle} sub={t.connectSignIn} />
      <SignInPanel {app} after={{ hash: connectHash(id) }} />
    {:else if read && !read.ok}
      <PageTitle title={t.connectTitle} sub="" />
      <LoadState
        {t}
        failed
        page
        text={t.connectLoadFailed}
        onretry={() => {
          reread++;
        }}
      />
    {:else if read && 'request' in read}
      {@const req = read.request}
      <PageTitle title={t.connectTitle} sub={t.connectLead} />
      <Panel primary>
        <Field>
          <p class="appname">{req.name}</p>
          {#if req.host}<p class="apphost">{t.connectBack.replace('%s', req.host)}</p>{/if}
        </Field>
        <Field label={t.connectAccount} heading>
          {#if app.user}<SessionLine {t} session={app.user} />{/if}
        </Field>
        <Field label={t.connectCan} heading>
          <ul class="scope">
            {#each scope as line (line)}<li>{line}</li>{/each}
          </ul>
          <p class="hint">{t.connectCascade}</p>
        </Field>
        <Field label={t.connectCannot} heading>
          <p class="small">{t.connectCannotLine}</p>
        </Field>
        <Field>
          <div class="row-btns">
            <Button
              variant="primary"
              disabled={answering !== null}
              onclick={() => void answer('approve')}
              >{answering === 'approve' ? t.connectAllowing : t.connectAllow}</Button
            >
            <Button
              variant="ghost"
              disabled={answering !== null}
              onclick={() => void answer('deny')}>{t.connectDeny}</Button
            >
          </div>
          <p class="hint">{t.connectWhere}</p>
        </Field>
      </Panel>
    {/if}
  </div>
{/if}

<style>
  /* The passage measure (DESIGN.md, "The Measure Rule"); the sign-in lead takes the line
     measure from PageTitle. */
  .col > :global(.panel) {
    max-width: var(--measure-text);
  }

  .appname {
    margin: 0;
    font-size: var(--t-title);
    font-weight: 700;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  .apphost {
    margin: 2px 0 0;
    font-size: var(--t-data);
    color: var(--muted);
    overflow-wrap: anywhere;
  }

  .scope {
    margin: 0;
    padding-left: 20px;
    font-size: var(--t-small);
  }

  .scope li + li {
    margin-top: 4px;
  }

  .small {
    margin: 0;
    font-size: var(--t-small);
  }

  .hint {
    margin: 10px 0 0;
    font-size: var(--t-data);
    color: var(--muted);
  }

  .row-btns {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
