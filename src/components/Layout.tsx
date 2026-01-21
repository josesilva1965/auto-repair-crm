import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { Button } from './ui/button';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useSettings } from '../contexts/SettingsContext';

export function Layout({ children }: { children: React.ReactNode }) {
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

      <main
        className={cn(
          "flex-1 min-h-screen transition-all duration-300 ease-in-out flex flex-col",
          !isMobile && (sidebarOpen ? "ml-64" : "ml-[72px]")
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 w-full h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            {isMobile && !sidebarOpen && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5 text-muted-foreground" />
              </Button>
            )}
            <h1 className="text-xl font-semibold tracking-tight text-foreground hidden sm:block">
              {shopName}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>

      {/* Keyboard Shortcuts Modal (kept from original) */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowHelp(false)}>
          {/* ... keeping simplified version for now, ideally this would be a Dialog component ... */}
          <div className="bg-card text-card-foreground p-6 rounded-lg max-w-lg w-full shadow-xl border border-border">
            <h2 className="text-lg font-bold mb-4">Keyboard Shortcuts</h2>
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
