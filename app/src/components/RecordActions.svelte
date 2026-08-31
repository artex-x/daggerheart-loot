<script lang="ts">
  /* Everything a person does with one record: copy the name, the text, the
     picture or the link, and hand it to the share sheet.

     It takes the record and the index rather than reading them off `app`, so
     every handler here is reached with both in hand. The version that lived on
     the page had a `if (!it) return` at the top of each one - four branches
     nothing could take, guarding against a state in which the buttons are not
     drawn at all. */
  import Button from './Button.svelte';
  import { artSrc } from '../lib/desc.js';
  import { share, shareName } from '../lib/share.js';
  import type { AppState } from '../state/app.svelte.js';
  import type { Index } from '../lib/data.js';
  import type { Record_ } from '../lib/types.js';

  interface Props {
    app: AppState;
    index: Index;
    it: Record_;
    /** Says what happened. The live region belongs to the page, not here. */
    say: (msg: string) => void;
  }

  const { app, index, it, say }: Props = $props();

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

<div class="actions">
  <Button onclick={() => void copyName()}>{t.copyName}</Button>
  <Button onclick={() => void copyText()}>{t.copyText}</Button>
  <Button onclick={() => void copyImage()}>{t.copyImg}</Button>
  <Button onclick={() => void copyLink()}>{t.copyLink}</Button>
  <!-- Offered whether or not a share sheet exists, as the live app does. -->
  <Button onclick={() => void send()}>{t.sendAll}</Button>
</div>

<style>
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gap-sm);
  }
</style>
