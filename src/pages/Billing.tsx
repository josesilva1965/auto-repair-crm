// @ts-nocheck
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../contexts/SettingsContext';
import { supabase, type Invoice, type WorkOrder, type Customer } from '../lib/supabase';
import { DataTable, StatusBadge } from '../components/DataTable';
import { Modal, Button, Input, Select } from '../components/Modal';
import { Plus, Search, FileText, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { PricingEngine, type Discount } from '../lib/pricingEngine';

export function Billing() {
  const { t } = useTranslation();
  const { currency } = useSettings();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [form, setForm] = useState({
    work_order_id: '',
    due_date: '',
    status: 'pending',
    discountType: 'fixed' as 'fixed' | 'percentage',
    discountValue: '',
  });

  const pricingEngine = new PricingEngine();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [invoicesRes, ordersRes, customersRes] = await Promise.all([
      supabase.from('invoices').select('*').order('created_at', { ascending: false }),
      supabase.from('work_orders').select('*').eq('status', 'completed'),
      supabase.from('customers').select('*'),
    ]);
    setInvoices(invoicesRes.data || []);
    setWorkOrders(ordersRes.data || []);
    setCustomers(customersRes.data || []);
    setLoading(false);
  }

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    const workOrder = workOrders.find((o) => o.id === form.work_order_id);
    if (!workOrder) return;

    const discount: Discount | undefined = form.discountValue ? {
      type: form.discountType,
      value: parseFloat(form.discountValue)
    } : undefined;

    const { subtotal, taxAmount, discountAmount, total } = pricingEngine.calculateInvoice(
      workOrder.total_cost,
      discount
    );

    const payload = {
      invoice_number: `INV-${Date.now()}`,
      work_order_id: form.work_order_id,
      customer_id: workOrder.customer_id,
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      total,
      status: form.status,
      due_date: form.due_date || null,
    };

    await supabase.from('invoices').insert([payload]);
    setIsModalOpen(false);
    setForm({
      work_order_id: '',
      due_date: '',
      status: 'pending',
      discountType: 'fixed',
      discountValue: ''
    });
    loadData();
  }

  async function markAsPaid(invoice: Invoice) {
    await supabase.from('invoices').update({
      status: 'paid',
      paid_date: new Date().toISOString().split('T')[0]
    }).eq('id', invoice.id);
    loadData();
  }

  const filteredInvoices = invoices.filter((i) => {
    const matchSearch = i.invoice_number.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getCustomerName = (id: string) => customers.find((c) => c.id === id)?.name || '-';
  const getWorkOrderNumber = (id: string) => workOrders.find((o) => o.id === id)?.order_number || '-';

  // Available work orders (completed but no invoice yet)
  const invoicedOrderIds = new Set(invoices.map((i) => i.work_order_id));
  const availableOrders = workOrders.filter((o) => !invoicedOrderIds.has(o.id));

  // Summary stats
  const totalPending = invoices.filter((i) => i.status === 'pending').reduce((sum, i) => sum + (i.total ?? 0), 0);
  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + (i.total ?? 0), 0);
  const overdueCount = invoices.filter((i) => i.status === 'overdue' || (i.status === 'pending' && i.due_date && new Date(i.due_date) < new Date())).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[32px] font-bold text-neutral-900">{t('billing')}</h1>
          <p className="text-neutral-500">{t('invoices')}</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} disabled={availableOrders.length === 0}>
          <Plus className="w-4 h-4 mr-2 inline" />
          {t('create_invoice')}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-neutral-200 shadow-card p-6">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-amber-500" />
            <div>
              <p className="text-sm text-neutral-500">{t('pending')}</p>
              <p className="text-2xl font-bold text-neutral-900">{currency}{totalPending.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 shadow-card p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
            <div>
              <p className="text-sm text-neutral-500">{t('paid')}</p>
              <p className="text-2xl font-bold text-neutral-900">{currency}{totalPaid.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 shadow-card p-6">
          <div className="flex items-center gap-3">
            <FileText className={`w-8 h-8 ${overdueCount > 0 ? 'text-red-500' : 'text-neutral-400'}`} />
            <div>
              <p className="text-sm text-neutral-500">{t('overdue')}</p>
              <p className="text-2xl font-bold text-neutral-900">{overdueCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder={t('search_invoices')}
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
          <option value="pending">{t('pending')}</option>
          <option value="paid">{t('paid')}</option>
          <option value="overdue">{t('overdue')}</option>
        </select>
      </div>

      <DataTable
        data={filteredInvoices}
        loading={loading}
        onRowClick={setSelectedInvoice}
        columns={[
          { key: 'invoice_number', header: t('invoice_number'), render: (i) => <span className="font-mono font-medium">{i.invoice_number}</span> },
          { key: 'customer_id', header: t('customer'), render: (i) => getCustomerName(i.customer_id) },
          { key: 'work_order_id', header: t('work_orders'), render: (i) => getWorkOrderNumber(i.work_order_id) },
          { key: 'subtotal', header: t('subtotal'), render: (i) => `${currency}${(i.subtotal ?? 0).toFixed(2)}` },
          { key: 'tax', header: t('tax'), render: (i) => `${currency}${(i.tax ?? 0).toFixed(2)}` },
          { key: 'total', header: t('total'), render: (i) => <span className="font-semibold">{currency}{(i.total ?? 0).toFixed(2)}</span> },
          { key: 'status', header: t('status'), render: (i) => <StatusBadge status={i.status} /> },
          { key: 'due_date', header: t('due_date'), render: (i) => i.due_date || '-' },
          {
            key: 'actions',
            header: '',
            render: (i) => i.status === 'pending' && (
              <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); markAsPaid(i); }}>
                {t('mark_paid')}
              </Button>
            ),
          },
        ]}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Invoice">
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <Select
            label="Work Order"
            value={form.work_order_id}
            onChange={(e) => setForm({ ...form, work_order_id: e.target.value })}
            options={[
              { value: '', label: 'Select completed work order...' },
              ...availableOrders.map((o) => ({
                value: o.id,
                label: `${o.order_number} - ${currency}${(o.actual_cost || o.estimated_cost || 0).toFixed(2)}`,
              })),
            ]}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Discount Type"
              value={form.discountType}
              onChange={(e) => setForm({ ...form, discountType: e.target.value as 'fixed' | 'percentage' })}
              options={[
                { value: 'fixed', label: 'Fixed Amount ($)' },
                { value: 'percentage', label: 'Percentage (%)' },
              ]}
            />
            <Input
              label="Discount Value"
              type="number"
              min="0"
              step={form.discountType === 'fixed' ? '0.01' : '1'}
              value={form.discountValue}
              onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
              placeholder={form.discountType === 'fixed' ? 'ex: 50.00' : 'ex: 10'}
            />
          </div>

          {form.work_order_id && (
            <div className="p-4 bg-neutral-50 rounded-lg">
              <p className="text-sm text-neutral-500 font-medium mb-2">Invoice Preview</p>
              {(() => {
                const wo = workOrders.find((o) => o.id === form.work_order_id);
                if (!wo) return null;

                const workOrderCost = wo.actual_cost || wo.estimated_cost || 0;

                const discount: Discount | undefined = form.discountValue ? {
                  type: form.discountType,
                  value: parseFloat(form.discountValue)
                } : undefined;

                const details = pricingEngine.calculateInvoice(workOrderCost, discount);

                return (
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{currency}{details.subtotal.toFixed(2)}</span>
                    </div>
                    {details.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount:</span>
                        <span>-{currency}{details.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-neutral-600">
                      <span>Tax ({(details.taxRate * 100).toFixed(0)}%):</span>
                      <span>{currency}{details.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-neutral-200 pt-2 mt-2">
                      <span>Total:</span>
                      <span>{currency}{details.total.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <Input
            label="Due Date"
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>{t('cancel')}</Button>
            <Button type="submit">{t('create_invoice')}</Button>
          </div>
        </form>
      </Modal>

      {selectedInvoice && (
        <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title="Invoice Details" size="lg">
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold">{selectedInvoice.invoice_number}</h3>
                <p className="text-neutral-500">Created {new Date(selectedInvoice.created_at).toLocaleDateString()}</p>
              </div>
              <StatusBadge status={selectedInvoice.status} />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-neutral-500">Customer</p>
                <p className="font-medium">{getCustomerName(selectedInvoice.customer_id)}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Work Order</p>
                <p className="font-medium">{getWorkOrderNumber(selectedInvoice.work_order_id)}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Due Date</p>
                <p className="font-medium">{selectedInvoice.due_date || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Paid Date</p>
                <p className="font-medium">{selectedInvoice.paid_date || '-'}</p>
              </div>
            </div>
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Subtotal</span>
                  <span>{currency}{(selectedInvoice.subtotal ?? 0).toFixed(2)}</span>
                </div>
                {(selectedInvoice.discount ?? 0) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-{currency}{(selectedInvoice.discount ?? 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-600">Tax</span>
                  <span>{currency}{(selectedInvoice.tax ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>{currency}{(selectedInvoice.total ?? 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
            {selectedInvoice.status === 'pending' && (
              <div className="flex justify-end">
                <Button onClick={() => { markAsPaid(selectedInvoice); setSelectedInvoice(null); }}>
                  <DollarSign className="w-4 h-4 mr-2 inline" />
                  Mark as Paid
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
