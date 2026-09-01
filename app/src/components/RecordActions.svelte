<script lang="ts" module>
  /** Which row of the card a button belongs to, as the live app splits them. */
  export type ActionRow = 'name' | 'card';
</script>

<script lang="ts">
  /* Everything a person does with one record, in the two rows the live app
     puts them in: two icon buttons beside the name - copy the name, copy the
     link - and a labelled row under the description: send, picture, text.

     One component renders either row, because the handlers are shared and
     splitting them would mean two copies of the clipboard logic.

     It takes the record and the index rather than reading them off `app`, so
     every handler is reached with both in hand. The version that lived on the
     page had a `if (!it) return` at the top of each one - four branches nothing
     could take, guarding against a state in which the buttons are not drawn. */
  import Icon from './Icon.svelte';
  import { artSrc } from '../lib/desc.js';
  import { share, shareName } from '../lib/share.js';
  import type { AppState } from '../state/app.svelte.js';
  import type { Index } from '../lib/data.js';
  import type { Record_ } from '../lib/types.js';

  interface Props {
    app: AppState;
    index: Index;
    it: Record_;
    row: ActionRow;
    /** Says what happened. The live region belongs to the page, not here. */
    say: (msg: string) => void;
  }

  const { app, index, it, row, say }: Props = $props();

  const t = $derived(app.t);
  const link = $derived(app.linkToRecord(it.id));

  async function copyName(): Promise<void> {
    const ok = await app.env.clipboard.writeText(shareName(it, app.lang));
    say(ok ? t.nameCopied : t.copyFailed);
  }

  async function copyText(): Promise<void> {
    const { text, html } = share(it, index, app.lang);
    const ok = await app.env.clipboard.writeRich({ html, plain: text });
    say(ok ? t.textCopied : t.copyFailed);
  }

  async function copyImage(): Promise<void> {
    const src = artSrc(it.img, app.artBroken(it.id));
    const ok = await app.env.clipboard.writeImage(() => app.env.image.pngOf(src));
    say(ok ? t.imgCopied : t.copyFailed);
  }

  async function copyLink(): Promise<void> {
    const ok = await app.env.clipboard.writeText(link);
    say(ok ? t.linkCopied : t.copyFailed);
  }

  async function send(): Promise<void> {
    const name = shareName(it, app.lang);
    const r = await app.env.share.share({ title: name, text: name, url: link });
    /* A dismissal is somebody changing their mind, not a failure, and saying
       anything about it would be nagging. Where there is no share sheet at all
       the link goes to the clipboard instead, which is what they reached for. */
    if (r === 'unsupported' || r === 'failed') await copyLink();
  }
</script>

{#if row === 'name'}
  <button
    type="button"
    title={t.copyName}
    aria-label={t.copyName}
    onclick={() => void copyName()}
  >
    <Icon name="copy" />
  </button>
  <button
    type="button"
    title={t.copyLink}
    aria-label={t.copyLink}
    onclick={() => void copyLink()}
  >
    <Icon name="link" />
  </button>
{:else}
  <button
    type="button"
    class="btn sm primary"
    title={t.sendAll}
    aria-label={t.sendAll}
    onclick={() => void send()}
  >
    <Icon name="share" /><span class="btn-lbl">{t.sendAll}</span>
  </button>
  {#if it.img}
    <!-- A record with no art has nothing to copy, so the live app leaves the
         button out rather than offering a placeholder. -->
    <button
      type="button"
      class="btn sm"
      title={t.copyImg}
      aria-label={t.copyImg}
      onclick={() => void copyImage()}
    >
      <Icon name="image" /><span class="btn-lbl">{t.sImg}</span>
    </button>
  {/if}
  <button
    type="button"
    class="btn sm"
    title={t.copyText}
    aria-label={t.copyText}
    onclick={() => void copyText()}
  >
    <Icon name="copy" /><span class="btn-lbl">{t.sText}</span>
  </button>
{/if}

<style>
  /* The icon pair beside the name, off `.card-name button` in style.css. */
  button:not(.btn) {
    border: 0;
    background: transparent;
    padding: 3px;
    border-radius: 6px;
    color: var(--muted2);
    flex: none;
    line-height: 0;
    transition: 0.15s;
    cursor: pointer;
  }

  button:not(.btn):hover {
    color: var(--gold);
    background: var(--surface2);
  }

  /* The labelled row, off `.btn` and `.btn.sm`. */
  .btn {
    border: 1px solid var(--line2);
    background: var(--surface);
    color: var(--txt);
    padding: 0 11px;
    height: 32px;
    border-radius: 8px;
    font-size: 12.5px;
    font-weight: 600;
    transition: 0.15s;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    text-decoration: none;
    cursor: pointer;
  }

  .btn:hover {
    border-color: var(--gold);
    background: var(--surface2);
  }

  .btn.primary {
    background: linear-gradient(180deg, #e2b76c, var(--gold));
    border-color: #e8c27c;
    color: #1a1206;
    font-weight: 700;
  }

  .btn.primary:hover {
    filter: brightness(1.07);
  }
</style>
