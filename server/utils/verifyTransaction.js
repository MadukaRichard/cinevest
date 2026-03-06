/**
 * ===========================================
 * On-Chain Transaction Verification
 * ===========================================
 *
 * Verifies crypto transaction hashes against their
 * respective blockchains before confirming investments.
 *
 * Security checks:
 *  1. Transaction exists on-chain and is confirmed
 *  2. Recipient matches the platform wallet stored in DB
 *  3. On-chain amount >= claimed investment amount
 *
 * Supported chains:
 *  - Ethereum (ETH, USDT, USDC) via ethers.js + JSON-RPC
 *  - Bitcoin (BTC) via Blockstream public API
 */

import { ethers } from 'ethers';
import PlatformSettings from '../models/PlatformSettings.js';

/* ── Ethereum provider (lazy singleton with fallback) ── */
let _ethProvider = null;
const ETH_FALLBACK_RPCS = [
  'https://eth.llamarpc.com',
  'https://ethereum-rpc.publicnode.com',
  'https://1rpc.io/eth',
];

const getEthProvider = () => {
  if (_ethProvider) return _ethProvider;
  const rpcUrl = process.env.ETH_RPC_URL || ETH_FALLBACK_RPCS[0];
  _ethProvider = new ethers.JsonRpcProvider(rpcUrl);
  return _ethProvider;
};

/** Reset provider so next call uses a fallback */
const resetEthProvider = () => { _ethProvider = null; };

/* ── Well-known ERC-20 contracts (mainnet) ── */
const ERC20_CONTRACTS = {
  USDT: '0xdAC17F958D2ee523a2206206994597C68B351D7E',
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
};

// USDT has 6 decimals, USDC has 6 decimals
const ERC20_DECIMALS = { USDT: 6, USDC: 6 };

// Standard ERC-20 Transfer event signature
const TRANSFER_TOPIC = ethers.id('Transfer(address,address,uint256)');

/* ─────────────────────────────────────────── */
/*  Ethereum / ERC-20 verification             */
/* ─────────────────────────────────────────── */

/** Promise that rejects after ms */
const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('RPC timeout')), ms));

/**
 * Verify an Ethereum native transfer (ETH).
 * @param {string} txHash
 * @param {string} platformWallet - expected recipient address
 * @param {number} expectedAmount - investment amount in ETH
 */
const verifyEthTransaction = async (txHash, platformWallet, expectedAmount) => {
  const provider = getEthProvider();

  // 1. Fetch the transaction object (with 10s timeout)
  const tx = await Promise.race([provider.getTransaction(txHash), timeout(10000)]);
  if (!tx) {
    return { verified: false, reason: 'Transaction not found on the Ethereum blockchain' };
  }

  // 2. Fetch the receipt (null while still pending / un-mined)
  let receipt;
  try {
    receipt = await Promise.race([provider.getTransactionReceipt(txHash), timeout(10000)]);
  } catch {
    return { verified: false, reason: 'Could not fetch receipt — transaction might still be pending.', pending: true };
  }

  if (!receipt) {
    return { verified: false, reason: 'Transaction is still pending (not yet mined). Please wait for at least 1 confirmation and try again.', pending: true };
  }

  // 3. Check on-chain status
  if (receipt.status === 0) {
    return { verified: false, reason: 'Transaction was reverted / failed on-chain' };
  }

  // 4. Verify recipient matches platform wallet
  if (platformWallet) {
    const txTo = (tx.to || '').toLowerCase();
    const expected = platformWallet.toLowerCase();
    if (txTo !== expected) {
      return {
        verified: false,
        reason: `Transaction recipient (${tx.to}) does not match our platform wallet. Please send funds to the correct address.`,
      };
    }
  }

  // 5. Verify amount (ETH native value)
  const onChainEth = parseFloat(ethers.formatEther(tx.value));
  if (expectedAmount && onChainEth < expectedAmount) {
    return {
      verified: false,
      reason: `On-chain amount (${onChainEth} ETH) is less than the claimed investment amount (${expectedAmount} ETH).`,
    };
  }

  // 6. Determine confirmations
  let confirmations = 0;
  try {
    const currentBlock = await Promise.race([provider.getBlockNumber(), timeout(5000)]);
    confirmations = currentBlock - receipt.blockNumber;
  } catch {
    confirmations = 1;
  }

  return {
    verified: true,
    details: {
      from: tx.from,
      to: tx.to,
      value: ethers.formatEther(tx.value),
      blockNumber: receipt.blockNumber,
      confirmations,
      gasUsed: receipt.gasUsed.toString(),
    },
  };
};

