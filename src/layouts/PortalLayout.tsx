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
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 md:pb-0 font-sans selection:bg-primary/20">
                {/* Mobile Header */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 sticky top-0 z-10 md:hidden flex items-center justify-center shadow-sm">
                    <h1 className="font-bold text-lg text-slate-900 dark:text-slate-100 font-display tracking-tight">{t('my_garage') || 'My Garage'}</h1>
                </div>

                {/* Using a max-width container for desktop view to simulate mobile app feel centrally, or just full width */}
                <div className="max-w-md mx-auto md:max-w-5xl md:p-8 min-h-[calc(100vh-60px)] pt-6 md:pt-10">
                    <Outlet />
                </div>

                {/* Bottom Navigation (Mobile) */}
                <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 flex justify-around items-center h-20 px-2 md:hidden z-20 pb-safe shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
                    {navItems.map((item) => {
                        const isActive = item.exact
                            ? location.pathname === item.path
                            : location.pathname.startsWith(item.path);

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300",
                                    isActive ? "text-primary -translate-y-1" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                )}
                            >
                                {isActive && (
                                    <div className="absolute top-0 w-12 h-1 rounded-b-full bg-primary shadow-[0_2px_10px_rgba(var(--primary),0.5)]" />
                                )}
                                <item.icon className={cn("w-6 h-6 transition-transform duration-300", isActive && "scale-110")} />
                                <span className={cn("text-[10px] font-medium tracking-wide", isActive ? "font-bold" : "font-medium")}>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* Desktop Navigation (Simple Header override for desktop - optional improvement) */}
                <div className="hidden md:flex fixed top-0 left-0 right-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 h-20 items-center w-full px-8 justify-between z-20 shadow-sm transition-all duration-300">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20 text-white">
                            <Car className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-2xl tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                            {t('my_garage') || 'My Garage'}
                        </span>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-full border border-slate-200/50 dark:border-slate-700/50">
                        {navItems.map(item => {
                            const isActive = (item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path));
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 relative overflow-hidden",
                                        isActive
                                            ? "text-primary bg-white dark:bg-slate-900 shadow-sm ring-1 ring-black/5"
                                            : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50"
                                    )}
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        <item.icon className={cn("w-4 h-4", isActive && "fill-current/20")} />
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden lg:block">
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{data.customer.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{data.customer.email}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white dark:ring-slate-900">
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
