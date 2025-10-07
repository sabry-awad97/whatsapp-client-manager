/**
 * Custom Hook for Activity Management with TanStack Query
 *
 * Provides read operations for activity feed with filtering,
 * caching, and automatic refetching.
 */

import type { ActivityType } from "@/components/activity-feed";
import { type MockActivity } from "@/domain/mocks";
import { mockActivities } from "@/domain/mocks/mock-data";
import { useQuery } from "@tanstack/react-query";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const activityKeys = {
  all: ["activities"] as const,
  lists: () => [...activityKeys.all, "list"] as const,
  list: (filters?: ActivityFilters) =>
    [...activityKeys.lists(), filters] as const,
  details: () => [...activityKeys.all, "detail"] as const,
  detail: (id: string) => [...activityKeys.details(), id] as const,
  byClient: (clientName: string) =>
    [...activityKeys.all, "client", clientName] as const,
  byType: (type: ActivityType) => [...activityKeys.all, "type", type] as const,
};

// ============================================================================
// TYPES
// ============================================================================

export interface ActivityFilters {
  type?: ActivityType;
  clientName?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
}

// ============================================================================
// API SIMULATION FUNCTIONS
// ============================================================================

/**
 * Simulates fetching activities from API
 */
async function fetchActivities(
  filters?: ActivityFilters,
): Promise<MockActivity[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  let activities = [...mockActivities];

  // Apply filters
  if (filters?.type) {
    activities = activities.filter((a) => a.type === filters.type);
  }

  if (filters?.clientName) {
    const clientNameLower = filters.clientName.toLowerCase();
    activities = activities.filter((a) =>
      a.metadata?.clientName?.toLowerCase().includes(clientNameLower),
    );
  }

  if (filters?.dateFrom) {
    const dateFrom = filters.dateFrom;
    activities = activities.filter((a) => a.timestamp >= dateFrom);
  }

  if (filters?.dateTo) {
    const dateTo = filters.dateTo;
    activities = activities.filter((a) => a.timestamp <= dateTo);
  }

  // Sort by most recent first
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Apply limit
  if (filters?.limit && filters.limit > 0) {
    activities = activities.slice(0, filters.limit);
  }

  return activities;
}

/**
 * Simulates fetching a single activity
 */
async function fetchActivity(id: string): Promise<MockActivity | null> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return mockActivities.find((a) => a.id === id) || null;
}

/**
 * Simulates fetching activities for a specific client
 */
async function fetchActivitiesByClient(
  clientName: string,
): Promise<MockActivity[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return mockActivities.filter(
    (a) => a.metadata?.clientName?.toLowerCase() === clientName.toLowerCase(),
  );
}

/**
 * Simulates fetching activities by type
 */
async function fetchActivitiesByType(
  type: ActivityType,
): Promise<MockActivity[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return mockActivities.filter((a) => a.type === type);
}

/**
 * Simulates fetching recent activities
 */
async function fetchRecentActivities(
  limit: number = 10,
): Promise<MockActivity[]> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return [...mockActivities]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook to fetch all activities with optional filters
 */
export function useActivities(filters?: ActivityFilters) {
  return useQuery({
    queryKey: activityKeys.list(filters),
    queryFn: () => fetchActivities(filters),
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchInterval: 10000, // Auto-refetch every 10 seconds for updates
  });
}

/**
 * Hook to fetch a single activity by ID
 */
export function useActivity(id: string) {
  return useQuery({
    queryKey: activityKeys.detail(id),
    queryFn: () => fetchActivity(id),
    enabled: !!id,
    staleTime: 30000,
  });
}

/**
 * Hook to fetch activities for a specific client
 */
export function useClientActivities(clientName: string) {
  return useQuery({
    queryKey: activityKeys.byClient(clientName),
    queryFn: () => fetchActivitiesByClient(clientName),
    enabled: !!clientName,
    staleTime: 30000,
    refetchInterval: 10000,
  });
}

/**
 * Hook to fetch activities by type
 */
export function useActivitiesByType(type: ActivityType) {
  return useQuery({
    queryKey: activityKeys.byType(type),
    queryFn: () => fetchActivitiesByType(type),
    enabled: !!type,
    staleTime: 30000,
  });
}

/**
 * Hook to fetch recent activities with limit
 */
export function useRecentActivities(limit: number = 10) {
  return useQuery({
    queryKey: activityKeys.list({ limit }),
    queryFn: () => fetchRecentActivities(limit),
    staleTime: 20000, // Shorter stale time for recent activities
    refetchInterval: 5000, // More frequent updates for recent items
  });
}

/**
 * Hook to get activity statistics
 */
export function useActivityStats() {
  const { data: activities } = useActivities();

  const stats = {
    total: activities?.length || 0,
    byType: {} as Record<ActivityType, number>,
    recentCount: 0,
    lastActivity: activities?.[0]?.timestamp,
  };

  if (activities) {
    // Count by type
    activities.forEach((activity) => {
      stats.byType[activity.type] = (stats.byType[activity.type] || 0) + 1;
    });

    // Count recent (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    stats.recentCount = activities.filter(
      (a) => a.timestamp >= oneHourAgo,
    ).length;
  }

  return stats;
}

/**
 * Compound hook that provides all activity operations
 */
export function useActivityManagement(filters?: ActivityFilters) {
  const activitiesQuery = useActivities(filters);
  const stats = useActivityStats();

  return {
    // Query state
    activities: activitiesQuery.data || [],
    isLoading: activitiesQuery.isLoading,
    isError: activitiesQuery.isError,
    error: activitiesQuery.error,
    refetch: activitiesQuery.refetch,

    // Statistics
    stats,
  };
}
