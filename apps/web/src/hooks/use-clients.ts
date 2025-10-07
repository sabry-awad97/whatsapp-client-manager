/**
 * Custom Hook for Client Management with TanStack Query
 *
 * Provides CRUD operations for WhatsApp clients with optimistic updates,
 * caching, and automatic refetching.
 */

import { getClients, type MockClient } from "@/domain/mocks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const clientKeys = {
  all: ["clients"] as const,
  lists: () => [...clientKeys.all, "list"] as const,
  list: (filters?: ClientFilters) => [...clientKeys.lists(), filters] as const,
  details: () => [...clientKeys.all, "detail"] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
};

// ============================================================================
// TYPES
// ============================================================================

export type ClientStatus = MockClient["status"];

export interface ClientFilters {
  status?: ClientStatus;
  search?: string;
}

export interface CreateClientInput {
  name: string;
  phoneNumber: string;
  status?: ClientStatus;
}

export interface UpdateClientInput {
  id: string;
  name?: string;
  phoneNumber?: string;
  status?: ClientStatus;
}

// ============================================================================
// API SIMULATION FUNCTIONS
// ============================================================================

/**
 * Simulates fetching clients from API
 */
async function fetchClients(filters?: ClientFilters): Promise<MockClient[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  let clients = getClients();

  // Apply filters
  if (filters?.status) {
    clients = clients.filter((c) => c.status === filters.status);
  }

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    clients = clients.filter(
      (c) =>
        c.name.toLowerCase().includes(searchLower) ||
        c.phoneNumber.includes(searchLower),
    );
  }

  return clients;
}

/**
 * Simulates fetching a single client
 */
async function fetchClient(id: string): Promise<MockClient | null> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const clients = getClients();
  return clients.find((c) => c.id === id) || null;
}

/**
 * Simulates creating a new client
 */
async function createClient(input: CreateClientInput): Promise<MockClient> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const newClient: MockClient = {
    id: Math.random().toString(36).substring(2, 11),
    name: input.name,
    phoneNumber: input.phoneNumber,
    status: input.status || "disconnected",
    lastConnected: null,
    messagesSent: 0,
    messagesDelivered: 0,
    messagesFailed: 0,
    createdAt: new Date(),
  };

  return newClient;
}

/**
 * Simulates updating a client
 */
async function updateClient(input: UpdateClientInput): Promise<MockClient> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const clients = getClients();
  const existingClient = clients.find((c) => c.id === input.id);

  if (!existingClient) {
    throw new Error(`Client with id ${input.id} not found`);
  }

  const updatedClient: MockClient = {
    ...existingClient,
    ...(input.name && { name: input.name }),
    ...(input.phoneNumber && { phoneNumber: input.phoneNumber }),
    ...(input.status && {
      status: input.status,
      lastConnected:
        input.status === "connected"
          ? new Date()
          : existingClient.lastConnected,
    }),
  };

  return updatedClient;
}

/**
 * Simulates deleting a client
 */
async function deleteClient(id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  // In real implementation, this would call the API
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook to fetch all clients with optional filters
 */
export function useClients(filters?: ClientFilters) {
  return useQuery({
    queryKey: clientKeys.list(filters),
    queryFn: () => fetchClients(filters),
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
}

/**
 * Hook to fetch a single client by ID
 */
export function useClient(id: string) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => fetchClient(id),
    enabled: !!id,
    staleTime: 30000,
  });
}

/**
 * Hook to create a new client
 */
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClient,
    onSuccess: (newClient) => {
      // Invalidate and refetch clients list
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });

      // Optionally set the new client in cache
      queryClient.setQueryData(clientKeys.detail(newClient.id), newClient);
    },
    onError: (error) => {
      console.error("Failed to create client:", error);
    },
  });
}

/**
 * Hook to update a client with optimistic updates
 */
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateClient,
    onMutate: async (input) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: clientKeys.detail(input.id),
      });

      // Snapshot previous value
      const previousClient = queryClient.getQueryData<MockClient>(
        clientKeys.detail(input.id),
      );

      // Optimistically update
      if (previousClient) {
        queryClient.setQueryData<MockClient>(clientKeys.detail(input.id), {
          ...previousClient,
          ...input,
        });
      }

      return { previousClient };
    },
    onError: (error, input, context) => {
      // Rollback on error
      if (context?.previousClient) {
        queryClient.setQueryData(
          clientKeys.detail(input.id),
          context.previousClient,
        );
      }
      console.error("Failed to update client:", error);
    },
    onSettled: (data, error, input) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(input.id) });
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}

/**
 * Hook to update client status specifically
 */
export function useUpdateClientStatus() {
  const updateClient = useUpdateClient();

  return {
    ...updateClient,
    mutate: (clientId: string, status: ClientStatus) => {
      updateClient.mutate({ id: clientId, status });
    },
    mutateAsync: (clientId: string, status: ClientStatus) => {
      return updateClient.mutateAsync({ id: clientId, status });
    },
  };
}

/**
 * Hook to delete a client
 */
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteClient,
    onMutate: async (clientId) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: clientKeys.lists() });

      // Snapshot
      const previousClients = queryClient.getQueryData<MockClient[]>(
        clientKeys.lists(),
      );

      // Optimistically remove from cache
      if (previousClients) {
        queryClient.setQueryData<MockClient[]>(
          clientKeys.lists(),
          previousClients.filter((c) => c.id !== clientId),
        );
      }

      return { previousClients };
    },
    onError: (error, clientId, context) => {
      // Rollback
      if (context?.previousClients) {
        queryClient.setQueryData(clientKeys.lists(), context.previousClients);
      }
      console.error("Failed to delete client:", error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}

/**
 * Compound hook that provides all client operations
 */
export function useClientManagement(filters?: ClientFilters) {
  const clientsQuery = useClients(filters);
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();
  const updateStatusMutation = useUpdateClientStatus();

  return {
    // Query state
    clients: clientsQuery.data || [],
    isLoading: clientsQuery.isLoading,
    isError: clientsQuery.isError,
    error: clientsQuery.error,
    refetch: clientsQuery.refetch,

    // Mutations
    createClient: createMutation.mutate,
    createClientAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    updateClient: updateMutation.mutate,
    updateClientAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    updateClientStatus: updateStatusMutation.mutate,
    updateClientStatusAsync: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,

    deleteClient: deleteMutation.mutate,
    deleteClientAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
