# my-aws - Implementation Roadmap

This roadmap keeps the first version small: local-first, no database, read-only AWS access, tags, and S3 object previews.

## Phase 0: Project Skeleton

Status: done.

Goal: create the app structure and make local development easy.

Steps:

- Choose repo layout:
  - `apps/api` for NestJS.
  - `apps/web` for React.
  - `packages/shared` later only if shared types become useful.
- Add TypeScript, linting, and formatting.
- Add root scripts for common commands.
- Add `.env.example` with local AWS settings.
- Add a small app config shape:
  - AWS region.
  - optional local AWS profile.
  - enabled service lookups.
  - S3 max object count.
  - S3 preview extensions.
  - S3 max preview bytes.

Done when:

- Backend starts locally.
- Frontend starts locally.
- Config can be read by the backend.

Implementation notes:

- Workspace scaffold added with `apps/api`, `apps/web`, and `packages/shared`.
- Root scripts added for dev, build, lint, format, and typecheck.
- `.env.example` added for local AWS configuration.
- Shared app config type added.
- Minimal NestJS API and Vite React app added.
- Typecheck, lint, and build pass.
- Dev server binding may fail inside restricted sandboxes with `listen EPERM`; run locally in a normal terminal.

## Phase 1: Backend AWS Connection

Goal: prove the backend can connect to AWS using local credentials.

Steps:

- Create `ConfigModule`.
- Create `AwsModule`.
- Create AWS SDK v3 clients:
  - STS
  - IAM
  - Resource Groups Tagging API
  - S3
- Implement credential behavior:
  - use local profile only when configured.
  - otherwise let AWS SDK default credential chain work.
- Add `AccountModule`.
- Implement account info:
  - account id from STS.
  - account alias from IAM when available.
  - active region from config.

Done when:

- A backend query can return account id, alias if available, and region.
- Missing credentials and access denied errors are readable.

## Phase 2: GraphQL API Foundation

Goal: expose the first stable API contract for the frontend.

Steps:

- Configure NestJS GraphQL.
- Add GraphQL object types for:
  - `AccountInfo`
  - `TagKeySummary`
  - `TagValueSummary`
  - `CloudResource`
  - `S3Bucket`
  - `S3Tree`
  - `S3ObjectPreview`
- Add initial queries:

```graphql
type Query {
  accountInfo: AccountInfo!
  tagKeys: [TagKeySummary!]!
  tagValues(key: String!): [TagValueSummary!]!
  resourcesByTag(key: String!, value: String!): [CloudResource!]!
  s3Buckets: [S3Bucket!]!
  s3Tree(bucket: String!, prefix: String): S3Tree!
  s3ObjectPreview(bucket: String!, key: String!): S3ObjectPreview!
}
```

Done when:

- GraphQL playground or a simple query client can call `accountInfo`.
- Errors are returned clearly instead of crashing the server.

## Phase 3: Tags Backend

Goal: read dynamic tags and resources from AWS.

Steps:

- Create `TagsModule`.
- Use Resource Groups Tagging API for tag discovery.
- Implement `tagKeys`.
- Implement `tagValues(key)`.
- Implement `resourcesByTag(key, value)`.
- Normalize AWS resources into:

```ts
type CloudResource = {
  arn: string;
  service: string;
  type?: string;
  region?: string;
  accountId?: string;
  name?: string;
  tags: Tag[];
};
```

- Parse service/type/name from ARN where possible.
- Keep raw AWS response out of the first UI contract.
- Add service-specific lookup only if the tagging API result is not enough for the currently configured services.

Done when:

- Querying `tagKeys` shows keys like `Project`, `ManagedBy`, `Environment`, `Owner`.
- Querying `tagValues(key: "Project")` shows values like `ci-practice`.
- Querying `resourcesByTag(key: "Project", value: "ci-practice")` returns tagged resources.

## Phase 4: S3 Backend

Goal: list buckets, browse object trees, and preview safe file formats.

Steps:

