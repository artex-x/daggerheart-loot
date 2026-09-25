<script lang="ts">
  /* The sign-in prompt, in the slot of a control that needs an account: one
     line and one «Войти» that opens `#/account`, where the providers are
     listed (docs/DECISIONS.md, 2026-09-25, "A sign-in prompt opens the
     account page ..."). `compact` is the add-to-list menu's form, `boxed` the
     shared page's, under its button. */
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
    /** The compact form's «Отмена», back to the control it replaced. */
    oncancel?: (() => void) | undefined;
  }

  const { app, lead, after, compact = false, boxed = false, oncancel }: Props = $props();

  const t = $derived(app.t);
</script>

<div class="signin" class:compact class:boxed>
  <p class="signin-lead">{lead}</p>
  <div class="signin-acts">
    <Button
      variant="primary"
      size={compact || boxed ? 'sm' : 'md'}
      onclick={() => {
        app.askSignIn(after);
      }}>{t.signIn}</Button
    >
    {#if compact && oncancel}
      <Button size="sm" variant="ghost" onclick={oncancel}>{t.cancel}</Button>
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
    font-size: 13.5px;
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
    font-size: 13px;
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
