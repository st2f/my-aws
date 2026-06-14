import { describe, expect, it } from 'vitest';
import { ConfigService } from './config.service.js';

describe('ConfigService', () => {
  it('reads AWS_REGION from the environment', () => {
    const service = new ConfigService({ AWS_REGION: 'us-east-1' });

    expect(service.appConfig.aws.region).toBe('us-east-1');
  });

  it('uses AWS_PROFILE only when configured', () => {
    const withProfile = new ConfigService({ AWS_REGION: 'eu-west-1', AWS_PROFILE: 'learning' });
    const withoutProfile = new ConfigService({ AWS_REGION: 'eu-west-1', AWS_PROFILE: '' });

    expect(withProfile.appConfig.aws.profile).toBe('learning');
    expect(withoutProfile.appConfig.aws.profile).toBeUndefined();
  });

  it('parses enabled service lookups', () => {
    const service = new ConfigService({
      MY_AWS_ENABLED_SERVICE_LOOKUPS: 'iam, s3,unknown,SSM',
    });

    expect(service.appConfig.services.lookups).toEqual(['iam', 's3', 'ssm']);
  });

  it('parses tag cache ttl', () => {
    const service = new ConfigService({
      MY_AWS_TAG_CACHE_TTL_SECONDS: '60',
    });

    expect(service.appConfig.tags.cacheTtlSeconds).toBe(60);
    expect(service.tagCacheTtlSeconds).toBe(60);
  });

  it('parses S3 limits and preview extensions', () => {
    const service = new ConfigService({
      MY_AWS_S3_MAX_OBJECTS_PER_BUCKET: '50',
      MY_AWS_S3_PREVIEW_EXTENSIONS: 'html, .tf, JSON',
      MY_AWS_S3_MAX_PREVIEW_BYTES: '5000',
    });

    expect(service.appConfig.s3).toEqual({
      maxObjectsPerBucket: 50,
      previewExtensions: ['.html', '.tf', '.json'],
      maxPreviewBytes: 5000,
    });
  });

  it('falls back to defaults when environment values are missing', () => {
    const service = new ConfigService({});

    expect(service.appConfig).toEqual({
      aws: {
        region: 'eu-north-1',
      },
      services: {
        lookups: ['iam', 's3', 'ecr', 'ssm'],
      },
      tags: {
        cacheTtlSeconds: 43_200,
      },
      s3: {
        maxObjectsPerBucket: 200,
        previewExtensions: ['.html', '.tf'],
        maxPreviewBytes: 1_000_000,
      },
    });
  });
});
