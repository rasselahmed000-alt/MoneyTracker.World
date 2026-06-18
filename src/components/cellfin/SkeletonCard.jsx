// Reusable skeleton loader components

export function SkeletonLine({ w = 'w-full', h = 'h-4', className = '' }) {
  return <div className={`${w} ${h} bg-gray-200 rounded-xl animate-pulse ${className}`} />;
}

export function SkeletonCard({ rows = 2 }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gray-200 animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonLine w="w-3/4" />
          <SkeletonLine w="w-1/2" h="h-3" />
        </div>
        <div className="space-y-1">
          <SkeletonLine w="w-16" h="h-4" />
          <SkeletonLine w="w-12" h="h-3" />
        </div>
      </div>
      {rows > 1 && <SkeletonLine h="h-3" />}
    </div>
  );
}

export function BalanceSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-3 w-20 bg-white/20 rounded-full mb-2" />
      <div className="h-8 w-36 bg-white/25 rounded-xl" />
    </div>
  );
}

export default SkeletonCard;