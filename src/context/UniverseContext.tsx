import React, { createContext, useContext, useState, useEffect } from 'react';
import { EnrichedClient, WorkbookStats } from '../types/schema';
import { excelEngine, ParsedWorkbookData } from '../services/excelService';

export type NavigationTab = 
  | 'overview' 
  | 'revenue' 
  | 'clients' 
  | 'detail' 
  | 'growth' 
  | 'services' 
  | 'observatory'; // 3D Spatial Observatory

interface UniverseContextType {
  // Navigation
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  selectedClient: EnrichedClient | null;
  setSelectedClient: (client: EnrichedClient | null) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  toggleSidebar: () => void;

  // Preserved Client Directory state
  directorySearch: string;
  setDirectorySearch: (s: string) => void;
  directoryStatusFilter: string;
  setDirectoryStatusFilter: (status: string) => void;
  directoryDomainFilter: string;
  setDirectoryDomainFilter: (domain: string) => void;
  directoryRegionFilter: string;
  setDirectoryRegionFilter: (region: string) => void;
  directoryTierFilter: string;
  setDirectoryTierFilter: (tier: string) => void;
  directoryPage: number;
  setDirectoryPage: (p: number | ((prev: number) => number)) => void;

  // Reporting Scope Controls
  selectedPeriodTypeId: number; // 1 = Annual, 2 = YTD
  setSelectedPeriodTypeId: (id: number) => void;
  selectedCurrency: string; // 'USD', 'EUR', 'GBP', 'CHF', 'SEK'
  setSelectedCurrency: (currency: string) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedDomainId: string | null;
  setSelectedDomainId: (domainId: string | null) => void;

  // Excel Workbook Engine State
  workbookData: ParsedWorkbookData | null;
  isWorkbookLoading: boolean;
  workbookError: string | null;
  workbookStats: WorkbookStats | null;
  loadWorkbook: (source?: File | ArrayBuffer | string) => Promise<void>;
  reloadWorkbook: () => Promise<void>;
  isUploadModalOpen: boolean;
  setUploadModalOpen: (open: boolean) => void;

  // Data Quality modal
  isDqModalOpen: boolean;
  setDqModalOpen: (open: boolean) => void;
}

const UniverseContext = createContext<UniverseContextType | undefined>(undefined);

export const UniverseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [selectedClient, setSelectedClient] = useState<EnrichedClient | null>(null);
  
  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('siloverse_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('siloverse_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Directory filter & pagination preservation
  const [directorySearch, setDirectorySearch] = useState<string>('');
  const [directoryStatusFilter, setDirectoryStatusFilter] = useState<string>('all');
  const [directoryDomainFilter, setDirectoryDomainFilter] = useState<string>('all');
  const [directoryRegionFilter, setDirectoryRegionFilter] = useState<string>('all');
  const [directoryTierFilter, setDirectoryTierFilter] = useState<string>('all');
  const [directoryPage, setDirectoryPage] = useState<number>(1);

  // Scope controls
  const [selectedPeriodTypeId, setSelectedPeriodTypeId] = useState<number>(1); // Annual
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);

  // Excel state
  const [workbookData, setWorkbookData] = useState<ParsedWorkbookData | null>(null);
  const [isWorkbookLoading, setIsWorkbookLoading] = useState<boolean>(true);
  const [workbookError, setWorkbookError] = useState<string | null>(null);
  const [isUploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [isDqModalOpen, setDqModalOpen] = useState<boolean>(false);

  const handleLoadWorkbook = async (source?: File | ArrayBuffer | string) => {
    setIsWorkbookLoading(true);
    setWorkbookError(null);
    try {
      const data = await excelEngine.loadWorkbook(source);
      setWorkbookData(data);
      if (data.enrichedClients.length > 0 && !selectedClient) {
        setSelectedClient(data.enrichedClients[0]);
      }
    } catch (err: any) {
      setWorkbookError(err.message || 'Failed to load Excel workbook.');
    } finally {
      setIsWorkbookLoading(false);
    }
  };

  const reloadWorkbook = async () => {
    await handleLoadWorkbook();
  };

  useEffect(() => {
    handleLoadWorkbook();
    const unsubscribe = excelEngine.subscribe(() => {
      setWorkbookData(excelEngine.getData());
      setIsWorkbookLoading(excelEngine.getIsLoading());
      setWorkbookError(excelEngine.getLoadError());
    });
    return () => unsubscribe();
  }, []);

  return (
    <UniverseContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedClient,
        setSelectedClient,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebar,

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
        setDirectoryPage,

        selectedPeriodTypeId,
        setSelectedPeriodTypeId,
        selectedCurrency,
        setSelectedCurrency,
        selectedYear,
        setSelectedYear,
        selectedDomainId,
        setSelectedDomainId,

        workbookData,
        isWorkbookLoading,
        workbookError,
        workbookStats: workbookData?.stats || null,
        loadWorkbook: handleLoadWorkbook,
        reloadWorkbook,
        isUploadModalOpen,
        setUploadModalOpen,

        isDqModalOpen,
        setDqModalOpen
      }}
    >
      {children}
    </UniverseContext.Provider>
  );
};

export const useUniverse = () => {
  const context = useContext(UniverseContext);
  if (!context) {
    throw new Error('useUniverse must be used within a UniverseProvider');
  }
  return context;
};
