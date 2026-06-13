import {
  GetResourcesCommand,
  GetTagKeysCommand,
  GetTagValuesCommand,
  type ResourceTagMapping,
  type Tag,
} from '@aws-sdk/client-resource-groups-tagging-api';
import { Injectable } from '@nestjs/common';
import { AwsService } from '../aws/aws.service.js';
import { parseArn } from './arn-parser.js';
import { toReadableTagsAwsError } from './tags-readable-error.js';
import type { CloudResource, TagKeySummary, TagValueSummary } from './tags.types.js';

@Injectable()
export class TagsService {
  constructor(private readonly awsService: AwsService) {}

  async tagKeys(): Promise<TagKeySummary[]> {
    try {
      const client = this.awsService.createResourceGroupsTaggingClient();
      const keys: string[] = [];
      let paginationToken: string | undefined;

      do {
        const response = await client.send(new GetTagKeysCommand({ PaginationToken: paginationToken }));
        keys.push(...(response.TagKeys ?? []));
        paginationToken = response.PaginationToken;
      } while (paginationToken);

      return uniqueSorted(keys).map((key) => ({ key, valueCount: 0 }));
    } catch (error) {
      throw toReadableTagsAwsError(error);
    }
  }

  async tagValues(key: string): Promise<TagValueSummary[]> {
    try {
      const client = this.awsService.createResourceGroupsTaggingClient();
      const values: string[] = [];
      let paginationToken: string | undefined;

      do {
        const response = await client.send(new GetTagValuesCommand({ Key: key, PaginationToken: paginationToken }));
        values.push(...(response.TagValues ?? []));
        paginationToken = response.PaginationToken;
      } while (paginationToken);

      return uniqueSorted(values).map((value) => ({ key, value, resourceCount: 0 }));
    } catch (error) {
      throw toReadableTagsAwsError(error);
    }
  }

  async resourcesByTag(key: string, value: string): Promise<CloudResource[]> {
    try {
      const client = this.awsService.createResourceGroupsTaggingClient();
      const mappings: ResourceTagMapping[] = [];
      let paginationToken: string | undefined;

      do {
        const response = await client.send(
          new GetResourcesCommand({
            PaginationToken: paginationToken,
            TagFilters: [
              {
                Key: key,
                Values: [value],
              },
            ],
          }),
        );
        mappings.push(...(response.ResourceTagMappingList ?? []));
        paginationToken = response.PaginationToken;
      } while (paginationToken);

      return mappings
        .map((mapping) => this.toCloudResource(mapping))
        .filter((resource): resource is CloudResource => resource !== null);
    } catch (error) {
      throw toReadableTagsAwsError(error);
    }
  }

  private toCloudResource(mapping: ResourceTagMapping): CloudResource | null {
    if (!mapping.ResourceARN) {
      return null;
    }

    const parsedArn = parseArn(mapping.ResourceARN);

    return {
      arn: mapping.ResourceARN,
      service: parsedArn.service,
      type: parsedArn.type,
      region: parsedArn.region,
      accountId: parsedArn.accountId,
      name: parsedArn.name,
      tags: (mapping.Tags ?? []).filter(hasKeyAndValue).map((tag) => ({
        key: tag.Key,
        value: tag.Value,
      })),
    };
  }
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function hasKeyAndValue(tag: Tag): tag is Tag & { Key: string; Value: string } {
  return tag.Key !== undefined && tag.Value !== undefined;
}
