import { ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { S3Resolver } from './s3.resolver.js';
import type { S3Service } from './s3.service.js';

function createResolver(service: Partial<S3Service>) {
  return new S3Resolver(service as S3Service);
}

describe('S3Resolver', () => {
  it('returns buckets from S3Service', async () => {
    const s3Buckets = vi.fn(async () => [{ name: 'reports', region: null, tags: [] }]);
    const resolver = createResolver({ s3Buckets });

    await expect(resolver.s3Buckets()).resolves.toEqual([{ name: 'reports', region: null, tags: [] }]);
    expect(s3Buckets).toHaveBeenCalledOnce();
  });

  it('returns an object tree from S3Service', async () => {
    const s3Tree = vi.fn(async () => ({ bucket: 'reports', prefix: '', nodes: [] }));
    const resolver = createResolver({ s3Tree });

    await expect(resolver.s3Tree('reports')).resolves.toEqual({ bucket: 'reports', prefix: '', nodes: [] });
    expect(s3Tree).toHaveBeenCalledWith('reports', undefined);
  });

  it('returns object previews from S3Service', async () => {
    const s3ObjectPreview = vi.fn(async () => ({
      bucket: 'reports',
      key: 'index.html',
      contentType: 'text/html',
      content: '<h1>ok</h1>',
    }));
    const resolver = createResolver({ s3ObjectPreview });

    await expect(resolver.s3ObjectPreview('reports', 'index.html')).resolves.toMatchObject({
      content: '<h1>ok</h1>',
    });
    expect(s3ObjectPreview).toHaveBeenCalledWith('reports', 'index.html');
  });

  it('returns clear errors from S3Service', async () => {
    const s3Buckets = vi.fn(async () => {
      throw new ServiceUnavailableException('AWS access was denied for S3.');
    });
    const resolver = createResolver({ s3Buckets });

    await expect(resolver.s3Buckets()).rejects.toThrow('AWS access was denied for S3.');
  });
});
