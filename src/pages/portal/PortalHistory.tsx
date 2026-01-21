import { usePortal } from '../../layouts/PortalLayout';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../../components/ui/card';
import { Calendar, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { useSettings } from '../../contexts/SettingsContext';

export function PortalHistory() {
    const { data } = usePortal();
    const { t } = useTranslation();
    const { currency } = useSettings();

    if (!data) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 p-4 md:p-0">
            <h2 className="text-2xl font-bold text-neutral-900">{t('service_history') || 'Service History'}</h2>

            <div className="space-y-4">
                {data.history.length > 0 ? (
                    data.history.map((order) => (
                        <Card key={order.id} className="group hover:bg-neutral-50 transition-colors">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold text-neutral-900">{order.vehicle_name}</h4>
                                        <p className="text-sm text-neutral-500">INV-{order.order_number}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-neutral-900">
                                            {currency}{order.total_cost.toFixed(2)}
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                                            {t('completed') || 'Completed'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mt-3 text-sm text-neutral-500 border-t pt-3">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {order.completed_date ? format(new Date(order.completed_date), 'MMM d, yyyy') : 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-1 ml-auto">
                                        <Receipt className="w-4 h-4" />
                                        {t('view_invoice') || 'View Invoice'}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-12 text-neutral-500 bg-white rounded-lg border border-dashed">
                        <p>{t('no_history') || 'No service history found.'}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
