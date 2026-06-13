import { describe, expect, it } from 'vitest';
import { readCorsOrigins } from './cors-origins.js';

describe('readCorsOrigins', () => {
  it('allows common Vite dev origins by default', () => {
    expect(readCorsOrigins({})).toEqual(['http://localhost:5173', 'http://localhost:5174']);
  });

  it('parses comma-separated WEB_ORIGIN values', () => {
    expect(
      readCorsOrigins({
        WEB_ORIGIN: 'http://localhost:5173, http://localhost:5174',
      }),
    ).toEqual(['http://localhost:5173', 'http://localhost:5174']);
  });
});
