// @ts-nocheck
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../contexts/SettingsContext';
import { supabase, type WorkOrder, type Technician, type Invoice } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Clock, DollarSign, Users } from 'lucide-react';

export function Reports() {
  const { t } = useTranslation();
  const { currency } = useSettings();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [workOrderItems, setWorkOrderItems] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [timeLogs, setTimeLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [ordersRes, techniciansRes, invoicesRes, itemsRes, logsRes] = await Promise.all([
      supabase.from('work_orders').select('*'),
      supabase.from('technicians').select('*'),
      supabase.from('invoices').select('*'),
      supabase.from('work_order_items').select('*'),
      supabase.from('time_logs').select('*'),
    ]);
    setWorkOrders(ordersRes.data || []);
    setTechnicians(techniciansRes.data || []);
    setInvoices(invoicesRes.data || []);
    setWorkOrderItems(itemsRes.data || []);
    setTimeLogs(logsRes.data || []);
    setLoading(false);
  }

  // Filter by date range
  const filterByDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const daysAgo = new Date(now.setDate(now.getDate() - parseInt(dateRange)));
    return d >= daysAgo;
  };

  const filteredOrders = workOrders.filter((o) => filterByDate(o.created_at));
  const filteredInvoices = invoices.filter((i) => filterByDate(i.created_at));

  // Revenue by day (based on Paid Invoices)
  const revenueByDay = filteredInvoices
    .filter((i) => i.status === 'paid')
    .reduce((acc: Record<string, number>, invoice) => {
      const date = (invoice.paid_date || invoice.created_at).split('T')[0];
      acc[date] = (acc[date] || 0) + (invoice.total || 0);
      return acc;
    }, {});

  const revenueData = Object.entries(revenueByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, revenue]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue,
    }));

  // Jobs by status
  const jobsByStatus = filteredOrders.reduce((acc: Record<string, number>, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.entries(jobsByStatus).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' '),
    value: count,
  }));

  const STATUS_COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#6B7280'];

  // Tech productivity
  const techProductivity = technicians.map((tech) => {
    const validStatuses = ['completed', 'in-progress', 'testing', 'pending'];
    const techOrders = filteredOrders.filter((o) => o.technician_id === tech.id && validStatuses.includes(o.status));
    const techOrderIds = techOrders.map(o => o.id);

    const totalHours = workOrderItems
      .filter(i => techOrderIds.includes(i.work_order_id) && i.item_type === 'labor')
      .reduce((sum, i) => sum + (i.quantity || 0), 0);

    const totalRevenue = techOrders.reduce((sum, o) => sum + (o.actual_cost || o.estimated_cost || 0), 0);
    return {
      name: tech.name.split(' ')[0],
      hours: totalHours,
      revenue: totalRevenue,
      jobs: techOrders.length,
    };
  });

  // Summary stats
  // Summary stats
  const totalRevenue = filteredInvoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0);
  const completedJobsCount = filteredOrders.filter((o) => o.status === 'completed').length;
  const paidInvoicesCount = filteredInvoices.filter((i) => i.status === 'paid').length;
  const avgJobValue = paidInvoicesCount > 0 ? totalRevenue / paidInvoicesCount : 0;
  const completedJobs = completedJobsCount;
  const avgCompletionTime = 2.5; // Placeholder

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[32px] font-bold text-foreground">{t('reports')}</h1>
          <p className="text-muted-foreground">{t('generate_report')}</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
        >
          <option value="7">{t('last_7_days')}</option>
          <option value="30">{t('last_30_days')}</option>
          <option value="90">{t('last_90_days')}</option>
          <option value="365">{t('last_year')}</option>
        </select>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-emerald-500" />
            <div>
              <p className="text-sm text-muted-foreground">{t('total_revenue')}</p>
              <p className="text-2xl font-bold text-foreground">{currency}{totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary-500" />
            <div>
              <p className="text-sm text-muted-foreground">{t('avg_job_value')}</p>
              <p className="text-2xl font-bold text-foreground">{currency}{avgJobValue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-amber-500" />
            <div>
              <p className="text-sm text-muted-foreground">{t('completed_jobs')}</p>
              <p className="text-2xl font-bold text-foreground">{completedJobs}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">{t('active_technicians')}</p>
              <p className="text-2xl font-bold text-foreground">{technicians.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <h3 className="font-semibold text-foreground mb-4">{t('revenue_trend')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#525252" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#a3a3a3" />
              <YAxis tick={{ fontSize: 12 }} stroke="#a3a3a3" tickFormatter={(v) => `${currency}${v}`} />
              <Tooltip
                formatter={(v: any) => [`${currency}${Number(v).toFixed(2)}`, t('revenue')]}
                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#0066FF" strokeWidth={2} dot={{ fill: '#0066FF' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <h3 className="font-semibold text-foreground mb-4">{t('jobs_by_status')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {statusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card p-6">
        <h3 className="font-semibold text-foreground mb-4">{t('technician_productivity')}</h3>
        {techProductivity.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">{t('no_technician_data')}</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={techProductivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#525252" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#a3a3a3" />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#a3a3a3" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#a3a3a3" tickFormatter={(v) => `${currency}${v}`} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
              <Bar yAxisId="left" dataKey="hours" fill="#0066FF" name="Hours Billed" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="revenue" fill="#10B981" name="Revenue" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
