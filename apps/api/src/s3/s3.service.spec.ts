import { describe, expect, it, vi } from 'vitest';
import type { AwsService } from '../aws/aws.service.js';
import { ConfigService } from '../config/config.service.js';
import { S3Service } from './s3.service.js';

type SentCommand = {
  constructor: {
    name: string;
  };
  input: unknown;
};

function createService(responses: unknown[], env: NodeJS.ProcessEnv = {}) {
  const send = vi.fn(async (command: SentCommand) => {
    void command;
    const response = responses.shift();

    if (response instanceof Error) {
      throw response;
    }

    return response;
  });
  const awsService = {
    createS3Client: () => ({ send }),
  } as unknown as AwsService;

  return {
    service: new S3Service(awsService, new ConfigService(env)),
    send,
  };
}

describe('S3Service', () => {
  it('returns buckets from ListBuckets', async () => {
    const { service } = createService([{ Buckets: [{ Name: 'reports' }] }, { TagSet: [] }]);

    await expect(service.s3Buckets()).resolves.toEqual([{ name: 'reports', region: null, tags: [] }]);
  });

  it('includes bucket tags when permissions allow', async () => {
    const { service } = createService([
      { Buckets: [{ Name: 'reports' }] },
      { TagSet: [{ Key: 'Project', Value: 'ci-practice' }] },
    ]);

    await expect(service.s3Buckets()).resolves.toEqual([
      { name: 'reports', region: null, tags: [{ key: 'Project', value: 'ci-practice' }] },
    ]);
  });

  it('returns buckets without tags when bucket tag lookup is denied', async () => {
    const { service } = createService([
      { Buckets: [{ Name: 'reports' }] },
      Object.assign(new Error('denied'), { name: 'AccessDenied', $metadata: { httpStatusCode: 403 } }),
    ]);

    await expect(service.s3Buckets()).resolves.toEqual([{ name: 'reports', region: null, tags: [] }]);
  });

  it('returns a limited object tree from ListObjectsV2', async () => {
    const { service } = createService([
      {
        CommonPrefixes: [{ Prefix: 'lab/' }],
        Contents: [{ Key: 'index.html' }],
      },
    ]);

    await expect(service.s3Tree('reports')).resolves.toEqual({
      bucket: 'reports',
      prefix: '',
      nodes: [
        { key: 'lab/', name: 'lab', kind: 'directory', previewable: false },
        { key: 'index.html', name: 'index.html', kind: 'file', previewable: true },
      ],
    });
  });

  it('respects maxObjectsPerBucket from config', async () => {
    const { service, send } = createService([{ Contents: [] }], {
      MY_AWS_S3_MAX_OBJECTS_PER_BUCKET: '12',
    });

    await service.s3Tree('reports', 'lab/');

    expect((send.mock.calls[0]?.[0] as SentCommand).input).toEqual({
      Bucket: 'reports',
      Prefix: 'lab/',
      Delimiter: '/',
      MaxKeys: 12,
    });
  });

  it('marks objects previewable only for configured extensions', async () => {
    const { service } = createService([{ Contents: [{ Key: 'main.tf' }, { Key: 'image.png' }] }], {
      MY_AWS_S3_PREVIEW_EXTENSIONS: '.tf',
    });

    await expect(service.s3Tree('reports')).resolves.toMatchObject({
      nodes: [
        { key: 'main.tf', previewable: true },
        { key: 'image.png', previewable: false },
      ],
    });
  });

  it('returns text previews for supported extensions', async () => {
    const { service, send } = createService([
      {
        Body: {
          transformToByteArray: async () => new TextEncoder().encode('<h1>ok</h1>'),
        },
        ContentType: 'text/html',
      },
    ]);

    await expect(service.s3ObjectPreview('reports', 'index.html')).resolves.toEqual({
      bucket: 'reports',
      key: 'index.html',
      contentType: 'text/html',
      content: '<h1>ok</h1>',
    });
    expect((send.mock.calls[0]?.[0] as SentCommand).input).toEqual({
      Bucket: 'reports',
      Key: 'index.html',
      Range: 'bytes=0-999999',
    });
  });

  it('rejects unsupported preview extensions with a readable response', async () => {
    const { service, send } = createService([]);

    await expect(service.s3ObjectPreview('reports', 'image.png')).rejects.toThrow(
      'Unsupported preview extension for "image.png".',
    );
    expect(send).not.toHaveBeenCalled();
  });

  it('enforces maxPreviewBytes from config', async () => {
    const { service } = createService(
      [
        {
          Body: {
            transformToByteArray: async () => new TextEncoder().encode('abcdef'),
          },
        },
      ],
      { MY_AWS_S3_MAX_PREVIEW_BYTES: '5' },
    );

    await expect(service.s3ObjectPreview('reports', 'main.tf')).rejects.toThrow(
      'Object preview exceeds 5 bytes.',
    );
  });

  it('maps AWS access denied errors to readable errors', async () => {
    const { service } = createService([
      Object.assign(new Error('denied'), { name: 'AccessDenied', $metadata: { httpStatusCode: 403 } }),
    ]);

    await expect(service.s3Tree('reports')).rejects.toThrow('AWS access was denied for S3.');
  });
});
