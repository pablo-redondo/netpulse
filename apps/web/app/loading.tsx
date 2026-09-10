import { Skeleton, ServiceGridSkeleton, StatTileSkeleton } from '@/components/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="glass rounded-3xl p-6 sm:p-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-14 w-48" />
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
