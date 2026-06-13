import { ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { AwsService } from '../aws/aws.service.js';
import { ConfigService } from '../config/config.service.js';
import { AccountService } from './account.service.js';

function createService({
  accountId = '123456789012',
  aliases = ['my-account'],
  stsError,
  iamError,
}: {
  accountId?: string;
  aliases?: string[];
  stsError?: unknown;
  iamError?: unknown;
} = {}) {
  const sts = {
    send: vi.fn(async () => {
      if (stsError) {
        throw stsError;
      }

      return { Account: accountId };
    }),
  };
  const iam = {
    send: vi.fn(async () => {
      if (iamError) {
        throw iamError;
      }

      return { AccountAliases: aliases };
    }),
  };
  const awsService = {
    createStsClient: () => sts,
    createIamClient: () => iam,
  } as unknown as AwsService;

  return {
    service: new AccountService(awsService, new ConfigService({ AWS_REGION: 'us-west-2', AWS_PROFILE: 'default' })),
    sts,
    iam,
  };
}

describe('AccountService', () => {
  it('returns account id from STS', async () => {
    const { service } = createService({ accountId: '210987654321' });

    await expect(service.getAccountInfo()).resolves.toMatchObject({
      accountId: '210987654321',
    });
  });

  it('returns account alias from IAM when available', async () => {
    const { service } = createService({ aliases: ['learning-account'] });

    await expect(service.getAccountInfo()).resolves.toMatchObject({
      alias: 'learning-account',
    });
  });

  it('returns null alias when no alias exists', async () => {
    const { service } = createService({ aliases: [] });

    await expect(service.getAccountInfo()).resolves.toMatchObject({
      alias: null,
    });
  });

  it('returns the active region from config', async () => {
    const { service } = createService();

    await expect(service.getAccountInfo()).resolves.toMatchObject({
      region: 'us-west-2',
    });
  });

  it('maps missing credentials to a readable error', async () => {
    const { service } = createService({
      stsError: Object.assign(new Error('Could not load credentials'), {
        name: 'CredentialsProviderError',
      }),
    });

    await expect(service.getAccountInfo()).rejects.toThrow(ServiceUnavailableException);
    await expect(service.getAccountInfo()).rejects.toThrow('AWS credentials could not be loaded for profile "default".');
  });

  it('maps access denied to a readable error', async () => {
    const { service } = createService({
      iamError: Object.assign(new Error('denied'), {
        name: 'AccessDenied',
        $metadata: { httpStatusCode: 403 },
      }),
    });

    await expect(service.getAccountInfo()).rejects.toThrow(ServiceUnavailableException);
    await expect(service.getAccountInfo()).rejects.toThrow('AWS access was denied for the requested account lookup.');
  });
});
