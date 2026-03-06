/**
 * ===========================================
 * Settings Component
 * ===========================================
 * 
 * User settings and profile management.
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Wallet,
  Bell,
  Shield,
  Copy,
  ExternalLink,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { useWallet } from '../../hooks';

const SETTINGS_TABS = [
  { id: 'profile', name: 'Profile', icon: User },
  { id: 'security', name: 'Security', icon: Shield },
  { id: 'wallet', name: 'Wallet', icon: Wallet },
  { id: 'notifications', name: 'Notifications', icon: Bell },
];

function Settings() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const getValidTab = (tabId) =>
    SETTINGS_TABS.some((tab) => tab.id === tabId) ? tabId : 'profile';

  const [activeTab, setActiveTab] = useState(
    getValidTab(searchParams.get('tab'))
  );

  useEffect(() => {
    setActiveTab(getValidTab(searchParams.get('tab')));
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    const nextTab = getValidTab(tabId);
    setActiveTab(nextTab);
    const params = new URLSearchParams(searchParams);
    params.set('tab', nextTab);
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
        {/* Tabs Navigation */}
        <div className="lg:w-64 shrink-0">
          {/* Horizontal scroll on mobile, vertical on desktop */}
          <nav className="flex lg:flex-col gap-1 sm:gap-2 overflow-x-auto pb-2 lg:pb-0 -mx-1 px-1 scrollbar-hide">
            {SETTINGS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center whitespace-nowrap px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
                  activeTab === tab.id
                    ? 'bg-primary-500/20 text-primary-500'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <tab.icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 shrink-0" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && <ProfileSettings user={user} />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'wallet' && <WalletSettings user={user} />}
          {activeTab === 'notifications' && <NotificationSettings />}
        </div>
      </div>
    </div>
  );
}

// Profile Settings Tab
function ProfileSettings({ user }) {
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
  });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData((prev) => ({ ...prev, avatar: res.data.url }));
      toast.success('Avatar uploaded!');
    } catch (err) {
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await updateProfile(formData);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>Profile Information</Card.Title>
      </Card.Header>
      <Card.Body>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <img
                src={avatarPreview || '/default-avatar.png'}
                alt="Avatar Preview"
                className="w-16 h-16 rounded-full object-cover border border-border"
              />
              <label className="absolute bottom-0 right-0 bg-primary-500 text-white rounded-full p-1 cursor-pointer shadow-md hover:bg-primary-600 transition-colors" title="Change avatar">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={isUploading}
                />
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path stroke="currentColor" strokeWidth="2" d="M4.5 19.5v-7.379c0-.465.184-.911.513-1.24l7.379-7.38a1.75 1.75 0 0 1 2.475 0l7.38 7.38c.329.329.513.775.513 1.24V19.5a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5Z"/></svg>
              </label>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">JPG, PNG, GIF, WEBP. Max 2MB.</p>
            </div>
          </div>
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            icon={<User className="w-5 h-5" />}
          />
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            icon={<Mail className="w-5 h-5" />}
          />
          <Button type="submit" variant="primary" disabled={isSubmitting || isUploading}>
            {isSubmitting ? 'Saving...' : isUploading ? 'Uploading...' : 'Save Changes'}
          </Button>
        </form>
      </Card.Body>
    </Card>
  );
}

// Security Settings Tab
function SecuritySettings() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      setIsSubmitting(true);
      await api.put('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast.success('Password updated successfully');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>Change Password</Card.Title>
      </Card.Header>
      <Card.Body>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Current Password"
            type="password"
            value={formData.currentPassword}
            onChange={(e) =>
              setFormData({ ...formData, currentPassword: e.target.value })
            }
            icon={<Lock className="w-5 h-5" />}
          />
          <Input
            label="New Password"
            type="password"
            value={formData.newPassword}
            onChange={(e) =>
              setFormData({ ...formData, newPassword: e.target.value })
            }
            icon={<Lock className="w-5 h-5" />}
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            icon={<Lock className="w-5 h-5" />}
          />
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </Card.Body>
    </Card>
  );
}

