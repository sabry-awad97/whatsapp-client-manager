/**
 * Loading Skeleton Components
 *
 * Provides skeleton loading states for various UI components
 */

import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface LoadingSkeletonProps {
  className?: string;
  variant?: "card" | "text" | "circle" | "button" | "stat" | "metric";
}

// ============================================================================
// BASE SKELETON
// ============================================================================

export function LoadingSkeleton({
  className,
  variant = "card",
}: LoadingSkeletonProps) {
  const baseClasses = "animate-pulse bg-muted";

  const variantClasses = {
    card: "h-32 w-full rounded-lg",
    text: "h-4 w-full rounded",
    circle: "h-12 w-12 rounded-full",
    button: "h-10 w-24 rounded-md",
    stat: "h-24 w-full rounded-lg",
    metric: "h-32 w-full rounded-lg",
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)} />
  );
}

// ============================================================================
// SPECIFIC SKELETONS
// ============================================================================

/**
 * Skeleton for StatsOverview cards
 */
export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <LoadingSkeleton variant="circle" className="h-10 w-10" />
        <LoadingSkeleton variant="text" className="w-16 h-3" />
      </div>
      <div className="space-y-2">
        <LoadingSkeleton variant="text" className="w-20 h-7" />
        <LoadingSkeleton variant="text" className="w-24 h-3" />
      </div>
    </div>
  );
}

/**
 * Skeleton for LiveMetrics cards
 */
export function MetricCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LoadingSkeleton variant="circle" className="h-10 w-10" />
          <div className="space-y-2">
            <LoadingSkeleton variant="text" className="w-24 h-4" />
            <LoadingSkeleton variant="text" className="w-16 h-6" />
          </div>
        </div>
        <LoadingSkeleton variant="text" className="w-12 h-8" />
      </div>
      <LoadingSkeleton variant="text" className="w-full h-16" />
    </div>
  );
}

/**
 * Skeleton for StatusMonitor client items
 */
export function ClientCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-3 space-y-3">
      <div className="flex items-center gap-3">
        <LoadingSkeleton variant="circle" className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <LoadingSkeleton variant="text" className="w-32 h-4" />
            <LoadingSkeleton variant="text" className="w-16 h-5 rounded-full" />
          </div>
          <LoadingSkeleton variant="text" className="w-40 h-3" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for ActivityFeed items
 */
export function ActivityCardSkeleton() {
  return (
    <div className="flex gap-3 pb-4">
      <LoadingSkeleton variant="circle" className="h-8 w-8 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <LoadingSkeleton variant="text" className="w-48 h-4" />
          <LoadingSkeleton variant="text" className="w-16 h-3" />
        </div>
        <LoadingSkeleton variant="text" className="w-full h-3" />
        <div className="flex gap-2">
          <LoadingSkeleton variant="text" className="w-24 h-5 rounded-md" />
          <LoadingSkeleton variant="text" className="w-28 h-5 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for MessageActivityChart
 */
export function ChartSkeleton() {
  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <LoadingSkeleton variant="circle" className="h-4 w-4" />
          <LoadingSkeleton variant="text" className="w-40 h-5" />
        </div>
      </div>
      <div className="p-4 space-y-4">
        <LoadingSkeleton
          variant="text"
          className="w-full h-[300px] rounded-lg"
        />
        <div className="flex items-center justify-center gap-8 pt-4 border-t">
          <div className="flex items-center gap-2">
            <LoadingSkeleton variant="circle" className="h-3 w-3" />
            <LoadingSkeleton variant="text" className="w-12 h-3" />
          </div>
          <div className="flex items-center gap-2">
            <LoadingSkeleton variant="circle" className="h-3 w-3" />
            <LoadingSkeleton variant="text" className="w-16 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FULL PAGE SKELETONS
// ============================================================================

/**
 * Skeleton for entire dashboard page
 */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-0">
      {/* Toolbar Skeleton */}
      <div className="flex items-center justify-between h-9 px-3 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <LoadingSkeleton variant="text" className="w-48 h-4" />
        </div>
        <LoadingSkeleton variant="button" className="h-7 w-20" />
      </div>

      {/* Main Content Skeleton */}
      <div className="p-4 space-y-6 pb-6">
        {/* Overview Section */}
        <section className="space-y-4">
          <div>
            <LoadingSkeleton variant="text" className="w-32 h-5 mb-2" />
            <LoadingSkeleton variant="text" className="w-64 h-3" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        </section>

        {/* Performance Metrics Section */}
        <section className="space-y-4">
          <div>
            <LoadingSkeleton variant="text" className="w-40 h-5 mb-2" />
            <LoadingSkeleton variant="text" className="w-72 h-3" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <MetricCardSkeleton key={i} />
            ))}
          </div>
        </section>

        {/* Activity & Monitoring Section */}
        <section className="space-y-4">
          <div>
            <LoadingSkeleton variant="text" className="w-48 h-5 mb-2" />
            <LoadingSkeleton variant="text" className="w-80 h-3" />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Chart Skeleton */}
            <div className="xl:col-span-2 space-y-4">
              <ChartSkeleton />
              {/* Status Monitor Skeleton */}
              <div className="rounded-lg border bg-card">
                <div className="p-4 border-b">
                  <LoadingSkeleton variant="text" className="w-32 h-5" />
                </div>
                <div className="p-4 space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <ClientCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            </div>

            {/* Activity Feed Skeleton */}
            <div className="rounded-lg border bg-card">
              <div className="p-4 border-b">
                <LoadingSkeleton variant="text" className="w-28 h-5" />
              </div>
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <ActivityCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
