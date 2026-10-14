import React, { useState, useMemo } from 'react';
import { useUniverse } from '../../context/UniverseContext';
import {
  Building2,
  MapPin,
  DollarSign,
  Briefcase,
  ArrowLeft,
  FileText,
  Info
} from 'lucide-react';
import { CompanyLogo } from '../common/CompanyLogo';
import { currencyService } from '../../services/currencyService';

export const ClientDetailPanel: React.FC = () => {
  const { selectedClient, setActiveTab, selectedCurrency } = useUniverse();
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'services' | 'revenues'>('profile');

  // Sort associated services in ascending service-code order (e.g. S001 -> S008)
  const sortedAssociatedServices = useMemo(() => {
    if (!selectedClient?.services) return [];
    return [...selectedClient.services].sort((a, b) => {
      const numA = parseInt(String(a.serviceCode || a.serviceId).replace(/\D/g, '') || '0', 10);
      const numB = parseInt(String(b.serviceCode || b.serviceId).replace(/\D/g, '') || '0', 10);
      if (numA !== numB) return numA - numB;
      return String(a.serviceCode || '').localeCompare(String(b.serviceCode || ''));
    });
  }, [selectedClient?.services]);

  if (!selectedClient) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <Building2 className="w-12 h-12 text-[var(--text-muted)] mb-3 opacity-40" />
        <h3 className="text-base font-bold font-display text-[var(--text-primary)]">
          No Client Selected
        </h3>
        <p className="text-xs text-[var(--text-secondary)] font-mono-tech mt-1 max-w-sm mb-4">
          Select a client from the Client Directory or 3D Spatial Observatory to inspect profile, services, and revenue.
        </p>
        <button
          onClick={() => setActiveTab('clients')}
          className="px-4 py-2 rounded-xl text-xs font-mono-tech bg-[var(--accent-cyan)] text-black font-semibold"
        >
          Open Client Directory
        </button>
      </div>
    );
  }

  const formatMoney = (amount: number | null, currency: string = 'USD') => {
    return currencyService.format(amount, currency);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Banner & Client Header */}
      <div
        className="p-5 rounded-xl border space-y-4"
        style={{
          backgroundColor: 'var(--surface-card)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Client Identity & Logo (84–96px desktop size) */}
          <div className="flex items-center gap-4">
            <CompanyLogo
              logoUrl={selectedClient.logoUrl}
              companyName={selectedClient.clientName}
              clientCode={selectedClient.clientCode}
              size="xl"
            />

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold font-display text-[var(--text-primary)]">
                  {selectedClient.clientName}
                </h2>
                <span
                  className="text-xs font-mono-tech px-2 py-0.5 rounded font-bold border"
                  style={{
                    backgroundColor: 'var(--accent-cyan-bg)',
                    borderColor: 'var(--accent-cyan-border)',
                    color: 'var(--accent-cyan-text)'
                  }}
                >
                  {selectedClient.clientCode}
                </span>
                <span className={`text-[10px] font-mono-tech px-2 py-0.5 rounded font-semibold border ${
                  selectedClient.clientStatusName === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                  selectedClient.clientStatusName === 'At Risk' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                  selectedClient.clientStatusName === 'Churned' ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' :
                  'bg-slate-500/10 text-slate-400 border-slate-500/30'
                }`}>
                  {selectedClient.clientStatusName}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs font-mono-tech text-[var(--text-secondary)] mt-1.5">
                <span>{selectedClient.domainName}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                  <span>{selectedClient.locationName}</span>
                </span>
                <span>·</span>
                <span>Tier: <strong className="text-[var(--text-primary)]">{selectedClient.clientTierName || 'Standard'}</strong></span>
                <span>·</span>
                <span>Scale: <strong className="text-[var(--text-primary)]">{selectedClient.companySizeName}</strong></span>
              </div>
            </div>
          </div>

          {/* Functional Back Action: returns to directory preserving query/filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('clients')}
              className="px-3.5 py-2 rounded-xl text-xs font-mono-tech border flex items-center gap-1.5 hover:bg-[var(--surface-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Directory</span>
            </button>
          </div>
        </div>

        {/* The 3 Visible Detail Tabs (Data Quality tab removed per Section 12) */}
        <div
          className="flex items-center gap-1.5 pt-2 border-t overflow-x-auto text-xs font-mono-tech"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'profile'
                ? 'bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan-text)] font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            style={{ border: activeSubTab === 'profile' ? '1px solid var(--accent-cyan-border)' : '1px solid transparent' }}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Profile & Overview</span>
          </button>

          <button
            onClick={() => setActiveSubTab('services')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'services'
                ? 'bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan-text)] font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            style={{ border: activeSubTab === 'services' ? '1px solid var(--accent-cyan-border)' : '1px solid transparent' }}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Associated Services ({selectedClient.services.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('revenues')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'revenues'
                ? 'bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan-text)] font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            style={{ border: activeSubTab === 'revenues' ? '1px solid var(--accent-cyan-border)' : '1px solid transparent' }}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Revenue Generated ({selectedClient.revenues.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto space-y-4">
        
        {/* Tab 1: Profile & Overview */}
        {activeSubTab === 'profile' && (
          <div className="space-y-4">
            
            {/* Metric Cards Grid (Distinct Financial Measures preserved cleanly) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              
              {/* Client Company Revenue */}
              <div
                className="p-4 rounded-xl border"
                style={{
                  backgroundColor: 'var(--surface-card)',
                  borderColor: 'var(--border-subtle)'
                }}
              >
                <div className="flex items-center justify-between text-[10px] font-mono-tech text-[var(--text-muted)] uppercase tracking-wider">
                  <span>Client Company Revenue</span>
                  <span title="Client enterprise's own total reported revenue from ClientProfile.CompanyRevenue">
                    <Info className="w-3 h-3 text-[var(--text-muted)]" />
                  </span>
                </div>
                <p className="text-xl font-bold font-mono-tech text-[var(--accent-cyan-text)] mt-1">
                  {formatMoney(selectedClient.companyRevenue, selectedClient.companyRevenueCurrency || 'USD')}
                </p>
                <span className="text-[10px] font-mono-tech text-[var(--text-secondary)]">Reported enterprise scale</span>
              </div>

              {/* Headcount */}
              <div
                className="p-4 rounded-xl border"
                style={{
                  backgroundColor: 'var(--surface-card)',
                  borderColor: 'var(--border-subtle)'
                }}
              >
                <span className="text-[10px] font-mono-tech text-[var(--text-muted)] block uppercase tracking-wider">
                  Workforce Headcount
                </span>
                <p className="text-xl font-bold font-mono-tech text-[var(--text-primary)] mt-1">
                  {selectedClient.employeeCount !== null ? selectedClient.employeeCount.toLocaleString() : 'N/A'}
                </p>
                <span className="text-[10px] font-mono-tech text-[var(--text-secondary)]">ClientProfile.EmployeeCount</span>
              </div>

              {/* Derived Tenure */}
              <div
                className="p-4 rounded-xl border"
                style={{
                  backgroundColor: 'var(--surface-card)',
                  borderColor: 'var(--border-subtle)'
                }}
              >
                <span className="text-[10px] font-mono-tech text-[var(--text-muted)] block uppercase tracking-wider">
                  Calculated Tenure
                </span>
                <p className="text-xl font-bold font-mono-tech text-emerald-500 mt-1">
                  {selectedClient.derivedTenureYears} Years
                </p>
                <span className="text-[10px] font-mono-tech text-[var(--text-secondary)]">Since {selectedClient.tenureStartDate}</span>
              </div>

              {/* Priority Value Score */}
              <div
                className="p-4 rounded-xl border"
                style={{
                  backgroundColor: 'var(--surface-card)',
                  borderColor: 'var(--border-subtle)'
                }}
              >
                <span className="text-[10px] font-mono-tech text-[var(--text-muted)] block uppercase tracking-wider">
                  Portfolio Value Score
                </span>
                <p className="text-xl font-bold font-mono-tech text-purple-500 mt-1">
                  {selectedClient.clientValueScore ?? 'N/A'} / 100
                </p>
                <span className="text-[10px] font-mono-tech text-[var(--text-secondary)]">Tier priority weighting</span>
              </div>
            </div>

            {/* Profile Attributes Table */}
            <div
              className="p-5 rounded-xl border space-y-3"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <h3 className="text-xs font-bold font-mono-tech uppercase tracking-wider text-[var(--accent-cyan)] flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                <span>Enterprise Profile Details</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono-tech">
                <div className="space-y-2.5">
                  <div className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[var(--text-muted)]">Client ID:</span>
                    <span className="text-[var(--text-primary)] font-bold">{selectedClient.clientId}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[var(--text-muted)]">Client Code:</span>
                    <span className="text-[var(--accent-cyan)] font-bold">{selectedClient.clientCode}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[var(--text-muted)]">Operating Sector:</span>
                    <span className="text-[var(--text-primary)] font-semibold">{selectedClient.domainName}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[var(--text-muted)]">Location / Region:</span>
                    <span className="text-[var(--text-primary)] font-semibold">{selectedClient.locationName} ({selectedClient.regionType})</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[var(--text-muted)]">Tenure Start Date:</span>
                    <span className="text-[var(--text-primary)]">{selectedClient.tenureStartDate}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[var(--text-muted)]">Company Size Band:</span>
                    <span className="text-[var(--text-primary)]">{selectedClient.companySizeName}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[var(--text-muted)]">Client Tier:</span>
                    <span className="text-[var(--text-primary)] font-bold">{selectedClient.clientTierName || 'Standard'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[var(--text-muted)]">Profile Verification:</span>
                    <span className="text-emerald-500 font-bold">{selectedClient.hasProfile ? 'Profile Record Verified' : 'Missing Profile Record'}</span>
                  </div>
                </div>
              </div>

              {selectedClient.churnReason && (
                <div className="mt-3 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs font-mono-tech text-rose-300">
                  <strong className="block text-rose-200">Documented Churn Reason:</strong>
                  <span className="mt-0.5 block">{selectedClient.churnReason}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Associated Services */}
        {activeSubTab === 'services' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-500" />
                  <span>Consilio Service Engagements</span>
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-mono-tech mt-0.5">
                  Distinct services availed: <strong className="text-[var(--text-primary)]">{selectedClient.distinctServicesCount}</strong> · Active: <strong className="text-emerald-500">{selectedClient.activeServicesCount}</strong> · Ended: <strong className="text-[var(--text-muted)]">{selectedClient.endedServicesCount}</strong>
                </p>
              </div>
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
                    <th className="py-2.5 px-3 font-semibold">Service Code</th>
                    <th className="py-2.5 px-3 font-semibold">Service Name</th>
                    <th className="py-2.5 px-3 font-semibold">Category</th>
                    <th className="py-2.5 px-3 font-semibold">Start Date</th>
                    <th className="py-2.5 px-3 font-semibold">End Date</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                  {sortedAssociatedServices.map(s => (
                    <tr key={s.clientServiceId} className="hover:bg-[var(--table-row-hover)] transition-colors">
                      <td className="py-2.5 px-3 font-bold text-[var(--accent-cyan)]">{s.serviceCode}</td>
                      <td className="py-2.5 px-3 font-bold text-[var(--text-primary)]">{s.serviceName}</td>
                      <td className="py-2.5 px-3 text-[var(--text-secondary)]">{s.serviceCategoryName}</td>
                      <td className="py-2.5 px-3 text-[var(--text-secondary)]">{s.serviceStartDate}</td>
                      <td className="py-2.5 px-3 text-[var(--text-secondary)]">{s.serviceEndDate || 'Present'}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          s.serviceStatusName === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                        }`}>
                          {s.serviceStatusName}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {sortedAssociatedServices.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[var(--text-muted)]">
                        No service assignments recorded for this client.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Revenue Generated */}
        {activeSubTab === 'revenues' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[var(--accent-cyan)]" />
                  <span>Revenue Generated for Consilio</span>
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-mono-tech mt-0.5">
                  Source: ClientRevenue.RevenueGenerated (Fees collected for delivered services)
                </p>
              </div>
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
                    <th className="py-2.5 px-3 font-semibold">Revenue Code</th>
                    <th className="py-2.5 px-3 font-semibold">Associated Service</th>
                    <th className="py-2.5 px-3 font-semibold">Interval Type</th>
                    <th className="py-2.5 px-3 font-semibold">Period Interval</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Raw Amount</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Orig. Curr.</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Converted ({selectedCurrency})</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Workbook YoY</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                  {selectedClient.revenues.map(r => {
                    const convertedVal = currencyService.convertRevenue(
                      r.revenueGenerated,
                      r.currencyCode,
                      selectedCurrency,
                      r.periodYear,
                      r.periodTypeId
                    );

                    return (
                      <tr key={r.clientRevenueId} className="hover:bg-[var(--table-row-hover)] transition-colors">
                        <td className="py-2.5 px-3 font-bold text-[var(--accent-cyan)]">{r.clientRevenueCode}</td>
                        <td className="py-2.5 px-3 text-[var(--text-primary)]">{r.serviceName}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            r.periodTypeName === 'Annual'
                              ? 'bg-cyan-500/10 text-[var(--accent-cyan)] border-cyan-500/20'
                              : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          }`}>
                            {r.periodTypeName}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[var(--text-secondary)]">
                          {r.periodStart} · {r.periodEnd}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-[var(--text-secondary)]">
                          {formatMoney(r.revenueGenerated, r.currencyCode)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className="font-bold text-[10px] px-1.5 py-0.5 rounded border"
                            style={{
                              backgroundColor: 'var(--surface-input)',
                              borderColor: 'var(--border-subtle)',
                              color: 'var(--text-primary)'
                            }}
                          >
                            {r.currencyCode}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[var(--accent-cyan-text)] text-sm">
                          {formatMoney(convertedVal, selectedCurrency)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {r.yoyGrowthPct !== null && r.yoyGrowthPct !== undefined ? (
                            <span className={r.yoyGrowthPct >= 0 ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                              {r.yoyGrowthPct > 0 ? `+${r.yoyGrowthPct}%` : `${r.yoyGrowthPct}%`}
                            </span>
                          ) : (
                            <span className="text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {selectedClient.revenues.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-[var(--text-muted)]">
                        No revenue records found for this client.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
