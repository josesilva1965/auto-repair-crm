// @ts-nocheck
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../contexts/SettingsContext';
import { supabase, type WorkOrder, type Customer, type Vehicle, type Technician, type Estimate, type InventoryPart } from '../lib/supabase';
import { DataTable, StatusBadge } from '../components/DataTable';
import { Button } from '../components/ui/button'; // Use standard button
import { Plus, Search, ClipboardList, LayoutGrid, List, Filter, Calendar, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PricingEngine } from '../lib/pricingEngine';
import { communicationService } from '../lib/communicationService';
import { toast } from 'sonner';
import { EmptyState } from '../components/EmptyState';
import { KanbanBoard } from '../components/work-orders/KanbanBoard';
import { WorkOrderModal } from '../components/work-orders/WorkOrderModal';
import { cn } from '../lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'; // Assuming ui/select exists? If not, use native.
// I'll use native select for safety or check if ui/select exists.
// Previous turn showed ui/select.tsx exists.

const STATUS_OPTIONS = [
  { value: 'pending', label: 'new_requests' },
  { value: 'approved', label: 'approved' },
  { value: 'in-progress', label: 'in_progress' },
  { value: 'waiting_parts', label: 'awaiting_parts' },
  { value: 'testing', label: 'testing' },
  { value: 'completed', label: 'ready_for_pickup' },
  { value: 'finished', label: 'finished' },
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

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [techFilter, setTechFilter] = useState('all');
  const [todayOnly, setTodayOnly] = useState(false);


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

  async function autoCreateInvoice(order: WorkOrder) {
    // Invoice creation logic (simplified/copied from previous)
    const { data: existing } = await supabase.from('invoices').select('id').eq('work_order_id', order.id).single();
    if (existing) return;

    const customer = customers.find(c => c.id === order.customer_id);
    const vatRate = (customer?.vat_rate || 20) / 100;
    const { data: items } = await supabase.from('work_order_items').select('*').eq('work_order_id', order.id);
    const subtotal = (items || []).reduce((sum: number, item: any) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);
    const { taxAmount, total } = pricingEngine.calculateInvoice(subtotal, undefined, vatRate);

    const { data: newInvoice } = await supabase.from('invoices').insert([{
      invoice_number: `INV-${Date.now()}`,
      work_order_id: order.id,
      customer_id: order.customer_id,
      subtotal, tax: taxAmount, total, status: 'pending', discount: 0,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }]).select().single();

    if (newInvoice) {
      toast.success(t('invoice_created_success') || 'Invoice created');
      // await supabase.from('work_orders').update({ status: 'archived' }).eq('id', order.id);
      // navigate(`/billing?invoiceId=${newInvoice.id}`);
    }
  }

  async function handleStatusChange(orderId: string, newStatus: string) {
    const order = workOrders.find(o => o.id === orderId);
    setWorkOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    await supabase.from('work_orders').update({ status: newStatus }).eq('id', orderId);

    // Business Logic triggers
    if (newStatus === 'completed' && order) {
      await autoCreateInvoice(order);
    }
    loadData();
  }

  async function handleArchiveOrder(id: string) {
    if (confirm(t('confirm_delete'))) {
      await supabase.from('work_orders').update({ status: 'archived' }).eq('id', id);
      loadData();
    }
  }

  const filteredOrders = workOrders.filter((o) => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.description?.toLowerCase().includes(search.toLowerCase()) ||
      getCustomerName(o.customer_id).toLowerCase().includes(search.toLowerCase());

    // Status Filter (if dropdown used)
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const notArchived = o.status !== 'archived';
    const activeInvoice = invoices.find(inv => inv.work_order_id === o.id);
    const isPaid = activeInvoice?.status === 'paid';

    // UI Filters
    let matchUrgent = true;
    if (urgentOnly) matchUrgent = o.priority === 'urgent' || o.priority === 'high';

    let matchTech = true;
    if (techFilter !== 'all') matchTech = o.technician_id === techFilter;

    let matchToday = true;
    if (todayOnly) {
      // Assuming created_at or due_date match today? Or scheduled_date?
      // Using created_at for simplicity or due_date if available
      const date = o.due_date || o.created_at;
      matchToday = new Date(date).toDateString() === new Date().toDateString();
    }

    return matchSearch && matchStatus && notArchived && !isPaid && matchUrgent && matchTech && matchToday;
  });

  return (
    <div className="bg-neutral-50 min-h-screen flex flex-col">
      {/* Top Bar / Header */}
      <div className="mb-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder={t('search_service_id_vin') || "Search service ID or VIN"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 bg-white shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={() => { setEditingOrder(null); setIsModalOpen(true); }} className="shadow-lg shadow-blue-500/20">
              <Plus className="w-4 h-4 mr-2" strokeWidth={3} />
              {t('new_service_request') || 'New Service Request'}
            </Button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-2 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              className="bg-neutral-100 border-none text-sm font-medium rounded-lg px-4 py-2 cursor-pointer outline-none hover:bg-neutral-200 transition-colors"
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value)}
            >
              <option value="all">{t('all_technicians') || 'All Technicians'}</option>
              {technicians.map(tech => (
                <option key={tech.id} value={tech.id}>{tech.name}</option>
              ))}
            </select>

            <button
              onClick={() => setUrgentOnly(!urgentOnly)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                urgentOnly ? "bg-red-50 text-red-600 border-red-200" : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
              )}
            >
              <AlertCircle className="w-4 h-4" />
              {t('urgent_only') || 'Urgent Only'}
            </button>

            <button
              onClick={() => setTodayOnly(!todayOnly)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                todayOnly ? "bg-primary-50 text-primary border-primary-100" : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
              )}
            >
              <Calendar className="w-4 h-4" />
              {t('todays_schedule') || "Today's Schedule"}
            </button>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end px-2">
            <span className="text-sm text-neutral-500 font-medium">
              {filteredOrders.length} {t('active_requests') || 'Active Requests'}
            </span>
            <div className="flex bg-neutral-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('kanban')}
                className={cn("p-1.5 rounded-md transition-all", viewMode === 'kanban' ? "bg-white shadow text-primary" : "text-neutral-500 hover:text-neutral-700")}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-white shadow text-primary" : "text-neutral-500 hover:text-neutral-700")}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
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
        <div className="flex-1 overflow-x-auto">
          <KanbanBoard
            orders={filteredOrders}
            customers={customers}
            vehicles={vehicles}
            technicians={technicians}
            onEdit={openEdit}
            getTechName={getTechName}
            onStatusChange={handleStatusChange}
            estimates={estimates}
            onArchive={handleArchiveOrder}
          />
        </div>
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
