import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Monitor,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ClientStatus =
  | "connected"
  | "disconnected"
  | "connecting"
  | "error"
  | "idle";

export interface ClientStatusItem {
  id: string;
  name: string;
  phoneNumber?: string;
  status: ClientStatus;
  lastConnected?: Date | null;
  metadata?: Record<string, string | number>;
}

interface StatusMonitorProps {
  clients: ClientStatusItem[];
  title?: string;
  className?: string;
  onClientClick?: (client: ClientStatusItem) => void;
}

const statusConfig: Record<
  ClientStatus,
  {
    icon: LucideIcon;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  connected: {
    icon: CheckCircle2,
    label: "Connected",
    color: "text-green-600",
    bgColor: "bg-green-600/10",
  },
  disconnected: {
    icon: XCircle,
    label: "Disconnected",
    color: "text-red-600",
    bgColor: "bg-red-600/10",
  },
  connecting: {
    icon: Loader2,
    label: "Connecting",
    color: "text-blue-600",
    bgColor: "bg-blue-600/10",
  },
  error: {
    icon: AlertCircle,
    label: "Error",
    color: "text-orange-600",
    bgColor: "bg-orange-600/10",
  },
  idle: {
    icon: Clock,
    label: "Idle",
    color: "text-gray-600",
    bgColor: "bg-gray-600/10",
  },
};

function formatLastConnected(date: Date | null | undefined): string {
  if (!date) return "Never";

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function StatusMonitor({
  clients,
  title = "Client Status Monitor",
  className,
  onClientClick,
}: StatusMonitorProps) {
  const statusCounts = clients.reduce(
    (acc, client) => {
      acc[client.status] = (acc[client.status] || 0) + 1;
      return acc;
    },
    {} as Record<ClientStatus, number>,
  );

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Monitor className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {Object.entries(statusCounts).map(([status, count]) => {
              const config = statusConfig[status as ClientStatus];
              return (
                <div
                  key={status}
                  className="flex items-center gap-1 text-xs"
                  title={`${count} ${config.label}`}
                >
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      config.bgColor.replace("/10", ""),
                    )}
                  />
                  <span className="text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Monitor className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No clients to monitor
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[450px] pr-4">
            <div className="space-y-2 pb-2">
              {clients.map((client) => {
                const config = statusConfig[client.status];
                const Icon = config.icon;
                const isAnimating = client.status === "connecting";

                return (
                  <div
                    key={client.id}
                    onClick={() => onClientClick?.(client)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border bg-card transition-colors",
                      onClientClick && "cursor-pointer hover:bg-muted/50",
                    )}
                  >
                    <div
                      className={cn("p-2 rounded-md shrink-0", config.bgColor)}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          config.color,
                          isAnimating && "animate-spin",
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate">
                          {client.name}
                        </p>
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                            config.bgColor,
                            config.color,
                          )}
                        >
                          {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {client.phoneNumber && (
                          <span className="truncate">{client.phoneNumber}</span>
                        )}
                        {client.lastConnected && (
                          <>
                            <span>•</span>
                            <span className="shrink-0">
                              {formatLastConnected(client.lastConnected)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
