<script lang="ts" module>
  /** Which row of the card a button belongs to, as the live app splits them. */
  export type ActionRow = 'name' | 'card' | 'share' | 'menu';
</script>

<script lang="ts">
  /* Everything a person does with one record. A compact card draws two icon buttons
     beside the name - copy the name, copy the link - and a labeled row under the
     description: send, picture, text. The record page, the dialog and a roll result draw
     «Поделиться» on the action row and the four copies as items of its «Ещё» menu.

     One component renders every row, because the handlers are shared and
     splitting them would mean two copies of the clipboard logic.

     It takes the record and the index rather than reading them off `app`, so
     every handler is reached with both in hand. The version that lived on the
     page had a `if (!it) return` at the top of each one - four branches nothing
     could take, guarding against a state in which the buttons are not drawn. */
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import { artSrc } from '../lib/desc.js';
  import { isHomebrewKey } from '../lib/homebrew.js';
  import { imageFileName, share, shareName, type ShareBlock } from '../lib/share.js';
  import type { AppState } from '../state/app.svelte.js';
  import type { Index } from '../lib/data.js';
  import type { IconName } from '../lib/icons.js';
  import type { Record_ } from '../lib/types.js';

  interface Props {
    app: AppState;
    index: Index;
    it: Record_;
    row: ActionRow;
    /** The live `contextNote` (`git show 23c00a6^:app.js`): while a list is open, copying
     *  one of its entries appends the players' note it carries there. Passed
     *  in rather than looked up here - this component does not know what a
     *  list is. */
    extra?: readonly ShareBlock[] | undefined;
    /** Row `menu`: called first in each item, so the menu closes and the focus returns
     *  before the clipboard call. */
    onpicked?: (() => void) | undefined;
    /** Row `share`: `sm` on a roll result's row. */
    size?: 'md' | 'sm';
  }

  const { app, index, it, row, extra, onpicked, size = 'md' }: Props = $props();

  const t = $derived(app.t);
  /* A homebrew item's link is its preview link (its `#/h/` address in a build with no
     preview host), which opens for everyone; one with no id (a lists file's copy) offers
     none (docs/specs/FEATURES.md, "Records"). */
  const linked = $derived(
    !isHomebrewKey(it.id) || typeof (it as { hid?: unknown }).hid === 'string'
  );

  const hasImage = $derived(!!it.img && !app.artBroken(it.id));

  async function copyName(): Promise<void> {
    await app.copied(
      () => app.env.clipboard.writeText(shareName(it, app.lang)),
      (t) => t.nameCopied
    );
  }

  async function copyText(): Promise<void> {
    const { text, html } = share(it, index, app.lang, { extra });
    await app.copied(
      () => app.env.clipboard.writeRich({ html, plain: text }),
      (t) => t.textCopied
    );
  }

  /**
   * Three levels, not two. `pngOf` rejecting at all (a tainted
   * canvas under `file://`, or any other draw failure) means no picture can
   * ever leave the canvas - falling back to the clipboard's generic
   * `copyFailed` would be reporting a dead end as though it might work next
   * time, so this falls back to the text instead, with its own `imgTainted`
   * wording. Once a blob exists, a clipboard that still refuses it (no
   * `ClipboardItem`, a permission refusal) gets the live app's other
   * fallback: a download, `imgSaved`/`imgFailed` rather than `copyFailed`.
   *
   * `pngOf`'s promise reaches `writeImage` unawaited, same as `clipboard.ts`'s
   * own `writeImage`->`ClipboardItem` handoff and for the same reason -
   * awaiting anything before touching the clipboard drops the user gesture on
   * Safari. `writeImage` already turns a rejected `png()` into `copied ===
   * false`, so awaiting the same promise afterwards is what tells "tainted"
   * (the canvas itself failed) apart from "refused" (a real blob existed and
   * the clipboard declined it) - not a second attempt.
   */
  async function copyImage(): Promise<void> {
    const src = artSrc(it.img, app.artBroken(it.id));
    if (!src) return;
    const png = app.env.image.pngOf(src);
    const copied = await app.env.clipboard.writeImage(() => png);
    if (copied) {
      app.say((t) => t.imgCopied);
      return;
    }
    let blob: Blob;
    try {
      blob = await png;
    } catch (err) {
      /* `imgTainted` is deliberately the one wording for every `pngOf`
         rejection (see the doc comment above) - but `image.ts` already builds
         a distinct `Error` message per cause (tainted canvas, the picture
         failing to load, the encode watchdog firing), so naming which one it
         was costs nothing and is worth keeping for whoever debugs a report
         of this firing. */
      console.warn('copyImage: pngOf rejected, falling back to text', err);
      const { text, html } = share(it, index, app.lang, { extra });
      await app.copied(
        () => app.env.clipboard.writeRich({ html, plain: text }),
        (t) => t.imgTainted
      );
      return;
    }
    try {
      await app.env.image.download(blob, imageFileName(it, app.lang));
      app.say((t) => t.imgSaved);
    } catch {
      app.say((t) => t.imgFailed, { error: true });
    }
  }

  /* The link's version hashes the record, so it is made at the press, not at every draw
     (a 32 KB record measured 5.6 ms on this host). */
  async function copyLink(): Promise<void> {
    const link = app.linkToRecord(it);
    await app.copied(
      () => app.env.clipboard.writeText(link),
      (t) => t.linkCopied
    );
  }

  /**
   * The same three-level payload the live `sendItem` builds - the full
   * share text always, a picture attached where there is art and the
   * environment can take a file (`SharePort` itself decides that with
   * `canShare`; this only ever offers one when there is a picture to offer).
   */
  async function send(): Promise<void> {
    const link = linked ? app.linkToRecord(it) : undefined;
    const name = shareName(it, app.lang);
    const { text } = share(it, index, app.lang, { extra });
    const hasArt = it.img && !app.artBroken(it.id);
    const src = hasArt ? artSrc(it.img) : null;
    const file = src
      ? async (): Promise<File> => {
          const blob = await app.env.image.pngOf(src);
          return new File([blob], imageFileName(it, app.lang), { type: 'image/png' });
        }
      : undefined;
    const r = await app.env.share.share({
      title: name,
      text,
      ...(link === undefined ? {} : { url: link }),
      ...(file ? { file } : {})
    });
    /* A dismissal is somebody changing their mind, not a failure, and saying
       anything about it would be nagging. Where there is no share sheet at all
       the link goes to the clipboard instead, which is what they reached for;
       an item with no link sends its text there. */
    if (r === 'unsupported' || r === 'failed') await (linked ? copyLink() : copyText());
  }

  interface MenuItem {
    icon: IconName;
    label: string;
    run: () => Promise<void>;
  }

  const menuItems = $derived<MenuItem[]>([
    { icon: 'copy', label: t.copyText, run: copyText },
    { icon: 'copy', label: t.copyName, run: copyName },
    ...(hasImage ? [{ icon: 'image' as const, label: t.copyImg, run: copyImage }] : []),
    ...(linked ? [{ icon: 'link' as const, label: t.copyLink, run: copyLink }] : [])
  ]);
