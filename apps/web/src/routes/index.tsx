import type { Metric } from "@/components/live-metrics";
import { DashboardSkeleton } from "@/components/loading-skeleton";
import { StatsOverview, type Stat } from "@/components/stats-overview";
import type { ClientStatusItem } from "@/components/status-monitor";
import { TooltipIconButton } from "@/components/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { generateChartData } from "@/domain/mocks";
import { useActivities } from "@/hooks/use-activities";
import { useClients } from "@/hooks/use-clients";
import { useMetrics } from "@/hooks/use-metrics";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Phone,
  RefreshCw,
  Send,
  TrendingUp,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { lazy, Suspense, useCallback, useMemo } from "react";

// ============================================================================
// CODE SPLITTING - Lazy load heavy components
// ============================================================================

const LiveMetrics = lazy(() =>
  import("@/components/live-metrics").then((mod) => ({
    default: mod.LiveMetrics,
  }))
);

const MessageActivityChart = lazy(() =>
  import("@/components/message-activity-chart").then((mod) => ({
    default: mod.MessageActivityChart,
  }))
);

const StatusMonitor = lazy(() =>
  import("@/components/status-monitor").then((mod) => ({
    default: mod.StatusMonitor,
  }))
);

const ActivityFeed = lazy(() =>
  import("@/components/activity-feed").then((mod) => ({
    default: mod.ActivityFeed,
  }))
);

// Skeleton fallbacks for lazy components
const MetricsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
    ))}
  </div>
);

const ChartSkeleton = () => (
  <div className="h-[400px] bg-muted animate-pulse rounded-lg" />
);

