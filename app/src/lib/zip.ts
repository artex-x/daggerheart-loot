/* The account's data zip: a store-only writer and a reader that refuses
 * anything a data zip is not (docs/specs/CONTRACTS.md section 4, "The
 * account's data zip"). Store-only because the site reads only the zips it
 * writes; the pictures a later release adds are WebP, which deflate does
 * not shrink. Pure module; loaded by a dynamic `import()`. */

import { decodeText, FILE_MAX_BYTES } from './bundle.js';

let table: Uint32Array | null = null;

/** Returns the CRC-32 (IEEE) of the bytes. */
export function crc32(bytes: Uint8Array): number {
  if (!table) {
    table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const b of bytes) crc = (table[(crc ^ b) & 0xff] ?? 0) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

const LOCAL = 0x04034b50;
const CENTRAL = 0x02014b50;
const END = 0x06054b50;
const ZIP64_LOCATOR = 0x07064b50;
/* Bit 0: encrypted. Bit 11: the name is UTF-8. */
const ENCRYPTED = 0x0001;
const UTF8_NAME = 0x0800;
const VERSION = 20;
/** The most entries the reader takes; a later version raises it. */
export const ZIP_ENTRIES_MAX = 1000;

const encoder = new TextEncoder();

/** Returns a zip of the files, each stored (no compression) with a UTF-8 name and the DOS
 *  time of `at` in UTC, so the same files and time give the same bytes. */
export function zipStored(
  files: readonly { name: string; bytes: Uint8Array }[],
  at: Date
): Uint8Array<ArrayBuffer> {
  const time = (at.getUTCHours() << 11) | (at.getUTCMinutes() << 5) | (at.getUTCSeconds() >> 1);
  const date =
    ((at.getUTCFullYear() - 1980) << 9) | ((at.getUTCMonth() + 1) << 5) | at.getUTCDate();
  const parts = files.map((f) => ({
    name: encoder.encode(f.name),
    bytes: f.bytes,
    crc: crc32(f.bytes)
  }));
  const localSize = parts.reduce((n, p) => n + 30 + p.name.length + p.bytes.length, 0);
  const centralSize = parts.reduce((n, p) => n + 46 + p.name.length, 0);
  const out = new Uint8Array(localSize + centralSize + 22);
  const v = new DataView(out.buffer);
  let pos = 0;
  const offsets: number[] = [];
  for (const p of parts) {
    offsets.push(pos);
    v.setUint32(pos, LOCAL, true);
    v.setUint16(pos + 4, VERSION, true);
    v.setUint16(pos + 6, UTF8_NAME, true);
    v.setUint16(pos + 8, 0, true);
    v.setUint16(pos + 10, time, true);
    v.setUint16(pos + 12, date, true);
    v.setUint32(pos + 14, p.crc, true);
    v.setUint32(pos + 18, p.bytes.length, true);
    v.setUint32(pos + 22, p.bytes.length, true);
    v.setUint16(pos + 26, p.name.length, true);
    v.setUint16(pos + 28, 0, true);
    out.set(p.name, pos + 30);
    out.set(p.bytes, pos + 30 + p.name.length);
    pos += 30 + p.name.length + p.bytes.length;
  }
  const central = pos;
  parts.forEach((p, i) => {
    v.setUint32(pos, CENTRAL, true);
    v.setUint16(pos + 4, VERSION, true);
    v.setUint16(pos + 6, VERSION, true);
    v.setUint16(pos + 8, UTF8_NAME, true);
    v.setUint16(pos + 10, 0, true);
    v.setUint16(pos + 12, time, true);
    v.setUint16(pos + 14, date, true);
    v.setUint32(pos + 16, p.crc, true);
    v.setUint32(pos + 20, p.bytes.length, true);
    v.setUint32(pos + 24, p.bytes.length, true);
    v.setUint16(pos + 28, p.name.length, true);
    v.setUint32(pos + 42, offsets[i] ?? 0, true);
    out.set(p.name, pos + 46);
    pos += 46 + p.name.length;
  });
  v.setUint32(pos, END, true);
  v.setUint16(pos + 8, parts.length, true);
  v.setUint16(pos + 10, parts.length, true);
  v.setUint32(pos + 12, pos - central, true);
  v.setUint32(pos + 16, central, true);
  return out;
}

/** One entry of a zip: `bytes` is null for any method but 0 (stored). */
export interface ZipEntry {
  name: string;
  method: number;
  bytes: Uint8Array | null;
}

/* A read outside the buffer, a failed check, or anything else a hostile file can cause. */
class Bad extends Error {}

const cp437 = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => (b < 0x80 ? String.fromCharCode(b) : '�')).join('');
const names = new TextDecoder('utf-8');

/** Returns the zip's entries in directory order, or null for anything that is not a single-
 *  disk, unencrypted zip of at most `ZIP_ENTRIES_MAX` entries whose headers agree, whose bounds
 *  hold and whose stored entries match their CRC. Never throws. */
export function readZip(bytes: Uint8Array): ZipEntry[] | null {
  try {
    return walk(bytes);
  } catch {
    return null;
  }
}

