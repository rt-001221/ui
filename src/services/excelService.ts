/**
 * SiloVerse — Client Intelligence Explorer
 * In-Browser Excel Loader, Parser, and Analytics Engine
 * Powered by SheetJS (xlsx) — 100% Frontend Only, No Database
 */
import * as XLSX from 'xlsx';
import {
  RawDomain,
  RawRegion,
  RawCompanySize,
  RawClientTier,
  RawClientStatus,
  RawCurrency,
  RawServiceStatus,
  RawPeriodType,
  RawServiceCategory,
  RawService,
  RawClient,
  RawClientProfile,
  RawClientService,
  RawClientRevenue,
  EnrichedClient,
  EnrichedClientService,
  EnrichedClientRevenue,
  WorkbookStats,
  AnalyticsSummaryKpis,
  RevenueRankingItem,
  DomainRevenueSummary,
  RegionRevenueSummary,
  EmployeeRankingItem,
  ClientYoYGrowthSummary,
  ClientServiceAdoptionItem,
  DataQualityCheckResult
} from '../types/schema';
import { currencyService } from './currencyService';

export interface ParsedWorkbookData {
  stats: WorkbookStats;
  domains: RawDomain[];
  regions: RawRegion[];
  companySizes: RawCompanySize[];
  clientTiers: RawClientTier[];
  clientStatuses: RawClientStatus[];
  currencies: RawCurrency[];
  serviceStatuses: RawServiceStatus[];
  periodTypes: RawPeriodType[];
  serviceCategories: RawServiceCategory[];
  services: RawService[];
  clients: RawClient[];
  clientProfiles: RawClientProfile[];
  clientServices: RawClientService[];
  clientRevenues: RawClientRevenue[];
  enrichedClients: EnrichedClient[];
  logoIndex: Map<string, string>;
}

class SiloVerseExcelEngine {
  private parsedData: ParsedWorkbookData | null = null;
  private isLoading: boolean = false;
  private loadError: string | null = null;
  private listeners: Array<() => void> = [];

  constructor() {
    // Re-notify whenever currency rates update
    currencyService.subscribe(() => {
      this.notify();
    });
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public getData(): ParsedWorkbookData | null {
    return this.parsedData;
  }

  public getIsLoading(): boolean {
    return this.isLoading;
  }

  public getLoadError(): string | null {
    return this.loadError;
  }

  /**
   * Parse date safely from string, Excel serial number, or Date object
   */
  public parseExcelDate(val: any): string {
    if (!val) return '';
    if (val instanceof Date) {
      return val.toISOString().split('T')[0];
    }
    if (typeof val === 'number') {
      // Excel epoch: Dec 30 1899
      const epoch = new Date(Date.UTC(1899, 11, 30));
      const date = new Date(epoch.getTime() + val * 86400000);
      return date.toISOString().split('T')[0];
    }
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return str.slice(0, 10);
    }
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    return str;
  }

  /**
   * Derive tenure in years from TenureStartDate using reference date
   */
  public calculateTenureYears(startDateStr: string, refDate: Date = new Date()): number {
    if (!startDateStr) return 0;
    const start = new Date(startDateStr).getTime();
    const now = refDate.getTime();
    if (isNaN(start)) return 0;
    const diffDays = (now - start) / 86400000;
    return Math.max(0, parseFloat((diffDays / 365.25).toFixed(1)));
  }

