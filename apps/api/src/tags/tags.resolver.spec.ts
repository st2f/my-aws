import { ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { TagsResolver } from './tags.resolver.js';
import type { TagsService } from './tags.service.js';

function createResolver(service: Partial<TagsService>) {
  return new TagsResolver(service as TagsService);
}

describe('TagsResolver', () => {
  it('returns tag keys from TagsService', async () => {
    const tagKeys = vi.fn(async () => [{ key: 'Project', valueCount: 0 }]);
    const resolver = createResolver({ tagKeys });

    await expect(resolver.tagKeys()).resolves.toEqual([{ key: 'Project', valueCount: 0 }]);
    expect(tagKeys).toHaveBeenCalledWith(undefined);
  });

  it('returns tag values from TagsService', async () => {
    const tagValues = vi.fn(async () => [
      { key: 'Project', value: 'ci-practice', resourceCount: 0 },
    ]);
    const resolver = createResolver({ tagValues });

    await expect(resolver.tagValues('Project')).resolves.toEqual([
      { key: 'Project', value: 'ci-practice', resourceCount: 0 },
    ]);
    expect(tagValues).toHaveBeenCalledWith('Project', undefined);
  });

  it('returns resources by tag from TagsService', async () => {
    const resourcesByTag = vi.fn(async () => [
      {
        arn: 'arn:aws:s3:::ci-practice-reports',
        service: 's3',
        type: null,
        region: null,
        accountId: null,
        name: 'ci-practice-reports',
        tags: [{ key: 'Project', value: 'ci-practice' }],
      },
    ]);
    const resolver = createResolver({ resourcesByTag });

    await expect(resolver.resourcesByTag('Project', 'ci-practice')).resolves.toHaveLength(1);
    expect(resourcesByTag).toHaveBeenCalledWith('Project', 'ci-practice', undefined);
  });

  it('passes refresh requests to TagsService', async () => {
    const resourcesByTag = vi.fn(async () => []);
    const resolver = createResolver({ resourcesByTag });

    await expect(resolver.resourcesByTag('Project', 'ci-practice', true)).resolves.toEqual([]);
    expect(resourcesByTag).toHaveBeenCalledWith('Project', 'ci-practice', true);
  });

  it('returns clear errors from TagsService', async () => {
    const tagKeys = vi.fn(async () => {
      throw new ServiceUnavailableException('AWS access was denied for tag discovery.');
    });
    const resolver = createResolver({ tagKeys });

    await expect(resolver.tagKeys()).rejects.toThrow('AWS access was denied for tag discovery.');
  });
});
