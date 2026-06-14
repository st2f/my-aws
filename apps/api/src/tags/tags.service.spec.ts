import { describe, expect, it, vi } from 'vitest';
import type { AwsService } from '../aws/aws.service.js';
import { ConfigService } from '../config/config.service.js';
import { TagsService } from './tags.service.js';

type SentCommand = {
  constructor: {
    name: string;
  };
  input: unknown;
};

function createService(
  resourceGroupsResponses: unknown[],
  options?: { iamResponses?: unknown[]; enabledLookups?: string; cacheTtlSeconds?: string },
) {
  const resourceGroupsSend = vi.fn(async (command: SentCommand) => {
    void command;
    const response = resourceGroupsResponses.shift();

    if (response instanceof Error) {
      throw response;
    }

    return response;
  });
  const iamResponses = options?.iamResponses ?? [];
  const iamSend = vi.fn(async (command: SentCommand) => {
    void command;
    const response = iamResponses.shift();

    if (response instanceof Error) {
      throw response;
    }

    return response;
  });
  const awsService = {
    createResourceGroupsTaggingClient: () => ({ send: resourceGroupsSend }),
    createIamClient: () => ({ send: iamSend }),
  } as unknown as AwsService;
  const configService = new ConfigService({
    MY_AWS_ENABLED_SERVICE_LOOKUPS: options?.enabledLookups ?? 's3,ecr,ssm',
    MY_AWS_TAG_CACHE_TTL_SECONDS: options?.cacheTtlSeconds,
  });

  return {
    service: new TagsService(awsService, configService),
    send: resourceGroupsSend,
    iamSend,
  };
}

