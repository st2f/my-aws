# my-aws

Local-first AWS learning dashboard for discovering tagged resources and browsing S3 object previews.

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

The backend will use local AWS credentials for the MVP. The browser should only talk to the NestJS API, never directly to AWS.

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

## Specs

- [Project plan](specs/plan.md)
- [Architecture](specs/architecture.md)
- [Roadmap](specs/roadmap.md)