const MonitorSkeleton = () => (
  <div className="h-[500px] bg-muted animate-pulse rounded-lg" />
);

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  // Fetch data using TanStack Query hooks
  const {
    data: clients,
    isLoading: isLoadingClients,
    isError: isErrorClients,
  } = useClients();

  const {
    data: activities,
    isLoading: isLoadingActivities,
    isError: isErrorActivities,
  } = useActivities();

  const {
    data: metrics,
    isLoading: isLoadingMetrics,
    isError: isErrorMetrics,
  } = useMetrics();

  // ============================================================================
  // MEMOIZATION - Optimize expensive calculations
  // ============================================================================

  // Extract metrics with safe defaults
  const {
    connectedClients = 0,
    totalSent = 0,
    totalDelivered = 0,
    totalFailed = 0,
    deliveryRate = 0,
  } = metrics || {};

  // Memoize stats array - only recalculate when metrics change
  const stats: Stat[] = useMemo(
    () => [
      {
        label: "Active Clients",
        value: connectedClients,
        total: clients?.length || 0,
        icon: Phone,
        color: "text-success",
        bgColor: "bg-success/10",
        trend: connectedClients > 0 ? "up" : "neutral",
        trendText: "+3",
        trendLabel: "this week",
      },
      {
        label: "Messages Sent",
        value: totalSent.toLocaleString(),
        icon: Send,
        color: "text-info",
        bgColor: "bg-info/10",
        trend: "up",
        trendText: "+24%",
        trendLabel: "from yesterday",
      },
      {
        label: "Delivered",
        value: totalDelivered.toLocaleString(),
        subtitle: `${deliveryRate}% rate`,
        icon: CheckCircle2,
        color: "text-success",
        bgColor: "bg-success/10",
        trend: deliveryRate >= 90 ? "up" : "neutral",
      },
      {
        label: "Failed",
        value: totalFailed.toLocaleString(),
        icon: XCircle,
        color: "text-destructive",
        bgColor: "bg-destructive/10",
        trend: totalFailed > 0 ? "down" : "neutral",
      },
    ],
    [
      connectedClients,
      totalSent,
      totalDelivered,
      totalFailed,
      deliveryRate,
      clients,
    ]
  );

  const { data, isLoading, isError, refetch } = useQuery(
    trpc.healthCheck.queryOptions(undefined, {
      refetchInterval: 30000,
      retry: false,
    })
  );

  // Memoize live metrics - only recalculate when dependencies change
  const liveMetrics: Metric[] = useMemo(
    () => [
      {
        label: "Messages/Hour",
        value: "342",
        change: 15.3,
        changeLabel: "vs last hour",
        icon: Zap,
        color: "text-info",
        bgColor: "bg-info/10",
        chartData: generateChartData(20, "up"),
        chartType: "area",
      },
      {
        label: "Active Users",
        value: connectedClients,
        change: 12.5,
        changeLabel: "this week",
        icon: Users,
        color: "text-success",
        bgColor: "bg-success/10",
        chartData: generateChartData(20, "up"),
        chartType: "line",
      },
      {
        label: "Success Rate",
        value: `${deliveryRate}%`,
        change: 2.1,
        changeLabel: "improvement",
        icon: TrendingUp,
        color: "text-chart-1",
        bgColor: "bg-chart-1/10",
        chartData: generateChartData(20, "stable"),
        chartType: "area",
      },
      {
        label: "Avg Response Time",
        value: "1.2s",
        change: -8.4,
        changeLabel: "faster",
        icon: Zap,
        color: "text-warning",
        bgColor: "bg-warning/10",
        chartData: generateChartData(20, "down"),
        chartType: "line",
      },
    ],
    [connectedClients, deliveryRate]
  );

  // Memoize client status items - only recalculate when clients change
  const clientStatusItems: ClientStatusItem[] = useMemo(
    () =>
      (clients || []).map((client) => ({
        id: client.id,
        name: client.name,
        phoneNumber: client.phoneNumber,
        status: client.status,
        lastConnected: client.lastConnected,
      })),
    [clients]
  );

  // Memoize event handlers to prevent unnecessary re-renders
  const handleClientClick = useCallback((client: ClientStatusItem) => {
    console.log("Client clicked:", client);
  }, []);

  // Show skeleton while fetching initial data
  if (
    isLoading ||
    isLoadingClients ||
    isLoadingActivities ||
    isLoadingMetrics
  ) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Connection Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Unable to connect to the server. Please check your connection.
            </p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Compact Toolbar */}
      <div className="flex items-center justify-between h-9 px-3 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold">Real-Time Dashboard</h1>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Monitor client status and message activity in real-time
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <TooltipIconButton
            tooltip="Refresh"
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            <span className="sr-only">Refresh</span>
          </TooltipIconButton>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-6 pb-6">
        {/* Top Section: Key Metrics */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Overview
              </h2>
              <p className="text-sm text-muted-foreground">
                Key performance indicators at a glance
              </p>
            </div>
          </div>
          <StatsOverview stats={stats} columns={4} />
        </section>

        {/* Middle Section: Live Metrics */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Performance Metrics
            </h2>
            <p className="text-sm text-muted-foreground">
              Real-time performance tracking with trend analysis
            </p>
          </div>
          <Suspense fallback={<MetricsSkeleton />}>
            <LiveMetrics metrics={liveMetrics} columns={4} />
          </Suspense>
        </section>

        {/* Bottom Section: Activity & Monitoring */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Activity & Monitoring
            </h2>
            <p className="text-sm text-muted-foreground">
              Message activity trends and system monitoring
            </p>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Left Column: Chart and Status */}
            <div className="xl:col-span-2 space-y-4">
              <Suspense fallback={<ChartSkeleton />}>
                <MessageActivityChart
                  totalSent={totalSent}
                  totalDelivered={totalDelivered}
                />
              </Suspense>
              <Suspense fallback={<MonitorSkeleton />}>
                <StatusMonitor
                  clients={clientStatusItems}
                  onClientClick={handleClientClick}
                />
              </Suspense>
            </div>
            {/* Right Column: Activity Feed */}
            <Suspense fallback={<MonitorSkeleton />}>
              <ActivityFeed activities={activities || []} />
            </Suspense>
          </div>
        </section>
      </div>
    </div>
  );
}
