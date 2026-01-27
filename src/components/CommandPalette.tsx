import { useEffect, useState } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import {
    Calendar,
    Users,
    Car,
    Wrench,
    Package,
    Settings,
    Search,
    PlusCircle,
    FileText
} from 'lucide-react';
import { cn } from '../lib/utils';

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [customers, setCustomers] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    // Simple search for customers when user types
    useEffect(() => {
        if (!open || search.length < 2) return;

        const searchCustomers = async () => {
            const { data } = await supabase
                .from('customers')
                .select('id, name')
                .ilike('name', `%${search}%`)
                .limit(5);

            if (data) setCustomers(data);
        };

        const timeout = setTimeout(searchCustomers, 300);
        return () => clearTimeout(timeout);
    }, [search, open]);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    if (!open) return null;

    return (
        <CommandPrimitive.Dialog
            open={open}
            onOpenChange={setOpen}
            className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
            label="Global Command Menu"
        >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

            <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center border-b border-neutral-200 dark:border-neutral-800 px-4">
                    <Search className="w-5 h-5 text-neutral-400 mr-3" />
                    <CommandPrimitive.Input
                        value={search}
                        onValueChange={setSearch}
                        placeholder="Type a command or search..."
                        className="flex-1 h-14 bg-transparent outline-none text-lg text-foreground placeholder:text-neutral-400"
                    />
                </div>

                <CommandPrimitive.List className="max-h-[300px] overflow-y-auto p-2 scroll-py-2">
                    <CommandPrimitive.Empty className="p-4 text-center text-sm text-neutral-500">
                        No results found.
                    </CommandPrimitive.Empty>

                    <CommandPrimitive.Group heading="Suggestions" className="text-xs font-semibold text-neutral-400 px-2 py-1.5 mb-1">
                        <CommandItem onSelect={() => runCommand(() => navigate('/work-orders'))}>
                            <FileText className="w-4 h-4 mr-2" />
                            Work Orders
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate('/customers'))}>
                            <Users className="w-4 h-4 mr-2" />
                            Customers
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate('/bookings'))}>
                            <Calendar className="w-4 h-4 mr-2" />
                            Bookings
                        </CommandItem>
                    </CommandPrimitive.Group>

                    <CommandPrimitive.Group heading="Actions" className="text-xs font-semibold text-neutral-400 px-2 py-1.5 mb-1 mt-2">
                        <CommandItem onSelect={() => runCommand(() => navigate('/work-orders?new=true'))}>
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Create New Work Order
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate('/customers?new=true'))}>
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Add New Customer
                        </CommandItem>
                    </CommandPrimitive.Group>

                    {customers.length > 0 && (
                        <CommandPrimitive.Group heading="Customers" className="text-xs font-semibold text-neutral-400 px-2 py-1.5 mb-1 mt-2">
                            {customers.map(c => (
                                <CommandItem key={c.id} onSelect={() => runCommand(() => navigate(`/customers?id=${c.id}`))}>
                                    <Users className="w-4 h-4 mr-2" />
                                    {c.name}
                                </CommandItem>
                            ))}
                        </CommandPrimitive.Group>
                    )}

                </CommandPrimitive.List>

                <div className="border-t border-neutral-200 dark:border-neutral-800 p-2 px-4 text-xs text-neutral-400 flex justify-end gap-2">
                    <span><strong>Cmd+K</strong> to open</span>
                </div>
            </div>
        </CommandPrimitive.Dialog>
    );
}

function CommandItem({ children, onSelect }: { children: React.ReactNode, onSelect: () => void }) {
    return (
        <CommandPrimitive.Item
            onSelect={onSelect}
            className="flex items-center px-4 py-3 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors aria-selected:bg-neutral-100 dark:aria-selected:bg-neutral-800"
        >
            {children}
        </CommandPrimitive.Item>
    );
}
