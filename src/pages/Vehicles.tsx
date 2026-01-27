// @ts-nocheck
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase, type Vehicle, type Customer, type ServiceHistory } from '../lib/supabase';
import { DataTable } from '../components/DataTable';
import { EmptyState } from '../components/EmptyState';
import { Modal, Button, Input, Select, Textarea } from '../components/Modal';
import { Plus, Search, History, AlertCircle, X, Car } from 'lucide-react';
import { carMakes, getCarLogoUrl, getModelsForMake } from '../data/carMakes';
import { toast } from 'sonner';

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
  const [useCustomMake, setUseCustomMake] = useState(false);
  const [useCustomModel, setUseCustomModel] = useState(false);

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
    try {
      const payload = {
        ...form,
        customer_id: form.customer_id || null, // Handle empty string for UUID
        year: parseInt(form.year) || null,
        mileage: parseInt(form.mileage) || null,
      };

      console.log('Submitting vehicle payload:', payload);

      let error;
      if (editingVehicle) {
        const result = await supabase.from('vehicles').update(payload).eq('id', editingVehicle.id);
        error = result.error;
      } else {
        const result = await supabase.from('vehicles').insert([payload]);
        error = result.error;
      }

      if (error) {
        throw error;
      }

      setIsModalOpen(false);
      setEditingVehicle(null);
      resetForm();
      loadData();
    } catch (err: any) {
      console.error('Error saving vehicle:', err);
      const errorMessage = err.message || err.hint || err.details || 'Unknown error';
      toast.error(`${t('vehicle_save_error') || 'Failed to save vehicle'}: ${errorMessage}`);
    }
  }

  function resetForm() {
    setForm({ customer_id: '', vin: '', make: '', model: '', year: '', license_plate: '', color: '', mileage: '', notes: '' });
    setUseCustomMake(false);
    setUseCustomModel(false);
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
    // Check if make/model are custom (not in our list)
    const makeExists = carMakes.some(m => m.name === vehicle.make);
    const modelExists = vehicle.make && getModelsForMake(vehicle.make).includes(vehicle.model || '');
    setUseCustomMake(!makeExists && !!vehicle.make);
    setUseCustomModel(!modelExists && !!vehicle.model);
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
    const milesSinceService = vehicle.mileage - (lastService.mileage_at_service || 0);
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
          <h1 className="text-[32px] font-bold text-foreground">{t('vehicles')}</h1>
          <p className="text-muted-foreground">{t('vehicle_management')}</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingVehicle(null); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2 inline" />
          {t('add_vehicle')}
        </Button>
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('search_vehicles')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 bg-background text-foreground"
            />
          </div>

          <DataTable
            data={filteredVehicles}
            loading={loading}
            onRowClick={setSelectedVehicle}
            columns={[
              {
                key: 'vehicle',
                header: t('vehicle'),
                render: (v: Vehicle) => {
                  const make = carMakes.find(m => m.name === v.make);
                  const logoUrl = make ? getCarLogoUrl(make.logo) : null;
                  return (
                    <div className="flex items-center gap-3">
                      {logoUrl && (
                        <img
                          src={logoUrl}
                          alt={v.make}
                          className="w-6 h-6 object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                      <div>
                        <span className="font-medium">{v.year} {v.make} {v.model}</span>
                      </div>
                    </div>
                  );
                }
              },
              { key: 'license_plate', header: t('license_plate') },
              { key: 'vin', header: t('vin'), render: (v: Vehicle) => v.vin || '-' },
              {
                key: 'owner',
                header: t('owner'),
                render: (v: Vehicle) => customers.find((c) => c.id === v.customer_id)?.name || '-',
              },
              { key: 'mileage', header: t('mileage'), render: (v: Vehicle) => v.mileage?.toLocaleString() || '-' },
              {
                key: 'prediction',
                header: t('status'),
                render: (v: Vehicle) => {
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
            emptyState={
              <EmptyState
                title={t('no_vehicles_found')}
                description={t('no_vehicles_desc')}
                icon={Car}
                action={{
                  label: t('add_vehicle'),
                  onClick: () => { resetForm(); setEditingVehicle(null); setIsModalOpen(true); }
                }}
              />
            }
          />
        </div>

        {selectedVehicle && (
          <div className="w-96 bg-card rounded-xl border border-border shadow-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                </h2>
                <p className="text-sm text-muted-foreground">{selectedVehicle.color}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => openEdit(selectedVehicle)}>{t('edit')}</Button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p className="text-muted-foreground">{t('vin')}</p>
                <p className="font-mono">{selectedVehicle.vin || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('license_plate')}</p>
                <p className="font-medium text-foreground">{selectedVehicle.license_plate || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('mileage')}</p>
                <p className="font-medium text-foreground">{selectedVehicle.mileage?.toLocaleString() || '-'} mi</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('owner')}</p>
                <p className="font-medium">{getCustomerName(selectedVehicle.customer_id)}</p>
              </div>
            </div>

            {getPrediction(selectedVehicle) && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg mb-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">{t('maintenance_prediction')}</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">{getPrediction(selectedVehicle)?.type} {t('recommended_soon')}</p>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <History className="w-4 h-4" />
                {t('service_history')}
              </h3>
              {vehicleHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('no_service_history')}</p>
              ) : (
                <div className="space-y-3">
                  {vehicleHistory.slice(0, 5).map((s) => (
                    <div key={s.id} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex justify-between">
                        <p className="font-medium text-sm text-foreground">{s.service_type}</p>
                        <p className="text-xs text-muted-foreground">{s.service_date}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{s.description}</p>
                      {s.mileage_at_service && <p className="text-xs text-muted-foreground mt-1">{s.mileage_at_service.toLocaleString()} mi</p>}
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

            {/* Make Dropdown */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('make') || 'Make'}</label>
              {!useCustomMake ? (
                <select
                  value={form.make}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setUseCustomMake(true);
                      setForm({ ...form, make: '', model: '' });
                    } else {
                      setForm({ ...form, make: e.target.value, model: '' });
                      setUseCustomModel(false);
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all bg-white dark:bg-neutral-800 text-foreground"
                >
                  <option value="">Select make...</option>
                  {carMakes.map((make) => (
                    <option key={make.name} value={make.name}>
                      {make.name}
                    </option>
                  ))}
                  <option value="custom">Other (custom)</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={form.make}
                    onChange={(e) => setForm({ ...form, make: e.target.value })}
                    placeholder="Enter make..."
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustomMake(false);
                      setForm({ ...form, make: '', model: '' });
                    }}
                    className="px-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Model Dropdown */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('model') || 'Model'}</label>
              {!useCustomModel && form.make && !useCustomMake && getModelsForMake(form.make).length > 0 ? (
                <select
                  value={form.model}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setUseCustomModel(true);
                      setForm({ ...form, model: '' });
                    } else {
                      setForm({ ...form, model: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all bg-white dark:bg-neutral-800 text-foreground"
                >
                  <option value="">Select model...</option>
                  {getModelsForMake(form.make).map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                  <option value="custom">Other (custom)</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    placeholder={form.make ? "Enter model..." : "Select make first"}
                    className="flex-1"
                    disabled={!form.make}
                  />
                  {useCustomModel && form.make && (
                    <button
                      type="button"
                      onClick={() => {
                        setUseCustomModel(false);
                        setForm({ ...form, model: '' });
                      }}
                      className="px-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
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
