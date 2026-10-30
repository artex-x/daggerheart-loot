<script lang="ts">
  /* The signed-in header control's menu: the account page, the lists index,
     the own items and signing out (docs/specs/FEATURES.md, "Chrome"). The class is
     `acctmenu`, never `dropmenu`: the browser suite reads `.dropmenu` as the
     add-to-list menu. The box and its keys are `Menu.svelte`'s. */
  import { tick } from 'svelte';
  import Menu from './Menu.svelte';
  import { ACCOUNT_HASH, HOMEBREW_HASH, sectionHash } from '../lib/hash.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    /** The button that opens the menu: a click on it is its own, and Escape returns focus to it. */
    control: HTMLElement;
    onclose: () => void;
    /** Called once the sign-out answered and the page drew it: the caller moves focus
     *  (docs/specs/FEATURES.md, rule 20). */
    onsignedout?: (() => void) | undefined;
  }

  const { app, control, onclose, onsignedout }: Props = $props();

  const t = $derived(app.t);

  /* The menu unmounts on close, so the callback is read first; the account button keeps
     focus while the call runs. */
  function signOut(): void {
    const after = onsignedout;
    onclose();
    control.focus();
    void app.signOut('local').then(async (r) => {
      app.say(r.ok ? (t) => t.signedOut : (t) => t.accountFailed, { error: !r.ok });
      await tick();
      after?.();
    });
  }
</script>

<Menu {control} label={t.menuLabel} id="account-menu" {onclose} cls="acctmenu">
  <a role="menuitem" tabindex="-1" href={app.href(ACCOUNT_HASH)} onclick={onclose}
    >{t.account}</a
  >
  <a role="menuitem" tabindex="-1" href={app.href(sectionHash('lists'))} onclick={onclose}
    >{t.menuLists}</a
  >
  <a role="menuitem" tabindex="-1" href={app.href(HOMEBREW_HASH)} onclick={onclose}
    >{t.myItems}</a
  >
  <button type="button" role="menuitem" tabindex="-1" class="out" onclick={signOut}
    >{t.signOut}</button
  >
</Menu>

<style>
  .out {
    border-top: 1px solid var(--line);
    border-radius: 0 0 var(--r-sm) var(--r-sm);
    margin-top: 4px;
  }
</style>
