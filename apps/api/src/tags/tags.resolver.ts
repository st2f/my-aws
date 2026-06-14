import { Args, Query, Resolver } from '@nestjs/graphql';
import { CloudResourceType, TagKeySummaryType, TagValueSummaryType } from '../api/graphql.types.js';
import { TagsService } from './tags.service.js';

@Resolver()
export class TagsResolver {
  constructor(private readonly tagsService: TagsService) {}

  @Query(() => [TagKeySummaryType])
  tagKeys(@Args('refresh', { nullable: true }) refresh?: boolean) {
    return this.tagsService.tagKeys(refresh);
  }

  @Query(() => [TagValueSummaryType])
  tagValues(@Args('key') key: string, @Args('refresh', { nullable: true }) refresh?: boolean) {
    return this.tagsService.tagValues(key, refresh);
  }

  @Query(() => [CloudResourceType])
  resourcesByTag(
    @Args('key') key: string,
    @Args('value') value: string,
    @Args('refresh', { nullable: true }) refresh?: boolean,
  ) {
    return this.tagsService.resourcesByTag(key, value, refresh);
  }
}
