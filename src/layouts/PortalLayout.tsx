import { createContext, useContext, useEffect, useState } from 'react';
import { Outlet, useParams, useLocation, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, Home, Car, History, CalendarPlus, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

// Types for Portal Data
export type PortalData = {
    customer: {
        id: string;
        name: string;
        email: string;
        phone: string;
    };
    vehicles: Array<{
        id: string;
        make: string;
        model: string;
        year: number;
        license_plate: string;
        vin: string;
        color: string;
    }>;
    active_orders: Array<{
        id: string;
        order_number: string;
        status: string;
        vehicle_name: string;
        created_at: string;
        description: string;
        estimated_cost: number;
    }>;
    history: Array<{
        id: string;
        order_number: string;
        status: string;
        vehicle_name: string;
        completed_date: string;
        total_cost: number;
    }>;
};

type PortalContextType = {
    data: PortalData | null;
    loading: boolean;
    refresh: () => Promise<void>;
};

const PortalContext = createContext<PortalContextType>({
    data: null,
    loading: true,
    refresh: async () => { },
});

export const usePortal = () => useContext(PortalContext);

export function PortalLayout() {
    const { token } = useParams<{ token: string }>();
    const [data, setData] = useState<PortalData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const location = useLocation();
    const { t } = useTranslation();

    const fetchData = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const { data: response, error: rpcError } = await supabase.rpc('get_customer_portal_data', {
                p_token: token
            });

            if (rpcError) throw rpcError;

            // Handle custom error response from RPC
            if (response && response.success === false) {
                throw new Error(response.message || 'Invalid token');
            }

            setData(response as PortalData);
        } catch (err: any) {
            console.error('Portal fetch error:', err);
            setError(err.message || 'Failed to load portal data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-50">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 p-4 text-center">
                <LogOut className="w-12 h-12 text-neutral-300 mb-4" />
                <h1 className="text-xl font-bold text-neutral-900 mb-2">{t('access_denied') || 'Access Denied'}</h1>
                <p className="text-neutral-500 max-w-xs mx-auto">
                    {t('invalid_portal_link') || 'This portal link is invalid or has expired. Please contact the shop for a new link.'}
                </p>
            </div>
        );
    }

    const navItems = [
        { path: `/portal/${token}`, icon: Home, label: t('home') || 'Home', exact: true },
        { path: `/portal/${token}/vehicles`, icon: Car, label: t('vehicles') || 'Vehicles' },
        { path: `/portal/${token}/booking`, icon: CalendarPlus, label: t('book') || 'Book' },
        { path: `/portal/${token}/history`, icon: History, label: t('history') || 'History' },
    ];

    return (
        <PortalContext.Provider value={{ data, loading, refresh: fetchData }}>
            <div className="min-h-screen bg-neutral-50 pb-20 md:pb-0">
                {/* Mobile Header */}
                <div className="bg-white border-b px-4 py-3 sticky top-0 z-10 md:hidden flex items-center justify-center shadow-sm">
                    <h1 className="font-semibold text-lg text-neutral-900">{t('my_garage') || 'My Garage'}</h1>
                </div>

                {/* Using a max-width container for desktop view to simulate mobile app feel centrally, or just full width */}
                <div className="max-w-md mx-auto md:max-w-4xl md:p-8 min-h-[calc(100vh-60px)]">
                    <Outlet />
                </div>

                {/* Bottom Navigation (Mobile) */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center h-16 px-2 md:hidden z-20 pb-safe">
                    {navItems.map((item) => {
                        const isActive = item.exact
                            ? location.pathname === item.path
                            : location.pathname.startsWith(item.path);

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-full space-y-1",
                                    isActive ? "text-primary" : "text-neutral-400 hover:text-neutral-600"
                                )}
                            >
                                <item.icon className={cn("w-6 h-6", isActive && "fill-current/10")} />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* Desktop Navigation (Simple Header override for desktop - optional improvement) */}
                <div className="hidden md:flex fixed top-0 left-0 right-0 bg-white border-b h-16 items-center w-full px-8 justify-between z-20 shadow-sm">
                    <div className="flex items-center gap-2">
                        <Car className="w-6 h-6 text-primary" />
                        <span className="font-bold text-xl">{t('my_garage') || 'My Garage'}</span>
                    </div>

                    <div className="flex items-center gap-6">
                        {navItems.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-primary",
                                    (item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path))
                                        ? "text-primary border-b-2 border-primary py-5"
                                        : "text-neutral-500"
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <span>{data.customer.name}</span>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {data.customer.name.charAt(0)}
                        </div>
                    </div>
                </div>

                {/* Spacer for desktop header */}
                <div className="hidden md:block h-16"></div>

            </div>
        </PortalContext.Provider>
    );
}
