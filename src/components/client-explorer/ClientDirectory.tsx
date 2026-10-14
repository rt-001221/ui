import React, { useMemo, useState } from 'react';
import { useUniverse } from '../../context/UniverseContext';
import { currencyService } from '../../services/currencyService';
import { EnrichedClient } from '../../types/schema';
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { CompanyLogo } from '../common/CompanyLogo';

export const ClientDirectory: React.FC = () => {
  const {
    workbookData,
    setSelectedClient,
    setActiveTab,
    selectedCurrency,
    directorySearch,
    setDirectorySearch,
    directoryStatusFilter,
    setDirectoryStatusFilter,
    directoryDomainFilter,
    setDirectoryDomainFilter,
    directoryRegionFilter,
    setDirectoryRegionFilter,
    directoryTierFilter,
    setDirectoryTierFilter,
    directoryPage,
    setDirectoryPage
  } = useUniverse();

  const [sortBy, setSortBy] = useState<'name' | 'employees' | 'companyRevenue' | 'tenure' | 'services'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const pageSize = 10;

  // 5 authoritative domains only
  const domains = workbookData?.domains || [];
  const regions = workbookData?.regions || [];
  const statuses = workbookData?.clientStatuses || [];
  const tiers = workbookData?.clientTiers || [];

  // Filter & sort clients
  const filteredClients = useMemo(() => {
    if (!workbookData) return [];

    return workbookData.enrichedClients.filter(c => {
      // Search
      if (directorySearch.trim()) {
        const query = directorySearch.toLowerCase();
        const matchName = c.clientName.toLowerCase().includes(query);
        const matchCode = c.clientCode.toLowerCase().includes(query);
        if (!matchName && !matchCode) return false;
      }

      // Domain filter
      if (directoryDomainFilter !== 'all' && String(c.domainId) !== String(directoryDomainFilter)) {
        return false;
      }

      // Region filter
      if (directoryRegionFilter !== 'all' && String(c.regionCodeId) !== String(directoryRegionFilter)) {
        return false;
      }

      // Status filter
      if (directoryStatusFilter !== 'all' && c.clientStatusName !== directoryStatusFilter) {
        return false;
      }

      // Tier filter
      if (directoryTierFilter !== 'all' && c.clientTierName !== directoryTierFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.clientName.localeCompare(b.clientName);
      } else if (sortBy === 'employees') {
        const ea = a.employeeCount ?? -1;
        const eb = b.employeeCount ?? -1;
        comparison = ea - eb;
      } else if (sortBy === 'companyRevenue') {
        const ra = a.companyRevenue ?? -1;
        const rb = b.companyRevenue ?? -1;
        comparison = ra - rb;
      } else if (sortBy === 'tenure') {
        comparison = a.derivedTenureYears - b.derivedTenureYears;
      } else if (sortBy === 'services') {
        comparison = a.distinctServicesCount - b.distinctServicesCount;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [
    workbookData,
    directorySearch,
    directoryDomainFilter,
    directoryRegionFilter,
    directoryStatusFilter,
    directoryTierFilter,
    sortBy,
    sortOrder
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const paginatedClients = useMemo(() => {
    const start = (directoryPage - 1) * pageSize;
    return filteredClients.slice(start, start + pageSize);
  }, [filteredClients, directoryPage, pageSize]);

  const toggleSort = (field: 'name' | 'employees' | 'companyRevenue' | 'tenure' | 'services') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleSelectClient = (c: EnrichedClient) => {
    setSelectedClient(c);
    setActiveTab('detail');
  };

  const handleResetFilters = () => {
    setDirectorySearch('');
    setDirectoryDomainFilter('all');
    setDirectoryRegionFilter('all');
    setDirectoryStatusFilter('all');
    setDirectoryTierFilter('all');
    setDirectoryPage(1);
  };

  const formatRevenue = (val: number | null, curr: string | null) => {
    if (val === null || val === undefined) return 'N/A';
    return currencyService.format(val, curr || 'USD', { compact: true });
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Search and Filters Header */}
      <div
        className="p-4 rounded-xl border space-y-3"
        style={{
          backgroundColor: 'var(--surface-card)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by client name or code (e.g. Raymond James, C001)..."
              value={directorySearch}
              onChange={(e) => { setDirectorySearch(e.target.value); setDirectoryPage(1); }}
              className="w-full pl-9 pr-4 py-2 rounded-xl border text-xs font-mono-tech ui-input"
            />
          </div>

          {/* Quick Counter & Reset */}
          <div className="flex items-center gap-3 text-xs font-mono-tech text-[var(--text-secondary)]">
            <span>
              Showing <strong className="text-[var(--text-primary)] font-bold">{filteredClients.length}</strong> of {workbookData?.clients.length || 49} Clients
            </span>

            {(directorySearch || directoryDomainFilter !== 'all' || directoryRegionFilter !== 'all' || directoryStatusFilter !== 'all' || directoryTierFilter !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-[var(--accent-cyan)] hover:underline font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdown Bar — 5 Authoritative Sectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono-tech">
          {/* Domain (5 sectors only) */}
          <select
            value={directoryDomainFilter}
            onChange={(e) => { setDirectoryDomainFilter(e.target.value); setDirectoryPage(1); }}
            className="px-2.5 py-1.5 rounded-lg border font-semibold ui-input truncate cursor-pointer"
          >
            <option value="all">All Sectors ({domains.length})</option>
            {domains.map(d => (
              <option key={String(d.DomainID)} value={String(d.DomainID)}>{d.DomainName}</option>
            ))}
          </select>

          {/* Location / Region */}
          <select
            value={directoryRegionFilter}
            onChange={(e) => { setDirectoryRegionFilter(e.target.value); setDirectoryPage(1); }}
            className="px-2.5 py-1.5 rounded-lg border font-semibold ui-input truncate cursor-pointer"
          >
            <option value="all">All Locations ({regions.length})</option>
            {regions.map(r => (
              <option key={String(r.RegionCodeID)} value={String(r.RegionCodeID)}>{r.RegionName}</option>
            ))}
          </select>

          {/* Lifecycle Status (Active, At Risk, Churned, Dormant) */}
          <select
            value={directoryStatusFilter}
            onChange={(e) => { setDirectoryStatusFilter(e.target.value); setDirectoryPage(1); }}
            className="px-2.5 py-1.5 rounded-lg border font-semibold ui-input truncate cursor-pointer"
          >
            <option value="all">All Statuses ({statuses.length})</option>
            {statuses.map(st => (
              <option key={String(st.ClientStatusID)} value={st.ClientStatusName}>{st.ClientStatusName}</option>
            ))}
            <option value="Missing Profile">Missing Profile</option>
          </select>

          {/* Client Tier */}
          <select
            value={directoryTierFilter}
            onChange={(e) => { setDirectoryTierFilter(e.target.value); setDirectoryPage(1); }}
            className="px-2.5 py-1.5 rounded-lg border font-semibold ui-input truncate cursor-pointer"
          >
            <option value="all">All Tiers ({tiers.length})</option>
            {tiers.map(t => (
              <option key={String(t.ClientTierID)} value={t.ClientTierName}>{t.ClientTierName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div
        className="flex-1 rounded-xl border overflow-hidden flex flex-col"
        style={{
          backgroundColor: 'var(--surface-card)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs font-mono-tech whitespace-nowrap">
            <thead
              className="border-b text-[var(--text-muted)] sticky top-0 z-10"
              style={{
                backgroundColor: 'var(--table-header-bg)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <tr>
                <th className="py-3 px-3.5 font-semibold">Client Name & Logo</th>
                <th className="py-3 px-3.5 font-semibold">Domain / Sector</th>
                <th className="py-3 px-3.5 font-semibold">Location</th>
                <th
                  onClick={() => toggleSort('tenure')}
                  className="py-3 px-3.5 font-semibold cursor-pointer hover:text-[var(--text-primary)]"
                >
                  <div className="flex items-center gap-1">
                    <span>Tenure</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('employees')}
                  className="py-3 px-3.5 font-semibold text-right cursor-pointer hover:text-[var(--text-primary)]"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Employees</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('companyRevenue')}
                  className="py-3 px-3.5 font-semibold text-right cursor-pointer hover:text-[var(--text-primary)]"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Company Revenue</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('services')}
                  className="py-3 px-3.5 font-semibold text-center cursor-pointer hover:text-[var(--text-primary)]"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Services</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3.5 font-semibold text-center">Status</th>
                <th className="py-3 px-3.5 font-semibold text-center">Tier</th>
                <th className="py-3 px-3.5 font-semibold text-center w-20">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {paginatedClients.map(c => (
                <tr
                  key={c.clientId}
                  onClick={() => handleSelectClient(c)}
                  className="hover:bg-[var(--table-row-hover)] cursor-pointer transition-colors"
                >
                  {/* Name, Code, Logo (~48px container) */}
                  <td className="py-2.5 px-3.5">
                    <div className="flex items-center gap-3">
                      <CompanyLogo
                        logoUrl={c.logoUrl}
                        companyName={c.clientName}
                        clientCode={c.clientCode}
                        size="md"
                      />
                      <div>
                        <span className="font-bold text-[var(--text-primary)] block hover:text-[var(--accent-cyan)] transition-colors text-xs">
                          {c.clientName}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">{c.clientCode}</span>
                      </div>
                    </div>
                  </td>

                  {/* Domain */}
                  <td className="py-2.5 px-3.5 text-[var(--text-secondary)]">
                    {c.domainName}
                  </td>

                  {/* Location */}
                  <td className="py-2.5 px-3.5 text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-[var(--accent-cyan)] opacity-70 shrink-0" />
                      <span>{c.locationName}</span>
                    </span>
                  </td>

                  {/* Derived Tenure */}
                  <td className="py-2.5 px-3.5 text-[var(--text-secondary)]">
                    <span className="font-bold text-[var(--text-primary)]">{c.derivedTenureYears} yrs</span>
                    <span className="block text-[10px] text-[var(--text-muted)]">Since {c.tenureStartDate}</span>
                  </td>

                  {/* Employees */}
                  <td className="py-2.5 px-3.5 text-right font-bold text-[var(--text-primary)]">
                    {c.employeeCount !== null ? c.employeeCount.toLocaleString() : <span className="text-amber-500">N/A</span>}
                  </td>

                  {/* Company Revenue (Client's Own Financial Measure) */}
                  <td className="py-2.5 px-3.5 text-right font-bold text-[var(--accent-cyan-text)]" title="Client Company Revenue recorded in ClientProfile">
                    {formatRevenue(c.companyRevenue, c.companyRevenueCurrency)}
                  </td>

                  {/* Distinct Services */}
                  <td className="py-2.5 px-3.5 text-center">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold border"
                      style={{
                        backgroundColor: 'var(--surface-input)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--accent-cyan-text)'
                      }}
                    >
                      <span>{c.distinctServicesCount}</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-normal">({c.activeServicesCount} act)</span>
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-2.5 px-3.5 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      c.clientStatusName === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                      c.clientStatusName === 'At Risk' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                      c.clientStatusName === 'Churned' ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' :
                      'bg-slate-500/10 text-slate-400 border-slate-500/30'
                    }`}>
                      {c.clientStatusName}
                    </span>
                  </td>

                  {/* Tier */}
                  <td className="py-2.5 px-3.5 text-center">
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded border"
                      style={{
                        backgroundColor: 'var(--surface-input)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-muted)'
                      }}
                    >
                      {c.clientTierName || 'Standard'}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-2.5 px-3.5 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSelectClient(c); }}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors"
                      title="Open Full Profile & Services"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {paginatedClients.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-[var(--text-muted)] font-mono-tech">
                    No clients match the active filter criteria. Try resetting filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div
          className="p-3 border-t flex items-center justify-between text-xs font-mono-tech text-[var(--text-secondary)]"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2">
            <span>Showing {paginatedClients.length} of {filteredClients.length} clients</span>
            <span>·</span>
            <span>{pageSize} per page</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[var(--text-muted)] mr-2">
              Page {directoryPage} of {totalPages}
            </span>
            <button
              onClick={() => setDirectoryPage(p => Math.max(1, p - 1))}
              disabled={directoryPage <= 1}
              className="p-1.5 rounded-lg border hover:bg-[var(--surface-card-hover)] disabled:opacity-30 disabled:pointer-events-none transition-all"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDirectoryPage(p => Math.min(totalPages, p + 1))}
              disabled={directoryPage >= totalPages}
              className="p-1.5 rounded-lg border hover:bg-[var(--surface-card-hover)] disabled:opacity-30 disabled:pointer-events-none transition-all"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
