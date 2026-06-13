import { describe, expect, it, vi } from 'vitest';
import type { AwsService } from '../aws/aws.service.js';
import { TagsService } from './tags.service.js';

type SentCommand = {
  constructor: {
    name: string;
  };
  input: unknown;
};

function createService(responses: unknown[]) {
  const send = vi.fn(async (command: SentCommand) => {
    void command;
    const response = responses.shift();

    if (response instanceof Error) {
      throw response;
    }

    return response;
  });
  const awsService = {
    createResourceGroupsTaggingClient: () => ({ send }),
  } as unknown as AwsService;

  return {
    service: new TagsService(awsService),
    send,
  };
}

describe('TagsService', () => {
  it('returns tag keys from Resource Groups Tagging API', async () => {
    const { service } = createService([{ TagKeys: ['Environment', 'Project'] }]);

    await expect(service.tagKeys()).resolves.toEqual([
      { key: 'Environment', valueCount: 0 },
      { key: 'Project', valueCount: 0 },
    ]);
  });

  it('returns tag values for a key', async () => {
    const { service, send } = createService([{ TagValues: ['ci-practice', 'lab'] }]);

    await expect(service.tagValues('Project')).resolves.toEqual([
      { key: 'Project', value: 'ci-practice', resourceCount: 0 },
      { key: 'Project', value: 'lab', resourceCount: 0 },
    ]);
    expect((send.mock.calls[0]?.[0] as SentCommand).input).toEqual({
      Key: 'Project',
      PaginationToken: undefined,
    });
  });

  it('returns resources matching a tag key and value', async () => {
    const { service, send } = createService([
      {
        ResourceTagMappingList: [
          {
            ResourceARN: 'arn:aws:iam::123456789012:user/iam-stef',
            Tags: [
              { Key: 'Project', Value: 'ci-practice' },
              { Key: 'Owner', Value: 'stef' },
            ],
          },
        ],
      },
    ]);

    await expect(service.resourcesByTag('Project', 'ci-practice')).resolves.toEqual([
      {
        arn: 'arn:aws:iam::123456789012:user/iam-stef',
        service: 'iam',
        type: 'user',
        region: null,
        accountId: '123456789012',
        name: 'iam-stef',
        tags: [
          { key: 'Project', value: 'ci-practice' },
          { key: 'Owner', value: 'stef' },
        ],
      },
    ]);
    expect((send.mock.calls[0]?.[0] as SentCommand).input).toEqual({
      PaginationToken: undefined,
      TagFilters: [{ Key: 'Project', Values: ['ci-practice'] }],
    });
  });

  it('paginates tag key results', async () => {
    const { service, send } = createService([
      { TagKeys: ['Project'], PaginationToken: 'next' },
      { TagKeys: ['Owner'] },
    ]);

    await expect(service.tagKeys()).resolves.toEqual([
      { key: 'Owner', valueCount: 0 },
      { key: 'Project', valueCount: 0 },
    ]);
    expect(send).toHaveBeenCalledTimes(2);
    expect((send.mock.calls[1]?.[0] as SentCommand).input).toEqual({ PaginationToken: 'next' });
  });

  it('paginates tag value results', async () => {
    const { service, send } = createService([
      { TagValues: ['ci-practice'], PaginationToken: 'next' },
      { TagValues: ['lab'] },
    ]);

    await expect(service.tagValues('Project')).resolves.toHaveLength(2);
    expect(send).toHaveBeenCalledTimes(2);
    expect((send.mock.calls[1]?.[0] as SentCommand).input).toEqual({
      Key: 'Project',
      PaginationToken: 'next',
    });
  });

  it('paginates tagged resource results', async () => {
    const { service, send } = createService([
      {
        PaginationToken: 'next',
        ResourceTagMappingList: [{ ResourceARN: 'arn:aws:s3:::bucket-one', Tags: [] }],
      },
      {
        ResourceTagMappingList: [{ ResourceARN: 'arn:aws:s3:::bucket-two', Tags: [] }],
      },
    ]);

    await expect(service.resourcesByTag('Project', 'ci-practice')).resolves.toHaveLength(2);
    expect(send).toHaveBeenCalledTimes(2);
    expect((send.mock.calls[1]?.[0] as SentCommand).input).toEqual({
      PaginationToken: 'next',
      TagFilters: [{ Key: 'Project', Values: ['ci-practice'] }],
    });
  });

  it('maps AWS access denied errors to readable errors', async () => {
    const { service } = createService([
      Object.assign(new Error('denied'), {
        name: 'AccessDenied',
        $metadata: { httpStatusCode: 403 },
      }),
    ]);

    await expect(service.tagKeys()).rejects.toThrow('AWS access was denied for tag discovery.');
  });
});
