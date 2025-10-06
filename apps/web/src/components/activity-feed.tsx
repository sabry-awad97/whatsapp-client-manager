import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Send,
  User,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ActivityType =
  | "message_sent"
  | "message_delivered"
  | "message_failed"
  | "client_connected"
  | "client_disconnected"
  | "error"
  | "info";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: Date;
  metadata?: {
    clientName?: string;
    phoneNumber?: string;
    [key: string]: string | number | undefined;
  };
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  title?: string;
  className?: string;
  maxItems?: number;
  showTimestamp?: boolean;
}

const activityConfig: Record<
  ActivityType,
  {
    icon: LucideIcon;
    color: string;
    bgColor: string;
  }
> = {
  message_sent: {
    icon: Send,
    color: "text-blue-600",
    bgColor: "bg-blue-600/10",
  },
  message_delivered: {
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-600/10",
  },
  message_failed: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-600/10",
  },
  client_connected: {
    icon: User,
    color: "text-green-600",
    bgColor: "bg-green-600/10",
  },
  client_disconnected: {
    icon: User,
    color: "text-gray-600",
    bgColor: "bg-gray-600/10",
  },
  error: {
    icon: AlertCircle,
    color: "text-orange-600",
    bgColor: "bg-orange-600/10",
  },
  info: {
    icon: MessageSquare,
    color: "text-blue-600",
    bgColor: "bg-blue-600/10",
  },
};

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

export function ActivityFeed({
  activities,
  title = "Activity Feed",
  className,
  maxItems,
  showTimestamp = true,
}: ActivityFeedProps) {
  const displayedActivities = maxItems
    ? activities.slice(0, maxItems)
    : activities;

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
          {activities.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {activities.length} {activities.length === 1 ? "item" : "items"}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {displayedActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <ScrollArea className="h-[450px] pr-4">
            <div className="space-y-3 pb-2">
              {displayedActivities.map((activity, index) => {
                const config = activityConfig[activity.type];
                const Icon = config.icon;
                const isLast = index === displayedActivities.length - 1;

                return (
                  <div key={activity.id} className="relative">
                    <div className="flex gap-3">
                      {/* Timeline indicator */}
                      <div className="relative flex flex-col items-center shrink-0">
                        <div
                          className={cn(
                            "p-1.5 rounded-full z-10",
                            config.bgColor,
                          )}
                        >
                          <Icon className={cn("h-3 w-3", config.color)} />
                        </div>
                        {!isLast && (
                          <div className="absolute top-7 bottom-0 w-px bg-border" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pb-4">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-medium leading-tight">
                            {activity.title}
                          </p>
                          {showTimestamp && (
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatTimestamp(activity.timestamp)}
                            </span>
                          )}
                        </div>

                        {activity.description && (
                          <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
                            {activity.description}
                          </p>
                        )}

                        {activity.metadata && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {activity.metadata.clientName && (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-muted">
                                <User className="h-3 w-3" />
                                {activity.metadata.clientName}
                              </span>
                            )}
                            {activity.metadata.phoneNumber && (
                              <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-md bg-muted">
                                {activity.metadata.phoneNumber}
                              </span>
                            )}
                          </div>
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
