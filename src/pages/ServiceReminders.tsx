// @ts-nocheck
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase, type ServiceReminder, type Customer, type Vehicle } from '../lib/supabase';
import { DataTable, StatusBadge } from '../components/DataTable';
import { Modal, Button, Input } from '../components/Modal';
import { Plus, Search, Calendar, Bell, CheckCircle, XCircle, Mail } from 'lucide-react';

export function ServiceReminders() {
    const { t } = useTranslation();
    const [reminders, setReminders] = useState<(ServiceReminder & { customers: Customer, vehicles: Vehicle })[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');

    const [form, setForm] = useState({
        customer_id: '',
        vehicle_id: '',
        service_type: '',
        due_date: '',
        status: 'pending',
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        const [remindersRes, customersRes, vehiclesRes] = await Promise.all([
            supabase.from('service_reminders').select('*, customers(*), vehicles(*)').order('due_date'),
            supabase.from('customers').select('*').order('name'),
            supabase.from('vehicles').select('*'),
        ]);

        // @ts-ignore
        setReminders(remindersRes.data || []);
        setCustomers(customersRes.data || []);
        setVehicles(vehiclesRes.data || []);
        setLoading(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.customer_id || !form.vehicle_id) return;

        await supabase.from('service_reminders').insert([form]);
        setIsModalOpen(false);
        resetForm();
        loadData();
    }

    async function handleStatusChange(id: string, newStatus: string) {
        await supabase.from('service_reminders').update({ status: newStatus }).eq('id', id);
        loadData();
    }

    async function deleteReminder(id: string) {
        if (confirm(t('confirm_delete'))) {
            await supabase.from('service_reminders').delete().eq('id', id);
            loadData();
        }
    }

    function resetForm() {
        setForm({ customer_id: '', vehicle_id: '', service_type: '', due_date: '', status: 'pending' });
    }

    // Filter vehicles when customer is selected
    const availableVehicles = form.customer_id
        ? vehicles.filter(v => v.customer_id === form.customer_id)
        : [];

    const filteredReminders = reminders.filter(r =>
        r.customers?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.service_type.toLowerCase().includes(search.toLowerCase()) ||
        r.vehicles?.model.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-[32px] font-bold text-neutral-900 dark:text-white">{t('reminders')}</h1>
                    <p className="text-neutral-500 dark:text-neutral-400">{t('automated_notifications')}</p>
                </div>
                <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2 inline" />
                    {t('add_reminder')}
                </Button>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('pending')}</p>
                            <p className="text-xl font-bold text-neutral-900 dark:text-white">
                                {reminders.filter(r => r.status === 'pending').length}
                            </p>
                        </div>
                    </div>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-800 rounded-full flex items-center justify-center">
                            <Mail className="w-5 h-5 text-yellow-600 dark:text-yellow-300" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('sent')}</p>
                            <p className="text-xl font-bold text-neutral-900 dark:text-white">
                                {reminders.filter(r => r.status === 'sent').length}
                            </p>
                        </div>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-300" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('completed')}</p>
                            <p className="text-xl font-bold text-neutral-900 dark:text-white">
                                {reminders.filter(r => r.status === 'completed').length}
                            </p>
                        </div>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center">
                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-300" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('cancelled')}</p>
                            <p className="text-xl font-bold text-neutral-900 dark:text-white">
                                {reminders.filter(r => r.status === 'cancelled').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                    type="text"
                    placeholder={t('search_reminders')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
            </div>

            <DataTable
                data={filteredReminders}
                loading={loading}
                columns={[
                    {
                        key: 'due_date',
                        header: t('due_date'),
                        render: (r) => (
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-neutral-400" />
                                <span>{new Date(r.due_date).toLocaleDateString()}</span>
                            </div>
                        )
                    },
                    {
                        key: 'customer',
                        header: t('customer'),
                        render: (r) => (
                            <div>
                                <div className="font-medium">{r.customers?.name}</div>
                                <div className="text-xs text-neutral-500">{r.customers?.phone || r.customers?.email}</div>
                            </div>
                        )
                    },
                    {
                        key: 'vehicle',
                        header: t('vehicle'),
                        render: (r) => (
                            <div>
                                <div>{r.vehicles?.year} {r.vehicles?.make} {r.vehicles?.model}</div>
                            </div>
                        )
                    },
                    { key: 'service_type', header: t('service_type') },
                    {
                        key: 'status',
                        header: t('status'),
                        render: (r) => <StatusBadge status={r.status} />
                    },
                    {
                        key: 'actions',
                        header: t('actions'),
                        render: (r) => (
                            <div className="flex items-center gap-2">
                                {r.status === 'pending' && (
                                    <Button size="sm" onClick={() => handleStatusChange(r.id, 'sent')}>
                                        {t('mark_sent')}
                                    </Button>
                                )}
                                {r.status === 'sent' && (
                                    <Button size="sm" variant="secondary" onClick={() => handleStatusChange(r.id, 'completed')}>
                                        {t('complete')}
                                    </Button>
                                )}
                                <Button size="sm" variant="danger" onClick={() => deleteReminder(r.id)}>
                                    {t('delete')}
                                </Button>
                            </div>
                        )
                    }
                ]}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); resetForm(); }}
                title={t('add_reminder')}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('customer')}</label>
                        <select
                            value={form.customer_id}
                            onChange={(e) => setForm({ ...form, customer_id: e.target.value, vehicle_id: '' })}
                            className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                            required
                        >
                            <option value="">{t('select_customer')}</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('vehicle')}</label>
                        <select
                            value={form.vehicle_id}
                            onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                            required
                            disabled={!form.customer_id}
                        >
                            <option value="">{t('select_vehicle')}</option>
                            {availableVehicles.map(v => (
                                <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>
                            ))}
                        </select>
                    </div>

                    <Input
                        label={t('service_type')}
                        value={form.service_type}
                        onChange={(e) => setForm({ ...form, service_type: e.target.value })}
                        placeholder="e.g. Oil Change, Brake Inspection"
                        required
                    />

                    <Input
                        label={t('due_date')}
                        type="date"
                        value={form.due_date}
                        onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                        required
                    />

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>{t('cancel')}</Button>
                        <Button type="submit">{t('create_reminder')}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
