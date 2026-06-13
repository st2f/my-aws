import { INestApplication, ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccountService } from '../src/account/account.service.js';
import { AppModule } from '../src/app.module.js';

describe('GraphQL e2e', () => {
  let app: INestApplication;

  afterEach(async () => {
    await app?.close();
  });

  it('can call accountInfo through GraphQL', async () => {
    app = await createApp({
      getAccountInfo: vi.fn(async () => ({
        accountId: '123456789012',
        alias: 'learning-account',
        region: 'eu-north-1',
      })),
    });

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `{
          accountInfo {
            accountId
            alias
            region
          }
        }`,
      })
      .expect(200);

    expect(response.body).toEqual({
      data: {
        accountInfo: {
          accountId: '123456789012',
          alias: 'learning-account',
          region: 'eu-north-1',
        },
      },
    });
  });

  it('returns clear errors instead of crashing the server', async () => {
    app = await createApp({
      getAccountInfo: vi.fn(async () => {
        throw new ServiceUnavailableException('AWS credentials could not be loaded.');
      }),
    });

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `{
          accountInfo {
            accountId
          }
        }`,
      })
      .expect(200);

    expect(response.body.data).toBeNull();
    expect(response.body.errors[0].message).toBe('AWS credentials could not be loaded.');
  });
});

async function createApp(accountService: Pick<AccountService, 'getAccountInfo'>) {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(AccountService)
    .useValue(accountService)
    .compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  return app;
}
