import React from 'react';
import { useUniverse } from '../../context/UniverseContext';
import { currencyService } from '../../services/currencyService';
import { Calendar, Globe2, RefreshCw } from 'lucide-react';

interface ReportingScopeSelectorProps {
  showDomainFilter?: boolean;
}

export const ReportingScopeSelector: React.FC<ReportingScopeSelectorProps> = ({ showDomainFilter = false }) => {
  const {
    selectedPeriodTypeId,
    setSelectedPeriodTypeId,
    selectedCurrency,
    setSelectedCurrency,
    selectedYear,
    setSelectedYear,
    selectedDomainId,
    setSelectedDomainId,
    workbookData
  } = useUniverse();

  const domains = workbookData?.domains || [];
  const currencies = workbookData?.currencies || [];

  // Active rate set metadata for disclosure
  const rateSet = currencyService.getRateSet(selectedYear, selectedPeriodTypeId);

  return (
    <div
      className="p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs font-mono-tech transition-all"
      style={{
        backgroundColor: 'var(--surface-card)',
        borderColor: 'var(--border-subtle)'
      }}
    >
      {/* Left: Reporting Scope Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-[var(--accent-cyan)] font-bold">
          <Calendar className="w-4 h-4 shrink-0" />
          <span>REPORTING SCOPE:</span>
        </div>

        {/* Period Type: Annual vs YTD */}
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--text-muted)]">Interval:</span>
          <select
            value={selectedPeriodTypeId}
            onChange={(e) => setSelectedPeriodTypeId(Number(e.target.value))}
            className="px-2.5 py-1 rounded-lg border font-semibold ui-input cursor-pointer"
            style={{
              backgroundColor: 'var(--surface-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="1">Annual (Full Fiscal Year)</option>
            <option value="2">YTD (Interim Non-Overlapping)</option>
          </select>
        </div>

        {/* Fiscal Year Selector (only when Annual) */}
        {selectedPeriodTypeId === 1 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-muted)]">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-2.5 py-1 rounded-lg border font-semibold ui-input cursor-pointer"
              style={{
                backgroundColor: 'var(--surface-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="2024">FY 2024</option>
              <option value="2025">FY 2025</option>
            </select>
          </div>
        )}

        {/* Target Reporting Currency Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--text-muted)]">Target Currency:</span>
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="px-2.5 py-1 rounded-lg border font-bold text-[var(--accent-cyan)] ui-input cursor-pointer"
            style={{
              backgroundColor: 'var(--surface-input)',
              borderColor: 'var(--border-subtle)'
            }}
            title="All revenue records are converted into this target reporting currency using published ECB rates"
          >
            {currencies.map(c => (
              <option key={String(c.CurrencyID)} value={c.CurrencyCode}>
                {c.CurrencyCode} ({c.CurrencyName})
              </option>
            ))}
            {currencies.length === 0 && (
              <>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="GBP">GBP (British Pound)</option>
                <option value="CHF">CHF (Swiss Franc)</option>
                <option value="SEK">SEK (Swedish Krona)</option>
              </>
            )}
          </select>
        </div>

        {/* Optional Domain Filter (5 authoritative domains only) */}
        {showDomainFilter && (
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-muted)]">Sector:</span>
            <select
              value={selectedDomainId === null ? '' : selectedDomainId}
              onChange={(e) => setSelectedDomainId(e.target.value === '' ? null : e.target.value)}
              className="px-2.5 py-1 rounded-lg border font-semibold ui-input cursor-pointer max-w-[200px] truncate"
              style={{
                backgroundColor: 'var(--surface-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="">All Sectors ({domains.length} Domains)</option>
              {domains.map(d => (
                <option key={String(d.DomainID)} value={String(d.DomainID)}>
                  {d.DomainName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Currency Conversion Governance & Disclosure */}
      <div className="flex items-center gap-2 text-xs">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] text-[var(--text-secondary)] font-mono-tech"
          style={{
            backgroundColor: 'var(--surface-card-hover)',
            borderColor: 'var(--border-subtle)'
          }}
          title={`${rateSet.source} · Effective: ${rateSet.effectiveDate} (${rateSet.methodology})`}
        >
          <Globe2 className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
          <span>ECB Reference Conversion: <strong className="text-[var(--accent-cyan)]">{selectedCurrency}</strong></span>
          <span className="text-[10px] text-[var(--text-muted)] hidden md:inline">
            ({rateSet.methodology})
          </span>
        </div>
      </div>
    </div>
  );
};
