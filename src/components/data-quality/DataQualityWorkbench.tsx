import React, { useState, useMemo } from 'react';
import { useUniverse } from '../../context/UniverseContext';
import { excelEngine } from '../../services/excelService';
import { DataQualityCheckResult, CheckSeverity } from '../../types/schema';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Search,
  Eye,
  X
} from 'lucide-react';

interface DataQualityWorkbenchProps {
  onClose?: () => void;
}

export const DataQualityWorkbench: React.FC<DataQualityWorkbenchProps> = ({ onClose }) => {
  const { workbookData, setSelectedClient, setActiveTab, setDqModalOpen } = useUniverse();
  const [severityFilter, setSeverityFilter] = useState<'all' | CheckSeverity>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Passed' | 'Warning' | 'Failed'>('all');
  const [search, setSearch] = useState<string>('');
  const [inspectCheck, setInspectCheck] = useState<DataQualityCheckResult | null>(null);

  // Compute all 17 checks dynamically from parsed workbook in memory
  const checks = useMemo(() => {
    return excelEngine.runAllDataQualityChecks();
  }, [workbookData]);

  const summary = useMemo(() => {
    let failed = 0, warning = 0, passed = 0, totalIssues = 0;
    checks.forEach(c => {
      if (c.status === 'Failed') failed++;
      else if (c.status === 'Warning') warning++;
      else passed++;
      totalIssues += c.issueCount;
    });
    return { failed, warning, passed, totalIssues, totalChecks: checks.length };
  }, [checks]);

  const filteredChecks = useMemo(() => {
    return checks.filter(c => {
      if (severityFilter !== 'all' && c.severity !== severityFilter) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.sourceSheet.toLowerCase().includes(q);
      }
      return true;
    });
  }, [checks, severityFilter, statusFilter, search]);

  const handleInspectClient = (clientId?: string | number) => {
    if (!clientId) return;
    const client = workbookData?.enrichedClients.find(
      c => c.clientId === String(clientId) || c.clientCode === String(clientId)
    );
    if (client) {
      setSelectedClient(client);
      setActiveTab('detail');
      if (onClose) onClose();
      else setDqModalOpen(false);
    }
  };

  const handleCloseSelf = () => {
    if (onClose) onClose();
    else setDqModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Workbench Header & Summary */}
      <div
        className="p-5 rounded-xl border space-y-3"
        style={{
          backgroundColor: 'var(--surface-card)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[var(--accent-cyan)]" />
              <h2 className="text-base font-bold font-display text-[var(--text-primary)]">
                Data Quality & Schema Audit Workbench
              </h2>
              <span
                className="text-[10px] font-mono-tech px-2 py-0.5 rounded font-bold border"
                style={{
                  backgroundColor: 'var(--accent-cyan-bg)',
                  borderColor: 'var(--accent-cyan-border)',
                  color: 'var(--accent-cyan-text)'
                }}
              >
                17 PREDEFINED IN-MEMORY AUDIT CHECKS
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-mono-tech mt-1">
              Read-only in-browser validation across all 14 worksheets in Consilio_Final.xlsx. No database mutations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs font-mono-tech">
              <div className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{summary.failed} Failed</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{summary.warning} Warnings</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{summary.passed} Passed</span>
              </div>
            </div>

            {onClose && (
              <button
                onClick={handleCloseSelf}
                className="p-1.5 rounded-lg border text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t text-xs font-mono-tech" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search checks by name or code (e.g. DQ-01)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-xl border text-xs font-mono-tech ui-input"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--text-muted)]">Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="px-2 py-1 rounded-lg border font-semibold ui-input cursor-pointer"
              >
                <option value="all">All Severities</option>
                <option value="Error">Errors Only</option>
                <option value="Warning">Warnings Only</option>
                <option value="Informational">Informational Only</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[var(--text-muted)]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2 py-1 rounded-lg border font-semibold ui-input cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="Failed">Failed</option>
                <option value="Warning">Warning</option>
                <option value="Passed">Passed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Checks Grid / Table */}
      <div
        className="flex-1 rounded-xl border overflow-hidden flex flex-col p-4 space-y-3"
        style={{
          backgroundColor: 'var(--surface-card)',
          borderColor: 'var(--border-subtle)'
        }}
      >
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
                <th className="py-2.5 px-3 font-semibold w-16 text-center">Code</th>
                <th className="py-2.5 px-3 font-semibold">Check Name</th>
                <th className="py-2.5 px-3 font-semibold">Validation Purpose</th>
                <th className="py-2.5 px-3 font-semibold">Target Sheets</th>
                <th className="py-2.5 px-3 font-semibold text-center w-24">Severity</th>
                <th className="py-2.5 px-3 font-semibold text-center w-24">Status</th>
                <th className="py-2.5 px-3 font-semibold text-right w-24">Issues</th>
                <th className="py-2.5 px-3 font-semibold text-center w-20">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {filteredChecks.map(chk => (
                <tr
                  key={chk.checkId}
                  onClick={() => setInspectCheck(chk)}
                  className="hover:bg-[var(--table-row-hover)] cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-3 text-center font-bold text-[var(--accent-cyan)]">
                    {chk.code}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-[var(--text-primary)]">
                    <span className="hover:text-[var(--accent-cyan)] transition-colors">{chk.name}</span>
                  </td>
                  <td className="py-2.5 px-3 text-[var(--text-secondary)] max-w-sm truncate">
                    {chk.purpose}
                  </td>
                  <td className="py-2.5 px-3 text-[var(--text-muted)]">
                    {chk.sourceSheet}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      chk.severity === 'Error' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30' :
                      chk.severity === 'Warning' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' :
                      'bg-cyan-500/10 text-[var(--accent-cyan)] border border-cyan-500/30'
                    }`}>
                      {chk.severity}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                      chk.status === 'Passed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                      chk.status === 'Warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                      'bg-rose-500/10 text-rose-500 border-rose-500/30'
                    }`}>
                      {chk.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold">
                    <span className={chk.issueCount > 0 ? (chk.severity === 'Error' ? 'text-rose-500' : 'text-amber-500') : 'text-emerald-500'}>
                      {chk.issueCount}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); setInspectCheck(chk); }}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors"
                      title="Inspect Check Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Check Modal */}
      {inspectCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="max-w-3xl w-full max-h-[85vh] flex flex-col p-6 rounded-2xl border shadow-2xl space-y-4 overflow-hidden"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono-tech px-2 py-0.5 rounded font-bold border bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan-text)] border-[var(--accent-cyan-border)]">
                      {inspectCheck.code}
                    </span>
                    <h3 className="text-base font-bold font-display text-[var(--text-primary)]">
                      {inspectCheck.name}
                    </h3>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] font-mono-tech mt-0.5">
                    Source Worksheets: <span className="text-[var(--text-primary)]">{inspectCheck.sourceSheet}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectCheck(null)}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div
                className="p-3.5 rounded-xl border text-xs font-mono-tech space-y-1"
                style={{
                  backgroundColor: 'var(--surface-input)',
                  borderColor: 'var(--border-subtle)'
                }}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--accent-cyan)] block">Validation Rule & Purpose</span>
                <p className="text-[var(--text-primary)]">{inspectCheck.purpose}</p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1 font-mono">
                  <strong>Constraint:</strong> {inspectCheck.ruleExplanation}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold font-mono-tech uppercase tracking-wider text-[var(--text-primary)]">
                    Affected Records ({inspectCheck.issueCount})
                  </h4>
                  {inspectCheck.issueCount === 0 && (
                    <span className="text-xs font-mono-tech text-emerald-500 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Zero issues found</span>
                    </span>
                  )}
                </div>

                {inspectCheck.issueCount > 0 ? (
                  <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-subtle)' }}>
                    <table className="w-full text-left text-xs font-mono-tech">
                      <thead className="border-b text-[var(--text-muted)]" style={{ backgroundColor: 'var(--table-header-bg)', borderColor: 'var(--border-subtle)' }}>
                        <tr>
                          <th className="py-2 px-3">Record Reference</th>
                          <th className="py-2 px-3">Offending Field</th>
                          <th className="py-2 px-3">Value</th>
                          <th className="py-2 px-3">Explanation</th>
                          <th className="py-2 px-3 text-center w-20">Inspect</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                        {inspectCheck.affectedRecords.map((rec, i) => (
                          <tr key={i} className="hover:bg-[var(--table-row-hover)]">
                            <td className="py-2 px-3 font-bold text-[var(--accent-cyan)]">
                              {rec.clientName ? `${rec.clientName} (${rec.clientCode || rec.recordId})` : `ID: ${rec.recordId}`}
                            </td>
                            <td className="py-2 px-3 text-amber-500 font-mono">
                              {rec.offendingField}
                            </td>
                            <td className="py-2 px-3 text-rose-500 font-mono truncate max-w-[120px]">
                              {String(rec.offendingValue)}
                            </td>
                            <td className="py-2 px-3 text-[var(--text-secondary)]">
                              {rec.explanation}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {rec.clientId ? (
                                <button
                                  onClick={() => {
                                    setInspectCheck(null);
                                    handleInspectClient(rec.clientId);
                                  }}
                                  className="px-2 py-0.5 rounded text-[var(--accent-cyan)] font-semibold border border-[var(--accent-cyan-border)] hover:bg-[var(--accent-cyan-bg)] text-[10px]"
                                >
                                  Open
                                </button>
                              ) : (
                                <span className="text-[10px] text-[var(--text-muted)]">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-center text-xs font-mono-tech text-emerald-500 space-y-1">
                    <CheckCircle2 className="w-6 h-6 mx-auto" />
                    <p className="font-bold">Check Passed Cleanly</p>
                    <p className="text-[var(--text-muted)]">No anomalies detected across the parsed worksheets.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                onClick={() => setInspectCheck(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-mono-tech border hover:bg-[var(--surface-card-hover)] text-[var(--text-primary)]"
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
