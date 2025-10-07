/**
 * Custom Hook for Campaign Management with TanStack Query
 *
 * Provides CRUD operations for bulk messaging campaigns with optimistic updates,
 * caching, and automatic refetching.
 */

import {
  getCampaigns,
  getCampaignById,
  getTemplates,
  type BulkCampaign,
  type CampaignStatus,
  type MessageTemplate,
} from "@/domain/mocks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const campaignKeys = {
  all: ["campaigns"] as const,
  lists: () => [...campaignKeys.all, "list"] as const,
  list: (filters?: CampaignFilters) =>
    [...campaignKeys.lists(), filters] as const,
  details: () => [...campaignKeys.all, "detail"] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,
  templates: ["templates"] as const,
};

// ============================================================================
// TYPES
// ============================================================================

export interface CampaignFilters {
  status?: CampaignStatus;
  clientId?: string;
  search?: string;
}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  templateId: string;
  clientId: string;
  recipients: any[];
  scheduledAt?: Date;
}

export interface UpdateCampaignInput {
  id: string;
  name?: string;
  description?: string;
  status?: CampaignStatus;
}

// ============================================================================
// API SIMULATION FUNCTIONS
// ============================================================================

/**
 * Simulates fetching campaigns from API
 */
async function fetchCampaigns(
  filters?: CampaignFilters,
): Promise<BulkCampaign[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  let campaigns = getCampaigns();

  // Apply filters
  if (filters?.status) {
    campaigns = campaigns.filter((c) => c.status === filters.status);
  }

  if (filters?.clientId) {
    campaigns = campaigns.filter((c) => c.clientId === filters.clientId);
  }

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    campaigns = campaigns.filter(
      (c) =>
        c.name.toLowerCase().includes(searchLower) ||
        c.description?.toLowerCase().includes(searchLower),
    );
  }

  return campaigns;
}

/**
 * Simulates fetching a single campaign
 */
async function fetchCampaign(id: string): Promise<BulkCampaign | null> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return getCampaignById(id) || null;
}

/**
 * Simulates creating a new campaign
 */
async function createCampaign(
  input: CreateCampaignInput,
): Promise<BulkCampaign> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const templates = getTemplates();
  const template = templates.find((t) => t.id === input.templateId);

  if (!template) {
    throw new Error("Template not found");
  }

  const newCampaign: BulkCampaign = {
    id: Math.random().toString(36).substring(2, 11),
    name: input.name,
    description: input.description,
    template,
    clientId: input.clientId,
    recipients: input.recipients,
    status: input.scheduledAt ? "scheduled" : "draft",
    progress: {
      total: input.recipients.length,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      pending: input.recipients.length,
    },
    createdAt: new Date(),
    scheduledAt: input.scheduledAt,
  };

  return newCampaign;
}

/**
 * Simulates updating a campaign
 */
async function updateCampaign(
  input: UpdateCampaignInput,
): Promise<BulkCampaign> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const campaign = getCampaignById(input.id);

  if (!campaign) {
    throw new Error(`Campaign with id ${input.id} not found`);
  }

  const updatedCampaign: BulkCampaign = {
    ...campaign,
    ...(input.name && { name: input.name }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.status && { status: input.status }),
  };

  return updatedCampaign;
}

/**
 * Simulates deleting a campaign
 */
async function deleteCampaign(id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300));
}

/**
 * Simulates starting a campaign
 */
async function startCampaign(id: string): Promise<BulkCampaign> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const campaign = getCampaignById(id);
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  return {
    ...campaign,
    status: "running",
    startedAt: campaign.startedAt || new Date(),
  };
}

/**
 * Simulates pausing a campaign
 */
async function pauseCampaign(id: string): Promise<BulkCampaign> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const campaign = getCampaignById(id);
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  return {
    ...campaign,
    status: "paused",
  };
}

/**
 * Simulates stopping a campaign
 */
async function stopCampaign(id: string): Promise<BulkCampaign> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const campaign = getCampaignById(id);
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  return {
    ...campaign,
    status: "completed",
    completedAt: new Date(),
  };
}

/**
 * Fetches message templates
 */
async function fetchTemplates(): Promise<MessageTemplate[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return getTemplates();
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook to fetch all campaigns with optional filters
 */
export function useCampaigns(filters?: CampaignFilters) {
  return useQuery({
    queryKey: campaignKeys.list(filters),
    queryFn: () => fetchCampaigns(filters),
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch a single campaign by ID
 */
export function useCampaign(id: string) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: () => fetchCampaign(id),
    enabled: !!id,
    staleTime: 30000,
  });
}

/**
 * Hook to fetch message templates
 */
export function useTemplates() {
  return useQuery({
    queryKey: campaignKeys.templates,
    queryFn: fetchTemplates,
    staleTime: 5 * 60 * 1000, // Templates rarely change
  });
}

/**
 * Hook to create a new campaign
 */
export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCampaign,
    onSuccess: (newCampaign) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.setQueryData(
        campaignKeys.detail(newCampaign.id),
        newCampaign,
      );
    },
    onError: (error) => {
      console.error("Failed to create campaign:", error);
    },
  });
}

