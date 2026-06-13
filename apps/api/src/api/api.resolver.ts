import { Args, Query, Resolver } from '@nestjs/graphql';
import { NotImplementedException } from '@nestjs/common';
import {
  CloudResourceType,
  S3BucketType,
  S3ObjectPreviewType,
  S3TreeType,
  TagKeySummaryType,
  TagValueSummaryType,
} from './graphql.types.js';

@Resolver()
export class ApiResolver {
  @Query(() => [TagKeySummaryType])
  tagKeys() {
    throw new NotImplementedException('tagKeys will be implemented in Phase 3.');
  }

  @Query(() => [TagValueSummaryType])
  tagValues(@Args('key') _key: string) {
    void _key;
    throw new NotImplementedException('tagValues will be implemented in Phase 3.');
  }

  @Query(() => [CloudResourceType])
  resourcesByTag(@Args('key') _key: string, @Args('value') _value: string) {
    void _key;
    void _value;
    throw new NotImplementedException('resourcesByTag will be implemented in Phase 3.');
  }

  @Query(() => [S3BucketType])
  s3Buckets() {
    throw new NotImplementedException('s3Buckets will be implemented in Phase 4.');
  }

  @Query(() => S3TreeType)
  s3Tree(@Args('bucket') _bucket: string, @Args('prefix', { nullable: true }) _prefix?: string) {
    void _bucket;
    void _prefix;
    throw new NotImplementedException('s3Tree will be implemented in Phase 4.');
  }

  @Query(() => S3ObjectPreviewType)
  s3ObjectPreview(@Args('bucket') _bucket: string, @Args('key') _key: string) {
    void _bucket;
    void _key;
    throw new NotImplementedException('s3ObjectPreview will be implemented in Phase 4.');
  }
}
