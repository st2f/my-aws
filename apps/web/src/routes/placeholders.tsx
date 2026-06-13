import { useParams } from 'react-router-dom';
import { EmptyState } from '../components/shared-states';

export function BucketsRoute() {
  return <EmptyState title="My buckets" detail="Bucket browsing lands in Phase 7." />;
}

export function BucketRoute() {
  const { bucket } = useParams();

  return <EmptyState title={bucket ?? 'Bucket'} detail="Object tree browsing lands in Phase 7." />;
}

export function S3ObjectRoute() {
  const { bucket, '*': key } = useParams();

  return <EmptyState title={key ?? bucket ?? 'Object'} detail="Object previews land in Phase 7." />;
}
