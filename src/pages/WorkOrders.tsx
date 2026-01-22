import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../contexts/SettingsContext';
import { supabase, type WorkOrder, type Customer, type Vehicle, type Technician, type Estimate, type InventoryPart } from '../lib/supabase';
import { DataTable, StatusBadge } from '../components/DataTable';
import { Button } from '../components/Modal';
import { Plus, Search, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PricingEngine } from '../lib/pricingEngine';
import { communicationService } from '../lib/communicationService';
import { toast } from 'sonner';
import { EmptyState } from '../components/EmptyState';
import { KanbanBoard } from '../components/work-orders/KanbanBoard';
import { WorkOrderModal } from '../components/work-orders/WorkOrderModal';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'pending' },
  { value: 'approved', label: 'approved' },
  { value: 'testing', label: 'testing' },
  { value: 'in-progress', label: 'in_progress' },
  { value: 'completed', label: 'completed' },
  { value: 'cancelled', label: 'cancelled' },
];

export function WorkOrders() {
  const { t } = useTranslation();
  const { currency } = useSettings();
  const navigate = useNavigate();
  const pricingEngine = new PricingEngine();

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [inventoryParts, setInventoryParts] = useState<InventoryPart[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [ordersRes, customersRes, vehiclesRes, techniciansRes, estimatesRes, partsRes, invoicesRes] = await Promise.all([
      supabase.from('work_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('customers').select('*'),
      supabase.from('vehicles').select('*'),
      supabase.from('technicians').select('*'),
      supabase.from('estimates').select('*'),
      supabase.from('inventory_parts').select('*').order('category', { ascending: true }),
      supabase.from('invoices').select('*'),
    ]);
    setWorkOrders(ordersRes.data || []);
    setCustomers(customersRes.data || []);
    setVehicles(vehiclesRes.data || []);
    setTechnicians(techniciansRes.data || []);
    setEstimates(estimatesRes.data || []);
    setInventoryParts(partsRes.data || []);
    setInvoices(invoicesRes.data || []);
    setLoading(false);
  }

  // Helper functions used in render or passed to children
  const getCustomerName = (id: string) => customers.find((c) => c.id === id)?.name || '-';
  const getVehicleInfo = (id: string) => {
    const v = vehicles.find((v) => v.id === id);
    return v ? `${v.year} ${v.make} ${v.model}` : '-';
  };
  const getTechName = (id: string | null) => technicians.find((t) => t.id === id)?.name || 'Unassigned';

  async function openEdit(order: WorkOrder) {
    setEditingOrder(order);
    setIsModalOpen(true);
  }

  // Auto-create invoice logic used in handleStatusChange
  async function autoCreateInvoice(order: WorkOrder) {
    const { data: existing } = await supabase
      .from('invoices')
      .select('id')
      .eq('work_order_id', order.id)
      .single();

    if (existing) return;

    const customer = customers.find(c => c.id === order.customer_id);
    const vatRate = (customer?.vat_rate || 20) / 100;
    const discountPercent = customer?.default_discount || 0;

    const { data: items } = await supabase
      .from('work_order_items')
      .select('*')
      .eq('work_order_id', order.id);

    const subtotal = (items || []).reduce((sum: number, item: any) =>
      sum + (Number(item.quantity) * Number(item.unit_price)), 0);

    const discount = discountPercent > 0 ? { type: 'percentage' as const, value: discountPercent } : undefined;
    const { taxAmount, total, discountAmount } = pricingEngine.calculateInvoice(subtotal, discount, vatRate);

    const { data: newInvoice, error } = await supabase.from('invoices').insert([{
      invoice_number: `INV-${Date.now()}`,
      work_order_id: order.id,
      customer_id: order.customer_id,
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      total,
      status: 'pending',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }]).select().single();

    if (!error && newInvoice) {
      await communicationService.createNotification(
        'invoice_paid',
        'Invoice Created',
        `Invoice ${newInvoice.invoice_number} created for ${customer?.name} - ${currency}${total.toFixed(2)}`,
        order.id,
        order.customer_id
      );

      await supabase.from('work_orders').update({ status: 'archived' }).eq('id', order.id);
      navigate(`/billing?invoiceId=${newInvoice.id}`);
    }
  }

  async function handleStatusChange(orderId: string, newStatus: string) {
    const order = workOrders.find(o => o.id === orderId);

    // Optimistic update
    setWorkOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

    const { error } = await supabase.from('work_orders').update({ status: newStatus }).eq('id', orderId);
    if (error) {
      console.error('Error updating status:', error);
      loadData(); // Revert
      return;
    }

    if ((newStatus === 'approved' || newStatus === 'in-progress') && order) {
      const estimate = estimates.find(e => e.work_order_id === orderId);
      if (estimate && (estimate.status === 'draft' || estimate.status === 'sent')) {
        setEstimates(prev => prev.map(e => e.id === estimate.id ? { ...e, status: 'approved', approved_at: new Date().toISOString() } : e));
        await supabase.from('estimates').update({
          status: 'approved',
          approved_at: new Date().toISOString()
        }).eq('id', estimate.id);
      }
    }

    if (newStatus === 'in-progress' && order) {
      const customer = customers.find(c => c.id === order.customer_id);
      const vehicle = vehicles.find(v => v.id === order.vehicle_id);
      const vehicleInfo = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Vehicle';

      if (customer) {
        communicationService.sendWorkOrderStartedNotification(
          customer,
          vehicleInfo,
          order
        ).catch(console.error);
      }
    }

    if (newStatus === 'completed' && order) {
      const customer = customers.find(c => c.id === order.customer_id);
      const vehicle = vehicles.find(v => v.id === order.vehicle_id);
      const vehicleInfo = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Vehicle';

      if (customer) {
        communicationService.sendJobCompletionNotification(
          customer,
          vehicleInfo,
          order.id,
          order.description || order.diagnosis
        ).catch(console.error);
      }

      if (vehicle) {
        const serviceType = order.description?.toLowerCase().includes('oil') ? 'Oil Change' :
          order.description?.toLowerCase().includes('brake') ? 'Brake Service' :
            order.description?.toLowerCase().includes('tire') ? 'Tire Service' :
              order.description?.toLowerCase().includes('inspection') ? 'Inspection' :
                'General Service';

        const { data: woItems } = await supabase
          .from('work_order_items')
          .select('*')
          .eq('work_order_id', order.id);

        let detailedDescription = order.description || order.diagnosis || 'Service completed';
        if (woItems && woItems.length > 0) {
          detailedDescription += '\n\n--- Parts & Labor ---\n';
          woItems.forEach(item => {
            detailedDescription += `• ${item.description} (${item.quantity} x ${currency}${item.unit_price})\n`;
          });
          const totalParts = woItems.reduce((acc, item: any) => acc + (item.quantity * item.unit_price), 0);
          detailedDescription += `\nTotal: ${currency}${totalParts.toFixed(2)}`;
        }

        const serviceHistoryData = {
          vehicle_id: order.vehicle_id,
          work_order_id: order.id,
          service_type: serviceType,
          description: detailedDescription,
          mileage_at_service: vehicle.mileage,
          cost: order.actual_cost || order.estimated_cost || 0,
          service_date: new Date().toISOString().split('T')[0]
        };

        const { error: serviceHistoryError } = await supabase
          .from('service_history')
          .insert([serviceHistoryData]);

        if (serviceHistoryError) {
          toast.error(`${t('service_history_save_error') || 'Failed to save service history'}`);
        }
      }

      await autoCreateInvoice(order);
    }
    loadData();
  }

  async function handleArchiveOrder(id: string) {
    if (confirm(t('confirm_delete') || 'Are you sure you want to delete this order?')) {
      const { error } = await supabase.from('work_orders').update({ status: 'archived' }).eq('id', id);
      if (error) {
        alert('Failed to delete order: ' + error.message);
      } else {
        loadData();
      }
    }
  }

  const filteredOrders = workOrders.filter((o) => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.description?.toLowerCase().includes(search.toLowerCase()) ||
      getCustomerName(o.customer_id).toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const notArchived = o.status !== 'archived';

    // Filter out paid orders
    const activeInvoice = invoices.find(inv => inv.work_order_id === o.id);
    const isPaid = activeInvoice?.status === 'paid';

    return matchSearch && matchStatus && notArchived && !isPaid;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[32px] font-bold text-foreground">{t('work_orders')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button onClick={() => { setEditingOrder(null); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2 inline" />
          {t('new_work_order')}
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 bg-background text-foreground"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
        >
          <option value="all">{t('all')}</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{t(s.label)}</option>
          ))}
        </select>
        <div className="flex border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 text-sm ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-card text-foreground'}`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-4 py-2 text-sm ${viewMode === 'kanban' ? 'bg-primary-500 text-white' : 'bg-card text-foreground'}`}
          >
            Kanban
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <DataTable
          data={filteredOrders}
          loading={loading}
          onRowClick={openEdit}
          columns={[
            { key: 'id', header: t('order_number'), render: (o) => o.id.substring(0, 8) },
            { key: 'customer_id', header: t('customer'), render: (o) => getCustomerName(o.customer_id) },
            { key: 'vehicle_id', header: t('vehicle'), render: (o) => getVehicleInfo(o.vehicle_id) },
            { key: 'technician_id', header: t('technician'), render: (o) => getTechName(o.technician_id) },
            { key: 'status', header: t('status'), render: (o) => <StatusBadge status={o.status} /> },
            { key: 'priority', header: t('priority') },
            { key: 'actual_cost', header: t('actual_cost'), render: (o) => `${currency}${(o.actual_cost || o.estimated_cost || 0).toFixed(2)}` },
          ]}
          emptyState={
            <EmptyState
              title={t('no_orders') || 'No orders found'}
              description={t('create_first_order') || 'Create your first work order to get started.'}
              icon={ClipboardList}
              action={{
                label: t('new_work_order'),
                onClick: () => { setEditingOrder(null); setIsModalOpen(true); }
              }}
            />
          }
        />
      ) : (
        filteredOrders.length === 0 && !loading ? (
          <div className="flex h-[calc(100vh-12rem)] items-center justify-center bg-muted/10 rounded-xl border border-dashed border-border">
            <EmptyState
              title={t('no_orders') || 'No orders found'}
              description={t('create_first_order') || 'Create your first work order to get started.'}
              icon={ClipboardList}
              action={{
                label: t('new_work_order'),
                onClick: () => { setEditingOrder(null); setIsModalOpen(true); }
              }}
            />
          </div>
        ) : (
          <KanbanBoard
            orders={filteredOrders}
            onEdit={openEdit}
            getTechName={getTechName}
            onStatusChange={handleStatusChange}
            estimates={estimates}
            onArchive={handleArchiveOrder}
          />
        )
      )}

      <WorkOrderModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingOrder(null); }}
        editingOrder={editingOrder}
        customers={customers}
        vehicles={vehicles}
        technicians={technicians}
        inventoryParts={inventoryParts}
        workOrders={workOrders}
        estimates={estimates}
        onSave={loadData}
      />
    </div>
  );
}
