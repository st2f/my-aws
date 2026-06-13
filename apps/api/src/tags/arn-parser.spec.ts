import { describe, expect, it } from 'vitest';
import { parseArn } from './arn-parser.js';

describe('ArnParser', () => {
  it('parses service from ARN', () => {
    expect(parseArn('arn:aws:iam::123456789012:user/iam-stef')).toMatchObject({
      service: 'iam',
    });
  });

  it('parses region from ARN when present', () => {
    expect(parseArn('arn:aws:ecr:eu-north-1:123456789012:repository/demo')).toMatchObject({
      region: 'eu-north-1',
    });
  });

  it('parses account id from ARN when present', () => {
    expect(parseArn('arn:aws:ssm:eu-north-1:123456789012:parameter/app/name')).toMatchObject({
      accountId: '123456789012',
    });
  });

  it('parses resource type and name where possible', () => {
    expect(parseArn('arn:aws:iam::123456789012:user/iam-stef')).toMatchObject({
      type: 'user',
      name: 'iam-stef',
    });
    expect(parseArn('arn:aws:lambda:eu-north-1:123456789012:function:demo')).toMatchObject({
      type: 'function',
      name: 'demo',
    });
  });

  it('handles ARNs without region or account id', () => {
    expect(parseArn('arn:aws:s3:::terraform-state-stef')).toEqual({
      service: 's3',
      type: null,
      region: null,
      accountId: null,
      name: 'terraform-state-stef',
    });
  });
});
