import type { _Object, CommonPrefix } from '@aws-sdk/client-s3';
import type { S3Tree, S3TreeNode } from './s3.types.js';

export function buildS3Tree({
  bucket,
  prefix = '',
  commonPrefixes = [],
  objects = [],
  previewExtensions,
}: {
  bucket: string;
  prefix?: string;
  commonPrefixes?: CommonPrefix[];
  objects?: _Object[];
  previewExtensions: string[];
}): S3Tree {
  return {
    bucket,
    prefix,
    nodes: [
      ...commonPrefixes.flatMap((commonPrefix) => toDirectoryNode(commonPrefix)),
      ...objects.flatMap((object) => toFileNode(object, previewExtensions)),
    ],
  };
}

export function isPreviewableKey(key: string, previewExtensions: string[]) {
  const normalizedKey = key.toLowerCase();
  return previewExtensions.some((extension) => normalizedKey.endsWith(extension.toLowerCase()));
}

function toDirectoryNode(commonPrefix: CommonPrefix): S3TreeNode[] {
  if (!commonPrefix.Prefix) {
    return [];
  }

  return [
    {
      key: commonPrefix.Prefix,
      name: displayName(commonPrefix.Prefix),
      kind: 'directory',
      previewable: false,
    },
  ];
}

function toFileNode(object: _Object, previewExtensions: string[]): S3TreeNode[] {
  if (!object.Key || object.Key.endsWith('/')) {
    return [];
  }

  return [
    {
      key: object.Key,
      name: displayName(object.Key),
      kind: 'file',
      previewable: isPreviewableKey(object.Key, previewExtensions),
    },
  ];
}

function displayName(key: string) {
  const withoutTrailingSlash = key.endsWith('/') ? key.slice(0, -1) : key;
  return withoutTrailingSlash.split('/').at(-1) ?? withoutTrailingSlash;
}
