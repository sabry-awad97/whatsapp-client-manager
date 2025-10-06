import type { LucideIcon } from "lucide-react";
import { Activity, CheckCircle2, WifiOff } from "lucide-react";

type ServerStatus = "online" | "offline" | "checking";

interface ServerStatusConfig {
  icon: LucideIcon;
  text: string;
  variant: "success" | "destructive" | "warning";
}

const statusConfig: Record<ServerStatus, ServerStatusConfig> = {
  online: {
    icon: CheckCircle2,
    text: "Connected",
    variant: "success",
  },
  offline: {
    icon: WifiOff,
    text: "Disconnected",
    variant: "destructive",
  },
  checking: {
    icon: Activity,
    text: "Connecting...",
    variant: "warning",
  },
};

export function useServerStatus(status: ServerStatus = "online") {
  return statusConfig[status];
}
