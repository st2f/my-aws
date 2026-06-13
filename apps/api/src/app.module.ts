import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { AccountModule } from './account/account.module.js';
import { ApiModule } from './api/api.module.js';
import { AppController } from './app.controller.js';
import { graphqlConfig } from './graphql.config.js';

@Module({
  imports: [
    GraphQLModule.forRoot(graphqlConfig),
    AccountModule,
    ApiModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
