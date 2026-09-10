import { Skeleton, StatTileSkeleton } from '@/components/skeleton';

export default function ServiceDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-40" />

      <div className="panel p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <Skeleton className="h-8 w-56 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTileSkeleton />
        <StatTileSkeleton />
        <StatTileSkeleton />
        <StatTileSkeleton />
      </div>

      <div className="panel p-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-48 w-full" />
      </div>

      <div className="panel p-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-32 w-full" />
      </div>
    </div>
  );
}
