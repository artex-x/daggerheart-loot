<script lang="ts">
  /* The box of a formatted text field (docs/specs/FEATURES.md, "Consistency rules",
     rule 18): the formatting toolbar, the text box, and, with `preview`, «Просмотр», which
     draws the text in place of the box. The caller draws the caption, the «?» and the
     error line (FormField, or a list note's label row). A read-only box keeps
     «Просмотр» and draws no format buttons.

     A toolbar edit goes through `execCommand('insertText')`, so the browser's own undo
     takes it back; where that is missing, `setRangeText` and one `input` event. An edit
     past the cap does nothing and says so under the box until the text changes. */
  import { tick } from 'svelte';
  import Icon from './Icon.svelte';
  import Markup from './Markup.svelte';
  import TextArea from './TextArea.svelte';
  import type { Dict } from '../lib/dict.js';
  import type { IconName } from '../lib/icons.js';
  import { parseMarkup } from '../lib/markup.js';
  import {
    fits,
    insertTable,
    toggleList,
    toggleMark,
    type MarkupEdit,
    type MarkupTool
  } from '../lib/markupEdit.js';
  import type { Lang } from '../lib/types.js';

  interface Props {
    value?: string;
    /** The text box, for a caller that moves focus into it. */
    el?: HTMLTextAreaElement | undefined;
    id: string;
    rows?: number;
    maxlength?: number | undefined;
    invalid?: boolean;
    describedby?: string | undefined;
    oninput?: ((e: Event) => void) | undefined;
    readonly?: boolean;
    /** An example of the text, shown while the box is empty. */
    placeholder?: string | undefined;
    /** The field's caption: the toolbar is «Оформление: <label>», the pane «Просмотр: <label>». */
    label: string;
    tools: readonly MarkupTool[];
    /** Draws «Просмотр»: only where no rendered view sits beside the field. */
    preview?: boolean;
    /** The pane is shown; a caller sets it false before it focuses the box. */
    previewing?: boolean;
    t: Dict;
    /** The language of the text in the box and the pane. */
    textLang?: Lang | undefined;
  }

  let {
    value = $bindable(''),
    el = $bindable(),
    id,
    rows = 5,
    maxlength,
    invalid = false,
    describedby,
    oninput,
    readonly = false,
    placeholder,
    label,
    tools,
    preview = false,
    previewing = $bindable(false),
    t,
    textLang
  }: Props = $props();

  const BUTTONS: Record<
    MarkupTool,
    { icon: IconName; name: (t: Dict) => string; keys?: string }
  > = {
    bold: { icon: 'bold', name: (t) => t.mdBold, keys: 'Control+B Meta+B' },
    italic: { icon: 'italic', name: (t) => t.mdItalic, keys: 'Control+I Meta+I' },
    ul: { icon: 'listBullet', name: (t) => t.mdList },
    ol: { icon: 'listNumber', name: (t) => t.mdNumbered },
    table: { icon: 'table', name: (t) => t.mdTable }
  };

  let bar = $state<HTMLDivElement | undefined>(undefined);
  /* The toolbar's one tab stop, by the button's place in the row. */
  let stop = $state(0);
  /* The selection and the box's height when «Просмотр» was pressed. */
  let held: [number, number] = [0, 0];
  let paneHeight = $state(0);
  /* The last toolbar edit did not fit under the cap; the next change of the text clears it. */
  let capped = $state(false);
  $effect(() => {
    void value;
    capped = false;
  });

  const shown: readonly MarkupTool[] = $derived(readonly ? [] : tools);
  const count = $derived(shown.length + (preview ? 1 : 0));
  /* While the pane shows, the format buttons are disabled and «Просмотр» holds the stop. */
  const current = $derived(previewing ? count - 1 : Math.min(stop, count - 1));
  const blocks = $derived(parseMarkup(value));
  const blank = $derived(value.trim() === '');

  function editOf(tool: MarkupTool, box: HTMLTextAreaElement): MarkupEdit | null {
    const s = box.selectionStart;
    const e = box.selectionEnd;
    if (tool === 'bold') return toggleMark(value, s, e, '**');
    if (tool === 'italic') return toggleMark(value, s, e, '*');
    if (tool === 'table') {
      const head = t.mdTableHead;
      return insertTable(value, s, e, [head.replace('%n', '1'), head.replace('%n', '2')]);
    }
    return toggleList(value, s, e, tool);
  }

  function run(tool: MarkupTool): void {
    const box = el;
    if (!box || previewing || readonly) return;
    const edit = editOf(tool, box);
    if (!edit) return;
    if (maxlength !== undefined && !fits(value, edit, maxlength)) {
      capped = true;
      return;
    }
    box.focus();
    box.setSelectionRange(edit.from, edit.to);
    /* eslint-disable @typescript-eslint/no-deprecated -- `execCommand` is deprecated, but it
       is the one way into the browser's undo stack. */
    const done =
      typeof document.execCommand === 'function' &&
      (edit.text
        ? document.execCommand('insertText', false, edit.text)
        : document.execCommand('delete'));
    /* eslint-enable @typescript-eslint/no-deprecated */
    if (!done) {
      box.setRangeText(edit.text, edit.from, edit.to, 'end');
      box.dispatchEvent(new Event('input', { bubbles: true }));
    }
    box.setSelectionRange(edit.sel[0], edit.sel[1]);
  }

  function onboxkey(e: KeyboardEvent): void {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
    const key = e.key.toLowerCase();
    const tool = key === 'b' ? 'bold' : key === 'i' ? 'italic' : null;
    if (!tool || !shown.includes(tool)) return;
    e.preventDefault();
    run(tool);
  }

  function onbarkey(e: KeyboardEvent): void {
    const buttons = [...(bar?.querySelectorAll('button') ?? [])].filter((b) => !b.disabled);
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (at === -1 || !buttons.length) return;
    let next: number;
    if (e.key === 'ArrowRight') next = (at + 1) % buttons.length;
    else if (e.key === 'ArrowLeft') next = (at - 1 + buttons.length) % buttons.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = buttons.length - 1;
    else return;
    e.preventDefault();
    const target = buttons[next];
    target?.focus();
    stop = target ? Number(target.dataset['at']) : stop;
  }

  async function toggle(): Promise<void> {
    if (!previewing) {
      held = [el?.selectionStart ?? 0, el?.selectionEnd ?? 0];
      paneHeight = el?.offsetHeight ?? 0;
      previewing = true;
      return;
    }
    previewing = false;
    await tick();
    el?.focus();
    el?.setSelectionRange(held[0], held[1]);
  }
