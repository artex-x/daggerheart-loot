<script lang="ts">
  /* «Картинка» in the homebrew editor (m40, m42): the 96 px square, a file to crop or
     another item's picture, «Обрезать заново» while the chosen file is held, «Убрать
     картинку». The field never decodes the file: the crop dialog does, and it loads as a
     lazy chunk on the first choice. Nothing uploads before «Сохранить»
     (docs/specs/FEATURES.md, "Homebrew"). */
  import { tick } from 'svelte';
  import Button from './Button.svelte';
  import FormField from './FormField.svelte';
  import ItemPicker from './ItemPicker.svelte';
  import LoadState from './LoadState.svelte';
  import type CropDialog from './CropDialog.svelte';
  import { ART_SOURCE_MAX, shownArt, type ArtValue, type CropRefusal } from '../lib/art.js';
  import { artSrc } from '../lib/desc.js';
  import { isHomebrewRecord } from '../lib/homebrew.js';
  import { recordOption, type PickOption } from '../lib/homebrewForm.js';
  import { hayFor, parseQuery, rankHits, statLineFor } from '../lib/search.js';
  import type { AppState } from '../state/app.svelte.js';
  import type { Homebrew } from '../state/homebrew.svelte.js';

  interface Props {
    app: AppState;
    store: Homebrew;
    /** The item's key: never offered as its own picture. */
    selfKey: string;
    /** The item's stored picture; null for none. */
    saved: string | null;
    value?: ArtValue;
    /** The save's refusal for the picture (`hbArtGone`). */
    line?: string | null;
  }

  let {
    app,
    store,
    selfKey,
    saved,
    value = $bindable({ kind: 'keep' }),
    line = null
  }: Props = $props();

  const t = $derived(app.t);
  const lang = $derived(app.lang);
  const media = $derived(app.env.media);
  const statLine = $derived(statLineFor(lang, t));
  const hay = $derived(hayFor(statLine));

  type CropView = typeof CropDialog;

  let input = $state<HTMLInputElement | undefined>(undefined);
  let first = $state<HTMLButtonElement | undefined>(undefined);
  /* The file of the shown crop, for «Обрезать заново»; the file the dialog is cropping. */
  let source = $state.raw<File | null>(null);
  let pending = $state.raw<File | null>(null);
  let cropView = $state<CropView | null>(null);
  let chunkFailed = $state(false);
  let refusal = $state<string | null>(null);
  let picking = $state(false);
  let broken = $state(false);

  const shown = $derived(shownArt(value, saved));
  const REFUSALS = $derived<Record<CropRefusal, string>>({
    bad: t.hbArtBad,
    small: t.hbArtSmall,
    huge: t.hbArtHuge,
    squeeze: t.hbArtSqueeze
  });

  $effect(() => {
    void shown;
    broken = false;
  });

  /* A cropped file's preview lives while the value holds it; any other value drops the
     held file. */
  $effect(() => {
    const v = value;
    if (v.kind !== 'file') {
      source = null;
      return;
    }
    const m = media;
    return () => {
      m.release(v.preview);
    };
  });

  function choose(): void {
    input?.click();
  }

  async function focusFirst(): Promise<void> {
    await tick();
    await tick();
    first?.focus();
  }

  async function openCrop(file: File): Promise<void> {
    refusal = null;
    pending = file;
    chunkFailed = false;
    if (cropView) return;
    const m = await import('./CropDialog.svelte').catch(() => null);
    if (m) cropView = m.default;
    else chunkFailed = true;
  }

  function onfile(e: Event & { currentTarget: HTMLInputElement }): void {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    picking = false;
    if (file.size > ART_SOURCE_MAX) {
      refusal = t.hbArtTooBig;
      return;
    }
    void openCrop(file);
  }

  function closed(): void {
    pending = null;
    void focusFirst();
  }

  function refused(reason: CropRefusal): void {
    refusal = REFUSALS[reason];
    closed();
  }

  function cropped(art: { full: Blob; thumb: Blob; ext: 'webp' | 'jpg' }): void {
    const file = pending;
    value = {
      kind: 'file',
      id: store.newIds().id.replace(/-/g, ''),
      ext: art.ext,
      full: art.full,
      thumb: art.thumb,
      preview: media.preview(art.full)
    };
    source = file;
    closed();
  }

  function find(q: string): PickOption[] {
    return rankHits(
      (app.index?.searchable ?? []).filter(
        (it) => !!it.img && it.id !== selfKey && (!isHomebrewRecord(it) || store.has(it.id))
      ),
      parseQuery(q),
      statLine,
      hay
    ).map((it) => recordOption(it, lang, t));
  }

  function picked(id: string): void {
    const img = app.index?.byId.get(id)?.img;
    if (!img) return;
    refusal = null;
    value = { kind: 'item', img };
    picking = false;
    void focusFirst();
  }

  async function togglePick(): Promise<void> {
    picking = !picking;
    if (!picking) return;
    await tick();
    document.getElementById('hb-art-pick')?.focus();
  }

  function remove(): void {
    refusal = null;
    value =
      value.kind !== 'keep' && value.kind !== 'remove' && saved === null
        ? { kind: 'keep' }
        : { kind: 'remove' };
    void focusFirst();
  }
