import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ErrorState, LoadingState } from '../components/shared-states';
import { graphqlRequest } from '../graphql/client';
import { maskAwsAccountIds } from '../privacy/account-id-mask';
import { useAsyncRouteData } from './use-async-route-data';

type Tag = {
  key: string;
  value: string;
};

type CloudResource = {
  arn: string;
  service: string;
  type: string | null;
  region: string | null;
  accountId: string | null;
  name: string | null;
  tags: Tag[];
};

type ResourcesByTagData = {
  resourcesByTag: CloudResource[];
};

const resourcesByTagQuery = `query ResourcesByTag($key: String!, $value: String!, $refresh: Boolean) {
  resourcesByTag(key: $key, value: $value, refresh: $refresh) {
    arn
    service
    type
    region
    accountId
    name
    tags {
      key
      value
    }
  }
}`;

export function TaggedResourcesRoute() {
  const { key = '', value = '' } = useParams();
  const [refreshVersion, setRefreshVersion] = useState(0);
  const state = useAsyncRouteData(
    (signal) =>
      graphqlRequest<ResourcesByTagData>(
        resourcesByTagQuery,
        { key, value, refresh: refreshVersion > 0 },
        { signal },
      ).then((data) => data.resourcesByTag),
    [key, value, refreshVersion],
  );

  if (state.status === 'loading') {
    return <LoadingState label="Loading tagged resources" />;
  }

  if (state.status === 'error') {
    return <ErrorState message={state.message} />;
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mt-4 text-sm font-medium text-zinc-500">Tagged resources</p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-950">
            {key}={value}
          </h1>
        </div>
        <button
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          onClick={() => setRefreshVersion((version) => version + 1)}
          type="button"
        >
          Refresh
        </button>
      </div>

      {state.data.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600">
          No resources found.
        </p>
      ) : (
        <div className="grid gap-3">
          {state.data.map((resource) => (
            <ResourceRow key={resource.arn} resource={resource} />
          ))}
        </div>
      )}
    </section>
  );
}

function ResourceRow({ resource }: { resource: CloudResource }) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">
            {maskAwsAccountIds(resource.name ?? resource.arn)}
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            {resource.service}
            {resource.type ? ` / ${resource.type}` : ''}
            {resource.region ? ` / ${resource.region}` : ''}
          </p>
        </div>
        {resource.accountId ? (
          <span className="font-mono text-xs text-zinc-500">
            {maskAwsAccountIds(resource.accountId)}
          </span>
        ) : null}
      </div>

      <p className="mt-3 break-all font-mono text-xs text-zinc-500">
        {maskAwsAccountIds(resource.arn)}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {resource.tags.map((tag) => (
          <span
            className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700"
            key={`${resource.arn}:${tag.key}:${tag.value}`}
          >
            {maskAwsAccountIds(tag.key)}={maskAwsAccountIds(tag.value)}
          </span>
        ))}
      </div>
    </article>
  );
}