</script>

<div class="mfield">
  {#if count}
    <div
      class="tools"
      role="toolbar"
      aria-label={t.mdTools.replace('%s', label)}
      tabindex="-1"
      bind:this={bar}
      onkeydown={onbarkey}
    >
      {#each shown as tool, i (tool)}
        <button
          type="button"
          class="tool"
          data-at={i}
          tabindex={i === current ? 0 : -1}
          aria-label={BUTTONS[tool].name(t)}
          aria-keyshortcuts={BUTTONS[tool].keys}
          disabled={previewing}
          onfocus={() => {
            stop = i;
          }}
          onclick={() => {
            run(tool);
          }}><Icon name={BUTTONS[tool].icon} /></button
        >
      {/each}
      {#if preview}
        <button
          type="button"
          class="tool text"
          data-at={shown.length}
          tabindex={current === shown.length ? 0 : -1}
          aria-pressed={previewing}
          onfocus={() => {
            stop = shown.length;
          }}
          onclick={() => void toggle()}>{t.mdPreview}</button
        >
      {/if}
    </div>
  {/if}
  <div class="box" hidden={previewing}>
    <TextArea
      bind:value
      bind:el
      {id}
      {rows}
      {maxlength}
      {invalid}
      {describedby}
      {oninput}
      {readonly}
      {placeholder}
      lang={textLang}
      onkeydown={onboxkey}
    />
  </div>
  {#if capped && maxlength !== undefined}
    <p class="capped" role="alert">{t.mdCapped.replace('%n', String(maxlength))}</p>
  {/if}
  {#if previewing}
    <div
      class="pane mdtext"
      role="region"
      aria-label={t.mdPreviewOf.replace('%s', label)}
      lang={blank ? undefined : textLang}
      style:min-height={paneHeight ? `${String(paneHeight)}px` : undefined}
    >
      {#if blank}
        <p class="empty">{t.mdPreviewEmpty}</p>
      {:else}
        <Markup {blocks} />
      {/if}
    </div>
  {/if}
</div>

<style>
  .mfield {
    display: grid;
    gap: var(--gap-sm);
    min-width: 0;
  }

  /* Above the label row's 44 px targets that reach over the toolbar's top edge. */
  .tools {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
  }

  .tool {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    height: 32px;
    padding: 0;
    border-radius: var(--r-sm);
    border: 1px solid var(--line2);
    background: var(--surface2);
    color: var(--txt);
    cursor: pointer;
  }

  .tool:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .tool.text {
    margin-left: auto;
    padding: 0 10px;
    font: 600 var(--t-data) var(--ui);
  }

  .tool[aria-pressed='true'] {
    border-color: var(--gold);
    color: var(--gold);
  }

  .tool:not(:disabled):hover {
    border-color: var(--muted2);
  }

  .box[hidden] {
    display: none;
  }

  /* A refusal: the danger text of rule 19. */
  .capped {
    margin: 0;
    font-size: var(--t-data);
    color: var(--danger-text);
  }

  /* The card's description look (RecordCard.svelte, `.card-desc`); the list and table
     rules are Markup.svelte's, under `mdtext`. */
  .pane {
    padding: 10px 14px;
    border: 1px dashed var(--line2);
    border-radius: var(--r-sm);
    background: var(--bg2);
    color: #cfc8e0;
    font-size: var(--t-small);
    line-height: 1.62;
    overflow-wrap: anywhere;
  }

  .pane .empty {
    color: var(--muted2);
  }
</style>
