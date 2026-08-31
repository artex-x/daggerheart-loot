<script lang="ts">
  /* The page at #/i/<id>: one record, and the four things a person does with
     one - copy the name, copy the whole text, copy the link, share it.
     Every one of those goes through a port, so all of it is exercised in a
     test rather than only in a browser. */
  import Button from './Button.svelte';
  import RecordCard from './RecordCard.svelte';
  import { share, shareName } from '../lib/share.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    id: string;
  }

  const { app, id }: Props = $props();

  const t = $derived(app.t);
  const it = $derived(app.index?.byId.get(id));

  /* What the last action did. A live region rather than a toast: it has to be
     announced, and a message that only appears is a message a screen reader
     misses. */
  let said = $state('');

  const say = (msg: string): void => {
    said = msg;
  };

  async function copyName(): Promise<void> {
    if (!it) return;
    const ok = await app.env.clipboard.writeText(shareName(it, app.lang));
    say(ok ? t.nameCopied : t.copyFailed);
  }

  async function copyText(): Promise<void> {
    if (!it || !app.index) return;
    const { text, html } = share(it, app.index, app.lang);
    const ok = await app.env.clipboard.writeRich({ html, plain: text });
    say(ok ? t.textCopied : t.copyFailed);
  }

  async function copyLink(): Promise<void> {
    const ok = await app.env.clipboard.writeText(app.linkToRecord(id));
    say(ok ? t.linkCopied : t.copyFailed);
  }

  async function sendIt(): Promise<void> {
    if (!it) return;
    const name = shareName(it, app.lang);
    const r = await app.env.share.share({
      title: name,
      text: name,
      url: app.linkToRecord(id)
    });
    /* A dismissal is somebody changing their mind, not a failure, and saying
       anything about it would be nagging. Where there is no share sheet at all
       the link goes to the clipboard instead, which is what the person was
       reaching for. */
    if (r === 'unsupported' || r === 'failed') await copyLink();
  }
</script>

{#if !app.index}
  <p class="miss">{t.noData}</p>
{:else if !it}
  <!-- A link to a record that is no longer in the data: an old share, or an id
       that was renumbered. Saying which is kinder than an empty page. -->
  <h1>{t.notFound}</h1>
  <p class="miss">{t.notFoundSub}</p>
{:else}
  <RecordCard
    {it}
    index={app.index}
    lang={app.lang}
    artBroken={app.artBroken(it.id)}
    onartfail={(bad: string) => {
      app.markArtBroken(bad);
    }}
  >
    {#snippet actions()}
      <Button onclick={() => void copyName()}>{t.copyName}</Button>
      <Button onclick={() => void copyText()}>{t.copyText}</Button>
      <Button onclick={() => void copyLink()}>{t.copyLink}</Button>
      {#if app.env.share.available()}
        <Button onclick={() => void sendIt()}>{t.sendAll}</Button>
      {/if}
    {/snippet}
  </RecordCard>
{/if}

<!-- Present from the start and empty: a live region has to be in the page
     before its text changes, or the change is not announced. -->
<p class="said" role="status" aria-live="polite">{said}</p>

<style>
  h1 {
    margin: 0 0 var(--gap);
    font: 800 var(--step-2) / 1.2 var(--ui);
  }

  .miss {
    margin: 0;
    color: var(--muted);
  }

  .said {
    margin: var(--gap) 0 0;
    min-height: 1.2em;
    color: var(--muted);
    font-size: var(--step--1);
  }
</style>
