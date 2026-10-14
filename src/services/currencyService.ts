/**
 * SiloVerse Currency Conversion Service
 * Implements factual currency conversion for all Consilio revenue and client financials.
 * Sourced from the European Central Bank (ECB) reference rates directly or via Frankfurter API (https://frankfurter.dev/).
 */

export type SupportedCurrency = 'USD' | 'EUR' | 'GBP' | 'CHF' | 'SEK';

export interface CurrencyRateSet {
  base: 'EUR';
  periodKey: string;
  effectiveDate: string;
  methodology: 'Annual Period-Average' | 'Interim Period-Average' | 'Latest Published Reference';
  source: string;
  isLive: boolean;
  unitsPerEUR: Record<SupportedCurrency, number>;
}

// Documented ECB reference rate baselines (fallback snapshots)
const FALLBACK_RATE_SETS: Record<string, CurrencyRateSet> = {
  '2024-annual': {
    base: 'EUR',
    periodKey: '2024-annual',
    effectiveDate: '2024-12-31',
    methodology: 'Annual Period-Average',
    source: 'European Central Bank (ECB) Reference Rates (257 trading days average)',
    isLive: false,
    unitsPerEUR: {
      EUR: 1.0,
      USD: 1.082468,
      GBP: 0.846704,
      CHF: 0.952522,
      SEK: 11.43121
    }
  },
  '2025-annual': {
    base: 'EUR',
    periodKey: '2025-annual',
    effectiveDate: '2025-12-31',
    methodology: 'Annual Period-Average',
    source: 'European Central Bank (ECB) Reference Rates (256 trading days average)',
    isLive: false,
    unitsPerEUR: {
      EUR: 1.0,
      USD: 1.129627,
      GBP: 0.856684,
      CHF: 0.937047,
      SEK: 11.06784
    }
  },
  '2025-ytd': {
    base: 'EUR',
    periodKey: '2025-ytd',
    effectiveDate: '2025-06-30',
    methodology: 'Interim Period-Average',
    source: 'European Central Bank (ECB) Reference Rates (H1 Interim average)',
    isLive: false,
    unitsPerEUR: {
      EUR: 1.0,
      USD: 1.092319,
      GBP: 0.842189,
      CHF: 0.941390,
      SEK: 11.098954
    }
  },
  'latest': {
    base: 'EUR',
    periodKey: 'latest',
    effectiveDate: '2026-10-14',
    methodology: 'Latest Published Reference',
    source: 'European Central Bank (ECB) Reference Rates via Frankfurter API',
    isLive: false,
    unitsPerEUR: {
      EUR: 1.0,
      USD: 1.1195,
      GBP: 0.84385,
      CHF: 0.9330,
      SEK: 11.158
    }
  }
};

class CurrencyService {
  private cache: Map<string, CurrencyRateSet> = new Map();
  private isInitialized: boolean = false;
  private listeners: Array<() => void> = [];

  constructor() {
    // Seed in-memory cache with fallback snapshots immediately
    Object.entries(FALLBACK_RATE_SETS).forEach(([key, rateSet]) => {
      this.cache.set(key, { ...rateSet });
    });

    // Check localStorage cache
    this.restoreCache();

    // Trigger async live fetch
    this.fetchLiveRates();
  }

