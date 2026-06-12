# my-aws

Local-first AWS learning dashboard for discovering tagged resources and browsing S3 object previews.

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

## Specs

- [Project plan](specs/plan.md)
- [Architecture](specs/architecture.md)
- [Roadmap](specs/roadmap.md)
