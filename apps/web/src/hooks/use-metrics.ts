/**
 * Custom Hook for Metrics Management with TanStack Query
 *
 * Provides computed metrics derived from client and message data
 * with caching and automatic recalculation.
 */

import { calculateMetrics, type MockMetrics } from "@/domain/mocks";
import { useQuery } from "@tanstack/react-query";
import { useClients } from "./use-clients";
import { useMessages } from "./use-messages";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const metricsKeys = {
  all: ["metrics"] as const,
  summary: () => [...metricsKeys.all, "summary"] as const,
  client: (clientId?: string) =>
    [...metricsKeys.all, "client", clientId] as const,
  performance: () => [...metricsKeys.all, "performance"] as const,
  trends: () => [...metricsKeys.all, "trends"] as const,
};

// ============================================================================
// TYPES
// ============================================================================

export interface PerformanceMetrics {
  messagesPerHour: number;
  averageDeliveryTime: number;
  successRate: number;
  activeClientsPercentage: number;
  avgMessagesPerClient: number;
}

export interface TrendMetrics {
  sentTrend: "up" | "down" | "stable";
  deliveryRateTrend: "up" | "down" | "stable";
  clientsTrend: "up" | "down" | "stable";
  trendPercentage: number;
}

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate performance metrics
 */
function calculatePerformanceMetrics(metrics: MockMetrics): PerformanceMetrics {
  const { totalSent, totalDelivered, connectedClients, totalClients } = metrics;

  // Simulate messages per hour (based on total sent)
  const messagesPerHour = Math.round(totalSent / 24);

  // Simulate average delivery time (in seconds)
  const averageDeliveryTime = 2.5;

  // Success rate (delivery rate)
  const successRate = metrics.deliveryRate;

  // Active clients percentage
  const activeClientsPercentage =
    totalClients > 0 ? Math.round((connectedClients / totalClients) * 100) : 0;

  // Average messages per client
  const avgMessagesPerClient =
    totalClients > 0 ? Math.round(totalSent / totalClients) : 0;

  return {
    messagesPerHour,
    averageDeliveryTime,
    successRate,
    activeClientsPercentage,
    avgMessagesPerClient,
  };
}

/**
 * Calculate trend metrics (simulated)
 */
