import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { supabase, type Notification } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function NotificationBell() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();

        // Set up real-time subscription for new notifications
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

        // Navigate based on notification type
        if (notification.type === 'estimate_approved' || notification.type === 'estimate_rejected') {
            navigate('/estimates');
        } else if (notification.type === 'invoice_paid') {
            navigate('/billing');
        } else if (notification.type === 'message_received') {
            navigate('/messages');
        }
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    function getNotificationIcon(type: Notification['type']) {
        switch (type) {
            case 'estimate_approved':
                return <Check className="w-4 h-4 text-emerald-500" />;
            case 'estimate_rejected':
                return <X className="w-4 h-4 text-red-500" />;
            case 'invoice_paid':
                return <Check className="w-4 h-4 text-emerald-500" />;
            default:
                return <Bell className="w-4 h-4 text-primary-500" />;
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
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
                <Bell className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 z-50 overflow-hidden">
                        <div className="p-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                            <h3 className="font-semibold text-neutral-900 dark:text-white">{t('notifications') || 'Notifications'}</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                >
                                    <CheckCheck className="w-3 h-3" />
                                    {t('mark_all_read') || 'Mark all read'}
                                </button>
                            )}
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="p-4 text-center text-neutral-500">{t('loading') || 'Loading...'}</div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>{t('no_notifications') || 'No notifications'}</p>
                                </div>
                            ) : (
                                notifications.map(notification => (
                                    <button
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`w-full p-3 text-left border-b border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors ${!notification.read ? 'bg-primary-50/50 dark:bg-primary-900/20' : ''
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 mt-0.5">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${!notification.read ? 'font-semibold' : ''} text-neutral-900 dark:text-white`}>
                                                    {notification.title}
                                                </p>
                                                {notification.message && (
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                                        {notification.message}
                                                    </p>
                                                )}
                                                <p className="text-xs text-neutral-400 mt-1">
                                                    {formatTime(notification.created_at)}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
