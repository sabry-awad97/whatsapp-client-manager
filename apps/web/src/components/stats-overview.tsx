import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

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
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
    6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
  }[columns];

  return (
    <div className={cn("grid gap-3 mb-4", gridColsClass, className)}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        const TrendIcon =
          stat.trend === "up"
            ? TrendingUp
            : stat.trend === "down"
              ? TrendingDown
              : Minus;

        return (
          <Card
            key={stat.label}
            className="group relative overflow-hidden shadow-sm border-muted/50 hover:border-muted hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
          >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <CardContent className="relative py-4 px-5">
              <div className="flex items-start justify-between mb-3">
                <div
                  className={cn(
                    "p-2.5 rounded-lg transition-all duration-300 group-hover:scale-110",
                    stat.bgColor,
                  )}
                >
                  <Icon className={cn("h-4 w-4", stat.color)} />
                </div>
                {stat.trend !== "neutral" && (
                  <div
                    className={cn(
                      "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full transition-all duration-300",
                      stat.trend === "up"
                        ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/50"
                        : "text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/50",
                    )}
                  >
                    <TrendIcon className="h-3 w-3" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold leading-none tracking-tight">
                    {stat.value}
                  </p>
                  {stat.total !== undefined && (
                    <span className="text-sm text-muted-foreground font-medium">
                      / {stat.total}
                    </span>
                  )}
                </div>

                {stat.trendText && stat.trendLabel && (
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-muted/30">
                    <TrendIcon
                      className={cn(
                        "h-3 w-3",
                        stat.trend === "up"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400",
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        stat.trend === "up"
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-rose-700 dark:text-rose-400",
                      )}
                    >
                      {stat.trendText}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {stat.trendLabel}
                    </span>
                  </div>
                )}

                {stat.subtitle && !stat.trendText && (
                  <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-muted/30">
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
