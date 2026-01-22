// @ts-nocheck
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase, type Customer } from '../lib/supabase';
import { Button, Input } from '../components/Modal';
import { Search, Send, MessageSquare, User, ChevronLeft, Sparkles, Loader } from 'lucide-react';
import { aiService } from '../lib/aiService';

type Message = {
    id: string;
    customer_id: string;
    direction: 'inbound' | 'outbound';
    content: string;
    read: boolean;
    created_at: string;
};

export function Messages() {
    const { t } = useTranslation();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [isDrafting, setIsDrafting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        const [customersRes, messagesRes] = await Promise.all([
            supabase.from('customers').select('*').order('name'),
            supabase.from('messages').select('*').order('created_at', { ascending: false }),
        ]);
        setCustomers(customersRes.data || []);
        setMessages(messagesRes.data || []);
        setLoading(false);
    }

    async function sendMessage(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedCustomerId || !newMessage.trim()) return;

        await supabase.from('messages').insert([{
            customer_id: selectedCustomerId,
            direction: 'outbound',
            content: newMessage.trim(),
            read: true,
        }]);

        setNewMessage('');
        loadData();
    }

    async function markAsRead(customerId: string) {
        await supabase.from('messages').update({ read: true }).eq('customer_id', customerId).eq('read', false);
        loadData();
    }

    async function handleDraftWithAI() {
        if (!selectedCustomer) return;

        setIsDrafting(true);
        try {
            const lastMessage = selectedMessages[selectedMessages.length - 1];
            const intent = aiService.detectIntent(lastMessage?.content || '');
            const draft = await aiService.draftMessage(
                selectedCustomer.name,
                lastMessage?.content || '',
                intent
            );
            setNewMessage(draft);
        } catch (error) {
            console.error("Drafting failed", error);
        } finally {
            setIsDrafting(false);
        }
    }

    const filteredCustomers = customers.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.toLowerCase().includes(search.toLowerCase())
    );

    // Group messages by customer and get last message
    const conversationList = filteredCustomers.map((customer) => {
        const customerMessages = messages.filter((m) => m.customer_id === customer.id);
        const lastMessage = customerMessages[0];
        const unreadCount = customerMessages.filter((m) => !m.read && m.direction === 'inbound').length;
        return { customer, lastMessage, unreadCount };
    }).filter((c) => c.lastMessage || selectedCustomerId === c.customer.id).sort((a, b) => {
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
    });

    const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
    const selectedMessages = messages.filter((m) => m.customer_id === selectedCustomerId).reverse();

    return (
        <div className="h-[calc(100vh-8rem)]">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-[32px] font-bold text-neutral-900 dark:text-white">{t('messages')}</h1>
                    <p className="text-neutral-500 dark:text-neutral-400">{t('customer_communication')}</p>
                </div>
            </div>

            <div className="flex gap-6 h-[calc(100%-4rem)]">
                {/* Conversation List */}
                <div className={`w-80 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-col ${selectedCustomerId ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder={t('search_conversations')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-sm"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-neutral-500">{t('loading')}</div>
                        ) : conversationList.length === 0 ? (
                            <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
                                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>{t('no_conversations')}</p>
                            </div>
                        ) : (
                            conversationList.map(({ customer, lastMessage, unreadCount }) => (
                                <button
                                    key={customer.id}
                                    onClick={() => { setSelectedCustomerId(customer.id); markAsRead(customer.id); }}
                                    className={`w-full p-4 text-left border-b border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors ${selectedCustomerId === customer.id ? 'bg-primary-50 dark:bg-primary-900/30' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium text-neutral-900 dark:text-white truncate">{customer.name}</p>
                                                {unreadCount > 0 && (
                                                    <span className="w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                                                        {unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            {lastMessage && (
                                                <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                                                    {lastMessage.direction === 'outbound' && `${t('you')}: `}
                                                    {lastMessage.content}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Message Thread */}
                <div className={`flex-1 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-col ${!selectedCustomerId ? 'hidden md:flex' : 'flex'}`}>
                    {selectedCustomer ? (
                        <>
                            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center gap-3">
                                <button className="md:hidden p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg" onClick={() => setSelectedCustomerId(null)}>
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-neutral-900 dark:text-white">{selectedCustomer.name}</p>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{selectedCustomer.phone || selectedCustomer.email}</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {selectedMessages.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                                        <p>{t('no_messages_yet')}</p>
                                    </div>
                                ) : (
                                    selectedMessages.map((msg) => (
                                        <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] p-3 rounded-xl ${msg.direction === 'outbound'
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-white'
                                                }`}>
                                                <p className="text-sm">{msg.content}</p>
                                                <p className={`text-xs mt-1 ${msg.direction === 'outbound' ? 'text-primary-100' : 'text-neutral-400'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <form onSubmit={sendMessage} className="p-4 border-t border-neutral-200 dark:border-neutral-700">
                                <div className="flex gap-2 mb-2">
                                    <button
                                        type="button"
                                        onClick={handleDraftWithAI}
                                        disabled={isDrafting}
                                        className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50 rounded-full transition-colors"
                                    >
                                        {isDrafting ? <Loader className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                        {isDrafting ? t('drafting') : t('draft_with_ai')}
                                    </button>
                                </div>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder={t('type_message')}
                                        className="flex-1 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                                    />
                                    <Button type="submit" disabled={!newMessage.trim()}>
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                            <div className="text-center">
                                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium">{t('select_conversation')}</p>
                                <p className="text-sm">{t('choose_customer')}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
