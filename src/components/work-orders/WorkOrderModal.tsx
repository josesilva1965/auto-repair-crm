import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../contexts/SettingsContext';
import { supabase, type WorkOrder, type Customer, type Vehicle, type Technician, type Estimate, type InventoryPart } from '../../lib/supabase';
import { Modal, Button, Input, Select, Textarea } from '../Modal';
import { Plus, Clock, FileText, Send, Mail, MessageSquare, Printer, Check, AlertCircle, Brain, Loader, Trash2 } from 'lucide-react';
import { maximizeTechAssignment } from '../../lib/assignmentOptimizer';
import { PricingEngine } from '../../lib/pricingEngine';
import { communicationService } from '../../lib/communicationService';
import { partsService, type PartLookupResult } from '../../lib/partsService';
import { toast } from 'sonner';
import { TimeTracker } from '../TimeTracker';
import { InspectionModal } from '../InspectionModal';

const STATUS_OPTIONS = [
    { value: 'pending', label: 'pending' },
    { value: 'approved', label: 'approved' },
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


interface WorkOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingOrder: WorkOrder | null;
    customers: Customer[];
    vehicles: Vehicle[];
    technicians: Technician[];
    inventoryParts: InventoryPart[];
    workOrders: WorkOrder[];
    estimates: Estimate[];
    onSave: () => void;
}

