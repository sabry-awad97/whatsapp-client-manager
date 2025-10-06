import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { TrendingUp } from "lucide-react";

export interface Stat {
  label: string;
  value: string | number;
  total?: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  trend: "up" | "down" | "neutral";
  trendText?: string;
  trendLabel?: string;
  subtitle?: string;
}

interface StatsOverviewProps {
  stats: Stat[];
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export function StatsOverview({
  stats,
  columns = 4,
  className,
}: StatsOverviewProps) {
  const gridColsClass = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
  }[columns];

  return (
    <div className={cn("grid gap-1.5 mb-2", gridColsClass, className)}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.label}
            className="shadow-none border-muted hover:bg-muted/50 transition-colors"
          >
            <CardContent className="py-0">
              <div className="flex items-start justify-between mb-1.5">
                <div className={cn("p-1 rounded-md", stat.bgColor)}>
                  <Icon className={cn("h-3 w-3", stat.color)} />
                </div>
                {stat.trend !== "neutral" && (
                  <div
                    className={cn(
                      "flex items-center gap-0.5 text-[10px] font-medium px-1 py-0.5 rounded-full",
                      stat.trend === "up"
                        ? "text-green-600 bg-green-600/10"
                        : "text-red-600 bg-red-600/10"
                    )}
                  >
                    <TrendingUp
                      className={cn(
                        "h-2 w-2",
                        stat.trend === "down" && "rotate-180"
                      )}
                    />
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
                  {stat.label}
                </p>
                <p className="text-lg font-bold leading-none">
                  {stat.value}
                  {stat.total !== undefined && (
                    <span className="text-xs text-muted-foreground font-normal ml-1">
                      /{stat.total}
                    </span>
                  )}
                </p>
                {stat.trendText && stat.trendLabel && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <TrendingUp
                      className={cn(
                        "h-2 w-2",
                        stat.trend === "up" ? "text-green-600" : "text-red-600",
                        stat.trend === "down" && "rotate-180"
                      )}
                    />
                    <span
                      className={cn(
                        "text-[10px] font-medium",
                        stat.trend === "up" ? "text-green-600" : "text-red-600"
                      )}
                    >
                      {stat.trendText}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {stat.trendLabel}
                    </span>
                  </div>
                )}
                {stat.subtitle && !stat.trendText && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {stat.subtitle}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
