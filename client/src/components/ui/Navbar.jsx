/**
 * ===========================================
 * Navbar Component
 * ===========================================
 * 
 * Main navigation bar for the application.
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Settings, LayoutDashboard, Bell, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import Button from './Button';
import Modal from './Modal';
import ThemeToggle from './ThemeToggle';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Fetch notifications for authenticated users
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchNotifs = async () => {
      try {
        const { data } = await api.get('/notifications?limit=10');
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } catch {
        // silently fail
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  };

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Films', path: '/films' },
    { name: 'How It Works', path: '/', hash: 'how-it-works' },
    { name: 'About', path: '/about' },
  ];

  return (
    <>
    <nav className="glass sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold gradient-text">CineVest</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) =>
              link.hash ? (
                <button
                  key={link.name}
                  onClick={() => {
                    if (location.pathname === '/') {
                      document.getElementById(link.hash)?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      navigate(`${link.path}#${link.hash}`);
                    }
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.name}
                </button>
              ) : (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.name}
                </Link>
              )
            )}
          </div>

          {/* Auth Buttons / User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {isNotifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-popover rounded-lg shadow-xl border border-border overflow-hidden z-50">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <h3 className="font-semibold text-foreground text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-primary-500 hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notif) => (
                            <Link
                              key={notif._id}
                              to={notif.link || '/dashboard'}
                              onClick={() => setIsNotifOpen(false)}
                              className={`flex items-start gap-3 px-4 py-3 hover:bg-accent border-b border-border last:border-0 transition-colors ${
                                !notif.isRead ? 'bg-primary-500/5' : ''
                              }`}
                            >
                              {/* Read / Unread indicator dot */}
                              <span className="mt-1.5 flex-shrink-0">
                                {!notif.isRead ? (
                                  <span className="block w-2.5 h-2.5 rounded-full bg-primary-500" />
                                ) : (
                                  <span className="block w-2.5 h-2.5 rounded-full border-2 border-muted-foreground/30" />
                                )}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className={`text-sm line-clamp-1 ${!notif.isRead ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                                  {notif.title}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                  {notif.message}
                                </p>
                                <p className="text-[10px] text-muted-foreground/60 mt-1">
                                  {new Date(notif.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </Link>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                            No notifications yet
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span>{user?.name}</span>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-popover rounded-lg shadow-xl border border-border py-2">
                    <Link
                      to="/dashboard"
                      className="flex items-center px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                    <Link
                      to="/dashboard/settings"
                      className="flex items-center px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Admin Panel
                      </Link>
                    )}
                    <hr className="my-2 border-border" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
                </div>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-muted-foreground hover:text-foreground"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            {navLinks.map((link) =>
              link.hash ? (
                <button
                  key={link.name}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (location.pathname === '/') {
                      document.getElementById(link.hash)?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      navigate(`${link.path}#${link.hash}`);
                    }
                  }}
                  className="block py-2 text-muted-foreground hover:text-foreground"
                >
                  {link.name}
                </button>
              ) : (
                <Link
                  key={link.name}
                  to={link.path}
                  className="block py-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              )
            )}
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              {/* Theme Toggle for Mobile */}
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
              
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="block py-2 text-muted-foreground hover:text-foreground"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block py-2 text-muted-foreground hover:text-foreground"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="primary" className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

    </nav>

      {/* Logout Confirmation Modal — outside nav to avoid z-40 stacking context */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Logout"
        size="sm"
      >
        <p className="text-muted-foreground mb-6">
          Are you sure you want to logout?
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="ghost"
            onClick={() => setShowLogoutModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={confirmLogout}
            className="bg-red-600 hover:bg-red-700"
          >
            Logout
          </Button>
        </div>
      </Modal>
    </>
  );
}

export default Navbar;
