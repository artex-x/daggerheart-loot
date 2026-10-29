<script lang="ts">
  /* «Обрезать картинку» (m41): the square crop of a chosen file. It decodes the file itself
     and closes the decoded picture when it goes, so no bitmap outlives it; a drag, the
     arrow keys and «Масштаб» move and zoom the square; «Готово» encodes the 640 px and the
     160 px file of the same square. It loads as a lazy chunk from ArtField.svelte, and it
     sits inside the editor's form, so it stops its keys: the editor saves on Enter in an
     input and on Ctrl+S (docs/specs/FEATURES.md, "Homebrew"). */
  import { tick } from 'svelte';
  import Button from './Button.svelte';
  import LoadState from './LoadState.svelte';
  import {
    ART_SIDE_MAX,
    ART_SIDE_MIN,
    type CropRefusal,
    type PictureSource
  } from '../lib/art.js';
  import { cropRect, fitArt, ZOOM_MAX } from '../lib/artCrop.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    /** The chosen file; decoded here only. */
    file: Blob;
    /** «Отмена», Escape or the backdrop: nothing changes. */
    onclose: () => void;
    ondone: (art: { full: Blob; thumb: Blob; ext: 'webp' | 'jpg' }) => void;
    onrefuse: (reason: CropRefusal) => void;
  }

  const { app, file, onclose, ondone, onrefuse }: Props = $props();

  const t = $derived(app.t);
  const media = $derived(app.env.media);

  /* The frame's inset in the stage, so the square shows the picture around it (m41). */
  const INSET = 0.06;
  const STEP = 0.02;
  const STEP_BIG = 0.1;
  const ZOOM_STEP = 0.1;

  let dialog = $state<HTMLDialogElement | null>(null);
  let stage = $state<HTMLDivElement | undefined>(undefined);
  /* A backdrop press: a click whose press also started on the dialog element itself. */
  let pressedOutside = false;
  let image = $state.raw<PictureSource | null>(null);
  let url = $state<string | null>(null);
  let busy = $state(false);
  let zoom = $state(1);
  let cx = $state(0);
  let cy = $state(0);
  let drag: { x: number; y: number; cx: number; cy: number; scale: number } | null = null;
  /* Set once an answer went to the field: a late `close` event changes nothing then. */
  let answered = false;

  const rect = $derived(
    image ? cropRect(image.width, image.height, zoom, cx, cy) : { x: 0, y: 0, side: 1 }
  );
  /* The picture in the stage's percent: the square fills the frame inside the inset. */
  const place = $derived.by(() => {
    if (!image) return '';
    const k = (1 - 2 * INSET) / rect.side;
    const pct = (v: number): string => String(Math.round(v * 1e4) / 100) + '%';
    return (
      `width: ${pct(image.width * k)}; height: ${pct(image.height * k)}; ` +
      `left: ${pct(INSET - rect.x * k)}; top: ${pct(INSET - rect.y * k)}`
    );
  });

  function answer(run: () => void): void {
    if (answered) return;
    answered = true;
    run();
  }

  $effect(() => {
    if (!dialog) return;
    dialog.showModal();
    app.dialogOpen = true;
    return () => {
      app.dialogOpen = false;
    };
  });

  $effect(() => {
    let gone = false;
    const m = media;
    const preview = m.preview(file);
    url = preview;
    void m.decode(file).then((r) => {
      if (gone) {
        if (r.ok) r.image.close();
        return;
      }
      if (!r.ok) {
        answer(() => {
          onrefuse('bad');
        });
        return;
      }
      const { width, height } = r.image;
      image = r.image;
      if (Math.min(width, height) < ART_SIDE_MIN) {
        answer(() => {
          onrefuse('small');
        });
      } else if (Math.max(width, height) > ART_SIDE_MAX) {
        answer(() => {
          onrefuse('huge');
        });
      } else {
        cx = width / 2;
        cy = height / 2;
        /* The decoding state's «Отмена» held the focus and is gone now. */
        void tick().then(() => stage?.focus());
      }
    });
    return () => {
      gone = true;
      image?.close();
      image = null;
      m.release(preview);
    };
  });

  /* The centre stays where the clamped square puts it, so a move past an edge is not kept. */
  function moveTo(x: number, y: number, z = zoom): void {
    if (!image) return;
    zoom = Math.min(ZOOM_MAX, Math.max(1, Math.round(z * 100) / 100));
    const r = cropRect(image.width, image.height, zoom, x, y);
    cx = r.x + r.side / 2;
    cy = r.y + r.side / 2;
  }

  function onstagekey(e: KeyboardEvent): void {
    const step = rect.side * (e.shiftKey ? STEP_BIG : STEP);
    const moves: Partial<Record<string, [number, number]>> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step]
    };
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      moveTo(cx + move[0], cy + move[1]);
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      moveTo(cx, cy, zoom + ZOOM_STEP);
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      moveTo(cx, cy, zoom - ZOOM_STEP);
    }
  }

  function ondown(e: PointerEvent): void {
    if (!image || busy) return;
    const el = e.currentTarget as HTMLElement;
    const width = el.getBoundingClientRect().width;
    if (!width) return;
    e.preventDefault();
    /* jsdom has no pointer capture. */
    if ('setPointerCapture' in el) el.setPointerCapture(e.pointerId);
    /* Source pixels per screen pixel. */
    const scale = rect.side / (width * (1 - 2 * INSET));
    drag = { x: e.clientX, y: e.clientY, cx, cy, scale };
  }

  function onmove(e: PointerEvent): void {
    if (!drag) return;
    moveTo(
      drag.cx - (e.clientX - drag.x) * drag.scale,
      drag.cy - (e.clientY - drag.y) * drag.scale
    );
  }

  function onup(): void {
    drag = null;
  }

  async function done(): Promise<void> {
    const source = image;
    if (!source || busy) return;
    busy = true;
    const r = await fitArt(media, source, rect);
    busy = false;
    if (r.ok) {
      const { full, thumb, ext } = r;
      answer(() => {
        ondone({ full, thumb, ext });
      });
    } else {
      answer(() => {
        onrefuse('squeeze');
      });
    }
  }

  function cancel(): void {
    answer(onclose);
  }
