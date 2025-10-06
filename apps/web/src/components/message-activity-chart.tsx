import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface MessageActivityChartProps {
  totalSent: number;
  totalDelivered: number;
  className?: string;
}

export function MessageActivityChart({
  totalSent,
  totalDelivered,
  className,
}: MessageActivityChartProps) {
  const [chartData, setChartData] = useState<
    Array<{ time: string; sent: number; delivered: number }>
  >([]);

  // Define colors for light and dark themes
  const sentColor = {
    light: "oklch(0.646 0.222 41.116)", // Orange
    dark: "oklch(0.828 0.189 84.429)", // Bright yellow-orange
  };

  const deliveredColor = {
    light: "oklch(0.488 0.243 264.376)", // Purple
    dark: "oklch(0.696 0.17 162.48)", // Cyan
  };

  useEffect(() => {
    // Generate hourly data for the last 24 hours with realistic patterns
    const data = [];
    const now = new Date();

    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourLabel = hour.getHours().toString().padStart(2, "0") + ":00";

      // Simulate realistic message patterns (higher during business hours)
      const isBusinessHours = hour.getHours() >= 9 && hour.getHours() <= 18;
      const baseActivity = isBusinessHours ? 50 : 20;
      const variance = Math.random() * 30;

      const sent = Math.floor(baseActivity + variance);
      const delivered = Math.floor(sent * (0.92 + Math.random() * 0.06)); // 92-98% delivery rate

      data.push({
        time: hourLabel,
        sent,
        delivered,
      });
    }

    setChartData(data);
  }, [totalSent, totalDelivered]);

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Message Activity (24h)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer
          config={{
            sent: {
              label: "Sent",
              theme: {
                light: "oklch(0.646 0.222 41.116)", // Orange
                dark: "oklch(0.828 0.189 84.429)", // Bright yellow-orange
              },
            },
            delivered: {
              label: "Delivered",
              theme: {
                light: "oklch(0.488 0.243 264.376)", // Purple
                dark: "oklch(0.696 0.17 162.48)", // Cyan
              },
            },
          }}
          className="h-[300px] w-full"
        >
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-sent)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-sent)"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-delivered)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-delivered)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.3}
            />
            <XAxis
              dataKey="time"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="sent"
              stroke="var(--color-sent)"
              fillOpacity={1}
              fill="url(#colorSent)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="delivered"
              stroke="var(--color-delivered)"
              fillOpacity={1}
              fill="url(#colorDelivered)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>

        {/* Legend */}
        <div className="flex items-center justify-center gap-8 mt-6 pt-4 border-t">
          <div className="flex items-center gap-2.5">
            <div className="h-3.5 w-3.5 rounded-full shadow-sm bg-[oklch(0.646_0.222_41.116)] dark:bg-[oklch(0.828_0.189_84.429)]" />
            <span className="text-sm font-medium text-foreground">Sent</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-3.5 w-3.5 rounded-full shadow-sm bg-[oklch(0.488_0.243_264.376)] dark:bg-[oklch(0.696_0.17_162.48)]" />
            <span className="text-sm font-medium text-foreground">
              Delivered
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
