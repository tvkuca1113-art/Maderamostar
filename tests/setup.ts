import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

// jsdom nema matchMedia, IntersectionObserver ni scrollIntoView.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}
class IO {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
window.IntersectionObserver = window.IntersectionObserver ?? (IO as unknown as typeof IntersectionObserver);
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? function () {};
window.scrollTo = (() => {}) as typeof window.scrollTo;
// jsdom nema canvas/WebGL; aplikacija tada koristi rezervne puteve (boja umjesto teksture, fotografija umjesto 3D).
HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext'];
