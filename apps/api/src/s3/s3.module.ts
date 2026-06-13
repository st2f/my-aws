import { Module } from '@nestjs/common';
import { AwsModule } from '../aws/aws.module.js';
import { ConfigModule } from '../config/config.module.js';
import { S3Resolver } from './s3.resolver.js';
import { S3Service } from './s3.service.js';

@Module({
  imports: [AwsModule, ConfigModule],
  providers: [S3Resolver, S3Service],
  exports: [S3Service],
})
export class S3Module {}
