import { Controller, Get } from '@nestjs/common';
import { AccountService } from './account.service.js';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  getAccountInfo() {
    return this.accountService.getAccountInfo();
  }
}
