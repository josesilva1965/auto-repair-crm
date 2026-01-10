import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

const colorMap = {
  blue: 'bg-primary-50 text-primary-600',
  green: 'bg-emerald-50 text-emerald-600',
  yellow: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
};

export function KPICard({ title, value, trend, icon: Icon, color = 'blue' }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-neutral-900">{value}</p>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(trend)}% from last week</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
