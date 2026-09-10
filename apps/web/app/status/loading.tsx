import { Skeleton, ServiceGridSkeleton } from '@/components/skeleton';

export default function StatusLoading() {
  return (
    <div className="space-y-8">
      <div className="panel p-8 text-center sm:p-10">
        <Skeleton className="mx-auto h-5 w-40" />
        <Skeleton className="mx-auto mt-3 h-4 w-64" />
      </div>

      <div>
        <Skeleton className="mb-3 h-4 w-24" />
        <ServiceGridSkeleton count={9} />
      </div>

      <div className="panel p-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-24 w-full" />
      </div>
    </div>
  );
}
