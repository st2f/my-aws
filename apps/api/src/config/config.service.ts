import { Inject, Injectable } from '@nestjs/common';
import type { AppConfig, ServiceLookup } from '@my-aws/shared/src/app-config.js';
import { CONFIG_ENV } from './config-env.token.js';

const serviceLookups: ServiceLookup[] = ['iam', 's3', 'ecr', 'ssm'];

const defaultConfig = {
  aws: {
    region: 'eu-north-1',
  },
  services: {
    lookups: serviceLookups,
  },
  tags: {
    cacheTtlSeconds: 43_200,
  },
  s3: {
    maxObjectsPerBucket: 200,
    previewExtensions: ['.html', '.tf'],
    maxPreviewBytes: 1_000_000,
  },
} satisfies AppConfig;

@Injectable()
export class ConfigService {
  constructor(@Inject(CONFIG_ENV) private readonly env: NodeJS.ProcessEnv = process.env) {}

  get appConfig(): AppConfig {
    return {
      aws: {
        region: this.readString('AWS_REGION', defaultConfig.aws.region),
        ...this.readProfile(),
      },
      services: {
        lookups: this.readServiceLookups(),
      },
      tags: {
        cacheTtlSeconds: this.readPositiveInteger(
          'MY_AWS_TAG_CACHE_TTL_SECONDS',
          defaultConfig.tags.cacheTtlSeconds,
        ),
      },
      s3: {
        maxObjectsPerBucket: this.readPositiveInteger(
          'MY_AWS_S3_MAX_OBJECTS_PER_BUCKET',
          defaultConfig.s3.maxObjectsPerBucket,
        ),
        previewExtensions: this.readPreviewExtensions(),
        maxPreviewBytes: this.readPositiveInteger(
          'MY_AWS_S3_MAX_PREVIEW_BYTES',
          defaultConfig.s3.maxPreviewBytes,
        ),
      },
    };
  }

  get awsRegion() {
    return this.appConfig.aws.region;
  }

  get awsProfile() {
    return this.appConfig.aws.profile;
  }

  get serviceLookups() {
    return this.appConfig.services.lookups;
  }

  get tagCacheTtlSeconds() {
    return this.appConfig.tags.cacheTtlSeconds;
  }

  private readString(name: string, fallback: string) {
    const value = this.env[name]?.trim();
    return value ? value : fallback;
  }

  private readProfile(): Pick<AppConfig['aws'], 'profile'> {
    const value = this.env.AWS_PROFILE?.trim();
    return value ? { profile: value } : {};
  }

  private readServiceLookups() {
    const configured = this.env.MY_AWS_ENABLED_SERVICE_LOOKUPS?.split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    if (!configured?.length) {
      return defaultConfig.services.lookups;
    }

    const enabled = configured.filter((value): value is ServiceLookup =>
      serviceLookups.includes(value as ServiceLookup),
    );

    return enabled.length ? enabled : defaultConfig.services.lookups;
  }

  private readPreviewExtensions() {
    const configured = this.env.MY_AWS_S3_PREVIEW_EXTENSIONS?.split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
      .map((value) => (value.startsWith('.') ? value : `.${value}`));

    return configured?.length ? configured : defaultConfig.s3.previewExtensions;
  }

  private readPositiveInteger(name: string, fallback: number) {
    const parsed = Number(this.env[name]);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }
}