/**
 * Verify an ERC-20 token transfer (USDT / USDC).
 * Parses Transfer event logs to confirm recipient and amount.
 */
const verifyErc20Transaction = async (txHash, currency, platformWallet, expectedAmount) => {
  const provider = getEthProvider();

  const tx = await Promise.race([provider.getTransaction(txHash), timeout(10000)]);
  if (!tx) {
    return { verified: false, reason: 'Transaction not found on the Ethereum blockchain' };
  }

  let receipt;
  try {
    receipt = await Promise.race([provider.getTransactionReceipt(txHash), timeout(10000)]);
  } catch {
    return { verified: false, reason: 'Could not fetch receipt — transaction might still be pending.', pending: true };
  }

  if (!receipt) {
    return { verified: false, reason: 'Transaction is still pending (not yet mined). Please wait for at least 1 confirmation and try again.', pending: true };
  }

  if (receipt.status === 0) {
    return { verified: false, reason: 'Transaction was reverted / failed on-chain' };
  }

  // Verify the tx was sent to the correct ERC-20 contract
  const expectedContract = ERC20_CONTRACTS[currency]?.toLowerCase();
  if (expectedContract && tx.to?.toLowerCase() !== expectedContract) {
    return {
      verified: false,
      reason: `Transaction is not a ${currency} token transfer (wrong contract address).`,
    };
  }

  // Parse Transfer logs to find the actual token recipient and amount
  const decimals = ERC20_DECIMALS[currency] || 18;
  let tokenRecipient = null;
  let tokenAmount = 0;

  for (const log of receipt.logs) {
    if (
      log.address.toLowerCase() === expectedContract &&
      log.topics[0] === TRANSFER_TOPIC &&
      log.topics.length >= 3
    ) {
      // topics[1] = from (padded address), topics[2] = to (padded address)
      const to = ethers.getAddress('0x' + log.topics[2].slice(26));
      const amount = parseFloat(ethers.formatUnits(log.data, decimals));

      // Use the transfer where 'to' matches the platform wallet (or the largest one)
      if (platformWallet && to.toLowerCase() === platformWallet.toLowerCase()) {
        tokenRecipient = to;
        tokenAmount += amount; // Accumulate in case of multiple transfers to our wallet
      } else if (!platformWallet) {
        tokenRecipient = to;
        tokenAmount = amount;
      }
    }
  }

  if (!tokenRecipient) {
    if (platformWallet) {
      return {
        verified: false,
        reason: `No ${currency} transfer to our platform wallet was found in this transaction. Please send to the correct address.`,
      };
    }
    return { verified: false, reason: `No ${currency} Transfer event found in this transaction.` };
  }

  if (platformWallet && tokenRecipient.toLowerCase() !== platformWallet.toLowerCase()) {
    return {
      verified: false,
      reason: `${currency} was sent to ${tokenRecipient}, not to our platform wallet.`,
    };
  }

  if (expectedAmount && tokenAmount < expectedAmount) {
    return {
      verified: false,
      reason: `On-chain ${currency} amount (${tokenAmount}) is less than the claimed amount (${expectedAmount}).`,
    };
  }

  let confirmations = 0;
  try {
    const currentBlock = await Promise.race([provider.getBlockNumber(), timeout(5000)]);
    confirmations = currentBlock - receipt.blockNumber;
  } catch {
    confirmations = 1;
  }

  return {
    verified: true,
    details: {
      from: tx.from,
      to: tokenRecipient,
      value: tokenAmount.toString(),
      blockNumber: receipt.blockNumber,
      confirmations,
      gasUsed: receipt.gasUsed.toString(),
    },
  };
};

