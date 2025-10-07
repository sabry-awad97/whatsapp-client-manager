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
import { Skeleton } from "@/components/ui/skeleton";
import { useClientManagement, type ClientStatus } from "@/hooks/use-clients";
import { cn } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Filter,
  Loader2,
  MessageSquare,
  MoreVertical,
  Phone,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Send,
  Trash2,
  UserCircle,
  XCircle,
  Zap,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/clients")({
  component: () => (
    <ErrorBoundary>
      <ClientsPage />
    </ErrorBoundary>
  ),
});

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface ClientFormData {
  name: string;
  phoneNumber: string;
}

interface BulkMessageData {
  content: string;
  clientIds: string[];
}

const STATUS_CONFIG: Record<
  ClientStatus,
  {
    label: string;
    icon: typeof CheckCircle2;
    color: string;
    bgColor: string;
  }
> = {
  connected: {
    label: "Connected",
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-600/10",
  },
  disconnected: {
    label: "Disconnected",
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-600/10",
  },
  connecting: {
    label: "Connecting",
    icon: Loader2,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-600/10",
  },
  error: {
    label: "Error",
    icon: AlertCircle,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-600/10",
  },
  idle: {
    label: "Idle",
    icon: Clock,
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-600/10",
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatTimestamp(date: Date | null): string {
  if (!date) return "Never";
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function formatPhoneNumber(phone: string): string {
  // Format: +1 (234) 567-8900
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

function calculateDeliveryRate(sent: number, delivered: number): number {
  return sent > 0 ? Math.round((delivered / sent) * 100) : 0;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function ClientsPage() {
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "all">("all");
  const [selectedClients, setSelectedClients] = useState<Set<string>>(
    new Set(),
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkMessageDialogOpen, setIsBulkMessageDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  // Data fetching
  const {
    clients,
    isLoading,
    isError,
    refetch,
    createClient,
    isCreating,
    updateClientStatus,
    isUpdatingStatus,
    deleteClient,
    isDeleting,
  } = useClientManagement();

  // Filtered and sorted clients
  const filteredClients = useMemo(() => {
    let filtered = clients;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) || c.phoneNumber.includes(query),
      );
    }

    // Sort by status priority, then by name
    const statusPriority: Record<ClientStatus, number> = {
      connected: 1,
      connecting: 2,
      idle: 3,
      error: 4,
      disconnected: 5,
    };

    return filtered.sort((a, b) => {
      const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
      if (priorityDiff !== 0) return priorityDiff;
      return a.name.localeCompare(b.name);
    });
  }, [clients, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = clients.length;
    const connected = clients.filter((c) => c.status === "connected").length;
    const totalSent = clients.reduce((sum, c) => sum + c.messagesSent, 0);
    const totalDelivered = clients.reduce(
      (sum, c) => sum + c.messagesDelivered,
      0,
    );
    const totalFailed = clients.reduce((sum, c) => sum + c.messagesFailed, 0);
    const avgDeliveryRate = calculateDeliveryRate(totalSent, totalDelivered);

    return {
      total,
      connected,
      totalSent,
      totalDelivered,
      totalFailed,
      avgDeliveryRate,
    };
  }, [clients]);

  // Selection handlers
  const handleSelectAll = useCallback(() => {
    if (selectedClients.size === filteredClients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(filteredClients.map((c) => c.id)));
    }
  }, [filteredClients, selectedClients.size]);

  const handleSelectClient = useCallback((clientId: string) => {
    setSelectedClients((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  }, []);

  // CRUD handlers
  const handleAddClient = useCallback(
    async (data: ClientFormData) => {
      try {
        await createClient({
          name: data.name,
          phoneNumber: data.phoneNumber,
          status: "disconnected",
        });
        toast.success("Client added successfully", {
          description: `${data.name} has been added to your clients.`,
        });
        setIsAddDialogOpen(false);
      } catch (error) {
        toast.error("Failed to add client", {
          description: "Please try again later.",
        });
      }
    },
    [createClient],
  );

  const handleConnectClient = useCallback(
    async (clientId: string, clientName: string) => {
      try {
        await updateClientStatus(clientId, "connecting");
        toast.info("Connecting client", {
          description: `Establishing connection for ${clientName}...`,
        });

        // Simulate connection process
        setTimeout(() => {
          updateClientStatus(clientId, "connected");
          toast.success("Client connected", {
            description: `${clientName} is now online.`,
          });
        }, 2000);
      } catch (error) {
        toast.error("Connection failed", {
          description: "Please try again.",
        });
      }
    },
    [updateClientStatus],
  );

  const handleDisconnectClient = useCallback(
    async (clientId: string, clientName: string) => {
      try {
        await updateClientStatus(clientId, "disconnected");
        toast.success("Client disconnected", {
          description: `${clientName} has been disconnected.`,
        });
      } catch (error) {
        toast.error("Failed to disconnect", {
          description: "Please try again.",
        });
      }
    },
    [updateClientStatus],
  );

  const handleDeleteClient = useCallback(
    async (clientId: string) => {
      try {
        const client = clients.find((c) => c.id === clientId);
        await deleteClient(clientId);
        toast.success("Client deleted", {
          description: `${client?.name} has been removed.`,
        });
        setIsDeleteDialogOpen(false);
        setClientToDelete(null);
      } catch (error) {
        toast.error("Failed to delete client", {
          description: "Please try again.",
        });
      }
    },
    [deleteClient, clients],
  );

  const handleBulkMessage = useCallback(async (data: BulkMessageData) => {
    try {
      toast.info("Sending bulk messages", {
        description: `Sending to ${data.clientIds.length} clients...`,
      });

      // Simulate bulk send
      setTimeout(() => {
        toast.success("Messages sent", {
          description: `Successfully sent ${data.clientIds.length} messages.`,
        });
        setIsBulkMessageDialogOpen(false);
        setSelectedClients(new Set());
      }, 1500);
    } catch (error) {
      toast.error("Failed to send messages", {
        description: "Please try again.",
      });
    }
  }, []);

  // Loading state
  if (isLoading) {
    return <ClientsPageSkeleton />;
  }

  // Error state
  if (isError) {
    return (
      <div className="p-4">
        <DataFetchError resource="clients" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-background to-muted/20">
        <div className="flex items-center justify-between p-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              WhatsApp Clients
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage multiple WhatsApp accounts and send bulk messages
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TooltipIconButton
              tooltip="Refresh clients"
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
              onClick={() => setIsAddDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Client
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="border-b bg-muted/30 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Total Clients"
            value={stats.total}
            icon={UserCircle}
            color="text-blue-600"
          />
          <StatCard
            label="Connected"
            value={stats.connected}
            icon={CheckCircle2}
            color="text-green-600"
          />
          <StatCard
            label="Messages Sent"
            value={stats.totalSent.toLocaleString()}
            icon={Send}
            color="text-purple-600"
          />
          <StatCard
            label="Delivered"
            value={stats.totalDelivered.toLocaleString()}
            icon={CheckCircle2}
            color="text-green-600"
          />
          <StatCard
            label="Failed"
            value={stats.totalFailed}
            icon={XCircle}
            color="text-red-600"
          />
          <StatCard
            label="Delivery Rate"
            value={`${stats.avgDeliveryRate}%`}
            icon={Zap}
            color="text-orange-600"
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
              placeholder="Search by name or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

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
                    onClick={() => setStatusFilter(status as ClientStatus)}
                  >
                    <Icon className={cn("h-4 w-4 mr-2", config.color)} />
                    {config.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Bulk Actions */}
          {selectedClients.size > 0 && (
            <Button
              variant="default"
              className="gap-2"
              onClick={() => setIsBulkMessageDialogOpen(true)}
            >
              <MessageSquare className="h-4 w-4" />
              Send to {selectedClients.size}
            </Button>
          )}
        </div>
      </div>

      {/* Clients List */}
      <div className="p-4">
        {filteredClients.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserCircle className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No clients found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by adding your first client"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Select All */}
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
              <Checkbox
                checked={selectedClients.size === filteredClients.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium">
                {selectedClients.size === filteredClients.length
                  ? "Deselect all"
                  : "Select all"}{" "}
                ({filteredClients.length})
              </span>
            </div>

            {/* Client Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {filteredClients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  isSelected={selectedClients.has(client.id)}
                  onSelect={() => handleSelectClient(client.id)}
                  onConnect={() => handleConnectClient(client.id, client.name)}
                  onDisconnect={() =>
                    handleDisconnectClient(client.id, client.name)
                  }
                  onDelete={() => {
                    setClientToDelete(client.id);
                    setIsDeleteDialogOpen(true);
                  }}
                  isUpdating={isUpdatingStatus}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AddClientDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddClient}
        isLoading={isCreating}
      />

      <BulkMessageDialog
        open={isBulkMessageDialogOpen}
        onOpenChange={setIsBulkMessageDialogOpen}
        selectedCount={selectedClients.size}
        onSubmit={(content) =>
          handleBulkMessage({
            content,
            clientIds: Array.from(selectedClients),
          })
        }
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={() => clientToDelete && handleDeleteClient(clientToDelete)}
        isLoading={isDeleting}
        clientName={
          clients.find((c) => c.id === clientToDelete)?.name || "this client"
        }
      />
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon: typeof UserCircle;
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

interface ClientCardProps {
  client: {
    id: string;
    name: string;
    phoneNumber: string;
    status: ClientStatus;
    lastConnected: Date | null;
    messagesSent: number;
    messagesDelivered: number;
    messagesFailed: number;
  };
  isSelected: boolean;
  onSelect: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onDelete: () => void;
  isUpdating: boolean;
}

function ClientCard({
  client,
  isSelected,
  onSelect,
  onConnect,
  onDisconnect,
  onDelete,
  isUpdating,
}: ClientCardProps) {
  const statusConfig = STATUS_CONFIG[client.status];
  const StatusIcon = statusConfig.icon;
  const deliveryRate = calculateDeliveryRate(
    client.messagesSent,
    client.messagesDelivered,
  );

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-lg hover:-translate-y-1 group",
        isSelected && "ring-2 ring-primary shadow-md",
      )}
    >
      <CardContent className="p-5">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-4">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            className="mt-1"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {client.status === "connected" ? (
                <DropdownMenuItem onClick={onDisconnect} disabled={isUpdating}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Disconnect
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={onConnect} disabled={isUpdating}>
                  <Zap className="h-4 w-4 mr-2" />
                  Connect
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <QrCode className="h-4 w-4 mr-2" />
                Show QR Code
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status Icon - Centered */}
        <div className="flex justify-center mb-4">
          <div className={cn("p-4 rounded-xl", statusConfig.bgColor)}>
            <StatusIcon
              className={cn(
                "h-8 w-8",
                statusConfig.color,
                client.status === "connecting" && "animate-spin",
              )}
            />
          </div>
        </div>

        {/* Client Info - Centered */}
        <div className="text-center mb-4">
          <h3
            className="text-base font-semibold mb-2 truncate"
            title={client.name}
          >
            {client.name}
          </h3>
          <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground mb-3">
            <Phone className="h-3.5 w-3.5" />
            <span className="text-xs">
              {formatPhoneNumber(client.phoneNumber)}
            </span>
          </div>

          {/* Status Badge */}
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
              statusConfig.bgColor,
              statusConfig.color,
            )}
          >
            {statusConfig.label}
          </span>
        </div>

        {/* Last Seen */}
        <div className="text-center mb-4 pb-4 border-b">
          <p className="text-xs text-muted-foreground">
            Last seen {formatTimestamp(client.lastConnected)}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Sent</p>
            <p className="text-sm font-bold">
              {client.messagesSent.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-green-600/10">
            <p className="text-xs text-muted-foreground mb-1">Delivered</p>
            <p className="text-sm font-bold text-green-600">
              {client.messagesDelivered.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-red-600/10">
            <p className="text-xs text-muted-foreground mb-1">Failed</p>
            <p className="text-sm font-bold text-red-600">
              {client.messagesFailed}
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-orange-600/10">
            <p className="text-xs text-muted-foreground mb-1">Rate</p>
            <p className="text-sm font-bold text-orange-600">{deliveryRate}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// DIALOG COMPONENTS
// ============================================================================

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ClientFormData) => void;
  isLoading: boolean;
}

function AddClientDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: AddClientDialogProps) {
  const [formData, setFormData] = useState<ClientFormData>({
    name: "",
    phoneNumber: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: "", phoneNumber: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>
            Add a new WhatsApp client to manage messages and campaigns.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Client Name</Label>
              <Input
                id="name"
                placeholder="e.g., Primary Business"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Include country code (e.g., +1 for US)
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
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Client
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface BulkMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onSubmit: (content: string) => void;
}

function BulkMessageDialog({
  open,
  onOpenChange,
  selectedCount,
  onSubmit,
}: BulkMessageDialogProps) {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(content);
    setContent("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Bulk Message</DialogTitle>
          <DialogDescription>
            Send a message to {selectedCount} selected client
            {selectedCount !== 1 ? "s" : ""}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="message">Message Content</Label>
              <textarea
                id="message"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter your message here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                {content.length} characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!content.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Send to {selectedCount}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
  clientName: string;
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  clientName,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Client</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{clientName}</strong>? This
            action cannot be undone.
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

function ClientsPageSkeleton() {
  return (
    <div className="flex flex-col gap-0">
      {/* Header Skeleton */}
      <div className="border-b p-4">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats Skeleton */}
      <div className="border-b p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>

      {/* Toolbar Skeleton */}
      <div className="border-b p-4">
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="p-4">
        <Skeleton className="h-10 w-48 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[380px]" />
          ))}
        </div>
      </div>
    </div>
  );
}
