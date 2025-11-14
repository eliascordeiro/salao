import { GlassCard } from "./glass-card";

export function SalonCardSkeleton() {
  return (
    <GlassCard className="overflow-hidden h-full flex flex-col">
      {/* Cover Photo Skeleton */}
      <div className="relative h-56 w-full bg-background-alt/50 animate-pulse" />
      
      {/* Content Skeleton */}
      <div className="p-5 space-y-4 flex-1 flex flex-col">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-6 bg-background-alt/50 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-background-alt/50 rounded animate-pulse w-1/2" />
        </div>
        
        {/* Description */}
        <div className="space-y-2">
          <div className="h-3 bg-background-alt/50 rounded animate-pulse w-full" />
          <div className="h-3 bg-background-alt/50 rounded animate-pulse w-5/6" />
        </div>
        
        {/* Badges */}
        <div className="flex gap-2">
          <div className="h-6 bg-background-alt/50 rounded-full animate-pulse w-20" />
          <div className="h-6 bg-background-alt/50 rounded-full animate-pulse w-24" />
        </div>
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex gap-4">
            <div className="h-8 w-12 bg-background-alt/50 rounded animate-pulse" />
            <div className="h-8 w-12 bg-background-alt/50 rounded animate-pulse" />
          </div>
          <div className="h-8 w-20 bg-background-alt/50 rounded animate-pulse" />
        </div>
      </div>
    </GlassCard>
  );
}

export function SalonListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SalonCardSkeleton key={i} />
      ))}
    </div>
  );
}
