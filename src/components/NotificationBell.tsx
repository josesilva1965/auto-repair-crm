import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { supabase, type Notification } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { cn } from '@/lib/utils';

export function NotificationBell() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();

        const channel = supabase
            .channel('notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
                loadNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function loadNotifications() {
        setLoading(true);
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        setNotifications(data || []);
        setLoading(false);
    }

    async function markAsRead(id: string) {
        await supabase.from('notifications').update({ read: true }).eq('id', id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }

    async function markAllAsRead() {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length === 0) return;

        await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }

    function handleNotificationClick(notification: Notification) {
        markAsRead(notification.id);
        setIsOpen(false);

        if (notification.type === 'estimate_approved' || notification.type === 'estimate_rejected') {
            navigate('/estimates');
        } else if (notification.type === 'invoice_paid') {
            navigate('/billing');
        } else if (notification.type === 'message_received') {
            navigate('/messages');
        } else if (notification.type === 'job_completed') {
            navigate('/work-orders');
        }
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    function getNotificationIcon(type: Notification['type']) {
        switch (type) {
            case 'estimate_approved':
                return <Check className="w-4 h-4 text-emerald-500" />;
            case 'estimate_rejected':
                return <X className="w-4 h-4 text-destructive" />;
            case 'invoice_paid':
                return <Check className="w-4 h-4 text-emerald-500" />;
            case 'job_completed':
                return <Check className="w-4 h-4 text-emerald-500" />;
            default:
                return <Bell className="w-4 h-4 text-primary" />;
        }
    }

    function formatTime(dateString: string) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return t('just_now') || 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleDateString();
    }

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="relative"
            >
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-destructive border-2 border-background rounded-full" />
                )}
            </Button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    <Card className="absolute right-0 top-full mt-2 w-80 z-50 overflow-hidden shadow-xl border-border/50 bg-card/95 backdrop-blur-md">
                        <div className="p-3 border-b border-border flex items-center justify-between">
                            <h3 className="font-semibold text-sm">{t('notifications') || 'Notifications'}</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-medium"
                                >
                                    <CheckCheck className="w-3 h-3" />
                                    {t('mark_all_read') || 'Mark all read'}
                                </button>
                            )}
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="p-4 text-center text-xs text-muted-foreground">{t('loading') || 'Loading...'}</div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">{t('no_notifications') || 'No notifications'}</p>
                                </div>
                            ) : (
                                notifications.map(notification => (
                                    <button
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={cn(
                                            "w-full p-3 text-left border-b border-border/50 hover:bg-muted/50 transition-colors flex gap-3",
                                            !notification.read && "bg-primary/5"
                                        )}
                                    >
                                        <div className="flex-shrink-0 mt-0.5 p-1.5 bg-background rounded-full border border-border shadow-sm">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn("text-xs font-medium", !notification.read ? "text-foreground" : "text-muted-foreground")}>
                                                {notification.title}
                                            </p>
                                            {notification.message && (
                                                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                                    {notification.message}
                                                </p>
                                            )}
                                            <p className="text-[10px] text-muted-foreground/60 mt-1">
                                                {formatTime(notification.created_at)}
                                            </p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}
