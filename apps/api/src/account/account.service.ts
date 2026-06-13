import { ListAccountAliasesCommand } from '@aws-sdk/client-iam';
import { GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AwsService } from '../aws/aws.service.js';
import { ConfigService } from '../config/config.service.js';
import type { AccountInfo } from './account.types.js';
import { toReadableAwsError } from './aws-readable-error.js';

@Injectable()
export class AccountService {
  constructor(
    private readonly awsService: AwsService,
    private readonly configService: ConfigService,
  ) {}

  async getAccountInfo(): Promise<AccountInfo> {
    try {
      const sts = this.awsService.createStsClient();
      const iam = this.awsService.createIamClient();

      const identity = await sts.send(new GetCallerIdentityCommand({}));
      const aliases = await iam.send(new ListAccountAliasesCommand({}));

      if (!identity.Account) {
        throw new InternalServerErrorException('AWS account id was not returned by STS.');
      }

      return {
        accountId: identity.Account,
        alias: aliases.AccountAliases?.[0] ?? null,
        region: this.configService.awsRegion,
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      const profile = this.configService.awsProfile;
      throw toReadableAwsError(error, profile ? { profile } : {});
    }
  }
}
