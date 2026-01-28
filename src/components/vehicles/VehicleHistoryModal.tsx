import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { supabase, Vehicle, ServiceHistory, WorkOrder, WorkOrderItem, Technician, Invoice } from '../../lib/supabase';
import { Modal, Button } from '../Modal';
import {
    ChevronDown,
    ChevronRight,
    Wrench,
    Package,
    Clock,
    DollarSign,
    User,
    FileText,
    CheckCircle,
    AlertCircle,
    Calendar,
    Gauge,
    ClipboardCheck
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSettings } from '../../contexts/SettingsContext';

interface VehicleHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    vehicle: Vehicle;
    customerName: string;
}

interface ExpandedState {
    [key: string]: boolean;
}

export function VehicleHistoryModal({ isOpen, onClose, vehicle, customerName }: VehicleHistoryModalProps) {
    const { t } = useTranslation();
    const { currency } = useSettings();
    const [expanded, setExpanded] = useState<ExpandedState>({});

    // Fetch all related data
    const { data: workOrders = [] } = useQuery({
        queryKey: ['vehicle-work-orders', vehicle.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('work_orders')
                .select('*')
                .eq('vehicle_id', vehicle.id)
                .order('created_at', { ascending: false });
            return data || [];
        },
        enabled: isOpen
    });

    const { data: serviceHistory = [] } = useQuery({
        queryKey: ['vehicle-service-history', vehicle.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('service_history')
                .select('*')
                .eq('vehicle_id', vehicle.id)
                .order('service_date', { ascending: false });
            return data || [];
        },
        enabled: isOpen
    });

    const { data: technicians = [] } = useQuery({
        queryKey: ['technicians'],
        queryFn: async () => {
            const { data } = await supabase.from('technicians').select('*');
            return data || [];
        },
        enabled: isOpen
    });

    const { data: workOrderItems = [] } = useQuery({
        queryKey: ['work-order-items', vehicle.id],
        queryFn: async () => {
            const woIds = workOrders.map(wo => wo.id);
            if (woIds.length === 0) return [];
            const { data } = await supabase
                .from('work_order_items')
                .select('*')
                .in('work_order_id', woIds);
            return data || [];
        },
        enabled: isOpen && workOrders.length > 0
    });

    const { data: invoices = [] } = useQuery({
        queryKey: ['vehicle-invoices', vehicle.id],
        queryFn: async () => {
            const woIds = workOrders.map(wo => wo.id);
            if (woIds.length === 0) return [];
            const { data } = await supabase
                .from('invoices')
                .select('*')
                .in('work_order_id', woIds);
            return data || [];
        },
        enabled: isOpen && workOrders.length > 0
    });

    const { data: inspections = [] } = useQuery({
        queryKey: ['vehicle-inspections', vehicle.id],
        queryFn: async () => {
            const woIds = workOrders.map(wo => wo.id);
            if (woIds.length === 0) return [];
            const { data } = await supabase
                .from('inspections')
                .select('*')
                .in('work_order_id', woIds);
            return data || [];
        },
        enabled: isOpen && workOrders.length > 0
    });

    // Calculate summary stats
    const stats = useMemo(() => {
        const totalServices = workOrders.length;
        const totalSpent = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const completedServices = workOrders.filter(wo =>
            ['completed', 'billed', 'closed', 'archived'].includes(wo.status)
        ).length;
        return { totalServices, totalSpent, completedServices };
    }, [workOrders, invoices]);

    const toggleExpand = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const getTechnicianName = (id: string | null) => {
        if (!id) return t('unassigned') || 'Unassigned';
        return technicians.find(t => t.id === id)?.name || t('unknown') || 'Unknown';
    };

    const getItemsForWorkOrder = (woId: string) => {
        return workOrderItems.filter(item => item.work_order_id === woId);
    };

    const getInvoiceForWorkOrder = (woId: string) => {
        return invoices.find(inv => inv.work_order_id === woId);
    };

    const getInspectionForWorkOrder = (woId: string) => {
        return inspections.find(insp => insp.work_order_id === woId);
    };

    const getStatusBadge = (status: string) => {
        const statusColors: Record<string, string> = {
            'completed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            'billed': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'in-progress': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            'pending': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
            'archived': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        };
        return statusColors[status] || statusColors['pending'];
    };

    const formatCurrency = (amount: number) => {
        return `${currency}${amount.toFixed(2)}`;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('service_history') || 'Service History'}
            size="xl"
        >
            <div className="space-y-6">
                {/* Vehicle Header */}
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-foreground">
                                {vehicle.year} {vehicle.make} {vehicle.model}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {t('owner')}: {customerName} • {t('license_plate')}: {vehicle.license_plate || '-'}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Gauge className="w-4 h-4" />
                                {vehicle.mileage?.toLocaleString() || '-'} mi
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-1">
                            <Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">{t('total_services') || 'Total Services'}</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalServices}</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">{t('completed') || 'Completed'}</span>
                        </div>
                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.completedServices}</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span className="text-sm font-medium text-amber-900 dark:text-amber-100">{t('total_spent') || 'Total Spent'}</span>
                        </div>
                        <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{formatCurrency(stats.totalSpent)}</p>
                    </div>
                </div>

                {/* Service Timeline */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    <h4 className="font-semibold text-foreground sticky top-0 bg-background py-2">
                        {t('service_timeline') || 'Service Timeline'}
                    </h4>

                    {workOrders.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>{t('no_service_history') || 'No service history'}</p>
                        </div>
                    ) : (
                        workOrders.map((wo, index) => {
                            const isExpanded = expanded[wo.id];
                            const items = getItemsForWorkOrder(wo.id);
                            const invoice = getInvoiceForWorkOrder(wo.id);
                            const inspection = getInspectionForWorkOrder(wo.id);
                            const parts = items.filter(i => i.item_type === 'part');
                            const labor = items.filter(i => i.item_type === 'labor');

                            return (
                                <div
                                    key={wo.id}
                                    className={cn(
                                        "border border-border rounded-lg overflow-hidden transition-all",
                                        isExpanded ? "bg-muted/30" : "bg-background hover:bg-muted/20"
                                    )}
                                >
                                    {/* Service Header - Clickable */}
                                    <button
                                        onClick={() => toggleExpand(wo.id)}
                                        className="w-full p-4 flex items-start gap-3 text-left"
                                    >
                                        {/* Timeline Indicator */}
                                        <div className="flex flex-col items-center pt-1">
                                            <div className={cn(
                                                "w-3 h-3 rounded-full",
                                                ['completed', 'billed', 'archived'].includes(wo.status)
                                                    ? "bg-emerald-500"
                                                    : "bg-amber-500"
                                            )} />
                                            {index < workOrders.length - 1 && (
                                                <div className="w-0.5 h-full bg-border mt-1" />
                                            )}
                                        </div>

                                        {/* Main Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-2">
                                                    {isExpanded ? (
                                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                                    )}
                                                    <span className="font-medium text-foreground truncate">
                                                        {wo.description || `${t('work_order')} #${wo.id.substring(0, 8)}`}
                                                    </span>
                                                </div>
                                                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getStatusBadge(wo.status))}>
                                                    {t(wo.status) || wo.status}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {wo.scheduled_date ? format(parseISO(wo.scheduled_date), 'MMM d, yyyy') : '-'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {getTechnicianName(wo.technician_id)}
                                                </span>
                                                {invoice && (
                                                    <span className="flex items-center gap-1 font-medium text-foreground">
                                                        <DollarSign className="w-3 h-3" />
                                                        {formatCurrency(invoice.total)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="px-4 pb-4 pt-0 ml-6 space-y-4 border-t border-border/50">
                                            {/* Diagnosis/Notes */}
                                            {wo.diagnosis && (
                                                <div className="mt-3">
                                                    <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                                        {t('diagnosis') || 'Diagnosis'}
                                                    </h5>
                                                    <p className="text-sm text-foreground bg-muted/50 p-2 rounded">
                                                        {wo.diagnosis}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Parts Used */}
                                            {parts.length > 0 && (
                                                <div>
                                                    <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                                                        <Package className="w-3 h-3" />
                                                        {t('parts_used') || 'Parts Used'}
                                                    </h5>
                                                    <div className="space-y-1">
                                                        {parts.map(part => (
                                                            <div key={part.id} className="flex justify-between text-sm">
                                                                <span className="text-foreground">
                                                                    {part.description} <span className="text-muted-foreground">x{part.quantity}</span>
                                                                </span>
                                                                <span className="font-medium">{formatCurrency(part.total_price)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Labor Performed */}
                                            {labor.length > 0 && (
                                                <div>
                                                    <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {t('labor_performed') || 'Labor Performed'}
                                                    </h5>
                                                    <div className="space-y-1">
                                                        {labor.map(item => (
                                                            <div key={item.id} className="flex justify-between text-sm">
                                                                <span className="text-foreground">
                                                                    {item.description} <span className="text-muted-foreground">({item.quantity}h)</span>
                                                                </span>
                                                                <span className="font-medium">{formatCurrency(item.total_price)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Inspection Results */}
                                            {inspection && (
                                                <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                                                    <h5 className="text-xs font-medium text-primary uppercase tracking-wide mb-1 flex items-center gap-1">
                                                        <ClipboardCheck className="w-3 h-3" />
                                                        {t('inspection_performed') || 'Inspection Performed'}
                                                    </h5>
                                                    <p className="text-sm text-muted-foreground">
                                                        {t('dvi_completed') || 'Digital Vehicle Inspection completed'}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Cost Summary */}
                                            {invoice && (
                                                <div className="pt-3 border-t border-border/50">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">{t('subtotal') || 'Subtotal'}</span>
                                                        <span>{formatCurrency(invoice.subtotal)}</span>
                                                    </div>
                                                    {invoice.discount > 0 && (
                                                        <div className="flex justify-between text-sm text-emerald-600">
                                                            <span>{t('discount') || 'Discount'}</span>
                                                            <span>-{formatCurrency(invoice.discount)}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">{t('tax') || 'Tax'}</span>
                                                        <span>{formatCurrency(invoice.tax)}</span>
                                                    </div>
                                                    <div className="flex justify-between font-bold mt-1 pt-1 border-t border-border/50">
                                                        <span>{t('total') || 'Total'}</span>
                                                        <span>{formatCurrency(invoice.total)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-2 text-xs">
                                                        {invoice.status === 'paid' ? (
                                                            <span className="flex items-center gap-1 text-emerald-600">
                                                                <CheckCircle className="w-3 h-3" />
                                                                {t('paid') || 'Paid'}
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-amber-600">
                                                                <AlertCircle className="w-3 h-3" />
                                                                {t(invoice.status) || invoice.status}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* No items message */}
                                            {items.length === 0 && !invoice && !inspection && (
                                                <p className="text-sm text-muted-foreground italic mt-3">
                                                    {t('no_details_available') || 'No detailed information available'}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end pt-4 border-t border-border">
                    <Button variant="secondary" onClick={onClose}>
                        {t('close') || 'Close'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
