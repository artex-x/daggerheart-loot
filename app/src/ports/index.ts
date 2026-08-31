/* The outside world, in one object.
 *
 * A component takes an `Env` rather than six imports, so swapping the whole
 * thing in a test is a line, and so no component has to know which
 * implementation it is talking to. */

import { browserClipboard, fakeClipboard } from './clipboard.js';
import { browserCompress, plainCompress } from './compress.js';
import { browserData, fakeData } from './data.js';
import { browserImage, fakeImage } from './image.js';
import { nativeDrag, noDrag } from './drag.js';
import { hashRouter, memoryRouter } from './router.js';
import { browserShare, fakeShare } from './share.js';
import { browserStorage, memoryStorage } from './storage.js';
import type { Env } from './types.js';

export * from './types.js';
export { browserClipboard, fakeClipboard } from './clipboard.js';
export { browserCompress, plainCompress } from './compress.js';
export { browserData, fakeData, noData } from './data.js';
export { brokenImage, browserImage, fakeImage } from './image.js';
export { nativeDrag, noDrag } from './drag.js';
export { hashRouter, memoryRouter } from './router.js';
export { browserShare, fakeShare } from './share.js';
export { brokenStorage, browserStorage, memoryStorage } from './storage.js';

export function browserEnv(): Env {
  return {
    data: browserData(),
    image: browserImage(),
    random: Math.random,
    storage: browserStorage(),
    clipboard: browserClipboard(),
    share: browserShare(),
    router: hashRouter(),
    compress: browserCompress(),
    drag: nativeDrag()
  };
}

/** Every port replaced by something that runs anywhere. */
export function fakeEnv(over: Partial<Env> = {}): Env {
  return {
    /* An empty catalogue by default: a test that needs records says which. */
    data: fakeData({ items: {} }),
    image: fakeImage(),
    /* Always the first row unless a test says otherwise: a roll that is a
       surprise in a test is a test that cannot assert what came up. */
    random: () => 0,
    storage: memoryStorage(),
    clipboard: fakeClipboard(),
    share: fakeShare(),
    router: memoryRouter(),
    compress: plainCompress(),
    drag: noDrag(),
    ...over
  };
}