</script>

<!-- The editor's window handler saves on Enter in a form input and on Ctrl+S; this dialog
     sits inside that form, so its keys stop here. Escape still closes it: closing is the
     browser's default action, which stopping the event leaves alone. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
  class="cropdlg"
  bind:this={dialog}
  aria-labelledby="hb-crop-title"
  onclose={cancel}
  onpointerdown={(e) => {
    pressedOutside = e.target === dialog;
  }}
  onclick={(e) => {
    if (e.target === dialog && pressedOutside) cancel();
    pressedOutside = false;
  }}
  onkeydown={(e) => {
    e.stopPropagation();
    /* The browser's own Ctrl+S would open its "Save page" dialog. */
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') e.preventDefault();
  }}
>
  <div class="box">
    <h2 id="hb-crop-title">{t.hbArtCrop}</h2>
    {#if image}
      <p class="hint" id="hb-crop-hint">{t.hbArtCropHint}</p>
      <!-- The stage takes the arrow keys and + and -: no native control moves a square in
         two directions, so the group itself holds the focus. -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div
        class="stage"
        bind:this={stage}
        role="group"
        tabindex="0"
        aria-label={t.hbArtStage}
        aria-describedby="hb-crop-hint"
        onkeydown={onstagekey}
        onpointerdown={ondown}
        onpointermove={onmove}
        onpointerup={onup}
        onpointercancel={onup}
      >
        {#if url}<img src={url} alt="" draggable="false" style={place} />{/if}
        <span class="sq" aria-hidden="true"></span>
      </div>
      <div class="zoom">
        <label for="hb-crop-zoom">{t.hbArtZoom}</label>
        <div class="range">
          <span aria-hidden="true">&minus;</span>
          <input
            id="hb-crop-zoom"
            type="range"
            min="1"
            max={ZOOM_MAX}
            step="0.05"
            value={zoom}
            disabled={busy}
            oninput={(e) => {
              moveTo(cx, cy, Number(e.currentTarget.value));
            }}
          />
          <span aria-hidden="true">+</span>
        </div>
      </div>
      {#if busy}
        <LoadState {t} failed={false} text="" onretry={() => {}} />
      {/if}
      <div class="acts">
        <Button variant="primary" disabled={busy} onclick={() => void done()}
          >{t.hbArtDone}</Button
        >
        <Button variant="ghost" disabled={busy} onclick={cancel}>{t.cancel}</Button>
      </div>
    {:else}
      <LoadState {t} failed={false} text="" onretry={() => {}} />
      <div class="acts">
        <Button variant="ghost" onclick={cancel}>{t.cancel}</Button>
      </div>
    {/if}
  </div>
</dialog>

<style>
  /* off m41's `.cropdlg` */
  .cropdlg {
    width: min(520px, calc(100% - 24px));
    max-width: none;
    max-height: 100dvh;
    overflow-y: auto;
    padding: 0;
    border: 1px solid var(--line2);
    border-radius: var(--r);
    background: var(--surface);
    color: var(--txt);
    box-shadow: var(--shadow);
  }

  /* The padding sits on the box, so the dialog element's own area is only the backdrop. */
  .box {
    padding: 16px;
  }

  .cropdlg::backdrop {
    background: rgb(6 4 12 / 78%);
  }

  h2 {
    margin: 0 0 6px;
    font-size: var(--t-title);
  }

  .hint {
    margin: 0;
    font-size: var(--t-data);
    color: var(--muted);
  }

  /* off m41's `.cropstage`: never wider than a landscape phone's height can show. */
  .stage {
    position: relative;
    width: min(100%, 70dvh);
    aspect-ratio: 1;
    margin: 10px auto;
    overflow: hidden;
    border-radius: var(--r-sm);
    background: var(--bg);
    touch-action: none;
    cursor: grab;
    user-select: none;
  }

  .stage:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
  }

  .stage img {
    position: absolute;
    max-width: none;
    pointer-events: none;
  }

  .sq {
    position: absolute;
    inset: 6%;
    border: 2px solid var(--gold);
    border-radius: 4px;
    box-shadow: 0 0 0 9999px rgb(7 6 11 / 62%);
    pointer-events: none;
  }

  .sq::before {
    content: '';
    position: absolute;
    inset: 33.3% 0;
    border-top: 1px solid rgb(255 255 255 / 22%);
    border-bottom: 1px solid rgb(255 255 255 / 22%);
  }

  .zoom {
    display: grid;
    gap: var(--gap-sm);
    margin-bottom: 12px;
  }

  .zoom label {
    font-size: var(--t-data);
    font-weight: 600;
    color: var(--muted);
  }

  .range {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .range input {
    flex: 1;
    min-width: 0;
    accent-color: var(--gold);
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gap-sm);
  }
</style>