  public subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  private restoreCache() {
    try {
      const stored = localStorage.getItem('siloverse_ecb_rates');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          Object.entries(parsed).forEach(([key, val]) => {
            this.cache.set(key, val as CurrencyRateSet);
          });
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  private persistCache() {
    try {
      const obj: Record<string, CurrencyRateSet> = {};
      this.cache.forEach((v, k) => { obj[k] = v; });
      localStorage.setItem('siloverse_ecb_rates', JSON.stringify(obj));
    } catch {
      // Ignore
    }
  }

  /**
   * Fetches real published exchange rates from Frankfurter API in the background.
   */
  public async fetchLiveRates(): Promise<void> {
    try {
      // 1. Fetch latest spot rates (for company revenue)
      const latestRes = await fetch('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD,GBP,CHF,SEK');
      if (latestRes.ok) {
        const data = await latestRes.json();
        if (data && data.rates) {
          this.cache.set('latest', {
            base: 'EUR',
            periodKey: 'latest',
            effectiveDate: data.date || new Date().toISOString().split('T')[0],
            methodology: 'Latest Published Reference',
            source: 'European Central Bank (ECB) Reference Rates via Frankfurter API',
            isLive: true,
            unitsPerEUR: {
              EUR: 1.0,
              USD: Number(data.rates.USD) || 1.1195,
              GBP: Number(data.rates.GBP) || 0.84385,
              CHF: Number(data.rates.CHF) || 0.933,
              SEK: Number(data.rates.SEK) || 11.158
            }
          });
        }
      }

      this.persistCache();
      this.isInitialized = true;
      this.notify();
    } catch (err) {
      console.warn('Live ECB exchange rates could not be refreshed; using audited reference fallbacks:', err);
      this.isInitialized = true;
      this.notify();
    }
  }

  /**
   * Resolves the appropriate rate set for a given reporting interval.
   */
  public getRateSet(periodYear: number = 2024, periodTypeId: number = 1): CurrencyRateSet {
    if (periodTypeId === 2) {
      return this.cache.get('2025-ytd') || FALLBACK_RATE_SETS['2025-ytd'];
    }
    if (periodYear === 2025) {
      return this.cache.get('2025-annual') || FALLBACK_RATE_SETS['2025-annual'];
    }
    return this.cache.get('2024-annual') || FALLBACK_RATE_SETS['2024-annual'];
  }

  /**
   * Resolves rate set for point-in-time enterprise financials (Company Revenue).
   */
  public getLatestRateSet(): CurrencyRateSet {
    return this.cache.get('latest') || FALLBACK_RATE_SETS['latest'];
  }

  /**
   * Core conversion formula normalized through EUR:
   * convertedAmount = originalAmount / unitsPerEUR[sourceCurrency] * unitsPerEUR[targetCurrency]
   */
  public convert(
    amount: number | null | undefined,
    fromCurrency: string | null | undefined,
    toCurrency: string | null | undefined,
    rateSet: CurrencyRateSet
  ): number {
    if (amount === null || amount === undefined || isNaN(amount)) return 0;
    if (amount === 0) return 0;

    const from = (fromCurrency || 'USD').toUpperCase() as SupportedCurrency;
    const to = (toCurrency || 'USD').toUpperCase() as SupportedCurrency;

    if (from === to) {
      return amount;
    }

    const fromUnits = rateSet.unitsPerEUR[from];
    const toUnits = rateSet.unitsPerEUR[to];

    if (!fromUnits || !toUnits) {
      // If an unrecognized currency is passed, return unconverted amount safely
      return amount;
    }

    // Formula: normalized via EUR
    const eurValue = amount / fromUnits;
    const targetValue = eurValue * toUnits;

    return targetValue;
  }

  /**
   * High-level converter for Revenue Generated flows.
   */
  public convertRevenue(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    periodYear: number = 2024,
    periodTypeId: number = 1
  ): number {
    const rateSet = this.getRateSet(periodYear, periodTypeId);
    return this.convert(amount, fromCurrency, toCurrency, rateSet);
  }

  /**
   * High-level converter for Client Company Revenue.
   */
  public convertCompanyRevenue(
    amount: number | null,
    fromCurrency: string | null,
    toCurrency: string
  ): number | null {
    if (amount === null || amount === undefined) return null;
    const rateSet = this.getLatestRateSet();
    return this.convert(amount, fromCurrency, toCurrency, rateSet);
  }

  /**
   * Formats a monetary number with appropriate symbol and scale.
   */
  public format(
    amount: number | null | undefined,
    currencyCode: string = 'USD',
    options?: { compact?: boolean; maximumFractionDigits?: number }
  ): string {
    if (amount === null || amount === undefined || isNaN(amount)) return 'N/A';

    const curr = currencyCode.toUpperCase();
    const maxDigits = options?.maximumFractionDigits ?? 0;

    let symbol = '$';
    let suffix = '';
    if (curr === 'USD') symbol = '$';
    else if (curr === 'EUR') symbol = '€';
    else if (curr === 'GBP') symbol = '£';
    else if (curr === 'CHF') symbol = 'CHF ';
    else if (curr === 'SEK') symbol = 'SEK ';
    else symbol = `${curr} `;

    if (options?.compact) {
      const abs = Math.abs(amount);
      if (abs >= 1_000_000_000) {
        return `${symbol}${(amount / 1_000_000_000).toFixed(1)}B`;
      }
      if (abs >= 1_000_000) {
        return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
      }
      if (abs >= 1_000) {
        return `${symbol}${(amount / 1_000).toFixed(0)}k`;
      }
    }

    return `${symbol}${amount.toLocaleString('en-US', { maximumFractionDigits: maxDigits })}`;
  }
}

export const currencyService = new CurrencyService();
