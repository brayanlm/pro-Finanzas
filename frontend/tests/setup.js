import '@testing-library/jest-dom';
import { vi } from 'vitest';

// NOTA: no se mockea `lucide-react` con JSX; `lucide-react` funciona en jsdom.
// (El mock anterior usaba JSX dentro de un archivo `.js`, que Vite no transforma.)

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
});