  /**
   * Fetch logo index CSV mapping
   */
  private async loadLogoIndex(): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    try {
      const res = await fetch('/logos/logo_index.csv');
      if (res.ok) {
        const text = await res.text();
        const lines = text.split('\n');
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const parts = line.split(',');
          if (parts.length >= 4) {
            const id = parts[0].trim();
            const code = parts[1].replace(/"/g, '').trim();
            const logo = parts[parts.length - 1].replace(/"/g, '').trim();
            if (logo) {
              map.set(id, logo);
              if (code) map.set(code, logo);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Could not load logo_index.csv:', err);
    }
    return map;
  }

  /**
   * Main loader: accepts File, ArrayBuffer, or fetches from authoritative asset path
   */
  public async loadWorkbook(source?: string | File | ArrayBuffer): Promise<ParsedWorkbookData> {
    this.isLoading = true;
    this.loadError = null;
    this.notify();

    try {
      let arrayBuffer: ArrayBuffer;
      let sourceName = 'public/data/Consilio_Final.xlsx';

      if (source instanceof File) {
        sourceName = source.name;
        arrayBuffer = await source.arrayBuffer();
      } else if (source instanceof ArrayBuffer) {
        sourceName = 'Custom Uploaded Buffer';
        arrayBuffer = source;
      } else {
        // Fetch from the primary URL
        const primaryUrl = '/data/Consilio_Final.xlsx';
        sourceName = primaryUrl;
        const res = await fetch(primaryUrl);
        if (!res.ok) {
          throw new Error(`Failed to fetch workbook at "${primaryUrl}" (HTTP ${res.status}: ${res.statusText})`);
        }
        arrayBuffer = await res.arrayBuffer();
      }

      // Read binary buffer into SheetJS workbook
      const wb = XLSX.read(arrayBuffer, {
        type: 'array',
        cellDates: true,
        cellNF: true,
        cellText: true
      });

      const requiredSheets = [
        'Domain',
        'Client',
        'ClientProfile',
        'Service',
        'ServiceCategory',
        'ClientService',
        'ClientRevenue',
        'ClientTier',
        'Region',
        'CompanySize',
        'ClientStatus',
        'Currency',
        'ServiceStatus',
        'ClientRevenuePeriodType'
      ];

      const warnings: string[] = [];
      const sheetCounts: Record<string, number> = {};

      for (const req of requiredSheets) {
        if (!wb.SheetNames.includes(req)) {
          warnings.push(`Expected worksheet "${req}" was not found in workbook.`);
          sheetCounts[req] = 0;
        }
      }

      const getSheetData = <T>(sheetName: string): T[] => {
        if (!wb.Sheets[sheetName]) return [];
        const rows = XLSX.utils.sheet_to_json<T>(wb.Sheets[sheetName], { defval: null });
        sheetCounts[sheetName] = rows.length;
        return rows;
      };

      const rawDomains = getSheetData<RawDomain>('Domain');
      const regions = getSheetData<RawRegion>('Region');
      const companySizes = getSheetData<RawCompanySize>('CompanySize');
      const clientTiers = getSheetData<RawClientTier>('ClientTier');
      const clientStatuses = getSheetData<RawClientStatus>('ClientStatus');
      const currencies = getSheetData<RawCurrency>('Currency');
      const serviceStatuses = getSheetData<RawServiceStatus>('ServiceStatus');
      const periodTypes = getSheetData<RawPeriodType>('ClientRevenuePeriodType');
      const serviceCategories = getSheetData<RawServiceCategory>('ServiceCategory');
      const rawServices = getSheetData<RawService>('Service');
      const rawClients = getSheetData<RawClient>('Client');
      const rawClientProfiles = getSheetData<RawClientProfile>('ClientProfile');
      const rawClientServices = getSheetData<RawClientService>('ClientService');
      const rawClientRevenues = getSheetData<RawClientRevenue>('ClientRevenue');

      // 4. REMOVE OBSOLETE 'Energy, Infrastructure & Utilities' SECTOR
      const domains = rawDomains.filter(d => {
        const name = (d.DomainName || '').trim();
        return !name.toLowerCase().includes('energy');
      });

      // Load logo index
      const logoIndex = await this.loadLogoIndex();

      // Build robust lookup dictionaries supporting both string and numeric IDs
      const domainMap = new Map<string, string>();
      domains.forEach(d => {
        const name = d.DomainName;
        domainMap.set(String(d.DomainID), name);
        domainMap.set(String(d.DomainCode), name);
      });

      const regionMap = new Map<string, RawRegion>();
      regions.forEach(r => {
        regionMap.set(String(r.RegionCodeID), r);
        regionMap.set(String(r.RegionCode), r);
      });

      const sizeMap = new Map<string, string>();
      companySizes.forEach(s => {
        sizeMap.set(String(s.CompanySizeID), s.CompanySizeName);
        sizeMap.set(String(s.CompanySizeCode), s.CompanySizeName);
      });

      const tierMap = new Map<string, string>();
      clientTiers.forEach(t => {
        tierMap.set(String(t.ClientTierID), t.ClientTierName);
        tierMap.set(String(t.ClientTierCode), t.ClientTierName);
      });

      // Status Map: maps 'CSI001' -> 'Active', 'CSI002' -> 'At Risk', 'CSI003' -> 'Churned', 'CSI004' -> 'Dormant'
      const statusMap = new Map<string, string>();
      clientStatuses.forEach(st => {
        statusMap.set(String(st.ClientStatusID), st.ClientStatusName);
        // Also map standard names
        statusMap.set(String(st.ClientStatusName), st.ClientStatusName);
      });
      // Safety fallbacks for standard codes
      statusMap.set('CSI001', 'Active');
      statusMap.set('CSI002', 'At Risk');
      statusMap.set('CSI003', 'Churned');
      statusMap.set('CSI004', 'Dormant');
      statusMap.set('1', 'Active');
      statusMap.set('2', 'At Risk');
      statusMap.set('3', 'Churned');
      statusMap.set('4', 'Dormant');

      // Currency Map: maps 'CI001' -> 'USD', 'CI002' -> 'EUR', etc.
      const currMap = new Map<string, string>();
      currencies.forEach(c => {
        currMap.set(String(c.CurrencyID), c.CurrencyCode);
        currMap.set(String(c.CurrencyCode), c.CurrencyCode);
      });
      currMap.set('CI001', 'USD');
      currMap.set('CI002', 'EUR');
      currMap.set('CI003', 'GBP');
      currMap.set('CI004', 'CHF');
      currMap.set('CI005', 'SEK');
      currMap.set('1', 'USD');
      currMap.set('2', 'EUR');
      currMap.set('3', 'GBP');
      currMap.set('4', 'CHF');
      currMap.set('5', 'SEK');

      // Authoritative Service Names (Section 1)
      const AUTHORITATIVE_SERVICE_NAMES: Record<string, string> = {
        S001: 'eDiscovery Services',
        S002: 'Analytics & AI',
        S003: 'Document Review Solutions',
        S004: 'Risk Management & Compliance',
        S005: 'Cyber Incident Response',
        S006: 'Data Forensics & Investigations',
        S007: 'Talent Solutions',
        S008: 'Legal Transformation Services'
      };

      const svcMap = new Map<string, RawService>();
      rawServices.forEach(s => {
        const code = String(s.ServiceCode || s.ServiceID);
        const name = AUTHORITATIVE_SERVICE_NAMES[code] || s.ServiceName;
        const normalizedService: RawService = {
          ...s,
          ServiceName: name
        };
        svcMap.set(String(s.ServiceID), normalizedService);
        svcMap.set(code, normalizedService);
      });

      const svcCatMap = new Map<string, string>();
      serviceCategories.forEach(sc => {
        svcCatMap.set(String(sc.ServiceCategoryID), sc.ServiceCategoryName);
        svcCatMap.set(String(sc.ServiceCategoryCode), sc.ServiceCategoryName);
      });

      const svcStatusMap = new Map<string, string>();
      serviceStatuses.forEach(ss => {
        svcStatusMap.set(String(ss.ServiceStatusID), ss.ServiceStatusName);
      });
      svcStatusMap.set('SSI001', 'Active');
      svcStatusMap.set('SSI002', 'Ended');
      svcStatusMap.set('1', 'Active');
      svcStatusMap.set('2', 'Ended');

      const periodTypeMap = new Map<string, string>();
      periodTypes.forEach(pt => {
        periodTypeMap.set(String(pt.PeriodTypeID), pt.PeriodTypeName);
      });
      periodTypeMap.set('1', 'Annual');
      periodTypeMap.set('2', 'YTD');

      // Index profiles by ClientID (supporting both string code e.g. 'C014' and numeric ID)
      const profileByClientId = new Map<string, RawClientProfile>();
      rawClientProfiles.forEach(p => {
        if (p.ClientID !== null && p.ClientID !== undefined) {
          profileByClientId.set(String(p.ClientID), p);
        }
        if (p.ClientCode) {
          profileByClientId.set(String(p.ClientCode), p);
        }
      });

      // Index services by ClientID
      const servicesByClientId = new Map<string, EnrichedClientService[]>();
      rawClientServices.forEach(cs => {
        const cKey = String(cs.ClientID);
        const sKey = String(cs.ServiceID);
        const sInfo = svcMap.get(sKey);
        const catName = sInfo ? (svcCatMap.get(String(sInfo.ServiceCategoryID)) || 'General') : 'General';
        const startStr = this.parseExcelDate(cs.ServiceStartDate);
        const endStr = cs.ServiceEndDate ? this.parseExcelDate(cs.ServiceEndDate) : null;
        const statusName = svcStatusMap.get(String(cs.ServiceStatusID)) || 'Active';
        const sCode = sInfo?.ServiceCode || sKey;

        const enriched: EnrichedClientService = {
          clientServiceId: String(cs.ClientServiceID),
          clientServiceCode: cs.ClientServiceCode || `CS${cs.ClientServiceID}`,
          clientId: cKey,
          serviceId: sKey,
          serviceCode: sCode,
          serviceName: AUTHORITATIVE_SERVICE_NAMES[sCode] || sInfo?.ServiceName || `Service ${sKey}`,
          serviceCategoryId: String(sInfo?.ServiceCategoryID || '1'),
          serviceCategoryName: catName,
          serviceStartDate: startStr,
          serviceEndDate: endStr,
          serviceStatusId: String(cs.ServiceStatusID),
          serviceStatusName: statusName
        };

        const existing = servicesByClientId.get(cKey) || [];
        existing.push(enriched);
        servicesByClientId.set(cKey, existing);
      });

      // Index revenues by ClientID
      const revenuesByClientId = new Map<string, EnrichedClientRevenue[]>();
      rawClientRevenues.forEach(cr => {
        const cKey = String(cr.ClientID);
        const sKey = String(cr.ServiceID);
        const sInfo = svcMap.get(sKey);
        const ptId = Number(cr.PeriodTypeID) || 1;
        const ptName = periodTypeMap.get(String(cr.PeriodTypeID)) || (ptId === 1 ? 'Annual' : 'YTD');
        const currCode = currMap.get(String(cr.CurrencyID)) || 'USD';
        const startStr = this.parseExcelDate(cr.PeriodStart);
        const endStr = this.parseExcelDate(cr.PeriodEnd);
        const year = startStr ? parseInt(startStr.slice(0, 4), 10) : 2024;
        const sCode = sInfo?.ServiceCode || sKey;

        const enriched: EnrichedClientRevenue = {
          clientRevenueId: String(cr.ClientRevenueID),
          clientRevenueCode: cr.ClientRevenueCode || `CR${cr.ClientRevenueID}`,
          clientId: cKey,
          serviceId: sKey,
          serviceCode: sCode,
          serviceName: AUTHORITATIVE_SERVICE_NAMES[sCode] || sInfo?.ServiceName || `Service ${sKey}`,
          periodTypeId: ptId,
          periodTypeName: ptName,
          periodStart: startStr,
          periodEnd: endStr,
          periodYear: isNaN(year) ? 2024 : year,
          revenueGenerated: Number(cr.RevenueGenerated) || 0,
          currencyId: String(cr.CurrencyID),
          currencyCode: currCode,
          yoyGrowthPct: cr.YoyGrowthPct !== null && cr.YoyGrowthPct !== undefined ? Number(cr.YoyGrowthPct) : null
        };

        const existing = revenuesByClientId.get(cKey) || [];
        existing.push(enriched);
        revenuesByClientId.set(cKey, existing);
      });

      // Enrich all Client records
      const enrichedClients: EnrichedClient[] = rawClients.map(c => {
        const code = c.ClientCode || String(c.ClientID);
        const profile = profileByClientId.get(code) || profileByClientId.get(String(c.ClientID));
        const region = regionMap.get(String(c.RegionCodeID));
        const rawCServices = servicesByClientId.get(code) || servicesByClientId.get(String(c.ClientID)) || [];
        const cServices = [...rawCServices].sort((a, b) => {
          const numA = parseInt(String(a.serviceCode || a.serviceId).replace(/\D/g, '') || '0', 10);
          const numB = parseInt(String(b.serviceCode || b.serviceId).replace(/\D/g, '') || '0', 10);
          if (numA !== numB) return numA - numB;
          return String(a.serviceCode || '').localeCompare(String(b.serviceCode || ''));
        });
        const cRevenues = revenuesByClientId.get(code) || revenuesByClientId.get(String(c.ClientID)) || [];
        const logoFile = c.CompanyLogo || logoIndex.get(code) || logoIndex.get(String(c.ClientID)) || null;
        const logoUrl = logoFile ? `/logos/jpg/${logoFile}` : '';
        const tenureStr = this.parseExcelDate(c.TenureStartDate);
        const derivedTenure = this.calculateTenureYears(tenureStr);

        const distinctSvcIds = new Set(cServices.map(cs => cs.serviceCode));
        const activeCount = cServices.filter(cs => cs.serviceStatusName === 'Active').length;
        const endedCount = cServices.filter(cs => cs.serviceStatusName === 'Ended').length;

        // Authoritative Status Resolution (Requirement 2)
        // In the authoritative workbook, ClientProfile.ClientStatusID maps through ClientStatus worksheet
        let statusName = 'Missing Profile';
        if (profile && profile.ClientStatusID !== null && profile.ClientStatusID !== undefined) {
          const rawStatusId = String(profile.ClientStatusID).trim();
          statusName = statusMap.get(rawStatusId) || 'Active';
        }

        // Domain Name: resolve from 5 active domains (Energy sector is eliminated)
        const dName = domainMap.get(String(c.DomainID)) || 'Corporate Legal & Governance';

        let profileTenure: number | null = null;
        if (profile && profile.TenureYears !== null && profile.TenureYears !== undefined) {
          const num = typeof profile.TenureYears === 'number' ? profile.TenureYears : parseFloat(String(profile.TenureYears));
          if (!isNaN(num)) profileTenure = num;
        }

        return {
          clientId: code,
          clientCode: code,
          clientName: c.ClientName,
          companyLogo: logoFile,
          logoUrl,
          domainId: String(c.DomainID),
          domainName: dName,
          regionCodeId: String(c.RegionCodeID),
          locationName: region?.RegionName || 'United States',
          regionType: region?.RegionType || 'Country / Jurisdiction',
          companySizeId: String(c.CompanySizeID),
          companySizeName: sizeMap.get(String(c.CompanySizeID)) || 'Enterprise',
          tenureStartDate: tenureStr,
          derivedTenureYears: derivedTenure,
          hasProfile: !!profile,
          companyRevenue: profile ? (Number(profile.CompanyRevenue) || 0) : null,
          companyRevenueCurrency: profile ? (currMap.get(String(profile.CurrencyID)) || 'USD') : null,
          employeeCount: profile && profile.EmployeeCount !== null ? Number(profile.EmployeeCount) : null,
          clientStatusId: profile?.ClientStatusID ? String(profile.ClientStatusID) : null,
          clientStatusName: statusName,
          clientTierId: profile?.ClientTierID ? String(profile.ClientTierID) : null,
          clientTierName: profile?.ClientTierID ? (tierMap.get(String(profile.ClientTierID)) || null) : null,
          clientValueScore: profile?.ClientValueScore ?? null,
          churnReason: profile?.ChurnReason || null,
          profileTenureYears: profileTenure,
          distinctServicesCount: distinctSvcIds.size,
          activeServicesCount: activeCount,
          endedServicesCount: endedCount,
          services: cServices,
          revenues: cRevenues
        };
      });

      const totalRecords = Object.values(sheetCounts).reduce((acc, n) => acc + n, 0);
      const stats: WorkbookStats = {
        sourceName,
        loadedAt: new Date().toLocaleString(),
        fileSizeBytes: arrayBuffer.byteLength,
        sheetCounts: sheetCounts as any,
        totalRecords,
        warnings
      };

      this.parsedData = {
        stats,
        domains,
        regions,
        companySizes,
        clientTiers,
        clientStatuses,
        currencies,
        serviceStatuses,
        periodTypes,
        serviceCategories,
        services: rawServices.map(s => ({
          ...s,
          ServiceName: AUTHORITATIVE_SERVICE_NAMES[String(s.ServiceCode || s.ServiceID)] || s.ServiceName
        })),
        clients: rawClients,
        clientProfiles: rawClientProfiles,
        clientServices: rawClientServices,
        clientRevenues: rawClientRevenues,
        enrichedClients,
        logoIndex
      };

      this.isLoading = false;
      this.notify();
      return this.parsedData;
    } catch (err: any) {
      this.isLoading = false;
      this.loadError = err.message || 'Error parsing Excel workbook';
      this.notify();
      throw err;
    }
  }

  // ==========================================
  // Calculations: KPIs & Converted Revenue
  // ==========================================

  public getSummaryKpis(scopeOptions?: { periodTypeId: number; currencyCode: string; year: number }): AnalyticsSummaryKpis {
    if (!this.parsedData) {
      return {
        totalClients: 0,
        totalServices: 0,
        totalDomains: 0,
        activeClients: 0,
        atRiskClients: 0,
        churnedClients: 0,
        dormantClients: 0,
        averageTenureYears: 0,
        clientServiceAssignments: { total: 0, active: 0, ended: 0 },
        clientsMissingProfiles: 0,
        sumOfStatusesMatchesTotal: true,
        statusDiscrepancyCount: 0,
        totalConvertedRevenue: 0,
        reportingCurrency: scopeOptions?.currencyCode || 'USD'
      };
    }

    const { services, domains, clientServices, enrichedClients, clientRevenues } = this.parsedData;
    let active = 0;
    let atRisk = 0;
    let churned = 0;
    let dormant = 0;
    let missingProfiles = 0;
    let totalTenure = 0;

    enrichedClients.forEach(c => {
      totalTenure += c.derivedTenureYears;
      if (!c.hasProfile) {
        missingProfiles++;
      } else {
        if (c.clientStatusName === 'Active') active++;
        else if (c.clientStatusName === 'At Risk') atRisk++;
        else if (c.clientStatusName === 'Churned') churned++;
        else if (c.clientStatusName === 'Dormant') dormant++;
      }
    });

    const activeAssignments = clientServices.filter(cs => String(cs.ServiceStatusID) === 'SSI001' || String(cs.ServiceStatusID) === '1').length;
    const endedAssignments = clientServices.filter(cs => String(cs.ServiceStatusID) === 'SSI002' || String(cs.ServiceStatusID) === '2').length;

    const categorizedSum = active + atRisk + churned + dormant;
    const sumMatches = categorizedSum === enrichedClients.length;
    const discrepancy = enrichedClients.length - categorizedSum;
    const avgTenure = enrichedClients.length > 0 ? parseFloat((totalTenure / enrichedClients.length).toFixed(1)) : 0;

    // Convert all eligible revenue records into target reporting currency
    let totalConvertedRev = 0;
    const targetCurrency = scopeOptions?.currencyCode || 'USD';
    const targetPeriodTypeId = scopeOptions?.periodTypeId ?? 1;
    const targetYear = scopeOptions?.year ?? 2024;

    const rateSet = currencyService.getRateSet(targetYear, targetPeriodTypeId);

    clientRevenues.forEach(r => {
      const year = r.PeriodStart ? parseInt(String(r.PeriodStart).slice(0, 4), 10) : 2024;
      const ptId = Number(r.PeriodTypeID) || 1;
      if (ptId === targetPeriodTypeId && (targetPeriodTypeId === 2 || year === targetYear)) {
        const rawAmt = Number(r.RevenueGenerated) || 0;
        // Resolve original currency
        let origCurr = 'USD';
        if (r.CurrencyID === 'CI002' || String(r.CurrencyID) === '2') origCurr = 'EUR';
        else if (r.CurrencyID === 'CI003' || String(r.CurrencyID) === '3') origCurr = 'GBP';
        else if (r.CurrencyID === 'CI004' || String(r.CurrencyID) === '4') origCurr = 'CHF';
        else if (r.CurrencyID === 'CI005' || String(r.CurrencyID) === '5') origCurr = 'SEK';

        const converted = currencyService.convert(rawAmt, origCurr, targetCurrency, rateSet);
        totalConvertedRev += converted;
      }
    });

    return {
      totalClients: enrichedClients.length,
      totalServices: services.length,
      totalDomains: domains.length, // Exactly 5 domains
      activeClients: active,
      atRiskClients: atRisk,
      churnedClients: churned, // Exactly 3 (C014, C015, C026)
      dormantClients: dormant,
      averageTenureYears: avgTenure,
      clientServiceAssignments: {
        total: clientServices.length,
        active: activeAssignments,
        ended: endedAssignments
      },
      clientsMissingProfiles: missingProfiles,
      sumOfStatusesMatchesTotal: sumMatches,
      statusDiscrepancyCount: discrepancy,
      totalConvertedRevenue: totalConvertedRev,
      reportingCurrency: targetCurrency
    };
  }

  /**
   * Calculate top clients by revenue generated for Consilio
   * Converts EVERY eligible revenue record into the target reporting currency!
   * Never excludes records due to currency difference.
   */
  public getRevenueRankings(options: {
    periodTypeId: number;
    currencyCode: string; // Target reporting currency (USD, EUR, GBP, CHF, SEK)
    domainId?: string | null;
    year?: number;
  }): {
    items: RevenueRankingItem[];
    totalEligibleRevenue: number;
    totalEligibleRecords: number;
    excludedRecordsCount: number;
  } {
    if (!this.parsedData) {
      return { items: [], totalEligibleRevenue: 0, totalEligibleRecords: 0, excludedRecordsCount: 0 };
    }

    const { enrichedClients } = this.parsedData;
    const targetPeriodTypeId = options.periodTypeId;
    const targetCurrency = (options.currencyCode || 'USD').toUpperCase();
    const targetYear = options.year || 2024;
    const targetDomainId = options.domainId ? String(options.domainId) : null;

    const rateSet = currencyService.getRateSet(targetYear, targetPeriodTypeId);

    let totalEligibleRecords = 0;
    let excludedRecordsCount = 0;

    const rankingItems: RevenueRankingItem[] = [];

    enrichedClients.forEach(c => {
      if (targetDomainId && String(c.domainId) !== targetDomainId) {
        return;
      }

      // Filter this client's revenue records matching the period interval
      const cEligible = c.revenues.filter(r => {
        const matchesPeriod = r.periodTypeId === targetPeriodTypeId && (targetPeriodTypeId === 2 || r.periodYear === targetYear);
        return matchesPeriod;
      });

      totalEligibleRecords += cEligible.length;
      excludedRecordsCount += (c.revenues.length - cEligible.length);

      // Convert each record and track original currency breakdown
      let totalConvertedForClient = 0;
      let totalRawForClient = 0;
      const currencyMap = new Map<string, { rawTotal: number; convertedTotal: number; count: number }>();

      cEligible.forEach(r => {
        const rawAmt = r.revenueGenerated;
        const origCurr = r.currencyCode;
        const converted = currencyService.convert(rawAmt, origCurr, targetCurrency, rateSet);

        totalConvertedForClient += converted;
        totalRawForClient += rawAmt;

        const prev = currencyMap.get(origCurr) || { rawTotal: 0, convertedTotal: 0, count: 0 };
        currencyMap.set(origCurr, {
          rawTotal: prev.rawTotal + rawAmt,
          convertedTotal: prev.convertedTotal + converted,
          count: prev.count + 1
        });
      });

      const breakdown = Array.from(currencyMap.entries()).map(([code, data]) => ({
        currencyCode: code,
        rawAmount: data.rawTotal,
        convertedAmount: data.convertedTotal,
        recordsCount: data.count
      }));

      const primaryOrigCurr = breakdown.length > 0 ? breakdown[0].currencyCode : targetCurrency;

      rankingItems.push({
        rank: 0,
        clientId: c.clientId,
        clientCode: c.clientCode,
        clientName: c.clientName,
        domainId: c.domainId,
        domainName: c.domainName,
        locationName: c.locationName,
        companyLogo: c.companyLogo,
        logoUrl: c.logoUrl,
        revenueGenerated: totalConvertedForClient, // Fully converted to target currency
        originalRevenue: totalRawForClient,
        originalCurrency: primaryOrigCurr,
        currencyCode: targetCurrency,
        reportingPeriod: targetPeriodTypeId === 1 ? `FY ${targetYear} (Annual)` : `FY ${targetYear} (YTD Interim)`,
        eligibleRecordsCount: cEligible.length,
        originalCurrencyBreakdown: breakdown
      });
    });

    // Deterministic sorting: Converted Revenue DESC, then ClientName ASC, then ClientCode ASC
    rankingItems.sort((a, b) => {
      if (b.revenueGenerated !== a.revenueGenerated) {
        return b.revenueGenerated - a.revenueGenerated;
      }
      const nameCompare = a.clientName.localeCompare(b.clientName);
      if (nameCompare !== 0) return nameCompare;
      return a.clientCode.localeCompare(b.clientCode);
    });

    // Assign 1-indexed ranks
    rankingItems.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    const totalEligibleRevenue = rankingItems.reduce((acc, item) => acc + item.revenueGenerated, 0);

    return {
      items: rankingItems,
      totalEligibleRevenue,
      totalEligibleRecords,
      excludedRecordsCount
    };
  }

  /**
   * Domain revenue breakdown and contribution percentages
   * Uses fully converted revenue for all domains.
   */
  public getDomainRevenue(options: {
    periodTypeId: number;
    currencyCode: string;
    year?: number;
  }): {
    domains: DomainRevenueSummary[];
    totalEligibleRevenue: number;
    contributingClientsTotal: number;
  } {
    const rankings = this.getRevenueRankings({
      periodTypeId: options.periodTypeId,
      currencyCode: options.currencyCode,
      year: options.year
    });

    const domainMap = new Map<string, DomainRevenueSummary>();

    if (this.parsedData) {
      // 5 Authoritative domains only (Energy sector eliminated)
      this.parsedData.domains.forEach(d => {
        domainMap.set(String(d.DomainID), {
          domainId: String(d.DomainID),
          domainCode: d.DomainCode,
          domainName: d.DomainName,
          revenueTotal: 0,
          currencyCode: options.currencyCode,
          reportingPeriod: options.periodTypeId === 1 ? `FY ${options.year || 2024} (Annual)` : `FY ${options.year || 2024} (YTD)`,
          contributingClientsCount: 0,
          eligibleRecordsCount: 0,
          contributionPct: 0,
          completenessStatus: 'Verified'
        });
      });
    }

    rankings.items.forEach(c => {
      const summary = domainMap.get(String(c.domainId));
      if (summary) {
        summary.revenueTotal += c.revenueGenerated;
        if (c.revenueGenerated > 0) {
          summary.contributingClientsCount += 1;
        }
        summary.eligibleRecordsCount += c.eligibleRecordsCount;
      }
    });

    const totalRev = rankings.totalEligibleRevenue;
    const result = Array.from(domainMap.values());
    result.forEach(d => {
      d.contributionPct = totalRev > 0 ? parseFloat(((d.revenueTotal / totalRev) * 100).toFixed(2)) : 0;
    });

    result.sort((a, b) => b.revenueTotal - a.revenueTotal);

    const contributingClientsTotal = new Set(
      rankings.items.filter(i => i.revenueGenerated > 0).map(i => i.clientId)
    ).size;

    return {
      domains: result,
      totalEligibleRevenue: totalRev,
      contributingClientsTotal
    };
  }

  /**
   * Revenue by Client Location / Region
   * Uses fully converted revenue for all regions.
   */
  public getRegionRevenue(options: {
    periodTypeId: number;
    currencyCode: string;
    year?: number;
  }): RegionRevenueSummary[] {
    const rankings = this.getRevenueRankings({
      periodTypeId: options.periodTypeId,
      currencyCode: options.currencyCode,
      year: options.year
    });

    const regionMap = new Map<string, RegionRevenueSummary>();

    if (this.parsedData) {
      this.parsedData.regions.forEach(r => {
        regionMap.set(String(r.RegionCodeID), {
          regionCodeId: String(r.RegionCodeID),
          locationName: r.RegionName,
          regionType: r.RegionType || 'Country / Jurisdiction',
          revenueTotal: 0,
          currencyCode: options.currencyCode,
          reportingPeriod: options.periodTypeId === 1 ? `FY ${options.year || 2024} (Annual)` : `FY ${options.year || 2024} (YTD)`,
          rank: 0,
          contributingClientsCount: 0,
          eligibleRecordsCount: 0,
          contributionPct: 0,
          completenessStatus: r.RegionName === 'Latin America' ? 'Regional Group (Multi-Jurisdiction)' : 'Standard Location'
        });
      });
    }

    rankings.items.forEach(c => {
      const enriched = this.parsedData?.enrichedClients.find(e => e.clientId === c.clientId);
      if (!enriched) return;
      const summary = regionMap.get(String(enriched.regionCodeId));
      if (summary) {
        summary.revenueTotal += c.revenueGenerated;
        if (c.revenueGenerated > 0) {
          summary.contributingClientsCount += 1;
        }
        summary.eligibleRecordsCount += c.eligibleRecordsCount;
      }
    });

    const totalRev = rankings.totalEligibleRevenue;
    const result = Array.from(regionMap.values());
    result.forEach(r => {
      r.contributionPct = totalRev > 0 ? parseFloat(((r.revenueTotal / totalRev) * 100).toFixed(2)) : 0;
    });
    result.sort((a, b) => b.revenueTotal - a.revenueTotal);
    result.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    return result;
  }

  /**
   * Top Clients by Workforce Employee Count
   */
  public getEmployeeRankings(): EmployeeRankingItem[] {
    if (!this.parsedData) return [];
    const items: EmployeeRankingItem[] = this.parsedData.enrichedClients.map(c => ({
      rank: 0,
      clientId: c.clientId,
      clientCode: c.clientCode,
      clientName: c.clientName,
      companyLogo: c.companyLogo,
      logoUrl: c.logoUrl,
      employeeCount: c.employeeCount,
      domainName: c.domainName,
      locationName: c.locationName,
      clientStatusName: c.clientStatusName,
      clientTierName: c.clientTierName || 'Unassigned',
      companySizeName: c.companySizeName
    }));

    items.sort((a, b) => {
      if (a.employeeCount === null && b.employeeCount === null) return 0;
      if (a.employeeCount === null) return 1;
      if (b.employeeCount === null) return -1;
      if (b.employeeCount !== a.employeeCount) {
        return b.employeeCount - a.employeeCount;
      }
      return a.clientName.localeCompare(b.clientName);
    });

    items.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    return items;
  }

  /**
   * Year-over-Year Growth calculations
   * Converts both FY 2024 and FY 2025 revenue into target reporting currency using the applicable period rates!
   */
  public getClientYoYGrowth(currencyCode: string = 'USD', currentYear: number = 2025, priorYear: number = 2024): ClientYoYGrowthSummary[] {
    if (!this.parsedData) return [];
    const targetCurr = currencyCode.toUpperCase();
    const results: ClientYoYGrowthSummary[] = [];

    const priorRateSet = currencyService.getRateSet(priorYear, 1);
    const currRateSet = currencyService.getRateSet(currentYear, 1);

    this.parsedData.enrichedClients.forEach(c => {
      const currRecs = c.revenues.filter(r => r.periodTypeId === 1 && r.periodYear === currentYear);
      const priorRecs = c.revenues.filter(r => r.periodTypeId === 1 && r.periodYear === priorYear);

      let currConvertedSum: number | null = null;
      let priorConvertedSum: number | null = null;

      if (currRecs.length > 0) {
        currConvertedSum = currRecs.reduce((sum, r) => {
          return sum + currencyService.convert(r.revenueGenerated, r.currencyCode, targetCurr, currRateSet);
        }, 0);
      }

      if (priorRecs.length > 0) {
        priorConvertedSum = priorRecs.reduce((sum, r) => {
          return sum + currencyService.convert(r.revenueGenerated, r.currencyCode, targetCurr, priorRateSet);
        }, 0);
      }

      let status: ClientYoYGrowthSummary['status'] = 'Calculated';
      let delta: number | null = null;
      let pct: number | null = null;
      let notes = '';

      if (currConvertedSum !== null && priorConvertedSum !== null) {
        delta = currConvertedSum - priorConvertedSum;
        if (priorConvertedSum > 0) {
          pct = parseFloat(((delta / priorConvertedSum) * 100).toFixed(1));
          notes = `${pct >= 0 ? '+' : ''}${pct}% delta against FY ${priorYear} (converted to ${targetCurr})`;
        } else if (priorConvertedSum === 0) {
          status = 'Zero Prior-Year Revenue';
          notes = 'Prior baseline was 0; percentage growth undefined.';
        }
      } else if (currConvertedSum !== null && priorConvertedSum === null) {
        status = 'Missing Prior-Year Comparison';
        notes = `No comparable FY ${priorYear} record.`;
      } else if (currConvertedSum === null && priorConvertedSum !== null) {
        status = 'Missing Prior-Year Comparison';
        notes = `No FY ${currentYear} record.`;
      } else {
        status = 'No Revenue Recorded';
        notes = `No revenue records for this client in selected intervals.`;
      }

      results.push({
        clientId: c.clientId,
        clientCode: c.clientCode,
        clientName: c.clientName,
        domainName: c.domainName,
        currencyCode: targetCurr,
        reportingInterval: `FY ${currentYear} (Annual)`,
        priorReportingInterval: `FY ${priorYear} (Annual)`,
        currentRevenue: currConvertedSum,
        priorRevenue: priorConvertedSum,
        absoluteChange: delta,
        yoyGrowthPct: pct,
        status,
        notes
      });
    });

    results.sort((a, b) => {
      if (a.absoluteChange === null && b.absoluteChange === null) return 0;
      if (a.absoluteChange === null) return 1;
      if (b.absoluteChange === null) return -1;
      return b.absoluteChange - a.absoluteChange;
    });

    return results;
  }

  /**
   * Services Intelligence & Adoption
   * MANDATORY REQUIREMENT 1: Display service cards in ASCENDING service-code order S001 through S008!
   */
  public getServicesIntelligence(): {
    adoptionList: ClientServiceAdoptionItem[];
    clientsByServiceCount: { client: EnrichedClient; distinctCount: number; activeCount: number; endedCount: number }[];
  } {
    if (!this.parsedData) {
      return { adoptionList: [], clientsByServiceCount: [] };
    }

    const { services, serviceCategories, clientServices, enrichedClients } = this.parsedData;
    const catMap = new Map<string, string>();
    serviceCategories.forEach(sc => {
      catMap.set(String(sc.ServiceCategoryID), sc.ServiceCategoryName);
      catMap.set(String(sc.ServiceCategoryCode), sc.ServiceCategoryName);
    });

    const adoptionList: ClientServiceAdoptionItem[] = services.map(s => {
      const sCode = String(s.ServiceCode || s.ServiceID);
      const matchingAssignments = clientServices.filter(cs => String(cs.ServiceID) === sCode || String(cs.ServiceID) === String(s.ServiceID));
      const uniqueClients = new Set(matchingAssignments.map(cs => String(cs.ClientID))).size;
      const activeCount = matchingAssignments.filter(cs => String(cs.ServiceStatusID) === 'SSI001' || String(cs.ServiceStatusID) === '1').length;
      const endedCount = matchingAssignments.filter(cs => String(cs.ServiceStatusID) === 'SSI002' || String(cs.ServiceStatusID) === '2').length;
      const adoptionPct = enrichedClients.length > 0 ? parseFloat(((uniqueClients / enrichedClients.length) * 100).toFixed(1)) : 0;

      // Extract numeric suffix from service code (e.g. S001 -> 1, S008 -> 8)
      const numCode = parseInt(sCode.replace(/\D/g, '') || '0', 10);

      return {
        serviceId: String(s.ServiceID),
        serviceCode: sCode,
        serviceName: s.ServiceName,
        categoryName: catMap.get(String(s.ServiceCategoryID)) || 'General Services',
        numericCode: numCode,
        totalClientAdoptions: uniqueClients,
        activeAssignments: activeCount,
        endedAssignments: endedCount,
        adoptionPercentage: adoptionPct
      };
    });

    // Sort strictly by ascending numeric service-code suffix: S001, S002, S003, S004, S005, S006, S007, S008
    adoptionList.sort((a, b) => a.numericCode - b.numericCode);

    const clientsByServiceCount = enrichedClients.map(c => ({
      client: c,
      distinctCount: c.distinctServicesCount,
      activeCount: c.activeServicesCount,
      endedCount: c.endedServicesCount
    }));

    clientsByServiceCount.sort((a, b) => b.distinctCount - a.distinctCount);

    return {
      adoptionList,
      clientsByServiceCount
    };
  }

  /**
   * Data Quality Workbench — 17 Predefined Checks
   */
  public runAllDataQualityChecks(): DataQualityCheckResult[] {
    if (!this.parsedData) return [];

    const {
      clients,
      clientProfiles,
      clientServices,
      clientRevenues,
      services,
      domains,
      regions,
      currencies,
      periodTypes,
      enrichedClients
    } = this.parsedData;

    const checks: DataQualityCheckResult[] = [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const createCheck = (
      checkId: number,
      code: string,
      name: string,
      purpose: string,
      severity: 'Error' | 'Warning' | 'Informational',
      sourceSheet: string,
      ruleExplanation: string,
      affected: Array<any>
    ): DataQualityCheckResult => ({
      checkId,
      code,
      name,
      purpose,
      severity,
      sourceSheet,
      ruleExplanation,
      issueCount: affected.length,
      status: affected.length === 0 ? 'Passed' : severity === 'Error' ? 'Failed' : 'Warning',
      affectedRecords: affected
    });

    // 1. Clients without corresponding profiles
    const profileClientIds = new Set(clientProfiles.map(p => String(p.ClientID)));
    const dq1 = clients
      .filter(c => !profileClientIds.has(String(c.ClientID)) && !profileClientIds.has(c.ClientCode))
      .map(c => ({
        recordId: c.ClientID,
        clientId: c.ClientCode,
        clientCode: c.ClientCode,
        clientName: c.ClientName,
        offendingField: 'ClientID',
        offendingValue: c.ClientID,
        explanation: `Client record "${c.ClientName}" (ID ${c.ClientID}) does not have an entry in ClientProfile.`
      }));
    checks.push(createCheck(1, 'DQ-01', 'Clients Missing Profiles', 'Detect clients in Client without a matching record in ClientProfile.', 'Warning', 'Client, ClientProfile', 'Client.ClientID must have corresponding ClientProfile.ClientID', dq1));

    // 2. Duplicate primary key IDs
    const dq2: any[] = [];
    const checkDups = (arr: any[], idField: string, sheetName: string) => {
      const seen = new Set();
      arr.forEach(row => {
        const id = row[idField];
        if (seen.has(id)) {
          dq2.push({
            recordId: id,
            offendingField: idField,
            offendingValue: id,
            explanation: `Duplicate ${idField} (${id}) detected in sheet ${sheetName}.`
          });
        }
        seen.add(id);
      });
    };
    checkDups(clients, 'ClientID', 'Client');
    checkDups(clientProfiles, 'ClientProfileID', 'ClientProfile');
    checkDups(services, 'ServiceID', 'Service');
    checkDups(clientServices, 'ClientServiceID', 'ClientService');
    checkDups(clientRevenues, 'ClientRevenueID', 'ClientRevenue');
    checks.push(createCheck(2, 'DQ-02', 'Duplicate Primary Key Identifiers', 'Detect duplicate primary key IDs across core entity worksheets.', 'Error', 'Client, ClientProfile, Service, ClientService, ClientRevenue', 'Primary keys must be uniquely assigned without duplication.', dq2));

    // 3. Unmatched foreign key references
    const validDomainIds = new Set(domains.map(d => String(d.DomainID)).concat(domains.map(d => d.DomainCode)));
    const validRegionIds = new Set(regions.map(r => String(r.RegionCodeID)).concat(regions.map(r => r.RegionCode)));
    const validCurrencyIds = new Set(currencies.map(c => String(c.CurrencyID)).concat(currencies.map(c => c.CurrencyCode)));
    const validServiceIds = new Set(services.map(s => String(s.ServiceID)).concat(services.map(s => s.ServiceCode)));
    const validPeriodTypeIds = new Set(periodTypes.map(pt => String(pt.PeriodTypeID)));

    const dq3: any[] = [];
    clients.forEach(c => {
      if (!validDomainIds.has(String(c.DomainID))) {
        dq3.push({ recordId: c.ClientID, clientId: c.ClientCode, clientName: c.ClientName, offendingField: 'DomainID', offendingValue: c.DomainID, explanation: `Invalid DomainID ${c.DomainID}` });
      }
      if (!validRegionIds.has(String(c.RegionCodeID))) {
        dq3.push({ recordId: c.ClientID, clientId: c.ClientCode, clientName: c.ClientName, offendingField: 'RegionCodeID', offendingValue: c.RegionCodeID, explanation: `Invalid RegionCodeID ${c.RegionCodeID}` });
      }
    });
    clientRevenues.forEach(r => {
      if (!validCurrencyIds.has(String(r.CurrencyID))) {
        dq3.push({ recordId: r.ClientRevenueID, clientId: String(r.ClientID), offendingField: 'CurrencyID', offendingValue: r.CurrencyID, explanation: `Invalid CurrencyID ${r.CurrencyID} in ClientRevenue` });
      }
      if (!validServiceIds.has(String(r.ServiceID))) {
        dq3.push({ recordId: r.ClientRevenueID, clientId: String(r.ClientID), offendingField: 'ServiceID', offendingValue: r.ServiceID, explanation: `Invalid ServiceID ${r.ServiceID} in ClientRevenue` });
      }
      if (!validPeriodTypeIds.has(String(r.PeriodTypeID))) {
        dq3.push({ recordId: r.ClientRevenueID, clientId: String(r.ClientID), offendingField: 'PeriodTypeID', offendingValue: r.PeriodTypeID, explanation: `Invalid PeriodTypeID ${r.PeriodTypeID} in ClientRevenue` });
      }
    });
    checks.push(createCheck(3, 'DQ-03', 'Unmatched Lookup References', 'Ensure foreign keys reference legitimate lookup records.', 'Error', 'Client, ClientRevenue, Lookups', 'All foreign key relationships must resolve to valid lookup entities.', dq3));

    // 4. Missing client logos
    const dq4 = clients
      .filter(c => !c.CompanyLogo || c.CompanyLogo.trim() === '')
      .map(c => ({
        recordId: c.ClientID,
        clientId: c.ClientCode,
        clientCode: c.ClientCode,
        clientName: c.ClientName,
        offendingField: 'CompanyLogo',
        offendingValue: 'null / empty',
        explanation: `Client "${c.ClientName}" has no logo file specified.`
      }));
    checks.push(createCheck(4, 'DQ-04', 'Missing Client Logo References', 'Detect client records lacking assigned company logos.', 'Warning', 'Client', 'Client.CompanyLogo should contain a valid image filename.', dq4));

    // 5. Invalid or missing employee counts
    const dq5 = clientProfiles
      .filter(p => p.EmployeeCount === null || p.EmployeeCount === undefined || isNaN(p.EmployeeCount) || p.EmployeeCount <= 0)
      .map(p => {
        const c = clients.find(cl => String(cl.ClientID) === String(p.ClientID) || cl.ClientCode === p.ClientCode);
        return {
          recordId: p.ClientProfileID,
          clientId: String(p.ClientID),
          clientCode: p.ClientCode || c?.ClientCode,
          clientName: c?.ClientName || `Client ${p.ClientID}`,
          offendingField: 'EmployeeCount',
          offendingValue: p.EmployeeCount,
          explanation: `Invalid or non-positive employee count (${p.EmployeeCount}).`
        };
      });
    checks.push(createCheck(5, 'DQ-05', 'Invalid or Missing Employee Counts', 'Ensure employee headcount is recorded and positive.', 'Warning', 'ClientProfile', 'ClientProfile.EmployeeCount must be a positive integer.', dq5));

    // 6. Future tenure start dates
    const dq6 = clients
      .filter(c => {
        const dStr = this.parseExcelDate(c.TenureStartDate);
        return dStr && dStr > todayStr;
      })
      .map(c => ({
        recordId: c.ClientID,
        clientId: c.ClientCode,
        clientCode: c.ClientCode,
        clientName: c.ClientName,
        offendingField: 'TenureStartDate',
        offendingValue: this.parseExcelDate(c.TenureStartDate),
        explanation: `Tenure start date is in the future (${this.parseExcelDate(c.TenureStartDate)}).`
      }));
    checks.push(createCheck(6, 'DQ-06', 'Future Tenure Start Dates', 'Detect clients with tenure start dates past current calendar date.', 'Error', 'Client', 'Client.TenureStartDate must be <= Current Date', dq6));

    // 7. Revenue records with start dates after end dates
    const dq7 = clientRevenues
      .filter(r => {
        const s = this.parseExcelDate(r.PeriodStart);
        const e = this.parseExcelDate(r.PeriodEnd);
        return s && e && s > e;
      })
      .map(r => {
        const c = clients.find(cl => String(cl.ClientID) === String(r.ClientID) || cl.ClientCode === String(r.ClientID));
        return {
          recordId: r.ClientRevenueID,
          clientId: String(r.ClientID),
          clientName: c?.ClientName,
          offendingField: 'PeriodStart / PeriodEnd',
          offendingValue: `${this.parseExcelDate(r.PeriodStart)} > ${this.parseExcelDate(r.PeriodEnd)}`,
          explanation: `PeriodStart is chronologically later than PeriodEnd.`
        };
      });
    checks.push(createCheck(7, 'DQ-07', 'Inverted Revenue Reporting Periods', 'Detect revenue periods where start date exceeds end date.', 'Error', 'ClientRevenue', 'ClientRevenue.PeriodStart <= ClientRevenue.PeriodEnd', dq7));

    // 8. Service assignments with start dates after end dates
    const dq8 = clientServices
      .filter(cs => {
        if (!cs.ServiceEndDate) return false;
        const s = this.parseExcelDate(cs.ServiceStartDate);
        const e = this.parseExcelDate(cs.ServiceEndDate);
        return s && e && s > e;
      })
      .map(cs => {
        const c = clients.find(cl => String(cl.ClientID) === String(cs.ClientID) || cl.ClientCode === String(cs.ClientID));
        return {
          recordId: cs.ClientServiceID,
          clientId: String(cs.ClientID),
          clientName: c?.ClientName,
          offendingField: 'ServiceStartDate / ServiceEndDate',
          offendingValue: `${this.parseExcelDate(cs.ServiceStartDate)} > ${this.parseExcelDate(cs.ServiceEndDate)}`,
          explanation: `ServiceStartDate is later than ServiceEndDate.`
        };
      });
    checks.push(createCheck(8, 'DQ-08', 'Inverted Service Engagement Dates', 'Validate service start date is before or equal to service end date.', 'Error', 'ClientService', 'ClientService.ServiceStartDate <= ClientService.ServiceEndDate', dq8));

    // 9. Negative employee counts
    const dq9 = clientProfiles
      .filter(p => p.EmployeeCount < 0)
      .map(p => ({
        recordId: p.ClientProfileID,
        clientId: String(p.ClientID),
        offendingField: 'EmployeeCount',
        offendingValue: p.EmployeeCount,
        explanation: `Negative employee count detected (${p.EmployeeCount}).`
      }));
    checks.push(createCheck(9, 'DQ-09', 'Negative Headcount Values', 'Detect negative employee counts.', 'Error', 'ClientProfile', 'ClientProfile.EmployeeCount >= 0', dq9));

    // 10. Negative financial values
    const dq10: any[] = [];
    clientProfiles.forEach(p => {
      if (p.CompanyRevenue < 0) {
        dq10.push({ recordId: p.ClientProfileID, clientId: String(p.ClientID), offendingField: 'CompanyRevenue', offendingValue: p.CompanyRevenue, explanation: 'Negative client company revenue.' });
      }
    });
    clientRevenues.forEach(r => {
      if (r.RevenueGenerated < 0) {
        dq10.push({ recordId: r.ClientRevenueID, clientId: String(r.ClientID), offendingField: 'RevenueGenerated', offendingValue: r.RevenueGenerated, explanation: 'Negative Consilio revenue generated.' });
      }
    });
    checks.push(createCheck(10, 'DQ-10', 'Negative Financial Values', 'Identify negative financial amounts in company revenue or Consilio revenue.', 'Error', 'ClientProfile, ClientRevenue', 'CompanyRevenue >= 0 and RevenueGenerated >= 0', dq10));

    // 11. Churned clients without a churn reason
    const dq11 = clientProfiles
      .filter(p => (String(p.ClientStatusID) === 'CSI003' || String(p.ClientStatusID) === '3') && (!p.ChurnReason || p.ChurnReason.trim() === ''))
      .map(p => {
        const c = clients.find(cl => String(cl.ClientID) === String(p.ClientID) || cl.ClientCode === p.ClientCode);
        return {
          recordId: p.ClientProfileID,
          clientId: String(p.ClientID),
          clientCode: p.ClientCode || c?.ClientCode,
          clientName: c?.ClientName,
          offendingField: 'ChurnReason',
          offendingValue: 'null / blank',
          explanation: `Client marked as Churned without a documented churn reason.`
        };
      });
    checks.push(createCheck(11, 'DQ-11', 'Churned Clients Without Churn Reason', 'Ensure clients in Churned status have an explanatory churn rationale.', 'Warning', 'ClientProfile', 'If ClientStatusID == CSI003 (Churned), ChurnReason must not be null/empty.', dq11));

    // 12. Inconsistent service status and service end dates
    const dq12 = clientServices
      .filter(cs => {
        const isEnded = String(cs.ServiceStatusID) === 'SSI002' || String(cs.ServiceStatusID) === '2';
        const hasEndDate = !!cs.ServiceEndDate;
        return (isEnded && !hasEndDate) || (!isEnded && hasEndDate && this.parseExcelDate(cs.ServiceEndDate) < todayStr);
      })
      .map(cs => {
        const c = clients.find(cl => String(cl.ClientID) === String(cs.ClientID) || cl.ClientCode === String(cs.ClientID));
        return {
          recordId: cs.ClientServiceID,
          clientId: String(cs.ClientID),
          clientName: c?.ClientName,
          offendingField: 'ServiceStatusID / ServiceEndDate',
          offendingValue: `StatusID: ${cs.ServiceStatusID}, EndDate: ${this.parseExcelDate(cs.ServiceEndDate) || 'null'}`,
          explanation: (String(cs.ServiceStatusID) === 'SSI002' || String(cs.ServiceStatusID) === '2') ? 'Service is marked Ended but has no End Date.' : 'Service is marked Active but End Date is in the past.'
        };
      });
    checks.push(createCheck(12, 'DQ-12', 'Service Status vs End Date Consistency', 'Identify Ended services missing an End Date or Active services with past End Dates.', 'Warning', 'ClientService', 'Ended services require EndDate; Active services should have null or future EndDate.', dq12));

    // 13. Orphaned revenue records
    const validClientIds = new Set(clients.map(c => String(c.ClientID)).concat(clients.map(c => c.ClientCode)));
    const dq13 = clientRevenues
      .filter(r => !validClientIds.has(String(r.ClientID)) || !validServiceIds.has(String(r.ServiceID)))
      .map(r => ({
        recordId: r.ClientRevenueID,
        clientId: String(r.ClientID),
        offendingField: 'ClientID / ServiceID',
        offendingValue: `ClientID: ${r.ClientID}, ServiceID: ${r.ServiceID}`,
        explanation: 'Revenue record points to non-existent Client or Service.'
      }));
    checks.push(createCheck(13, 'DQ-13', 'Orphaned Revenue Records', 'Detect revenue rows referring to unknown Client or Service IDs.', 'Error', 'ClientRevenue', 'ClientRevenue.ClientID in Client AND ClientRevenue.ServiceID in Service', dq13));

    // 14. Duplicate revenue periods
    const dq14: any[] = [];
    const scopeMap = new Map<string, Array<number | string>>();
    clientRevenues.forEach(r => {
      const key = `${r.ClientID}_${r.ServiceID}_${r.PeriodTypeID}_${r.PeriodStart}_${r.PeriodEnd}`;
      const list = scopeMap.get(key) || [];
      list.push(r.ClientRevenueID);
      scopeMap.set(key, list);
    });
    scopeMap.forEach((ids, key) => {
      if (ids.length > 1) {
        dq14.push({
          recordId: ids.join(', '),
          offendingField: 'Composite Scope',
          offendingValue: key,
          explanation: `Multiple revenue rows for identical Client, Service, PeriodType and Date range.`
        });
      }
    });
    checks.push(createCheck(14, 'DQ-14', 'Duplicate or Overlapping Revenue Periods', 'Detect multiple revenue entries recorded for the exact same client, service, and period interval.', 'Warning', 'ClientRevenue', 'Client, Service, PeriodType, and Date range should form a unique interval.', dq14));

    // 15. Cross-currency coverage with conversion engine active
    const dq15: any[] = [];
    enrichedClients.forEach(c => {
      const nonUsdRevs = c.revenues.filter(r => r.currencyCode !== 'USD');
      if (nonUsdRevs.length > 0) {
        const distinctCurrs = Array.from(new Set(nonUsdRevs.map(r => r.currencyCode)));
        dq15.push({
          recordId: c.clientId,
          clientId: c.clientId,
          clientCode: c.clientCode,
          clientName: c.clientName,
          offendingField: 'CurrencyCode',
          offendingValue: distinctCurrs.join(', '),
          explanation: `Client has revenue denominated in foreign currencies (${distinctCurrs.join(', ')}). Successfully normalized using published ECB exchange rates.`
        });
      }
    });
    checks.push(createCheck(15, 'DQ-15', 'Multi-Currency Revenue Conversion', 'Tracks clients with non-USD currencies normalized using published ECB exchange rates.', 'Informational', 'ClientRevenue, Currency', 'All original currencies are converted into the user-selected reporting currency.', dq15));

    // 16. Missing prior year baseline
    const dq16: any[] = [];
    enrichedClients.forEach(c => {
      const rev2025 = c.revenues.filter(r => r.periodYear === 2025 && r.periodTypeId === 1);
      const rev2024 = c.revenues.filter(r => r.periodYear === 2024 && r.periodTypeId === 1);
      if (rev2025.length > 0 && rev2024.length === 0) {
        dq16.push({
          recordId: c.clientId,
          clientId: c.clientId,
          clientCode: c.clientCode,
          clientName: c.clientName,
          offendingField: 'YoY Baseline',
          offendingValue: 'No FY 2024 Record',
          explanation: `Client has FY 2025 revenue but lacks prior FY 2024 baseline. YoY growth marked N/A.`
        });
      }
    });
    checks.push(createCheck(16, 'DQ-16', 'Missing Prior-Year Baseline for Growth', 'Flags clients where YoY growth percentage cannot be legitimately calculated.', 'Informational', 'ClientRevenue', 'YoY growth requires comparable prior-year baseline.', dq16));

    // 17. Reporting scope period exclusions
    const dq17: any[] = [];
    const ytdCount = clientRevenues.filter(r => Number(r.PeriodTypeID) === 2).length;
    if (ytdCount > 0) {
      dq17.push({
        recordId: 'Batch Exclusion',
        offendingField: 'PeriodTypeID = 2 (YTD)',
        offendingValue: `${ytdCount} records`,
        explanation: `${ytdCount} YTD records excluded from Annual reporting scope to prevent double-counting with full-year totals.`
      });
    }
    checks.push(createCheck(17, 'DQ-17', 'Reporting Scope Period Exclusions', 'Identifies records excluded from current reporting scope to prevent double counting.', 'Informational', 'ClientRevenue, ClientRevenuePeriodType', 'Annual and YTD records must not be conflated or added together.', dq17));

    return checks;
  }
}

export const excelEngine = new SiloVerseExcelEngine();
