import { Args, Query, Resolver } from '@nestjs/graphql';
import { S3BucketType, S3ObjectPreviewType, S3TreeType } from '../api/graphql.types.js';
import { S3Service } from './s3.service.js';

@Resolver()
export class S3Resolver {
  constructor(private readonly s3Service: S3Service) {}

  @Query(() => [S3BucketType])
  s3Buckets() {
    return this.s3Service.s3Buckets();
  }

  @Query(() => S3TreeType)
  s3Tree(@Args('bucket') bucket: string, @Args('prefix', { nullable: true }) prefix?: string) {
    return this.s3Service.s3Tree(bucket, prefix);
  }

  @Query(() => S3ObjectPreviewType)
  s3ObjectPreview(@Args('bucket') bucket: string, @Args('key') key: string) {
    return this.s3Service.s3ObjectPreview(bucket, key);
  }
}
