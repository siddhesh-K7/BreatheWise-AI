import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { clearRateLimitStore } from '@/services/rate-limiter';

// Canvas stub for axe-core color contrast checks in JSDOM
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = () => null;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  clearRateLimitStore();
});
