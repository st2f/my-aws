export type S3Tag = {
  key: string;
  value: string;
};

export type S3Bucket = {
  name: string;
  region: string | null;
  tags: S3Tag[];
};

export type S3TreeNodeKind = 'directory' | 'file';

export type S3TreeNode = {
  key: string;
  name: string;
  kind: S3TreeNodeKind;
  previewable: boolean;
};

export type S3Tree = {
  bucket: string;
  prefix: string;
  nodes: S3TreeNode[];
};

export type S3ObjectPreview = {
  bucket: string;
  key: string;
  contentType: string;
  content: string;
};
