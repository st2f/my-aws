import { Module } from '@nestjs/common';
import { AwsModule } from '../aws/aws.module.js';
import { ConfigModule } from '../config/config.module.js';
import { TagsResolver } from './tags.resolver.js';
import { TagsService } from './tags.service.js';

@Module({
  imports: [AwsModule, ConfigModule],
  providers: [TagsResolver, TagsService],
  exports: [TagsService],
})
export class TagsModule {}
