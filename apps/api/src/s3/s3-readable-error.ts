import { InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';

type AwsErrorLike = Error & {
  Code?: string;
  code?: string;
  $metadata?: {
    httpStatusCode?: number;
  };
};

export function toReadableS3AwsError(error: unknown) {
  const awsError = error as Partial<AwsErrorLike>;
  const name = awsError.name ?? '';
  const code = awsError.Code ?? awsError.code ?? '';
  const statusCode = awsError.$metadata?.httpStatusCode;

  if (statusCode === 403 || name === 'AccessDenied' || code === 'AccessDenied') {
    return new ServiceUnavailableException('AWS access was denied for S3.');
  }

  return new InternalServerErrorException('AWS S3 lookup failed.');
}

export function isDeniedOrTagUnavailable(error: unknown) {
  const awsError = error as Partial<AwsErrorLike>;
  const name = awsError.name ?? '';
  const code = awsError.Code ?? awsError.code ?? '';
  const statusCode = awsError.$metadata?.httpStatusCode;

  return statusCode === 403 || name === 'AccessDenied' || code === 'AccessDenied' || name === 'NoSuchTagSet';
}
