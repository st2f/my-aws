import { Args, Query, Resolver } from '@nestjs/graphql';
import { CloudResourceType, TagKeySummaryType, TagValueSummaryType } from '../api/graphql.types.js';
import { TagsService } from './tags.service.js';

@Resolver()
export class TagsResolver {
  constructor(private readonly tagsService: TagsService) {}

  @Query(() => [TagKeySummaryType])
  tagKeys() {
    return this.tagsService.tagKeys();
  }

  @Query(() => [TagValueSummaryType])
  tagValues(@Args('key') key: string) {
    return this.tagsService.tagValues(key);
  }

  @Query(() => [CloudResourceType])
  resourcesByTag(@Args('key') key: string, @Args('value') value: string) {
    return this.tagsService.resourcesByTag(key, value);
  }
}
