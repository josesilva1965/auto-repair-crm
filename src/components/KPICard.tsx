import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

const colorMap = {
  blue: 'bg-primary/10 text-primary',
  green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  yellow: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  red: 'bg-destructive/10 text-destructive',
};

export function KPICard({ title, value, trend, icon: Icon, color = 'blue' }: KPICardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className="text-2xl font-bold tracking-tight text-foreground">{value}</h3>
            {trend !== undefined && (
              <div className={cn(
                "flex items-center gap-1 mt-2 text-xs font-medium",
                trend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
              )}>
                {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{Math.abs(trend)}% from last week</span>
              </div>
            )}
          </div>
          <div className={cn("p-3 rounded-xl", colorMap[color])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
