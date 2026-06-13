import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module.js';
import { AwsService } from './aws.service.js';

@Module({
  imports: [ConfigModule],
  providers: [AwsService],
  exports: [AwsService],
})
export class AwsModule {}