function calculateTrendMetrics(metrics: MockMetrics): TrendMetrics {
  const { deliveryRate, connectedClients, totalClients } = metrics;

  // Simulate trends based on current metrics
  const sentTrend: "up" | "down" | "stable" =
    connectedClients > totalClients * 0.5 ? "up" : "stable";

  const deliveryRateTrend: "up" | "down" | "stable" =
    deliveryRate >= 95 ? "up" : deliveryRate >= 90 ? "stable" : "down";

  const clientsTrend: "up" | "down" | "stable" =
    connectedClients > totalClients * 0.6 ? "up" : "stable";

  // Simulate trend percentage
  const trendPercentage = Math.round(Math.random() * 20 + 5);

  return {
    sentTrend,
    deliveryRateTrend,
    clientsTrend,
    trendPercentage,
  };
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook to get basic metrics summary
 */
export function useMetrics() {
  const { data: clients } = useClients();

  return useQuery({
    queryKey: metricsKeys.summary(),
    queryFn: () => {
      if (!clients) return null;
      return calculateMetrics(clients);
    },
    enabled: !!clients,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get performance metrics
 */
export function usePerformanceMetrics() {
  const { data: metrics } = useMetrics();

  return useQuery({
    queryKey: metricsKeys.performance(),
    queryFn: () => {
      if (!metrics) return null;
      return calculatePerformanceMetrics(metrics);
    },
    enabled: !!metrics,
    staleTime: 30000,
  });
}

/**
 * Hook to get trend metrics
 */
export function useTrendMetrics() {
  const { data: metrics } = useMetrics();

  return useQuery({
    queryKey: metricsKeys.trends(),
    queryFn: () => {
      if (!metrics) return null;
      return calculateTrendMetrics(metrics);
    },
    enabled: !!metrics,
    staleTime: 60000, // 1 minute for trends
  });
}

/**
 * Hook to get metrics for a specific client
 */
export function useClientMetrics(clientId?: string) {
  const { data: clients } = useClients();
  const { data: messages } = useMessages({ clientId });

  return useQuery({
    queryKey: metricsKeys.client(clientId),
    queryFn: () => {
      if (!clients || !clientId) return null;

      const client = clients.find((c) => c.id === clientId);
      if (!client) return null;

      const clientMessages = messages || [];

      return {
        clientId: client.id,
        clientName: client.name,
        status: client.status,
        messagesSent: client.messagesSent,
        messagesDelivered: client.messagesDelivered,
        messagesFailed: client.messagesFailed,
        deliveryRate:
          client.messagesSent > 0
            ? Math.round((client.messagesDelivered / client.messagesSent) * 100)
            : 0,
        totalMessages: clientMessages.length,
        lastConnected: client.lastConnected,
        accountAge: Math.floor(
          (Date.now() - client.createdAt.getTime()) / (1000 * 60 * 60 * 24),
        ),
      };
    },
    enabled: !!clients && !!clientId,
    staleTime: 30000,
  });
}

/**
 * Compound hook that provides all metrics
 */
export function useMetricsManagement() {
  const metricsQuery = useMetrics();
  const performanceQuery = usePerformanceMetrics();
  const trendsQuery = useTrendMetrics();

  return {
    // Basic metrics
    metrics: metricsQuery.data,
    isLoadingMetrics: metricsQuery.isLoading,
    isErrorMetrics: metricsQuery.isError,

    // Performance metrics
    performance: performanceQuery.data,
    isLoadingPerformance: performanceQuery.isLoading,

    // Trend metrics
    trends: trendsQuery.data,
    isLoadingTrends: trendsQuery.isLoading,

    // Refetch functions
    refetchMetrics: metricsQuery.refetch,
    refetchPerformance: performanceQuery.refetch,
    refetchTrends: trendsQuery.refetch,
  };
}

/**
 * Hook to get real-time metrics with auto-refresh
 */
export function useRealtimeMetrics() {
  const { data: clients } = useClients();

  return useQuery({
    queryKey: [...metricsKeys.summary(), "realtime"],
    queryFn: () => {
      if (!clients) return null;
      return calculateMetrics(clients);
    },
    enabled: !!clients,
    staleTime: 5000, // 5 seconds for real-time
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });
}

/**
 * Hook to compare metrics over time periods
 */
export function useMetricsComparison() {
  const { data: currentMetrics } = useMetrics();

  // In a real app, this would fetch historical data
  // For now, we'll simulate previous period metrics
  const previousMetrics = currentMetrics
    ? {
        ...currentMetrics,
        totalSent: Math.round(currentMetrics.totalSent * 0.85),
        totalDelivered: Math.round(currentMetrics.totalDelivered * 0.85),
        connectedClients: Math.max(1, currentMetrics.connectedClients - 1),
      }
    : null;

  const comparison =
    currentMetrics && previousMetrics
      ? {
          sentChange: currentMetrics.totalSent - previousMetrics.totalSent,
          sentChangePercent: Math.round(
            ((currentMetrics.totalSent - previousMetrics.totalSent) /
              previousMetrics.totalSent) *
              100,
          ),
          deliveredChange:
            currentMetrics.totalDelivered - previousMetrics.totalDelivered,
          deliveryRateChange:
            currentMetrics.deliveryRate - previousMetrics.deliveryRate,
          clientsChange:
            currentMetrics.connectedClients - previousMetrics.connectedClients,
        }
      : null;

  return {
    current: currentMetrics,
    previous: previousMetrics,
    comparison,
  };
}
