import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('AccountInfo')
export class AccountInfoType {
  @Field()
  accountId!: string;

  @Field(() => String, { nullable: true })
  alias!: string | null;

  @Field()
  region!: string;
}

@ObjectType('TagKeySummary')
export class TagKeySummaryType {
  @Field()
  key!: string;

  @Field()
  valueCount!: number;
}

@ObjectType('TagValueSummary')
export class TagValueSummaryType {
  @Field()
  key!: string;

  @Field()
  value!: string;

  @Field()
  resourceCount!: number;
}

@ObjectType('Tag')
export class TagType {
  @Field()
  key!: string;

  @Field()
  value!: string;
}

@ObjectType('CloudResource')
export class CloudResourceType {
  @Field()
  arn!: string;

  @Field()
  service!: string;

  @Field(() => String, { nullable: true })
  type!: string | null;

  @Field(() => String, { nullable: true })
  region!: string | null;

  @Field(() => String, { nullable: true })
  accountId!: string | null;

  @Field(() => String, { nullable: true })
  name!: string | null;

  @Field(() => [TagType])
  tags!: TagType[];
}

@ObjectType('S3Bucket')
export class S3BucketType {
  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  region!: string | null;

  @Field(() => [TagType])
  tags!: TagType[];
}

@ObjectType('S3TreeNode')
export class S3TreeNodeType {
  @Field()
  key!: string;

  @Field()
  name!: string;

  @Field()
  kind!: string;

  @Field()
  previewable!: boolean;
}

@ObjectType('S3Tree')
export class S3TreeType {
  @Field()
  bucket!: string;

  @Field()
  prefix!: string;

  @Field(() => [S3TreeNodeType])
  nodes!: S3TreeNodeType[];
}

@ObjectType('S3ObjectPreview')
export class S3ObjectPreviewType {
  @Field()
  bucket!: string;

  @Field()
  key!: string;

  @Field()
  contentType!: string;

  @Field()
  content!: string;
}
