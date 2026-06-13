import { BadRequestException, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { S3Service } from '../src/s3/s3.service.js';

describe('S3 GraphQL e2e', () => {
  let app: INestApplication;

  afterEach(async () => {
    await app?.close();
  });

  it('can query s3Buckets', async () => {
    app = await createApp({
      s3Buckets: vi.fn(async () => [{ name: 'reports', region: null, tags: [{ key: 'Project', value: 'ci-practice' }] }]),
    });

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `{
          s3Buckets {
            name
            region
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
        s3Buckets: [{ name: 'reports', region: null, tags: [{ key: 'Project', value: 'ci-practice' }] }],
      },
    });
  });

  it('can query s3Tree', async () => {
    app = await createApp({
      s3Tree: vi.fn(async () => ({
        bucket: 'reports',
        prefix: '',
        nodes: [{ key: 'index.html', name: 'index.html', kind: 'file' as const, previewable: true }],
      })),
    });

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `{
          s3Tree(bucket: "reports") {
            bucket
            prefix
            nodes {
              key
              name
              kind
              previewable
            }
          }
        }`,
      })
      .expect(200);

    expect(response.body.data.s3Tree.nodes).toEqual([
      { key: 'index.html', name: 'index.html', kind: 'file', previewable: true },
    ]);
  });

  it('can query s3ObjectPreview', async () => {
    app = await createApp({
      s3ObjectPreview: vi.fn(async () => ({
        bucket: 'reports',
        key: 'index.html',
        contentType: 'text/html',
        content: '<h1>ok</h1>',
      })),
    });

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `{
          s3ObjectPreview(bucket: "reports", key: "index.html") {
            bucket
            key
            contentType
            content
          }
        }`,
      })
      .expect(200);

    expect(response.body.data.s3ObjectPreview).toEqual({
      bucket: 'reports',
      key: 'index.html',
      contentType: 'text/html',
      content: '<h1>ok</h1>',
    });
  });

  it('returns a clear unsupported response for unsupported previews', async () => {
    app = await createApp({
      s3ObjectPreview: vi.fn(async () => {
        throw new BadRequestException('Unsupported preview extension for "image.png".');
      }),
    });

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `{
          s3ObjectPreview(bucket: "reports", key: "image.png") {
            content
          }
        }`,
      })
      .expect(200);

    expect(response.body.data).toBeNull();
    expect(response.body.errors[0].message).toBe('Unsupported preview extension for "image.png".');
  });
});

async function createApp(s3Service: Partial<Pick<S3Service, 's3Buckets' | 's3Tree' | 's3ObjectPreview'>>) {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(S3Service)
    .useValue({
      s3Buckets: vi.fn(async () => []),
      s3Tree: vi.fn(async () => ({ bucket: '', prefix: '', nodes: [] })),
      s3ObjectPreview: vi.fn(async () => ({ bucket: '', key: '', contentType: 'text/plain', content: '' })),
      ...s3Service,
    })
    .compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  return app;
}