// Wallet Settings Tab
function WalletSettings({ user }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const connectWalletAction = useAuthStore((state) => state.connectWallet);
  const disconnectWalletAction = useAuthStore((state) => state.disconnectWallet);
  const { address, balance, isConnecting, connect, disconnect, wallets, connectedWallet } = useWallet();

  const displayAddress = address || user?.walletAddress || '';
  const hasWallet = Boolean(displayAddress);
  const truncatedAddress = hasWallet
    ? `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}`
    : '';
  const hasAnyWallet =
    typeof window !== 'undefined' && (wallets.length > 0 || Boolean(window?.ethereum));

  const handleConnect = async (walletId) => {
    let walletAddress;

    try {
      walletAddress = await connect(walletId);
    } catch (err) {
      // Errors and toasts handled inside the hook
      return;
    }

    try {
      setIsSyncing(true);
      await connectWalletAction(walletAddress);
      toast.success('Wallet linked to your CineVest profile');
    } catch (error) {
      toast.error(error.message || 'Failed to save wallet address');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      await disconnectWalletAction();
      disconnect();
      toast.success('Wallet removed from your profile');
    } catch (error) {
      toast.error(error.message || 'Failed to disconnect wallet');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleCopy = async () => {
    if (!displayAddress) return;
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('Clipboard not supported');
      }
      await navigator.clipboard.writeText(displayAddress);
      toast.success('Wallet address copied');
    } catch (error) {
      toast.error('Unable to copy wallet address');
    }
  };

  const handleOpenExplorer = () => {
    if (!displayAddress) return;
    if (typeof window === 'undefined') return;
    window.open(`https://etherscan.io/address/${displayAddress}`, '_blank');
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>Wallet Connection</Card.Title>
      </Card.Header>
      <Card.Body>
        <div className="space-y-6">
          {hasWallet ? (
            <>
              <div className="bg-muted/70 border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col gap-3 sm:gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary-500/20 text-primary-500 shrink-0">
                      <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground">Connected Wallet</p>
                      <p className="font-mono text-base sm:text-lg truncate">{truncatedAddress}</p>
                    </div>
                  </div>
                  <span
                    className={`self-start sm:ml-auto px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                      address ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {address ? 'Active this session' : 'Saved on profile'}
                  </span>
                </div>

                {balance && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4 shrink-0" />
                    <span>Detected Balance:</span>
                    <span className="font-semibold text-foreground">
                      {Number(balance).toFixed(4)} ETH
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
                <Button variant="outline" onClick={handleCopy}>
                  <Copy className="w-4 h-4 mr-2" /> Copy Address
                </Button>
                <Button
                  variant="outline"
                  onClick={handleOpenExplorer}
                  className="text-primary-500 border-primary-500/40"
                >
                  <ExternalLink className="w-4 h-4 mr-2" /> View on Etherscan
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="text-destructive hover:text-destructive"
                >
                  {isDisconnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    'Disconnect Wallet'
                  )}
                </Button>
                {!address && (
                  <Button
                    variant="primary"
                    onClick={() => handleConnect(connectedWallet)}
                    disabled={!hasAnyWallet || isSyncing}
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      'Reconnect Wallet'
                    )}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-6 sm:py-10">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-muted mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                <Wallet className="w-7 h-7 sm:w-8 sm:h-8 text-primary-500" />
              </div>
              <p className="text-muted-foreground mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base px-2">
                Connect a crypto wallet to fund investments and receive
                payouts directly on-chain.
              </p>

              {wallets.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
                  {wallets.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => handleConnect(w.id)}
                      disabled={isConnecting || isSyncing}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-muted/60 hover:bg-accent hover:border-primary-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {w.icon ? (
                        <img
                          src={w.icon}
                          alt={w.name}
                          className="w-10 h-10 rounded-lg object-contain"
                        />
                      ) : (
                        <Wallet className="w-10 h-10 text-primary-400" />
                      )}
                      <span className="text-sm font-medium truncate w-full">
                        {w.name}
                      </span>
                    </button>
                  ))}
                </div>
              ) : hasAnyWallet ? (
                <Button
                  variant="primary"
                  onClick={() => handleConnect()}
                  disabled={isConnecting || isSyncing}
                >
                  {isConnecting || isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect Wallet'
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-amber-300">
                    No wallet detected in your browser.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 text-sm">
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-500 hover:text-primary-400 underline"
                    >
                      MetaMask
                    </a>
                    <span className="text-muted-foreground/50">·</span>
                    <a
                      href="https://www.coinbase.com/wallet/downloads"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-500 hover:text-primary-400 underline"
                    >
                      Coinbase Wallet
                    </a>
                    <span className="text-muted-foreground/50">·</span>
                    <a
                      href="https://rabby.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-500 hover:text-primary-400 underline"
                    >
                      Rabby
                    </a>
                    <span className="text-muted-foreground/50">·</span>
                    <a
                      href="https://phantom.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-500 hover:text-primary-400 underline"
                    >
                      Phantom
                    </a>
                  </div>
                </div>
              )}

              {(isConnecting || isSyncing) && wallets.length > 0 && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting…
                </div>
              )}
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

// Notification Settings Tab
function NotificationSettings() {
  const [settings, setSettings] = useState({
    emailInvestments: true,
    emailROI: true,
    emailNews: false,
    pushInvestments: true,
    pushChat: true,
  });

  const handleToggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
    toast.success('Notification settings updated');
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>Notification Preferences</Card.Title>
      </Card.Header>
      <Card.Body>
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-4">Email Notifications</h3>
            <div className="space-y-3">
              <NotificationToggle
                label="Investment Updates"
                description="Get notified about your investment status changes"
                checked={settings.emailInvestments}
                onChange={() => handleToggle('emailInvestments')}
              />
              <NotificationToggle
                label="ROI Reports"
                description="Receive monthly ROI reports and summaries"
                checked={settings.emailROI}
                onChange={() => handleToggle('emailROI')}
              />
              <NotificationToggle
                label="News & Updates"
                description="Stay updated with platform news and new films"
                checked={settings.emailNews}
                onChange={() => handleToggle('emailNews')}
              />
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-4">Push Notifications</h3>
            <div className="space-y-3">
              <NotificationToggle
                label="Investment Activity"
                description="Real-time updates on your investments"
                checked={settings.pushInvestments}
                onChange={() => handleToggle('pushInvestments')}
              />
              <NotificationToggle
                label="Chat Messages"
                description="Get notified when you receive new messages"
                checked={settings.pushChat}
                onChange={() => handleToggle('pushChat')}
              />
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

// Notification Toggle Component
function NotificationToggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-muted rounded-lg">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm sm:text-base text-foreground">{label}</p>
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-primary-500' : 'bg-muted-foreground/30'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export default Settings;
