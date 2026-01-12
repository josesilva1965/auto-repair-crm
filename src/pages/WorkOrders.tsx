import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../contexts/SettingsContext';
import { supabase, type WorkOrder, type Customer, type Vehicle, type Technician, type Estimate } from '../lib/supabase';
import { DataTable, StatusBadge } from '../components/DataTable';
import { Modal, Button, Input, Select, Textarea } from '../components/Modal';
import { Plus, Search, Filter, DollarSign, Trash2, Clock, FileText, Send, Mail, MessageSquare, Printer, Check, AlertCircle } from 'lucide-react';
import { maximizeTechAssignment } from '../lib/assignmentOptimizer';
import { DndContext, DragEndEvent, useDraggable, useDroppable, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import { PricingEngine } from '../lib/pricingEngine';
import { communicationService } from '../lib/communicationService';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'pending' },
  { value: 'testing', label: 'testing' },
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
  const navigate = useNavigate();
  const pricingEngine = new PricingEngine();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');

  // Estimate modal state
  const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);
  const [estimateNotes, setEstimateNotes] = useState('');
  const [sendingEstimate, setSendingEstimate] = useState(false);

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
    const [ordersRes, customersRes, vehiclesRes, techniciansRes, estimatesRes] = await Promise.all([
      supabase.from('work_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('customers').select('*'),
      supabase.from('vehicles').select('*'),
      supabase.from('technicians').select('*'),
      supabase.from('estimates').select('*'),
    ]);
    setWorkOrders(ordersRes.data || []);
    setCustomers(customersRes.data || []);
    setVehicles(vehiclesRes.data || []);
    setTechnicians(techniciansRes.data || []);
    setEstimates(estimatesRes.data || []);
    setLoading(false);
  }

  // Get estimate for a work order
  function getEstimateForOrder(orderId: string): Estimate | undefined {
    return estimates.find(e => e.work_order_id === orderId);
  }

  // Itemized Billing State
  const [lineItems, setLineItems] = useState<{ description: string; quantity: number; unit_price: number; item_type: 'part' | 'labor' | 'other' }[]>([]);
  const [newItem, setNewItem] = useState({ description: '', quantity: 1, unit_price: 0, item_type: 'part' as 'part' | 'labor' | 'other' });

  function addItem() {
    if (!newItem.description) return;
    setLineItems([...lineItems, { ...newItem }]);
    setNewItem({ description: '', quantity: 1, unit_price: 0, item_type: 'part' });
  }

  function removeItem(index: number) {
    setLineItems(lineItems.filter((_, i) => i !== index));
  }

  // Calculate totals from line items
  const calculatedTotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

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
      estimated_cost: lineItems.length > 0 ? calculatedTotal : (parseFloat(form.estimated_cost) || 0),
      actual_cost: lineItems.length > 0 ? calculatedTotal : (parseFloat(form.actual_cost) || 0),
    };

    let orderId = editingOrder?.id;

    if (editingOrder) {
      await supabase.from('work_orders').update(payload).eq('id', editingOrder.id);
    } else {
      const { data } = await supabase.from('work_orders').insert([payload]).select().single();
      if (data) orderId = data.id;
    }

    // Save line items
    if (orderId) {
      // First delete existing items to replace with current state (simple sync)
      await supabase.from('work_order_items').delete().eq('work_order_id', orderId);

      if (lineItems.length > 0) {
        await supabase.from('work_order_items').insert(
          lineItems.map(item => ({
            work_order_id: orderId,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            item_type: item.item_type
          }))
        );
      }
    }

    setIsModalOpen(false);
    setEditingOrder(null);
    resetForm();
    loadData();
  }

  // Log Hours Helper
  const [logHoursAmount, setLogHoursAmount] = useState(1); // State for input

  function logHours(hours: number) {
    const techId = form.technician_id;
    const tech = technicians.find(t => t.id === techId);

    // Default rate if no tech or tech has 0 rate (fallback to 50)
    const rate = tech?.hourly_rate || 0;
    const effectiveRate = rate > 0 ? rate : 50;
    const description = `Labor - ${tech ? tech.name : 'Unknown Tech'}`;

    // Check if item exists
    const existingIndex = lineItems.findIndex(i => i.description === description && i.item_type === 'labor' && i.unit_price === effectiveRate);

    if (existingIndex >= 0) {
      // Update existing
      const updated = [...lineItems];
      updated[existingIndex].quantity += hours;
      setLineItems(updated);
    } else {
      // Add new
      setLineItems([
        ...lineItems,
        {
          description,
          quantity: hours,
          unit_price: effectiveRate,
          item_type: 'labor'
        }
      ]);
    }
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
    setLineItems([]);
  }

  async function openEdit(order: WorkOrder) {
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

    // Fetch items
    const { data: items } = await supabase.from('work_order_items').select('*').eq('work_order_id', order.id);
    if (items) {
      setLineItems(items.map(i => ({
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
        item_type: i.item_type as 'part' | 'labor' | 'other'
      })));
    } else {
      setLineItems([]);
    }

    setIsModalOpen(true);
  }

  const filteredOrders = workOrders.filter((o) => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const notArchived = o.status !== 'archived';
    return matchSearch && matchStatus && notArchived;
  });

  const customerVehicles = vehicles.filter((v) => v.customer_id === form.customer_id);

  const getCustomerName = (id: string) => customers.find((c) => c.id === id)?.name || '-';
  const getVehicleInfo = (id: string) => {
    const v = vehicles.find((v) => v.id === id);
    return v ? `${v.year} ${v.make} ${v.model}` : '-';
  };
  const getTechName = (id: string | null) => technicians.find((t) => t.id === id)?.name || 'Unassigned';

  // Create estimate from current work order
  async function createEstimate(channel: 'email' | 'sms' | 'print') {
    if (!editingOrder) return;

    setSendingEstimate(true);

    // First save the work order with current line items
    await handleSubmit(new Event('submit') as any);

    // Get customer VAT rate and discount
    const customer = customers.find(c => c.id === editingOrder.customer_id);
    const vatRate = (customer?.vat_rate || 20) / 100; // Convert percentage to decimal
    const discountPercent = customer?.default_discount || 0;

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const discount = discountPercent > 0 ? { type: 'percentage' as const, value: discountPercent } : undefined;
    const { taxAmount, total, discountAmount } = pricingEngine.calculateInvoice(subtotal, discount, vatRate);

    // Create estimate record
    const { data: newEstimate, error } = await supabase.from('estimates').insert([{
      estimate_number: `EST-${Date.now()}`,
      work_order_id: editingOrder.id,
      customer_id: editingOrder.customer_id,
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      total,
      status: 'draft',
      sent_via: 'none',
      notes: estimateNotes
    }]).select().single();

    if (error) {
      console.error('Error creating estimate:', error);
      alert('Failed to create estimate');
      setSendingEstimate(false);
      return;
    }

    // Send via chosen channel
    const result = await communicationService.sendDocument({
      type: 'estimate',
      documentId: newEstimate.id,
      customerId: editingOrder.customer_id,
      channel
    });

    if (result.success) {
      // Update estimate status
      await supabase.from('estimates').update({
        status: 'sent',
        sent_via: channel,
        sent_at: new Date().toISOString()
      }).eq('id', newEstimate.id);

      // Create notification
      const customer = customers.find(c => c.id === editingOrder.customer_id);
      await communicationService.createNotification(
        'estimate_sent',
        'Estimate Sent',
        `Estimate ${newEstimate.estimate_number} sent to ${customer?.name} via ${channel}`,
        editingOrder.id,
        editingOrder.customer_id
      );

      alert(result.message);
    } else {
      alert(result.message);
    }

    setSendingEstimate(false);
    setIsEstimateModalOpen(false);
    setEstimateNotes('');
    loadData();
  }

  // Auto-create invoice when job is completed
  async function autoCreateInvoice(order: WorkOrder) {
    // Check if invoice already exists
    const { data: existing } = await supabase
      .from('invoices')
      .select('id')
      .eq('work_order_id', order.id)
      .single();

    if (existing) {
      return; // Invoice already exists
    }

    // Get customer VAT rate and discount
    const customer = customers.find(c => c.id === order.customer_id);
    const vatRate = (customer?.vat_rate || 20) / 100; // Convert percentage to decimal
    const discountPercent = customer?.default_discount || 0;

    // Get line items for this work order
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
      const customer = customers.find(c => c.id === order.customer_id);
      await communicationService.createNotification(
        'invoice_paid', // Using this type for invoice creation notification
        'Invoice Created',
        `Invoice ${newInvoice.invoice_number} created for ${customer?.name} - ${currency}${total.toFixed(2)}`,
        order.id,
        order.customer_id
      );

      // Archive the work order to "delete" it from view as requested
      await supabase.from('work_orders').update({ status: 'archived' }).eq('id', order.id);

      // Navigate to billing with the new invoice
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

    // Auto-create invoice and service history when completed
    if (newStatus === 'completed' && order) {
      // Create service history record
      const vehicle = vehicles.find(v => v.id === order.vehicle_id);
      console.log('Creating service history for order:', order.id);
      console.log('Vehicle found:', vehicle);

      if (vehicle) {
        // Determine service type from description or default to "Service"
        const serviceType = order.description?.toLowerCase().includes('oil') ? 'Oil Change' :
          order.description?.toLowerCase().includes('brake') ? 'Brake Service' :
            order.description?.toLowerCase().includes('tire') ? 'Tire Service' :
              order.description?.toLowerCase().includes('inspection') ? 'Inspection' :
                'General Service';

        // Fetch items for detailed history
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
          const totalParts = woItems.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
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

        console.log('Inserting service history:', serviceHistoryData);

        const { data: serviceHistoryResult, error: serviceHistoryError } = await supabase
          .from('service_history')
          .insert([serviceHistoryData])
          .select();

        if (serviceHistoryError) {
          console.error('Error creating service history:', serviceHistoryError);
          alert(`Failed to save service history: ${serviceHistoryError.message}`);
        } else {
          console.log('Service history created successfully:', serviceHistoryResult);
        }
      } else {
        console.warn('Vehicle not found for work order:', order.vehicle_id);
      }

      await autoCreateInvoice(order);
    }

    loadData();
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
        <KanbanBoard orders={filteredOrders} onEdit={openEdit} getTechName={getTechName} onStatusChange={handleStatusChange} estimates={estimates} />
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
            label="Technician Notes / Diagnosis"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Describe the issue, work done, or diagnosis (e.g., 'Brake noise fixed, road test passed')"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Estimated Cost ($)"
              type="number"
              step="0.01"
              value={lineItems.length > 0 ? calculatedTotal.toFixed(2) : form.estimated_cost}
              onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })}
              readOnly={lineItems.length > 0}
              className={lineItems.length > 0 ? "bg-neutral-100" : ""}
            />
            <Input
              label="Actual Cost ($)"
              type="number"
              step="0.01"
              value={lineItems.length > 0 ? calculatedTotal.toFixed(2) : form.actual_cost}
              onChange={(e) => setForm({ ...form, actual_cost: e.target.value })}
              readOnly={lineItems.length > 0}
              className={lineItems.length > 0 ? "bg-neutral-100" : ""}
            />
          </div>

          {/* Line Items Section */}
          <div className="border-t border-neutral-200 pt-4">
            <h3 className="font-semibold text-sm text-neutral-900 mb-3">Line Items (Parts & Labor)</h3>

            <div className="space-y-2 mb-4">
              {lineItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-neutral-50 p-2 rounded text-sm">
                  <div className="flex-1 font-medium">{item.description}</div>
                  <div className="w-20 text-neutral-500 capitalize">{item.item_type}</div>
                  <div className="w-16 text-right">{item.quantity} x</div>
                  <div className="w-24 text-right">{currency}{item.unit_price.toFixed(2)}</div>
                  <div className="w-24 text-right font-semibold">{currency}{(item.quantity * item.unit_price).toFixed(2)}</div>
                  <Button type="button" size="sm" variant="secondary" onClick={() => removeItem(idx)} className="ml-2 text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {lineItems.length > 0 && (
                <div className="flex justify-end gap-4 text-sm font-bold pt-2 border-t border-neutral-200">
                  <span>Total:</span>
                  <span>{currency}{calculatedTotal.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Quick Actions for Tech */}
            <div className="flex gap-2 mb-4 bg-primary-50 p-2 rounded-lg items-center border border-primary-100">
              <Clock className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-800">Log Hours:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  className="w-16 h-8 text-sm border rounded px-1"
                  value={logHoursAmount}
                  onChange={e => setLogHoursAmount(parseFloat(e.target.value) || 0)}
                />
                <Button type="button" size="sm" variant="secondary" onClick={() => logHours(logHoursAmount)}>Add</Button>
              </div>
              <span className="text-neutral-300 mx-1">|</span>
              <Button type="button" size="sm" variant="secondary" onClick={() => logHours(1)}>+1h</Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => logHours(0.5)}>+0.5h</Button>
            </div>

            <div className="grid grid-cols-12 gap-2 items-end bg-neutral-50 p-3 rounded-lg border border-neutral-200">
              <div className="col-span-5">
                <Input
                  label="Description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Item name..."
                />
              </div>
              <div className="col-span-2">
                <Select
                  label="Type"
                  value={newItem.item_type}
                  onChange={(e) => setNewItem({ ...newItem, item_type: e.target.value as any })}
                  options={[
                    { value: 'part', label: 'Part' },
                    { value: 'labor', label: 'Labor' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
              </div>
              <div className="col-span-2">
                <Input
                  label="Qty"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={newItem.quantity.toString()}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="col-span-2">
                <Input
                  label="Price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.unit_price.toString()}
                  onChange={(e) => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="col-span-1">
                <Button type="button" onClick={addItem} disabled={!newItem.description}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Create Estimate Section - Show when status is testing and there are line items */}
          {editingOrder && (form.status === 'testing' || form.status === 'in-progress') && lineItems.length > 0 && (
            <div className="border-t border-neutral-200 pt-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-900">{t('create_estimate') || 'Create Estimate'}</p>
                      <p className="text-sm text-amber-700">{t('send_estimate_to_customer') || 'Send an estimate to the customer for approval'}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setIsEstimateModalOpen(true)}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {t('create_estimate') || 'Create Estimate'}
                  </Button>
                </div>

                {/* Show existing estimate status if any */}
                {(() => {
                  const existingEstimate = getEstimateForOrder(editingOrder.id);
                  if (existingEstimate) {
                    return (
                      <div className="mt-3 pt-3 border-t border-amber-200">
                        <div className="flex items-center gap-2 text-sm">
                          {existingEstimate.status === 'sent' && (
                            <>
                              <AlertCircle className="w-4 h-4 text-amber-600" />
                              <span className="text-amber-800">{t('estimate_awaiting_approval') || 'Estimate sent - awaiting customer approval'}</span>
                            </>
                          )}
                          {existingEstimate.status === 'approved' && (
                            <>
                              <Check className="w-4 h-4 text-emerald-600" />
                              <span className="text-emerald-800">{t('estimate_approved') || 'Customer has approved the estimate'}</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>{t('cancel')}</Button>
            <Button type="submit">{editingOrder ? t('edit') : t('add')} {t('work_orders')}</Button>
          </div>
        </form>
      </Modal>

      {/* Estimate Creation Modal */}
      <Modal
        isOpen={isEstimateModalOpen}
        onClose={() => { setIsEstimateModalOpen(false); setEstimateNotes(''); }}
        title={t('send_estimate') || 'Send Estimate to Customer'}
      >
        <div className="space-y-4">
          {/* Estimate Preview */}
          <div className="bg-neutral-50 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-neutral-900 mb-3 border-b pb-2">{t('estimate_preview') || 'Estimate Preview'}</h4>

            <div className="space-y-2 mb-4">
              {lineItems.map((item, idx) => (
                <div key={idx} className="flex text-sm">
                  <div className="flex-1 font-medium">{item.description}</div>
                  <div className="w-16 text-right text-neutral-500">{item.quantity} x</div>
                  <div className="w-20 text-right text-neutral-500">{currency}{item.unit_price.toFixed(2)}</div>
                  <div className="w-20 text-right font-medium">{currency}{(item.quantity * item.unit_price).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="space-y-1 border-t pt-3">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">{t('subtotal') || 'Subtotal'}</span>
                <span>{currency}{calculatedTotal.toFixed(2)}</span>
              </div>
              {editingOrder && customers.find(c => c.id === editingOrder.customer_id)?.default_discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount ({customers.find(c => c.id === editingOrder.customer_id)?.default_discount}%)</span>
                  <span>-{currency}{(calculatedTotal * ((customers.find(c => c.id === editingOrder.customer_id)?.default_discount || 0) / 100)).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">{t('tax') || 'Tax'} ({editingOrder ? (customers.find(c => c.id === editingOrder.customer_id)?.vat_rate || 20) : 20}%)</span>
                <span>{currency}{((calculatedTotal - (calculatedTotal * ((editingOrder ? (customers.find(c => c.id === editingOrder.customer_id)?.default_discount || 0) : 0) / 100))) * ((editingOrder ? (customers.find(c => c.id === editingOrder.customer_id)?.vat_rate || 20) : 20) / 100)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                <span>{t('total') || 'Total'}</span>
                <span>{currency}{(() => {
                  const discountedSubtotal = calculatedTotal - (calculatedTotal * ((editingOrder ? (customers.find(c => c.id === editingOrder.customer_id)?.default_discount || 0) : 0) / 100));
                  const tax = discountedSubtotal * ((editingOrder ? (customers.find(c => c.id === editingOrder.customer_id)?.vat_rate || 20) : 20) / 100);
                  return (discountedSubtotal + tax).toFixed(2);
                })()}</span>
              </div>
            </div>
          </div>

          {/* Notes to Customer */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{t('notes_to_customer') || 'Notes to Customer'}</label>
            <Textarea
              value={estimateNotes}
              onChange={(e) => setEstimateNotes(e.target.value)}
              rows={3}
              placeholder={t('estimate_notes_placeholder') || 'Add any notes or context for the customer...'}
            />
          </div>

          {/* Send Options */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-neutral-700 mb-3">{t('send_via') || 'Send via:'}</p>
            <div className="flex gap-3">
              <Button
                onClick={() => createEstimate('email')}
                disabled={sendingEstimate}
                className="flex-1"
              >
                <Mail className="w-4 h-4 mr-2" />
                {t('email') || 'Email'}
              </Button>
              <Button
                onClick={() => createEstimate('sms')}
                disabled={sendingEstimate}
                variant="secondary"
                className="flex-1"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                {t('sms') || 'SMS'}
              </Button>
              <Button
                onClick={() => createEstimate('print')}
                disabled={sendingEstimate}
                variant="secondary"
                className="flex-1"
              >
                <Printer className="w-4 h-4 mr-2" />
                {t('print') || 'Print'}
              </Button>
            </div>
          </div>

          {sendingEstimate && (
            <div className="text-center text-sm text-neutral-500 animate-pulse">
              {t('sending') || 'Sending...'}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function KanbanBoard({ orders, onEdit, getTechName, onStatusChange, estimates }: { orders: WorkOrder[]; onEdit: (o: WorkOrder) => void; getTechName: (id: string | null) => string, onStatusChange: (id: string, status: string) => void, estimates: Estimate[] }) {
  const { t } = useTranslation();
  const columns = [
    { status: 'pending', titleKey: 'pending', color: 'bg-amber-500' },
    { status: 'testing', titleKey: 'testing', color: 'bg-purple-500' },
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

  // Helper to get estimate for order
  const getEstimate = (orderId: string) => estimates.find(e => e.work_order_id === orderId);

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
                  estimate={getEstimate(order.id)}
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

function DraggableCard({ order, onEdit, getTechName, estimate }: { order: WorkOrder; onEdit: (o: WorkOrder) => void; getTechName: (id: string | null) => string; estimate?: Estimate }) {
  const { t } = useTranslation();
  const { currency } = useSettings();
  const navigate = useNavigate();
  const pricingEngine = new PricingEngine();

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: order.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  async function handleCreateInvoice(e: React.MouseEvent) {
    e.stopPropagation();

    // Check if invoice already exists
    const { data: existing } = await supabase
      .from('invoices')
      .select('id')
      .eq('work_order_id', order.id)
      .single();

    if (existing) {
      navigate('/billing');
      return;
    }

    const { subtotal, taxAmount, total } = pricingEngine.calculateInvoice(
      order.actual_cost || order.estimated_cost || 0
    );

    const { data: newInvoice, error } = await supabase.from('invoices').insert([{
      invoice_number: `INV-${Date.now()}`,
      work_order_id: order.id,
      customer_id: order.customer_id,
      subtotal,
      tax: taxAmount,
      discount: 0,
      total,
      status: 'pending',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }]).select().single();

    if (!error && newInvoice) {
      // Archive the work order to "delete" it from view
      await supabase.from('work_orders').update({ status: 'archived' }).eq('id', order.id);

      navigate(`/billing?invoiceId=${newInvoice.id}`);
    }
  }

  // Get estimate status badge
  function getEstimateBadge() {
    if (!estimate) return null;

    switch (estimate.status) {
      case 'sent':
        return (
          <div className="flex items-center gap-1 text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
            <Clock className="w-3 h-3" />
            <span>{t('awaiting_approval') || 'Awaiting Approval'}</span>
          </div>
        );
      case 'approved':
        return (
          <div className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
            <Check className="w-3 h-3" />
            <span>{t('approved') || 'Approved'}</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-1 text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
            <AlertCircle className="w-3 h-3" />
            <span>{t('rejected') || 'Rejected'}</span>
          </div>
        );
      default:
        return null;
    }
  }

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
      <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
        <span>{getTechName(order.technician_id)}</span>
        <span>{currency}{(order.actual_cost || order.estimated_cost || 0).toFixed(0)}</span>
      </div>

      {/* Estimate Status Badge */}
      {getEstimateBadge() && (
        <div className="mb-2">
          {getEstimateBadge()}
        </div>
      )}

      {order.status === 'completed' && (
        <Button
          size="sm"
          className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          onClick={handleCreateInvoice}
        >
          <DollarSign className="w-3 h-3 mr-1.5" />
          {t('create_invoice')}
        </Button>
      )}
    </div>
  );
}
