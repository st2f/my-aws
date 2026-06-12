import { describe, expect, it } from 'vitest';
import { AppController } from './app.controller.js';

describe('AppController', () => {
  // no Nest app, no HTTP layer, no port
  it('returns health status', () => {
    const controller = new AppController();

    expect(controller.health()).toEqual({ status: 'ok' });
  });
});
