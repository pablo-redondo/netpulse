export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`shimmer rounded-[2px] ${className}`} />;
}

export function ServiceCardSkeleton() {
  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-10" />
      </div>
      <Skeleton className="mt-3 h-4 w-24" />
      <div className="mt-4 flex items-end justify-between gap-3">
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-8 w-20" />
      </div>
      <Skeleton className="mt-3 h-4 w-full" />
    </div>
  );
}

export function ServiceGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <ServiceCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatTileSkeleton() {
  return (
    <div className="panel p-4">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-3 h-7 w-20" />
      <Skeleton className="mt-2 h-3 w-36" />
    </div>
  );
}
