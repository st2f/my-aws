export type TagSummary = {
  key: string;
  value: string;
};

export type TagKeySummary = {
  key: string;
  valueCount: number;
};

export type TagValueSummary = {
  key: string;
  value: string;
  resourceCount: number;
};

export type CloudResource = {
  arn: string;
  service: string;
  type: string | null;
  region: string | null;
  accountId: string | null;
  name: string | null;
  tags: TagSummary[];
};
