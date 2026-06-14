# my-aws

Local-first AWS learning dashboard for discovering tagged resources and browsing S3 object previews.

<img width="800" alt="UI Account & List of tags" src="https://github.com/user-attachments/assets/d73bdf52-334e-4f44-8f3c-151702f1cd01" />

---

<img width="800" alt="UI Tagged Resources" src="https://github.com/user-attachments/assets/21512883-6a88-4b33-baa6-e3decc3e78f4" />

The backend uses local AWS credentials for the MVP. The browser should only talk to the NestJS API, never directly to AWS.

```txt
┌─────────────┐
│ React Web   │
└──────┬──────┘
       │ GraphQL
       ▼
┌─────────────┐
│ NestJS API  │
└──────┬──────┘
       │ AWS SDK
       ▼
┌──────────────────────────┐
│ AWS Resources            │
│ - Resource Groups        │
│ - S3                     │
│ - IAM                    │
│ - ECR                    │
│ - SSM                    │
└──────────────────────────┘
```

## Setup

```bash
npm install
cp .env.example .env
```

Default local settings:

```text
AWS_REGION=eu-north-1
AWS_PROFILE=default
```

For screenshots or screen sharing, enable frontend-only account id masking:

```text
VITE_MY_AWS_MASK_ACCOUNT_IDS=true
```

Rendered 12-digit AWS account ids are shown as `*****`, while API requests still use the real values.

## Workspace

```text
apps/api        NestJS backend
apps/web        React frontend
packages/shared Shared TypeScript types
specs           Project specs
```

## Commands

Run from the repo root.

```bash
npm run dev:api
npm run dev:web
npm run build
npm run check:esm
npm run test --workspace @my-aws/api
npm run test --workspace @my-aws/web
npm run test:e2e --workspace @my-aws/api
npm run typecheck
npm run lint
npm run format
npm run format:check
```

`npm run dev` also exists, but running API and web in separate terminals is easier while the app is small.

The default API test command runs port-free Vitest tests. The e2e command uses Supertest.

## Local URLs

```text
API: http://localhost:3000
API health: http://localhost:3000/health
Web: http://localhost:5173
```

## GraphQL

The API exposes GraphQL at `/graphql`, but the legacy GraphQL Playground UI is disabled explicitly. Use the React app, curl, or a GraphQL client so queries stay visible and intentional.

Example:

```bash
curl http://localhost:3000/graphql \
  -H 'content-type: application/json' \
  -d '{"query":"{ accountInfo { accountId alias region } }"}'
```

### Schema generation (code-first)

#### 1. [apps/api/src/app.module.ts](/apps/api/src/app.module.ts)

This is where GraphQL is plugged into Nest:

```ts
GraphQLModule.forRoot(graphqlConfig);
```

It answers: “How does this app enable `/graphql`?”

#### 2. [apps/api/src/graphql.config.ts](/apps/api/src/graphql.config.ts)

This is the Apollo/Nest GraphQL configuration:

```ts
driver: ApolloDriver,
autoSchemaFile: true,
playground: false,
```

It answers: “Which GraphQL server adapter are we using, and how is the schema created?”

#### 3. [apps/api/src/account/account.resolver.ts](/apps/api/src/account/account.resolver.ts)

This is the simplest real GraphQL query:

```ts
@Query(() => AccountInfoType)
accountInfo()
```

It answers: “How does a GraphQL query call backend code?”

#### 4. [apps/api/src/api/graphql.types.ts](/apps/api/src/api/graphql.types.ts)

This defines the GraphQL schema types using decorators:

```ts
@ObjectType('AccountInfo')
@Field()
```

It answers: “What shape does GraphQL expose to clients?”

## Tag cache

The tag browser uses a backend in-memory cache. There is no database: the cache lives only inside the running NestJS API process, resets when the API restarts, and expires after a configurable TTL. The default TTL is 12 hours.

Configure it in `.env`:

```text
MY_AWS_TAG_CACHE_TTL_SECONDS=43200
```

The UI can also bypass the cache with the Refresh buttons.

### Request flow

#### 1. The user opens `/tags`

[apps/web/src/routes/tags.tsx](/apps/web/src/routes/tags.tsx) renders the tags page.

On mount, `useAsyncRouteData(...)` calls `loadTagGroups(...)`.

That sends this GraphQL query first:

```graphql
tagKeys {
  key
  valueCount
}
```

Then, for each returned key, it sends:

```graphql
tagValues(key: "Project") {
  key
  value
  resourceCount
}
```

#### 2. GraphQL routes the query to the resolver

[apps/api/src/tags/tags.resolver.ts](/apps/api/src/tags/tags.resolver.ts) receives those GraphQL queries.

The resolver is thin: it does not know about AWS or caching. It just calls the service:

```ts
tagKeys(refresh) -> tagsService.tagKeys(refresh)
tagValues(key, refresh) -> tagsService.tagValues(key, refresh)
resourcesByTag(key, value, refresh) -> tagsService.resourcesByTag(key, value, refresh)
```

That is how [apps/api/src/tags/tags.service.ts](/apps/api/src/tags/tags.service.ts) gets called.

#### 3. The service checks the cache

Inside `tags.service.ts`, each public method calls the cache gate:

```ts
this.tagsSnapshot(refresh);
```

- if `refresh` is false and the cached snapshot has not expired, return cached data
- if another request is already rebuilding the snapshot, wait for that same in-flight AWS scan
- otherwise call `buildTagsSnapshot(now)` to scan AWS and store the result with a new expiry time

#### 4. The service derives answers from one snapshot

After the snapshot exists:

- `tagKeys(...)` derives the list of tag keys from cached resources
- `tagValues(...)` derives values for one key from cached resources
- `resourcesByTag(...)` filters cached resources by key/value

So `/tags` may make several GraphQL requests, but the backend should only do one AWS scan per TTL window unless Refresh is clicked.

#### 5. Refresh bypasses the cache

The Refresh buttons in [apps/web/src/routes/tags.tsx](/apps/web/src/routes/tags.tsx) and [apps/web/src/routes/tagged-resources.tsx](/apps/web/src/routes/tagged-resources.tsx) tell the backend to rebuild the tag snapshot instead of reusing the cached one.

That gives the user a manual way to pick up AWS tag changes before the TTL expires.

### Current limitations

- no stale cache on error
- IAM tag requests are intentionally sequential to avoid throttling; limited concurrency could be added later
- no external cache for multiple API instances

## Specs

- [Project plan](specs/plan.md)
- [Architecture](specs/architecture.md)
- [Roadmap](specs/roadmap.md)
