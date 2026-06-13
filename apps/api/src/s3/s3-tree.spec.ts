import { describe, expect, it } from 'vitest';
import { buildS3Tree } from './s3-tree.js';

describe('S3 tree builder', () => {
  it('keeps the requested bucket and prefix', () => {
    expect(buildS3Tree({ bucket: 'reports', prefix: 'lab/', previewExtensions: [] })).toMatchObject({
      bucket: 'reports',
      prefix: 'lab/',
    });
  });

  it('maps common prefixes to directory nodes', () => {
    expect(
      buildS3Tree({
        bucket: 'reports',
        commonPrefixes: [{ Prefix: 'lab/' }],
        previewExtensions: [],
      }).nodes,
    ).toEqual([{ key: 'lab/', name: 'lab', kind: 'directory', previewable: false }]);
  });

  it('maps objects to file nodes', () => {
    expect(
      buildS3Tree({
        bucket: 'reports',
        objects: [{ Key: 'lab/report.html' }],
        previewExtensions: ['.html'],
      }).nodes,
    ).toEqual([{ key: 'lab/report.html', name: 'report.html', kind: 'file', previewable: true }]);
  });

  it('uses the final path segment as the display name', () => {
    const tree = buildS3Tree({
      bucket: 'reports',
      commonPrefixes: [{ Prefix: 'lab/nested/' }],
      objects: [{ Key: 'lab/nested/main.tf' }],
      previewExtensions: ['.tf'],
    });

    expect(tree.nodes.map((node) => node.name)).toEqual(['nested', 'main.tf']);
  });

  it('marks supported extensions as previewable', () => {
    expect(
      buildS3Tree({
        bucket: 'reports',
        objects: [{ Key: 'main.tf' }],
        previewExtensions: ['.tf'],
      }).nodes[0]?.previewable,
    ).toBe(true);
  });

  it('marks unsupported extensions as not previewable', () => {
    expect(
      buildS3Tree({
        bucket: 'reports',
        objects: [{ Key: 'image.png' }],
        previewExtensions: ['.tf'],
      }).nodes[0]?.previewable,
    ).toBe(false);
  });
});
