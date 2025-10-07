import { DataFetchError, ErrorBoundary } from "@/components/error-boundary";
import { TooltipIconButton } from "@/components/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { MessageStatus } from "@/domain/mocks";
import { useClients } from "@/hooks/use-clients";
import {
  useMessageManagement,
  type SendMessageInput,
} from "@/hooks/use-messages";
import { cn } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Download,
  Eye,
  FileText,
  Filter,
  Loader2,
  MessageSquare,
  MoreVertical,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// ============================================================================
// EXTENSIBILITY LAYER - Service Abstractions
// ============================================================================

/**
 * Message Service Interface
 * This abstraction allows swapping between mock data, REST API, WebSocket, or GraphQL
 */
interface IMessageService {
  sendMessage(data: SendMessageInput): Promise<void>;
  deleteMessage(id: string): Promise<void>;
  bulkDeleteMessages(ids: string[]): Promise<void>;
  exportMessages(filters: MessageFilters): Promise<Blob>;
  scheduleMessage(data: SendMessageInput, scheduledAt: Date): Promise<void>;
}

/**
 * Real-time Service Interface
 * Enables WebSocket, Server-Sent Events, or polling for live updates
 */
interface IRealtimeService {
  subscribe(callback: (event: MessageEvent) => void): () => void;
  connect(): void;
  disconnect(): void;
}

/**
 * Analytics Service Interface
 * Track message metrics and user behavior
 */
interface IAnalyticsService {
  trackMessageSent(messageId: string, metadata: Record<string, any>): void;
  trackMessageOpened(messageId: string): void;
  trackError(error: Error, context: Record<string, any>): void;
}

/**
 * Message Event Types for Real-time Updates
 */
type MessageEvent =
  | { type: "message.sent"; payload: { id: string; status: MessageStatus } }
  | { type: "message.delivered"; payload: { id: string; deliveredAt: Date } }
  | { type: "message.read"; payload: { id: string; readAt: Date } }
  | { type: "message.failed"; payload: { id: string; error: string } };

/**
 * Message Filters Interface
 * Extensible filtering system
 */
interface MessageFilters {
  status?: MessageStatus | "all";
  clientId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  recipient?: string;
  hasAttachment?: boolean;
}

/**
 * Pagination Interface
 * For handling large message datasets
 */
interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Bulk Operation Result
 * Provides detailed feedback on bulk operations
 */
interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

export const Route = createFileRoute("/messages")({
  component: () => (
    <ErrorBoundary>
      <MessagesPage />
    </ErrorBoundary>
  ),
});

// ============================================================================
// SERVICE IMPLEMENTATIONS - Ready for Backend Integration
// ============================================================================

/**
 * Custom Hook for Real-time Message Updates
 * Replace with WebSocket/SSE implementation when backend is ready
 */
function useRealtimeMessages(enabled: boolean = true) {
  const [events, setEvents] = useState<MessageEvent[]>([]);

  useEffect(() => {
    if (!enabled) return;

    // TODO: Replace with actual WebSocket connection
    // const ws = new WebSocket('ws://your-backend/messages');
    // ws.onmessage = (event) => {
    //   const messageEvent = JSON.parse(event.data);
    //   setEvents(prev => [...prev, messageEvent]);
    // };
    // return () => ws.close();

    // Simulated real-time updates for now
    const interval = setInterval(() => {
      // Simulate random status updates
      const eventTypes: MessageEvent["type"][] = [
        "message.sent",
        "message.delivered",
        "message.read",
      ];
      const randomEvent =
        eventTypes[Math.floor(Math.random() * eventTypes.length)];
      // This would be replaced by actual WebSocket events
    }, 5000);

    return () => clearInterval(interval);
  }, [enabled]);

  return events;
}

/**
 * Custom Hook for Message Analytics
 * Integrates with analytics services (Google Analytics, Mixpanel, etc.)
 */
