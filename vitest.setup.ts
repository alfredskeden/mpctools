import "vitest-canvas-mock";
import "@testing-library/jest-dom/vitest";

// Polyfill ResizeObserver for tests
globalThis.ResizeObserver = class ResizeObserver {
  private callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe() {
    // Trigger callback once to simulate initial observation
    this.callback([], this);
  }
  unobserve() {}
  disconnect() {}
};

// Polyfill createImageBitmap for tests
globalThis.createImageBitmap = vi
  .fn()
  .mockResolvedValue({ width: 100, height: 100, close: vi.fn() });