/**
 * Hook to update a campaign with optimistic updates
 */
export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCampaign,
    onMutate: async (input) => {
      await queryClient.cancelQueries({
        queryKey: campaignKeys.detail(input.id),
      });

      const previousCampaign = queryClient.getQueryData<BulkCampaign>(
        campaignKeys.detail(input.id),
      );

      if (previousCampaign) {
        queryClient.setQueryData<BulkCampaign>(campaignKeys.detail(input.id), {
          ...previousCampaign,
          ...input,
        });
      }

      return { previousCampaign };
    },
    onError: (error, input, context) => {
      if (context?.previousCampaign) {
        queryClient.setQueryData(
          campaignKeys.detail(input.id),
          context.previousCampaign,
        );
      }
      console.error("Failed to update campaign:", error);
    },
    onSettled: (data, error, input) => {
      queryClient.invalidateQueries({
        queryKey: campaignKeys.detail(input.id),
      });
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
  });
}

/**
 * Hook to delete a campaign
 */
export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCampaign,
    onMutate: async (campaignId) => {
      await queryClient.cancelQueries({ queryKey: campaignKeys.lists() });

      const previousCampaigns = queryClient.getQueryData<BulkCampaign[]>(
        campaignKeys.lists(),
      );

      if (previousCampaigns) {
        queryClient.setQueryData<BulkCampaign[]>(
          campaignKeys.lists(),
          previousCampaigns.filter((c) => c.id !== campaignId),
        );
      }

      return { previousCampaigns };
    },
    onError: (error, campaignId, context) => {
      if (context?.previousCampaigns) {
        queryClient.setQueryData(
          campaignKeys.lists(),
          context.previousCampaigns,
        );
      }
      console.error("Failed to delete campaign:", error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
  });
}

/**
 * Hook to start a campaign
 */
export function useStartCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startCampaign,
    onSuccess: (updatedCampaign) => {
      queryClient.setQueryData(
        campaignKeys.detail(updatedCampaign.id),
        updatedCampaign,
      );
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
  });
}

/**
 * Hook to pause a campaign
 */
export function usePauseCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pauseCampaign,
    onSuccess: (updatedCampaign) => {
      queryClient.setQueryData(
        campaignKeys.detail(updatedCampaign.id),
        updatedCampaign,
      );
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
  });
}

/**
 * Hook to stop a campaign
 */
export function useStopCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: stopCampaign,
    onSuccess: (updatedCampaign) => {
      queryClient.setQueryData(
        campaignKeys.detail(updatedCampaign.id),
        updatedCampaign,
      );
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
  });
}

/**
 * WebSocket hook for real-time campaign progress updates
 */
export function useCampaignRealtime(campaignId: string | null) {
  const [progress, setProgress] = useState<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!campaignId) return;

    // TODO: Replace with actual WebSocket connection
    // const ws = new WebSocket(`ws://your-backend/campaigns/${campaignId}`);
    // ws.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   setProgress(data);
    //   queryClient.invalidateQueries({ queryKey: campaignKeys.detail(campaignId) });
    // };
    // return () => ws.close();

    // Simulated real-time updates
    const interval = setInterval(() => {
      setProgress((prev: any) => ({
        ...prev,
        sent: (prev?.sent || 0) + Math.floor(Math.random() * 10),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [campaignId, queryClient]);

  return progress;
}

/**
 * Compound hook that provides all campaign operations
 */
export function useCampaignManagement(filters?: CampaignFilters) {
  const campaignsQuery = useCampaigns(filters);
  const templatesQuery = useTemplates();
  const createMutation = useCreateCampaign();
  const updateMutation = useUpdateCampaign();
  const deleteMutation = useDeleteCampaign();
  const startMutation = useStartCampaign();
  const pauseMutation = usePauseCampaign();
  const stopMutation = useStopCampaign();

  return {
    // Query state
    campaigns: campaignsQuery.data || [],
    isLoading: campaignsQuery.isLoading,
    isError: campaignsQuery.isError,
    error: campaignsQuery.error,
    refetch: campaignsQuery.refetch,

    // Templates
    templates: templatesQuery.data || [],
    isLoadingTemplates: templatesQuery.isLoading,

    // Mutations
    createCampaign: createMutation.mutate,
    createCampaignAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    updateCampaign: updateMutation.mutate,
    updateCampaignAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    deleteCampaign: deleteMutation.mutate,
    deleteCampaignAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    startCampaign: startMutation.mutate,
    startCampaignAsync: startMutation.mutateAsync,
    isStarting: startMutation.isPending,

    pauseCampaign: pauseMutation.mutate,
    pauseCampaignAsync: pauseMutation.mutateAsync,
    isPausing: pauseMutation.isPending,

    stopCampaign: stopMutation.mutate,
    stopCampaignAsync: stopMutation.mutateAsync,
    isStopping: stopMutation.isPending,
  };
}