function useMessageAnalytics() {
  const trackMessageSent = useCallback(
    (messageId: string, metadata: Record<string, any>) => {
      // TODO: Integrate with your analytics service
      // analytics.track('message_sent', { messageId, ...metadata });
      console.log("Analytics: Message sent", { messageId, metadata });
    },
    [],
  );

  const trackMessageOpened = useCallback((messageId: string) => {
    // TODO: Integrate with your analytics service
    // analytics.track('message_opened', { messageId });
    console.log("Analytics: Message opened", { messageId });
  }, []);

  const trackError = useCallback(
    (error: Error, context: Record<string, any>) => {
      // TODO: Integrate with error tracking (Sentry, Rollbar, etc.)
      // Sentry.captureException(error, { extra: context });
      console.error("Analytics: Error tracked", error, context);
    },
    [],
  );

  return { trackMessageSent, trackMessageOpened, trackError };
}

/**
 * Custom Hook for Message Export
 * Supports CSV, JSON, Excel formats
 */
function useMessageExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportMessages = useCallback(
    async (
      messages: any[],
      format: "csv" | "json" | "excel" = "csv",
    ): Promise<void> => {
      setIsExporting(true);
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/messages/export', {
        //   method: 'POST',
        //   body: JSON.stringify({ messages, format })
        // });
        // const blob = await response.blob();

        // Simulate export
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const data =
          format === "json"
            ? JSON.stringify(messages, null, 2)
            : messages
                .map(
                  (m) =>
                    `${m.id},${m.recipient},${m.status},${m.sentAt},${m.content}`,
                )
                .join("\n");

        const blob = new Blob([data], {
          type: format === "json" ? "application/json" : "text/csv",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `messages-export-${Date.now()}.${format}`;
        a.click();
        URL.revokeObjectURL(url);

        toast.success("Export completed", {
          description: `Downloaded ${messages.length} messages as ${format.toUpperCase()}`,
        });
      } catch (error) {
        toast.error("Export failed", {
          description: "Please try again later.",
        });
      } finally {
        setIsExporting(false);
      }
    },
    [],
  );

  return { exportMessages, isExporting };
}

/**
 * Custom Hook for Bulk Operations
 * Handles batch processing with progress tracking
 */
function useBulkOperations() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const bulkDelete = useCallback(
    async (messageIds: string[]): Promise<BulkOperationResult> => {
      setIsProcessing(true);
      setProgress(0);

      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/messages/bulk-delete', {
        //   method: 'POST',
        //   body: JSON.stringify({ ids: messageIds })
        // });
        // return await response.json();

        // Simulate bulk operation with progress
        const result: BulkOperationResult = {
          success: 0,
          failed: 0,
          errors: [],
        };

        for (let i = 0; i < messageIds.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          result.success++;
          setProgress(((i + 1) / messageIds.length) * 100);
        }

        return result;
      } finally {
        setIsProcessing(false);
        setProgress(0);
      }
    },
    [],
  );

  return { bulkDelete, isProcessing, progress };
}

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface MessageFormData {
  clientId: string;
  recipient: string;
  content: string;
  scheduledAt?: Date; // For scheduled messages
  attachments?: File[]; // For future media support
}

interface MessageDetailsData {
  id: string;
  clientId: string;
  recipient: string;
  content: string;
  status: MessageStatus;
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  error?: string;
}

