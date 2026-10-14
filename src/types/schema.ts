/**
 * SiloVerse — Client Intelligence Explorer
 * Frontend Data Models for Excel Workbook (Consilio_Final.xlsx)
 * Strictly frontend-only, no database.
 */

// ==========================================
// 1. Raw Excel Worksheet Interfaces
// ==========================================

export interface RawDomain {
  DomainID: number | string;
  DomainCode: string;
  DomainName: string;
  Description?: string;
  IsActive?: boolean;
}

export interface RawRegion {
  RegionCodeID: number | string;
  RegionCode: string;
  RegionName: string;
  RegionType?: string;
  IsActive?: boolean;
}

export interface RawCompanySize {
  CompanySizeID: number | string;
  CompanySizeCode: string;
  CompanySizeName: string;
  IsActive?: boolean;
}

export interface RawClientTier {
  ClientTierID: number | string;
  ClientTierCode: string;
  ClientTierName: string;
}

export interface RawClientStatus {
  ClientStatusID: number | string;
  ClientStatusName: string;
  IsActive?: boolean;
}

export interface RawCurrency {
  CurrencyID: number | string;
  CurrencyCode: string;
  CurrencyName: string;
  IsActive?: boolean;
}

export interface RawServiceStatus {
  ServiceStatusID: number | string;
  ServiceStatusName: string;
  IsActive?: boolean;
}

export interface RawPeriodType {
  PeriodTypeID: number | string;
  PeriodTypeName: string;
  PeriodTypeDescription?: string;
  IsActive?: boolean;
}

export interface RawServiceCategory {
  ServiceCategoryID: number | string;
  ServiceCategoryCode: string;
  ServiceCategoryName: string;
  Description?: string;
  IsActive?: boolean;
}

export interface RawService {
  ServiceID: number | string;
  ServiceCode: string;
  ServiceName: string;
  ServiceCategoryID: number | string;
  IsActive?: boolean;
}

export interface RawClient {
  ClientID: number | string;
  ClientCode: string;
  ClientName: string;
  CompanyLogo?: string | null;
  DomainID: number | string;
  RegionCodeID: number | string;
  CompanySizeID: number | string;
  TenureStartDate: string | number | Date;
}

export interface RawClientProfile {
  ClientProfileID: number | string;
  ClientID: number | string;
  ClientCode?: string;
  CompanyRevenue: number;
  CurrencyID: number | string;
  EmployeeCount: number;
  ClientStatusID: number | string;
  ClientTierID?: number | string;
  ClientValueScore?: number;
  TenureYears?: number | string;
  ChurnReason?: string | null;
}

export interface RawClientService {
  ClientServiceID: number | string;
  ClientServiceCode?: string;
  ClientID: number | string;
  ServiceID: number | string;
  ServiceStartDate: string | number | Date;
  ServiceEndDate?: string | number | Date | null;
  ServiceStatusID: number | string;
}

export interface RawClientRevenue {
  ClientRevenueID: number | string;
  ClientRevenueCode?: string;
  ClientID: number | string;
  ServiceID: number | string;
  PeriodTypeID: number | string;
  PeriodStart: string | number | Date;
  PeriodEnd: string | number | Date;
  RevenueGenerated: number;
  CurrencyID: number | string;
  RevenuePctOfTotal?: number | null;
  YoyGrowthPct?: number | null;
}

// ==========================================
// 2. Enriched Domain Models
// ==========================================

export interface EnrichedClientService {
  clientServiceId: string;
  clientServiceCode: string;
  clientId: string;
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  serviceCategoryId: string;
  serviceCategoryName: string;
  serviceStartDate: string;
  serviceEndDate: string | null;
  serviceStatusId: string;
  serviceStatusName: string; // 'Active' | 'Ended'
}

export interface EnrichedClientRevenue {
  clientRevenueId: string;
  clientRevenueCode: string;
  clientId: string;
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  periodTypeId: number;
  periodTypeName: string; // 'Annual' | 'YTD'
  periodStart: string;
  periodEnd: string;
  periodYear: number;
  revenueGenerated: number; // Consilio Revenue generated in original currency
  currencyId: string;
  currencyCode: string; // 'USD', 'EUR', 'GBP', 'CHF', 'SEK'
  yoyGrowthPct?: number | null;
}

export interface EnrichedClient {
  clientId: string;
  clientCode: string;
  clientName: string;
  companyLogo: string | null;
  logoUrl: string;
  domainId: string;
  domainName: string;
  regionCodeId: string;
  locationName: string;
  regionType: string;
  companySizeId: string;
  companySizeName: string;
  tenureStartDate: string;
  derivedTenureYears: number; // Derived dynamically
  hasProfile: boolean;
  companyRevenue: number | null; // Raw Client Company Revenue
  companyRevenueCurrency: string | null;
  employeeCount: number | null;
  clientStatusId: string | null;
  clientStatusName: string; // 'Active' | 'At Risk' | 'Churned' | 'Dormant' | 'Missing Profile'
  clientTierId: string | null;
  clientTierName: string | null;
  clientValueScore: number | null;
  churnReason: string | null;
  profileTenureYears: number | null;
  distinctServicesCount: number;
  activeServicesCount: number;
  endedServicesCount: number;
  services: EnrichedClientService[];
  revenues: EnrichedClientRevenue[];
}

