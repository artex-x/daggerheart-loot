/* The file field both imports share, rendered alone: the file name, the 5 MiB bound and
   the zip's (its data file at 5 MiB, the zip at twice that), a read
   that fails, text that is not UTF-8, a zip read for its named file and each refusal, an
   empty pick, and a newer file winning over an older read (docs/specs/FEATURES.md, "Lists"
   and "Homebrew"). */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ImportFile from './ImportFile.svelte';
import { FILE_MAX_BYTES, ZIP_MAX_BYTES } from '../lib/bundle.js';
import { dict } from '../lib/dict.js';
import { zipStored } from '../lib/zip.js';
import type { FileRead } from '../lib/zip.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const t = dict('ru');
const utf8 = (s: string): Uint8Array<ArrayBuffer> => new TextEncoder().encode(s);

function field(name: 'lists.json' | 'homebrew.json' = 'homebrew.json') {
  const reads: FileRead[] = [];
  const onpick = vi.fn();
  const view = render(ImportFile, { t, name, onpick, onread: (r: FileRead) => reads.push(r) });
  const input = view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
  const pick = (files: File[]): void => {
    Object.defineProperty(input, 'files', { value: files, configurable: true });
    void fireEvent.change(input);
  };
  return { ...view, reads, onpick, pick };
}

describe('ImportFile', () => {
  it('reads a text file, names it, and opens the picker from its button', async () => {
    const { container, reads, onpick, pick } = field();
    const click = vi
      .spyOn(container.querySelector<HTMLInputElement>('input')!, 'click')
      .mockImplementation(() => undefined);
    await userEvent.click(screen.getByRole('button', { name: t.importPick }));
    expect(click).toHaveBeenCalledOnce();
    pick([new File([utf8('{"a":1}')], 'a.json')]);
    await waitFor(() => {
      expect(reads).toEqual([
        { ok: true, text: '{"a":1}', sibling: false, other: [], more: 0 }
      ]);
    });
    expect(onpick).toHaveBeenCalledOnce();
    expect(screen.getByText('a.json')).toHaveClass('fname');
    await expectNoA11yViolations(container);
  });

  it('refuses a file past 5 MiB unread, a failed read and bytes that are not UTF-8', async () => {
    const { reads, pick } = field();
    const big = new File([new Uint8Array(FILE_MAX_BYTES + 1)], 'big.json');
    const read = vi.spyOn(big, 'arrayBuffer');
    pick([big]);
    await waitFor(() => {
      expect(reads.at(-1)).toEqual({ ok: false, reason: 'tooBig' });
    });
    expect(read).not.toHaveBeenCalled();
    const broken = new File([utf8('x')], 'x.json');
    vi.spyOn(broken, 'arrayBuffer').mockRejectedValue(new Error('gone'));
    pick([broken]);
    await waitFor(() => {
      expect(reads.at(-1)).toEqual({ ok: false, reason: 'failed' });
    });
    pick([new File([new Uint8Array([0x7b, 0xff])], 'bad.json')]);
    await waitFor(() => {
      expect(reads.at(-1)).toEqual({ ok: false, reason: 'notJson' });
    });
  });

  it("reads a zip's named file, and turns a zip's refusals into its own", async () => {
    const { reads, pick } = field('lists.json');
    const at = new Date(0);
    const zip = (files: Record<string, Uint8Array>): File =>
      new File(
        [
          zipStored(
            Object.entries(files).map(([name, bytes]) => ({ name, bytes })),
            at
          )
        ],
        'data.zip'
      );
    pick([zip({ 'lists.json': utf8('[]'), 'homebrew.json': utf8('{}') })]);
    await waitFor(() => {
      expect(reads.at(-1)).toEqual({ ok: true, text: '[]', sibling: true, other: [], more: 0 });
    });
    pick([zip({ 'lists.json': new Uint8Array([0x7b, 0xff]) })]);
    await waitFor(() => {
      expect(reads.at(-1)).toEqual({ ok: false, reason: 'notJson' });
    });
    pick([zip({ 'homebrew.json': utf8('{}') })]);
    await waitFor(() => {
      expect(reads.at(-1)).toEqual({ ok: false, reason: 'missing' });
    });
  });

  it('reads a 6 MB zip of two 3 MB files, and bounds the zip and its chosen file', async () => {
    const { reads, pick } = field('lists.json');
    const spaces = (n: number): Uint8Array => new Uint8Array(n).fill(0x20);
    const three = 3 * 1024 * 1024;
    const both = zipStored(
      [
        { name: 'lists.json', bytes: spaces(three) },
        { name: 'homebrew.json', bytes: spaces(three) }
      ],
      new Date(0)
    );
    expect(both.length).toBeGreaterThan(FILE_MAX_BYTES);
    pick([new File([both], 'data.zip')]);
    await waitFor(() => {
      expect(reads.at(-1)).toMatchObject({ ok: true, sibling: true });
    });
    expect(reads.at(-1)).toMatchObject({ text: ' '.repeat(three) });
    const huge = new File(
      [new Uint8Array([0x50, 0x4b, 0x03, 0x04]), new Uint8Array(ZIP_MAX_BYTES)],
      'huge.zip'
    );
    const read = vi.spyOn(huge, 'arrayBuffer');
    pick([huge]);
    await waitFor(() => {
      expect(reads.at(-1)).toEqual({ ok: false, reason: 'zipTooBig' });
    });
    expect(read).not.toHaveBeenCalled();
    const big = zipStored(
      [{ name: 'lists.json', bytes: spaces(FILE_MAX_BYTES + 1) }],
      new Date(0)
    );
    pick([new File([big], 'big.zip')]);
    await waitFor(() => {
      expect(reads.at(-1)).toEqual({ ok: false, reason: 'tooBig' });
    });
  });

  it('does nothing for an empty pick, and drops an older read that a newer file overtook', async () => {
    const { reads, onpick, pick } = field();
    pick([]);
    expect(onpick).not.toHaveBeenCalled();
    let open: () => void = () => undefined;
    const gate = new Promise<void>((r) => {
      open = r;
    });
    const slow = new File([utf8('"old"')], 'old.json');
    const real = slow.arrayBuffer.bind(slow);
    vi.spyOn(slow, 'arrayBuffer').mockImplementation(async () => {
      await gate;
      return real();
    });
    pick([slow]);
    pick([new File([utf8('"new"')], 'new.json')]);
    await waitFor(() => {
      expect(reads).toHaveLength(1);
    });
    open();
    await new Promise((r) => setTimeout(r, 20));
    expect(reads).toEqual([{ ok: true, text: '"new"', sibling: false, other: [], more: 0 }]);
    const failing = new File([utf8('x')], 'f.json');
    let fail: () => void = () => undefined;
    vi.spyOn(failing, 'arrayBuffer').mockImplementation(
      () =>
        new Promise((_res, rej) => {
          fail = () => {
            rej(new Error('late'));
          };
        })
    );
    pick([failing]);
    pick([new File([utf8('"last"')], 'last.json')]);
    await waitFor(() => {
      expect(reads.at(-1)).toMatchObject({ text: '"last"' });
    });
    fail();
    await new Promise((r) => setTimeout(r, 20));
    expect(reads.at(-1)).toMatchObject({ text: '"last"' });
  });
});
