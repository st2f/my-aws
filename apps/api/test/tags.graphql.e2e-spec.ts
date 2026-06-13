import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { TagsService } from '../src/tags/tags.service.js';

describe('Tags GraphQL e2e', () => {
  let app: INestApplication;

  afterEach(async () => {
    await app?.close();
  });

  it('can query tagKeys', async () => {
    app = await createApp({
      tagKeys: vi.fn(async () => [{ key: 'Project', valueCount: 0 }]),
    });

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `{
          tagKeys {
            key
            valueCount
          }
        }`,
      })
      .expect(200);

    expect(response.body).toEqual({
      data: {
        tagKeys: [{ key: 'Project', valueCount: 0 }],
      },
    });
  });

  it('can query tagValues', async () => {
    app = await createApp({
      tagValues: vi.fn(async () => [{ key: 'Project', value: 'ci-practice', resourceCount: 0 }]),
    });

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `{
          tagValues(key: "Project") {
            key
            value
            resourceCount
          }
        }`,
      })
      .expect(200);

    expect(response.body).toEqual({
      data: {
        tagValues: [{ key: 'Project', value: 'ci-practice', resourceCount: 0 }],
      },
    });
  });

  it('can query resourcesByTag', async () => {
    app = await createApp({
      resourcesByTag: vi.fn(async () => [
        {
          arn: 'arn:aws:iam::123456789012:user/iam-stef',
          service: 'iam',
          type: 'user',
          region: null,
          accountId: '123456789012',
          name: 'iam-stef',
          tags: [{ key: 'Project', value: 'ci-practice' }],
        },
      ]),
    });

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `{
          resourcesByTag(key: "Project", value: "ci-practice") {
            arn
            service
            type
            region
            accountId
            name
            tags {
              key
              value
            }
          }
        }`,
      })
      .expect(200);

    expect(response.body).toEqual({
      data: {
        resourcesByTag: [
          {
            arn: 'arn:aws:iam::123456789012:user/iam-stef',
            service: 'iam',
            type: 'user',
            region: null,
            accountId: '123456789012',
            name: 'iam-stef',
            tags: [{ key: 'Project', value: 'ci-practice' }],
          },
        ],
      },
    });
  });
});

async function createApp(tagsService: Partial<Pick<TagsService, 'tagKeys' | 'tagValues' | 'resourcesByTag'>>) {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(TagsService)
    .useValue({
      tagKeys: vi.fn(async () => []),
      tagValues: vi.fn(async () => []),
      resourcesByTag: vi.fn(async () => []),
      ...tagsService,
    })
    .compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  return app;
}
