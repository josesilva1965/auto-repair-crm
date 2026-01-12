// @ts-nocheck
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../contexts/SettingsContext';
import { supabase, type Estimate, type Customer, type WorkOrder } from '../lib/supabase';
import { DataTable, StatusBadge } from '../components/DataTable';
import { Modal, Button, Input, Select, Textarea } from '../components/Modal';
import { Search, FileText, Check, X, Mail, MessageSquare, Printer, Send, RefreshCw } from 'lucide-react';
import { communicationService } from '../lib/communicationService';

export function Estimates() {
    const { t } = useTranslation();
    const { currency } = useSettings();
    const [estimates, setEstimates] = useState<Estimate[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
    const [estimateItems, setEstimateItems] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedEstimate) {
            loadEstimateItems(selectedEstimate.work_order_id);
        }
    }, [selectedEstimate]);

    async function loadData() {
        setLoading(true);
        const [estimatesRes, customersRes, workOrdersRes] = await Promise.all([
            supabase.from('estimates').select('*').order('created_at', { ascending: false }),
            supabase.from('customers').select('*'),
            supabase.from('work_orders').select('*'),
        ]);
        setEstimates(estimatesRes.data || []);
        setCustomers(customersRes.data || []);
        setWorkOrders(workOrdersRes.data || []);
        setLoading(false);
    }

    async function loadEstimateItems(workOrderId: string) {
        const { data } = await supabase
            .from('work_order_items')
            .select('*')
            .eq('work_order_id', workOrderId);
        setEstimateItems(data || []);
    }

    async function updateEstimateStatus(estimate: Estimate, newStatus: 'approved' | 'rejected') {
        const { error } = await supabase
            .from('estimates')
            .update({
                status: newStatus,
                approved_at: newStatus === 'approved' ? new Date().toISOString() : null
            })
            .eq('id', estimate.id);

        if (!error) {
            // Create notification
            const customer = customers.find(c => c.id === estimate.customer_id);
            await communicationService.createNotification(
                newStatus === 'approved' ? 'estimate_approved' : 'estimate_rejected',
                newStatus === 'approved' ? 'Estimate Approved' : 'Estimate Rejected',
                `${customer?.name || 'Customer'} has ${newStatus} estimate ${estimate.estimate_number}`,
                estimate.work_order_id,
                estimate.customer_id
            );

            loadData();
            setSelectedEstimate(null);
        }
    }

    async function resendEstimate(estimate: Estimate, channel: 'email' | 'sms' | 'print') {
        setSending(true);
        const result = await communicationService.sendDocument({
            type: 'estimate',
            documentId: estimate.id,
            customerId: estimate.customer_id,
            channel
        });

        if (result.success) {
            await supabase
                .from('estimates')
                .update({
                    sent_via: channel,
                    sent_at: new Date().toISOString()
                })
                .eq('id', estimate.id);

            alert(result.message);
            loadData();
        } else {
            alert(result.message);
        }
        setSending(false);
    }

    const filteredEstimates = estimates.filter((e) => {
        const matchSearch = e.estimate_number.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || e.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const getCustomerName = (id: string) => customers.find((c) => c.id === id)?.name || '-';
    const getWorkOrderNumber = (id: string) => workOrders.find((o) => o.id === id)?.id.substring(0, 8) || '-';

    // Summary stats
    const pendingCount = estimates.filter(e => e.status === 'sent').length;
    const approvedCount = estimates.filter(e => e.status === 'approved').length;
    const rejectedCount = estimates.filter(e => e.status === 'rejected').length;

    function getStatusColor(status: string) {
        switch (status) {
            case 'draft': return 'bg-neutral-100 text-neutral-600';
            case 'sent': return 'bg-amber-100 text-amber-700';
            case 'approved': return 'bg-emerald-100 text-emerald-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            case 'expired': return 'bg-neutral-100 text-neutral-500';
            default: return 'bg-neutral-100 text-neutral-600';
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-[32px] font-bold text-neutral-900 dark:text-white">{t('estimates') || 'Estimates'}</h1>
                    <p className="text-neutral-500 dark:text-neutral-400">{t('manage_estimates') || 'Manage customer estimates'}</p>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-card p-6">
                    <div className="flex items-center gap-3">
                        <Send className="w-8 h-8 text-amber-500" />
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('awaiting_response') || 'Awaiting Response'}</p>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{pendingCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-card p-6">
                    <div className="flex items-center gap-3">
                        <Check className="w-8 h-8 text-emerald-500" />
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('approved') || 'Approved'}</p>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{approvedCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-card p-6">
                    <div className="flex items-center gap-3">
                        <X className="w-8 h-8 text-red-500" />
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('rejected') || 'Rejected'}</p>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{rejectedCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder={t('search_estimates') || 'Search estimates...'}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                >
                    <option value="all">{t('all') || 'All'}</option>
                    <option value="draft">{t('draft') || 'Draft'}</option>
                    <option value="sent">{t('sent') || 'Sent'}</option>
                    <option value="approved">{t('approved') || 'Approved'}</option>
                    <option value="rejected">{t('rejected') || 'Rejected'}</option>
                </select>
            </div>

            {/* Estimates Table */}
            <DataTable
                data={filteredEstimates}
                loading={loading}
                onRowClick={setSelectedEstimate}
                columns={[
                    { key: 'estimate_number', header: t('estimate_number') || 'Estimate #', render: (e) => <span className="font-mono font-medium">{e.estimate_number}</span> },
                    { key: 'customer_id', header: t('customer') || 'Customer', render: (e) => getCustomerName(e.customer_id) },
                    { key: 'work_order_id', header: t('work_order') || 'Work Order', render: (e) => `#${getWorkOrderNumber(e.work_order_id)}` },
                    { key: 'total', header: t('total') || 'Total', render: (e) => <span className="font-semibold">{currency}{(e.total ?? 0).toFixed(2)}</span> },
                    {
                        key: 'status',
                        header: t('status') || 'Status',
                        render: (e) => (
                            <span className={`px-2 py-1 text-xs rounded-full font-medium capitalize ${getStatusColor(e.status)}`}>
                                {t(e.status) || e.status}
                            </span>
                        )
                    },
                    { key: 'sent_at', header: t('sent') || 'Sent', render: (e) => e.sent_at ? new Date(e.sent_at).toLocaleDateString() : '-' },
                    { key: 'created_at', header: t('created') || 'Created', render: (e) => new Date(e.created_at).toLocaleDateString() },
                ]}
            />

            {/* Estimate Details Modal */}
            {selectedEstimate && (
                <Modal isOpen={!!selectedEstimate} onClose={() => setSelectedEstimate(null)} title={t('estimate_details') || 'Estimate Details'} size="lg">
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">{selectedEstimate.estimate_number}</h3>
                                <p className="text-neutral-500 dark:text-neutral-400">
                                    {t('created') || 'Created'} {new Date(selectedEstimate.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <span className={`px-3 py-1 text-sm rounded-full font-medium capitalize ${getStatusColor(selectedEstimate.status)}`}>
                                {t(selectedEstimate.status) || selectedEstimate.status}
                            </span>
                        </div>

                        {/* Customer & Work Order Info */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('customer') || 'Customer'}</p>
                                <p className="font-medium text-neutral-900 dark:text-white">{getCustomerName(selectedEstimate.customer_id)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('work_order') || 'Work Order'}</p>
                                <p className="font-medium text-neutral-900 dark:text-white">#{getWorkOrderNumber(selectedEstimate.work_order_id)}</p>
                            </div>
                            {selectedEstimate.sent_at && (
                                <div>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('sent_via') || 'Sent Via'}</p>
                                    <p className="font-medium text-neutral-900 dark:text-white capitalize">
                                        {selectedEstimate.sent_via} - {new Date(selectedEstimate.sent_at).toLocaleString()}
                                    </p>
                                </div>
                            )}
                            {selectedEstimate.approved_at && (
                                <div>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('approved_at') || 'Approved At'}</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">
                                        {new Date(selectedEstimate.approved_at).toLocaleString()}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        {selectedEstimate.notes && (
                            <div className="bg-neutral-50 dark:bg-neutral-700 p-3 rounded-lg">
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{t('notes') || 'Notes'}</p>
                                <p className="text-neutral-900 dark:text-white">{selectedEstimate.notes}</p>
                            </div>
                        )}

                        {/* Line Items */}
                        <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                            <h4 className="font-semibold mb-3 text-sm text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-600 pb-2">
                                {t('itemized_breakdown') || 'Itemized Breakdown'}
                            </h4>
                            {estimateItems.length > 0 ? (
                                <div className="mb-4 space-y-2">
                                    {estimateItems.map((item, i) => (
                                        <div key={i} className="flex text-sm">
                                            <div className="flex-1">
                                                <span className="font-medium text-neutral-900 dark:text-white">{item.description}</span>
                                                <span className="ml-2 text-xs text-neutral-500 bg-neutral-200 dark:bg-neutral-600 px-1.5 py-0.5 rounded capitalize">{item.item_type}</span>
                                            </div>
                                            <div className="w-16 text-right text-neutral-600 dark:text-neutral-400">{item.quantity} x</div>
                                            <div className="w-20 text-right text-neutral-600 dark:text-neutral-400">{currency}{Number(item.unit_price).toFixed(2)}</div>
                                            <div className="w-20 text-right font-medium text-neutral-900 dark:text-white">{currency}{(item.quantity * item.unit_price).toFixed(2)}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-neutral-500 mb-4 italic">{t('no_items') || 'No line items found'}</p>
                            )}

                            {/* Totals */}
                            <div className="space-y-2 border-t border-neutral-200 dark:border-neutral-600 pt-3">
                                <div className="flex justify-between">
                                    <span className="text-neutral-600 dark:text-neutral-400">{t('subtotal') || 'Subtotal'}</span>
                                    <span className="text-neutral-900 dark:text-white">{currency}{(selectedEstimate.subtotal ?? 0).toFixed(2)}</span>
                                </div>
                                {(selectedEstimate.discount ?? 0) > 0 && (
                                    <div className="flex justify-between text-emerald-600">
                                        <span>{t('discount') || 'Discount'}</span>
                                        <span>-{currency}{(selectedEstimate.discount ?? 0).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-neutral-600 dark:text-neutral-400">
                                        {t('tax') || 'Tax'} ({selectedEstimate.subtotal > 0 ? ((selectedEstimate.tax / selectedEstimate.subtotal) * 100).toFixed(1) : '0'}%)
                                    </span>
                                    <span className="text-neutral-900 dark:text-white">{currency}{(selectedEstimate.tax ?? 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t border-neutral-200 dark:border-neutral-600 pt-2">
                                    <span className="text-neutral-900 dark:text-white">{t('total') || 'Total'}</span>
                                    <span className="text-neutral-900 dark:text-white">{currency}{(selectedEstimate.total ?? 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between items-center border-t border-neutral-200 dark:border-neutral-700 pt-4">
                            {selectedEstimate.status === 'sent' && (
                                <>
                                    {/* Resend Options */}
                                    <div className="flex gap-2">
                                        <Button variant="secondary" size="sm" onClick={() => resendEstimate(selectedEstimate, 'email')} disabled={sending}>
                                            <Mail className="w-4 h-4 mr-2" />
                                            {t('resend_email') || 'Resend Email'}
                                        </Button>
                                        <Button variant="secondary" size="sm" onClick={() => resendEstimate(selectedEstimate, 'sms')} disabled={sending}>
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            {t('resend_sms') || 'Resend SMS'}
                                        </Button>
                                        <Button variant="secondary" size="sm" onClick={() => resendEstimate(selectedEstimate, 'print')} disabled={sending}>
                                            <Printer className="w-4 h-4 mr-2" />
                                            {t('print') || 'Print'}
                                        </Button>
                                    </div>

                                    {/* Approval Actions */}
                                    <div className="flex gap-2">
                                        <Button
                                            variant="secondary"
                                            className="border-red-200 text-red-600 hover:bg-red-50"
                                            onClick={() => updateEstimateStatus(selectedEstimate, 'rejected')}
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            {t('mark_rejected') || 'Mark Rejected'}
                                        </Button>
                                        <Button
                                            className="bg-emerald-600 hover:bg-emerald-700"
                                            onClick={() => updateEstimateStatus(selectedEstimate, 'approved')}
                                        >
                                            <Check className="w-4 h-4 mr-2" />
                                            {t('mark_approved') || 'Mark Approved'}
                                        </Button>
                                    </div>
                                </>
                            )}

                            {selectedEstimate.status === 'draft' && (
                                <div className="flex gap-2 ml-auto">
                                    <Button variant="secondary" size="sm" onClick={() => resendEstimate(selectedEstimate, 'email')} disabled={sending}>
                                        <Mail className="w-4 h-4 mr-2" />
                                        {t('send_email') || 'Send Email'}
                                    </Button>
                                    <Button variant="secondary" size="sm" onClick={() => resendEstimate(selectedEstimate, 'sms')} disabled={sending}>
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        {t('send_sms') || 'Send SMS'}
                                    </Button>
                                    <Button variant="secondary" size="sm" onClick={() => resendEstimate(selectedEstimate, 'print')} disabled={sending}>
                                        <Printer className="w-4 h-4 mr-2" />
                                        {t('print') || 'Print'}
                                    </Button>
                                </div>
                            )}

                            {(selectedEstimate.status === 'approved' || selectedEstimate.status === 'rejected') && (
                                <div className="ml-auto">
                                    <Button variant="secondary" onClick={() => setSelectedEstimate(null)}>
                                        {t('close') || 'Close'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
