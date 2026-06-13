import { Module } from '@nestjs/common';
import { AwsModule } from '../aws/aws.module.js';
import { ConfigModule } from '../config/config.module.js';
import { AccountController } from './account.controller.js';
import { AccountResolver } from './account.resolver.js';
import { AccountService } from './account.service.js';

@Module({
  imports: [AwsModule, ConfigModule],
  controllers: [AccountController],
  providers: [AccountResolver, AccountService],
  exports: [AccountService],
})
export class AccountModule {}
