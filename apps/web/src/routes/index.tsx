import { ActivityFeed, type ActivityItem } from "@/components/activity-feed";
import { LiveMetrics, type Metric } from "@/components/live-metrics";
import Loader from "@/components/loader";
import { MessageActivityChart } from "@/components/message-activity-chart";
import { StatsOverview, type Stat } from "@/components/stats-overview";
import {
  StatusMonitor,
  type ClientStatusItem,
} from "@/components/status-monitor";
import { TooltipIconButton } from "@/components/tooltip-icon-button";
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
  RefreshCw,
  Send,
  TrendingUp,
  Users,
  XCircle,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const mockClients = [
  {
    id: "1",
    name: "Primary Business",
    phoneNumber: "+1234567890",
    status: "connected" as const,
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
    status: "connected" as const,
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
    status: "disconnected" as const,
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
    status: "connecting" as const,
    lastConnected: null,
    messagesSent: 0,
    messagesDelivered: 0,
    messagesFailed: 0,
    createdAt: new Date(Date.now() - 1000 * 60 * 10),
  },
  {
    id: "5",
    name: "Customer Service",
    phoneNumber: "+1234567894",
    status: "connected" as const,
    lastConnected: new Date(Date.now() - 1000 * 60 * 8),
    messagesSent: 2156,
    messagesDelivered: 2089,
    messagesFailed: 15,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
  },
  {
    id: "6",
    name: "E-commerce Bot",
    phoneNumber: "+1234567895",
    status: "connected" as const,
    lastConnected: new Date(Date.now() - 1000 * 60 * 1),
    messagesSent: 5432,
    messagesDelivered: 5398,
    messagesFailed: 34,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
  },
  {
    id: "7",
    name: "Notifications Service",
    phoneNumber: "+1234567896",
    status: "idle" as const,
    lastConnected: new Date(Date.now() - 1000 * 60 * 60 * 4),
    messagesSent: 678,
    messagesDelivered: 665,
    messagesFailed: 13,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
  },
  {
    id: "8",
    name: "Beta Testing Account",
    phoneNumber: "+1234567897",
    status: "error" as const,
    lastConnected: new Date(Date.now() - 1000 * 60 * 60 * 1),
    messagesSent: 45,
    messagesDelivered: 38,
    messagesFailed: 7,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
  },
  {
    id: "9",
    name: "VIP Customer Line",
    phoneNumber: "+1234567898",
    status: "connected" as const,
    lastConnected: new Date(Date.now() - 1000 * 60 * 12),
    messagesSent: 987,
    messagesDelivered: 978,
    messagesFailed: 9,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40),
  },
  {
    id: "10",
    name: "Backup Instance",
    phoneNumber: "+1234567899",
    status: "disconnected" as const,
    lastConnected: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    messagesSent: 234,
    messagesDelivered: 228,
    messagesFailed: 6,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100),
  },
];

