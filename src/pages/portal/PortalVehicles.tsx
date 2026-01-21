import { usePortal } from '../../layouts/PortalLayout';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../../components/ui/card';
import { Car, Fuel } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

export function PortalVehicles() {
    const { data } = usePortal();
    const { t } = useTranslation();

    if (!data) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 p-4 md:p-0">
            <h2 className="text-2xl font-bold text-neutral-900">{t('my_vehicles') || 'My Vehicles'}</h2>

            <div className="grid gap-4">
                {data.vehicles.map((vehicle) => (
                    <Card key={vehicle.id} className="overflow-hidden">
                        <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
                        <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                                    <Car className="w-6 h-6 text-neutral-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-lg text-neutral-900">
                                            {vehicle.year} {vehicle.make} {vehicle.model}
                                        </h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <Badge variant="secondary" className="font-mono text-xs">
                                            {vehicle.license_plate || 'NO PLATE'}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs text-neutral-500">
                                            VIN: {vehicle.vin || 'N/A'}
                                        </Badge>
                                    </div>
                                    {vehicle.color && (
                                        <div className="flex items-center gap-2 mt-3 text-sm text-neutral-500">
                                            <div
                                                className="w-3 h-3 rounded-full border border-neutral-200 shadow-sm"
                                                style={{ backgroundColor: vehicle.color }}
                                            />
                                            <span className="capitalize">{vehicle.color}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
