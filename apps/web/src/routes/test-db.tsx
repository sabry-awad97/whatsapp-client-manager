/**
 * Test Route for TanStack DB Clients Collection
 *
 * Demonstrates the new TanStack DB implementation with live queries,
 * reactive updates, and optimistic mutations.
 */

import { ErrorBoundary } from "@/components/error-boundary";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  useUpdateClientStatus,
  useClientsCount,
  useConnectedClientsCount,
  type ClientStatus,
  type CreateClientInput,
} from "@/db/collections/clients.collection";
import { createFileRoute } from "@tanstack/react-router";
import {
  Database,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/test-db")({
  component: () => (
    <ErrorBoundary>
      <TestDBPage />
    </ErrorBoundary>
  ),
});

function TestDBPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | undefined>();
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  // TanStack DB Hooks
  const {
    data: clients,
    isLoading,
    isError,
    status,
  } = useClients({
    search: searchQuery,
    status: statusFilter,
  });
  const { data: totalCount } = useClientsCount();
  const { data: connectedCount } = useConnectedClientsCount();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const updateStatus = useUpdateClientStatus();

  // Handlers
  const handleCreateClient = () => {
    if (!newClientName || !newClientPhone) {
      toast.error("Please fill in all fields");
      return;
    }

    const input: CreateClientInput = {
      name: newClientName,
      phoneNumber: newClientPhone,
      status: "disconnected",
    };

    createClient.mutate(input);
    toast.success("Client created!", {
      description: "New client added with optimistic update",
    });

    setNewClientName("");
    setNewClientPhone("");
  };

  const handleToggleStatus = (id: string, currentStatus: ClientStatus) => {
    const newStatus: ClientStatus =
      currentStatus === "connected" ? "disconnected" : "connected";

    updateStatus.mutate(id, newStatus);
    toast.success(`Status changed to ${newStatus}`);
  };

  const handleDeleteClient = (id: string, name: string) => {
    if (window.confirm(`Delete ${name}?`)) {
      deleteClient.mutate(id);
      toast.success("Client deleted");
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4">
          <Database className="h-5 w-5" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold">TanStack DB Test</h1>
            <p className="text-xs text-muted-foreground">
              Live reactive client management
            </p>
          </div>
          <Badge variant="outline" className="gap-2">
            <Zap className="h-3 w-3" />
            Real-time
          </Badge>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="border-b bg-muted/30 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{totalCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Connected</p>
                  <p className="text-2xl font-bold">{connectedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Disconnected</p>
                  <p className="text-2xl font-bold">
                    {totalCount - connectedCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-medium">{status}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Create Client Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Client
            </CardTitle>
            <CardDescription>
              Test optimistic updates with TanStack DB
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Client name"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+1234567890"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleCreateClient} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Client
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="status">Status Filter</Label>
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === undefined ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(undefined)}
                  >
                    All
                  </Button>
                  <Button
                    variant={
                      statusFilter === "connected" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setStatusFilter("connected")}
                  >
                    Connected
                  </Button>
                  <Button
                    variant={
                      statusFilter === "disconnected" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setStatusFilter("disconnected")}
                  >
                    Disconnected
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clients List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Clients ({clients?.length || 0})</span>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
            <CardDescription>
              Live reactive list with optimistic updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="text-center py-8 text-destructive">
                <XCircle className="h-12 w-12 mx-auto mb-2" />
                <p>Error loading clients</p>
                <p className="text-sm text-muted-foreground">{status}</p>
              </div>
            ) : clients && clients.length > 0 ? (
              <div className="space-y-3">
                {clients.map((client) => (
                  <Card key={client.id} className="transition-all hover:shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{client.name}</h3>
                            <Badge
                              variant={
                                client.status === "connected"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {client.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {client.phoneNumber}
                          </p>
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Sent: {client.messagesSent}</span>
                            <span>Delivered: {client.messagesDelivered}</span>
                            <span>Failed: {client.messagesFailed}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleToggleStatus(client.id, client.status)
                            }
                          >
                            {client.status === "connected" ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleDeleteClient(client.id, client.name)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No clients found</p>
                <p className="text-sm">
                  {searchQuery || statusFilter
                    ? "Try adjusting your filters"
                    : "Create your first client above"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-600/5 border-blue-600/20">
          <CardHeader>
            <CardTitle className="text-blue-600 flex items-center gap-2">
              <Database className="h-5 w-5" />
              TanStack DB Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>
                  <strong>Reactive Updates:</strong> UI updates automatically
                  when data changes
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>
                  <strong>Optimistic UI:</strong> Instant feedback before server
                  response
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>
                  <strong>Live Queries:</strong> Real-time data synchronization
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>
                  <strong>No Manual Cache:</strong> Automatic cache management
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>
                  <strong>Type-Safe:</strong> Full TypeScript support
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
