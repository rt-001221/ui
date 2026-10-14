import React, { useState, useMemo } from 'react';
import { useUniverse } from '../../context/UniverseContext';
import { excelEngine } from '../../services/excelService';
import { EnrichedClient } from '../../types/schema';
import {
  Layers,
  CheckCircle2,
  ExternalLink,
  Search,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export const ServicesIntelligence: React.FC = () => {
  const { workbookData, setSelectedClient, setActiveTab } = useUniverse();
  const [search, setSearch] = useState<string>('');
  const [selectedServiceCode, setSelectedServiceCode] = useState<string | 'all'>('all');
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  const intelligence = useMemo(() => {
    return excelEngine.getServicesIntelligence();
  }, [workbookData]);

  // Ascending S001..S008 service cards (Requirement 1)
  const orderedServices = useMemo(() => {
    return [...intelligence.adoptionList].sort((a, b) => a.numericCode - b.numericCode);
  }, [intelligence.adoptionList]);

  const filteredClients = useMemo(() => {
    return intelligence.clientsByServiceCount.filter(item => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = item.client.clientName.toLowerCase().includes(q);
        const matchCode = item.client.clientCode.toLowerCase().includes(q);
        if (!matchName && !matchCode) return false;
      }
      if (selectedServiceCode !== 'all') {
        const hasService = item.client.services.some(s => s.serviceCode === selectedServiceCode);
        if (!hasService) return false;
      }
      return true;
    });
  }, [intelligence, search, selectedServiceCode]);

  const handleInspectClient = (client: EnrichedClient) => {
    setSelectedClient(client);
    setActiveTab('detail');
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Summary Banner */}
      <div
        className="p-5 rounded-xl border space-y-3"
        style={{
          backgroundColor: 'var(--surface-card)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-500" />
              <span>Consilio Services Intelligence & Enterprise Adoption</span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)] font-mono-tech mt-0.5">
              Source: ClientService (132 assignments) & Service (8 distinct service offerings across 8 categories)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-mono-tech px-2.5 py-1 rounded-lg border font-bold"
              style={{
                backgroundColor: 'var(--surface-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            >
              8 Service Offerings · 132 Total Assignments
            </span>
          </div>
        </div>

        {/* 8 Services Adoption Cards Grid in ascending S001-S008 order */}
        {/* Row 1: S001, S002, S003, S004. Row 2: S005, S006, S007, S008 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
          {orderedServices.map(item => {
            const isSelected = selectedServiceCode === item.serviceCode;
            return (
              <div
                key={item.serviceCode}
                onClick={() => setSelectedServiceCode(isSelected ? 'all' : item.serviceCode)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[var(--accent-cyan-bg)] border-[var(--accent-cyan-border)] shadow-sm'
                    : 'hover:border-[var(--accent-cyan)]'
                }`}
                style={{
                  backgroundColor: isSelected ? undefined : 'var(--surface-input)',
                  borderColor: isSelected ? undefined : 'var(--border-subtle)'
                }}
              >
                <div className="flex items-center justify-between text-[11px] font-mono-tech text-[var(--text-muted)]">
                  <span className="font-bold text-[var(--accent-cyan)]">{item.serviceCode}</span>
                  <span>{item.adoptionPercentage}% Adoption</span>
                </div>
                <h4 className="font-bold text-xs font-display text-[var(--text-primary)] mt-1 truncate" title={item.serviceName}>
                  {item.serviceName}
                </h4>
                <p className="text-[10px] text-[var(--text-secondary)] truncate mt-0.5">{item.categoryName}</p>

                <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t text-[11px] font-mono-tech" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span>Clients: <strong className="text-[var(--text-primary)]">{item.totalClientAdoptions}</strong></span>
                  <span className="text-emerald-500 font-semibold">{item.activeAssignments} active</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Client Service Breakdown Table */}
      <div
        className="flex-1 rounded-xl border overflow-hidden flex flex-col space-y-3 p-4"
        style={{
          backgroundColor: 'var(--surface-card)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        {/* Table Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-xl border text-xs font-mono-tech ui-input"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-mono-tech">
            {selectedServiceCode !== 'all' && (
              <button
                onClick={() => setSelectedServiceCode('all')}
                className="px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-semibold flex items-center gap-1"
              >
                <span>Filtered by {selectedServiceCode} (Clear)</span>
              </button>
            )}
            <span className="text-[var(--text-muted)]">Showing {filteredClients.length} Clients</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1 rounded-xl border" style={{ borderColor: 'var(--border-subtle)' }}>
          <table className="w-full text-left text-xs font-mono-tech whitespace-nowrap">
            <thead
              className="border-b text-[var(--text-muted)]"
              style={{
                backgroundColor: 'var(--table-header-bg)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <tr>
                <th className="py-3 px-3.5 font-semibold w-8"></th>
                <th className="py-3 px-3.5 font-semibold">Client Name & Code</th>
                <th className="py-3 px-3.5 font-semibold">Sector</th>
                <th className="py-3 px-3.5 font-semibold text-center">Distinct Services Availed</th>
                <th className="py-3 px-3.5 font-semibold text-center">Active Engagements</th>
                <th className="py-3 px-3.5 font-semibold text-center">Ended Engagements</th>
                <th className="py-3 px-3.5 font-semibold text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {filteredClients.map(item => {
                const isExpanded = expandedClientId === item.client.clientId;
                return (
                  <React.Fragment key={item.client.clientId}>
                    <tr
                      onClick={() => setExpandedClientId(isExpanded ? null : item.client.clientId)}
                      className="hover:bg-[var(--table-row-hover)] cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3.5 text-center text-[var(--text-muted)]">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </td>
                      <td className="py-2.5 px-3.5 font-bold text-[var(--text-primary)]">
                        <span className="hover:text-[var(--accent-cyan)] transition-colors">{item.client.clientName}</span>
                        <span className="text-[10px] text-[var(--text-muted)] block">{item.client.clientCode}</span>
                      </td>
                      <td className="py-2.5 px-3.5 text-[var(--text-secondary)]">
                        {item.client.domainName}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span
                          className="inline-flex items-center gap-1 font-bold font-mono text-sm px-2 py-0.5 rounded border"
                          style={{
                            backgroundColor: 'var(--surface-input)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--accent-cyan-text)'
                          }}
                        >
                          {item.distinctCount}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span className="text-emerald-500 font-bold font-mono text-sm">
                          {item.activeCount}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span className="text-[var(--text-muted)] font-mono text-sm">
                          {item.endedCount}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleInspectClient(item.client); }}
                          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors"
                          title="Open Client Detail"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Sub-table */}
                    {isExpanded && (() => {
                      // Sort associated services by service code in ascending numerical order (e.g. S001 -> S008)
                      const sortedEngagements = [...item.client.services].sort((a, b) => {
                        const numA = parseInt(String(a.serviceCode || a.serviceId).replace(/\D/g, '') || '0', 10);
                        const numB = parseInt(String(b.serviceCode || b.serviceId).replace(/\D/g, '') || '0', 10);
                        if (numA !== numB) return numA - numB;
                        return String(a.serviceCode || '').localeCompare(String(b.serviceCode || ''));
                      });

                      return (
                        <tr style={{ backgroundColor: 'var(--table-header-bg)' }}>
                          <td colSpan={7} className="p-4">
                            <div
                              className="rounded-xl border p-3.5 space-y-2.5"
                              style={{
                                backgroundColor: 'var(--surface-card)',
                                borderColor: 'var(--border-subtle)'
                              }}
                            >
                              <div className="flex items-center justify-between pb-1.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                                <span className="font-bold text-xs text-[var(--accent-cyan)]">
                                  Detailed Engagements for {item.client.clientName} ({sortedEngagements.length} records)
                                </span>
                                <span className="text-[10px] text-[var(--text-muted)]">Source: ClientService Sheet</span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                                {sortedEngagements.map(cs => (
                                  <div
                                    key={cs.clientServiceId}
                                    className="p-2.5 rounded-lg border flex items-center justify-between text-xs"
                                    style={{
                                      backgroundColor: 'var(--surface-input)',
                                      borderColor: 'var(--border-subtle)'
                                    }}
                                  >
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-[var(--text-primary)]">{cs.serviceName}</span>
                                        <span className="text-[10px] font-mono text-[var(--accent-cyan)]">({cs.serviceCode})</span>
                                      </div>
                                      <span className="text-[10px] text-[var(--text-muted)]">{cs.serviceCategoryName}</span>
                                      <span className="block text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">
                                        {cs.serviceStartDate} · {cs.serviceEndDate || 'Present'}
                                      </span>
                                    </div>

                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                      cs.serviceStatusName === 'Active'
                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                        : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                                    }`}>
                                      {cs.serviceStatusName}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })()}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
