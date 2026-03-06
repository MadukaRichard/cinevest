/**
 * ===========================================
 * Admin Layout Component
 * ===========================================
 * 
 * Layout wrapper for admin dashboard pages.
 * Responsive sidebar with mobile hamburger menu.
 */

import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Film, 
  DollarSign,
  Star,
  Wallet,
  MessageSquare,
  Menu,
  X
} from 'lucide-react';
import ErrorBoundary from '../ui/ErrorBoundary';

function AdminLayout({ children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Films', path: '/admin/films', icon: Film },
    { name: 'Featured', path: '/admin/featured', icon: Star },
    { name: 'Investments', path: '/admin/investments', icon: DollarSign },
    { name: 'Wallets', path: '/admin/wallets', icon: Wallet },
    { name: 'Chat', path: '/admin/chat', icon: MessageSquare },
  ];

  const SidebarContent = () => (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold gradient-text">Admin Panel</h2>
        <p className="text-sm text-muted-foreground">Manage CineVest</p>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.exact}
            onClick={() => setIsMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-500/20 text-primary-500 font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </>
  );

  return (
    <div className="container-custom py-8">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold gradient-text">Admin Panel</h2>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-lg bg-muted text-foreground hover:bg-accent transition-colors"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div className="lg:hidden mb-6 bg-card rounded-xl p-4 border border-border shadow-lg">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.exact}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-500/20 text-primary-500 font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="bg-card rounded-xl p-4 border border-border sticky top-24">
            <SidebarContent />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <ErrorBoundary level="section">{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