/* ─────────────────────────────────────────── */
/*  Bitcoin verification (Blockstream API)      */
/* ─────────────────────────────────────────── */
const verifyBtcTransaction = async (txHash, platformWallet, expectedAmount) => {
  try {
    const res = await fetch(`https://blockstream.info/api/tx/${txHash}`);
    if (!res.ok) {
      return { verified: false, reason: 'Bitcoin transaction not found on the blockchain' };
    }

    const tx = await res.json();

    if (!tx.status?.confirmed) {
      return { verified: false, reason: 'Bitcoin transaction is still unconfirmed. Please wait for at least 1 confirmation and try again.', pending: true };
    }

    // Check that at least one output goes to our platform wallet
    if (platformWallet) {
      const ourOutput = tx.vout?.find(
        (out) => out.scriptpubkey_address?.toLowerCase() === platformWallet.toLowerCase()
      );

      if (!ourOutput) {
        return {
          verified: false,
          reason: 'None of the transaction outputs are sent to our platform BTC wallet. Please send to the correct address.',
        };
      }

      // ourOutput.value is in satoshis
      const btcReceived = ourOutput.value / 1e8;
      if (expectedAmount && btcReceived < expectedAmount) {
        return {
          verified: false,
          reason: `BTC received (${btcReceived} BTC) is less than the claimed investment amount (${expectedAmount} BTC).`,
        };
      }
    }

    return {
      verified: true,
      details: {
        blockHeight: tx.status.block_height,
        blockHash: tx.status.block_hash,
        fee: tx.fee,
      },
    };
  } catch (err) {
    return { verified: false, reason: `Bitcoin verification request failed: ${err.message}` };
  }
};

/* ─────────────────────────────────────────── */
/*  Main public function                       */
/* ─────────────────────────────────────────── */

/**
 * Verify a crypto transaction hash on its native blockchain.
 *
 * Checks:
 *  - Transaction exists and is confirmed
 *  - Recipient matches platform wallet (from DB)
 *  - Amount matches claimed investment
 *
 * @param {string}  txHash          - The transaction hash
 * @param {string}  currency        - One of ETH | BTC | USDT | USDC
 * @param {number}  [expectedAmount] - The claimed investment amount (in crypto units)
 * @returns {{ verified: boolean, reason?: string, details?: object, skipped?: boolean, pending?: boolean }}
 */
export const verifyTransaction = async (txHash, currency, expectedAmount = null) => {
  if (!txHash || txHash.trim().length === 0) {
    return { verified: false, reason: 'No transaction hash provided' };
  }

  const hash = txHash.trim();

  // Fetch platform wallet address from DB
  let platformWallet = '';
  try {
    const settings = await PlatformSettings.getSettings();
    // For USDT/USDC use their specific wallet, fall back to ETH wallet
    platformWallet = settings.wallets[currency] || settings.wallets.ETH || '';
  } catch (err) {
    console.error('Failed to fetch platform wallet settings:', err.message);
    // Continue without wallet check — will rely on admin manual review
  }

  if (!platformWallet) {
    // No wallet configured — cannot verify recipient; flag for manual review
    return {
      verified: false,
      skipped: true,
      reason: `No platform wallet configured for ${currency}. Transaction cannot be auto-verified — pending manual admin review. Please configure wallet addresses in Admin → Wallets.`,
    };
  }

  try {
    switch (currency) {
      case 'ETH': {
        // Try primary RPC, then fallbacks
        let lastError;
        const rpcsToTry = [process.env.ETH_RPC_URL, ...ETH_FALLBACK_RPCS].filter(Boolean);
        const unique = [...new Set(rpcsToTry)];

        for (const rpc of unique) {
          try {
            resetEthProvider();
            _ethProvider = new ethers.JsonRpcProvider(rpc);
            const result = await verifyEthTransaction(hash, platformWallet, expectedAmount);
            return result;
          } catch (err) {
            lastError = err;
            resetEthProvider();
          }
        }
        return { verified: false, reason: `All RPC endpoints failed: ${lastError?.message || 'unknown'}` };
      }

      case 'USDT':
      case 'USDC': {
        let lastError;
        const rpcsToTry = [process.env.ETH_RPC_URL, ...ETH_FALLBACK_RPCS].filter(Boolean);
        const unique = [...new Set(rpcsToTry)];

        for (const rpc of unique) {
          try {
            resetEthProvider();
            _ethProvider = new ethers.JsonRpcProvider(rpc);
            const result = await verifyErc20Transaction(hash, currency, platformWallet, expectedAmount);
            return result;
          } catch (err) {
            lastError = err;
            resetEthProvider();
          }
        }
        return { verified: false, reason: `All RPC endpoints failed: ${lastError?.message || 'unknown'}` };
      }

      case 'BTC':
        return await verifyBtcTransaction(hash, platformWallet, expectedAmount);

      default:
        return { verified: false, reason: `Unsupported currency for verification: ${currency}` };
    }
  } catch (error) {
    return { verified: false, reason: `Verification error: ${error.message}` };
  }
};
