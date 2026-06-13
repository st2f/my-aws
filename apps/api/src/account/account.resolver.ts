import { Query, Resolver } from '@nestjs/graphql';
import { AccountInfoType } from '../api/graphql.types.js';
import { AccountService } from './account.service.js';

@Resolver(() => AccountInfoType)
export class AccountResolver {
  constructor(private readonly accountService: AccountService) {}

  @Query(() => AccountInfoType)
  accountInfo() {
    return this.accountService.getAccountInfo();
  }
}
