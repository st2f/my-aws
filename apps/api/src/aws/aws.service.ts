import { IAMClient } from '@aws-sdk/client-iam';
import { ResourceGroupsTaggingAPIClient } from '@aws-sdk/client-resource-groups-tagging-api';
import { S3Client } from '@aws-sdk/client-s3';
import { STSClient } from '@aws-sdk/client-sts';
import { fromIni } from '@aws-sdk/credential-providers';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service.js';

type AwsClientConfig = {
  region: string;
  credentials?: ReturnType<typeof fromIni>;
};

@Injectable()
export class AwsService {
  constructor(private readonly configService: ConfigService) {}

  createStsClient() {
    return new STSClient(this.createClientConfig());
  }

  createIamClient() {
    return new IAMClient(this.createClientConfig());
  }

  createResourceGroupsTaggingClient() {
    return new ResourceGroupsTaggingAPIClient(this.createClientConfig());
  }

  createS3Client() {
    return new S3Client(this.createClientConfig());
  }

  createClientConfig(): AwsClientConfig {
    const profile = this.configService.awsProfile;

    return {
      region: this.configService.awsRegion,
      ...(profile ? { credentials: fromIni({ profile }) } : {}),
    };
  }
}
