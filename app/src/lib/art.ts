/* Own pictures of homebrew items: the stored name and its public address.
 *
 * A record's `img` keeps one meaning, the stored name: a catalog basename (`q1.webp`), or
 * an own file `p/<32 hex>.<ext>` of the public bucket `homebrew-art`, whose 160 px copy is
 * `t/<32 hex>.<ext>`. The name is random and holds no account id
 * (docs/decisions/2026-10-14-own-pictures-are-random-named-files-the-database-deletes.md).
 * Pure module: no port, no storage. */

/* `import.meta.env` is undefined in Node, which runs this module for the hosted E2E outside
   Vite. */
const ENV = import.meta.env as Partial<ImportMetaEnv> | undefined;
const PROJECT = ENV?.VITE_SUPABASE_URL ?? '';

/** The public address of the bucket's files; empty in a build with no sign-in, where no
 *  own item exists. */
export const ART_BASE: string = PROJECT
  ? `${PROJECT.replace(/\/+$/, '')}/storage/v1/object/public/homebrew-art/`
  : '';

const OWN = /^p\/[0-9a-f]{32}\.(webp|jpg)$/;
const CATALOG = /^[A-Za-z0-9_-]+\.webp$/;

/** Returns whether a name is an own picture's 640 px file. */
export function isOwnArt(name: string): boolean {
  return OWN.test(name);
}

/** Returns whether a value is a picture name an item may store (`homebrew_items_art_shape`):
 *  an own file or a catalog basename. */
export function isArtName(v: unknown): v is string {
  return typeof v === 'string' && (OWN.test(v) || CATALOG.test(v));
}

/** Returns the 160 px file of an own picture's name. */
export function thumbOf(name: string): string {
  return 't/' + name.slice(2);
}

/** Returns a new own picture's 640 px name: the uuid without its hyphens. */
export function newArtName(ext: 'webp' | 'jpg', uuid: string): string {
  return `p/${uuid.replace(/-/g, '')}.${ext}`;
}

/* The picture field's bounds (docs/specs/FEATURES.md, "Homebrew"): the file the field
   reads, the sides the dialog takes, the two squares it writes, the bucket's file limit
   and the encoder's steps. */
export const ART_SOURCE_MAX = 20 * 1024 * 1024;
export const ART_SIDE_MIN = 160;
export const ART_SIDE_MAX = 8000;
export const ART_FULL = 640;
export const ART_THUMB = 160;
export const ART_BYTES_MAX = 204800;
export const ART_QUALITIES: readonly number[] = [0.85, 0.75, 0.65, 0.55];
export const ART_THUMB_QUALITY = 0.8;
/** The pictures an account holds over its item limit: files the job has not deleted yet. */
export const ART_SLACK = 5;

/** A decoded picture: its sides, and the call that frees its memory. */
export interface PictureSource {
  readonly width: number;
  readonly height: number;
  close(): void;
}

/** A square of the source picture, in source pixels. */
export interface ArtRect {
  x: number;
  y: number;
  side: number;
}

export type ArtType = 'image/webp' | 'image/jpeg';

/** The two encoder calls of the media port that the crop needs. */
export interface ArtEncoder {
  render(
    image: PictureSource,
    rect: ArtRect,
    side: number,
    type: ArtType,
    quality: number
  ): Promise<Blob>;
  webp(): Promise<boolean>;
}

/** The picture field's value: the stored picture unchanged, removed, another item's picture,
 *  or a cropped file not uploaded yet. */
export type ArtValue =
  | { kind: 'keep' }
  | { kind: 'remove' }
  | { kind: 'item'; img: string }
  | {
      kind: 'file';
      id: string;
      ext: 'webp' | 'jpg';
      full: Blob;
      thumb: Blob;
      preview: string;
    };

/** Why the crop dialog refused a file. */
export type CropRefusal = 'bad' | 'small' | 'huge' | 'squeeze';

/** The picture field's value, without the blobs a chosen file carries. */
export type ShownArt =
  | { kind: 'keep' }
  | { kind: 'remove' }
  | { kind: 'item'; img: string }
  | { kind: 'file'; preview: string };

/** Returns the picture the editor shows: a chosen file's preview address, a picked item's
 *  name, none after a removal, or the stored one. */
export function shownArt(value: ShownArt, saved: string | null): string | null {
  switch (value.kind) {
    case 'file':
      return value.preview;
    case 'item':
      return value.img;
    case 'remove':
      return null;
    default:
      return saved;
  }
}
