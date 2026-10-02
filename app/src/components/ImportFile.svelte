<script lang="ts">
  /* The file field of both imports, «Импорт из файла» on `#/lists` and «Импорт предметов» on
     `#/homebrew`: «Выбрать файл...», the file's name, the hidden input, the 5 MiB check (a
     zip's data file included, the zip itself at most `ZIP_MAX_BYTES`), the read, a zip's
     own data file through `lib/zip.ts` (loaded only when a zip is chosen) and the strict
     UTF-8 decode. A file chosen while another is read wins. Extracted on its second use
     (docs/specs/FEATURES.md, "Lists" and "Homebrew"). */
  import Actions from './Actions.svelte';
  import Button from './Button.svelte';
  import { decodeText, FILE_MAX_BYTES, ZIP_MAX_BYTES } from '../lib/bundle.js';
  import type { Dict } from '../lib/dict.js';
  import type { DataFile, FileRead } from '../lib/zip.js';

  interface Props {
    t: Dict;
    /** The data file a zip is read for. */
    name: DataFile;
    /** A new file was chosen: the panel drops what it showed. */
    onpick: () => void;
    onread: (r: FileRead) => void;
  }

  const { t, name, onpick, onread }: Props = $props();

  let fileName = $state('');
  let input = $state<HTMLInputElement | undefined>(undefined);
  /* A file chosen while another is read wins: the older read is dropped. */
  let reading = 0;

  const ZIP_START = [0x50, 0x4b, 0x03, 0x04];
  const isZip = (bytes: Uint8Array): boolean => ZIP_START.every((b, i) => bytes[i] === b);

  async function choose(file: File): Promise<void> {
    const mine = ++reading;
    fileName = file.name;
    onpick();
    let bytes: Uint8Array;
    try {
      /* Only the signature is read before the bound: a file past it is never read whole. */
      const zip = isZip(new Uint8Array(await file.slice(0, 4).arrayBuffer()));
      if (file.size > (zip ? ZIP_MAX_BYTES : FILE_MAX_BYTES)) {
        if (mine === reading) onread({ ok: false, reason: zip ? 'zipTooBig' : 'tooBig' });
        return;
      }
      bytes = new Uint8Array(await file.arrayBuffer());
    } catch {
      if (mine === reading) onread({ ok: false, reason: 'failed' });
      return;
    }
    const r = await textOf(bytes);
    if (mine === reading) onread(r);
  }

  async function textOf(bytes: Uint8Array): Promise<FileRead> {
    if (!isZip(bytes)) {
      const text = decodeText(bytes);
      return text === null
        ? { ok: false, reason: 'notJson' }
        : { ok: true, text, sibling: false, other: [], more: 0 };
    }
    const zip = await import('../lib/zip.js').catch(() => null);
    if (!zip) return { ok: false, reason: 'failed' };
    const r = zip.readDataZip(bytes, name);
    if (r.ok) return r;
    return { ok: false, reason: r.reason === 'notText' ? 'notJson' : r.reason };
  }

  function onfile(e: Event & { currentTarget: HTMLInputElement }): void {
    const el = e.currentTarget;
    const [file] = el.files ?? [];
    /* Emptied so the same file can be chosen again. */
    el.value = '';
    if (file) void choose(file);
  }
</script>

<Actions>
  <Button size="sm" onclick={() => input?.click()}>{t.importPick}</Button>
  {#if fileName}<span class="fname">{fileName}</span>{/if}
</Actions>
<input
  bind:this={input}
  type="file"
  hidden
  accept=".json,.zip,application/json,application/zip"
  onchange={onfile}
/>

<style>
  .fname {
    font-size: 13px;
    color: var(--muted);
    overflow-wrap: anywhere;
  }
</style>