</script>

<FormField label={t.hbArt}>
  <div class="artfield" role="group" aria-label={t.hbArt}>
    <span class="th">
      <img
        src={artSrc(shown ?? undefined, broken, 'thumb')}
        alt=""
        onerror={() => {
          broken = true;
        }}
      />
    </span>
    <div class="side">
      <div class="acts">
        {#if shown}
          <Button size="sm" bind:el={first} onclick={choose}>{t.hbArtReplace}</Button>
          {#if source}
            <Button
              size="sm"
              onclick={() => {
                if (source) void openCrop(source);
              }}>{t.hbArtRecrop}</Button
            >
          {/if}
          <Button size="sm" variant="danger" onclick={remove}>{t.hbArtRemove}</Button>
        {:else}
          <Button size="sm" bind:el={first} onclick={choose}>{t.hbArtChoose}</Button>
          <Button
            size="sm"
            expanded={picking}
            controls="hb-art-picker"
            onclick={() => void togglePick()}>{t.hbArtFromItems}</Button
          >
        {/if}
      </div>
      <input
        type="file"
        accept="image/*"
        id="hb-art-file"
        hidden
        bind:this={input}
        onchange={onfile}
      />
      <p class="hint">{t.hbArtLine}</p>
      {#if picking && !shown}
        <div id="hb-art-picker">
          <ItemPicker
            id="hb-art-pick"
            label={t.hbArtFromItemsLabel}
            chosen={[]}
            max={1}
            {find}
            placeholder={t.hbFindItem}
            {t}
            onpick={picked}
            onremove={() => {}}
          />
        </div>
      {/if}
      {#if pending && chunkFailed}
        <LoadState
          {t}
          failed
          text={t.hbArtChunkFailed}
          onretry={() => {
            if (pending) void openCrop(pending);
          }}
        />
      {:else if pending && !cropView}
        <LoadState {t} failed={false} text="" onretry={() => {}} />
      {/if}
      {#if refusal}
        <p class="err" role="alert">{refusal}</p>
      {/if}
      {#if line}
        <p class="err" role="alert">{line}</p>
      {/if}
    </div>
  </div>
</FormField>

{#if pending && cropView}
  {@const View = cropView}
  <View {app} file={pending} onclose={closed} onrefuse={refused} ondone={cropped} />
{/if}

<style>
  /* off m40's `.artfield` */
  .artfield {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 12px;
  }

  .th {
    flex: none;
    width: 96px;
    height: 96px;
    overflow: hidden;
    border: 1px solid var(--line2);
    border-radius: var(--r-sm);
    background: var(--bg);
  }

  .th img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .side {
    display: flex;
    flex: 1 1 180px;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gap-sm);
  }

  .hint,
  .err {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
  }

  .err {
    color: var(--danger-text);
  }
</style>
