<script lang="ts">
  /* The file row of both imports: the chooser, and at its right end the file's schema and
     the page "With AI assistants" (docs/specs/FEATURES.md, "Lists" and "Homebrew"). Extracted
     on its second use. */
  import ImportFile from './ImportFile.svelte';
  import type { Dict } from '../lib/dict.js';
  import type { DataFile, FileRead } from '../lib/zip.js';

  interface Props {
    t: Dict;
    /** The data file a zip is read for. */
    name: DataFile;
    /** The schema of the file, root-absolute. */
    schema: string;
    /** `app.pagesDir`: the page of the language on screen. */
    pagesDir: string;
    onpick: () => void;
    onread: (r: FileRead) => void;
  }

  const { t, name, schema, pagesDir, onpick, onread }: Props = $props();
</script>

<div class="filerow">
  <ImportFile {t} {name} {onpick} {onread} />
  <span class="links">
    <a href={schema} target="_blank" rel="noopener">{t.importFormat}</a>
    <a href={pagesDir + 'ai.html'} target="_blank" rel="noopener">{t.importAi}</a>
  </span>
</div>

<style>
  /* The chooser's row: the two links at its right end, under it when it wraps. */
  .filerow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 14px;
  }

  .links {
    display: flex;
    gap: 14px;
    margin-left: auto;
    font-size: var(--t-data);
  }

  /* A text link reaches the thumb target by its padded box (DESIGN.md, "The Phone-First
     Rule"). */
  @media screen and (max-width: 600px) {
    .links a {
      padding-block: max(0px, calc((var(--thumb) - 1lh) / 2));
      margin-block: min(0px, calc((1lh - var(--thumb)) / 2));
    }
  }
</style>
