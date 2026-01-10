import { ChevronLeft, ChevronRight } from 'lucide-react';

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
      <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-neutral-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-neutral-500">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onRowClick?.(item)}
                  className={`hover:bg-neutral-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className={`px-6 py-4 text-sm text-neutral-900 ${col.className || ''}`}>
                      {col.render ? col.render(item) : String((item as any)[col.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    'in-progress': 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-neutral-100 text-neutral-700',
    paid: 'bg-emerald-100 text-emerald-700',
    overdue: 'bg-red-100 text-red-700',
    available: 'bg-emerald-100 text-emerald-700',
    busy: 'bg-amber-100 text-amber-700',
    'low-stock': 'bg-red-100 text-red-700',
    'in-stock': 'bg-emerald-100 text-emerald-700',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-neutral-100 text-neutral-700'}`}>
      {status.replace('-', ' ')}
    </span>
  );
}
