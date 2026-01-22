import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { useMemo } from 'react';
import * as React from 'react';

import { KPITrendColor } from '@/types/enums';

// Theme configuration for the cards
// Theme configuration for the cards
const themeMap: Record<KPITrendColor, { gradient: string; iconBg: string; iconColor: string; stroke: string; fill: string }> = {
  [KPITrendColor.GREEN]: {
    gradient: "from-emerald-500/20 to-emerald-500/5",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    stroke: "#10b981", // emerald-500
    fill: "#10b981",
  },
  [KPITrendColor.RED]: {
    gradient: "from-red-500/20 to-red-500/5",
    iconBg: "bg-red-500/20",
    iconColor: "text-red-600 dark:text-red-400",
    stroke: "#ef4444", // red-500
    fill: "#ef4444",
  },
  [KPITrendColor.NEUTRAL]: {
    gradient: "from-gray-500/20 to-gray-500/5",
    iconBg: "bg-gray-500/20",
    iconColor: "text-gray-600 dark:text-gray-400",
    stroke: "#6b7280", // gray-500
    fill: "#6b7280",
  },
  [KPITrendColor.BLUE]: {
    gradient: "from-blue-500/20 to-blue-500/5",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    stroke: "#3b82f6", // blue-500
    fill: "#3b82f6",
  },
  [KPITrendColor.YELLOW]: {
    gradient: "from-amber-500/20 to-amber-500/5",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    stroke: "#f59e0b", // amber-500
    fill: "#f59e0b",
  },
};

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: LucideIcon;
  color?: KPITrendColor;
  chartData?: number[]; // Optional custom data
  animationDelay?: number; // ms delay for staggered entrance
  className?: string; // additional classes
  style?: React.CSSProperties; // custom inline style
}

export function KPICard({ title, value, trend, icon: Icon, color = KPITrendColor.BLUE, chartData, animationDelay = 0, className, style }: KPICardProps) {
  const theme = themeMap[color];

  // Generate sparkline data if none provided
  const data = useMemo(() => {
    if (chartData) return chartData.map((val, i) => ({ i, val }));

    // Simulate data based on trend
    const points = [];
    let current = 50;
    const isPositive = (trend || 0) >= 0;

    for (let i = 0; i < 10; i++) {
      // Random walk
      const change = Math.random() * 20 - 10;
      // Bias based on trend
      const bias = isPositive ? 5 : -5;
      current += change + (trend ? bias : 0);
      points.push({ i, val: Math.max(0, current) });
    }
    return points;
  }, [chartData, trend]);

  return (
    <Card className={cn(
      "relative overflow-hidden border-none shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02]",
      "bg-gradient-to-br bg-white dark:bg-card",
      theme.gradient,
      "animate-fade-in-up",
      className
    )} style={style ? { ...style, animationDelay: `${animationDelay}ms` } : { animationDelay: `${animationDelay}ms` }}>
      {/* Background decorative chart */}
      <div className="absolute inset-x-0 bottom-0 h-24 opacity-20 pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.fill} stopOpacity={0.4} />
                <stop offset="100%" stopColor={theme.fill} stopOpacity={0} />
              </linearGradient>
            </defs>
            {/* @ts-expect-error Recharts type compatibility issue */}
            <Area
              type="monotone"
              dataKey="val"
              stroke={theme.stroke}
              strokeWidth={2}
              fill={`url(#gradient-${color})`}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("p-3 rounded-2xl transition-colors", theme.iconBg)}>
            <Icon className={cn("w-6 h-6", theme.iconColor)} />
          </div>
          {trend !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-white/50 dark:bg-black/20 backdrop-blur-sm",
              trend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
            )}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-3xl font-bold tracking-tight text-foreground mb-1 font-display">{value}</h3>
          <p className="text-sm font-medium text-muted-foreground/80 uppercase tracking-wide">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}
