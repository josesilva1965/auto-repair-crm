// @ts-nocheck
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../contexts/SettingsContext';
import { supabase, type Customer, type Vehicle, type WorkOrder } from '../lib/supabase';
import { DataTable } from '../components/DataTable';
import { Modal, Button, Input, Textarea } from '../components/Modal';
import { Plus, Search, Phone, Mail, MapPin } from 'lucide-react';

export function Customers() {
  const { t } = useTranslation();
  const { currency, emailSettings } = useSettings();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    vat_rate: '20',
    default_discount: '0',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [customersRes, vehiclesRes, ordersRes] = await Promise.all([
      supabase.from('customers').select('*').order('name'),
      supabase.from('vehicles').select('*'),
      supabase.from('work_orders').select('*'),
    ]);
    setCustomers(customersRes.data || []);
    setVehicles(vehiclesRes.data || []);
    setWorkOrders(ordersRes.data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      vat_rate: parseFloat(form.vat_rate) || 20,
      default_discount: parseFloat(form.default_discount) || 0,
    };
    if (editingCustomer) {
      await supabase.from('customers').update(payload).eq('id', editingCustomer.id);
    } else {
      await supabase.from('customers').insert([payload]);
    }
    setIsModalOpen(false);
    setEditingCustomer(null);
    resetForm();
    loadData();
  }

  async function handleDelete(id: string) {
    if (confirm(t('confirm_delete'))) {
      await supabase.from('customers').delete().eq('id', id);
      setSelectedCustomer(null);
      loadData();
    }
  }

  function resetForm() {
    setForm({ name: '', email: '', phone: '', address: '', notes: '', vat_rate: '20', default_discount: '0' });
  }

  function openEdit(customer: Customer) {
    setEditingCustomer(customer);
    setForm({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      notes: customer.notes || '',
      vat_rate: (customer.vat_rate || 20).toString(),
      default_discount: (customer.default_discount || 0).toString(),
    });
    setIsModalOpen(true);
  }

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.toLowerCase().includes(search.toLowerCase())
  );

  const customerVehicles = selectedCustomer ? vehicles.filter((v) => v.customer_id === selectedCustomer.id) : [];
  const customerOrders = selectedCustomer ? workOrders.filter((o) => o.customer_id === selectedCustomer.id) : [];
  const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total_cost || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[32px] font-bold text-foreground">{t('customers')}</h1>
          <p className="text-muted-foreground">{t('customer_management')}</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingCustomer(null); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2 inline" />
          {t('add_customer')}
        </Button>
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('search_customers')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 bg-background text-foreground"
            />
          </div>

          <DataTable
            data={filteredCustomers}
            loading={loading}
            onRowClick={setSelectedCustomer}
            columns={[
              { key: 'name', header: t('name'), render: (c) => <span className="font-medium">{c.name}</span> },
              { key: 'phone', header: t('phone') },
              { key: 'email', header: t('email') },
              {
                key: 'vehicles',
                header: t('vehicles'),
                render: (c) => vehicles.filter((v) => v.customer_id === c.id).length,
              },
              {
                key: 'lastVisit',
                header: t('date'),
                render: (c) => {
                  const lastOrder = workOrders.filter((o) => o.customer_id === c.id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                  return lastOrder ? new Date(lastOrder.created_at).toLocaleDateString() : '-';
                },
              },
            ]}
          />
        </div>

        {selectedCustomer && (
          <div className="w-96 bg-card rounded-xl border border-border shadow-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{selectedCustomer.name}</h2>
                <p className="text-sm text-muted-foreground">Customer since {new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => openEdit(selectedCustomer)}>{t('edit')}</Button>
                <Button variant="secondary" size="sm" onClick={() => {
                  // Use configured public_url or fallback to current origin (useful for dev)
                  const baseUrl = emailSettings?.public_url || window.location.origin;
                  // Ensure no double slashes if public_url ends with /
                  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
                  const url = `${cleanBaseUrl}/portal/${selectedCustomer.portal_token}`;
                  navigator.clipboard.writeText(url);
                  alert(t('link_copied') || 'Portal link copied to clipboard!');
                }}>
                  {t('copy_portal_link') || 'Copy Portal Link'}
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(selectedCustomer.id)}>{t('delete')}</Button>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {selectedCustomer.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedCustomer.phone}</span>
                </div>
              )}
              {selectedCustomer.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedCustomer.email}</span>
                </div>
              )}
              {selectedCustomer.address && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedCustomer.address}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-xl font-bold text-foreground">{currency}{totalSpent.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Visits</p>
                <p className="text-xl font-bold text-foreground">{customerOrders.length}</p>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-medium text-foreground mb-2">{t('vehicles')} ({customerVehicles.length})</h3>
              {customerVehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('no_vehicles')}</p>
              ) : (
                <div className="space-y-2">
                  {customerVehicles.map((v) => (
                    <div key={v.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                      <p className="font-medium text-foreground">{v.year} {v.make} {v.model}</p>
                      <p className="text-muted-foreground">{v.license_plate}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedCustomer.notes && (
              <div>
                <h3 className="font-medium text-foreground mb-2">{t('notes')}</h3>
                <p className="text-sm text-muted-foreground">{selectedCustomer.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCustomer(null); }}
        title={editingCustomer ? t('edit_customer') : t('add_customer')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t('name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('phone')} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label={t('email')} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <Input label={t('address')} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">VAT Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.vat_rate}
                onChange={(e) => setForm({ ...form, vat_rate: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-border focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all bg-background text-foreground"
                placeholder="20.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Default Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.default_discount}
                onChange={(e) => setForm({ ...form, default_discount: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-border focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all bg-background text-foreground"
                placeholder="0.00"
              />
            </div>
          </div>
          <Textarea label={t('notes')} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>{t('cancel')}</Button>
            <Button type="submit">{editingCustomer ? t('edit') : t('add')} {t('customer')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
