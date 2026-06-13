import { describe, expect, it } from 'vitest';
import { graphqlConfig } from './graphql.config.js';

describe('graphqlConfig', () => {
  it('keeps the GraphQL endpoint enabled without the legacy Playground UI', () => {
    expect(graphqlConfig.autoSchemaFile).toBe(true);
    expect(graphqlConfig.playground).toBe(false);
  });
});
