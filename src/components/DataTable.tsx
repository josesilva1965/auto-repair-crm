import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  loading?: boolean;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  loading,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <Card className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground font-medium uppercase text-xs tracking-wider">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn("px-6 py-4 font-semibold", col.className)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-muted-foreground">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    "group transition-colors hover:bg-muted/30",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={cn("px-6 py-4 text-foreground/80 group-hover:text-foreground", col.className)}
                    >
                      {col.render ? col.render(item) : String((item as any)[col.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    'in-progress': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
    paid: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    overdue: 'bg-destructive/10 text-destructive border-destructive/20',
    available: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    busy: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    'low-stock': 'bg-destructive/10 text-destructive border-destructive/20',
    'in-stock': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      statusColors[status] || 'bg-muted text-muted-foreground border-border'
    )}>
      {status.replace('-', ' ')}
    </span>
  );
}
