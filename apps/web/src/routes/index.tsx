import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Send,
  TrendingUp,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
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

  return (
    <div className="h-full flex flex-col gap-0">
      {/* Compact Toolbar */}
      <div className="flex items-center justify-between h-9 px-3 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold">Dashboard</h1>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-xs text-muted-foreground">
            WhatsApp Client Manager
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
        {/* Compact Stats Grid */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <Card className="shadow-none border-muted">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Active Clients
                </span>
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="text-xl font-bold">12</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-2.5 w-2.5 text-green-600" />
                <span className="text-[10px] text-green-600 font-medium">
                  +3
                </span>
                <span className="text-[10px] text-muted-foreground">
                  this week
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none border-muted">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Messages Sent
                </span>
                <Send className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="text-xl font-bold">1,847</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-2.5 w-2.5 text-green-600" />
                <span className="text-[10px] text-green-600 font-medium">
                  +24%
                </span>
                <span className="text-[10px] text-muted-foreground">
                  from yesterday
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none border-muted">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Active Campaigns
                </span>
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="text-xl font-bold">5</div>
              <span className="text-[10px] text-muted-foreground mt-1 block">
                2 scheduled, 3 running
              </span>
            </CardContent>
          </Card>

          <Card className="shadow-none border-muted">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Success Rate
                </span>
                <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="text-xl font-bold">98.5%</div>
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Last 7 days
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Compact WhatsApp Clients */}
        <Card className="shadow-none border-muted mb-3">
          <CardHeader className="px-3 py-2 border-b">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide">
              WhatsApp Clients
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              <div className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium">+1 (555) 123-4567</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      Connected • Last active 2 min ago
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-green-600 flex-shrink-0">
                  Online
                </span>
              </div>

              <div className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium">+1 (555) 987-6543</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      Connected • Sending messages
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-green-600 flex-shrink-0">
                  Online
                </span>
              </div>

              <div className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle className="h-3.5 w-3.5 text-yellow-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium">+1 (555) 456-7890</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      Reconnecting...
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-yellow-600 flex-shrink-0">
                  Pending
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compact Recent Activity */}
        <Card className="shadow-none border-muted">
          <CardHeader className="px-3 py-2 border-b">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              <div className="flex items-start gap-2 px-3 py-2 hover:bg-muted/50 transition-colors">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">
                    Campaign "Summer Sale" completed
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    247 messages sent • 2 minutes ago
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 px-3 py-2 hover:bg-muted/50 transition-colors">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">
                    New client +1 (555) 123-4567 connected
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    15 minutes ago
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 px-3 py-2 hover:bg-muted/50 transition-colors">
                <div className="h-1.5 w-1.5 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">
                    Campaign "Product Launch" scheduled
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Starts in 2 hours • 1 hour ago
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
