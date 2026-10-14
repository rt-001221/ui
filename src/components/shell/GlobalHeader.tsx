import React from 'react';
import { useUniverse } from '../../context/UniverseContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Sun,
  Moon,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  FileSpreadsheet
} from 'lucide-react';

export const GlobalHeader: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedClient,
    setSelectedClient,
    isSidebarCollapsed,
    toggleSidebar,
    setUploadModalOpen
  } = useUniverse();

  const { theme, toggleTheme } = useTheme();

  // Helper for human-readable active section name in breadcrumbs
  const getSectionTitle = () => {
    switch (activeTab) {
      case 'overview':
        return 'OVERVIEW';
      case 'revenue':
        return 'REVENUE';
      case 'clients':
        return 'CLIENTS';
      case 'detail':
        return 'CLIENTS';
      case 'growth':
        return 'GROWTH';
      case 'services':
        return 'SERVICES';
      case 'observatory':
        return '3D OBSERVATORY';
      default:
        return 'OVERVIEW';
    }
  };

  return (
    <header
      className="sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors duration-200"
      style={{
        backgroundColor: 'var(--surface-elevated)',
        borderColor: 'var(--border-subtle)'
      }}
    >
      <div className="max-w-[1920px] mx-auto px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
        
        {/* Left: Sidebar Toggle + Brand Wordmark + Functional Breadcrumbs */}
        <div className="flex items-center gap-3 lg:gap-5 min-w-0">
          
          {/* Sidebar Toggle */}
          <button
            onClick={toggleSidebar}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg border text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card-hover)] transition-colors shrink-0"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>

          {/* Brand Wordmark & CONSILIO label (aligned on one line at normal desktop widths) */}
          <div
            onClick={() => {
              setActiveTab('overview');
              setSelectedClient(null);
            }}
            className="flex items-center gap-2 cursor-pointer select-none shrink-0"
            title="SiloVerse Intelligence — Return to Overview"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-display font-bold text-xs tracking-wider border shadow-sm shrink-0"
              style={{
                backgroundColor: 'var(--accent-cyan-bg)',
                borderColor: 'var(--accent-cyan-border)',
                color: 'var(--accent-cyan-text)'
              }}
            >
              SV
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-display font-bold tracking-wider text-sm text-[var(--text-primary)]">
                SILOVERSE
              </span>
              <span
                className="text-[10px] px-1.5 py-0.2 rounded border font-mono-tech tracking-wider text-[var(--text-muted)]"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                CONSILIO
              </span>
            </div>
          </div>

          {/* Functional Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs font-mono-tech text-[var(--text-muted)] pl-3 border-l overflow-x-auto scrollbar-none whitespace-nowrap min-w-0"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            {/* Sector 05 Root */}
            <button
              onClick={() => {
                setActiveTab('overview');
                setSelectedClient(null);
              }}
              className="hover:text-[var(--accent-cyan)] transition-colors shrink-0"
            >
              SECTOR 05
            </button>

            <ChevronRight className="w-3 h-3 shrink-0 opacity-40" />

            {/* Intelligence Overview */}
            <button
              onClick={() => {
                setActiveTab('overview');
                setSelectedClient(null);
              }}
              className={`hover:text-[var(--accent-cyan)] transition-colors shrink-0 ${
                activeTab === 'overview' ? 'text-[var(--accent-cyan)] font-bold' : ''
              }`}
            >
              INTELLIGENCE
            </button>

            {/* Section segment if not overview */}
            {activeTab !== 'overview' && (
              <>
                <ChevronRight className="w-3 h-3 shrink-0 opacity-40" />
                <button
                  onClick={() => {
                    if (activeTab === 'detail') {
                      setActiveTab('clients');
                    }
                  }}
                  className={`hover:text-[var(--accent-cyan)] transition-colors shrink-0 ${
                    activeTab !== 'detail' ? 'text-[var(--accent-cyan)] font-bold' : ''
                  }`}
                >
                  {getSectionTitle()}
                </button>
              </>
            )}

            {/* Client Code Leaf if viewing details */}
            {activeTab === 'detail' && selectedClient && (
              <>
                <ChevronRight className="w-3 h-3 shrink-0 opacity-40" />
                <span className="text-[var(--accent-cyan)] font-bold shrink-0">
                  {selectedClient.clientCode}
                </span>
              </>
            )}
          </nav>
        </div>

        {/* Right: Minimal utility controls & Persistent Theme Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Subtle Workbook Source Button */}
          <button
            onClick={() => setUploadModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono-tech text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card-hover)] transition-colors"
            style={{ borderColor: 'var(--border-subtle)' }}
            title="Consilio_Final.xlsx workbook info"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">Consilio_Final.xlsx</span>
          </button>

          {/* Persistent OG / LIGHT Theme Toggle */}
          <div
            className="flex items-center p-0.5 rounded-full border text-xs font-mono-tech select-none"
            style={{
              backgroundColor: 'var(--surface-input)',
              borderColor: 'var(--border-subtle)'
            }}
            role="group"
            aria-label="Theme mode switcher"
          >
            <button
              onClick={() => theme !== 'og' && toggleTheme()}
              aria-pressed={theme === 'og'}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all ${
                theme === 'og'
                  ? 'bg-slate-900 text-cyan-300 font-bold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Moon className="w-3 h-3" />
              <span>OG</span>
            </button>
            <button
              onClick={() => theme !== 'light' && toggleTheme()}
              aria-pressed={theme === 'light'}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all ${
                theme === 'light'
                  ? 'bg-white text-slate-900 font-bold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Sun className="w-3 h-3" />
              <span>LIGHT</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
