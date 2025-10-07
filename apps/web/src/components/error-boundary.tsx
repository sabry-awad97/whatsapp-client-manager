/**
 * Error Boundary and Error Display Components
 *
 * Provides beautiful, user-friendly error handling throughout the application
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  ServerCrash,
  WifiOff,
  XCircle,
} from "lucide-react";
import { Component, type ReactNode } from "react";

// ============================================================================
// TYPES
// ============================================================================

export interface ErrorDisplayProps {
  title?: string;
  message?: string;
  type?: "error" | "warning" | "network" | "server";
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ============================================================================
// ERROR DISPLAY COMPONENT
// ============================================================================

export function ErrorDisplay({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  type = "error",
  onRetry,
  retryLabel = "Try Again",
  className,
}: ErrorDisplayProps) {
  const config = {
    error: {
      icon: XCircle,
      iconColor: "text-destructive",
      bgColor: "bg-destructive/10",
      borderColor: "border-destructive/20",
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/20",
    },
    network: {
      icon: WifiOff,
      iconColor: "text-info",
      bgColor: "bg-info/10",
      borderColor: "border-info/20",
    },
    server: {
      icon: ServerCrash,
      iconColor: "text-destructive",
      bgColor: "bg-destructive/10",
      borderColor: "border-destructive/20",
    },
  };

  const { icon: Icon, iconColor, bgColor, borderColor } = config[type];

  return (
    <div
      className={cn("flex h-full items-center justify-center p-4", className)}
    >
      <Card className={cn("w-full max-w-md border-2", borderColor)}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={cn("p-3 rounded-full", bgColor)}>
              <Icon className={cn("h-6 w-6", iconColor)} />
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {message}
          </p>
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {retryLabel}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// INLINE ERROR COMPONENT
// ============================================================================

export function InlineError({
  title = "Error",
  message,
  onRetry,
  className,
}: ErrorDisplayProps) {
  return (
    <div
      className={cn(
        "rounded-lg border-2 border-destructive/20 bg-destructive/10 p-4",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-sm text-destructive">{title}</h3>
          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// NETWORK ERROR COMPONENT
// ============================================================================

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorDisplay
      type="network"
      title="Connection Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
      retryLabel="Reconnect"
    />
  );
}

// ============================================================================
// SERVER ERROR COMPONENT
// ============================================================================

export function ServerError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorDisplay
      type="server"
      title="Server Error"
      message="The server encountered an error. Our team has been notified. Please try again in a few moments."
      onRetry={onRetry}
      retryLabel="Retry"
    />
  );
}

// ============================================================================
// DATA FETCH ERROR COMPONENT
// ============================================================================

export function DataFetchError({
  resource = "data",
  onRetry,
}: {
  resource?: string;
  onRetry?: () => void;
}) {
  return (
    <InlineError
      title={`Failed to load ${resource}`}
      message={`We couldn't fetch the ${resource}. This might be a temporary issue.`}
      onRetry={onRetry}
    />
  );
}

// ============================================================================
// REACT ERROR BOUNDARY
// ============================================================================

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorDisplay
          title="Application Error"
          message={
            this.state.error?.message ||
            "An unexpected error occurred. Please refresh the page."
          }
          onRetry={this.handleReset}
          retryLabel="Reset"
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// EMPTY STATE COMPONENT (Not an error, but related)
// ============================================================================

export function EmptyState({
  icon: Icon = AlertCircle,
  title = "No data available",
  message = "There's nothing to display at the moment.",
  action,
  actionLabel,
}: {
  icon?: typeof AlertCircle;
  title?: string;
  message?: string;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="p-4 rounded-full bg-muted/50 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{message}</p>
      {action && actionLabel && (
        <Button onClick={action} variant="outline" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
