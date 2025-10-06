import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Area, AreaChart, Line, LineChart } from "recharts";

export interface Metric {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  color?: string;
  bgColor?: string;
  chartData?: Array<{ value: number; timestamp?: string }>;
  chartType?: "line" | "area";
}

interface LiveMetricsProps {
  metrics: Metric[];
  title?: string;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}

export function LiveMetrics({
  metrics,
  title = "Live Metrics",
  className,
  columns = 2,
}: LiveMetricsProps) {
  const gridColsClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className={cn("grid gap-4", gridColsClass)}>
          {metrics.map((metric, index) => {
            const Icon = metric.icon || Activity;
            const hasPositiveChange =
              metric.change !== undefined && metric.change >= 0;
            const hasNegativeChange =
              metric.change !== undefined && metric.change < 0;

            // Extract color from text-* class or use default
            const extractColor = (colorClass?: string): string => {
              if (!colorClass) return "primary";
              // Handle text-blue-600 -> blue-600, text-green-600 -> green-600, etc.
              const match = colorClass.match(/text-(\w+-\d+)/);
              if (match) return match[1];
              // Handle text-primary -> primary
              return colorClass.replace("text-", "");
            };

            const chartColor = extractColor(metric.color);
            const hasChart = metric.chartData && metric.chartData.length > 0;

            // Get theme-aware colors for charts
            const getChartColors = (color: string) => {
              const colorMap: Record<string, { light: string; dark: string }> =
                {
                  success: {
                    light: "oklch(0.649 0.169 156.743)",
                    dark: "oklch(0.649 0.169 156.743)",
                  },
                  info: {
                    light: "oklch(0.569 0.193 252.322)",
                    dark: "oklch(0.696 0.17 162.48)",
                  },
                  warning: {
                    light: "oklch(0.769 0.188 70.08)",
                    dark: "oklch(0.828 0.189 84.429)",
                  },
                  "chart-1": {
                    light: "oklch(0.646 0.222 41.116)",
                    dark: "oklch(0.488 0.243 264.376)",
                  },
                  "chart-2": {
                    light: "oklch(0.6 0.118 184.704)",
                    dark: "oklch(0.696 0.17 162.48)",
                  },
                  primary: {
                    light: "oklch(0.205 0 0)",
                    dark: "oklch(0.985 0 0)",
                  },
                };
              return colorMap[color] || colorMap.primary;
            };

            const chartColors = getChartColors(chartColor);

            return (
              <div
                key={`${metric.label}-${index}`}
                className="group relative overflow-hidden rounded-lg border bg-card hover:shadow-md transition-all duration-300"
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative p-4">
                  {/* Header with icon and trend */}
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={cn(
                        "p-2 rounded-lg shrink-0 transition-transform duration-300 group-hover:scale-110",
                        metric.bgColor || "bg-primary/10",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          metric.color || "text-primary",
                        )}
                      />
                    </div>
                    {metric.change !== undefined && (
                      <div
                        className={cn(
                          "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
                          hasPositiveChange &&
                            "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/50",
                          hasNegativeChange &&
                            "text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/50",
                        )}
                      >
                        {hasPositiveChange && (
                          <TrendingUp className="h-3 w-3" />
                        )}
                        {hasNegativeChange && (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>
                          {hasPositiveChange && "+"}
                          {metric.change}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Label and value */}
                  <div className="space-y-1 mb-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {metric.label}
                    </p>
                    <p className="text-2xl font-bold leading-none tracking-tight">
                      {metric.value}
                    </p>
                    {metric.changeLabel && (
                      <p className="text-xs text-muted-foreground">
                        {metric.changeLabel}
                      </p>
                    )}
                  </div>

                  {/* Chart */}
                  {hasChart && (
                    <div className="h-16 -mx-2 -mb-2">
                      <ChartContainer
                        config={{
                          value: {
                            label: metric.label,
                            theme: {
                              light: chartColors.light,
                              dark: chartColors.dark,
                            },
                          },
                        }}
                        className="h-full w-full"
                      >
                        {metric.chartType === "area" ? (
                          <AreaChart data={metric.chartData}>
                            <defs>
                              <linearGradient
                                id={`gradient-${index}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="0%"
                                  stopColor="var(--color-value)"
                                  stopOpacity={0.3}
                                />
                                <stop
                                  offset="100%"
                                  stopColor="var(--color-value)"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <ChartTooltip
                              content={<ChartTooltipContent hideLabel />}
                            />
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="var(--color-value)"
                              fill={`url(#gradient-${index})`}
                              strokeWidth={2}
                              dot={false}
                            />
                          </AreaChart>
                        ) : (
                          <LineChart data={metric.chartData}>
                            <ChartTooltip
                              content={<ChartTooltipContent hideLabel />}
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="var(--color-value)"
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        )}
                      </ChartContainer>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
