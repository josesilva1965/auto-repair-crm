// @ts-nocheck
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase, type Vehicle, type Customer, type ServiceHistory } from '../lib/supabase';
import { DataTable } from '../components/DataTable';
import { Modal, Button, Input, Select, Textarea } from '../components/Modal';
import { Plus, Search, History, AlertCircle } from 'lucide-react';

export function Vehicles() {
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [serviceHistory, setServiceHistory] = useState<ServiceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    customer_id: '',
    vin: '',
    make: '',
    model: '',
    year: '',
    license_plate: '',
    color: '',
    mileage: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [vehiclesRes, customersRes, historyRes] = await Promise.all([
      supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
      supabase.from('customers').select('*'),
      supabase.from('service_history').select('*').order('service_date', { ascending: false }),
    ]);
    setVehicles(vehiclesRes.data || []);
    setCustomers(customersRes.data || []);
    setServiceHistory(historyRes.data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      year: parseInt(form.year) || null,
      mileage: parseInt(form.mileage) || null,
    };
    if (editingVehicle) {
      await supabase.from('vehicles').update(payload).eq('id', editingVehicle.id);
    } else {
      await supabase.from('vehicles').insert([payload]);
    }
    setIsModalOpen(false);
    setEditingVehicle(null);
    resetForm();
    loadData();
  }

  function resetForm() {
    setForm({ customer_id: '', vin: '', make: '', model: '', year: '', license_plate: '', color: '', mileage: '', notes: '' });
  }

  function openEdit(vehicle: Vehicle) {
    setEditingVehicle(vehicle);
    setForm({
      customer_id: vehicle.customer_id,
      vin: vehicle.vin || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year?.toString() || '',
      license_plate: vehicle.license_plate || '',
      color: vehicle.color || '',
      mileage: vehicle.mileage?.toString() || '',
      notes: vehicle.notes || '',
    });
    setIsModalOpen(true);
  }

  const filteredVehicles = vehicles.filter((v) =>
    v.vin?.toLowerCase().includes(search.toLowerCase()) ||
    v.make?.toLowerCase().includes(search.toLowerCase()) ||
    v.model?.toLowerCase().includes(search.toLowerCase()) ||
    v.license_plate?.toLowerCase().includes(search.toLowerCase())
  );

  const getCustomerName = (id: string) => customers.find((c) => c.id === id)?.name || '-';
  const vehicleHistory = selectedVehicle ? serviceHistory.filter((s) => s.vehicle_id === selectedVehicle.id) : [];

  // Prediction logic: next service based on mileage
  const getPrediction = (vehicle: Vehicle) => {
    const lastService = serviceHistory.find((s) => s.vehicle_id === vehicle.id);
    if (!lastService || !vehicle.mileage) return null;
    const milesSinceService = vehicle.mileage - (lastService.mileage || 0);
    if (milesSinceService > 3000) {
      return { type: 'Oil Change', urgency: 'high' };
    }
    if (milesSinceService > 2000) {
      return { type: 'Oil Change', urgency: 'medium' };
    }
    return null;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[32px] font-bold text-neutral-900">{t('vehicles')}</h1>
          <p className="text-neutral-500">{t('vehicle_management')}</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingVehicle(null); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2 inline" />
          {t('add_vehicle')}
        </Button>
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder={t('search_vehicles')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
            />
          </div>

          <DataTable
            data={filteredVehicles}
            loading={loading}
            onRowClick={(v: any) => setSelectedVehicle(v as Vehicle)}
            columns={[
              { key: 'vehicle', header: t('vehicle'), render: (v: any) => <span className="font-medium">{v.year} {v.make} {v.model}</span> },
              { key: 'customer_id', header: t('owner'), render: (v: any) => getCustomerName(v.customer_id) },
              { key: 'license_plate', header: t('license_plate') },
              { key: 'mileage', header: t('mileage'), render: (v: any) => v.mileage?.toLocaleString() || '-' },
              {
                key: 'prediction',
                header: t('status'),
                render: (v: any) => {
                  const pred = getPrediction(v as Vehicle);
                  if (!pred) return <span className="text-emerald-600 text-sm">{t('ok')}</span>;
                  return (
                    <span className={`text-sm ${pred.urgency === 'high' ? 'text-red-600' : 'text-amber-600'}`}>
                      {pred.type} {t('due')}
                    </span>
                  );
                },
              },
            ]}
          />
        </div>

        {selectedVehicle && (
          <div className="w-96 bg-white rounded-xl border border-neutral-200 shadow-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                </h2>
                <p className="text-sm text-neutral-500">{selectedVehicle.color}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => openEdit(selectedVehicle)}>{t('edit')}</Button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p className="text-neutral-500">{t('vin')}</p>
                <p className="font-mono">{selectedVehicle.vin || '-'}</p>
              </div>
              <div>
                <p className="text-neutral-500">{t('license_plate')}</p>
                <p className="font-medium">{selectedVehicle.license_plate || '-'}</p>
              </div>
              <div>
                <p className="text-neutral-500">{t('mileage')}</p>
                <p className="font-medium">{selectedVehicle.mileage?.toLocaleString() || '-'} mi</p>
              </div>
              <div>
                <p className="text-neutral-500">{t('owner')}</p>
                <p className="font-medium">{getCustomerName(selectedVehicle.customer_id)}</p>
              </div>
            </div>

            {getPrediction(selectedVehicle) && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">{t('maintenance_prediction')}</p>
                  <p className="text-sm text-amber-700">{getPrediction(selectedVehicle)?.type} {t('recommended_soon')}</p>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-medium text-neutral-900 mb-3 flex items-center gap-2">
                <History className="w-4 h-4" />
                {t('service_history')}
              </h3>
              {vehicleHistory.length === 0 ? (
                <p className="text-sm text-neutral-500">{t('no_service_history')}</p>
              ) : (
                <div className="space-y-3">
                  {vehicleHistory.slice(0, 5).map((s) => (
                    <div key={s.id} className="p-3 bg-neutral-50 rounded-lg">
                      <div className="flex justify-between">
                        <p className="font-medium text-sm">{s.service_type}</p>
                        <p className="text-xs text-neutral-500">{s.service_date}</p>
                      </div>
                      <p className="text-xs text-neutral-600 mt-1">{s.description}</p>
                      {s.mileage && <p className="text-xs text-neutral-500 mt-1">{s.mileage.toLocaleString()} mi</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingVehicle(null); }}
        title={editingVehicle ? t('edit_vehicle') : t('add_vehicle')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label={t('owner')}
            value={form.customer_id}
            onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
            options={[{ value: '', label: t('select_customer') }, ...customers.map((c) => ({ value: c.id, label: c.name }))]}
            required
          />
          <div className="grid grid-cols-3 gap-4">
            <Input label={t('year')} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="2020" />
            <Input label={t('make')} value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} placeholder="Toyota" />
            <Input label={t('model')} value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Camry" />
          </div>
          <Input label={t('vin')} value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} placeholder="17-character VIN" />
          <div className="grid grid-cols-3 gap-4">
            <Input label={t('license_plate')} value={form.license_plate} onChange={(e) => setForm({ ...form, license_plate: e.target.value })} />
            <Input label={t('color')} value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            <Input label={t('mileage')} type="number" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} />
          </div>
          <Textarea label={t('notes')} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>{t('cancel')}</Button>
            <Button type="submit">{editingVehicle ? t('edit') : t('add')} {t('vehicle')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
