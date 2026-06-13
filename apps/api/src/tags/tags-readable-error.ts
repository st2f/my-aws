import { InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';

type AwsErrorLike = Error & {
  Code?: string;
  code?: string;
  $metadata?: {
    httpStatusCode?: number;
  };
};

export function toReadableTagsAwsError(error: unknown) {
  const awsError = error as Partial<AwsErrorLike>;
  const name = awsError.name ?? '';
  const code = awsError.Code ?? awsError.code ?? '';
  const statusCode = awsError.$metadata?.httpStatusCode;

  if (statusCode === 403 || name === 'AccessDenied' || code === 'AccessDenied') {
    return new ServiceUnavailableException('AWS access was denied for tag discovery.');
  }

  return new InternalServerErrorException('AWS tag discovery failed.');
}
