/**
 * Custom Hook for Message Management with TanStack Query
 *
 * Provides CRUD operations for WhatsApp messages with optimistic updates,
 * real-time status simulation, and automatic refetching.
 */

import { type Message, type MessageStatus } from "@/domain/mocks";
import { mockMessages } from "@/domain/mocks/mock-data";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const messageKeys = {
  all: ["messages"] as const,
  lists: () => [...messageKeys.all, "list"] as const,
  list: (filters?: MessageFilters) =>
    [...messageKeys.lists(), filters] as const,
  details: () => [...messageKeys.all, "detail"] as const,
  detail: (id: string) => [...messageKeys.details(), id] as const,
  byClient: (clientId: string) =>
    [...messageKeys.all, "client", clientId] as const,
};

// ============================================================================
// TYPES
// ============================================================================

export interface MessageFilters {
  clientId?: string;
  status?: MessageStatus;
  recipient?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface SendMessageInput {
  clientId: string;
  recipient: string;
  content: string;
  templateId?: string;
}

export interface UpdateMessageStatusInput {
  id: string;
  status: MessageStatus;
  deliveredAt?: Date;
  readAt?: Date;
  error?: string;
}

// ============================================================================
// MOCK DATA STORE (In-memory for demo)
// ============================================================================

// ============================================================================
// API SIMULATION FUNCTIONS
// ============================================================================

/**
 * Simulates fetching messages from API
 */
async function fetchMessages(filters?: MessageFilters): Promise<Message[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  let messages = mockMessages;

  // Apply filters
  if (filters?.clientId) {
    messages = messages.filter((m) => m.clientId === filters.clientId);
  }

  if (filters?.status) {
    messages = messages.filter((m) => m.status === filters.status);
  }

  if (filters?.recipient) {
    const recipient = filters.recipient;
    messages = messages.filter((m) => m.recipient.includes(recipient));
  }

  if (filters?.dateFrom) {
    const dateFrom = filters.dateFrom;
    messages = messages.filter((m) => m.sentAt >= dateFrom);
  }

  if (filters?.dateTo) {
    const dateTo = filters.dateTo;
    messages = messages.filter((m) => m.sentAt <= dateTo);
  }

  // Sort by most recent first
  return messages.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
}

/**
 * Simulates fetching a single message
 */
async function fetchMessage(id: string): Promise<Message | null> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return mockMessages.find((m) => m.id === id) || null;
}

/**
 * Simulates sending a message
 */
async function sendMessage(input: SendMessageInput): Promise<Message> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const newMessage: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    clientId: input.clientId,
    recipient: input.recipient,
    content: input.content,
    status: "pending",
    sentAt: new Date(),
    ...(input.templateId && { templateId: input.templateId }),
  };

  mockMessages.push(newMessage);

  // Simulate status progression
  simulateMessageStatusProgression(newMessage.id);

  return newMessage;
}

/**
 * Simulates message status progression (pending -> sent -> delivered -> read)
 */
function simulateMessageStatusProgression(messageId: string) {
  // Update to "sent" after 1 second
  setTimeout(() => {
    const message = mockMessages.find((m) => m.id === messageId);
    if (message && message.status === "pending") {
      message.status = "sent";
    }
  }, 1000);

  // Update to "delivered" after 2 seconds
  setTimeout(() => {
    const message = mockMessages.find((m) => m.id === messageId);
    if (message && message.status === "sent") {
      message.status = "delivered";
      message.deliveredAt = new Date();
    }
  }, 2000);

  // Randomly update to "read" after 5 seconds (70% chance)
  setTimeout(() => {
    const message = mockMessages.find((m) => m.id === messageId);
    if (message && message.status === "delivered" && Math.random() > 0.3) {
      message.status = "read";
      message.readAt = new Date();
    }
  }, 5000);
}

/**
 * Simulates updating message status
 */
async function updateMessageStatus(
  input: UpdateMessageStatusInput,
): Promise<Message> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const message = mockMessages.find((m) => m.id === input.id);

  if (!message) {
    throw new Error(`Message with id ${input.id} not found`);
  }

  const updatedMessage: Message = {
    ...message,
    status: input.status,
    ...(input.deliveredAt && { deliveredAt: input.deliveredAt }),
    ...(input.readAt && { readAt: input.readAt }),
    ...(input.error && { error: input.error }),
  };

  const index = mockMessages.findIndex((m) => m.id === input.id);
  mockMessages[index] = updatedMessage;

  return updatedMessage;
}