const STATUS_CONFIG: Record<
  MessageStatus,
  {
    label: string;
    icon: typeof CheckCircle2;
    color: string;
    bgColor: string;
  }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-600/10",
  },
  sent: {
    label: "Sent",
    icon: Send,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-600/10",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-600/10",
  },
  read: {
    label: "Read",
    icon: Eye,
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-600/10",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-600/10",
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (seconds < 10) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function MessagesPage() {
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MessageStatus | "all">(
    "all",
  );
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(
    new Set(),
  );
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [selectedMessageDetails, setSelectedMessageDetails] =
    useState<MessageDetailsData | null>(null);

  // Data fetching
  const {
    messages,
    isLoading,
    isError,
    refetch,
    sendMessage,
    isSending,
    deleteMessage,
    isDeleting,
  } = useMessageManagement();

  const { data: clients } = useClients();

  // Extensibility hooks - Ready for backend integration
  const realtimeEvents = useRealtimeMessages(true);
  const analytics = useMessageAnalytics();
  const { exportMessages, isExporting } = useMessageExport();
  const {
    bulkDelete,
    isProcessing: isBulkDeleting,
    progress,
  } = useBulkOperations();

  // Filtered and sorted messages
  const filteredMessages = useMemo(() => {
    let filtered = messages;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((m) => m.status === statusFilter);
    }

    // Apply client filter
    if (clientFilter !== "all") {
      filtered = filtered.filter((m) => m.clientId === clientFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.recipient.includes(query) ||
          m.content.toLowerCase().includes(query),
      );
    }

    // Sort by most recent first
    return filtered.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  }, [messages, statusFilter, clientFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = messages.length;
    const pending = messages.filter((m) => m.status === "pending").length;
    const sent = messages.filter((m) => m.status === "sent").length;
    const delivered = messages.filter((m) => m.status === "delivered").length;
    const read = messages.filter((m) => m.status === "read").length;
    const failed = messages.filter((m) => m.status === "failed").length;
    const deliveryRate =
      total > 0 ? Math.round(((delivered + read) / total) * 100) : 0;

    return {
      total,
      pending,
      sent,
      delivered,
      read,
      failed,
      deliveryRate,
    };
  }, [messages]);

  // Selection handlers
  const handleSelectAll = useCallback(() => {
    if (selectedMessages.size === filteredMessages.length) {
      setSelectedMessages(new Set());
    } else {
      setSelectedMessages(new Set(filteredMessages.map((m) => m.id)));
    }
  }, [filteredMessages, selectedMessages.size]);

  const handleSelectMessage = useCallback((messageId: string) => {
    setSelectedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  }, []);

  // CRUD handlers with analytics integration
  const handleSendMessage = useCallback(
    async (data: MessageFormData) => {
      try {
        const client = clients?.find((c) => c.id === data.clientId);

        // Send message
        await sendMessage({
          clientId: data.clientId,
          recipient: data.recipient,
          content: data.content,
        });

        // Track analytics
        analytics.trackMessageSent("temp-id", {
          clientId: data.clientId,
          clientName: client?.name,
          recipientCount: 1,
          contentLength: data.content.length,
          scheduled: !!data.scheduledAt,
        });

        toast.success("Message sent", {
          description: `Message sent via ${client?.name || "client"}`,
        });
        setIsSendDialogOpen(false);
      } catch (error) {
        // Track error
        analytics.trackError(error as Error, {
          action: "send_message",
          clientId: data.clientId,
        });

        toast.error("Failed to send message", {
          description: "Please try again later.",
        });
      }
    },
    [sendMessage, clients, analytics],
  );

  const handleViewDetails = useCallback(
    (messageId: string) => {
      const message = messages.find((m) => m.id === messageId);
      if (message) {
        // Track analytics
        analytics.trackMessageOpened(messageId);

        setSelectedMessageDetails(message);
        setIsDetailsDialogOpen(true);
      }
    },
    [messages, analytics],
  );

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      try {
        await deleteMessage(messageId);
        toast.success("Message deleted", {
          description: "Message has been removed.",
        });
        setIsDeleteDialogOpen(false);
        setMessageToDelete(null);
      } catch (error) {
        analytics.trackError(error as Error, {
          action: "delete_message",
          messageId,
        });

        toast.error("Failed to delete message", {
          description: "Please try again.",
        });
      }
    },
    [deleteMessage, analytics],
  );

  const handleBulkDelete = useCallback(async () => {
    const messageIds = Array.from(selectedMessages);

    try {
      const result = await bulkDelete(messageIds);

      if (result.success > 0) {
        toast.success("Bulk delete completed", {
          description: `Successfully deleted ${result.success} message(s)`,
        });
        setSelectedMessages(new Set());
        refetch();
      }

      if (result.failed > 0) {
        toast.warning("Some deletions failed", {
          description: `${result.failed} message(s) could not be deleted`,
        });
      }
    } catch (error) {
      analytics.trackError(error as Error, {
        action: "bulk_delete",
        count: messageIds.length,
      });

      toast.error("Bulk delete failed", {
        description: "Please try again.",
      });
    }
  }, [selectedMessages, bulkDelete, refetch, analytics]);

  const handleExport = useCallback(
    async (format: "csv" | "json" = "csv") => {
      await exportMessages(filteredMessages, format);
    },
    [filteredMessages, exportMessages],
  );

  const handleCopyContent = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  }, []);

  // Loading state
  if (isLoading) {
    return <MessagesPageSkeleton />;
  }

  // Error state
  if (isError) {
    return (
      <div className="p-4">
        <DataFetchError resource="messages" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-background to-muted/20">
        <div className="flex items-center justify-between p-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
            <p className="text-sm text-muted-foreground">
              View and manage all WhatsApp messages across clients
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <TooltipIconButton
                  tooltip="Export messages"
                  variant="outline"
                  size="sm"
                  disabled={isExporting || filteredMessages.length === 0}
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </TooltipIconButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("json")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <TooltipIconButton
              tooltip="Refresh messages"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn("h-4 w-4", isLoading && "animate-spin")}
              />
            </TooltipIconButton>

            <Button
              size="sm"
              onClick={() => setIsSendDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Send Message
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="border-b bg-muted/30 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          <StatCard
            label="Total"
            value={stats.total}
            icon={MessageSquare}
            color="text-blue-600"
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            icon={Clock}
            color="text-blue-600"
          />
          <StatCard
            label="Sent"
            value={stats.sent}
            icon={Send}
            color="text-purple-600"
          />
          <StatCard
            label="Delivered"
            value={stats.delivered}
            icon={CheckCircle2}
            color="text-green-600"
          />
          <StatCard
            label="Read"
            value={stats.read}
            icon={Eye}
            color="text-teal-600"
          />
          <StatCard
            label="Failed"
            value={stats.failed}
            icon={XCircle}
            color="text-red-600"
          />
          <StatCard
            label="Delivery Rate"
            value={`${stats.deliveryRate}%`}
            icon={CheckCircle2}
            color="text-green-600"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b bg-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by recipient or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Client Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <User className="h-4 w-4" />
                {clientFilter === "all"
                  ? "All Clients"
                  : clients?.find((c) => c.id === clientFilter)?.name ||
                    "Client"}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by Client</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setClientFilter("all")}>
                All Clients
              </DropdownMenuItem>
              {clients?.map((client) => (
                <DropdownMenuItem
                  key={client.id}
                  onClick={() => setClientFilter(client.id)}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  {client.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                {statusFilter === "all"
                  ? "All Status"
                  : STATUS_CONFIG[statusFilter].label}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                All Status
              </DropdownMenuItem>
              {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                const Icon = config.icon;
                return (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => setStatusFilter(status as MessageStatus)}
                  >
                    <Icon className={cn("h-4 w-4 mr-2", config.color)} />
                    {config.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages List */}
      <div className="p-4 relative">
        {filteredMessages.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No messages found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "all" || clientFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by sending your first message"}
              </p>
              {!searchQuery &&
                statusFilter === "all" &&
                clientFilter === "all" && (
                  <Button onClick={() => setIsSendDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Select All - Minimal version */}
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
              <Checkbox
                checked={selectedMessages.size === filteredMessages.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium">
                {selectedMessages.size === filteredMessages.length
                  ? "Deselect all"
                  : "Select all"}{" "}
                ({filteredMessages.length})
              </span>
            </div>

            {/* Messages Table */}
            <Card>
              <ScrollArea className="h-[calc(100vh-400px)]">
                <div className="divide-y">
                  {filteredMessages.map((message) => (
                    <MessageRow
                      key={message.id}
                      message={message}
                      clientName={
                        clients?.find((c) => c.id === message.clientId)?.name ||
                        "Unknown"
                      }
                      isSelected={selectedMessages.has(message.id)}
                      onSelect={() => handleSelectMessage(message.id)}
                      onView={() => handleViewDetails(message.id)}
                      onCopy={() => handleCopyContent(message.content)}
                      onDelete={() => {
                        setMessageToDelete(message.id);
                        setIsDeleteDialogOpen(true);
                      }}
                    />
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>
        )}

        {/* Floating Action Bar - Appears when messages are selected */}
        <FloatingActionBar
          selectedCount={selectedMessages.size}
          isProcessing={isBulkDeleting}
          progress={progress}
          onClearSelection={() => setSelectedMessages(new Set())}
          onExport={handleExport}
          onDelete={handleBulkDelete}
          isExporting={isExporting}
        />
      </div>

      {/* Dialogs */}
      <SendMessageDialog
        open={isSendDialogOpen}
        onOpenChange={setIsSendDialogOpen}
        onSubmit={handleSendMessage}
        isLoading={isSending}
        clients={clients || []}
      />

      <MessageDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        message={selectedMessageDetails}
        clientName={
          clients?.find((c) => c.id === selectedMessageDetails?.clientId)
            ?.name || "Unknown"
        }
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={() =>
          messageToDelete && handleDeleteMessage(messageToDelete)
        }
        isLoading={isDeleting}
      />
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Floating Action Bar Component
 *
 * UX/UI Best Practices Implemented:
 * - Slides up from bottom with smooth animation
 * - Fixed positioning for always-visible actions
 * - Backdrop blur for modern glass-morphism effect
 * - Clear visual hierarchy with primary/secondary actions
 * - Responsive design with mobile-optimized layout
 * - Progress indication for long-running operations
 * - Accessible keyboard navigation
 * - Clear escape hatch (close button)
 */
interface FloatingActionBarProps {
  selectedCount: number;
  isProcessing: boolean;
  progress: number;
  onClearSelection: () => void;
  onExport: (format: "csv" | "json") => void;
  onDelete: () => void;
  isExporting: boolean;
}

function FloatingActionBar({
  selectedCount,
  isProcessing,
  progress,
  onClearSelection,
  onExport,
  onDelete,
  isExporting,
}: FloatingActionBarProps) {
  // Only show when items are selected
  const isVisible = selectedCount > 0;

  return (
    <>
      {/* Backdrop - Subtle overlay when action bar is visible */}
      <div
        className={cn(
          "fixed inset-0 bg-background/20 backdrop-blur-[2px] transition-opacity duration-300 pointer-events-none z-40",
          isVisible ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Floating Action Bar */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-out",
          isVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0 pointer-events-none",
        )}
        style={{
          marginLeft: "var(--sidebar-width, 224px)",
        }}
      >
        <div className="mx-4 mb-4">
          <Card className="shadow-2xl border-2 border-primary/20 bg-card/95 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* Left Section - Selection Info */}
                <div className="flex items-center gap-4">
                  {/* Selection Count */}
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                      {selectedCount}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {selectedCount}{" "}
                        {selectedCount === 1 ? "message" : "messages"} selected
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Choose an action below
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar (shown during processing) */}
                  {isProcessing && progress > 0 && (
                    <div className="flex items-center gap-2 min-w-[200px]">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {Math.round(progress)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Section - Actions */}
                <div className="flex items-center gap-2 ml-auto">
                  {/* Export Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isExporting || isProcessing}
                        className="gap-2"
                      >
                        {isExporting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Exporting...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">Export</span>
                          </>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onExport("csv")}>
                        <FileText className="h-4 w-4 mr-2" />
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onExport("json")}>
                        <FileText className="h-4 w-4 mr-2" />
                        Export as JSON
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Delete Button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onDelete}
                    disabled={isProcessing || isExporting}
                    className="gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="hidden sm:inline">Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </>
                    )}
                  </Button>

                  {/* Divider */}
                  <div className="h-8 w-px bg-border" />

                  {/* Clear Selection Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearSelection}
                    disabled={isProcessing}
                    className="gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Clear</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: typeof MessageSquare;
  color: string;
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
      <div className={cn("p-2 rounded-md bg-muted")}>
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}

interface MessageRowProps {
  message: {
    id: string;
    recipient: string;
    content: string;
    status: MessageStatus;
    sentAt: Date;
    error?: string;
  };
  clientName: string;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

function MessageRow({
  message,
  clientName,
  isSelected,
  onSelect,
  onView,
  onCopy,
  onDelete,
}: MessageRowProps) {
  const statusConfig = STATUS_CONFIG[message.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors",
        isSelected && "bg-primary/5",
      )}
    >
      {/* Checkbox */}
      <Checkbox checked={isSelected} onCheckedChange={onSelect} />

      {/* Status Icon */}
      <div className={cn("p-2 rounded-lg shrink-0", statusConfig.bgColor)}>
        <StatusIcon className={cn("h-4 w-4", statusConfig.color)} />
      </div>

      {/* Message Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {formatPhoneNumber(message.recipient)}
            </span>
            <span className="text-xs text-muted-foreground">
              via {clientName}
            </span>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatTimestamp(message.sentAt)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          {truncateText(message.content, 100)}
        </p>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
              statusConfig.bgColor,
              statusConfig.color,
            )}
          >
            {statusConfig.label}
          </span>
          {message.error && (
            <span className="text-xs text-red-600 dark:text-red-400">
              {message.error}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onView}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onCopy}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Content
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ============================================================================
// DIALOG COMPONENTS
// ============================================================================

interface SendMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MessageFormData) => void;
  isLoading: boolean;
  clients: Array<{ id: string; name: string; status: string }>;
}

function SendMessageDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  clients,
}: SendMessageDialogProps) {
  const [formData, setFormData] = useState<MessageFormData>({
    clientId: "",
    recipient: "",
    content: "",
  });

  const connectedClients = clients.filter((c) => c.status === "connected");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ clientId: "", recipient: "", content: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Message</DialogTitle>
          <DialogDescription>
            Send a WhatsApp message through one of your connected clients.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="client">Select Client</Label>
              <select
                id="client"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={formData.clientId}
                onChange={(e) =>
                  setFormData({ ...formData, clientId: e.target.value })
                }
                required
              >
                <option value="">Choose a client...</option>
                {connectedClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              {connectedClients.length === 0 && (
                <p className="text-xs text-destructive">
                  No connected clients available
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Phone Number</Label>
              <Input
                id="recipient"
                type="tel"
                placeholder="+1234567890"
                value={formData.recipient}
                onChange={(e) =>
                  setFormData({ ...formData, recipient: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Include country code (e.g., +1 for US)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Message Content</Label>
              <textarea
                id="content"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter your message here..."
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.content.length} characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || connectedClients.length === 0}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface MessageDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: MessageDetailsData | null;
  clientName: string;
}

function MessageDetailsDialog({
  open,
  onOpenChange,
  message,
  clientName,
}: MessageDetailsDialogProps) {
  if (!message) return null;

  const statusConfig = STATUS_CONFIG[message.status];
  const StatusIcon = statusConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Message Details</DialogTitle>
          <DialogDescription>
            Complete information about this message
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Status */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className={cn("p-2 rounded-lg", statusConfig.bgColor)}>
              <StatusIcon className={cn("h-5 w-5", statusConfig.color)} />
            </div>
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className={cn("text-sm font-semibold", statusConfig.color)}>
                {statusConfig.label}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Client</p>
              <p className="text-sm font-medium">{clientName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Recipient</p>
              <p className="text-sm font-medium">
                {formatPhoneNumber(message.recipient)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Sent At</p>
              <p className="text-sm font-medium">
                {message.sentAt.toLocaleString()}
              </p>
            </div>
            {message.deliveredAt && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Delivered At
                </p>
                <p className="text-sm font-medium">
                  {message.deliveredAt.toLocaleString()}
                </p>
              </div>
            )}
            {message.readAt && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Read At</p>
                <p className="text-sm font-medium">
                  {message.readAt.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Content */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              Message Content
            </p>
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>

          {/* Error */}
          {message.error && (
            <div className="p-3 rounded-lg bg-red-600/10 border border-red-600/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-600">Error</p>
                  <p className="text-sm text-red-600/80">{message.error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Message</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this message? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function MessagesPageSkeleton() {
  return (
    <div className="flex flex-col gap-0">
      {/* Header Skeleton */}
      <div className="border-b p-4">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats Skeleton */}
      <div className="border-b p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>

      {/* Toolbar Skeleton */}
      <div className="border-b p-4">
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* List Skeleton */}
      <div className="p-4">
        <Skeleton className="h-10 w-48 mb-4" />
        <Card>
          <div className="divide-y">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
