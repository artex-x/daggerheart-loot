<script lang="ts">
  /* The sign-in prompt: one line and one «Войти» that opens `#/account`, where the
     providers are listed (docs/DECISIONS.md, 2026-09-25, "A sign-in prompt opens the
     account page ..."). The default form is the page plate with the kind glyph, for a
     signed-out page that needs an account. `compact` is the add-to-list menu's form,
     `boxed` the form under a pressed button. A prompt with «Отмена» answers a press: it takes
     the focus to «Войти», and «Отмена» returns it to what had it (rule 20). */
  import { untrack } from 'svelte';
  import Button from './Button.svelte';
  import Empty from './Empty.svelte';
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

{#snippet body()}
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
{/snippet}

<!-- eslint-disable @typescript-eslint/no-confusing-void-expression --
     a `{@render}` tag reads as a void expression to this rule. -->
{#if compact || boxed}
  <div class="signin" class:compact class:boxed>
    {@render body()}
  </div>
{:else}
  <Empty glyph="kindItem">
    <div class="signin page">
      {@render body()}
    </div>
  </Empty>
{/if}

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
    /* The button follows the text, not the cap (DESIGN.md, "The Measure Rule"). */
    max-width: var(--measure-line);
    flex: 0 1 auto;
    text-wrap: balance;
  }

  .signin-acts {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  /* The page plate centers its text, so «Войти» centers too when it wraps under the lead. */
  .signin.page {
    width: 100%;
    justify-content: center;
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
