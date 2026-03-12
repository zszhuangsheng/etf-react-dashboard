// Polyfill ResizeObserver for jsdom (Recharts requires it)
global.ResizeObserver = class ResizeObserver {
  constructor(cb) { this.cb = cb; }
  observe() {}
  unobserve() {}
  disconnect() {}
};
