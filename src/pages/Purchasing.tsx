import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase, type PurchaseOrder } from '../lib/supabase';
import { DataTable, StatusBadge } from '../components/DataTable';
import { Button } from '../components/Modal';
import { Check, Trash2, ShoppingCart, Loader, PackageCheck } from 'lucide-react';

export function Purchasing() {
    const { t } = useTranslation();
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrders();

        const channel = supabase
            .channel('purchase_orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_orders' }, () => {
                loadOrders();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function loadOrders() {
        setLoading(true);
        const { data, error } = await supabase
            .from('purchase_orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error(error);
        setOrders(data || []);
        setLoading(false);
    }

    async function handleAction(id: string, action: 'ordered' | 'delete' | 'received') {
        if (action === 'delete') {
            const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
            if (error) {
                console.error('Error deleting order:', error);
                return;
            }
        } else {
            const { error } = await supabase
                .from('purchase_orders')
                .update({ status: action })
                .eq('id', id);

            if (error) {
                console.error('Error updating order:', error);
                return;
            }
        }
        loadOrders();
    }

    const columns = [
        { header: t('part_name') || 'Part Name', key: 'part_name' },
        { header: t('part_number') || 'Part Number', key: 'part_number' },
        {
            header: t('quantity') || 'Quantity',
            key: 'quantity',
            render: (order: PurchaseOrder) => order.quantity.toString()
        },
        {
            header: t('est_cost') || 'Est. Cost',
            key: 'estimated_cost',
            render: (order: PurchaseOrder) => `$${(order.estimated_cost || 0).toFixed(2)}`
        },
        {
            header: t('status') || 'Status',
            key: 'status',
            render: (order: PurchaseOrder) => (
                <StatusBadge status={order.status} />
            )
        },
        {
            header: t('actions') || 'Actions',
            key: 'actions',
            render: (order: PurchaseOrder) => (
                <div className="flex gap-2 justify-end">
                    {order.status === 'pending' && (
                        <>
                            <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => handleAction(order.id, 'ordered')}
                                title={t('approve_order') || "Approve & Order"}
                            >
                                <Check className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="danger"
                                onClick={() => {
                                    if (confirm(t('confirm_delete') || 'Are you sure?')) {
                                        handleAction(order.id, 'delete');
                                    }
                                }}
                                title={t('delete_order') || "Delete Order"}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </>
                    )}
                    {order.status === 'ordered' && (
                        <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => handleAction(order.id, 'received')}
                            title={t('mark_received') || "Mark as Received"}
                        >
                            <PackageCheck className="w-4 h-4 mr-1" />
                            {t('receive') || 'Receive'}
                        </Button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6" />
                    {t('purchasing') || 'Purchasing & Orders'}
                </h1>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center p-8"><Loader className="w-8 h-8 animate-spin text-primary-500" /></div>
                ) : (
                    <DataTable
                        data={orders}
                        columns={columns}
                    />
                )}
            </div>
        </div>
    );
}
