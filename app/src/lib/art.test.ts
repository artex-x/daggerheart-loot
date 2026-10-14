import { describe, expect, it, vi } from 'vitest';
import { isArtName, isOwnArt, newArtName, shownArt, thumbOf } from './art.js';

describe('own picture names', () => {
  it('makes the 640 px name from a uuid without its hyphens', () => {
    expect(newArtName('webp', '0f8e0c1a-2b3c-4d5e-8f90-a1b2c3d4e5f6')).toBe(
      'p/0f8e0c1a2b3c4d5e8f90a1b2c3d4e5f6.webp'
    );
    expect(newArtName('jpg', '0f8e0c1a-2b3c-4d5e-8f90-a1b2c3d4e5f6')).toBe(
      'p/0f8e0c1a2b3c4d5e8f90a1b2c3d4e5f6.jpg'
    );
  });

  it('names the 160 px file under t/', () => {
    expect(thumbOf(`p/${'b'.repeat(32)}.jpg`)).toBe(`t/${'b'.repeat(32)}.jpg`);
  });

  it('tells an own name from a catalog basename and from anything else', () => {
    const own = `p/${'c'.repeat(32)}.webp`;
    expect(isOwnArt(own)).toBe(true);
    expect(isOwnArt('q1.webp')).toBe(false);
    expect(isOwnArt(`t/${'c'.repeat(32)}.webp`)).toBe(false);
    expect([own, 'q1.webp', 'Arazo_1-b.webp'].every(isArtName)).toBe(true);
    for (const bad of [
      'q1.png',
      `p/${'c'.repeat(31)}.webp`,
      '../x.webp',
      'p/x.webp',
      7,
      null
    ]) {
      expect(isArtName(bad)).toBe(false);
    }
  });
});

describe('the bucket address', () => {
  it('builds it from the project address of a configured build, and is empty without one', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://ref.supabase.co/');
    vi.resetModules();
    try {
      expect((await import('./art.js')).ART_BASE).toBe(
        'https://ref.supabase.co/storage/v1/object/public/homebrew-art/'
      );
      vi.stubEnv('VITE_SUPABASE_URL', '');
      vi.resetModules();
      expect((await import('./art.js')).ART_BASE).toBe('');
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });
});

describe('the picture the editor shows', () => {
  it('draws a chosen file, a picked item, none after a removal, and the stored one', () => {
    expect(shownArt({ kind: 'file', preview: 'blob:x' }, 'q1.webp')).toBe('blob:x');
    expect(shownArt({ kind: 'item', img: 'q2.webp' }, 'q1.webp')).toBe('q2.webp');
    expect(shownArt({ kind: 'remove' }, 'q1.webp')).toBeNull();
    expect(shownArt({ kind: 'keep' }, 'q1.webp')).toBe('q1.webp');
    expect(shownArt({ kind: 'keep' }, null)).toBeNull();
  });
});
