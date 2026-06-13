import {
  GetBucketTaggingCommand,
  GetObjectCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
  type Tag,
} from '@aws-sdk/client-s3';
import { BadRequestException, Injectable } from '@nestjs/common';
import { AwsService } from '../aws/aws.service.js';
import { ConfigService } from '../config/config.service.js';
import { isDeniedOrTagUnavailable, toReadableS3AwsError } from './s3-readable-error.js';
import { buildS3Tree, isPreviewableKey } from './s3-tree.js';
import type { S3Bucket, S3ObjectPreview, S3Tree } from './s3.types.js';

@Injectable()
export class S3Service {
  constructor(
    private readonly awsService: AwsService,
    private readonly configService: ConfigService,
  ) {}

  async s3Buckets(): Promise<S3Bucket[]> {
    try {
      const client = this.awsService.createS3Client();
      const response = await client.send(new ListBucketsCommand({}));

      return Promise.all(
        (response.Buckets ?? [])
          .filter((bucket) => bucket.Name !== undefined)
          .map(async (bucket) => ({
            name: bucket.Name ?? '',
            region: null,
            tags: await this.getBucketTags(bucket.Name ?? ''),
          })),
      );
    } catch (error) {
      throw toReadableS3AwsError(error);
    }
  }

  async s3Tree(bucket: string, prefix = ''): Promise<S3Tree> {
    try {
      const response = await this.awsService.createS3Client().send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          Delimiter: '/',
          MaxKeys: this.configService.appConfig.s3.maxObjectsPerBucket,
        }),
      );

      return buildS3Tree({
        bucket,
        prefix,
        commonPrefixes: response.CommonPrefixes ?? [],
        objects: response.Contents ?? [],
        previewExtensions: this.configService.appConfig.s3.previewExtensions,
      });
    } catch (error) {
      throw toReadableS3AwsError(error);
    }
  }

  async s3ObjectPreview(bucket: string, key: string): Promise<S3ObjectPreview> {
    const s3Config = this.configService.appConfig.s3;

    if (!isPreviewableKey(key, s3Config.previewExtensions)) {
      throw new BadRequestException(`Unsupported preview extension for "${key}".`);
    }

    try {
      const response = await this.awsService.createS3Client().send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
          Range: `bytes=0-${s3Config.maxPreviewBytes - 1}`,
        }),
      );
      const bytes = await bodyToBytes(response.Body);

      if (bytes.byteLength > s3Config.maxPreviewBytes) {
        throw new BadRequestException(`Object preview exceeds ${s3Config.maxPreviewBytes} bytes.`);
      }

      return {
        bucket,
        key,
        contentType: response.ContentType ?? 'text/plain',
        content: new TextDecoder().decode(bytes),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw toReadableS3AwsError(error);
    }
  }

  private async getBucketTags(bucket: string) {
    try {
      const response = await this.awsService.createS3Client().send(new GetBucketTaggingCommand({ Bucket: bucket }));

      return (response.TagSet ?? []).filter(hasKeyAndValue).map((tag) => ({
        key: tag.Key,
        value: tag.Value,
      }));
    } catch (error) {
      if (isDeniedOrTagUnavailable(error)) {
        return [];
      }

      throw error;
    }
  }
}

function hasKeyAndValue(tag: Tag): tag is Tag & { Key: string; Value: string } {
  return tag.Key !== undefined && tag.Value !== undefined;
}

async function bodyToBytes(body: unknown): Promise<Uint8Array> {
  if (!body) {
    return new Uint8Array();
  }

  if (typeof (body as { transformToByteArray?: unknown }).transformToByteArray === 'function') {
    return (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
  }

  if (isAsyncIterable(body)) {
    const chunks: Uint8Array[] = [];
    for await (const chunk of body) {
      chunks.push(chunk instanceof Uint8Array ? chunk : new TextEncoder().encode(String(chunk)));
    }

    return concatBytes(chunks);
  }

  return new TextEncoder().encode(String(body));
}

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return typeof value === 'object' && value !== null && Symbol.asyncIterator in value;
}

function concatBytes(chunks: Uint8Array[]) {
  const length = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  const result = new Uint8Array(length);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return result;
}
