import {
  ListPoliciesCommand,
  ListPolicyTagsCommand,
  ListRolesCommand,
  ListRoleTagsCommand,
  type Tag as IamTag,
} from '@aws-sdk/client-iam';
import {
  GetResourcesCommand,
  type ResourceTagMapping,
  type Tag,
} from '@aws-sdk/client-resource-groups-tagging-api';
import { Injectable } from '@nestjs/common';
import { AwsService } from '../aws/aws.service.js';
import { ConfigService } from '../config/config.service.js';
import { parseArn } from './arn-parser.js';
import { toReadableTagsAwsError } from './tags-readable-error.js';
import type { CloudResource, TagKeySummary, TagValueSummary } from './tags.types.js';

type TagsSnapshot = {
  expiresAtMs: number;
  resources: CloudResource[];
};

@Injectable()
export class TagsService {
  private snapshot: TagsSnapshot | null = null;
  private snapshotPromise: Promise<TagsSnapshot> | null = null;

  constructor(
    private readonly awsService: AwsService,
    private readonly configService: ConfigService,
  ) {}

  async tagKeys(refresh = false): Promise<TagKeySummary[]> {
    try {
      const { resources } = await this.tagsSnapshot(refresh);
      const valuesByKey = valuesByTagKey(resources);

      return uniqueSorted([...valuesByKey.keys()]).map((key) => ({
        key,
        valueCount: valuesByKey.get(key)?.size ?? 0,
      }));
    } catch (error) {
      throw toReadableTagsAwsError(error);
    }
  }

  async tagValues(key: string, refresh = false): Promise<TagValueSummary[]> {
    try {
      const { resources } = await this.tagsSnapshot(refresh);
      const counts = new Map<string, number>();

      for (const resource of resources) {
        const valuesOnResource = uniqueSorted(
          resource.tags.filter((tag) => tag.key === key).map((tag) => tag.value),
        );

        for (const value of valuesOnResource) {
          counts.set(value, (counts.get(value) ?? 0) + 1);
        }
      }

      return uniqueSorted([...counts.keys()]).map((value) => ({
        key,
        value,
        resourceCount: counts.get(value) ?? 0,
      }));
    } catch (error) {
      throw toReadableTagsAwsError(error);
    }
  }

  async resourcesByTag(key: string, value: string, refresh = false): Promise<CloudResource[]> {
    try {
      const { resources } = await this.tagsSnapshot(refresh);

      return resources.filter((resource) =>
        resource.tags.some((tag) => tag.key === key && tag.value === value),
      );
    } catch (error) {
      throw toReadableTagsAwsError(error);
    }
  }

  private async tagsSnapshot(refresh: boolean): Promise<TagsSnapshot> {
    const now = Date.now();

    if (!refresh && this.snapshot && this.snapshot.expiresAtMs > now) {
      return this.snapshot;
    }

    if (!refresh && this.snapshotPromise) {
      return this.snapshotPromise;
    }

    this.snapshotPromise = this.buildTagsSnapshot(now);

    try {
      this.snapshot = await this.snapshotPromise;
      return this.snapshot;
    } finally {
      this.snapshotPromise = null;
    }
  }

  private async buildTagsSnapshot(now: number): Promise<TagsSnapshot> {
    const resources = await this.allTaggedResources();

    if (this.isServiceLookupEnabled('iam')) {
      resources.push(...(await this.iamResources()));
    }

    return {
      expiresAtMs: now + this.configService.tagCacheTtlSeconds * 1000,
      resources: uniqueResources(resources),
    };
  }

