import React, { useState, useMemo } from 'react';
import { useUniverse } from '../../context/UniverseContext';
import { excelEngine } from '../../services/excelService';
import { currencyService } from '../../services/currencyService';
import { ReportingScopeSelector } from './ReportingScopeSelector';
import { RevenueRankingItem } from '../../types/schema';
import {
  Trophy,
  DollarSign,
  PieChart,
  MapPin,
  ExternalLink,
  Filter,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Globe2
} from 'lucide-react';
import { CompanyLogo } from '../common/CompanyLogo';

export const RevenueIntelligence: React.FC = () => {
  const {
    workbookData,
    selectedPeriodTypeId,
    selectedCurrency,
    selectedYear,
    setSelectedClient,
    setActiveTab
  } = useUniverse();

  const [subSection, setSubSection] = useState<'overall' | 'by-domain' | 'domain-totals' | 'regions'>('overall');
  const [selectedDomainId, setSelectedDomainId] = useState<string>('D001');
  const [inspectClient, setInspectClient] = useState<RevenueRankingItem | null>(null);

  // Search & Pagination inside Revenue table
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // 5 authoritative domains only
  const domains = workbookData?.domains || [];

  // Active rate set metadata for disclosure
  const rateSet = currencyService.getRateSet(selectedYear, selectedPeriodTypeId);

  // Overall Top Clients (converted to selectedCurrency)
  const overallData = useMemo(() => {
    return excelEngine.getRevenueRankings({
      periodTypeId: selectedPeriodTypeId,
      currencyCode: selectedCurrency,
      year: selectedYear
    });
  }, [workbookData, selectedPeriodTypeId, selectedCurrency, selectedYear]);

  // Top Clients within Selected Domain (converted to selectedCurrency)
  const domainClientsData = useMemo(() => {
    return excelEngine.getRevenueRankings({
      periodTypeId: selectedPeriodTypeId,
      currencyCode: selectedCurrency,
      year: selectedYear,
      domainId: selectedDomainId
    });
  }, [workbookData, selectedPeriodTypeId, selectedCurrency, selectedYear, selectedDomainId]);

  // Domain Revenue Aggregations (converted to selectedCurrency)
  const domainRevenueData = useMemo(() => {
    return excelEngine.getDomainRevenue({
      periodTypeId: selectedPeriodTypeId,
      currencyCode: selectedCurrency,
      year: selectedYear
    });
  }, [workbookData, selectedPeriodTypeId, selectedCurrency, selectedYear]);

  // Revenue by Location / Region (converted to selectedCurrency)
  const regionRevenueData = useMemo(() => {
    return excelEngine.getRegionRevenue({
      periodTypeId: selectedPeriodTypeId,
      currencyCode: selectedCurrency,
      year: selectedYear
    });
  }, [workbookData, selectedPeriodTypeId, selectedCurrency, selectedYear]);

  const formatMoney = (val: number, compact: boolean = false) => {
    return currencyService.format(val, selectedCurrency, { compact });
  };

  const handleInspectClient = (item: RevenueRankingItem) => {
    const fullClient = workbookData?.enrichedClients.find(c => c.clientId === item.clientId);
    if (fullClient) {
      setSelectedClient(fullClient);
      setActiveTab('detail');
    }
  };

  // Filtered and paginated list for overall
  const activeRankingList = useMemo(() => {
    const list = subSection === 'overall' ? overallData.items : domainClientsData.items;
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter(i => 
      i.clientName.toLowerCase().includes(q) || 
      i.clientCode.toLowerCase().includes(q) ||
      i.domainName.toLowerCase().includes(q) ||
      i.locationName.toLowerCase().includes(q)
    );
  }, [subSection, overallData.items, domainClientsData.items, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(activeRankingList.length / pageSize));
  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize;
    return activeRankingList.slice(start, start + pageSize);
  }, [activeRankingList, page, pageSize]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Scope Controls */}
      <ReportingScopeSelector />

      {/* Sub-perspective Navigator */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
        <div
          className="flex items-center gap-1 p-1 rounded-xl border text-xs font-mono-tech select-none"
          style={{
            backgroundColor: 'var(--surface-input)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <button
            onClick={() => { setSubSection('overall'); setPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              subSection === 'overall'
                ? 'bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan-text)] font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            style={{ border: subSection === 'overall' ? '1px solid var(--accent-cyan-border)' : '1px solid transparent' }}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Top Clients Overall</span>
          </button>

          <button
            onClick={() => { setSubSection('by-domain'); setPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              subSection === 'by-domain'
                ? 'bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan-text)] font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            style={{ border: subSection === 'by-domain' ? '1px solid var(--accent-cyan-border)' : '1px solid transparent' }}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Leaderboard by Sector</span>
          </button>

          <button
            onClick={() => setSubSection('domain-totals')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              subSection === 'domain-totals'
                ? 'bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan-text)] font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            style={{ border: subSection === 'domain-totals' ? '1px solid var(--accent-cyan-border)' : '1px solid transparent' }}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Revenue by Sector</span>
          </button>

          <button
            onClick={() => setSubSection('regions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              subSection === 'regions'
                ? 'bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan-text)] font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            style={{ border: subSection === 'regions' ? '1px solid var(--accent-cyan-border)' : '1px solid transparent' }}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Revenue by Region</span>
          </button>
        </div>

        {/* Currency Governance Badge */}
        <div className="flex items-center gap-2 text-xs font-mono-tech text-[var(--text-muted)]">
          <Globe2 className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
          <span>All records normalized into <strong className="text-[var(--accent-cyan)]">{selectedCurrency}</strong></span>
          <span>·</span>
          <span>Rate: 1 EUR = {rateSet.unitsPerEUR[selectedCurrency as keyof typeof rateSet.unitsPerEUR] ?? 1} {selectedCurrency}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto space-y-4">
        
        {/* 1. Overall / Domain Client Rankings Table */}
        {(subSection === 'overall' || subSection === 'by-domain') && (
          <div className="space-y-4">
            
            {/* Sector Selector if in by-domain (5 authoritative domains) */}
            {subSection === 'by-domain' && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto p-1 rounded-xl border" style={{ borderColor: 'var(--border-subtle)' }}>
                  {domains.map(d => (
                    <button
                      key={String(d.DomainID)}
                      onClick={() => { setSelectedDomainId(String(d.DomainID)); setPage(1); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono-tech transition-all whitespace-nowrap ${
                        selectedDomainId === String(d.DomainID)
                          ? 'bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan-text)] font-bold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                      style={{ border: selectedDomainId === String(d.DomainID) ? '1px solid var(--accent-cyan-border)' : '1px solid transparent' }}
                    >
                      {d.DomainName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Table Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Filter rankings by client or code..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  className="w-full pl-9 pr-4 py-1.5 rounded-xl border text-xs font-mono-tech ui-input"
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-mono-tech text-[var(--text-secondary)]">
                <span>Total Scope Revenue: <strong className="text-[var(--accent-cyan-text)] font-bold">{formatMoney(subSection === 'overall' ? overallData.totalEligibleRevenue : domainClientsData.totalEligibleRevenue)}</strong></span>
              </div>
            </div>

            {/* Structured Table */}
            <div
              className="rounded-xl border overflow-hidden flex flex-col"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono-tech whitespace-nowrap">
                  <thead
                    className="border-b text-[var(--text-muted)] sticky top-0 z-10"
                    style={{
                      backgroundColor: 'var(--table-header-bg)',
                      borderColor: 'var(--border-subtle)'
                    }}
                  >
                    <tr>
                      <th className="py-3 px-3.5 font-semibold w-14 text-center">Rank</th>
                      <th className="py-3 px-3.5 font-semibold">Client Name & Code</th>
                      <th className="py-3 px-3.5 font-semibold">Sector</th>
                      <th className="py-3 px-3.5 font-semibold">Location / Region</th>
                      <th className="py-3 px-3.5 font-semibold text-right">Revenue Generated ({selectedCurrency})</th>
                      <th className="py-3 px-3.5 font-semibold text-center">Currency</th>
                      <th className="py-3 px-3.5 font-semibold text-right">Source Records</th>
                      <th className="py-3 px-3.5 font-semibold text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                    {paginatedList.map((item) => (
                      <tr
                        key={item.clientId}
                        className="hover:bg-[var(--table-row-hover)] transition-colors cursor-pointer"
                        onClick={() => handleInspectClient(item)}
                      >
                        <td className="py-2.5 px-3.5 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                              item.rank === 1
                                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                                : item.rank === 2
                                ? 'bg-slate-500/20 text-slate-300 border border-slate-500/40'
                                : item.rank === 3
                                ? 'bg-amber-700/20 text-amber-600 border border-amber-700/40'
                                : 'text-[var(--text-muted)]'
                            }`}
                          >
                            {item.rank}
                          </span>
                        </td>

                        {/* Client Name, Code, and Logo (~48px) */}
                        <td className="py-2.5 px-3.5">
                          <div className="flex items-center gap-3">
                            <CompanyLogo
                              logoUrl={item.logoUrl}
                              companyName={item.clientName}
                              clientCode={item.clientCode}
                              size="md"
                            />
                            <div>
                              <span className="font-bold text-[var(--text-primary)] block hover:text-[var(--accent-cyan)] transition-colors text-xs">
                                {item.clientName}
                              </span>
                              <span className="text-[10px] text-[var(--text-muted)]">{item.clientCode}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3.5 text-[var(--text-secondary)]">
                          {item.domainName}
                        </td>

                        <td className="py-2.5 px-3.5 text-[var(--text-secondary)]">
                          {item.locationName}
                        </td>

                        <td className="py-2.5 px-3.5 text-right font-bold text-[var(--accent-cyan-text)] text-sm">
                          {formatMoney(item.revenueGenerated)}
                        </td>

                        <td className="py-2.5 px-3.5 text-center">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold border"
                            style={{
                              backgroundColor: 'var(--surface-input)',
                              borderColor: 'var(--border-subtle)',
                              color: 'var(--text-primary)'
                            }}
                          >
                            {item.currencyCode}
                          </span>
                        </td>

                        <td className="py-2.5 px-3.5 text-right text-[var(--text-secondary)]">
                          {item.eligibleRecordsCount} recs
                        </td>

                        <td className="py-2.5 px-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Multi-currency "+N more" breakdown popover trigger */}
                            {item.originalCurrencyBreakdown.length > 1 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setInspectClient(item); }}
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan-border)]"
                                title="Inspect multiple currencies"
                              >
                                +{item.originalCurrencyBreakdown.length - 1} more
                              </button>
                            )}

                            <button
                              onClick={(e) => { e.stopPropagation(); handleInspectClient(item); }}
                              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors"
                              title="Open Client Detail"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {paginatedList.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-xs text-[var(--text-muted)] font-mono-tech">
                          No revenue records found matching the active scope or filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div
                className="p-3 border-t flex items-center justify-between text-xs font-mono-tech text-[var(--text-secondary)]"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div>
                  Showing {paginatedList.length} of {activeRankingList.length} clients
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg border hover:bg-[var(--surface-card-hover)] disabled:opacity-30 disabled:pointer-events-none"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg border hover:bg-[var(--surface-card-hover)] disabled:opacity-30 disabled:pointer-events-none"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Revenue Totals by Domain (5 authoritative domains) */}
        {subSection === 'domain-totals' && (
          <div className="space-y-4">
            <div
              className="rounded-xl border overflow-hidden"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <table className="w-full text-left text-xs font-mono-tech whitespace-nowrap">
                <thead
                  className="border-b text-[var(--text-muted)]"
                  style={{
                    backgroundColor: 'var(--table-header-bg)',
                    borderColor: 'var(--border-subtle)'
                  }}
                >
                  <tr>
                    <th className="py-3 px-3.5 font-semibold">Sector Code</th>
                    <th className="py-3 px-3.5 font-semibold">Domain Name</th>
                    <th className="py-3 px-3.5 font-semibold text-right">Revenue Total ({selectedCurrency})</th>
                    <th className="py-3 px-3.5 font-semibold text-right">Contribution (%)</th>
                    <th className="py-3 px-3.5 font-semibold text-right">Contributing Clients</th>
                    <th className="py-3 px-3.5 font-semibold text-right">Eligible Records</th>
                    <th className="py-3 px-3.5 font-semibold text-center">Completeness</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                  {domainRevenueData.domains.map((d) => (
                    <tr key={d.domainId} className="hover:bg-[var(--table-row-hover)] transition-colors">
                      <td className="py-2.5 px-3.5 font-bold text-[var(--accent-cyan)]">
                        {d.domainCode}
                      </td>
                      <td className="py-2.5 px-3.5 font-bold text-[var(--text-primary)]">
                        {d.domainName}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-[var(--accent-cyan-text)] text-sm">
                        {formatMoney(d.revenueTotal)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-[var(--text-primary)]">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-500/10 overflow-hidden hidden sm:block">
                            <div
                              className="h-full bg-[var(--accent-cyan)] rounded-full"
                              style={{ width: `${Math.min(d.contributionPct, 100)}%` }}
                            />
                          </div>
                          <span>{d.contributionPct}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-[var(--text-secondary)]">
                        {d.contributingClientsCount}
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-[var(--text-secondary)]">
                        {d.eligibleRecordsCount}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span className="text-[10px] text-emerald-500 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                          Verified
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Revenue by Client Location / Region */}
        {subSection === 'regions' && (
          <div className="space-y-4">
            <div
              className="rounded-xl border overflow-hidden"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <table className="w-full text-left text-xs font-mono-tech whitespace-nowrap">
                <thead
                  className="border-b text-[var(--text-muted)]"
                  style={{
                    backgroundColor: 'var(--table-header-bg)',
                    borderColor: 'var(--border-subtle)'
                  }}
                >
                  <tr>
                    <th className="py-3 px-3.5 font-semibold w-14 text-center">Rank</th>
                    <th className="py-3 px-3.5 font-semibold">Location / Jurisdiction</th>
                    <th className="py-3 px-3.5 font-semibold">Classification Type</th>
                    <th className="py-3 px-3.5 font-semibold text-right">Revenue Total ({selectedCurrency})</th>
                    <th className="py-3 px-3.5 font-semibold text-right">Contribution (%)</th>
                    <th className="py-3 px-3.5 font-semibold text-right">Contributing Clients</th>
                    <th className="py-3 px-3.5 font-semibold text-right">Eligible Records</th>
                    <th className="py-3 px-3.5 font-semibold text-center">Data Completeness</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                  {regionRevenueData.map((r) => (
                    <tr key={r.regionCodeId} className="hover:bg-[var(--table-row-hover)] transition-colors">
                      <td className="py-2.5 px-3.5 text-center font-bold text-[var(--accent-cyan)]">
                        #{r.rank}
                      </td>
                      <td className="py-2.5 px-3.5 font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[var(--accent-cyan)] opacity-70" />
                        <span>{r.locationName}</span>
                      </td>
                      <td className="py-2.5 px-3.5 text-[var(--text-secondary)]">
                        {r.regionType}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-[var(--accent-cyan-text)] text-sm">
                        {formatMoney(r.revenueTotal)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-[var(--text-primary)]">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-500/10 overflow-hidden hidden sm:block">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(r.contributionPct, 100)}%` }}
                            />
                          </div>
                          <span>{r.contributionPct}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-[var(--text-secondary)]">
                        {r.contributingClientsCount}
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-[var(--text-secondary)]">
                        {r.eligibleRecordsCount}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                            r.locationName === 'Latin America'
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          }`}
                        >
                          {r.completenessStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Multi-Currency Conversion Detail Modal */}
      {inspectClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="max-w-md w-full p-5 rounded-2xl border shadow-2xl space-y-3"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <h4 className="text-sm font-bold font-display text-[var(--text-primary)]">
                  Currency Conversion Breakdown
                </h4>
                <p className="text-xs font-mono-tech text-[var(--accent-cyan)]">
                  {inspectClient.clientName} ({inspectClient.clientCode})
                </p>
              </div>
              <button
                onClick={() => setInspectClient(null)}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] font-mono-tech">
              Original booked revenue converted to target reporting currency ({selectedCurrency}):
            </p>

            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-subtle)' }}>
              <table className="w-full text-left text-xs font-mono-tech">
                <thead className="border-b text-[var(--text-muted)]" style={{ backgroundColor: 'var(--table-header-bg)', borderColor: 'var(--border-subtle)' }}>
                  <tr>
                    <th className="py-2 px-3">Orig Currency</th>
                    <th className="py-2 px-3 text-right">Booked Amount</th>
                    <th className="py-2 px-3 text-right">Converted ({selectedCurrency})</th>
                    <th className="py-2 px-3 text-right">Records</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                  {inspectClient.originalCurrencyBreakdown.map((b) => (
                    <tr key={b.currencyCode}>
                      <td className="py-2 px-3 font-bold text-[var(--accent-cyan)]">{b.currencyCode}</td>
                      <td className="py-2 px-3 text-right font-bold text-[var(--text-secondary)]">
                        {currencyService.format(b.rawAmount, b.currencyCode)}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-[var(--accent-cyan-text)]">
                        {currencyService.format(b.convertedAmount, selectedCurrency)}
                      </td>
                      <td className="py-2 px-3 text-right text-[var(--text-secondary)]">{b.recordsCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-[10px] font-mono-tech text-[var(--text-muted)] pt-1">
              Conversion rate: ECB Reference Rates via Frankfurter API ({rateSet.methodology})
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectClient(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-mono-tech font-semibold bg-[var(--surface-input)] border hover:bg-[var(--surface-card-hover)] text-[var(--text-primary)]"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
