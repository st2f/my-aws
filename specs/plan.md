# my-aws - Project Plan

AWS resources quickly become hard to understand when they are created partly by Terraform and partly by manual console work.

This app is a personal learning dashboard that shows resources through the tags that connect them, then lets us zoom into the concrete AWS objects behind those tags. It should facilitate previewing resources that are not directly visible on AWS (eg bucket content file preview).

The app should stay dynamic: no hardcoded buckets, repositories, tag values, account ids, or regions unless they are local development defaults. But a config file can be used to handle specific cases.

## Configuration

Examples :

Region: eu-north-1

We start with 1 region only

Profile: default

I will use an admin profile to start.

---

Services lookup:

- IAM
- S3
- Resource Groups Tagging API
- Elastic Container Registry
- Systems Manager

The app should not restrict specific service by default if AWS returns information about it, but if the app needs to explore services (eg for tags) then it should limit the requests to these services.

---

maxObjectsPerBucket: 200,
previewExtensions: [".html", ".tf"]

I will add extension if/when they appear in buckets, for now only html / tf, so i wouldn't be able to test other formats.

## Proposed Stack

- No DB !
- Backend: NestJS
- API: GraphQL
- Frontend: React + TypeScript
- AWS access: AWS SDK for JavaScript v3
- Storage: no database for MVP
- Cache: optional in-memory cache with short TTL to avoid repeated AWS calls while clicking around

## AWS API Strategy

Use a layered approach:

1. Generic discovery by tags
   - Use Resource Groups Tagging API to fetch tagged resources and tag keys/values.
   - This is the main source for the tag browser.

2. Service-specific detail adapters
   - S3: buckets, bucket tags, objects, supported object content previews.
   - ECR: repositories, images, repository tags.
   - SSM: parameters/documents/automation items depending on what is being used.
   - IAM: roles, policies, users, access keys where permissions allow it.

The backend should normalize AWS responses into one internal resource shape:

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

type Tag = {
  key: string;
  value: string;
};
```

Relationships can become a first-class concept later, but they are not part of the first UI shape. Keep the first version focused on tags and S3 browsing.

## Product Shape

Pages :

- `/`
  - Homepage with account information.
- `/tags`
  - All discovered tag keys and values.
- `/tags/:key/:value`
  - Resources that match one tag key/value.
- `/s3`
  - Known S3 buckets.
- `/s3/:bucket`
  - Bucket object tree.
- `/s3/:bucket/*key`
  - Object preview when the file format is enabled.

Left nav:

- My tags: `/tags`
- My buckets: `/s3`

Optional later:

- Login/logout for a deployed or incognito-friendly version

### Homepage

The homepage should be minimal:

- AWS account id
- Account alias when available
- Active region
- Credential/profile hint if safe to show
- Links to tags and buckets

### Tags Page

`/tags` should show discovered tags dynamically:

```text
Project: ci-practice
ManagedBy: manual, terraform
Environment: lab
Owner: gituser-1, user-2
```

Each tag value links to `/tags/:key/:value`.

### Tagged Resources Page

`/tags/:key/:value` should show all resources matching that tag.

For example:

```text
/tags/Project/ci-practice
```

Show:

- Resource name
- Service
- Type
- Region
- ARN
- Tags

If the generic tagging API response is not enough, add service lookups only for the services currently defined in config.

### S3 Buckets Page

`/s3` should show known buckets, for example:

```text
terraform-state
ci-practice-reports-535337619181
```

Buckets should be discovered dynamically. Config can later narrow which buckets to show.

### S3 Bucket Tree Page

`/s3/:bucket` should show directories and files in a tree-like view, similar to `tree`.

The tree should be limited in config so a large bucket does not overwhelm the UI or trigger too many AWS calls.

Files with a supported extension (in config) link to `/s3/:bucket/*key`.

### S3 Object Preview Page

`/s3/:bucket/*key` should preview content only when the format is enabled in config or not-found/unsupported response.

Safety notes:

- Treat S3 object contents as untrusted.
- Do not directly inject HTML into the React page.
- Put size limits on object preview, for example first 1 MB for MVP.

## References

- AWS Resource Groups Tagging API `GetResources`: https://docs.aws.amazon.com/resourcegroupstagging/latest/APIReference/API_GetResources.html
- Amazon S3 `GetObject`: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObject.html
