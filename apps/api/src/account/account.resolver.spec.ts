import { ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { AccountService } from './account.service.js';
import { AccountResolver } from './account.resolver.js';

describe('AccountResolver', () => {
  it('returns account info from AccountService', async () => {
    const account = {
      accountId: '123456789012',
      alias: 'learning-account',
      region: 'eu-north-1',
    };
    const accountService = {
      getAccountInfo: vi.fn(async () => account),
    } as unknown as AccountService;
    const resolver = new AccountResolver(accountService);

    await expect(resolver.accountInfo()).resolves.toEqual(account);
    expect(accountService.getAccountInfo).toHaveBeenCalledOnce();
  });

  it('maps account service errors to readable GraphQL errors', async () => {
    const error = new ServiceUnavailableException('AWS credentials could not be loaded.');
    const accountService = {
      getAccountInfo: vi.fn(async () => {
        throw error;
      }),
    } as unknown as AccountService;
    const resolver = new AccountResolver(accountService);

    await expect(resolver.accountInfo()).rejects.toThrow('AWS credentials could not be loaded.');
  });
});
