import { afterEach, describe, expect, it, vi } from 'vitest';
import { GraphQLClientError, graphqlRequest } from './client';

describe('GraphQL client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts GraphQL operations to the API /graphql endpoint', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ data: { ok: true } }));
    vi.stubGlobal('fetch', fetchMock);

    await graphqlRequest<{ ok: boolean }>('query Test { ok }', { id: '1' }, { endpoint: 'http://api/graphql' });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://api/graphql',
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: 'query Test { ok }', variables: { id: '1' } }),
      }),
    );
  });

  it('returns typed data for successful responses', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ data: { accountInfo: { accountId: '123' } } })));

    await expect(graphqlRequest<{ accountInfo: { accountId: string } }>('query')).resolves.toEqual({
      accountInfo: { accountId: '123' },
    });
  });

  it('throws a readable error for GraphQL errors', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ errors: [{ message: 'No credentials' }] })));

    await expect(graphqlRequest('query')).rejects.toThrow(GraphQLClientError);
    await expect(graphqlRequest('query')).rejects.toThrow('No credentials');
  });

  it('throws a readable error for network failures', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })));

    await expect(graphqlRequest('query')).rejects.toThrow('GraphQL request failed with HTTP 503.');
  });
});

function jsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  };
}
