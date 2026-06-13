import { describe, expect, it, vi } from 'vitest';
import { maskAwsAccountIds } from './account-id-mask';

describe('AWS account id masking', () => {
  it('leaves text unchanged by default', () => {
    expect(maskAwsAccountIds('arn:aws:ecr:eu-north-1:123456789012:repository/app')).toBe(
      'arn:aws:ecr:eu-north-1:123456789012:repository/app',
    );
  });

  it('masks standalone account ids when enabled', () => {
    vi.stubEnv('VITE_MY_AWS_MASK_ACCOUNT_IDS', 'true');

    expect(maskAwsAccountIds('123456789012')).toBe('*****');
  });

  it('masks account ids inside ARNs and names when enabled', () => {
    vi.stubEnv('VITE_MY_AWS_MASK_ACCOUNT_IDS', 'true');

    expect(maskAwsAccountIds('arn:aws:ecr:eu-north-1:123456789012:repository/app')).toBe(
      'arn:aws:ecr:eu-north-1:*****:repository/app',
    );
    expect(maskAwsAccountIds('ci-practice-reports-123456789012')).toBe('ci-practice-reports-*****');
  });
});
