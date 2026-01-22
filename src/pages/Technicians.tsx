// @ts-nocheck
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../contexts/SettingsContext';
import { supabase, type Technician, type WorkOrder } from '../lib/supabase';
import { DataTable, StatusBadge } from '../components/DataTable';
import { EmptyState } from '../components/EmptyState';
import { Modal, Button, Input } from '../components/Modal';
import { Plus, Search, Wrench, DollarSign, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';

export function Technicians() {
    const { t } = useTranslation();
    const { currency } = useSettings();
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTech, setEditingTech] = useState<Technician | null>(null);
    const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
    const [search, setSearch] = useState('');

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        specialization: '',
        hourly_rate: 0,
        status: 'available',
    });

    const [workOrderItems, setWorkOrderItems] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        const [techniciansRes, ordersRes, itemsRes] = await Promise.all([
            supabase.from('technicians').select('*').order('name'),
            supabase.from('work_orders').select('*'),
            supabase.from('work_order_items').select('*'),
        ]);
        setTechnicians(techniciansRes.data || []);
        setWorkOrders(ordersRes.data || []);
        setWorkOrderItems(itemsRes.data || []);
        setLoading(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        let error;
        if (editingTech) {
            const { error: updateError } = await supabase.from('technicians').update(form).eq('id', editingTech.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase.from('technicians').insert([form]);
            error = insertError;
        }

        if (error) {
            console.error('Error saving technician:', error);
            toast.error('Failed to save technician');
        } else {
            toast.success('Technician saved successfully');
            setIsModalOpen(false);
            setEditingTech(null);
            resetForm();
            loadData();
        }
    }

    async function handleDelete(id: string) {
        if (confirm(t('confirm_delete'))) {
            const { error } = await supabase.from('technicians').delete().eq('id', id);
            if (error) {
                console.error('Error deleting technician:', error);
                toast.error('Failed to delete technician');
            } else {
                toast.success('Technician deleted');
                setSelectedTech(null);
                loadData();
            }
        }
    }

    function resetForm() {
        setForm({ name: '', email: '', phone: '', specialization: '', hourly_rate: 0, status: 'available' });
    }

    function openEdit(tech: Technician) {
        setEditingTech(tech);
        setForm({
            name: tech.name,
            email: tech.email || '',
            phone: tech.phone || '',
            specialization: tech.specialization || '',
            hourly_rate: tech.hourly_rate || 0,
            status: tech.status || 'available',
        });
        setIsModalOpen(true);
    }

    function getTechStatus(tech: Technician) {
        // If manually set to off-duty, respect it
        if (tech.status === 'off-duty') return 'off-duty';

        // Otherwise check for active orders
        const hasActiveJob = workOrders.some(
            o => o.technician_id === tech.id &&
                ['in-progress', 'testing'].includes(o.status)
        );

        return hasActiveJob ? 'busy' : 'available';
    }

    function getTechMetrics(techId: string) {
        const techOrders = workOrders.filter(o => o.technician_id === techId && o.status === 'completed');
        const techOrderIds = techOrders.map(o => o.id);

        const revenue = techOrders.reduce((sum, o) => sum + (o.actual_cost || o.estimated_cost || 0), 0);

        const hours = workOrderItems
            .filter(i => techOrderIds.includes(i.work_order_id) && i.item_type === 'labor')
            .reduce((sum, i) => sum + (i.quantity || 0), 0);

        return { revenue, hours };
    }

    const filteredTechs = technicians.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.email?.toLowerCase().includes(search.toLowerCase()) ||
        t.specialization?.toLowerCase().includes(search.toLowerCase())
    );

    // Selected Tech Metrics
    const selectedTechMetrics = selectedTech ? getTechMetrics(selectedTech.id) : { revenue: 0, hours: 0 };
    const techOrders = selectedTech ? workOrders.filter((o) => o.technician_id === selectedTech.id) : [];
    const completedOrders = techOrders.filter((o) => o.status === 'completed');

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-[32px] font-bold text-foreground">{t('technicians')}</h1>
                    <p className="text-muted-foreground">{t('technician_management')}</p>
                </div>
                <Button onClick={() => { resetForm(); setEditingTech(null); setIsModalOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2 inline" />
                    {t('add_technician')}
                </Button>
            </div>

            <div className="flex gap-6">
                <div className="flex-1">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={t('search_technicians')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                        />
                    </div>

                    <DataTable
                        data={filteredTechs}
                        loading={loading}
                        onRowClick={setSelectedTech}
                        columns={[
                            {
                                key: 'name',
                                header: t('name'),
                                render: (tech) => (
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                            <Wrench className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="font-medium">{tech.name}</span>
                                    </div>
                                )
                            },
                            { key: 'specialization', header: t('specialization'), render: (tech) => tech.specialization || '-' },
                            { key: 'phone', header: t('phone'), render: (tech) => tech.phone || '-' },
                            { key: 'hourly_rate', header: t('hourly_rate'), render: (tech) => `${currency}${(tech.hourly_rate || 0).toFixed(2)}` },
                            { key: 'status', header: t('status'), render: (tech) => <StatusBadge status={getTechStatus(tech)} /> },
                            { key: 'jobs', header: t('active_jobs'), render: (tech) => workOrders.filter((o) => o.technician_id === tech.id && !['completed', 'cancelled', 'archived'].includes(o.status)).length },
                        ]}
                        emptyState={
                            <EmptyState
                                title={t('no_technicians_found')}
                                description={t('no_technicians_desc')}
                                icon={Users}
                                action={{
                                    label: t('add_technician'),
                                    onClick: () => { resetForm(); setEditingTech(null); setIsModalOpen(true); }
                                }}
                            />
                        }
                    />
                </div>

                {selectedTech && (
                    <div className="w-96 bg-card rounded-xl border border-border shadow-card p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">{selectedTech.name}</h2>
                                <p className="text-sm text-muted-foreground">{selectedTech.specialization || 'General'}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="secondary" size="sm" onClick={() => openEdit(selectedTech)}>{t('edit')}</Button>
                                <Button variant="danger" size="sm" onClick={() => handleDelete(selectedTech.id)}>{t('delete')}</Button>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            {selectedTech.phone && <div className="text-sm"><span className="text-muted-foreground">{t('phone')}:</span> <span className="text-foreground">{selectedTech.phone}</span></div>}
                            {selectedTech.email && <div className="text-sm"><span className="text-muted-foreground">{t('email')}:</span> <span className="text-foreground">{selectedTech.email}</span></div>}
                            <div className="text-sm"><span className="text-muted-foreground">{t('rate')}:</span> <span className="text-foreground">{currency}{(selectedTech.hourly_rate || 0).toFixed(2)}/hr</span></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <DollarSign className="w-4 h-4" />
                                    <p className="text-sm">{t('revenue')}</p>
                                </div>
                                <p className="text-xl font-bold text-foreground">{currency}{selectedTechMetrics.revenue.toFixed(2)}</p>
                            </div>
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <Clock className="w-4 h-4" />
                                    <p className="text-sm">{t('hours')}</p>
                                </div>
                                <p className="text-xl font-bold text-foreground">{selectedTechMetrics.hours.toFixed(1)}</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-medium text-foreground mb-2">{t('stats')}</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">{t('completed')}</span><span className="font-medium text-foreground">{completedOrders.length}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">{t('active')}</span><span className="font-medium text-foreground">{techOrders.filter((o) => o.status !== 'completed').length}</span></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingTech(null); }} title={editingTech ? t('edit_technician') : t('add_technician')}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label={t('name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label={t('phone')} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                        <Input label={t('email')} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <Input label={t('specialization')} value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="e.g., Brakes, Engine" />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label={t('hourly_rate')} type="number" step="0.01" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: parseFloat(e.target.value) || 0 })} required />
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">{t('status')}</label>
                            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground">
                                <option value="available">{t('available')}</option>
                                <option value="busy">{t('busy')}</option>
                                <option value="off-duty">{t('off_duty')}</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>{t('cancel')}</Button>
                        <Button type="submit">{editingTech ? t('update') : t('add')} {t('technician')}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
