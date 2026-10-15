<script lang="ts">
  /* The multi-line text box, TextInput's twin: the box of MarkupField. */
  import type { Lang } from '../lib/types.js';

  interface Props {
    value?: string;
    /** The element, for a caller that moves focus into it. */
    el?: HTMLTextAreaElement | undefined;
    id?: string;
    rows?: number;
    /** The field has a problem: `aria-invalid`. */
    invalid?: boolean;
    /** The id of the field's error line. */
    describedby?: string | undefined;
    /** The most the database keeps (docs/specs/FEATURES.md, "Consistency rules"). */
    maxlength?: number | undefined;
    oninput?: ((e: Event) => void) | undefined;
    readonly?: boolean;
    placeholder?: string | undefined;
    /** The language of the text, when it is not the page's. */
    lang?: Lang | undefined;
    onkeydown?: (e: KeyboardEvent) => void;
  }

  let {
    value = $bindable(''),
    el = $bindable(),
    id,
    rows = 3,
    invalid = false,
    describedby,
    maxlength,
    oninput,
    readonly = false,
    placeholder,
    lang,
    onkeydown
  }: Props = $props();
</script>

<textarea
  bind:value
  bind:this={el}
  {id}
  {rows}
  {lang}
  aria-invalid={invalid || undefined}
  aria-describedby={describedby}
  {maxlength}
  {readonly}
  {placeholder}
  {oninput}
  {onkeydown}></textarea>

<style>
  textarea {
    width: 100%;
    padding: 10px 14px;
    border-radius: var(--r-sm);
    background: var(--bg2);
    border: 1px solid var(--line2);
    color: var(--txt);
    font: inherit;
    resize: vertical;
  }

  textarea:focus {
    outline: none;
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgb(216 171 94 / 14%);
  }
</style>
