/**
 * ===========================================
 * Crypto Price Utility
 * ===========================================
 *
 * Fetches live USD conversion rates for supported
 * cryptocurrencies from the CoinGecko API.
 * Results are cached for 10 minutes to avoid
 * excessive API calls.
 */

// CoinGecko IDs for our supported currencies
const COINGECKO_IDS = {
  ETH: 'ethereum',
  BTC: 'bitcoin',
  USDT: 'tether',
  USDC: 'usd-coin',
};

// Fallback rates in case the API is unreachable
const FALLBACK_RATES = {
  USD: 1,
  USDT: 1,
  USDC: 1,
  ETH: 2500,
  BTC: 60000,
};

// Cache: { rates, fetchedAt }
let cache = { rates: null, fetchedAt: 0 };
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch live USD rates for all supported crypto currencies.
 * Returns an object like { USD: 1, ETH: 2534.12, BTC: 61200, USDT: 1, USDC: 1 }
 */
export const getCryptoRates = async () => {
  // Return cached rates if still fresh
  if (cache.rates && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.rates;
  }

  try {
    const ids = Object.values(COINGECKO_IDS).join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API returned ${response.status}`);
    }

    const data = await response.json();

    const rates = { USD: 1 };
    for (const [symbol, geckoId] of Object.entries(COINGECKO_IDS)) {
      rates[symbol] = data[geckoId]?.usd ?? FALLBACK_RATES[symbol];
    }

    // Update cache
    cache = { rates, fetchedAt: Date.now() };

    return rates;
  } catch (err) {
    console.warn('[CryptoRates] Failed to fetch live rates, using fallback:', err.message);

    // If we have stale cached rates, prefer those over hardcoded fallbacks
    return cache.rates || { ...FALLBACK_RATES };
  }
};

/**
 * Convert an amount from a given currency to USD.
 * @param {number} amount
 * @param {string} currency - 'USD', 'ETH', 'BTC', 'USDT', 'USDC'
 * @returns {Promise<number>} USD equivalent
 */
export const toUSD = async (amount, currency) => {
  if (currency === 'USD') return amount;
  const rates = await getCryptoRates();
  const rate = rates[currency] ?? 1;
  return amount * rate;
};
