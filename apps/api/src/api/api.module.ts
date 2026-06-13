import { Module } from '@nestjs/common';
import { ApiResolver } from './api.resolver.js';

@Module({
  providers: [ApiResolver],
})
export class ApiModule {}
