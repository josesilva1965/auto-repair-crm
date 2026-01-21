import { usePortal } from '../../layouts/PortalLayout';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Calendar, Wrench, AlertCircle, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';

export function PortalHome() {
    const { data } = usePortal();
    const { t } = useTranslation();
    const { token } = useParams<{ token: string }>();

    if (!data) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 p-4 md:p-0">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-neutral-900">{t('welcome_back') || 'Welcome back'}, {data.customer.name.split(' ')[0]}!</h2>
                    <p className="text-neutral-500">{t('portal_subtitle') || 'Here is what\'s happening with your vehicles.'}</p>
                </div>
            </div>

            {/* Active Work Orders */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-primary" />
                        {t('active_jobs') || 'Active Jobs'}
                    </h3>
                </div>

                {data.active_orders.length > 0 ? (
                    <div className="grid gap-4">
                        {data.active_orders.map(order => (
                            <Card key={order.id} className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-neutral-900">{order.vehicle_name}</h4>
                                            <p className="text-sm text-neutral-500">#{order.order_number}</p>
                                        </div>
                                        <Badge variant={
                                            order.status === 'approved' ? 'default' :
                                                order.status === 'in-progress' ? 'secondary' : 'outline'
                                        }>
                                            {t(`status_${order.status}`) || order.status}
                                        </Badge>
                                    </div>

                                    <p className="text-sm text-neutral-600 mb-3 bg-neutral-50 p-2 rounded-md">
                                        {order.description || t('no_description') || 'No description provided.'}
                                    </p>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-neutral-500">{format(new Date(order.created_at), 'MMM d, yyyy')}</span>
                                        {order.estimated_cost > 0 && (
                                            <span className="font-semibold text-neutral-900">
                                                ~${order.estimated_cost.toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="bg-neutral-50 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2" />
                            <p className="font-medium text-neutral-900">{t('no_active_jobs') || 'All caught up!'}</p>
                            <p className="text-sm text-neutral-500 mb-4">{t('no_active_jobs_desc') || 'You have no active maintenance jobs at the moment.'}</p>
                            <Button asChild variant="outline">
                                <Link to={`/portal/${token}/booking`}>
                                    {t('book_service') || 'Book Service'}
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </section>

            {/* Quick Actions */}
            <section className="grid grid-cols-2 gap-4">
                <Link to={`/portal/${token}/booking`} className="block">
                    <Card className="h-full hover:bg-primary/5 transition-colors cursor-pointer border-primary/20">
                        <CardContent className="p-4 flex flex-col items-center text-center justify-center h-full gap-2">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <span className="font-semibold text-sm">{t('book_appointment') || 'Book Appointment'}</span>
                        </CardContent>
                    </Card>
                </Link>
                <Link to={`/portal/${token}/vehicles`} className="block">
                    <Card className="h-full hover:bg-neutral-50 transition-colors cursor-pointer">
                        <CardContent className="p-4 flex flex-col items-center text-center justify-center h-full gap-2">
                            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
                                <Wrench className="w-5 h-5" />
                            </div>
                            <span className="font-semibold text-sm">{t('my_vehicles') || 'My Vehicles'}</span>
                        </CardContent>
                    </Card>
                </Link>
            </section>
        </div>
    );
}