export function WorkOrderModal({ isOpen, onClose, editingOrder, customers, vehicles, technicians, inventoryParts, workOrders, estimates, onSave }: WorkOrderModalProps) {
    const { t } = useTranslation();
    const { currency } = useSettings();
    const pricingEngine = new PricingEngine();

    const [activeTab, setActiveTab] = useState<'details' | 'time'>('details');
    const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);
    const [estimateNotes, setEstimateNotes] = useState('');
    const [sendingEstimate, setSendingEstimate] = useState(false);
    const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);

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

    const [lineItems, setLineItems] = useState<{ description: string; quantity: number; unit_price: number; item_type: 'part' | 'labor' | 'other' }[]>([]);
    const [newItem, setNewItem] = useState({ description: '', quantity: 1, unit_price: 0, item_type: 'part' as 'part' | 'labor' | 'other' });

    // Log Hours Helper
    const [logHoursAmount, setLogHoursAmount] = useState(1);
    const [isLookingUpPart, setIsLookingUpPart] = useState(false);
    const [partLookupResults, setPartLookupResults] = useState<PartLookupResult[]>([]);
    const [lookupQuery, setLookupQuery] = useState('');
    const [filterByVehicle, setFilterByVehicle] = useState(true);

    useEffect(() => {
        if (isOpen) {
            if (editingOrder) {
                setForm({
                    customer_id: editingOrder.customer_id,
                    vehicle_id: editingOrder.vehicle_id,
                    technician_id: editingOrder.technician_id || '',
                    status: editingOrder.status,
                    priority: editingOrder.priority,
                    description: editingOrder.description || '',
                    scheduled_date: editingOrder.scheduled_date ? editingOrder.scheduled_date.split('T')[0] : '',
                    estimated_cost: (editingOrder.estimated_cost || 0).toString(),
                    actual_cost: (editingOrder.actual_cost || 0).toString(),
                });
                loadItems(editingOrder.id);
            } else {
                resetForm();
            }
        }
    }, [isOpen, editingOrder]);

    async function loadItems(orderId: string) {
        const { data: items } = await supabase.from('work_order_items').select('*').eq('work_order_id', orderId);
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
        setActiveTab('details');
    }

    // Calculate suggested technicians
    const suggestedTechs = maximizeTechAssignment(
        technicians,
        { description: form.description },
        workOrders
    );

    const customerVehicles = vehicles.filter((v) => v.customer_id === form.customer_id);
    const calculatedTotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    function addItem() {
        if (!newItem.description) return;
        setLineItems([...lineItems, { ...newItem }]);
        setNewItem({ description: '', quantity: 1, unit_price: 0, item_type: 'part' });
    }

    function removeItem(index: number) {
        setLineItems(lineItems.filter((_, i) => i !== index));
    }

    function logHours(hours: number) {
        const techId = form.technician_id;
        const tech = technicians.find(t => t.id === techId);
        const rate = tech?.hourly_rate || 0;
        const effectiveRate = rate > 0 ? rate : 50;
        const description = `Labor - ${tech ? tech.name : 'Unknown Tech'}`;

        const existingIndex = lineItems.findIndex(i => i.description === description && i.item_type === 'labor' && i.unit_price === effectiveRate);

        if (existingIndex >= 0) {
            const updated = [...lineItems];
            updated[existingIndex].quantity += hours;
            setLineItems(updated);
        } else {
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

        if (orderId) {
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

        // New Order Notification
        if (!editingOrder && orderId) {
            const customer = customers.find(c => c.id === form.customer_id);
            const vehicle = vehicles.find(v => v.id === form.vehicle_id);
            const vehicleInfo = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Vehicle';
            if (customer) {
                communicationService.sendWorkOrderStartedNotification(
                    customer,
                    vehicleInfo,
                    { id: orderId, ...payload }
                ).catch(console.error);
            }
        }

        onSave();
        onClose();
    }

    async function handleSmartLookup(e: React.FormEvent | React.MouseEvent) {
        e.preventDefault();
        if (!lookupQuery.trim()) return;

        setIsLookingUpPart(true);
        try {
            const currentOrder = workOrders.find(o => o.id === editingOrder?.id);
            const vehicle = vehicles.find(v => v.id === currentOrder?.vehicle_id || v.id === form.vehicle_id);
            const vehicleInfo = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : undefined;

            const results = await partsService.searchParts(lookupQuery, vehicleInfo);
            setPartLookupResults(results);
        } catch (error) {
            console.error('Error looking up parts:', error);
        } finally {
            setIsLookingUpPart(false);
        }
    }

    function handleSelectLookupResult(part: PartLookupResult) {
        const newItemToAdd = {
            description: part.name,
            unit_price: part.estimated_price * 1.5,
            quantity: 1,
            item_type: 'part' as const
        };

        setLineItems([...lineItems, newItemToAdd]);
        setPartLookupResults([]);
        setLookupQuery('');
    }


    function getEstimateForOrder(orderId: string): Estimate | undefined {
        return estimates.find(e => e.work_order_id === orderId);
    }

    async function createEstimate(channel: 'email' | 'sms' | 'print') {
        if (!editingOrder) return;

        setSendingEstimate(true);
        await handleSubmit(new Event('submit') as any); // Save current state first

        const customer = customers.find(c => c.id === editingOrder.customer_id);
        const vatRate = (customer?.vat_rate || 20) / 100;
        const discountPercent = customer?.default_discount || 0;

        const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        const discount = discountPercent > 0 ? { type: 'percentage' as const, value: discountPercent } : undefined;
        const { taxAmount, total, discountAmount } = pricingEngine.calculateInvoice(subtotal, discount, vatRate);

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
            toast.error(t('estimate_create_error') || 'Failed to create estimate');
            setSendingEstimate(false);
            return;
        }

        const result = await communicationService.sendDocument({
            type: 'estimate',
            documentId: newEstimate.id,
            customerId: editingOrder.customer_id,
            channel
        });

        if (result.success) {
            await supabase.from('estimates').update({
                status: 'sent',
                sent_via: channel,
                sent_at: new Date().toISOString()
            }).eq('id', newEstimate.id);

            await communicationService.createNotification(
                'estimate_sent',
                'Estimate Sent',
                `Estimate ${newEstimate.estimate_number} sent to ${customer?.name} via ${channel}`,
                editingOrder.id,
                editingOrder.customer_id
            );
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }

        setSendingEstimate(false);
        setIsEstimateModalOpen(false);
        setEstimateNotes('');
        onSave(); // Refresh data
    }


    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={editingOrder ? t('edit_work_order') : t('new_work_order')}
                size="xl"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex border-b border-border mb-4">
                        <button
                            type="button"
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-primary-500 text-primary-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                            onClick={() => setActiveTab('details')}
                        >
                            {t('details')}
                        </button>
                        <button
                            type="button"
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'time' ? 'border-primary-500 text-primary-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                            onClick={() => setActiveTab('time')}
                        >
                            {t('time_tracking') || 'Time Tracking'}
                        </button>
                    </div>

                    {activeTab === 'time' ? (
                        <TimeTracker workOrderId={editingOrder?.id || ''} />
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Select
                                    label="Customer"
                                    value={form.customer_id}
                                    onChange={(e) => setForm({ ...form, customer_id: e.target.value, vehicle_id: '' })}
                                    options={[{ value: '', label: t('select_customer') }, ...customers.map((c) => ({ value: c.id, label: c.name }))]}
                                    required
                                />
                                <Select
                                    label={t('vehicle')}
                                    value={form.vehicle_id}
                                    onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                                    options={[{ value: '', label: t('select_vehicle') }, ...customerVehicles.map((v) => ({ value: v.id, label: `${v.year} ${v.make} ${v.model}` }))]}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Select
                                    label={t('technician')}
                                    value={form.technician_id}
                                    onChange={(e) => setForm({ ...form, technician_id: e.target.value })}
                                    options={[
                                        { value: '', label: t('unassigned') },
                                        ...technicians.map((t) => ({ value: t.id, label: t.name }))
                                    ]}
                                />

                                {/* AI Suggestion Area */}
                                {form.description && (
                                    <div className="bg-primary/10 dark:bg-primary-900/20 p-3 rounded-lg border border-primary/20 dark:border-primary-800">
                                        <p className="text-xs font-semibold text-primary dark:text-primary-300 mb-2 uppercase tracking-wide">
                                            {t('ai_suggestion')}
                                        </p>
                                        <div className="space-y-2">
                                            {suggestedTechs.slice(0, 4).map(tech => (
                                                <div
                                                    key={tech.id}
                                                    onClick={() => setForm({ ...form, technician_id: tech.id })}
                                                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${form.technician_id === tech.id
                                                        ? 'bg-primary/20 dark:bg-primary-800 border border-primary/30 dark:border-primary-600'
                                                        : 'bg-card dark:bg-neutral-800 hover:bg-muted dark:hover:bg-neutral-700'
                                                        }`}
                                                >
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-sm text-foreground dark:text-white">{tech.name}</span>
                                                            <span className="px-1.5 py-0.5 text-[10px] bg-muted dark:bg-neutral-700 text-muted-foreground dark:text-neutral-400 rounded-full">
                                                                {tech.score} {t('match')}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground dark:text-neutral-400">{tech.matchReason}</p>
                                                    </div>
                                                    {form.technician_id === tech.id && (
                                                        <span className="text-primary-600 dark:text-primary-400 text-xs font-medium">{t('selected')}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label={t('scheduled_date')}
                                    type="date"
                                    value={form.scheduled_date}
                                    onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <Select label={t('status')} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={STATUS_OPTIONS} />
                                    <Select label={t('priority')} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} options={PRIORITY_OPTIONS} />
                                </div>
                            </div>
                            <Textarea
                                label={t('technician_notes')}
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                rows={3}
                                placeholder={t('notes_placeholder')}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label={`${t('estimated_cost')} ($)`}
                                    type="number"
                                    step="0.01"
                                    value={lineItems.length > 0 ? calculatedTotal.toFixed(2) : form.estimated_cost}
                                    onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })}
                                    readOnly={lineItems.length > 0}
                                    className={lineItems.length > 0 ? "bg-neutral-100" : ""}
                                />
                                <Input
                                    label={`${t('actual_cost')} ($)`}
                                    type="number"
                                    step="0.01"
                                    value={lineItems.length > 0 ? calculatedTotal.toFixed(2) : form.actual_cost}
                                    onChange={(e) => setForm({ ...form, actual_cost: e.target.value })}
                                    readOnly={lineItems.length > 0}
                                    className={lineItems.length > 0 ? "bg-neutral-100" : ""}
                                />
                            </div>

                            {/* Line Items Section */}
                            <div className="border-t border-border pt-4">
                                <h3 className="font-semibold text-sm text-foreground mb-3">{t('line_items_section')}</h3>

                                <div className="space-y-2 mb-4">
                                    {lineItems.map((item, idx) => (
                                        <div key={idx} className="flex gap-2 items-center bg-muted/50 p-2 rounded text-sm">
                                            <div className="flex-1 font-medium text-foreground">{item.description}</div>
                                            <div className="w-20 text-muted-foreground capitalize">{item.item_type}</div>
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
                                            <span>{t('total')}:</span>
                                            <span>{currency}{calculatedTotal.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Actions for Tech */}
                                <div className="flex gap-2 mb-4 bg-primary-50 p-2 rounded-lg items-center border border-primary-100">
                                    <Clock className="w-4 h-4 text-primary-600" />
                                    <span className="text-sm font-medium text-primary-800">{t('log_hours')}:</span>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            className="w-16 h-8 text-sm border rounded px-1"
                                            value={logHoursAmount}
                                            onChange={e => setLogHoursAmount(parseFloat(e.target.value) || 0)}
                                        />
                                        <Button type="button" size="sm" variant="secondary" onClick={() => logHours(logHoursAmount)}>{t('add')}</Button>
                                    </div>
                                    <span className="text-neutral-300 mx-1">|</span>
                                    <Button type="button" size="sm" variant="secondary" onClick={() => logHours(1)}>+1h</Button>
                                    <Button type="button" size="sm" variant="secondary" onClick={() => logHours(0.5)}>+0.5h</Button>
                                    <span className="text-neutral-300 mx-1">|</span>
                                    <Button
                                        type="button"
                                        size="sm"
                                        className={!editingOrder ? "opacity-50 cursor-not-allowed bg-emerald-600 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
                                        onClick={() => {
                                            if (!editingOrder) {
                                                toast.error(t('save_before_inspection') || 'Please save the work order before starting an inspection');
                                                return;
                                            }
                                            setIsInspectionModalOpen(true);
                                        }}
                                    >
                                        <Check className="w-3 h-3 mr-1" />
                                        {t('inspection')}
                                    </Button>
                                </div>

                                <div className="grid grid-cols-12 gap-2 items-end bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                                    <div className="col-span-12 mb-2">
                                        <div className="flex gap-2 items-center">
                                            <div className="relative flex-1">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Brain className={`w-4 h-4 ${isLookingUpPart ? 'text-purple-500 animate-pulse' : 'text-neutral-400'}`} />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder={(() => {
                                                        const currentOrder = workOrders.find(o => o.id === editingOrder?.id);
                                                        const vehicle = vehicles.find(v => v.id === currentOrder?.vehicle_id || v.id === form.vehicle_id);
                                                        return vehicle
                                                            ? `Search parts for ${vehicle.year} ${vehicle.make} ${vehicle.model}...`
                                                            : t('ask_ai_placeholder');
                                                    })()}
                                                    className="pl-9 w-full h-9 text-sm border border-purple-200 rounded-md bg-purple-50 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                                    value={lookupQuery}
                                                    onChange={(e) => setLookupQuery(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSmartLookup(e)}
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                                disabled={isLookingUpPart || !lookupQuery}
                                                onClick={handleSmartLookup}
                                            >
                                                {isLookingUpPart ? <Loader className="w-3 h-3 animate-spin" /> : t('magic_lookup')}
                                            </Button>
                                        </div>

                                        {/* Lookup Results */}
                                        {partLookupResults.length > 0 && (
                                            <div className="mt-2 p-2 bg-white border border-purple-100 rounded-lg shadow-sm z-10">
                                                <h4 className="text-xs font-semibold text-purple-800 mb-2">{t('ai_suggestion')}:</h4>
                                                <div className="space-y-1">
                                                    {partLookupResults.map((part, idx) => (
                                                        <div key={idx}
                                                            onClick={() => handleSelectLookupResult(part)}
                                                            className="flex justify-between items-center p-2 hover:bg-purple-50 rounded cursor-pointer text-sm border border-transparent hover:border-purple-100"
                                                        >
                                                            <div>
                                                                <div className="font-medium text-neutral-800">{part.name}</div>
                                                                <div className="text-xs text-neutral-500">{part.part_number} • {part.supplier}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="font-semibold text-emerald-600">${(part.estimated_price * 1.5).toFixed(2)}</div>
                                                                <div className="text-[10px] text-neutral-400">{t('estimated_cost')}: ${part.estimated_price}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-span-12 mb-2 flex items-center gap-2">
                                        <div className="flex-1"></div>
                                        <label className="flex items-center text-xs text-neutral-500 cursor-pointer select-none gap-1">
                                            <input
                                                type="checkbox"
                                                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                                                checked={filterByVehicle}
                                                onChange={(e) => setFilterByVehicle(e.target.checked)}
                                            />
                                            <span>{t('show_vehicle_parts')}</span>
                                        </label>
                                    </div>

                                    <div className="col-span-5">
                                        {newItem.item_type === 'part' ? (
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('select_part')}</label>
                                                <select
                                                    value={newItem.description}
                                                    onChange={(e) => {
                                                        const selectedPart = inventoryParts.find(p => p.name === e.target.value);
                                                        setNewItem({
                                                            ...newItem,
                                                            description: e.target.value,
                                                            unit_price: selectedPart?.selling_price || 0
                                                        });
                                                    }}
                                                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-white dark:bg-neutral-800 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                                                >
                                                    <option value="">{t('select_part_placeholder')}</option>
                                                    {Array.from(new Set(inventoryParts.map(p => p.category || 'Uncategorized'))).map(category => {
                                                        const partsInCategory = inventoryParts
                                                            .filter(p => (p.category || 'Uncategorized') === category)
                                                            .filter(p => {
                                                                if (!filterByVehicle) return true;
                                                                const currentOrder = workOrders.find(o => o.id === editingOrder?.id);
                                                                const vehicle = vehicles.find(v => v.id === currentOrder?.vehicle_id || v.id === form.vehicle_id);
                                                                if (!vehicle) return true;

                                                                const lowerCat = (p.category || '').toLowerCase();
                                                                if (lowerCat.includes('fluid') || lowerCat.includes('shop') || lowerCat.includes('universal') || lowerCat.includes('consumable')) return true;

                                                                const partName = p.name.toLowerCase();
                                                                const make = vehicle.make.toLowerCase();
                                                                const model = vehicle.model.toLowerCase();

                                                                return partName.includes(make) || partName.includes(model);
                                                            });

                                                        if (partsInCategory.length === 0) return null;

                                                        return (
                                                            <optgroup key={category} label={category}>
                                                                {partsInCategory.map(part => (
                                                                    <option key={part.id} value={part.name}>
                                                                        {part.name} - {currency}{part.selling_price?.toFixed(2)} ({part.quantity} in stock)
                                                                    </option>
                                                                ))}
                                                            </optgroup>
                                                        );
                                                    })}
                                                </select>
                                            </div>
                                        ) : (
                                            <Input
                                                label={t('description')}
                                                value={newItem.description}
                                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                                placeholder={t('item_name_placeholder')}
                                            />
                                        )}
                                    </div>
                                    <div className="col-span-2">
                                        <Select
                                            label={t('type')}
                                            value={newItem.item_type}
                                            onChange={(e) => setNewItem({ ...newItem, item_type: e.target.value as any })}
                                            options={[
                                                { value: 'part', label: t('part') },
                                                { value: 'labor', label: t('labor') },
                                                { value: 'other', label: t('other') },
                                            ]}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Input
                                            label={t('qty')}
                                            type="number"
                                            min="0.1"
                                            step="0.1"
                                            value={newItem.quantity.toString()}
                                            onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Input
                                            label={t('price')}
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

                            {/* Create Estimate Section */}
                            {editingOrder && (form.status === 'testing' || form.status === 'in-progress') && lineItems.length > 0 && (
                                <div className="border-t border-neutral-200 pt-4">
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-5 h-5 text-amber-600" />
                                                <div>
                                                    <p className="font-medium text-amber-900">{t('create_estimate')}</p>
                                                    <p className="text-sm text-amber-700">{t('send_estimate_to_customer')}</p>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={() => setIsEstimateModalOpen(true)}
                                                className="bg-amber-600 hover:bg-amber-700"
                                            >
                                                <Send className="w-4 h-4 mr-2" />
                                                {t('create_estimate')}
                                            </Button>
                                        </div>

                                        {(() => {
                                            const existingEstimate = getEstimateForOrder(editingOrder.id);
                                            if (existingEstimate) {
                                                return (
                                                    <div className="mt-3 pt-3 border-t border-amber-200">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            {existingEstimate.status === 'sent' && (
                                                                <>
                                                                    <AlertCircle className="w-4 h-4 text-amber-600" />
                                                                    <span className="text-amber-800">{t('estimate_awaiting_approval')}</span>
                                                                </>
                                                            )}
                                                            {existingEstimate.status === 'approved' && (
                                                                <>
                                                                    <Check className="w-4 h-4 text-emerald-600" />
                                                                    <span className="text-emerald-800">{t('estimate_approved')}</span>
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

                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 mt-4">
                        <Button type="button" variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                        {activeTab === 'details' && <Button type="submit">{editingOrder ? t('edit') : t('add')} {t('work_orders')}</Button>}
                    </div>
                </form>
            </Modal>

            {/* Estimate Modal */}
            <Modal
                isOpen={isEstimateModalOpen}
                onClose={() => { setIsEstimateModalOpen(false); setEstimateNotes(''); }}
                title={t('send_estimate')}
            >
                <div className="space-y-4">
                    <div className="bg-neutral-50 rounded-lg p-4">
                        <h4 className="font-semibold text-sm text-neutral-900 mb-3 border-b pb-2">{t('estimate_preview')}</h4>

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
                                <span className="text-neutral-600">{t('subtotal')}</span>
                                <span>{currency}{calculatedTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                                <span>{t('total')}</span>
                                <span>{currency}{calculatedTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">{t('notes_to_customer')}</label>
                        <Textarea
                            value={estimateNotes}
                            onChange={(e) => setEstimateNotes(e.target.value)}
                            rows={3}
                            placeholder={t('estimate_notes_placeholder')}
                        />
                    </div>

                    <div className="border-t pt-4">
                        <p className="text-sm font-medium text-neutral-700 mb-3">{t('send_via')}</p>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => createEstimate('email')}
                                disabled={sendingEstimate}
                                className="flex-1"
                            >
                                <Mail className="w-4 h-4 mr-2" />
                                {t('email')}
                            </Button>
                            <Button
                                onClick={() => createEstimate('sms')}
                                disabled={sendingEstimate}
                                variant="secondary"
                                className="flex-1"
                            >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                {t('sms')}
                            </Button>
                            <Button
                                onClick={() => createEstimate('print')}
                                disabled={sendingEstimate}
                                variant="secondary"
                                className="flex-1"
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                {t('print')}
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>

            {editingOrder && (
                <InspectionModal
                    key={editingOrder.id}
                    isOpen={isInspectionModalOpen}
                    onClose={() => setIsInspectionModalOpen(false)}
                    workOrderId={editingOrder.id}
                />
            )}
        </>
    );
}
