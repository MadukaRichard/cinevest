/**
 * ===========================================
 * useWallet Hook
 * ===========================================
 *
 * Custom hook for crypto wallet connection.
 * Supports multiple wallets via EIP-6963 discovery
 * (MetaMask, Coinbase Wallet, Rabby, Trust Wallet,
 * Phantom, Brave, OKX, etc.) with a window.ethereum fallback.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

/* -------------------------------------------------- */
/*  Well-known wallet metadata (icons & names)        */
/*  Used as fallback when EIP-6963 isn't supported    */
/* -------------------------------------------------- */
const KNOWN_WALLETS = [
  {
    id: 'io.metamask',
    name: 'MetaMask',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
    detect: (eth) => eth?.isMetaMask && !eth?.isBraveWallet,
  },
  {
    id: 'com.coinbase',
    name: 'Coinbase Wallet',
    icon: 'https://altcoinsbox.com/wp-content/uploads/2022/12/coinbase-wallet-logo-300x300.webp',
    detect: (eth) => eth?.isCoinbaseWallet || eth?.isCoinbaseBrowser,
  },
  {
    id: 'com.brave',
    name: 'Brave Wallet',
    icon: 'https://brave.com/static-assets/images/brave-logo-sans-text.svg',
    detect: (eth) => eth?.isBraveWallet,
  },
  {
    id: 'com.trustwallet',
    name: 'Trust Wallet',
    icon: 'https://trustwallet.com/assets/images/media/assets/TWT.png',
    detect: (eth) => eth?.isTrust || eth?.isTrustWallet,
  },
  {
    id: 'app.phantom',
    name: 'Phantom',
    icon: 'https://phantom.app/favicon-32x32.png',
    detect: (eth) => eth?.isPhantom,
  },
  {
    id: 'io.rabby',
    name: 'Rabby',
    icon: 'https://rabby.io/assets/images/logo-128.png',
    detect: (eth) => eth?.isRabby,
  },
  {
    id: 'com.okex',
    name: 'OKX Wallet',
    icon: 'https://static.okx.com/cdn/assets/imgs/247/5F8F8F24BAE70065.png',
    detect: () => !!window?.okxwallet,
    getProvider: () => window?.okxwallet,
  },
];

/* -------------------------------------------------- */
/*  useAvailableWallets – discover injected wallets   */
/* -------------------------------------------------- */
/**
 * Listens for EIP-6963 announcements and falls back to
 * detecting known providers on window.ethereum.
 */
export function useAvailableWallets() {
  const [wallets, setWallets] = useState([]);
  const providersRef = useRef(new Map()); // rdns -> EIP-1193 provider

  useEffect(() => {
    const discovered = new Map();

    // --- EIP-6963 listener ---
    const handleAnnouncement = (event) => {
      const { info, provider } = event.detail || {};
      if (!info?.rdns || discovered.has(info.rdns)) return;

      discovered.set(info.rdns, {
        id: info.rdns,
        name: info.name,
        icon: info.icon,
      });
      providersRef.current.set(info.rdns, provider);
      setWallets(Array.from(discovered.values()));
    };

    window.addEventListener('eip6963:announceProvider', handleAnnouncement);
    // Request providers already registered
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    // --- Fallback: detect known wallets from window.ethereum ---
    const timer = setTimeout(() => {
      if (discovered.size > 0) return; // EIP-6963 handled it

      const eth = window.ethereum;
      if (!eth) return;

      // Some browsers expose multiple providers
      const providers = eth.providers ?? [eth];

      providers.forEach((p) => {
        for (const w of KNOWN_WALLETS) {
          if (w.detect(p) && !discovered.has(w.id)) {
            discovered.set(w.id, { id: w.id, name: w.name, icon: w.icon });
            providersRef.current.set(w.id, w.getProvider?.() ?? p);
          }
        }
      });

      // If nothing specific matched but window.ethereum exists
      if (discovered.size === 0 && eth) {
        const fallback = {
          id: 'injected',
          name: 'Browser Wallet',
          icon: null,
        };
        discovered.set('injected', fallback);
        providersRef.current.set('injected', eth);
      }

      setWallets(Array.from(discovered.values()));
    }, 150); // small delay so EIP-6963 events fire first

    return () => {
      window.removeEventListener('eip6963:announceProvider', handleAnnouncement);
      clearTimeout(timer);
    };
  }, []);

  /** Get the raw EIP-1193 provider for a wallet id */
  const getProvider = useCallback(
    (walletId) => providersRef.current.get(walletId) ?? null,
    [],
  );

  return { wallets, getProvider };
}

/* -------------------------------------------------- */
/*  useWallet – connect / disconnect / switch network */
/* -------------------------------------------------- */
/**
 * Hook for managing wallet connection.
 * Call `connect(walletId)` with the id from useAvailableWallets
 * to connect to a specific wallet. Omitting walletId falls back
 * to the default window.ethereum provider.
 */
export function useWallet() {
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [connectedWallet, setConnectedWallet] = useState(null); // wallet id
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const { wallets, getProvider } = useAvailableWallets();

  /**
   * Connect to a wallet.
   * @param {string} [walletId] – id from useAvailableWallets (e.g. 'io.metamask')
   */
  const connect = useCallback(
    async (walletId) => {
      setIsConnecting(true);
      setError(null);

      try {
        // Resolve the raw EIP-1193 provider
        let rawProvider;
        if (walletId) {
          rawProvider = getProvider(walletId);
        }
        if (!rawProvider) {
          rawProvider = window.ethereum;
        }

        if (!rawProvider) {
          throw new Error(
            'No wallet detected. Please install a browser wallet like MetaMask, Coinbase Wallet, or Rabby.',
          );
        }

        const provider = new ethers.BrowserProvider(rawProvider);
        const accounts = await provider.send('eth_requestAccounts', []);

        if (!accounts?.length) {
          throw new Error('No accounts found. Please unlock your wallet.');
        }

        const walletAddress = accounts[0];
        const walletBalance = await provider.getBalance(walletAddress);

        setAddress(walletAddress);
        setBalance(ethers.formatEther(walletBalance));
        setConnectedWallet(walletId || 'injected');

        const label =
          wallets.find((w) => w.id === walletId)?.name || 'Wallet';
        toast.success(`${label} connected successfully!`);

        return walletAddress;
      } catch (err) {
        const message = err.message || 'Failed to connect wallet';
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setIsConnecting(false);
      }
    },
    [getProvider, wallets],
  );

  const disconnect = useCallback(() => {
    setAddress(null);
    setBalance(null);
    setConnectedWallet(null);
    toast.success('Wallet disconnected');
  }, []);

  const switchNetwork = useCallback(
    async (chainId) => {
      try {
        const rawProvider =
          (connectedWallet && getProvider(connectedWallet)) || window.ethereum;
        if (!rawProvider) throw new Error('No wallet connected');

        await rawProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainId.toString(16)}` }],
        });
      } catch (err) {
        toast.error('Failed to switch network');
        throw err;
      }
    },
    [connectedWallet, getProvider],
  );

  return {
    address,
    balance,
    isConnecting,
    isConnected: !!address,
    connectedWallet,
    wallets,         // available wallets for the picker UI
    error,
    connect,
    disconnect,
    switchNetwork,
  };
}
