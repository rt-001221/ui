import React, { useState, useMemo } from 'react';
import { useUniverse } from '../../context/UniverseContext';
import { excelEngine } from '../../services/excelService';
import { currencyService } from '../../services/currencyService';
import { ReportingScopeSelector } from './ReportingScopeSelector';
import {
  TrendingUp,
  TrendingDown,
  UserCheck,
  ShieldAlert,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Search,
  Globe2
} from 'lucide-react';

export const GrowthLifecycle: React.FC = () => {
  const {
    workbookData,
    selectedCurrency,
    setSelectedClient,
    setActiveTab
  } = useUniverse();

  const [activeSubTab, setActiveSubTab] = useState<'yoy' | 'lifecycle' | 'churn'>('yoy');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // Compute YoY growth items with factual currency conversion to selectedCurrency
  const yoyItems = useMemo(() => {
    return excelEngine.getClientYoYGrowth(selectedCurrency, 2025, 2024);
  }, [workbookData, selectedCurrency]);

  const clients = workbookData?.enrichedClients || [];

  const lifecycleCounts = useMemo(() => {
    let active = 0, atRisk = 0, churned = 0, dormant = 0;
    clients.forEach(c => {
      if (c.clientStatusName === 'Active') active++;
      else if (c.clientStatusName === 'At Risk') atRisk++;
      else if (c.clientStatusName === 'Churned') churned++;
      else if (c.clientStatusName === 'Dormant') dormant++;
    });
    return { active, atRisk, churned, dormant, total: clients.length };
  }, [clients]);

  const filteredYoyItems = useMemo(() => {
    if (!search.trim()) return yoyItems;
    const q = search.toLowerCase();
    return yoyItems.filter(i => 
      i.clientName.toLowerCase().includes(q) || 
      i.clientCode.toLowerCase().includes(q) ||
      i.domainName.toLowerCase().includes(q)
    );
  }, [yoyItems, search]);

  const totalYoyPages = Math.max(1, Math.ceil(filteredYoyItems.length / pageSize));
  const paginatedYoyItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredYoyItems.slice(start, start + pageSize);
  }, [filteredYoyItems, page, pageSize]);

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      if (statusFilter !== 'all' && c.clientStatusName !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return c.clientName.toLowerCase().includes(q) || c.clientCode.toLowerCase().includes(q);
      }
      return true;
    });
  }, [clients, statusFilter, search]);

  const churnedClients = useMemo(() => {
    return clients.filter(c => c.clientStatusName === 'Churned');
  }, [clients]);

  const formatMoney = (val: number | null) => {
    return currencyService.format(val, selectedCurrency);
  };

  const handleInspectClient = (clientId: string) => {
    const c = clients.find(cl => cl.clientId === clientId || cl.clientCode === clientId);
    if (c) {
      setSelectedClient(c);
      setActiveTab('detail');
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Reporting Scope Bar */}
      <ReportingScopeSelector />

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
        <div
          className="flex items-center gap-1 p-1 rounded-xl border text-xs font-mono-tech select-none"
          style={{
            backgroundColor: 'var(--surface-input)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <button
            onClick={() => { setActiveSubTab('yoy'); setPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'yoy'
                ? 'bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan-text)] font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            style={{ border: activeSubTab === 'yoy' ? '1px solid var(--accent-cyan-border)' : '1px solid transparent' }}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>YoY Revenue Growth (FY 2025 vs FY 2024)</span>
          </button>

          <button
            onClick={() => { setActiveSubTab('lifecycle'); setPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'lifecycle'
                ? 'bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan-text)] font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            style={{ border: activeSubTab === 'lifecycle' ? '1px solid var(--accent-cyan-border)' : '1px solid transparent' }}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Lifecycle Statuses ({clients.length})</span>
          </button>

          <button
            onClick={() => { setActiveSubTab('churn'); setPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'churn'
                ? 'bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan-text)] font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            style={{ border: activeSubTab === 'churn' ? '1px solid var(--accent-cyan-border)' : '1px solid transparent' }}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Churn Rationale Analysis ({churnedClients.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono-tech text-[var(--text-muted)]">
          <Globe2 className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
          <span>YoY Normalized to: <strong className="text-[var(--accent-cyan)]">{selectedCurrency}</strong></span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto space-y-4">
        
        {/* 1. YoY Growth Comparison */}
        {activeSubTab === 'yoy' && (
          <div className="space-y-4">
            
            {/* Search Filter */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Filter by client or code..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-9 pr-4 py-1.5 rounded-xl border text-xs font-mono-tech ui-input"
                />
              </div>

              <div className="text-xs font-mono-tech text-[var(--text-secondary)]">
                Annual baseline comparison in {selectedCurrency} (ECB period-average rates applied)
              </div>
            </div>

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
                    className="border-b text-[var(--text-muted)]"
                    style={{
                      backgroundColor: 'var(--table-header-bg)',
                      borderColor: 'var(--border-subtle)'
                    }}
                  >
                    <tr>
                      <th className="py-3 px-3.5 font-semibold">Client Name & Code</th>
                      <th className="py-3 px-3.5 font-semibold">Sector</th>
                      <th className="py-3 px-3.5 font-semibold text-right">FY 2024 Revenue</th>
                      <th className="py-3 px-3.5 font-semibold text-right">FY 2025 Revenue</th>
                      <th className="py-3 px-3.5 font-semibold text-right">Absolute Delta</th>
                      <th className="py-3 px-3.5 font-semibold text-right">YoY Growth (%)</th>
                      <th className="py-3 px-3.5 font-semibold">Calculation Status</th>
                      <th className="py-3 px-3.5 font-semibold text-center w-16">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                    {paginatedYoyItems.map((item) => (
                      <tr
                        key={item.clientId}
                        className="hover:bg-[var(--table-row-hover)] transition-colors cursor-pointer"
                        onClick={() => handleInspectClient(item.clientId)}
                      >
                        <td className="py-2.5 px-3.5">
                          <span className="font-bold text-[var(--text-primary)] block hover:text-[var(--accent-cyan)] transition-colors">
                            {item.clientName}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">{item.clientCode}</span>
                        </td>

                        <td className="py-2.5 px-3.5 text-[var(--text-secondary)]">
                          {item.domainName}
                        </td>

                        <td className="py-2.5 px-3.5 text-right text-[var(--text-secondary)]">
                          {formatMoney(item.priorRevenue)}
                        </td>

                        <td className="py-2.5 px-3.5 text-right font-bold text-[var(--accent-cyan-text)] text-sm">
                          {formatMoney(item.currentRevenue)}
                        </td>

                        <td className="py-2.5 px-3.5 text-right">
                          {item.absoluteChange !== null ? (
                            <span className={item.absoluteChange >= 0 ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                              {item.absoluteChange > 0 ? `+${formatMoney(item.absoluteChange)}` : formatMoney(item.absoluteChange)}
                            </span>
                          ) : (
                            <span className="text-[var(--text-muted)]">N/A</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3.5 text-right font-bold">
                          {item.yoyGrowthPct !== null ? (
                            <span className={`inline-flex items-center gap-0.5 ${
                              item.yoyGrowthPct >= 0 ? 'text-emerald-500' : 'text-rose-500'
                            }`}>
                              {item.yoyGrowthPct > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                              <span>{item.yoyGrowthPct > 0 ? `+${item.yoyGrowthPct}%` : `${item.yoyGrowthPct}%`}</span>
                            </span>
                          ) : (
                            <span className="text-[var(--text-muted)]">N/A</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3.5 text-[11px]">
                          <span className={`px-2 py-0.5 rounded font-semibold border ${
                            item.status === 'Calculated'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}>
                            {item.status}
                          </span>
                        </td>

                        <td className="py-2.5 px-3.5 text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleInspectClient(item.clientId); }}
                            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors"
                            title="Open Client Detail"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div
                className="p-3 border-t flex items-center justify-between text-xs font-mono-tech text-[var(--text-secondary)]"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div>
                  Showing {paginatedYoyItems.length} of {filteredYoyItems.length} clients
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Page {page} of {totalYoyPages}
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
                    onClick={() => setPage(p => Math.min(totalYoyPages, p + 1))}
                    disabled={page >= totalYoyPages}
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

        {/* 2. Lifecycle Status List */}
        {activeSubTab === 'lifecycle' && (
          <div className="space-y-4">
            {/* Status Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { status: 'Active', count: lifecycleCounts.active, color: 'text-emerald-500' },
                { status: 'At Risk', count: lifecycleCounts.atRisk, color: 'text-amber-500' },
                { status: 'Churned', count: lifecycleCounts.churned, color: 'text-rose-500' },
                { status: 'Dormant', count: lifecycleCounts.dormant, color: 'text-slate-400' }
              ].map(s => (
                <div
                  key={s.status}
                  onClick={() => setStatusFilter(statusFilter === s.status ? 'all' : s.status)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    statusFilter === s.status ? 'bg-[var(--accent-cyan-bg)] border-[var(--accent-cyan-border)]' : ''
                  }`}
                  style={{
                    backgroundColor: statusFilter === s.status ? undefined : 'var(--surface-card)',
                    borderColor: statusFilter === s.status ? undefined : 'var(--border-subtle)'
                  }}
                >
                  <span className="text-[10px] font-mono-tech text-[var(--text-muted)] uppercase block">{s.status} Clients</span>
                  <p className={`text-2xl font-bold font-mono-tech mt-0.5 ${s.color}`}>
                    {s.count}
                  </p>
                  <span className="text-[10px] font-mono-tech text-[var(--text-muted)]">
                    {statusFilter === s.status ? '✓ Active Filter' : 'Click to filter'}
                  </span>
                </div>
              ))}
            </div>

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
                    <th className="py-3 px-3.5 font-semibold">Client Name & Code</th>
                    <th className="py-3 px-3.5 font-semibold">Domain</th>
                    <th className="py-3 px-3.5 font-semibold">Location</th>
                    <th className="py-3 px-3.5 font-semibold">Tenure</th>
                    <th className="py-3 px-3.5 font-semibold text-center">Lifecycle Status</th>
                    <th className="py-3 px-3.5 font-semibold">Tier</th>
                    <th className="py-3 px-3.5 font-semibold text-center w-16">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                  {filteredClients.map(c => (
                    <tr
                      key={c.clientId}
                      className="hover:bg-[var(--table-row-hover)] transition-colors cursor-pointer"
                      onClick={() => handleInspectClient(c.clientId)}
                    >
                      <td className="py-2.5 px-3.5">
                        <span className="font-bold text-[var(--text-primary)] block hover:text-[var(--accent-cyan)] transition-colors">
                          {c.clientName}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">{c.clientCode}</span>
                      </td>
                      <td className="py-2.5 px-3.5 text-[var(--text-secondary)]">{c.domainName}</td>
                      <td className="py-2.5 px-3.5 text-[var(--text-secondary)]">{c.locationName}</td>
                      <td className="py-2.5 px-3.5 text-[var(--text-secondary)]">{c.derivedTenureYears} yrs</td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          c.clientStatusName === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                          c.clientStatusName === 'At Risk' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                          c.clientStatusName === 'Churned' ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' :
                          'bg-slate-500/10 text-slate-400 border-slate-500/30'
                        }`}>
                          {c.clientStatusName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-[var(--text-secondary)]">{c.clientTierName || 'Standard'}</td>
                      <td className="py-2.5 px-3.5 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleInspectClient(c.clientId); }}
                          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors"
                          title="Open Client Detail"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Churn Rationale Analysis — EXACTLY the 3 Churned Clients (C014, C015, C026) */}
        {activeSubTab === 'churn' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-display text-rose-400 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <span>Authoritative Churn Analysis ({churnedClients.length} Clients)</span>
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-mono-tech mt-0.5">
                  Clients verified with ClientStatusID = CSI003 in the authoritative Consilio workbook
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {churnedClients.map(c => (
                <div
                  key={c.clientId}
                  className="p-4 rounded-xl border space-y-2 text-xs font-mono-tech"
                  style={{
                    backgroundColor: 'var(--surface-card)',
                    borderColor: 'var(--border-subtle)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--text-primary)] text-sm">{c.clientName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/30 font-bold">
                        {c.clientCode}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">
                        (ClientProfile.ClientStatusID = CSI003)
                      </span>
                    </div>
                    <button
                      onClick={() => handleInspectClient(c.clientId)}
                      className="px-2.5 py-1 rounded-lg border hover:bg-[var(--surface-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[11px] flex items-center gap-1"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <span>Inspect Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-[var(--text-muted)]">
                    <div>Sector: <strong className="text-[var(--text-primary)]">{c.domainName}</strong></div>
                    <div>Location: <strong className="text-[var(--text-primary)]">{c.locationName}</strong></div>
                    <div>Tenure: <strong className="text-[var(--text-primary)]">{c.derivedTenureYears} yrs</strong></div>
                    <div>Company Revenue: <strong className="text-[var(--accent-cyan)]">{currencyService.format(c.companyRevenue, c.companyRevenueCurrency || 'USD')}</strong></div>
                  </div>

                  <div
                    className="mt-2 p-3 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--surface-input)',
                      borderColor: 'var(--border-subtle)'
                    }}
                  >
                    <strong className="text-rose-400 block text-[11px] mb-0.5">Recorded Churn Rationale:</strong>
                    <span className="text-[var(--text-primary)]">{c.churnReason || 'Not documented'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
