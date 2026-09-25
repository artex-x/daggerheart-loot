<script lang="ts">
  /* `#/account`: who is signed in, the providers they sign in with, signing
     out, and deleting the account - or, signed out, the way in. Drawn only
     in a build with sign-in configured; `App.svelte` shows the not-found
     page otherwise (docs/specs/FEATURES.md, "Account"). */
  import { tick } from 'svelte';
  import Button from './Button.svelte';
  import Field from './Field.svelte';
  import NumRow from './NumRow.svelte';
  import PageTitle from './PageTitle.svelte';
  import Panel from './Panel.svelte';
  import TextInput from './TextInput.svelte';
  import type { AuthResult, Identity, Provider } from '../ports/index.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  /* Brand names, never translated. */
  const PROVIDER_NAME: Record<Provider, string> = { google: 'Google', discord: 'Discord' };
  const PROVIDERS: readonly Provider[] = ['google', 'discord'];
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
  let going = $state<Provider | null>(null);
  let confirming = $state(false);
  let typed = $state('');
  let typedEl = $state<HTMLInputElement | undefined>(undefined);

  const typedOk = $derived(typed.trim().toLowerCase() === t.deleteWord);

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
      else if (!r.ok) app.say(t.accountFailed, { error: true });
    } finally {
      busy = false;
      going = null;
    }
  }

  /* Sign-in and Connect leave for the provider; the port saves the way back.
     The fake links in place, so identities are read again on success. */
  function leave(p: Provider, run: () => Promise<AuthResult>): void {
    going = p;
    void act(run, (r) => {
      if (r.ok) reread++;
      else if (r.error === 'alreadyLinked') app.alreadyLinked = p;
      else app.say(t.accountFailed, { error: true });
    });
  }

  function disconnect(id: string): void {
    void act(
      () => cloud?.auth.unlink(id) ?? Promise.resolve({ ok: false, error: 'failed' }),
      (r) => {
        if (r.ok) reread++;
        else app.say(t.accountFailed, { error: true });
      }
    );
  }

  function signOut(scope: 'local' | 'global'): void {
    void act(
      () => cloud?.auth.signOut(scope) ?? Promise.resolve({ ok: false, error: 'failed' }),
      (r) => {
        app.say(r.ok ? t.signedOut : t.accountFailed, { error: !r.ok });
      }
    );
  }

  function deleteAccount(): void {
    void act(
      () => cloud?.auth.deleteAccount() ?? Promise.resolve({ ok: false, error: 'failed' }),
      (r) => {
        if (r.ok) closeConfirm();
        app.say(r.ok ? t.accountDeleted : t.accountFailed, { error: !r.ok });
      }
    );
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
</script>

<!-- A `{@render}` tag reads as a void expression to this rule wherever it
     sits among text; the provider logo is rendered beside text three times. -->
<!-- eslint-disable @typescript-eslint/no-confusing-void-expression -->
{#snippet logo(p: Provider)}
  {#if p === 'google'}
    <svg viewBox="0 0 48 48" aria-hidden="true"
      ><path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      /><path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      /><path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      /><path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      /></svg
    >
  {:else}
    <svg viewBox="0 0 24 24" aria-hidden="true"
      ><path
        fill="#5865F2"
        d="M19.3 5.3A16.6 16.6 0 0 0 15.2 4l-.5 1a15.3 15.3 0 0 0-5.4 0l-.5-1a16.6 16.6 0 0 0-4.1 1.3C2.1 9.2 1.4 13 1.7 16.7a16.7 16.7 0 0 0 5 2.6l1.1-1.7a10.8 10.8 0 0 1-1.7-.8l.4-.3a11.9 11.9 0 0 0 11 0l.4.3c-.5.3-1.1.6-1.7.8l1.1 1.7a16.6 16.6 0 0 0 5-2.6c.4-4.3-.7-8-3-11.4zM8.7 14.5c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2z"
      /></svg
    >
  {/if}
{/snippet}

{#if cloud}
  <div class="col">
    {#if app.user === undefined}
      <PageTitle title={t.account} sub="" />
    {:else if app.user === null}
      <PageTitle title={t.account} sub={t.signInLead} />
      <Panel style={PANEL}>
        <Field label={t.signIn} heading>
          <div class="row-btns">
            {#each PROVIDERS as p (p)}
              <Button
                disabled={busy}
                onclick={() => {
                  leave(p, () => cloud.auth.signIn(p));
                }}
                >{@render logo(p)}{(going === p ? t.redirecting : t.signInWith).replace(
                  '%s',
                  PROVIDER_NAME[p]
                )}</Button
              >
            {/each}
          </div>
          <p class="hint">
            {t.consentBefore}<a href={app.pagesDir + 'terms.html'}>{t.consentTerms}</a
            >{t.consentMid}<a href={app.pagesDir + 'privacy.html'}>{t.consentPrivacy}</a
            >{t.consentAfter}
          </p>
        </Field>
      </Panel>
    {:else}
      {@const session = app.user}
      <PageTitle title={t.account} sub={t.accountSub} />

      <Panel style={PANEL}>
        <Field label={t.signedInAs} heading>
          <div class="who">
            {#if session.email}<b>{session.email}</b>{/if}
            {#if session.provider}
              <span class="via"
                >{@render logo(session.provider)}{t.via.replace(
                  '%s',
                  PROVIDER_NAME[session.provider]
                )}</span
              >
            {/if}
          </div>
        </Field>
      </Panel>

      <Panel style={PANEL}>
        <Field label={t.providers} heading>
          {#if ids}
            <ul class="ids">
              {#each PROVIDERS as p (p)}
                {@const identity = ids.find((i) => i.provider === p)}
                <li>
                  <span class="pv"
                    >{@render logo(p)}<span
                      ><b>{PROVIDER_NAME[p]}</b><small
                        >{identity ? identity.email : t.notConnected}</small
                      ></span
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
              <p class="hint">{t.onlyMethod.replace('%s', PROVIDER_NAME[ids[0].provider])}</p>
            {/if}
          {:else if idsFailed}
            <p class="err" role="alert">{t.accountFailed}</p>
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
          <p class="hint">{t.signOutAllHint}</p>
        </Field>
      </Panel>

      <Panel style={PANEL}>
        <Field label={t.deleteHead} heading>
          <p class="hint lead">{t.deleteHint}</p>
          <Button
            variant="danger"
            expanded={confirming}
            disabled={busy}
            onclick={() => void toggleConfirm()}>{t.deleteOpen}</Button
          >
          {#if confirming}
            <div class="confirm">
              <label for="account-delete-word">{t.deleteTypeWord} <b>{t.deleteWord}</b></label>
              <NumRow>
                <div class="grow">
                  <TextInput
                    id="account-delete-word"
                    autocomplete="off"
                    bind:value={typed}
                    bind:el={typedEl}
                  />
                </div>
                <Button variant="danger" disabled={busy || !typedOk} onclick={deleteAccount}
                  >{t.deleteFinal}</Button
                >
                <Button variant="ghost" onclick={closeConfirm}>{t.cancel}</Button>
              </NumRow>
            </div>
          {/if}
        </Field>
      </Panel>
    {/if}
  </div>
{/if}

<!-- eslint-enable @typescript-eslint/no-confusing-void-expression -->

<style>
  /* The page reads as one column at `.page-sub`'s own measure. */
  .col {
    max-width: 70ch;
  }

  .hint {
    margin: 10px 0 0;
    font-size: 13px;
    color: var(--muted);
  }

  .hint.lead {
    margin: 0 0 12px;
  }

  .row-btns {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .who {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    overflow-wrap: anywhere;
  }

  .who b {
    font-size: var(--step-0);
    font-weight: 650;
  }

  .via {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--muted);
  }

  .via svg {
    width: 15px;
    height: 15px;
    flex: none;
  }

  .ids {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .ids li {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }

  .ids li:first-child {
    border-top: 0;
    padding-top: 2px;
  }

  .pv {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex: 1 1 200px;
  }

  .pv svg {
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

  /* A long address wraps; it is never cut short. */
  .pv small {
    font-size: 12.5px;
    color: var(--muted2);
    overflow-wrap: anywhere;
  }

  /* The danger button's own text colour. */
  .err {
    flex-basis: 100%;
    margin: 0;
    font-size: 13px;
    color: #f0a49d;
  }

  .confirm {
    margin-top: 12px;
    display: grid;
    gap: 10px;
  }

  .confirm label {
    font-size: 14px;
  }

  .grow {
    flex: 1 1 170px;
    min-width: 0;
  }
</style>
