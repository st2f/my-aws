# my-aws - Architecture

## Architecture Goal

Build a local-first learning app that gives a clearer view of tagged AWS resources and S3 bucket contents without introducing a database or a large platform architecture.

The app has two main responsibilities:

- Show AWS resources through discovered tags.
- Browse S3 buckets and preview configured file formats.

## High-Level Shape

```text
React frontend
  -> GraphQL over HTTP
    -> NestJS backend
      -> AWS SDK v3
        -> AWS account
```

The browser never talks to AWS directly. The NestJS backend is the only part that uses AWS credentials.

## Runtime Modes

### Local MVP

```text
React dev server
NestJS dev server
AWS SDK uses local AWS profile
No DB
Optional in-memory cache
```

Local AWS credentials come from the normal AWS SDK credential chain:

- `AWS_PROFILE`
- `AWS_REGION`
- `~/.aws/config`
- `~/.aws/credentials`
- SSO/session credentials if configured

Recommended local start:

```text
AWS_PROFILE=default
AWS_REGION=eu-north-1
```

### Later Deployed Version

```text
React static app
NestJS deployed backend
AWS SDK uses runtime IAM role
Optional Cognito login in front of the app/API
No DB unless user-specific features are added
```

When deployed on AWS, avoid profile-specific code. Let the AWS SDK use the runtime role attached to the backend.

## Frontend

Suggested stack:

- React
- TypeScript
- React Router
- Apollo Client or urql for GraphQL

Routes:

- `/`
  - Account info homepage.
- `/tags`
  - All discovered tag keys and values.
- `/tags/:key/:value`
  - Resources matching one tag.
- `/s3`
  - Known buckets.
- `/s3/:bucket`
  - Tree-like object listing.
- `/s3/:bucket/*key`
  - Object preview if the extension is enabled.

Left navigation:

- My tags
- My buckets

The frontend should stay thin. It asks GraphQL for data and renders it. It should not know AWS SDK details.

## Backend

Suggested stack:

- NestJS
- GraphQL resolver layer
- AWS SDK for JavaScript v3
- Small config module
- Optional in-memory cache

Suggested modules:

- `ConfigModule`
  - Reads region, profile, enabled service lookups, S3 limits, preview extensions.

- `AwsModule`
  - Creates AWS SDK clients.
  - Centralizes credential behavior.

- `AccountModule`
  - Gets account id and account alias.

- `TagsModule`
  - Uses Resource Groups Tagging API.
  - Builds tag key/value summaries.
  - Lists resources for a selected tag.

- `S3Module`
  - Lists buckets.
  - Lists objects by prefix.
  - Builds tree-like object output.
  - Reads object previews for configured extensions only.

- `ApiModule`
  - Groups GraphQL resolvers exposed to React.

## GraphQL Boundary

The GraphQL API should model what the UI needs, not every AWS detail.

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

The backend can still use AWS-specific names internally, but the public API should stay simple and UI-focused.

## AWS Client Strategy

Use AWS SDK v3 clients:

- STS for account identity.
- IAM for account alias and IAM tag lookups when needed.
- Resource Groups Tagging API for tag discovery.
- S3 for buckets, objects, and previews.
- ECR, SSM, IAM later only when configured service lookups need them.

For local development, either:

- Let the SDK default chain discover credentials.
- Or explicitly use `fromIni({ profile })` only when a profile is configured.

For deployment:

- Do not use `fromIni`.
- Let the SDK use the deployed runtime IAM role.

## Configuration

Use a small config file or environment-backed config.

Example:

```ts
export default {
  aws: {
    region: "eu-north-1",
    profile: "default"
  },
  services: {
    lookups: ["iam", "s3", "ecr", "ssm"]
  },
  s3: {
    maxObjectsPerBucket: 200,
    previewExtensions: [".html", ".tf"],
    maxPreviewBytes: 1_000_000
  }
};
```

The profile should be local-only. In a deployed environment, the profile should be omitted.

## Data Flow

### Tags Page

```text
React /tags
  -> GraphQL tagKeys
    -> TagsModule
      -> Resource Groups Tagging API GetTagKeys/GetTagValues/GetResources
```

The UI displays discovered keys and values. It does not decide whether tags are correct.

### Tagged Resources Page

```text
React /tags/Project/ci-practice
  -> GraphQL resourcesByTag("Project", "ci-practice")
    -> TagsModule
      -> Resource Groups Tagging API GetResources with tag filter
      -> optional service-specific lookup if configured and needed
```

### S3 Buckets Page

```text
React /s3
  -> GraphQL s3Buckets
    -> S3Module
      -> S3 ListBuckets
      -> optional GetBucketTagging
```

### S3 Tree Page

```text
React /s3/:bucket
  -> GraphQL s3Tree(bucket, prefix)
    -> S3Module
      -> S3 ListObjectsV2
      -> limit by maxObjectsPerBucket
      -> transform flat keys into tree nodes
```

### S3 Preview Page

```text
React /s3/:bucket/*key
  -> GraphQL s3ObjectPreview(bucket, key)
    -> S3Module
      -> validate extension
      -> S3 GetObject
      -> enforce maxPreviewBytes
      -> return escaped/source content
```

## Security Boundaries

Local v1:

- No app login.
- Backend uses local AWS profile.
- Keep app bound to localhost.

S3 preview safety:

- Treat all S3 object content as untrusted.
- Do not inject HTML directly into the page.
- Show HTML source first.
- Add sandboxed HTML preview later only if needed.
- Enforce file size limits.
- Only preview configured extensions.

Deployed later:

- Backend should use an IAM role with read-only permissions.
- Add Cognito or another login mechanism before exposing the app.
- Do not expose the backend publicly without app auth or network restrictions.

## Caching

No database for MVP.

Optional in-memory cache:

- Account info: 5 to 30 minutes.
- Tag summaries: 30 to 120 seconds.
- S3 bucket list: 30 to 120 seconds.
- S3 object tree: 15 to 60 seconds.
- Object previews: short cache or no cache.

Add a refresh button in the UI before adding complex cache invalidation.

## Error Handling

Return useful GraphQL errors for:

- AWS credentials not found.
- AWS access denied.
- Region not configured.
- Bucket not found.
- Object not found.
- Unsupported preview extension.
- Object too large to preview.

The UI should show these as learning-friendly messages, because AWS errors are part of the project’s purpose.

## What Is Not in V1

- Database.
- User accounts.
- Server-side sessions.
- Multi-account support.
- Multi-region discovery.
- Relationship graph.
- Terraform state explorer.
- Drift detection.
- Full AWS inventory platform.

These can be added later, but they should not block the first useful version.