  private async allTaggedResources(): Promise<CloudResource[]> {
    const client = this.awsService.createResourceGroupsTaggingClient();
    const mappings: ResourceTagMapping[] = [];
    let paginationToken: string | undefined;

    do {
      const response = await client.send(
        new GetResourcesCommand({
          PaginationToken: paginationToken,
        }),
      );
      mappings.push(...(response.ResourceTagMappingList ?? []));
      paginationToken = response.PaginationToken;
    } while (paginationToken);

    return mappings
      .map((mapping) => this.toCloudResource(mapping))
      .filter((resource): resource is CloudResource => resource !== null);
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

  private isServiceLookupEnabled(service: 'iam') {
    return this.configService.serviceLookups.includes(service);
  }

  private async iamResources(): Promise<CloudResource[]> {
    const roles = await this.iamRoleResources();
    const policies = await this.iamPolicyResources();

    return [...roles, ...policies];
  }

  private async iamRoleResources(): Promise<CloudResource[]> {
    const client = this.awsService.createIamClient();
    const resources: CloudResource[] = [];
    let marker: string | undefined;

    do {
      const response = await client.send(new ListRolesCommand({ Marker: marker }));

      for (const role of response.Roles ?? []) {
        if (!role.Arn || !role.RoleName) {
          continue;
        }

        const tags = await this.iamRoleTags(role.RoleName);
        resources.push(this.toIamCloudResource(role.Arn, tags));
      }

      marker = response.IsTruncated ? response.Marker : undefined;
    } while (marker);

    return resources;
  }

  private async iamRoleTags(roleName: string) {
    const client = this.awsService.createIamClient();
    const tags: IamTag[] = [];
    let marker: string | undefined;

    do {
      const response = await client.send(
        new ListRoleTagsCommand({ RoleName: roleName, Marker: marker }),
      );
      tags.push(...(response.Tags ?? []));
      marker = response.IsTruncated ? response.Marker : undefined;
    } while (marker);

    return tags.filter(hasIamKeyAndValue).map((tag) => ({
      key: tag.Key,
      value: tag.Value,
    }));
  }

  private async iamPolicyResources(): Promise<CloudResource[]> {
    const client = this.awsService.createIamClient();
    const resources: CloudResource[] = [];
    let marker: string | undefined;

    do {
      const response = await client.send(
        new ListPoliciesCommand({ Marker: marker, Scope: 'Local' }),
      );

      for (const policy of response.Policies ?? []) {
        if (!policy.Arn) {
          continue;
        }

        const tags = await this.iamPolicyTags(policy.Arn);
        resources.push(this.toIamCloudResource(policy.Arn, tags));
      }

      marker = response.IsTruncated ? response.Marker : undefined;
    } while (marker);

    return resources;
  }

  private async iamPolicyTags(policyArn: string) {
    const client = this.awsService.createIamClient();
    const tags: IamTag[] = [];
    let marker: string | undefined;

    do {
      const response = await client.send(
        new ListPolicyTagsCommand({ PolicyArn: policyArn, Marker: marker }),
      );
      tags.push(...(response.Tags ?? []));
      marker = response.IsTruncated ? response.Marker : undefined;
    } while (marker);

    return tags.filter(hasIamKeyAndValue).map((tag) => ({
      key: tag.Key,
      value: tag.Value,
    }));
  }

  private toIamCloudResource(arn: string, tags: CloudResource['tags']): CloudResource {
    const parsedArn = parseArn(arn);

    return {
      arn,
      service: parsedArn.service,
      type: parsedArn.type,
      region: parsedArn.region,
      accountId: parsedArn.accountId,
      name: parsedArn.name,
      tags,
    };
  }
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function uniqueResources(resources: CloudResource[]) {
  return [...new Map(resources.map((resource) => [resource.arn, resource])).values()];
}

function valuesByTagKey(resources: CloudResource[]) {
  const values = new Map<string, Set<string>>();

  for (const resource of resources) {
    for (const tag of resource.tags) {
      values.set(tag.key, (values.get(tag.key) ?? new Set()).add(tag.value));
    }
  }

  return values;
}

function hasKeyAndValue(tag: Tag): tag is Tag & { Key: string; Value: string } {
  return tag.Key !== undefined && tag.Value !== undefined;
}

function hasIamKeyAndValue(tag: IamTag): tag is IamTag & { Key: string; Value: string } {
  return tag.Key !== undefined && tag.Value !== undefined;
}
