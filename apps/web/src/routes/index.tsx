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
  Database,
  HardDrive,
  Plus,
  RefreshCw,
  Server,
  TrendingUp,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const { data, isLoading, isError, refetch } = useQuery(
    trpc.healthCheck.queryOptions(),
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
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between pb-3 border-b">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-semibold leading-none">Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-1">
              System overview and statistics
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Item
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center gap-4 py-2 px-3 bg-muted/30 border-b text-xs">
        <div className="flex items-center gap-1.5">
          <div
            className={`h-1.5 w-1.5 rounded-full ${isError ? "bg-red-500" : "bg-green-500"}`}
          />
          <span className="font-medium">Server:</span>
          <span className="text-muted-foreground">{data}</span>
        </div>
        <Separator orientation="vertical" className="h-3" />
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto py-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+12%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Active Sessions
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+5%</span> from last hour
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Database Size
                </CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-2xl font-bold">2.4 GB</div>
              <p className="text-xs text-muted-foreground mt-1">
                45% of 5 GB limit
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Server Uptime
                </CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-2xl font-bold">99.9%</div>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card className="shadow-none mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/30">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">API Server</p>
                    <p className="text-xs text-muted-foreground">
                      All systems operational
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-green-600">
                  Healthy
                </span>
              </div>

              <div className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/30">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Database</p>
                    <p className="text-xs text-muted-foreground">
                      Connected and responsive
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-green-600">
                  Healthy
                </span>
              </div>

              <div className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/30">
                <div className="flex items-center gap-3">
                  <HardDrive className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Storage</p>
                    <p className="text-xs text-muted-foreground">
                      2.4 GB / 5 GB used
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-blue-600">
                  Normal
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-3 py-2 px-3 rounded-md hover:bg-muted/30 transition-colors">
                <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">System backup completed</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 py-2 px-3 rounded-md hover:bg-muted/30 transition-colors">
                <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">New user registered</p>
                  <p className="text-xs text-muted-foreground">
                    15 minutes ago
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 py-2 px-3 rounded-md hover:bg-muted/30 transition-colors">
                <div className="h-2 w-2 rounded-full bg-yellow-500 mt-1.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">Database optimization started</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
