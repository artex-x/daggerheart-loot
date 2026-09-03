import { describe, expect, it } from 'vitest';
import { FRAME_ORDER, frameName } from './frames.js';

describe('frameName', () => {
  it('names all four campaigns in both languages', () => {
    expect(FRAME_ORDER).toEqual(['beast_feast', 'colossus', 'dark_heart', 'motherboard']);
    expect(frameName('beast_feast', 'ru')).toBe('Пир зверей');
    expect(frameName('beast_feast', 'en')).toBe('Beast Feast');
    expect(frameName('colossus', 'ru')).toBe('Колоссы Сухоземья');
    expect(frameName('colossus', 'en')).toBe('Colossus of the Drylands');
    expect(frameName('dark_heart', 'ru')).toBe('Тёмное сердце Андалурии');
    expect(frameName('dark_heart', 'en')).toBe('Dark Heart of Andaluria');
    expect(frameName('motherboard', 'ru')).toBe('Материнская Плата');
    expect(frameName('motherboard', 'en')).toBe('Motherboard');
  });

  it('falls back to the raw id for a frame it does not know', () => {
    expect(frameName('unknown_frame', 'en')).toBe('unknown_frame');
  });
});
