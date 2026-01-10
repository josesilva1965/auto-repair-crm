import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Package,
  Car,
  Receipt,
  BarChart3,
  Wrench,
  Menu,
  X,
  Moon,
  Sun,
  MessageSquare,
  Keyboard,
  Bell,
  Settings,
  Calendar
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'dashboard', icon: LayoutDashboard },
  { path: '/bookings', label: 'bookings', icon: Calendar },
  { path: '/work-orders', label: 'work_orders', icon: ClipboardList },
  { path: '/customers', label: 'customers', icon: Users },
  { path: '/vehicles', label: 'vehicles', icon: Car },
  { path: '/inventory', label: 'inventory', icon: Package },
  { path: '/billing', label: 'billing', icon: Receipt },
  { path: '/reports', label: 'reports', icon: BarChart3 },
  { path: '/technicians', label: 'technicians', icon: Wrench },
  { path: '/messages', label: 'messages', icon: MessageSquare },
  { path: '/reminders', label: 'reminders', icon: Bell },
  { path: '/settings', label: 'settings', icon: Settings },
];


import { useTranslation } from 'react-i18next';
// ...
export function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { showHelp, setShowHelp, shortcuts, pendingPrefix } = useKeyboardShortcuts();

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-screen w-60 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 flex flex-col z-50
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-neutral-900 dark:text-white">AutoShop CRM</h1>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Management System</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <button
              className="md:hidden p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
            </button>
          </div>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${isActive
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {t(item.label)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer with theme toggle and keyboard shortcuts */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
          <button
            onClick={() => setShowHelp(true)}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-md transition-colors"
          >
            <Keyboard className="w-4 h-4" />
            Keyboard Shortcuts
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-md transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-60">
        {/* Mobile header with hamburger */}
        <div className="md:hidden sticky top-0 z-30 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-4 py-3 flex items-center gap-3">
          <button
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6 text-neutral-600 dark:text-neutral-300" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-neutral-900 dark:text-white">AutoShop CRM</span>
          </div>
        </div>
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto">{children}</div>
      </main>

      {/* Keyboard shortcuts help modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowHelp(false)}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg max-w-2xl w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowHelp(false)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
              >
                <X className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Navigation</h3>
                <div className="grid grid-cols-2 gap-2">
                  {shortcuts.filter(s => s.combo).map(shortcut => (
                    <div key={shortcut.key} className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-700 rounded">
                      <span className="text-sm text-neutral-600 dark:text-neutral-300">{shortcut.description}</span>
                      <kbd className="px-2 py-1 text-xs bg-white dark:bg-neutral-600 border border-neutral-200 dark:border-neutral-500 rounded shadow-sm font-mono text-neutral-700 dark:text-neutral-200">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  {shortcuts.filter(s => !s.combo).map(shortcut => (
                    <div key={shortcut.key} className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-700 rounded">
                      <span className="text-sm text-neutral-600 dark:text-neutral-300">{shortcut.description}</span>
                      <kbd className="px-2 py-1 text-xs bg-white dark:bg-neutral-600 border border-neutral-200 dark:border-neutral-500 rounded shadow-sm font-mono text-neutral-700 dark:text-neutral-200">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {pendingPrefix && (
              <div className="mt-4 p-2 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded text-sm text-primary-700 dark:text-primary-300">
                Waiting for next key... (pressed: <kbd className="font-mono font-bold">{pendingPrefix}</kbd>)
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
