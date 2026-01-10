import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type ShortcutKey = string;
type ShortcutHandler = () => void;

interface ShortcutConfig {
    key: ShortcutKey;
    handler: ShortcutHandler;
    description: string;
    combo?: boolean; // For g+key combos
}

export function useKeyboardShortcuts() {
    const navigate = useNavigate();
    const [showHelp, setShowHelp] = useState(false);
    const [pendingPrefix, setPendingPrefix] = useState<string | null>(null);

    const shortcuts: ShortcutConfig[] = [
        // Navigation shortcuts (g + key)
        { key: 'g+d', handler: () => navigate('/'), description: 'Go to Dashboard', combo: true },
        { key: 'g+w', handler: () => navigate('/work-orders'), description: 'Go to Work Orders', combo: true },
        { key: 'g+c', handler: () => navigate('/customers'), description: 'Go to Customers', combo: true },
        { key: 'g+v', handler: () => navigate('/vehicles'), description: 'Go to Vehicles', combo: true },
        { key: 'g+i', handler: () => navigate('/inventory'), description: 'Go to Inventory', combo: true },
        { key: 'g+b', handler: () => navigate('/billing'), description: 'Go to Billing', combo: true },
        { key: 'g+r', handler: () => navigate('/reports'), description: 'Go to Reports', combo: true },
        { key: 'g+t', handler: () => navigate('/technicians'), description: 'Go to Technicians', combo: true },
        { key: 'g+m', handler: () => navigate('/messages'), description: 'Go to Messages', combo: true },
        // Direct shortcuts
        { key: '?', handler: () => setShowHelp(true), description: 'Show keyboard shortcuts' },
        { key: 'Escape', handler: () => setShowHelp(false), description: 'Close modal/dialog' },
        { key: '/', handler: () => focusSearch(), description: 'Focus search input' },
    ];

    const focusSearch = useCallback(() => {
        const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
            searchInput.focus();
        }
    }, []);

    useEffect(() => {
        let prefixTimeout: NodeJS.Timeout;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input or textarea
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                if (e.key === 'Escape') {
                    target.blur();
                }
                return;
            }

            const key = e.key.toLowerCase();

            // Handle prefix key 'g'
            if (key === 'g' && !pendingPrefix) {
                setPendingPrefix('g');
                prefixTimeout = setTimeout(() => setPendingPrefix(null), 1000);
                return;
            }

            // Handle combo shortcuts
            if (pendingPrefix === 'g') {
                const combo = `g+${key}`;
                const shortcut = shortcuts.find(s => s.key === combo);
                if (shortcut) {
                    e.preventDefault();
                    shortcut.handler();
                }
                setPendingPrefix(null);
                clearTimeout(prefixTimeout);
                return;
            }

            // Handle direct shortcuts
            const shortcut = shortcuts.find(s => s.key === e.key || s.key === key);
            if (shortcut && !shortcut.combo) {
                if (key === '/' || key === '?') {
                    e.preventDefault();
                }
                shortcut.handler();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearTimeout(prefixTimeout);
        };
    }, [pendingPrefix, shortcuts]);

    return { showHelp, setShowHelp, shortcuts, pendingPrefix };
}
