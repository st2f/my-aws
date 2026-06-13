import { Module } from '@nestjs/common';
import { AccountModule } from './account/account.module.js';
import { AppController } from './app.controller.js';

@Module({
  imports: [AccountModule],
  controllers: [AppController],
})
export class AppModule {}