// ==========================================
// 3. Workbook Loading & Analytics States
// ==========================================

export interface WorkbookStats {
  sourceName: string;
  loadedAt: string;
  fileSizeBytes: number;
  sheetCounts: {
    Domain: number;
    Client: number;
    ClientProfile: number;
    Service: number;
    ServiceCategory: number;
    ClientService: number;
    ClientRevenue: number;
    ClientTier: number;
    Region: number;
    CompanySize: number;
    ClientStatus: number;
    Currency: number;
    ServiceStatus: number;
    ClientRevenuePeriodType: number;
    [key: string]: number;
  };
  totalRecords: number;
  warnings: string[];
}

export interface AnalyticsSummaryKpis {
  totalClients: number;
  totalServices: number;
  totalDomains: number;
  activeClients: number;
  atRiskClients: number;
  churnedClients: number;
  dormantClients: number;
  averageTenureYears: number;
  clientServiceAssignments: {
    total: number;
    active: number;
    ended: number;
  };
  clientsMissingProfiles: number;
  sumOfStatusesMatchesTotal: boolean;
  statusDiscrepancyCount: number;
  totalConvertedRevenue: number;
  reportingCurrency: string;
}

export interface RevenueRankingItem {
  rank: number;
  clientId: string;
  clientCode: string;
  clientName: string;
  domainId: string;
  domainName: string;
  locationName: string;
  companyLogo: string | null;
  logoUrl: string;
  revenueGenerated: number; // Converted to target currency
  originalRevenue: number; // Original amount in original currency
  originalCurrency: string;
  currencyCode: string; // Target reporting currency
  reportingPeriod: string;
  eligibleRecordsCount: number;
  originalCurrencyBreakdown: Array<{
    currencyCode: string;
    rawAmount: number;
    convertedAmount: number;
    recordsCount: number;
  }>;
}

export interface DomainRevenueSummary {
  domainId: string;
  domainCode: string;
  domainName: string;
  revenueTotal: number; // Converted total
  currencyCode: string;
  reportingPeriod: string;
  contributingClientsCount: number;
  eligibleRecordsCount: number;
  contributionPct: number;
  completenessStatus: string;
}

export interface RegionRevenueSummary {
  regionCodeId: string;
  locationName: string;
  regionType: string;
  revenueTotal: number; // Converted total
  currencyCode: string;
  reportingPeriod: string;
  rank: number;
  contributingClientsCount: number;
  eligibleRecordsCount: number;
  contributionPct: number;
  completenessStatus: string;
}

export interface EmployeeRankingItem {
  rank: number;
  clientId: string;
  clientCode: string;
  clientName: string;
  companyLogo: string | null;
  logoUrl: string;
  employeeCount: number | null;
  domainName: string;
  locationName: string;
  clientStatusName: string;
  clientTierName: string;
  companySizeName: string;
}

export interface ClientYoYGrowthSummary {
  clientId: string;
  clientCode: string;
  clientName: string;
  domainName: string;
  currencyCode: string; // Target reporting currency
  reportingInterval: string;
  priorReportingInterval: string;
  currentRevenue: number | null; // Converted
  priorRevenue: number | null; // Converted
  absoluteChange: number | null; // Converted
  yoyGrowthPct: number | null;
  status: 'Calculated' | 'Missing Prior-Year Comparison' | 'Zero Prior-Year Revenue' | 'Incomparable Periods' | 'No Revenue Recorded';
  notes: string;
}

export interface ClientServiceAdoptionItem {
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  categoryName: string;
  numericCode: number; // e.g. 1 for S001, 2 for S002
  totalClientAdoptions: number;
  activeAssignments: number;
  endedAssignments: number;
  adoptionPercentage: number;
}

// ==========================================
// 4. Data Quality Workbench Models
// ==========================================

export type CheckSeverity = 'Error' | 'Warning' | 'Informational';

export interface DataQualityCheckResult {
  checkId: number;
  code: string;
  name: string;
  purpose: string;
  severity: CheckSeverity;
  sourceSheet: string;
  ruleExplanation: string;
  issueCount: number;
  status: 'Passed' | 'Warning' | 'Failed';
  affectedRecords: Array<{
    recordId: string | number;
    clientId?: string;
    clientCode?: string;
    clientName?: string;
    offendingField: string;
    offendingValue: any;
    explanation: string;
    rawRecord?: any;
  }>;
}
