/**
 * ===========================================
 * Wallet Management Component
 * ===========================================
 *
 * Admin page to view and update the platform
 * wallet addresses that investors send crypto to.
 * Changes are audit-logged on the backend.
 */

import { useState, useEffect } from 'react';
import { Wallet, Save, Loader2, AlertCircle, CheckCircle2, Copy, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import api from '../../utils/api';

const CURRENCIES = [
  {
    key: 'ETH',
    label: 'Ethereum (ETH)',
    placeholder: '0x…',
    explorer: (addr) => `https://etherscan.io/address/${addr}`,
    color: 'bg-blue-500/20 text-blue-500',
  },
  {
    key: 'BTC',
    label: 'Bitcoin (BTC)',
    placeholder: '1… / 3… / bc1…',
    explorer: (addr) => `https://blockstream.info/address/${addr}`,
    color: 'bg-orange-500/20 text-orange-500',
  },
  {
    key: 'USDT',
    label: 'Tether (USDT — ERC-20)',
    placeholder: '0x…',
    explorer: (addr) => `https://etherscan.io/address/${addr}`,
    color: 'bg-green-500/20 text-green-500',
  },
  {
    key: 'USDC',
    label: 'USD Coin (USDC — ERC-20)',
    placeholder: '0x…',
    explorer: (addr) => `https://etherscan.io/address/${addr}`,
    color: 'bg-purple-500/20 text-purple-500',
  },
];

function WalletManagement() {
  const [wallets, setWallets] = useState({ ETH: '', BTC: '', USDT: '', USDC: '' });
  const [original, setOriginal] = useState({ ETH: '', BTC: '', USDT: '', USDC: '' });
  const [updatedAt, setUpdatedAt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWallets = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data } = await api.get('/admin/wallets');
        const w = data.wallets || {};
        setWallets({ ETH: w.ETH || '', BTC: w.BTC || '', USDT: w.USDT || '', USDC: w.USDC || '' });
        setOriginal({ ETH: w.ETH || '', BTC: w.BTC || '', USDT: w.USDT || '', USDC: w.USDC || '' });
        setUpdatedAt(data.updatedAt);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load wallet settings');
      } finally {
        setIsLoading(false);
      }
    };
    fetchWallets();
  }, []);

  const hasChanges = JSON.stringify(wallets) !== JSON.stringify(original);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data } = await api.put('/admin/wallets', { wallets });
      const w = data.wallets || {};
      const updated = { ETH: w.ETH || '', BTC: w.BTC || '', USDT: w.USDT || '', USDC: w.USDC || '' };
      setWallets(updated);
      setOriginal(updated);
      setUpdatedAt(new Date().toISOString());
      toast.success('Wallet addresses updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update wallets');
    } finally {
      setIsSaving(false);
    }
  };

  const copyAddress = (addr) => {
    navigator.clipboard.writeText(addr);
    toast.success('Address copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 bg-muted rounded animate-pulse" />
        <div className="h-4 w-80 bg-muted rounded animate-pulse" />
        <div className="grid gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
              <div className="h-4 w-32 bg-muted rounded mb-3" />
              <div className="h-10 w-full bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-lg font-medium text-foreground mb-2">Failed to load wallets</p>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform Wallets</h1>
          <p className="text-muted-foreground mt-1">
            Configure the wallet addresses where investors send crypto payments.
            Transactions are verified on-chain against these addresses.
          </p>
          {updatedAt && (
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {new Date(updatedAt).toLocaleString()}
            </p>
          )}
        </div>
        <Button
          variant="primary"
          disabled={!hasChanges || isSaving}
          onClick={handleSave}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Security notice */}
      <Card>
        <div className="flex gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10 h-fit">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">Security Notice</p>
            <p className="text-sm text-muted-foreground mt-1">
              When a user submits a crypto investment, the system verifies on-chain that:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>The transaction actually exists and is confirmed</li>
              <li>The <strong>recipient</strong> matches the wallet address below</li>
              <li>The <strong>amount</strong> matches or exceeds the claimed investment</li>
              <li>For USDT/USDC — the ERC-20 Transfer event logs are parsed</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              If no wallet is configured for a currency, investments in that currency will be flagged for manual review.
            </p>
          </div>
        </div>
      </Card>

      {/* Wallet fields */}
      <div className="grid gap-4">
        {CURRENCIES.map((cur) => {
          const value = wallets[cur.key] || '';
          const isSet = value.length > 0;

          return (
            <Card key={cur.key}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Label */}
                <div className="flex items-center gap-3 sm:w-56 flex-shrink-0">
                  <div className={`p-2 rounded-lg ${cur.color}`}>
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{cur.label}</p>
                    {isSet ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-500">
                        <CheckCircle2 className="w-3 h-3" /> Configured
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-yellow-500">
                        <AlertCircle className="w-3 h-3" /> Not set
                      </span>
                    )}
                  </div>
                </div>

                {/* Input */}
                <div className="flex-1">
                  <Input
                    placeholder={cur.placeholder}
                    value={value}
                    onChange={(e) =>
                      setWallets((prev) => ({ ...prev, [cur.key]: e.target.value }))
                    }
                    className="font-mono text-sm"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  {isSet && (
                    <>
                      <button
                        type="button"
                        onClick={() => copyAddress(value)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        title="Copy address"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href={cur.explorer(value)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        title="View on explorer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default WalletManagement;
