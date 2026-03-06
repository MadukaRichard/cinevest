/**
 * ===========================================
 * Dashboard Layout Component
 * ===========================================
 * 
 * Layout wrapper for dashboard pages with sidebar navigation.
 */

import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  PieChart, 
  Settings, 
  MessageSquare,
  Menu,
  X
} from 'lucide-react';
import ErrorBoundary from '../ui/ErrorBoundary';

function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard, exact: true },
    { name: 'Investments', path: '/dashboard/investments', icon: Wallet },
    { name: 'Portfolio', path: '/dashboard/portfolio', icon: PieChart },
    { name: 'Chat', path: '/chat', icon: MessageSquare },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="container-custom py-4 sm:py-6 lg:py-8">
      <div className="flex gap-4 sm:gap-6 lg:gap-8">
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden fixed bottom-4 right-4 z-50 p-3 bg-primary-600 rounded-full shadow-lg"
        >
          {isSidebarOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-40
            w-64 bg-card lg:bg-transparent
            transform transition-transform duration-300
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <nav className="p-4 lg:p-0 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.exact}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-500/20 text-primary-500'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <ErrorBoundary level="section">{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
