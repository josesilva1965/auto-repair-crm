import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import { Sidebar } from './Sidebar';
import { Menu, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react';
import { Button } from './ui/button';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useSettings } from '../contexts/SettingsContext';
import { CommandPalette } from './CommandPalette';

export function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { emailSettings } = useSettings();
  const shopName = emailSettings.shop_name || 'AutoShop CRM';
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { showHelp, setShowHelp, shortcuts, pendingPrefix } = useKeyboardShortcuts();

  // Responsive check
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isMobile={isMobile}
      />
      <CommandPalette />

      <main
        className={cn(
          "flex-1 min-h-screen transition-all duration-300 ease-in-out flex flex-col",
          !isMobile && (sidebarOpen ? "ml-64" : "ml-[72px]")
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 w-full h-16 bg-background/40 backdrop-blur-xl border-b border-border/40 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            {/* Mobile Toggle */}
            {isMobile && !sidebarOpen && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5 text-muted-foreground" />
              </Button>
            )}

            {/* Desktop Toggle */}
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-muted-foreground hover:text-foreground hidden md:flex"
              >
                {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
              </Button>
            )}

            <h1 className="text-xl font-semibold tracking-tight text-foreground hidden sm:block font-display">
              {shopName}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center text-sm text-muted-foreground mr-4 bg-muted/50 px-3 py-1.5 rounded-md border border-border/50 cursor-pointer hover:bg-muted transition-colors" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}>
              <Search className="w-4 h-4 mr-2" />
              <span>Search...</span>
              <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
            <NotificationBell />
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in slide-in-from-bottom-3 duration-700 ease-out-expo">
          {children}
        </div>
      </main>

      {/* Keyboard Shortcuts Modal (kept from original) */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowHelp(false)}>
          {/* ... keeping simplified version for now, ideally this would be a Dialog component ... */}
          <div className="bg-card text-card-foreground p-6 rounded-lg max-w-lg w-full shadow-xl border border-border">
            <h2 className="text-lg font-bold mb-4">{t('keyboard_shortcuts')}</h2>
            <div className="space-y-2">
              {shortcuts.map(s => (
                <div key={s.key} className="flex justify-between text-sm">
                  <span>{s.description}</span>
                  <kbd className="bg-muted px-2 rounded border border-border">{s.key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