/**
 * Simulates deleting a message
 */
async function deleteMessage(id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const index = mockMessages.findIndex((m) => m.id === id);
  if (index !== -1) {
    mockMessages.splice(index, 1);
  }
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook to fetch messages with optional filters
 */
export function useMessages(filters?: MessageFilters) {
  return useQuery({
    queryKey: messageKeys.list(filters),
    queryFn: () => fetchMessages(filters),
    staleTime: 10000, // Consider data fresh for 10 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchInterval: 5000, // Auto-refetch every 5 seconds for real-time updates
  });
}

/**
 * Hook to fetch messages for a specific client
 */
export function useClientMessages(clientId: string) {
  return useMessages({ clientId });
}

/**
 * Hook to fetch a single message by ID
 */
export function useMessage(id: string) {
  return useQuery({
    queryKey: messageKeys.detail(id),
    queryFn: () => fetchMessage(id),
    enabled: !!id,
    staleTime: 10000,
  });
}

/**
 * Hook to send a message with optimistic updates
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendMessage,
    onMutate: async (input) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: messageKeys.lists() });

      // Create optimistic message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        clientId: input.clientId,
        recipient: input.recipient,
        content: input.content,
        status: "pending",
        sentAt: new Date(),
        ...(input.templateId && { templateId: input.templateId }),
      };

      // Snapshot previous messages
      const previousMessages = queryClient.getQueryData<Message[]>(
        messageKeys.list({ clientId: input.clientId }),
      );

      // Optimistically add message
      if (previousMessages) {
        queryClient.setQueryData<Message[]>(
          messageKeys.list({ clientId: input.clientId }),
          [optimisticMessage, ...previousMessages],
        );
      }

      return { previousMessages, optimisticMessage };
    },
    onSuccess: (newMessage, input) => {
      // Replace optimistic message with real one
      queryClient.setQueryData<Message[]>(
        messageKeys.list({ clientId: input.clientId }),
        (old) => {
          if (!old) return [newMessage];
          return old.map((m) => (m.id.startsWith("temp-") ? newMessage : m));
        },
      );

      // Set individual message in cache
      queryClient.setQueryData(messageKeys.detail(newMessage.id), newMessage);
    },
    onError: (error, input, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          messageKeys.list({ clientId: input.clientId }),
          context.previousMessages,
        );
      }
      console.error("Failed to send message:", error);
    },
    onSettled: (data, error, input) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
    },
  });
}

/**
 * Hook to update message status
 */
export function useUpdateMessageStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMessageStatus,
    onSuccess: (updatedMessage) => {
      // Update message in cache
      queryClient.setQueryData(
        messageKeys.detail(updatedMessage.id),
        updatedMessage,
      );

      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
    },
    onError: (error) => {
      console.error("Failed to update message status:", error);
    },
  });
}

/**
 * Hook to delete a message
 */
export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMessage,
    onMutate: async (messageId) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: messageKeys.lists() });

      // Snapshot
      const previousMessages = queryClient.getQueryData<Message[]>(
        messageKeys.lists(),
      );

      // Optimistically remove
      if (previousMessages) {
        queryClient.setQueryData<Message[]>(
          messageKeys.lists(),
          previousMessages.filter((m) => m.id !== messageId),
        );
      }

      return { previousMessages };
    },
    onError: (error, messageId, context) => {
      // Rollback
      if (context?.previousMessages) {
        queryClient.setQueryData(messageKeys.lists(), context.previousMessages);
      }
      console.error("Failed to delete message:", error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
    },
  });
}

/**
 * Compound hook that provides all message operations
 */
export function useMessageManagement(filters?: MessageFilters) {
  const messagesQuery = useMessages(filters);
  const sendMutation = useSendMessage();
  const updateStatusMutation = useUpdateMessageStatus();
  const deleteMutation = useDeleteMessage();

  return {
    // Query state
    messages: messagesQuery.data || [],
    isLoading: messagesQuery.isLoading,
    isError: messagesQuery.isError,
    error: messagesQuery.error,
    refetch: messagesQuery.refetch,

    // Mutations
    sendMessage: sendMutation.mutate,
    sendMessageAsync: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,

    updateMessageStatus: updateStatusMutation.mutate,
    updateMessageStatusAsync: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,

    deleteMessage: deleteMutation.mutate,
    deleteMessageAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
