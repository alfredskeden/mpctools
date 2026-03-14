import "vitest-canvas-mock";
import "@testing-library/jest-dom/vitest";

// Prevent "Several Konva instances detected" warning in tests
vi.mock("konva", () => ({}));

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
