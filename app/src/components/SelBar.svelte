<script lang="ts">
  /* The selection bar - ticking any row on a table raises it at the bottom of
     the window: a count with a cross that clears everything, and three
     actions on the right. Reproduced from `renderSelBar` (app.js 3706-3721)
     and `#selBar` in index.html, right after `</footer>` and before the
     modal - `Shell.svelte` keeps that order.

     `{#if n}` is the honest equivalent of the live app's `hidden` plus an
     emptied `innerHTML`: it unmounts the bar's own `AddToList` and its
     document click listener when nothing is ticked, rather than leaving them
     idle for no reason. */
  import AddToList from './AddToList.svelte';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import { printHash } from '../lib/hash.js';
  import { shareSelection } from '../lib/share.js';
  import type { AppState } from '../state/app.svelte.js';
  import type { Record_ } from '../lib/types.js';

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  const t = $derived(app.t);
  const n = $derived(app.sel.size);
  /* Tick order, not insertion into a Set by value - `Object.keys(S.sel)` in
     app.js keeps an existing key's position on select-all, which `SvelteSet`
     already matches. */
  const ids = $derived<string[]>([...app.sel]);

  async function copySel(): Promise<void> {
    const index = app.index;
    if (!index) return;
    const items = ids.map((id) => index.byId.get(id)).filter((it): it is Record_ => !!it);
    if (!items.length) return;
    const { text, html } = shareSelection(items, index, app.lang);
    const ok = await app.env.clipboard.writeRich({ html, plain: text });
    app.say(ok ? t.selCopied : t.copyFailed, { error: !ok });
  }
</script>

{#if n}
  <div class="selbarwrap">
    <div class="selbar">
      <span class="selcount"
        >{t.selected + ' ' + String(n)}<button
          type="button"
          class="selx"
          title={t.clearSel}
          aria-label={t.clearSel}
          onclick={() => {
            app.clearSel();
          }}>&times;</button
        ></span
      >
      <div class="selacts">
        <AddToList {app} key="sel" {ids} primary />
        <Button size="sm" href={printHash(ids)} sameTab title={t.printHint}
          ><Icon name="print" />{t.print}</Button
        >
        <Button size="sm" onclick={() => void copySel()}><Icon name="copy" />{t.copySel}</Button
        >
      </div>
    </div>
  </div>
{/if}

<style>
  /* off `.selbarwrap` in style.css - declared twice, at line 54 (the safe-area
     padding, which applies everywhere the bar can appear) and at 799 (the
     sticky block, above the sticky topbar so the menu can open upward and
     never slide under it, the gradient, the gold top border and the blur).
     Both are merged into the one rule here. */
  .selbarwrap {
    padding-bottom: env(safe-area-inset-bottom);
    position: sticky;
    bottom: 0;
    z-index: 45;
    background: linear-gradient(180deg, rgb(20 17 30 / 86%), rgb(16 14 24 / 98%));
    border-top: 1px solid rgb(216 171 94 / 35%);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  /* off `.selbar` plus `.wrap` (style.css 52-53) - the rewrite has no global
     `.wrap` class; every frame element composes the same four properties off
     `--wrap` instead, as `Shell.svelte`'s `.foot` and `TabBar` already do. */
  .selbar {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    padding: 10px 0;
    width: var(--wrap);
    margin-inline: auto;
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }

  .selcount {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font: 650 13.5px/1 inherit;
    color: var(--gold-soft);
    white-space: nowrap;
  }

  .selx {
    width: 26px;
    height: 26px;
    flex: none;
    border-radius: 7px;
    border: 1px solid rgb(216 171 94 / 35%);
    background: transparent;
    color: var(--gold-soft);
    font-size: 17px;
    line-height: 1;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: 0.15s;
  }

  .selx:hover {
    background: rgb(216 171 94 / 16%);
    border-color: var(--gold);
  }

  .selacts {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-left: auto;
  }

  @media (max-width: 600px) {
    .selx {
      width: 32px;
      height: 32px;
    }

    .selacts {
      width: 100%;
      margin-left: 0;
    }

    .selacts :global(.seldrop) {
      flex: 1 1 100%;
    }

    .selacts :global(.btn) {
      flex: 1 1 0;
      min-width: 0;
      width: 100%;
      justify-content: center;
      overflow: hidden;
    }
  }
</style>
