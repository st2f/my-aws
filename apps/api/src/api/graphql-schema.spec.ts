import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../app.module.js';

describe('GraphQL schema', () => {
  let app: INestApplication;
  let queryFields: Record<
    string,
    {
      type: { toString(): string };
      args: ReadonlyArray<{ name: string; type: { toString(): string } }>;
    }
  >;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    queryFields = app.get(GraphQLSchemaHost).schema.getQueryType()?.getFields() ?? {};
  });

  afterAll(async () => {
    await app.close();
  });

  it('exposes accountInfo query', () => {
    expect(queryFields.accountInfo?.type.toString()).toBe('AccountInfo!');
  });

  it('exposes tagKeys query', () => {
    expect(queryFields.tagKeys?.type.toString()).toBe('[TagKeySummary!]!');
    expect(queryFields.tagKeys?.args.map((arg) => [arg.name, arg.type.toString()])).toEqual([
      ['refresh', 'Boolean'],
    ]);
  });

  it('exposes tagValues query', () => {
    expect(queryFields.tagValues?.type.toString()).toBe('[TagValueSummary!]!');
    expect(queryFields.tagValues?.args.map((arg) => [arg.name, arg.type.toString()])).toEqual([
      ['key', 'String!'],
      ['refresh', 'Boolean'],
    ]);
  });

  it('exposes resourcesByTag query', () => {
    expect(queryFields.resourcesByTag?.type.toString()).toBe('[CloudResource!]!');
    expect(queryFields.resourcesByTag?.args.map((arg) => [arg.name, arg.type.toString()])).toEqual([
      ['key', 'String!'],
      ['value', 'String!'],
      ['refresh', 'Boolean'],
    ]);
  });

  it('exposes s3Buckets query', () => {
    expect(queryFields.s3Buckets?.type.toString()).toBe('[S3Bucket!]!');
  });

  it('exposes s3Tree query', () => {
    expect(queryFields.s3Tree?.type.toString()).toBe('S3Tree!');
    expect(queryFields.s3Tree?.args.map((arg) => [arg.name, arg.type.toString()])).toEqual([
      ['bucket', 'String!'],
      ['prefix', 'String'],
    ]);
  });

  it('exposes s3ObjectPreview query', () => {
    expect(queryFields.s3ObjectPreview?.type.toString()).toBe('S3ObjectPreview!');
    expect(queryFields.s3ObjectPreview?.args.map((arg) => [arg.name, arg.type.toString()])).toEqual(
      [
        ['bucket', 'String!'],
        ['key', 'String!'],
      ],
    );
  });
});
