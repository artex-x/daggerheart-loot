<script lang="ts">
  /* The sign-in prompt, in the slot of a control that needs an account: one
     line and one «Войти» that opens `#/account`, where the providers are
     listed (docs/DECISIONS.md, 2026-09-25, "A sign-in prompt opens the
     account page ..."). `compact` is the add-to-list menu's form, `boxed` the
     form under a pressed button. A prompt with «Отмена» answers a press: it takes the
     focus to «Войти», and «Отмена» returns it to what had it (rule 20). */
  import { untrack } from 'svelte';
  import Button from './Button.svelte';
  import type { SignInAfter } from '../lib/pending.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    lead: string;
    /** The page the sign-in returns to, and the action it finishes there. */
    after: SignInAfter;
    compact?: boolean;
    boxed?: boolean;
    /** «Отмена», which closes the prompt. */
    oncancel?: (() => void) | undefined;
  }

  const { app, lead, after, compact = false, boxed = false, oncancel }: Props = $props();

  const t = $derived(app.t);
  let signInButton = $state<HTMLButtonElement | undefined>(undefined);
  let opener: HTMLElement | null = null;

  $effect(() => {
    const button = signInButton;
    if (!button) return;
    untrack(() => {
      if (!oncancel) return;
      opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      button.focus();
    });
  });

  function cancel(): void {
    oncancel?.();
    if (opener?.isConnected) opener.focus();
  }
</script>

<div class="signin" class:compact class:boxed>
  <p class="signin-lead">{lead}</p>
  <div class="signin-acts">
    <Button
      variant="primary"
      size={compact || boxed ? 'sm' : 'md'}
      bind:el={signInButton}
      onclick={() => {
        app.askSignIn(after);
      }}>{t.signIn}</Button
    >
    {#if oncancel}
      <Button size={compact || boxed ? 'sm' : 'md'} variant="ghost" onclick={cancel}
        >{t.cancel}</Button
      >
    {/if}
  </div>
</div>

<style>
  .signin {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .signin-lead {
    margin: 0;
    font-size: var(--t-small);
    color: var(--txt);
    max-width: 62ch;
    flex: 1 1 240px;
  }

  .signin-acts {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  /* Inside the add-to-list menu: the line above its buttons. */
  .signin.compact {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .signin.compact .signin-lead {
    font-size: var(--t-data);
    flex: none;
  }

  /* Under the shared page's «Сохранить себе»: the pressed button's panel. */
  .signin.boxed {
    border: 1px solid var(--line2);
    border-radius: var(--r-sm);
    padding: 12px 14px;
    background: var(--bg2);
    margin-bottom: 18px;
  }
</style>
