export type ServiceLookup = 'iam' | 's3' | 'ecr' | 'ssm';

export type AppConfig = {
  aws: {
    region: string;
    profile?: string;
  };
  services: {
    lookups: ServiceLookup[];
  };
  s3: {
    maxObjectsPerBucket: number;
    previewExtensions: string[];
    maxPreviewBytes: number;
  };
};

export const defaultAppConfig: AppConfig = {
  aws: {
    region: 'eu-north-1',
    profile: 'default',
  },
  services: {
    lookups: ['iam', 's3', 'ecr', 'ssm'],
  },
  s3: {
    maxObjectsPerBucket: 200,
    previewExtensions: ['.html', '.tf'],
    maxPreviewBytes: 1_000_000,
  },
};