function walk(bytes: Uint8Array): ZipEntry[] | null {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const len = bytes.length;
  const u16 = (at: number): number => {
    if (at < 0 || at + 2 > len) throw new Bad();
    return v.getUint16(at, true);
  };
  const u32 = (at: number): number => {
    if (at < 0 || at + 4 > len) throw new Bad();
    return v.getUint32(at, true);
  };
  /* The end record: searched back over its 22 bytes and the longest comment, and taken only
     where its comment ends the file. */
  let end = -1;
  for (let at = len - 22; at >= Math.max(0, len - 22 - 0xffff); at--) {
    if (u32(at) === END && at + 22 + u16(at + 20) === len) {
      end = at;
      break;
    }
  }
  if (end < 0) return null;
  if (end >= 20 && u32(end - 20) === ZIP64_LOCATOR) return null;
  const disk = u16(end + 4);
  const cdDisk = u16(end + 6);
  const onDisk = u16(end + 8);
  const total = u16(end + 10);
  const cdSize = u32(end + 12);
  const cdStart = u32(end + 16);
  if (disk !== 0 || cdDisk !== 0 || onDisk !== total) return null;
  if (total === 0xffff || cdSize === 0xffffffff || cdStart === 0xffffffff) return null;
  if (total > ZIP_ENTRIES_MAX || cdStart + cdSize !== end) return null;
  const entries: ZipEntry[] = [];
  let at = cdStart;
  while (at < end) {
    if (entries.length >= total) return null;
    if (u32(at) !== CENTRAL) return null;
    const flags = u16(at + 8);
    const method = u16(at + 10);
    const crc = u32(at + 16);
    const packed = u32(at + 20);
    const size = u32(at + 24);
    const nameLen = u16(at + 28);
    const extraLen = u16(at + 30);
    const commentLen = u16(at + 32);
    const startDisk = u16(at + 34);
    const local = u32(at + 42);
    const next = at + 46 + nameLen + extraLen + commentLen;
    if (next > end) return null;
    if (flags & ENCRYPTED || startDisk !== 0) return null;
    if (packed === 0xffffffff || size === 0xffffffff || local === 0xffffffff) return null;
    const rawName = bytes.subarray(at + 46, at + 46 + nameLen);
    if (u32(local) !== LOCAL) return null;
    const localNameLen = u16(local + 26);
    const localExtraLen = u16(local + 28);
    const localName = bytes.subarray(local + 30, local + 30 + localNameLen);
    if (local + 30 + localNameLen > len || !sameBytes(localName, rawName)) return null;
    const data = local + 30 + localNameLen + localExtraLen;
    if (data + packed > len) return null;
    let content: Uint8Array | null = null;
    if (method === 0) {
      if (packed !== size) return null;
      content = bytes.slice(data, data + packed);
      if (crc32(content) !== crc) return null;
    }
    const name = flags & UTF8_NAME ? names.decode(rawName) : cp437(rawName);
    entries.push({ name, method, bytes: content });
    at = next;
  }
  return entries.length === total ? entries : null;
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

/* The files an archiver adds on its own; never read, never named. */
function ignored(name: string): boolean {
  const last = name.slice(name.lastIndexOf('/') + 1);
  return (
    name.endsWith('/') ||
    name.startsWith('__MACOSX/') ||
    last.startsWith('._') ||
    last === '.DS_Store' ||
    last === 'Thumbs.db'
  );
}

const lastSegment = (name: string): string => name.slice(name.lastIndexOf('/') + 1);
const depth = (name: string): number => name.split('/').length - 1;

/** The two data files of the account's zip; each import page reads one. */
export type DataFile = 'lists.json' | 'homebrew.json';

export type DataZip =
  | { ok: true; text: string; sibling: boolean; other: string[]; more: number }
  | { ok: false; reason: 'notZip' | 'missing' | 'many' | 'packed' | 'tooBig' | 'notText' };

/** Why an import's chosen file is not read: past 5 MiB (a zip's data file included), a zip
 *  past `ZIP_MAX_BYTES`, a failed read or chunk, not UTF-8 text, a zip that is not a data
 *  zip, or a data zip without its file, with two at one depth, or compressed by another
 *  program. */
export type FileRefusal =
  'tooBig' | 'zipTooBig' | 'failed' | 'notJson' | 'notZip' | 'missing' | 'many' | 'packed';

/** An import's chosen file: its text and, from a zip, whether it holds the other data file
 *  and the names of the rest; or why it is not read. */
export type FileRead =
  | { ok: true; text: string; sibling: boolean; other: string[]; more: number }
  | { ok: false; reason: FileRefusal };

/** Returns the text of a data zip's `name` - the one at the root, else the shallowest one
 *  in a folder; two at one depth answer `many`, never a guess -, whether the zip holds the
 *  other data file (`sibling`, which the other import page reads), and the rest of the
 *  files' names, the first five, with `more` counting the rest. */
export function readDataZip(bytes: Uint8Array, name: DataFile): DataZip {
  const entries = readZip(bytes);
  if (!entries) return { ok: false, reason: 'notZip' };
  const kept = entries.filter((e) => !ignored(e.name));
  const found = kept.filter((e) => lastSegment(e.name) === name);
  const shallowest = Math.min(...found.map((e) => depth(e.name)));
  const at = found.filter((e) => depth(e.name) === shallowest);
  const [chosen] = at;
  if (!chosen) return { ok: false, reason: 'missing' };
  if (at.length > 1) return { ok: false, reason: 'many' };
  if (!chosen.bytes) return { ok: false, reason: 'packed' };
  if (chosen.bytes.length > FILE_MAX_BYTES) return { ok: false, reason: 'tooBig' };
  const text = decodeText(chosen.bytes);
  if (text === null) return { ok: false, reason: 'notText' };
  const siblingName: DataFile = name === 'lists.json' ? 'homebrew.json' : 'lists.json';
  const rest = kept.filter((e) => e !== chosen).map((e) => lastSegment(e.name));
  const other = rest.filter((n) => n !== siblingName);
  return {
    ok: true,
    text,
    sibling: rest.includes(siblingName),
    other: other.slice(0, 5),
    more: Math.max(0, other.length - 5)
  };
}
