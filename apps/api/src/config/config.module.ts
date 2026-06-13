import { Module } from '@nestjs/common';
import './load-env.js';
import { CONFIG_ENV } from './config-env.token.js';
import { ConfigService } from './config.service.js';

@Module({
  providers: [
    {
      provide: CONFIG_ENV,
      useValue: process.env,
    },
    ConfigService,
  ],
  exports: [ConfigService],
})
export class ConfigModule {}
