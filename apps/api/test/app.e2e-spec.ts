import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('App', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  // initializes Nest + HTTP adapter + Supertest
  it('returns health status', async () => {
    await request(app.getHttpAdapter().getInstance()).get('/health').expect(200).expect({
      status: 'ok',
    });
  });
});
