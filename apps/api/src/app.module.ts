import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { AccountModule } from './account/account.module.js';
import { ApiModule } from './api/api.module.js';
import { AppController } from './app.controller.js';
import { graphqlConfig } from './graphql.config.js';
import { S3Module } from './s3/s3.module.js';
import { TagsModule } from './tags/tags.module.js';

@Module({
  imports: [
    GraphQLModule.forRoot(graphqlConfig),
    AccountModule,
    ApiModule,
    S3Module,
    TagsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
