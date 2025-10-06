import Loader from "@/components/loader";
import { StatsOverview, type Stat } from "@/components/stats-overview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Phone,
  Plus,
  RefreshCw,
  Send,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const mockClients = [
  {
    id: "1",
    name: "Primary Business",
    phoneNumber: "+1234567890",
    status: "connected",
    lastConnected: new Date(Date.now() - 1000 * 60 * 5),
    messagesSent: 1247,
    messagesDelivered: 1198,
    messagesFailed: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
  },
  {
    id: "2",
    name: "Support Line",
    phoneNumber: "+1234567891",
    status: "connected",
    lastConnected: new Date(Date.now() - 1000 * 60 * 2),
    messagesSent: 3421,
    messagesDelivered: 3389,
    messagesFailed: 8,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
  },
  {
    id: "3",
    name: "Marketing Account",
    phoneNumber: "+1234567892",
    status: "disconnected",
    lastConnected: new Date(Date.now() - 1000 * 60 * 60 * 2),
    messagesSent: 892,
    messagesDelivered: 856,
    messagesFailed: 24,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
  },
  {
    id: "4",
    name: "Sales Team",
    phoneNumber: "+1234567893",
    status: "connecting",
    lastConnected: null,
    messagesSent: 0,
    messagesDelivered: 0,
    messagesFailed: 0,
    createdAt: new Date(Date.now() - 1000 * 60 * 10),
  },
];

function HomeComponent() {
  const connectedClients = mockClients.filter(
    (c) => c.status === "connected"
  ).length;
  const totalSent = mockClients.reduce((sum, c) => sum + c.messagesSent, 0);
  const totalDelivered = mockClients.reduce(
    (sum, c) => sum + c.messagesDelivered,
    0
  );
  const totalFailed = mockClients.reduce((sum, c) => sum + c.messagesFailed, 0);

  const deliveryRate =
    totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;

  const stats: Stat[] = [
    {
      label: "Active Clients",
      value: connectedClients,
      total: mockClients.length,
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
  ];

  const { data, isLoading, isError, refetch } = useQuery(
    trpc.healthCheck.queryOptions(undefined, {
      refetchInterval: 30000,
    })
  );

  if (isLoading) {
    return <Loader />;
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
    <div className="h-full flex flex-col gap-0">
      {/* Compact Toolbar */}
      <div className="flex items-center justify-between h-9 px-3 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold">Real-Time Dashboard</h1>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-xs text-muted-foreground">
            Monitor client status and message activity in real-time
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            <span className="text-xs">Refresh</span>
          </Button>
          <Button size="sm" className="h-7 px-2">
            <Plus className="h-3 w-3 mr-1" />
            <span className="text-xs">New Client</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-3">
        {/* Stats Overview */}
        <StatsOverview stats={stats} columns={4} />
      </div>
    </div>
  );
}
