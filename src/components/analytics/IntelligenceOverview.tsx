import React, { useMemo } from 'react';
import { useUniverse } from '../../context/UniverseContext';
import { excelEngine } from '../../services/excelService';
import { currencyService } from '../../services/currencyService';
import { ReportingScopeSelector } from './ReportingScopeSelector';
import {
  Users,
  Briefcase,
  Globe2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  Building2,
  DollarSign
} from 'lucide-react';
import { CompanyLogo } from '../common/CompanyLogo';

export const IntelligenceOverview: React.FC = () => {
  const {
    workbookData,
    isWorkbookLoading,
    workbookError,
    setActiveTab,
    setSelectedClient,
    setDirectoryStatusFilter,
    setDirectorySearch,
    setDirectoryPage,
    selectedPeriodTypeId,
    selectedCurrency,
    selectedYear,
    setUploadModalOpen
  } = useUniverse();

  // Dynamic KPIs computed directly from parsed workbook with currency conversion
  const kpis = useMemo(() => {
    return excelEngine.getSummaryKpis({
      periodTypeId: selectedPeriodTypeId,
      currencyCode: selectedCurrency,
      year: selectedYear
    });
  }, [workbookData, selectedPeriodTypeId, selectedCurrency, selectedYear]);

  // Top employers preview
  const topEmployees = useMemo(() => {
    return excelEngine.getEmployeeRankings().slice(0, 5);
  }, [workbookData]);

  // Domain revenue preview (converted into selected reporting currency)
  const domainRevenueData = useMemo(() => {
    return excelEngine.getDomainRevenue({
      periodTypeId: selectedPeriodTypeId,
      currencyCode: selectedCurrency,
      year: selectedYear
    });
  }, [workbookData, selectedPeriodTypeId, selectedCurrency, selectedYear]);

  const formatMoney = (val: number, compact: boolean = false) => {
    return currencyService.format(val, selectedCurrency, { compact });
  };

  const handleFilterToStatus = (status: string) => {
    setDirectoryStatusFilter(status);
    setDirectorySearch('');
    setDirectoryPage(1);
    setActiveTab('clients');
  };

  if (isWorkbookLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-cyan)] border-t-transparent animate-spin mb-3" />
        <p className="text-sm font-mono-tech text-[var(--text-primary)] font-bold">
          LOADING Consilio_Final.xlsx...
        </p>
        <p className="text-xs font-mono-tech text-[var(--text-muted)] mt-1">
          Parsing worksheets and verifying enterprise records.
        </p>
      </div>
    );
  }

  if (workbookError) {
    return (
      <div
        className="p-6 rounded-2xl border text-center font-mono-tech space-y-3"
        style={{
          backgroundColor: 'var(--status-error-bg)',
          borderColor: 'var(--status-error-border)',
          color: 'var(--status-error)'
        }}
      >
        <AlertTriangle className="w-8 h-8 mx-auto" />
        <h3 className="text-base font-bold">WORKBOOK LOAD FAILURE</h3>
        <p className="text-xs max-w-md mx-auto text-[var(--text-secondary)]">{workbookError}</p>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--accent-cyan)] text-black hover:opacity-90 transition-opacity"
        >
          Open Workbook Inspector
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-5">
      {/* Scope Controls with Target Reporting Currency */}
      <ReportingScopeSelector />

      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        
        {/* ========================================================
            Group 1: Client Portfolio Health & Demographics
            ======================================================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold font-display uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[var(--accent-cyan)]" />
                <span>Client Portfolio Health</span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)] font-mono-tech">
                Active roster, risk assessment, and lifecycle distribution from Client & ClientProfile worksheets
              </p>
            </div>
            <button
              onClick={() => {
                setDirectoryStatusFilter('all');
                setDirectorySearch('');
                setActiveTab('clients');
              }}
              className="text-xs font-mono-tech text-[var(--accent-cyan)] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Directory (All {kpis.totalClients})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Total Clients Card */}
            <div
              onClick={() => {
                setDirectoryStatusFilter('all');
                setActiveTab('clients');
              }}
              className="p-4 rounded-xl border transition-all duration-150 cursor-pointer hover:border-[var(--accent-cyan)] group"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div className="text-[11px] font-mono-tech text-[var(--text-muted)] uppercase tracking-wider mb-1">
                Total Clients
              </div>
              <div className="text-3xl font-bold font-mono-tech text-[var(--text-primary)] tracking-tight">
                {kpis.totalClients}
              </div>
              <div className="text-xs text-[var(--text-secondary)] font-mono-tech mt-1.5 flex items-center justify-between">
                <span>Avg Tenure: <strong className="text-[var(--text-primary)]">{kpis.averageTenureYears} yrs</strong></span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--accent-cyan)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Active Clients Card (Actionable Filter) */}
            <div
              onClick={() => handleFilterToStatus('Active')}
              className="p-4 rounded-xl border transition-all duration-150 cursor-pointer hover:border-emerald-500 group"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div className="text-[11px] font-mono-tech text-[var(--text-muted)] uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Active Clients</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="text-3xl font-bold font-mono-tech text-emerald-500 tracking-tight">
                {kpis.activeClients}
              </div>
              <div className="text-xs text-[var(--text-secondary)] font-mono-tech mt-1.5 flex items-center justify-between">
                <span>{kpis.totalClients > 0 ? ((kpis.activeClients / kpis.totalClients) * 100).toFixed(1) : 0}% of portfolio</span>
                <span className="text-[11px] text-emerald-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Filter →</span>
              </div>
            </div>

            {/* At Risk Clients Card (Actionable Filter) */}
            <div
              onClick={() => handleFilterToStatus('At Risk')}
              className="p-4 rounded-xl border transition-all duration-150 cursor-pointer hover:border-amber-500 group"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div className="text-[11px] font-mono-tech text-[var(--text-muted)] uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>At Risk</span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <div className="text-3xl font-bold font-mono-tech text-amber-500 tracking-tight">
                {kpis.atRiskClients}
              </div>
              <div className="text-xs text-[var(--text-secondary)] font-mono-tech mt-1.5 flex items-center justify-between">
                <span>Requires retention triage</span>
                <span className="text-[11px] text-amber-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Inspect →</span>
              </div>
            </div>

            {/* Churned Clients Card (Actionable Filter) - EXACTLY 3: C014, C015, C026 */}
            <div
              onClick={() => handleFilterToStatus('Churned')}
              className="p-4 rounded-xl border transition-all duration-150 cursor-pointer hover:border-rose-500 group"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div className="text-[11px] font-mono-tech text-[var(--text-muted)] uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Churned Clients</span>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              </div>
              <div className="text-3xl font-bold font-mono-tech text-rose-500 tracking-tight">
                {kpis.churnedClients}
              </div>
              <div className="text-xs text-[var(--text-secondary)] font-mono-tech mt-1.5 flex items-center justify-between">
                <span>Authoritative: C014, C015, C026</span>
                <span className="text-[11px] text-rose-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Inspect →</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            Group 2: Revenue Intelligence & Sector Performance (Converted)
            ======================================================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold font-display uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[var(--accent-cyan)]" />
                <span>Revenue Intelligence ({selectedCurrency})</span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)] font-mono-tech">
                Consilio fee collections normalized into {selectedCurrency} for {selectedPeriodTypeId === 1 ? `FY ${selectedYear} (Annual)` : 'YTD Interim'} via ECB reference rates
              </p>
            </div>
            <button
              onClick={() => setActiveTab('revenue')}
              className="text-xs font-mono-tech text-[var(--accent-cyan)] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Full Rankings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
            {/* Total Converted Revenue */}
            <div
              onClick={() => setActiveTab('revenue')}
              className="p-4 rounded-xl border cursor-pointer hover:border-[var(--accent-cyan)] group"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div className="text-[11px] font-mono-tech text-[var(--text-muted)] uppercase tracking-wider mb-1">
                Total Converted Revenue ({selectedCurrency})
              </div>
              <div className="text-3xl font-bold font-mono-tech text-[var(--accent-cyan-text)] tracking-tight">
                {formatMoney(domainRevenueData.totalEligibleRevenue, true)}
              </div>
              <div className="text-xs text-[var(--text-secondary)] font-mono-tech mt-1.5 flex items-center justify-between">
                <span>{domainRevenueData.contributingClientsTotal} contributing clients</span>
                <span className="text-[11px] text-[var(--accent-cyan)] opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
              </div>
            </div>

            {/* Top Revenue Sector (Out of 5 authoritative sectors) */}
            {domainRevenueData.domains.length > 0 && (
              <div
                onClick={() => setActiveTab('revenue')}
                className="p-4 rounded-xl border cursor-pointer hover:border-[var(--accent-cyan)] group"
                style={{
                  backgroundColor: 'var(--surface-card)',
                  borderColor: 'var(--border-subtle)'
                }}
              >
                <div className="text-[11px] font-mono-tech text-[var(--text-muted)] uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Leading Sector</span>
                  <Globe2 className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="text-xl font-bold font-display text-[var(--text-primary)] truncate mt-1">
                  {domainRevenueData.domains[0].domainName}
                </div>
                <div className="text-xs text-[var(--text-secondary)] font-mono-tech mt-1.5 flex items-center justify-between">
                  <span>
                    <strong className="text-[var(--text-primary)]">{formatMoney(domainRevenueData.domains[0].revenueTotal, true)}</strong> ({domainRevenueData.domains[0].contributionPct}%)
                  </span>
                  <span className="text-[11px] text-[var(--accent-cyan)] opacity-0 group-hover:opacity-100 transition-opacity">Analyze →</span>
                </div>
              </div>
            )}

            {/* Operating Sectors Count (5 Domains) */}
            <div
              onClick={() => setActiveTab('revenue')}
              className="p-4 rounded-xl border cursor-pointer hover:border-[var(--accent-cyan)] group"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div className="text-[11px] font-mono-tech text-[var(--text-muted)] uppercase tracking-wider mb-1">
                Active Domains
              </div>
              <div className="text-3xl font-bold font-mono-tech text-[var(--text-primary)] tracking-tight">
                {kpis.totalDomains}
              </div>
              <div className="text-xs text-[var(--text-secondary)] font-mono-tech mt-1.5 flex items-center justify-between">
                <span>Across 5 authoritative enterprise sectors</span>
                <span className="text-[11px] text-[var(--accent-cyan)] opacity-0 group-hover:opacity-100 transition-opacity">Explore →</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            Group 3: Services Intelligence & Enterprise Delivery
            ======================================================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold font-display uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                <span>Service Adoption & Delivery Capacity</span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)] font-mono-tech">
                Utilization metrics across S001 through S008 legal technology and consulting services
              </p>
            </div>
            <button
              onClick={() => setActiveTab('services')}
              className="text-xs font-mono-tech text-[var(--accent-cyan)] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Services Matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Total Services */}
            <div
              onClick={() => setActiveTab('services')}
              className="p-4 rounded-xl border cursor-pointer hover:border-emerald-500 group"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div className="text-[11px] font-mono-tech text-[var(--text-muted)] uppercase tracking-wider mb-1">
                Service Catalog
              </div>
              <div className="text-3xl font-bold font-mono-tech text-[var(--text-primary)] tracking-tight">
                {kpis.totalServices}
              </div>
              <div className="text-xs text-[var(--text-secondary)] font-mono-tech mt-1.5">
                S001 to S008 in ascending sequence
              </div>
            </div>

            {/* Active Service Assignments */}
            <div
              onClick={() => setActiveTab('services')}
              className="p-4 rounded-xl border cursor-pointer hover:border-emerald-500 group"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div className="text-[11px] font-mono-tech text-[var(--text-muted)] uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Active Assignments</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold font-mono-tech text-emerald-500 tracking-tight">
                {kpis.clientServiceAssignments.active}
              </div>
              <div className="text-xs text-[var(--text-secondary)] font-mono-tech mt-1.5">
                {kpis.clientServiceAssignments.total > 0
                  ? ((kpis.clientServiceAssignments.active / kpis.clientServiceAssignments.total) * 100).toFixed(1)
                  : 0}% active engagement rate
              </div>
            </div>

            {/* Historical Ended Assignments */}
            <div
              onClick={() => setActiveTab('services')}
              className="p-4 rounded-xl border cursor-pointer hover:border-slate-500 group"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div className="text-[11px] font-mono-tech text-[var(--text-muted)] uppercase tracking-wider mb-1">
                Completed Engagements
              </div>
              <div className="text-3xl font-bold font-mono-tech text-[var(--text-secondary)] tracking-tight">
                {kpis.clientServiceAssignments.ended}
              </div>
              <div className="text-xs text-[var(--text-secondary)] font-mono-tech mt-1.5">
                {kpis.clientServiceAssignments.total} total historical contracts
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            Group 4: Detailed Breakdown: Sector Share & Largest Employers
            ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
          {/* Sector Share Distribution List (5 authoritative domains) */}
          <div
            className="p-4 rounded-xl border space-y-3"
            style={{
              backgroundColor: 'var(--surface-card)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono-tech uppercase tracking-wider text-[var(--text-primary)]">
                Sector Revenue Contribution ({selectedCurrency})
              </h3>
              <span className="text-[11px] font-mono-tech text-[var(--text-muted)]">
                {domainRevenueData.domains.length} Authoritative Sectors
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {domainRevenueData.domains.map((d) => (
                <div key={d.domainId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono-tech">
                    <span className="text-[var(--text-primary)] font-medium truncate max-w-[260px]">
                      {d.domainName}
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-[var(--accent-cyan-text)]">
                        {formatMoney(d.revenueTotal)}
                      </span>
                      <span className="text-[var(--text-muted)] text-[11px] w-12 text-right">
                        {d.contributionPct}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-500/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--accent-cyan)] transition-all duration-300"
                      style={{ width: `${Math.min(d.contributionPct, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Enterprise Employers Preview */}
          <div
            className="p-4 rounded-xl border space-y-3"
            style={{
              backgroundColor: 'var(--surface-card)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono-tech uppercase tracking-wider text-[var(--text-primary)]">
                Largest Enterprise Employers
              </h3>
              <button
                onClick={() => {
                  setDirectoryStatusFilter('all');
                  setActiveTab('clients');
                }}
                className="text-[11px] font-mono-tech text-[var(--accent-cyan)] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {topEmployees.map((c) => {
                const fullClient = workbookData?.enrichedClients.find(ec => ec.clientId === c.clientId);
                return (
                  <div
                    key={c.clientId}
                    onClick={() => {
                      if (fullClient) {
                        setSelectedClient(fullClient);
                        setActiveTab('detail');
                      }
                    }}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs font-mono-tech hover:bg-[var(--table-row-hover)] px-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-4 text-center font-bold text-[var(--text-muted)]">
                        #{c.rank}
                      </span>
                      <CompanyLogo
                        logoUrl={c.logoUrl}
                        companyName={c.clientName}
                        clientCode={c.clientCode}
                        size="sm"
                      />
                      <div className="min-w-0 truncate">
                        <p className="font-semibold text-[var(--text-primary)] truncate hover:text-[var(--accent-cyan)] transition-colors">
                          {c.clientName}
                        </p>
                        <p className="text-[11px] text-[var(--text-secondary)]">
                          {c.domainName} · {c.locationName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-[var(--text-primary)]">
                        {c.employeeCount !== null ? c.employeeCount.toLocaleString() : 'N/A'}
                      </span>
                      <span className="block text-[10px] text-[var(--text-muted)]">employees</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
