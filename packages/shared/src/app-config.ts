// These service lookups are implemented by the app. .env can enable a subset,
// but adding a value only in .env does not add backend support.
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