- Create `S3Module`.
- Implement `s3Buckets`.
  - Use `ListBuckets`.
  - Optionally include bucket tags when permissions allow.
- Implement `s3Tree(bucket, prefix)`.
  - Use `ListObjectsV2`.
  - Respect `maxObjectsPerBucket`.
  - Transform flat keys into tree-like nodes.
  - Mark files as previewable only when extension is enabled.
- Implement `s3ObjectPreview(bucket, key)`.
  - Reject unsupported extensions.
  - Use `GetObject`.
  - Enforce `maxPreviewBytes`.
  - Return text/source content.
  - For `.html`, return source first, not direct injected HTML.

Done when:

- `/s3` data can list buckets like `terraform-state-stef` and `ci-practice-reports-...`.
- A bucket query returns a limited tree.
- `.html` and `.tf` objects can be previewed.
- Unsupported extensions return a clear unsupported response.

## Phase 5: React Shell

Goal: create the basic app frame.

Steps:

- Create React app with TypeScript.
- Add GraphQL client.
- Add React Router routes:
  - `/`
  - `/tags`
  - `/tags/:key/:value`
  - `/s3`
  - `/s3/:bucket`
  - `/s3/:bucket/*key`
- Add left navigation:
  - My tags
  - My buckets
- Add shared states:
  - loading
  - empty
  - error
- Keep layout practical and compact.

Done when:

- The app renders locally.
- Navigation works.
- The homepage calls `accountInfo`.

## Phase 6: Tags UI

Goal: make tag browsing useful.

Steps:

- Build `/tags`.
  - Query tag keys.
  - Query values for each key.
  - Render key/value groups like:

```text
Project: ci-practice
ManagedBy: manual, terraform
Environment: lab
Owner: gituser-1, user-2
```

- Link each value to `/tags/:key/:value`.
- Build `/tags/:key/:value`.
  - Query matching resources.
  - Show resource name, service, type, region, ARN, and tags.

Done when:

- You can click `Project=ci-practice`.
- The app shows all matching tagged resources.

## Phase 7: S3 UI

Goal: browse S3 buckets and preview configured object formats.

Steps:

- Build `/s3`.
  - Query buckets.
  - Link each bucket to `/s3/:bucket`.
- Build `/s3/:bucket`.
  - Query tree.
  - Render folders/files in a tree-like view.
  - Show when the result is capped by `maxObjectsPerBucket`.
  - Link previewable files.
- Build `/s3/:bucket/*key`.
  - Query object preview.
  - Render source text safely.
  - Show unsupported/not found/too large states.

Done when:

- You can browse `ci-practice-reports-...`.
- You can open a configured `.html` or `.tf` object.
- Large or unsupported files do not break the app.

## Phase 8: Local Polish

Goal: make the MVP comfortable to use.

Steps:

- Add refresh buttons for tags and S3 pages.
- Add small cache with short TTL if AWS calls feel noisy.
- Improve error messages for common AWS failures.
- Add README instructions for:
  - AWS profile.
  - region.
  - required permissions.
  - starting backend and frontend.
- Add minimal tests around pure logic:
  - ARN parsing.
  - S3 key-to-tree transformation.
  - extension allow-list.
  - preview size guard.

Done when:

- The app is usable without remembering internal commands.
- Core transformation logic is covered by tests.

## Phase 9: Later Learning Tracks

These are deliberately outside the first implementation.

- Cognito login for local/deployed auth learning.
- Deploy backend with an IAM role instead of local profile.
- Multi-region browsing.
- Resource detail pages.
- Search.
- IAM policy relationship exploration.
- Terraform state/resource mapping.
- User-defined tag conventions.

## Recommended First Coding Order

1. Backend config and AWS connection.
2. `accountInfo` GraphQL query.
3. Tag queries.
4. S3 queries.
5. React shell.
6. Tags UI.
7. S3 UI.
8. Polish and tests.

This order gives quick proof that AWS connectivity works before spending time on frontend screens.
