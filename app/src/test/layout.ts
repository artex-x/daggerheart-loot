/* The layout that the print card's `fit()` reads, for printPage.test.ts and
   homebrewPrintPreview.test.ts: jsdom lays nothing out. */

/* jsdom (v30) declares `Range.prototype.getBoundingClientRect` in its types
 * but does not implement it - not even a zero-rect stub, which is what a real
 * browser gives an empty range. `fit()`'s strip loop calls it on every card
 * with a `.pc-strip`, so without this every such render throws before the DOM
 * settles. A zero-width rect is what a real browser reports for an empty range
 * anyway, so this fills an environment gap and changes no behaviour.
 * `getClientRects` has the same gap: an empty list is what a real browser gives
 * an empty range. */
export function emptyRanges(): void {
  Range.prototype.getBoundingClientRect = function (): DOMRect {
    return {
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      x: 0,
      y: 0,
      toJSON: () => ({})
    };
  };
  Range.prototype.getClientRects = function (): DOMRectList {
    return [] as unknown as DOMRectList;
  };
}

/* clientWidth/clientHeight/offsetTop and a Range's rect are all zero in jsdom, so
   every loop in `fit()` would exit at once and the art arithmetic would divide by
   zero. Faked exactly enough to walk every branch: `.pc-text`'s scrollHeight comes
   from the case, everything else measures 100 tall, and a Range reads as the case
   sets, one line wide, by the text it holds. `scrollWidth` stays jsdom's 0, so no
   card is cut off across. Returns the function that restores the real ones. */
export const fakeLayout = (
  textScroll: (text: HTMLElement) => number,
  rangeWidth: number | ((text: string) => number),
  /* A value's line rects by its inline `whiteSpace` and `fontSize`; null
     falls back to one line of `rangeWidth`. */
  lineRects?: (value: HTMLElement) => { width: number; top: number }[] | null
): (() => void) => {
  const widthDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  const heightDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight');
  const topDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetTop');
  const scrollDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight');
  // eslint-disable-next-line @typescript-eslint/unbound-method -- restored, never called unbound
  const rectFn = Range.prototype.getBoundingClientRect;
  // eslint-disable-next-line @typescript-eslint/unbound-method -- restored, never called unbound
  const rectsFn = Range.prototype.getClientRects;
  /* jsdom defines the sizes on `Element.prototype`: with no own descriptor here, the
     fake is removed and the inherited getter shows again. */
  const restoreOwn = (name: string, desc: PropertyDescriptor | undefined): void => {
    if (desc) Object.defineProperty(HTMLElement.prototype, name, desc);
    else Reflect.deleteProperty(HTMLElement.prototype, name);
  };
  const widthOf = (r: Range): number =>
    typeof rangeWidth === 'number' ? rangeWidth : rangeWidth(r.toString());

  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return 238;
    }
  });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return 100;
    }
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
    configurable: true,
    get() {
      return 0;
    }
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.classList.contains('pc-text') ? textScroll(this) : 100;
    }
  });
  Range.prototype.getBoundingClientRect = function (this: Range) {
    return { width: widthOf(this) } as DOMRect;
  };
  Range.prototype.getClientRects = function (this: Range) {
    const host = this.startContainer;
    const own = lineRects && host instanceof HTMLElement ? lineRects(host) : null;
    return (own ?? [{ width: widthOf(this), top: 0 }]) as unknown as DOMRectList;
  };

  return () => {
    restoreOwn('clientWidth', widthDesc);
    restoreOwn('clientHeight', heightDesc);
    restoreOwn('offsetTop', topDesc);
    restoreOwn('scrollHeight', scrollDesc);
    Range.prototype.getBoundingClientRect = rectFn;
    Range.prototype.getClientRects = rectsFn;
  };
};
