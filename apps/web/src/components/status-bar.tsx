import { Separator } from "@/components/ui/separator";
import { useCurrentTime } from "@/hooks/use-current-time";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useServerStatus } from "@/hooks/use-server-status";
import { cn } from "@/lib/utils";
import { useStatusBar } from "@/stores/status-bar-store";
import { Slot } from "@radix-ui/react-slot";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bell,
  Clock,
  Wifi,
  WifiOff,
} from "lucide-react";
import * as React from "react";

/* -------------------------------- Root -------------------------------- */

interface StatusBarProps extends React.HTMLAttributes<HTMLElement> {
  serverStatus?: "online" | "offline" | "checking";
}

const StatusBar = React.forwardRef<HTMLElement, StatusBarProps>(
  ({ serverStatus = "online", className, ...props }, ref) => {
    const currentTime = useCurrentTime();
    const isOnline = useNetworkStatus();
    const status = useServerStatus(serverStatus);
    const {
      notifications,
      errors,
      warnings,
      tasksRunning,
      customStatus,
      clearNotifications,
    } = useStatusBar();

    return (
      <footer
        ref={ref}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 flex h-6 items-center justify-between border-t bg-card px-2 text-[11px] font-medium",
          className,
        )}
        style={{ marginLeft: "var(--sidebar-width, 208px)" }}
        {...props}
      >
        <StatusBarSection>
          <StatusBarItem
            icon={status.icon}
            variant={status.variant}
            title={`Server Status: ${status.text}`}
          >
            {status.text}
          </StatusBarItem>

          <StatusBarSeparator />

          <StatusBarItem
            icon="dot"
            variant="info"
            title="Environment: Development"
          >
            Development
          </StatusBarItem>

          <StatusBarSeparator />

          <StatusBarItem
            icon={Activity}
            variant={tasksRunning > 0 ? "info" : "default"}
            animate={tasksRunning > 0}
          >
            {tasksRunning} tasks running
          </StatusBarItem>

          {customStatus && (
            <>
              <StatusBarSeparator />
              <StatusBarItem variant="default">{customStatus}</StatusBarItem>
            </>
          )}
        </StatusBarSection>

        <StatusBarSection>
          {notifications > 0 && (
            <>
              <StatusBarItem
                icon={Bell}
                variant="info"
                title={`${notifications} notifications`}
                onClick={clearNotifications}
                interactive
              >
                {notifications}
              </StatusBarItem>
              <StatusBarSeparator />
            </>
          )}

          {errors > 0 && (
            <>
              <StatusBarItem
                icon={AlertCircle}
                variant="destructive"
                title={`${errors} errors`}
                interactive
              >
                {errors}
              </StatusBarItem>
              <StatusBarSeparator />
            </>
          )}

          {warnings > 0 && (
            <>
              <StatusBarItem
                icon={AlertTriangle}
                variant="warning"
                title={`${warnings} warnings`}
                interactive
              >
                {warnings}
              </StatusBarItem>
              <StatusBarSeparator />
            </>
          )}

          <StatusBarItem
            icon={isOnline ? Wifi : WifiOff}
            variant={isOnline ? "success" : "destructive"}
            title={isOnline ? "Network: Online" : "Network: Offline"}
          />

          <StatusBarSeparator />

          <StatusBarItem icon={Clock} variant="default" title="Current Time">
            {currentTime.toLocaleTimeString()}
          </StatusBarItem>
        </StatusBarSection>
      </footer>
    );
  },
);
StatusBar.displayName = "StatusBar";

/* -------------------------------- Section -------------------------------- */

interface StatusBarSectionProps extends React.HTMLAttributes<HTMLDivElement> {}

const StatusBarSection = React.forwardRef<
  HTMLDivElement,
  StatusBarSectionProps
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  );
});
StatusBarSection.displayName = "StatusBarSection";

/* -------------------------------- Item -------------------------------- */

const statusBarItemVariants = {
  default: "text-muted-foreground",
  success: "text-green-500",
  destructive: "text-red-500",
  warning: "text-yellow-500",
  info: "text-blue-500",
};

interface StatusBarItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon | "dot";
  variant?: keyof typeof statusBarItemVariants;
  interactive?: boolean;
  animate?: boolean;
  asChild?: boolean;
}

const StatusBarItem = React.forwardRef<HTMLButtonElement, StatusBarItemProps>(
  (
    {
      icon: Icon,
      variant = "default",
      interactive = false,
      animate = false,
      asChild = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : interactive ? "button" : "div";
    const variantClass = statusBarItemVariants[variant];

    return (
      <Comp
        ref={ref}
        className={cn(
          "flex items-center gap-1 rounded px-1.5 py-0.5",
          variantClass,
          interactive && "transition-colors hover:bg-muted cursor-pointer",
          !interactive && "cursor-default",
          variant !== "default" && !interactive && `bg-${variant}-500/10`,
          className,
        )}
        {...(props as any)}
      >
        {Icon && (
          <>
            {Icon === "dot" ? (
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  variantClass.replace("text-", "bg-"),
                )}
              />
            ) : (
              <Icon className={cn("h-3 w-3", animate && "animate-pulse")} />
            )}
          </>
        )}
        {children && <span>{children}</span>}
      </Comp>
    );
  },
);
StatusBarItem.displayName = "StatusBarItem";

/* -------------------------------- Separator -------------------------------- */

const StatusBarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentPropsWithoutRef<typeof Separator>
>(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      orientation="vertical"
      className={cn("h-3 mx-1", className)}
      {...props}
    />
  );
});
StatusBarSeparator.displayName = "StatusBarSeparator";

/* -------------------------------- Exports -------------------------------- */

export { StatusBar, StatusBarItem, StatusBarSection, StatusBarSeparator };
