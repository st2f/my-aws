import { InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';

type AwsErrorLike = Error & {
  Code?: string;
  code?: string;
  $metadata?: {
    httpStatusCode?: number;
  };
};

export function toReadableAwsError(error: unknown, options: { profile?: string } = {}) {
  const awsError = error as Partial<AwsErrorLike>;
  const name = awsError.name ?? '';
  const code = awsError.Code ?? awsError.code ?? '';
  const message = awsError.message ?? '';
  const statusCode = awsError.$metadata?.httpStatusCode;

  if (name.includes('CredentialsProviderError') || code.includes('Credentials') || message.includes('credentials')) {
    return new ServiceUnavailableException(
      options.profile
        ? `AWS credentials could not be loaded for profile "${options.profile}".`
        : 'AWS credentials are missing or could not be loaded.',
    );
  }

  if (statusCode === 403 || name === 'AccessDenied' || code === 'AccessDenied') {
    return new ServiceUnavailableException('AWS access was denied for the requested account lookup.');
  }

  return new InternalServerErrorException('AWS account lookup failed.');
}
