import { describe, expect, it } from 'vitest';
import { readCorsOrigins, viteLocalhostOrigin } from './cors-origins.js';

describe('readCorsOrigins', () => {
  it('allows localhost Vite dev origins by default', () => {
    expect(readCorsOrigins({})).toEqual([viteLocalhostOrigin]);
    expect(viteLocalhostOrigin.test('http://localhost:5173')).toBe(true);
    expect(viteLocalhostOrigin.test('http://localhost:5175')).toBe(true);
    expect(viteLocalhostOrigin.test('http://localhost:3000')).toBe(false);
  });

  it('parses comma-separated WEB_ORIGIN values and keeps the Vite dev origin allowance', () => {
    expect(
      readCorsOrigins({
        WEB_ORIGIN: 'http://localhost:5173, http://localhost:5174',
      }),
    ).toEqual(['http://localhost:5173', 'http://localhost:5174', viteLocalhostOrigin]);
  });
});
