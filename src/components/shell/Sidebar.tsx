import React from 'react';
import { useUniverse, NavigationTab } from '../../context/UniverseContext';
import {
  LayoutDashboard,
  DollarSign,
  Users,
  TrendingUp,
  Layers,
  Compass,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'revenue', label: 'Revenue', icon: DollarSign },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'growth', label: 'Growth', icon: TrendingUp },
  { id: 'services', label: 'Services', icon: Layers },
  { id: 'observatory', label: '3D', icon: Compass }
];

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isSidebarCollapsed,
    toggleSidebar,
    setUploadModalOpen,
    setDqModalOpen
  } = useUniverse();

  const handleNavClick = (id: NavigationTab) => {
    setActiveTab(id);
  };

  return (
    <aside
      className={`border-r flex flex-col shrink-0 transition-all duration-300 z-30 select-none ${
        isSidebarCollapsed ? 'w-16' : 'w-56'
      }`}
      style={{
        backgroundColor: 'var(--surface-elevated)',
        borderColor: 'var(--border-subtle)'
      }}
      aria-label="Primary Navigation"
    >
      {/* Navigation Items (The 6 Mandated Destinations) */}
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        <div className={`px-2 pb-2 text-[10px] font-mono-tech tracking-wider uppercase text-[var(--text-muted)] ${
          isSidebarCollapsed ? 'text-center' : ''
        }`}>
          {isSidebarCollapsed ? 'NAV' : 'PERSPECTIVES'}
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === 'clients' && activeTab === 'detail');

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              title={isSidebarCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-mono-tech transition-all duration-150 relative ${
                isActive
                  ? 'bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan-text)] font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card-hover)]'
              }`}
              style={{
                border: isActive ? '1px solid var(--accent-cyan-border)' : '1px solid transparent'
              }}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-muted)]'}`} />
              
              {!isSidebarCollapsed && (
                <span className="truncate tracking-wide">{item.label}</span>
              )}

              {isActive && (
                <span
                  className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[var(--accent-cyan)]"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Utilities Section at Bottom of Sidebar */}
      <div className="p-2 border-t space-y-1" style={{ borderColor: 'var(--border-subtle)' }}>
        {/* Workbook Data Quality Inspector */}
        <button
          onClick={() => setDqModalOpen(true)}
          title="Data Quality Audit Workbench"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-mono-tech text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card-hover)] transition-colors"
        >
          <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
          {!isSidebarCollapsed && <span className="truncate">Data Quality</span>}
        </button>

        {/* Excel Source Inspector */}
        <button
          onClick={() => setUploadModalOpen(true)}
          title="Consilio_Final.xlsx Status & Upload"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-mono-tech text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card-hover)] transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4 shrink-0 text-emerald-400" />
          {!isSidebarCollapsed && <span className="truncate">Workbook File</span>}
        </button>

        {/* Sidebar Collapse Toggle Button */}
        <button
          onClick={toggleSidebar}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-mono-tech text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card-hover)] transition-colors mt-2"
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-[var(--text-muted)]">Collapse Sidebar</span>
              <ChevronLeft className="w-4 h-4" />
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
