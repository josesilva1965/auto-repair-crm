import { useEffect, useState } from 'react';
import { supabase, type WorkOrder, type Customer, type InventoryPart, type Technician } from '../lib/supabase';
import { KPICard } from '../components/KPICard';
import { DataTable, StatusBadge } from '../components/DataTable';
import { DollarSign, ClipboardList, Users, AlertTriangle, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../contexts/SettingsContext';

export function Dashboard() {
  const { t } = useTranslation();
  const { currency } = useSettings();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryPart[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [ordersRes, customersRes, inventoryRes, techniciansRes] = await Promise.all([
        supabase.from('work_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('customers').select('*'),
        supabase.from('inventory_parts').select('*'),
        supabase.from('technicians').select('*'),
      ]);

      setWorkOrders(ordersRes.data || []);
      setCustomers(customersRes.data || []);
      setInventory(inventoryRes.data || []);
      setTechnicians(techniciansRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  }

  const activeJobs = workOrders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'archived');
  const todayRevenue = workOrders
    .filter((o) => o.status === 'completed' && o.completed_date === new Date().toISOString().split('T')[0])
    .reduce((sum, o) => sum + (o.actual_cost || o.estimated_cost || 0), 0);
  const lowStockItems = inventory.filter((i) => i.quantity <= i.min_stock);
  const availableTechs = technicians.filter((t) => t.status === 'available');
  const utilization = technicians.length > 0
    ? Math.round(((technicians.length - availableTechs.length) / technicians.length) * 100)
    : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[32px] font-bold text-neutral-900">{t('dashboard')}</h1>
        <p className="text-neutral-500">{t('overview')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title={t('todays_revenue')}
          value={`${currency}${todayRevenue.toLocaleString()}`}
          trend={12}
          icon={DollarSign}
          color="green"
        />
        <KPICard
          title={t('active_jobs')}
          value={activeJobs.length}
          trend={-5}
          icon={ClipboardList}
          color="blue"
        />
        <KPICard
          title={t('tech_utilization')}
          value={`${utilization}%`}
          icon={Users}
          color="yellow"
        />
        <KPICard
          title={t('low_stock_alerts')}
          value={lowStockItems.length}
          icon={AlertTriangle}
          color={lowStockItems.length > 0 ? 'red' : 'green'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">{t('active_jobs')}</h2>
            <Link to="/work-orders" className="text-sm text-primary-500 hover:text-primary-600">
              {t('view_all')}
            </Link>
          </div>
          <DataTable
            data={activeJobs.slice(0, 5)}
            loading={loading}
            columns={[
              { key: 'id', header: t('order_number'), render: (item) => item.id.substring(0, 8) },
              {
                key: 'status',
                header: t('status'),
                render: (item) => <StatusBadge status={item.status} />,
              },
              { key: 'priority', header: t('priority') },
              {
                key: 'estimated_cost',
                header: t('estimated_cost'),
                render: (item) => `${currency}${(item.actual_cost || item.estimated_cost || 0).toFixed(2)}`,
              },
            ]}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">{t('technician_schedule')}</h2>
            <span className="text-sm text-neutral-500">{technicians.length} {t('technicians').toLowerCase()}</span>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 shadow-card divide-y divide-neutral-100">
            {technicians.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">{t('no_technicians')}</div>
            ) : (
              technicians.slice(0, 5).map((tech) => (
                <div key={tech.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{tech.name}</p>
                      <p className="text-sm text-neutral-500">{tech.specialization || 'General'}</p>
                    </div>
                  </div>
                  <StatusBadge status={tech.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">{t('low_stock_alerts')}</h2>
            <Link to="/inventory" className="text-sm text-primary-500 hover:text-primary-600">
              {t('manage_inventory')}
            </Link>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex flex-wrap gap-3">
              {lowStockItems.map((item) => (
                <div key={item.id} className="bg-white px-3 py-2 rounded-lg border border-red-200">
                  <span className="font-medium text-neutral-900">{item.name}</span>
                  <span className="ml-2 text-red-600 text-sm">({item.quantity} {t('left')})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
