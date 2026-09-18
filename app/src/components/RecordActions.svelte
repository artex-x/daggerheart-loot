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
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import { artSrc } from '../lib/desc.js';
  import { imageFileName, share, shareName, type ShareBlock } from '../lib/share.js';
  import type { AppState } from '../state/app.svelte.js';
  import type { Index } from '../lib/data.js';
  import type { Record_ } from '../lib/types.js';

  interface Props {
    app: AppState;
    index: Index;
    it: Record_;
    row: ActionRow;
    /** The live `contextNote` (app.js 568-573): while a list is open, copying
     *  one of its entries appends the players' note it carries there. Passed
     *  in rather than looked up here - this component does not know what a
     *  list is. */
    extra?: readonly ShareBlock[] | undefined;
  }

  const { app, index, it, row, extra }: Props = $props();

  const t = $derived(app.t);
  const link = $derived(app.linkToRecord(it.id));

  async function copyName(): Promise<void> {
    await app.copied(() => app.env.clipboard.writeText(shareName(it, app.lang)), t.nameCopied);
  }

  async function copyText(): Promise<void> {
    const { text, html } = share(it, index, app.lang, { extra });
    await app.copied(() => app.env.clipboard.writeRich({ html, plain: text }), t.textCopied);
  }

  /**
   * D10/D14/D15: three levels, not two. `pngOf` rejecting at all (a tainted
   * canvas under `file://`, or any other draw failure) means no picture can
   * ever leave the canvas - falling back to the clipboard's generic
   * `copyFailed` would be reporting a dead end as though it might work next
   * time, so this falls back to the text instead, with its own `imgTainted`
   * wording. Once a blob exists, a clipboard that still refuses it (no
   * `ClipboardItem`, a permission refusal) gets the live app's other
   * fallback: a download, `imgSaved`/`imgFailed` rather than `copyFailed`.
   */
  async function copyImage(): Promise<void> {
    const src = artSrc(it.img, app.artBroken(it.id));
    let blob: Blob;
    try {
      blob = await app.env.image.pngOf(src);
    } catch {
      const { text, html } = share(it, index, app.lang, { extra });
      await app.copied(() => app.env.clipboard.writeRich({ html, plain: text }), t.imgTainted);
      return;
    }
    const copied = await app.env.clipboard.writeImage(() => Promise.resolve(blob));
    if (copied) {
      app.say(t.imgCopied);
      return;
    }
    try {
      await app.env.image.download(blob, imageFileName(it, app.lang));
      app.say(t.imgSaved);
    } catch {
      app.say(t.imgFailed, { error: true });
    }
  }

  async function copyLink(): Promise<void> {
    await app.copied(() => app.env.clipboard.writeText(link), t.linkCopied);
  }

  /**
   * D22: the same three-level payload the live `sendItem` builds - the full
   * share text always, a picture attached where there is art and the
   * environment can take a file (`SharePort` itself decides that with
   * `canShare`; this only ever offers one when there is a picture to offer).
   */
  async function send(): Promise<void> {
    const name = shareName(it, app.lang);
    const { text } = share(it, index, app.lang, { extra });
    const hasArt = it.img && !app.artBroken(it.id);
    const file = hasArt
      ? async (): Promise<File> => {
          const blob = await app.env.image.pngOf(artSrc(it.img, false));
          return new File([blob], imageFileName(it, app.lang), { type: 'image/png' });
        }
      : undefined;
    const r = await app.env.share.share({
      title: name,
      text,
      url: link,
      ...(file ? { file } : {})
    });
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
  <Button
    variant="primary"
    size="sm"
    title={t.sendAll}
    label={t.sendAll}
    onclick={() => void send()}
  >
    <Icon name="share" /><span class="btn-lbl">{t.sendAll}</span>
  </Button>
  {#if it.img && !app.artBroken(it.id)}
    <!-- A record with no art has nothing to copy, so the live app leaves the
         button out rather than offering a placeholder - and it drops the
         button again once that art fails to load (app.js hasImage). -->
    <Button size="sm" title={t.copyImg} label={t.copyImg} onclick={() => void copyImage()}>
      <Icon name="image" /><span class="btn-lbl">{t.sImg}</span>
    </Button>
  {/if}
  <Button size="sm" title={t.copyText} label={t.copyText} onclick={() => void copyText()}>
    <Icon name="copy" /><span class="btn-lbl">{t.sText}</span>
  </Button>
{/if}

<style>
  /* The icon pair beside the name, off `.card-name button` in style.css. */
  button {
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

  button:hover {
    color: var(--gold);
    background: var(--surface2);
  }

  /* Bare icon buttons came out at about 20px, too small to hit reliably on a
     phone - off the mobile block in style.css. */
  @media (max-width: 600px) {
    button {
      padding: 11px;
      margin-bottom: 2px;
    }
  }
</style>
