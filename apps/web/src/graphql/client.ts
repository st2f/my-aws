export type GraphQLRequestOptions = {
  endpoint?: string;
  signal?: AbortSignal;
};

type GraphQLResponse<TData> = {
  data?: TData;
  errors?: Array<{ message?: string }>;
};

export class GraphQLClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GraphQLClientError';
  }
}

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function graphqlRequest<TData>(
  query: string,
  variables?: Record<string, unknown>,
  options: GraphQLRequestOptions = {},
): Promise<TData> {
  const response = await fetch(options.endpoint ?? `${apiUrl}/graphql`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    ...(options.signal ? { signal: options.signal } : {}),
  });

  if (!response.ok) {
    throw new GraphQLClientError(`GraphQL request failed with HTTP ${response.status}.`);
  }

  const body = (await response.json()) as GraphQLResponse<TData>;

  if (body.errors?.length) {
    throw new GraphQLClientError(body.errors[0]?.message ?? 'GraphQL request failed.');
  }

  if (body.data === undefined) {
    throw new GraphQLClientError('GraphQL response did not include data.');
  }

  return body.data;
}