const mockActivities: ActivityItem[] = [
  {
    id: "1",
    type: "message_delivered",
    title: "Message delivered successfully",
    description: "Welcome message sent to new customer",
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
    metadata: {
      clientName: "Primary Business",
      phoneNumber: "+1234567890",
    },
  },
  {
    id: "2",
    type: "message_sent",
    title: "Order confirmation sent",
    description: "Automated order #12345 confirmation message",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    metadata: {
      clientName: "E-commerce Bot",
      phoneNumber: "+1555123456",
    },
  },
  {
    id: "3",
    type: "client_connected",
    title: "Client connected",
    description: "E-commerce Bot is now online",
    timestamp: new Date(Date.now() - 1000 * 60 * 8),
    metadata: {
      clientName: "E-commerce Bot",
    },
  },
  {
    id: "4",
    type: "message_delivered",
    title: "Support ticket response delivered",
    description: "Response to ticket #789 sent successfully",
    timestamp: new Date(Date.now() - 1000 * 60 * 12),
    metadata: {
      clientName: "Customer Service",
      phoneNumber: "+1555987654",
    },
  },
  {
    id: "5",
    type: "client_connected",
    title: "Client reconnected",
    description: "Support Line is back online",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    metadata: {
      clientName: "Support Line",
    },
  },
  {
    id: "6",
    type: "message_sent",
    title: "Bulk message campaign started",
    description: "Sending promotional messages to 150 contacts",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    metadata: {
      clientName: "Marketing Account",
    },
  },
  {
    id: "7",
    type: "message_delivered",
    title: "VIP customer inquiry response",
    description: "Priority message delivered to premium customer",
    timestamp: new Date(Date.now() - 1000 * 60 * 35),
    metadata: {
      clientName: "VIP Customer Line",
      phoneNumber: "+1555111222",
    },
  },
  {
    id: "8",
    type: "message_failed",
    title: "Message delivery failed",
    description: "Unable to deliver message - recipient unavailable",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    metadata: {
      clientName: "Primary Business",
      phoneNumber: "+1987654321",
    },
  },
  {
    id: "9",
    type: "error",
    title: "Connection error detected",
    description: "Beta Testing Account experiencing connectivity issues",
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    metadata: {
      clientName: "Beta Testing Account",
    },
  },
  {
    id: "10",
    type: "message_delivered",
    title: "Payment reminder sent",
    description: "Automated payment reminder for invoice #4567",
    timestamp: new Date(Date.now() - 1000 * 60 * 75),
    metadata: {
      clientName: "E-commerce Bot",
      phoneNumber: "+1555333444",
    },
  },
  {
    id: "11",
    type: "info",
    title: "System health check completed",
    description: "All active clients passed health verification",
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    metadata: {},
  },
  {
    id: "12",
    type: "client_disconnected",
    title: "Client disconnected",
    description: "Marketing Account went offline",
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    metadata: {
      clientName: "Marketing Account",
    },
  },
  {
    id: "13",
    type: "message_sent",
    title: "Notification batch dispatched",
    description: "45 notification messages queued for delivery",
    timestamp: new Date(Date.now() - 1000 * 60 * 135),
    metadata: {
      clientName: "Notifications Service",
    },
  },
  {
    id: "14",
    type: "message_delivered",
    title: "Customer feedback request delivered",
    description: "Post-purchase survey sent to 20 customers",
    timestamp: new Date(Date.now() - 1000 * 60 * 150),
    metadata: {
      clientName: "Customer Service",
    },
  },
  {
    id: "15",
    type: "client_connected",
    title: "New client initialized",
    description: "Sales Team client successfully configured",
    timestamp: new Date(Date.now() - 1000 * 60 * 180),
    metadata: {
      clientName: "Sales Team",
    },
  },
  {
    id: "16",
    type: "message_failed",
    title: "Bulk send partially failed",
    description: "3 out of 50 messages failed to deliver",
    timestamp: new Date(Date.now() - 1000 * 60 * 200),
    metadata: {
      clientName: "Marketing Account",
    },
  },
  {
    id: "17",
    type: "message_delivered",
    title: "Appointment reminder sent",
    description: "Reminder for tomorrow's appointment delivered",
    timestamp: new Date(Date.now() - 1000 * 60 * 240),
    metadata: {
      clientName: "Primary Business",
      phoneNumber: "+1555777888",
    },
  },
  {
    id: "18",
    type: "info",
    title: "Database backup completed",
    description: "Message history successfully backed up",
    timestamp: new Date(Date.now() - 1000 * 60 * 300),
    metadata: {},
  },
];

function HomeComponent() {
  const connectedClients = mockClients.filter(
    (c) => c.status === "connected",
  ).length;
  const totalSent = mockClients.reduce((sum, c) => sum + c.messagesSent, 0);
  const totalDelivered = mockClients.reduce(
    (sum, c) => sum + c.messagesDelivered,
    0,
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
    }),
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

  // Generate mock chart data for sparklines
  const generateChartData = (
    points: number,
    trend: "up" | "down" | "stable",
  ) => {
    const data = [];
    let baseValue = 50;
    for (let i = 0; i < points; i++) {
      const variance = Math.random() * 10 - 5;
      if (trend === "up") {
        baseValue += Math.random() * 3;
      } else if (trend === "down") {
        baseValue -= Math.random() * 2;
      }
      data.push({ value: Math.max(0, baseValue + variance) });
    }
    return data;
  };

  // Prepare data for LiveMetrics
  const liveMetrics: Metric[] = [
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
  ];

  // Prepare data for StatusMonitor
  const clientStatusItems: ClientStatusItem[] = mockClients.map((client) => ({
    id: client.id,
    name: client.name,
    phoneNumber: client.phoneNumber,
    status: client.status,
    lastConnected: client.lastConnected,
  }));

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
          <LiveMetrics metrics={liveMetrics} columns={4} />
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
              <MessageActivityChart
                totalSent={totalSent}
                totalDelivered={totalDelivered}
              />
              <StatusMonitor
                clients={clientStatusItems}
                onClientClick={(client) => {
                  console.log("Client clicked:", client);
                }}
              />
            </div>
            {/* Right Column: Activity Feed */}
            <ActivityFeed activities={mockActivities} />
          </div>
        </section>
      </div>
    </div>
  );
}
