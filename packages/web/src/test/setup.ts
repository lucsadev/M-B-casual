/**
 * Vitest setup file — runs before every test.
 *
 * Extends Vitest expectations with jest-dom matchers
 * (toBeInTheDocument, toHaveTextContent, etc.) for DOM assertions.
 */
import '@testing-library/jest-dom/vitest';

/**
 * PointerEvent polyfill for jsdom.
 *
 * jsdom does not implement PointerEvent, but the drag/swipe gallery relies on
 * pointer events to support mouse + touch. PointerEvent extends MouseEvent in
 * real browsers, so a minimal subclass is enough for tests.
 */
if (typeof globalThis.PointerEvent === 'undefined') {
  globalThis.PointerEvent = class PointerEvent extends MouseEvent {
    pointerId: number;
    isPrimary: boolean;

    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.isPrimary = init.isPrimary ?? true;
    }
  } as unknown as typeof PointerEvent;
}

/**
 * IntersectionObserver stub for jsdom.
 *
 * The catalog product grid observes a sentinel to trigger infinite scroll.
 * jsdom doesn't implement IntersectionObserver, so a no-op stub keeps the
 * observer effect from crashing in tests. It never fires, which is fine —
 * infinite scroll is exercised one page at a time in tests.
 */
if (typeof globalThis.IntersectionObserver === 'undefined') {
  class IntersectionObserverStub {
    readonly root: Element | Document | null;
    readonly rootMargin: string;
    readonly thresholds: ReadonlyArray<number>;

    constructor(
      private callback: IntersectionObserverCallback,
      options: IntersectionObserverInit = {},
    ) {
      this.root = options.root ?? null;
      this.rootMargin = options.rootMargin ?? '0px';
      this.thresholds = Array.isArray(options.threshold)
        ? options.threshold
        : [options.threshold ?? 0];
    }

    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  Object.defineProperty(globalThis, 'IntersectionObserver', {
    configurable: true,
    writable: true,
    value: IntersectionObserverStub,
  });
}
