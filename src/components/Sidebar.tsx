import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { useSettings } from '../contexts/SettingsContext';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import {
    LayoutDashboard,
    Users,
    ClipboardList,
    Package,
    Car,
    Receipt,
    BarChart3,
    Wrench,
    MessageSquare,
    Bell,
    Settings,
    Calendar,
    PanelLeftClose,
    PanelLeftOpen,
    Sun,
    Moon,
    LogOut,
    ChevronRight
} from 'lucide-react';

const navItems = [
    {
        group: 'Overview', items: [
            { path: '/', label: 'dashboard', icon: LayoutDashboard },
            { path: '/bookings', label: 'bookings', icon: Calendar },
        ]
    },
    {
        group: 'Operations', items: [
            { path: '/work-orders', label: 'work_orders', icon: ClipboardList },
            { path: '/customers', label: 'customers', icon: Users },
            { path: '/vehicles', label: 'vehicles', icon: Car },
            { path: '/inventory', label: 'inventory', icon: Package },
        ]
    },
    {
        group: 'Management', items: [
            { path: '/billing', label: 'billing', icon: Receipt },
            { path: '/reports', label: 'reports', icon: BarChart3 },
            { path: '/technicians', label: 'technicians', icon: Wrench },
        ]
    },
    {
        group: 'Communication', items: [
            { path: '/messages', label: 'messages', icon: MessageSquare },
            { path: '/reminders', label: 'reminders', icon: Bell },
        ]
    },
    {
        group: 'System', items: [
            { path: '/settings', label: 'settings', icon: Settings },
        ]
    }
];

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    isMobile: boolean;
}

export function Sidebar({ isOpen, setIsOpen, isMobile }: SidebarProps) {
    const { t } = useTranslation();
    const location = useLocation();
    const { theme, setTheme } = useTheme();
    const { emailSettings } = useSettings();

    // Close sidebar on route change for mobile
    useEffect(() => {
        if (isMobile && isOpen) {
            setIsOpen(false);
        }
    }, [location.pathname, isMobile]);

    return (
        <>
            {/* Mobile Overlay */}
            {isMobile && isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-screen bg-card border-r border-border transition-all duration-300 ease-in-out flex flex-col",
                    isOpen ? "w-64 translate-x-0" : isMobile ? "-translate-x-full" : "w-[72px]"
                )}
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-border">
                    <div className={cn("flex items-center gap-3 overflow-hidden", !isOpen && "justify-center w-full")}>
                        <div className="min-w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20">
                            <Wrench className="w-4 h-4" />
                        </div>
                        <div className={cn("flex flex-col transition-opacity duration-200", !isOpen && "hidden opacity-0")}>
                            <span className="font-bold text-sm tracking-tight truncate max-w-[140px]">
                                {emailSettings.shop_name || 'AutoShop'}
                            </span>
                            {!emailSettings.shop_name && (
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">CRM Pro</span>
                            )}
                        </div>
                    </div>

                    {isOpen && !isMobile && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                            <PanelLeftClose className="w-4 h-4 text-muted-foreground" />
                        </Button>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                    <nav className="space-y-6 px-3">
                        {navItems.map((group, groupIndex) => (
                            <div key={group.group}>
                                {isOpen && (
                                    <h4 className="mb-2 text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider px-2">
                                        {group.group}
                                    </h4>
                                )}
                                <div className="space-y-1">
                                    {group.items.map((item) => {
                                        const isActive = location.pathname === item.path;
                                        return (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                className={cn(
                                                    "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                                    isActive
                                                        ? "bg-primary/10 text-primary shadow-sm"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                                                    !isOpen && "justify-center px-0 py-3"
                                                )}
                                                onClick={() => isMobile && setIsOpen(false)}
                                            >
                                                <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />

                                                {isOpen && (
                                                    <span className="flex-1 truncate">{t(item.label)}</span>
                                                )}

                                                {isOpen && isActive && (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_2px_rgba(var(--primary),0.5)]" />
                                                )}

                                                {!isOpen && (
                                                    // Tooltip-like popup for collapsed state (simplified)
                                                    <div className="absolute left-full ml-4 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap border border-border">
                                                        {t(item.label)}
                                                    </div>
                                                )}
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border space-y-2">
                    {isOpen ? (
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 shadow-md" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">Admin User</p>
                                    <p className="text-xs text-muted-foreground truncate">admin@autoshop.com</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="w-full text-xs h-8" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                                    {theme === 'dark' ? <Sun className="w-3 h-3 mr-2" /> : <Moon className="w-3 h-3 mr-2" />}
                                    Theme
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button variant="ghost" size="icon" className="w-full" onClick={() => isOpen ? setIsOpen(false) : setIsOpen(true)}>
                            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </Button>
                    )}

                    {!isOpen && !isMobile && (
                        <Button variant="ghost" size="icon" className="w-full text-muted-foreground" onClick={() => setIsOpen(true)}>
                            <PanelLeftOpen className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </aside>
        </>
    );
}
