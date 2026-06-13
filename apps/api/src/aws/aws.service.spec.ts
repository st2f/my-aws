import { IAMClient } from '@aws-sdk/client-iam';
import { ResourceGroupsTaggingAPIClient } from '@aws-sdk/client-resource-groups-tagging-api';
import { S3Client } from '@aws-sdk/client-s3';
import { STSClient } from '@aws-sdk/client-sts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '../config/config.service.js';
import { AwsService } from './aws.service.js';

const { fromIniMock } = vi.hoisted(() => ({
  fromIniMock: vi.fn(() => async () => ({
    accessKeyId: 'access-key',
    secretAccessKey: 'secret-key',
  })),
}));

vi.mock('@aws-sdk/credential-providers', () => ({
  fromIni: fromIniMock,
}));

describe('AwsService', () => {
  beforeEach(() => {
    fromIniMock.mockClear();
  });

  it('creates an STS client with the configured region', async () => {
    const service = new AwsService(new ConfigService({ AWS_REGION: 'us-east-1' }));
    const client = service.createStsClient();

    await expect(client.config.region()).resolves.toBe('us-east-1');
    expect(client).toBeInstanceOf(STSClient);
  });

  it('creates an IAM client with the configured region', async () => {
    const service = new AwsService(new ConfigService({ AWS_REGION: 'us-east-1' }));
    const client = service.createIamClient();

    await expect(client.config.region()).resolves.toBe('us-east-1');
    expect(client).toBeInstanceOf(IAMClient);
  });

  it('creates a Resource Groups Tagging API client with the configured region', async () => {
    const service = new AwsService(new ConfigService({ AWS_REGION: 'us-east-1' }));
    const client = service.createResourceGroupsTaggingClient();

    await expect(client.config.region()).resolves.toBe('us-east-1');
    expect(client).toBeInstanceOf(ResourceGroupsTaggingAPIClient);
  });

  it('creates an S3 client with the configured region', async () => {
    const service = new AwsService(new ConfigService({ AWS_REGION: 'us-east-1' }));
    const client = service.createS3Client();

    await expect(client.config.region()).resolves.toBe('us-east-1');
    expect(client).toBeInstanceOf(S3Client);
  });

  it('uses profile credentials when a profile is configured', () => {
    const service = new AwsService(new ConfigService({ AWS_REGION: 'us-east-1', AWS_PROFILE: 'learning' }));

    expect(service.createClientConfig().credentials).toBeDefined();
    expect(fromIniMock).toHaveBeenCalledWith({ profile: 'learning' });
  });

  it('uses the default credential chain when no profile is configured', () => {
    const service = new AwsService(new ConfigService({ AWS_REGION: 'us-east-1' }));

    expect(service.createClientConfig().credentials).toBeUndefined();
    expect(fromIniMock).not.toHaveBeenCalled();
  });
});
