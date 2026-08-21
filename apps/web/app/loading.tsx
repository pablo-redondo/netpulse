import { Skeleton, ServiceGridSkeleton, StatTileSkeleton } from '@/components/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Skeleton className="h-6 w-56" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Skeleton className="h-8 w-40" />
      </div>

      <div className="rounded-lg border border-hairline bg-surface-1 p-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-12 w-40" />
        <Skeleton className="mt-3 h-3 w-56" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTileSkeleton />
        <StatTileSkeleton />
        <StatTileSkeleton />
      </div>

      <ServiceGridSkeleton count={9} />
    </div>
  );
}
