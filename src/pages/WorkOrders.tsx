import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../contexts/SettingsContext';
import { supabase, type WorkOrder, type Customer, type Vehicle, type Technician } from '../lib/supabase';
import { DataTable, StatusBadge } from '../components/DataTable';
import { Modal, Button, Input, Select, Textarea } from '../components/Modal';
import { Plus, Search, Filter } from 'lucide-react';
import { maximizeTechAssignment } from '../lib/assignmentOptimizer';
import { DndContext, DragEndEvent, useDraggable, useDroppable, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'pending' },
  { value: 'in-progress', label: 'in_progress' },
  { value: 'completed', label: 'completed' },
  { value: 'cancelled', label: 'cancelled' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'low' },
  { value: 'normal', label: 'medium' },
  { value: 'high', label: 'high' },
  { value: 'urgent', label: 'high' },
];

export function WorkOrders() {
  const { t } = useTranslation();
  const { currency } = useSettings();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');

  const [form, setForm] = useState({
    customer_id: '',
    vehicle_id: '',
    technician_id: '',
    status: 'pending',
    priority: 'normal',
    description: '',
    scheduled_date: '',
    estimated_cost: '',
    actual_cost: '',
  });

  // Calculate suggested technicians when form changes or modal opens
  const suggestedTechs = maximizeTechAssignment(
    technicians,
    { description: form.description },
    workOrders
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [ordersRes, customersRes, vehiclesRes, techniciansRes] = await Promise.all([
      supabase.from('work_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('customers').select('*'),
      supabase.from('vehicles').select('*'),
      supabase.from('technicians').select('*'),
    ]);
    setWorkOrders(ordersRes.data || []);
    setCustomers(customersRes.data || []);
    setVehicles(vehiclesRes.data || []);
    setTechnicians(techniciansRes.data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      customer_id: form.customer_id,
      vehicle_id: form.vehicle_id,
      technician_id: form.technician_id || null,
      status: form.status,
      priority: form.priority,
      description: form.description,
      scheduled_date: form.scheduled_date || null,
      estimated_cost: parseFloat(form.estimated_cost) || 0,
      actual_cost: parseFloat(form.actual_cost) || 0,
    };

    if (editingOrder) {
      await supabase.from('work_orders').update(payload).eq('id', editingOrder.id);
    } else {
      await supabase.from('work_orders').insert([payload]);
    }
    setIsModalOpen(false);
    setEditingOrder(null);
    resetForm();
    loadData();
  }

  function resetForm() {
    setForm({
      customer_id: '',
      vehicle_id: '',
      technician_id: '',
      status: 'pending',
      priority: 'normal',
      description: '',
      scheduled_date: '',
      estimated_cost: '',
      actual_cost: '',
    });
  }

  function openEdit(order: WorkOrder) {
    setEditingOrder(order);
    setForm({
      customer_id: order.customer_id,
      vehicle_id: order.vehicle_id,
      technician_id: order.technician_id || '',
      status: order.status,
      priority: order.priority,
      description: order.description || '',
      scheduled_date: order.scheduled_date ? order.scheduled_date.split('T')[0] : '',
      estimated_cost: (order.estimated_cost || 0).toString(),
      actual_cost: (order.actual_cost || 0).toString(),
    });
    setIsModalOpen(true);
  }

  const filteredOrders = workOrders.filter((o) => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const customerVehicles = vehicles.filter((v) => v.customer_id === form.customer_id);

  const getCustomerName = (id: string) => customers.find((c) => c.id === id)?.name || '-';
  const getVehicleInfo = (id: string) => {
    const v = vehicles.find((v) => v.id === id);
    return v ? `${v.year} ${v.make} ${v.model}` : '-';
  };
  const getTechName = (id: string | null) => technicians.find((t) => t.id === id)?.name || 'Unassigned';

  async function handleStatusChange(orderId: string, newStatus: string) {
    // Optimistic update
    setWorkOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

    const { error } = await supabase.from('work_orders').update({ status: newStatus }).eq('id', orderId);
    if (error) {
      console.error('Error updating status:', error);
      loadData(); // Revert
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[32px] font-bold text-neutral-900">{t('work_orders')}</h1>
          <p className="text-neutral-500">{t('description')}</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingOrder(null); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2 inline" />
          {t('new_work_order')}
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-neutral-200 rounded-lg bg-white"
        >
          <option value="all">{t('all')}</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{t(s.label)}</option>
          ))}
        </select>
        <div className="flex border border-neutral-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 text-sm ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-white'}`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-4 py-2 text-sm ${viewMode === 'kanban' ? 'bg-primary-500 text-white' : 'bg-white'}`}
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
        />
      ) : (
        <KanbanBoard orders={filteredOrders} onEdit={openEdit} getTechName={getTechName} onStatusChange={handleStatusChange} />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingOrder(null); }}
        title={editingOrder ? 'Edit Work Order' : 'New Work Order'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Customer"
              value={form.customer_id}
              onChange={(e) => setForm({ ...form, customer_id: e.target.value, vehicle_id: '' })}
              options={[{ value: '', label: 'Select customer...' }, ...customers.map((c) => ({ value: c.id, label: c.name }))]}
              required
            />
            <Select
              label="Vehicle"
              value={form.vehicle_id}
              onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
              options={[{ value: '', label: 'Select vehicle...' }, ...customerVehicles.map((v) => ({ value: v.id, label: `${v.year} ${v.make} ${v.model}` }))]}
              required
            />
          </div>

          <div className="space-y-2">
            <Select
              label="Technician"
              value={form.technician_id}
              onChange={(e) => setForm({ ...form, technician_id: e.target.value })}
              options={[
                { value: '', label: 'Unassigned' },
                ...technicians.map((t) => ({ value: t.id, label: t.name }))
              ]}
            />

            {/* AI Suggestion Area */}
            {form.description && (
              <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg border border-primary-100 dark:border-primary-800">
                <p className="text-xs font-semibold text-primary-700 dark:text-primary-300 mb-2 uppercase tracking-wide">
                  AI Suggested Assignment
                </p>
                <div className="space-y-2">
                  {suggestedTechs.slice(0, 2).map(tech => (
                    <div
                      key={tech.id}
                      onClick={() => setForm({ ...form, technician_id: tech.id })}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${form.technician_id === tech.id
                        ? 'bg-primary-100 dark:bg-primary-800 border border-primary-300 dark:border-primary-600'
                        : 'bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                        }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-neutral-900 dark:text-white">{tech.name}</span>
                          <span className="px-1.5 py-0.5 text-[10px] bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-full">
                            {tech.score} match
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{tech.matchReason}</p>
                      </div>
                      {form.technician_id === tech.id && (
                        <span className="text-primary-600 dark:text-primary-400 text-xs font-medium">Selected</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Scheduled Date"
              type="date"
              value={form.scheduled_date}
              onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={STATUS_OPTIONS} />
              <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} options={PRIORITY_OPTIONS} />
            </div>
          </div>
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Describe the issue (e.g., 'Brake noise', 'Oil change')"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Estimated Cost ($)" type="number" step="0.01" value={form.estimated_cost} onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })} />
            <Input label="Actual Cost ($)" type="number" step="0.01" value={form.actual_cost} onChange={(e) => setForm({ ...form, actual_cost: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>{t('cancel')}</Button>
            <Button type="submit">{editingOrder ? t('edit') : t('add')} {t('work_orders')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function KanbanBoard({ orders, onEdit, getTechName, onStatusChange }: { orders: WorkOrder[]; onEdit: (o: WorkOrder) => void; getTechName: (id: string | null) => string, onStatusChange: (id: string, status: string) => void }) {
  const { t } = useTranslation();
  const columns = [
    { status: 'pending', titleKey: 'pending', color: 'bg-amber-500' },
    { status: 'in-progress', titleKey: 'in_progress', color: 'bg-blue-500' },
    { status: 'completed', titleKey: 'completed', color: 'bg-emerald-500' },
    { status: 'cancelled', titleKey: 'cancelled', color: 'bg-red-500' },
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // active.id is order id, over.id is column status
      onStatusChange(active.id as string, over.id as string);
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-12rem)]">
        {columns.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            title={t(col.titleKey)}
            color={col.color}
            count={orders.filter(o => o.status === col.status).length}
          >
            <div className="space-y-3">
              {orders.filter((o) => o.status === col.status).map((order) => (
                <DraggableCard
                  key={order.id}
                  order={order}
                  onEdit={onEdit}
                  getTechName={getTechName}
                />
              ))}
            </div>
          </KanbanColumn>
        ))}
      </div>
    </DndContext>
  );
}

function KanbanColumn({ status, title, color, count, children }: any) {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  return (
    <div ref={setNodeRef} className="flex-shrink-0 w-80 flex flex-col h-full bg-neutral-50/50 rounded-xl p-2">
      <div className="flex items-center gap-2 mb-3 px-2">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <h3 className="font-semibold text-neutral-900">{title}</h3>
        <span className="text-sm text-neutral-500">({count})</span>
      </div>
      <div className="flex-1 overflow-y-auto px-2">
        {children}
      </div>
    </div>
  );
}

function DraggableCard({ order, onEdit, getTechName }: { order: WorkOrder; onEdit: (o: WorkOrder) => void; getTechName: (id: string | null) => string }) {
  const { t } = useTranslation();
  const { currency } = useSettings();
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: order.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onEdit(order)}
      className="bg-white p-4 rounded-lg border border-neutral-200 shadow-card cursor-grab active:cursor-grabbing hover:shadow-md transition-all touch-none"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-neutral-900">#{order.id.substring(0, 8)}</span>
        <span className={`text-xs px-2 py-0.5 rounded ${order.priority === 'urgent' ? 'bg-red-100 text-red-700' : order.priority === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-600'}`}>
          {t(order.priority)}
        </span>
      </div>
      <p className="text-sm text-neutral-600 line-clamp-2 mb-3">{order.description || t('no_description')}</p>
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>{getTechName(order.technician_id)}</span>
        <span>{currency}{(order.actual_cost || order.estimated_cost || 0).toFixed(0)}</span>
      </div>
    </div>
  );
}
