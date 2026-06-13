const awsAccountIdPattern = /\b\d{12}\b/g;
const maskedAccountId = '*****';

export function maskAwsAccountIds(value: string) {
  if (!shouldMaskAwsAccountIds()) {
    return value;
  }

  return value.replace(awsAccountIdPattern, maskedAccountId);
}

function shouldMaskAwsAccountIds() {
  return ['1', 'true', 'yes'].includes(import.meta.env.VITE_MY_AWS_MASK_ACCOUNT_IDS?.toLowerCase() ?? '');
}
