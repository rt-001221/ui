import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { UniverseProvider, useUniverse } from './context/UniverseContext';
import { GlobalHeader } from './components/shell/GlobalHeader';
import { Sidebar } from './components/shell/Sidebar';
import { ObservatoryCanvas } from './components/spatial/ObservatoryCanvas';
import { ClientDirectory } from './components/client-explorer/ClientDirectory';
import { ClientDetailPanel } from './components/client-explorer/ClientDetailPanel';
import { IntelligenceOverview } from './components/analytics/IntelligenceOverview';
import { RevenueIntelligence } from './components/analytics/RevenueIntelligence';
import { GrowthLifecycle } from './components/analytics/GrowthLifecycle';
import { ServicesIntelligence } from './components/analytics/ServicesIntelligence';
import { DataQualityWorkbench } from './components/data-quality/DataQualityWorkbench';
import { WorkbookStatusModal } from './components/excel/WorkbookStatusModal';
import { AlertTriangle, FileSpreadsheet, ArrowRight } from 'lucide-react';

const SiloVerseMain: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedClient,
    setSelectedClient,
    workbookData,
    workbookError,
    setUploadModalOpen,
    isDqModalOpen,
    setDqModalOpen
  } = useUniverse();

  return (
    <div className="relative min-h-screen w-full flex flex-col overflow-hidden technical-grid">
      
      {/* Global Application Shell Header */}
      <GlobalHeader />

      {/* Excel Load Error Notice Bar */}
      {workbookError && (
        <div
          className="w-full px-4 py-2 flex items-center justify-between text-xs font-mono-tech z-20 border-b"
          style={{
            backgroundColor: 'var(--status-error-bg)',
            borderColor: 'var(--status-error-border)',
            color: 'var(--status-error)'
          }}
        >
          <div className="flex items-center gap-2 max-w-[1920px] mx-auto w-full">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong>WORKBOOK LOAD FAILURE:</strong> {workbookError}
            </span>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="ml-auto underline shrink-0 font-semibold flex items-center gap-1 hover:opacity-80"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Inspect Consilio_Final.xlsx</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace: Collapsible Sidebar + Content Viewport */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        
        {/* Primary Collapsible Sidebar */}
        <Sidebar />

        {/* Content Viewport */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto p-4 lg:p-6 relative z-10">
          
          {/* Perspective 1: Intelligence Overview (Statistics First) */}
          {activeTab === 'overview' && (
            <div className="flex-1 min-h-0">
              <IntelligenceOverview />
            </div>
          )}

          {/* Perspective 2: Revenue Intelligence */}
          {activeTab === 'revenue' && (
            <div className="flex-1 min-h-0">
              <RevenueIntelligence />
            </div>
          )}

          {/* Perspective 3: Client Directory */}
          {activeTab === 'clients' && (
            <div className="flex-1 min-h-0">
              <ClientDirectory />
            </div>
          )}

          {/* Perspective 3 (Drilldown): Client Detail Profile */}
          {activeTab === 'detail' && (
            <div className="flex-1 min-h-0">
              <ClientDetailPanel />
            </div>
          )}

          {/* Perspective 4: Growth & Lifecycle Analytics */}
          {activeTab === 'growth' && (
            <div className="flex-1 min-h-0">
              <GrowthLifecycle />
            </div>
          )}

          {/* Perspective 5: Services Intelligence */}
          {activeTab === 'services' && (
            <div className="flex-1 min-h-0">
              <ServicesIntelligence />
            </div>
          )}

          {/* Perspective 6: Dedicated 3D Spatial Observatory */}
          {activeTab === 'observatory' && (
            <div className="flex-1 min-h-0 rounded-2xl border overflow-hidden relative" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}>
              <ObservatoryCanvas
                clients={workbookData?.enrichedClients || []}
                onSelectClient={(c) => {
                  setSelectedClient(c);
                }}
              />
            </div>
          )}
        </main>
      </div>

      {/* Authoritative Excel Workbook Inspection & Upload Modal */}
      <WorkbookStatusModal />

      {/* Data Quality Workbench Modal */}
      {isDqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="max-w-5xl w-full max-h-[90vh] flex flex-col p-6 rounded-2xl border shadow-2xl space-y-4 overflow-hidden"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <DataQualityWorkbench onClose={() => setDqModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <UniverseProvider>
        <SiloVerseMain />
      </UniverseProvider>
    </ThemeProvider>
  );
}