</script>

{#if row === 'share'}
  <Button {size} onclick={() => void send()}><Icon name="share" />{t.share}</Button>
{:else if row === 'menu'}
  {#each menuItems as m (m.label)}
    <button
      type="button"
      role="menuitem"
      tabindex="-1"
      onclick={() => {
        onpicked?.();
        void m.run();
      }}><Icon name={m.icon} />{m.label}</button
    >
  {/each}
{:else if row === 'name'}
  <button
    type="button"
    class="iconbtn"
    title={t.copyName}
    aria-label={t.copyName}
    onclick={() => void copyName()}
  >
    <Icon name="copy" />
  </button>
  {#if linked}
    <button
      type="button"
      class="iconbtn"
      title={t.copyLink}
      aria-label={t.copyLink}
      onclick={() => void copyLink()}
    >
      <Icon name="link" />
    </button>
  {/if}
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
  {#if hasImage}
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
  .iconbtn {
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

  .iconbtn:hover {
    color: var(--gold);
    background: var(--surface2);
  }

  /* Bare icon buttons came out at about 20px, too small to hit reliably on a
     phone - off the mobile block in style.css. */
  @media (max-width: 600px) {
    .iconbtn {
      padding: 11px;
      margin-bottom: 2px;
    }
  }
</style>