describe('TagsService', () => {
  it('returns tag keys from Resource Groups Tagging API', async () => {
    const { service } = createService([
      {
        ResourceTagMappingList: [
          {
            ResourceARN: 'arn:aws:s3:::reports',
            Tags: [
              { Key: 'Environment', Value: 'lab' },
              { Key: 'Project', Value: 'ci-practice' },
            ],
          },
          {
            ResourceARN: 'arn:aws:ssm:eu-north-1:123456789012:parameter/example',
            Tags: [{ Key: 'Project', Value: 'demo' }],
          },
        ],
      },
    ]);

    await expect(service.tagKeys()).resolves.toEqual([
      { key: 'Environment', valueCount: 1 },
      { key: 'Project', valueCount: 2 },
    ]);
  });

  it('returns tag values for a key', async () => {
    const { service, send } = createService([
      {
        ResourceTagMappingList: [
          {
            ResourceARN: 'arn:aws:s3:::reports',
            Tags: [{ Key: 'Project', Value: 'ci-practice' }],
          },
          {
            ResourceARN: 'arn:aws:ssm:eu-north-1:123456789012:parameter/example',
            Tags: [{ Key: 'Project', Value: 'lab' }],
          },
        ],
      },
    ]);

    await expect(service.tagValues('Project')).resolves.toEqual([
      { key: 'Project', value: 'ci-practice', resourceCount: 1 },
      { key: 'Project', value: 'lab', resourceCount: 1 },
    ]);
    expect((send.mock.calls[0]?.[0] as SentCommand).input).toEqual({
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
    });
  });

  it('adds IAM roles and local policies matching a tag key and value when IAM lookup is enabled', async () => {
    const { service, iamSend } = createService([{ ResourceTagMappingList: [] }], {
      enabledLookups: 'iam',
      iamResponses: [
        {
          Roles: [
            {
              Arn: 'arn:aws:iam::123456789012:role/ci-practice-deploy',
              RoleName: 'ci-practice-deploy',
            },
          ],
        },
        {
          Tags: [
            { Key: 'ManagedBy', Value: 'terraform' },
            { Key: 'Project', Value: 'ci-practice' },
          ],
        },
        {
          Policies: [
            {
              Arn: 'arn:aws:iam::123456789012:policy/ci-practice-readonly',
              PolicyName: 'ci-practice-readonly',
            },
          ],
        },
        {
          Tags: [
            { Key: 'ManagedBy', Value: 'terraform' },
            { Key: 'Project', Value: 'ci-practice' },
          ],
        },
      ],
    });

    await expect(service.resourcesByTag('ManagedBy', 'terraform')).resolves.toEqual([
      {
        arn: 'arn:aws:iam::123456789012:role/ci-practice-deploy',
        service: 'iam',
        type: 'role',
        region: null,
        accountId: '123456789012',
        name: 'ci-practice-deploy',
        tags: [
          { key: 'ManagedBy', value: 'terraform' },
          { key: 'Project', value: 'ci-practice' },
        ],
      },
      {
        arn: 'arn:aws:iam::123456789012:policy/ci-practice-readonly',
        service: 'iam',
        type: 'policy',
        region: null,
        accountId: '123456789012',
        name: 'ci-practice-readonly',
        tags: [
          { key: 'ManagedBy', value: 'terraform' },
          { key: 'Project', value: 'ci-practice' },
        ],
      },
    ]);
    expect(iamSend).toHaveBeenCalledTimes(4);
    expect((iamSend.mock.calls[2]?.[0] as SentCommand).input).toEqual({
      Marker: undefined,
      Scope: 'Local',
    });
  });

  it('includes IAM-only tag keys when IAM lookup is enabled', async () => {
    const { service } = createService(
      [
        {
          ResourceTagMappingList: [
            {
              ResourceARN: 'arn:aws:s3:::reports',
              Tags: [{ Key: 'Project', Value: 'ci-practice' }],
            },
          ],
        },
      ],
      {
        enabledLookups: 'iam',
        iamResponses: [
          {
            Roles: [
              {
                Arn: 'arn:aws:iam::123456789012:role/ci-practice-deploy',
                RoleName: 'ci-practice-deploy',
              },
            ],
          },
          { Tags: [{ Key: 'ManagedBy', Value: 'terraform' }] },
          { Policies: [] },
        ],
      },
    );

    await expect(service.tagKeys()).resolves.toEqual([
      { key: 'ManagedBy', valueCount: 1 },
      { key: 'Project', valueCount: 1 },
    ]);
  });

  it('includes IAM-only tag values when IAM lookup is enabled', async () => {
    const { service } = createService([{ ResourceTagMappingList: [] }], {
      enabledLookups: 'iam',
      iamResponses: [
        {
          Roles: [
            {
              Arn: 'arn:aws:iam::123456789012:role/ci-practice-deploy',
              RoleName: 'ci-practice-deploy',
            },
          ],
        },
        { Tags: [{ Key: 'ManagedBy', Value: 'terraform' }] },
        { Policies: [] },
      ],
    });

    await expect(service.tagValues('ManagedBy')).resolves.toEqual([
      { key: 'ManagedBy', value: 'terraform', resourceCount: 1 },
    ]);
  });

  it('paginates tag discovery results for tag keys', async () => {
    const { service, send } = createService([
      {
        PaginationToken: 'next',
        ResourceTagMappingList: [
          {
            ResourceARN: 'arn:aws:s3:::reports',
            Tags: [{ Key: 'Project', Value: 'ci-practice' }],
          },
        ],
      },
      {
        ResourceTagMappingList: [
          {
            ResourceARN: 'arn:aws:ssm:eu-north-1:123456789012:parameter/example',
            Tags: [{ Key: 'Owner', Value: 'stef' }],
          },
        ],
      },
    ]);

    await expect(service.tagKeys()).resolves.toEqual([
      { key: 'Owner', valueCount: 1 },
      { key: 'Project', valueCount: 1 },
    ]);
    expect(send).toHaveBeenCalledTimes(2);
    expect((send.mock.calls[1]?.[0] as SentCommand).input).toEqual({ PaginationToken: 'next' });
  });

  it('paginates tag discovery results for tag values', async () => {
    const { service, send } = createService([
      {
        PaginationToken: 'next',
        ResourceTagMappingList: [
          {
            ResourceARN: 'arn:aws:s3:::reports',
            Tags: [{ Key: 'Project', Value: 'ci-practice' }],
          },
        ],
      },
      {
        ResourceTagMappingList: [
          {
            ResourceARN: 'arn:aws:ssm:eu-north-1:123456789012:parameter/example',
            Tags: [{ Key: 'Project', Value: 'lab' }],
          },
        ],
      },
    ]);

    await expect(service.tagValues('Project')).resolves.toHaveLength(2);
    expect(send).toHaveBeenCalledTimes(2);
    expect((send.mock.calls[1]?.[0] as SentCommand).input).toEqual({
      PaginationToken: 'next',
    });
  });

  it('paginates tagged resource results', async () => {
    const { service, send } = createService([
      {
        PaginationToken: 'next',
        ResourceTagMappingList: [
          {
            ResourceARN: 'arn:aws:s3:::bucket-one',
            Tags: [{ Key: 'Project', Value: 'ci-practice' }],
          },
        ],
      },
      {
        ResourceTagMappingList: [
          {
            ResourceARN: 'arn:aws:s3:::bucket-two',
            Tags: [{ Key: 'Project', Value: 'ci-practice' }],
          },
        ],
      },
    ]);

    await expect(service.resourcesByTag('Project', 'ci-practice')).resolves.toHaveLength(2);
    expect(send).toHaveBeenCalledTimes(2);
    expect((send.mock.calls[1]?.[0] as SentCommand).input).toEqual({
      PaginationToken: 'next',
    });
  });

  it('reuses cached tag discovery before the ttl expires', async () => {
    const { service, send } = createService([
      {
        ResourceTagMappingList: [
          {
            ResourceARN: 'arn:aws:s3:::reports',
            Tags: [{ Key: 'Project', Value: 'ci-practice' }],
          },
        ],
      },
    ]);

    await service.tagKeys();
    await service.tagValues('Project');
    await service.resourcesByTag('Project', 'ci-practice');

    expect(send).toHaveBeenCalledTimes(1);
  });

  it('refreshes cached tag discovery after the ttl expires', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-14T10:00:00Z'));

    try {
      const { service, send } = createService(
        [
          {
            ResourceTagMappingList: [
              {
                ResourceARN: 'arn:aws:s3:::reports',
                Tags: [{ Key: 'Project', Value: 'ci-practice' }],
              },
            ],
          },
          {
            ResourceTagMappingList: [
              {
                ResourceARN: 'arn:aws:s3:::reports',
                Tags: [{ Key: 'Project', Value: 'demo' }],
              },
            ],
          },
        ],
        { cacheTtlSeconds: '60' },
      );

      await expect(service.tagValues('Project')).resolves.toEqual([
        { key: 'Project', value: 'ci-practice', resourceCount: 1 },
      ]);

      vi.setSystemTime(new Date('2026-06-14T10:01:01Z'));

      await expect(service.tagValues('Project')).resolves.toEqual([
        { key: 'Project', value: 'demo', resourceCount: 1 },
      ]);

      expect(send).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('refreshes cached tag discovery when requested', async () => {
    const { service, send } = createService([
      {
        ResourceTagMappingList: [
          {
            ResourceARN: 'arn:aws:s3:::reports',
            Tags: [{ Key: 'Project', Value: 'ci-practice' }],
          },
        ],
      },
      {
        ResourceTagMappingList: [
          {
            ResourceARN: 'arn:aws:s3:::reports',
            Tags: [{ Key: 'Project', Value: 'demo' }],
          },
        ],
      },
    ]);

    await expect(service.tagValues('Project')).resolves.toEqual([
      { key: 'Project', value: 'ci-practice', resourceCount: 1 },
    ]);
    await expect(service.tagValues('Project', true)).resolves.toEqual([
      { key: 'Project', value: 'demo', resourceCount: 1 },
    ]);

    expect(send).toHaveBeenCalledTimes(2);
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
