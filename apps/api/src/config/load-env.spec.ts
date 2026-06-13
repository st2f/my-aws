import { describe, expect, it } from 'vitest';
import { findEnvFile } from './load-env.js';

describe('findEnvFile', () => {
  it('finds the repo env file from the API package', () => {
    expect(findEnvFile(process.cwd())).toMatch(/\.env$/);
  });
});
