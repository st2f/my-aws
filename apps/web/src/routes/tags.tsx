import { Link } from 'react-router-dom';
import { ErrorState, LoadingState } from '../components/shared-states';
import { graphqlRequest } from '../graphql/client';
import { useAsyncRouteData } from './use-async-route-data';

type TagKeySummary = {
  key: string;
  valueCount: number;
};

type TagValueSummary = {
  key: string;
  value: string;
  resourceCount: number;
};

type TagKeysData = {
  tagKeys: TagKeySummary[];
};

type TagValuesData = {
  tagValues: TagValueSummary[];
};

type TagGroup = {
  key: string;
  values: TagValueSummary[];
};

const tagKeysQuery = `{
  tagKeys {
    key
    valueCount
  }
}`;

const tagValuesQuery = `query TagValues($key: String!) {
  tagValues(key: $key) {
    key
    value
    resourceCount
  }
}`;

export function TagsRoute() {
  const state = useAsyncRouteData(loadTagGroups);

  if (state.status === 'loading') {
    return <LoadingState label="Loading tags" />;
  }

  if (state.status === 'error') {
    return <ErrorState message={state.message} />;
  }

  return (
    <section className="grid gap-5">
      <div>
        <p className="text-sm font-medium text-zinc-500">Resource tags</p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-950">My tags</h1>
      </div>

      {state.data.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600">
          No tags found.
        </p>
      ) : (
        <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
          {state.data.map((group) => (
            <TagGroupRow group={group} key={group.key} />
          ))}
        </div>
      )}
    </section>
  );
}

async function loadTagGroups(signal: AbortSignal) {
  const { tagKeys } = await graphqlRequest<TagKeysData>(tagKeysQuery, undefined, { signal });

  return Promise.all(
    tagKeys.map(async ({ key }) => {
      const { tagValues } = await graphqlRequest<TagValuesData>(tagValuesQuery, { key }, { signal });
      return { key, values: tagValues };
    }),
  );
}

function TagGroupRow({ group }: { group: TagGroup }) {
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-[10rem_1fr]">
      <h2 className="text-sm font-semibold text-zinc-950">{group.key}</h2>
      {group.values.length === 0 ? (
        <p className="text-sm text-zinc-500">No values</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {group.values.map((tagValue) => (
            <Link
              className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              key={`${tagValue.key}:${tagValue.value}`}
              to={`/tags/${encodeURIComponent(tagValue.key)}/${encodeURIComponent(tagValue.value)}`}
            >
              {tagValue.value}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
