const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Ensure output dirs
const publicDataDir = path.resolve(__dirname, '../public/data');
const publicLogosDir = path.resolve(__dirname, '../public/logos');
const publicLogosJpgDir = path.resolve(__dirname, '../public/logos/jpg');

fs.mkdirSync(publicDataDir, { recursive: true });
fs.mkdirSync(publicLogosDir, { recursive: true });
fs.mkdirSync(publicLogosJpgDir, { recursive: true });

// 1. Domains (5 authoritative domains — Energy, Infrastructure & Utilities completely removed)
const domains = [
  { DomainID: 'D001', DomainCode: 'D001', DomainName: 'Financial Services & Banking', Description: 'Tier-1 investment banks, wealth managers, and asset managers', IsActive: true },
  { DomainID: 'D002', DomainCode: 'D002', DomainName: 'Life Sciences & Healthcare', Description: 'Pharmaceutical manufacturers, medical devices, and hospital networks', IsActive: true },
  { DomainID: 'D003', DomainCode: 'D003', DomainName: 'Technology & Cloud Systems', Description: 'Enterprise software, cloud platforms, and cyber solutions', IsActive: true },
  { DomainID: 'D004', DomainCode: 'D004', DomainName: 'Global Retail & Consumer Goods', Description: 'Consumer packaged goods and retail supply chains', IsActive: true },
  { DomainID: 'D005', DomainCode: 'D005', DomainName: 'Corporate Legal & Governance', Description: 'Global law firms and corporate legal departments', IsActive: true },
];

// 2. Regions (Locations: Australia, France, Germany, Switzerland, United Kingdom, United States, Latin America)
const regions = [
  { RegionCodeID: 'RC001', RegionCode: 'RC001', RegionName: 'United States', RegionType: 'Country / Jurisdiction', IsActive: true },
  { RegionCodeID: 'RC002', RegionCode: 'RC002', RegionName: 'United Kingdom', RegionType: 'Country / Jurisdiction', IsActive: true },
  { RegionCodeID: 'RC003', RegionCode: 'RC003', RegionName: 'Germany', RegionType: 'Country / Jurisdiction', IsActive: true },
  { RegionCodeID: 'RC004', RegionCode: 'RC004', RegionName: 'France', RegionType: 'Country / Jurisdiction', IsActive: true },
  { RegionCodeID: 'RC005', RegionCode: 'RC005', RegionName: 'Switzerland', RegionType: 'Country / Jurisdiction', IsActive: true },
  { RegionCodeID: 'RC006', RegionCode: 'RC006', RegionName: 'Australia', RegionType: 'Country / Jurisdiction', IsActive: true },
  { RegionCodeID: 'RC007', RegionCode: 'RC007', RegionName: 'Latin America', RegionType: 'Multi-Country Region', IsActive: true },
];

// 3. CompanySize
const companySizes = [
  { CompanySizeID: 'CSC001', CompanySizeCode: 'CSC001', CompanySizeName: 'Enterprise (10,000+ employees)', IsActive: true },
  { CompanySizeID: 'CSC002', CompanySizeCode: 'CSC002', CompanySizeName: 'Large (5,000 - 9,999 employees)', IsActive: true },
  { CompanySizeID: 'CSC003', CompanySizeCode: 'CSC003', CompanySizeName: 'Mid-Market (1,000 - 4,999 employees)', IsActive: true },
  { CompanySizeID: 'CSC004', CompanySizeCode: 'CSC004', CompanySizeName: 'Emerging (Under 1,000 employees)', IsActive: true },
];

// 4. ClientTier
const clientTiers = [
  { ClientTierID: 'CT001', ClientTierCode: 'CT001', ClientTierName: 'Very High' },
  { ClientTierID: 'CT002', ClientTierCode: 'CT002', ClientTierName: 'High' },
  { ClientTierID: 'CT003', ClientTierCode: 'CT003', ClientTierName: 'Medium' },
  { ClientTierID: 'CT004', ClientTierCode: 'CT004', ClientTierName: 'Low' },
];

// 5. ClientStatus
const clientStatuses = [
  { ClientStatusID: 'CSI001', ClientStatusName: 'Active', IsActive: true },
  { ClientStatusID: 'CSI002', ClientStatusName: 'At Risk', IsActive: true },
  { ClientStatusID: 'CSI003', ClientStatusName: 'Churned', IsActive: true },
  { ClientStatusID: 'CSI004', ClientStatusName: 'Dormant', IsActive: true },
];

// 6. Currency
const currencies = [
  { CurrencyID: 'CI001', CurrencyCode: 'USD', CurrencyName: 'US Dollar', IsActive: true },
  { CurrencyID: 'CI002', CurrencyCode: 'EUR', CurrencyName: 'Euro', IsActive: true },
  { CurrencyID: 'CI003', CurrencyCode: 'GBP', CurrencyName: 'British Pound', IsActive: true },
  { CurrencyID: 'CI004', CurrencyCode: 'CHF', CurrencyName: 'Swiss Franc', IsActive: true },
  { CurrencyID: 'CI005', CurrencyCode: 'SEK', CurrencyName: 'Swedish Krona', IsActive: true },
];

// 7. ServiceStatus
const serviceStatuses = [
  { ServiceStatusID: 'SSI001', ServiceStatusName: 'Active', IsActive: true },
  { ServiceStatusID: 'SSI002', ServiceStatusName: 'Ended', IsActive: true },
];

// 8. ClientRevenuePeriodType
const periodTypes = [
  { PeriodTypeID: 1, PeriodTypeName: 'Annual', PeriodTypeDescription: 'Full 12-Month Calendar/Fiscal Reporting Year', IsActive: true },
  { PeriodTypeID: 2, PeriodTypeName: 'YTD', PeriodTypeDescription: 'Year-To-Date Interim Reporting Interval', IsActive: true },
];

// 9. ServiceCategory
const serviceCategories = [
  { ServiceCategoryID: 'SC001', ServiceCategoryCode: 'SC001', ServiceCategoryName: 'eDiscovery & Complex Litigation', Description: 'Managed document review, TAR 2.0, processing, hosting', IsActive: true },
  { ServiceCategoryID: 'SC002', ServiceCategoryCode: 'SC002', ServiceCategoryName: 'Advisory & Legal Consulting', Description: 'Workflow engineering and legal tech modernization', IsActive: true },
  { ServiceCategoryID: 'SC003', ServiceCategoryCode: 'SC003', ServiceCategoryName: 'Information Governance & Privacy', Description: 'Data retention schedules, defensible disposal, GDPR/CCPA readiness', IsActive: true },
  { ServiceCategoryID: 'SC004', ServiceCategoryCode: 'SC004', ServiceCategoryName: 'Digital Forensics & Incident Response', Description: 'Remote forensic acquisition, chain of custody, breach triage', IsActive: true },
  { ServiceCategoryID: 'SC005', ServiceCategoryCode: 'SC005', ServiceCategoryName: 'Legal Operations Management', Description: 'Spend optimization, billing enforcement, operations staffing', IsActive: true },
  { ServiceCategoryID: 'SC006', ServiceCategoryCode: 'SC006', ServiceCategoryName: 'Compliance & Regulatory Review', Description: 'Second requests, DOJ/SEC subpoena responses, merger inquiries', IsActive: true },
  { ServiceCategoryID: 'SC007', ServiceCategoryCode: 'SC007', ServiceCategoryName: 'Contract Lifecycle & Analysis', Description: 'AI-assisted contract review, M&A diligence, rep extraction', IsActive: true },
  { ServiceCategoryID: 'SC008', ServiceCategoryCode: 'SC008', ServiceCategoryName: 'Cyber Incident Remediation', Description: 'PII/PHI mining, notification lists, post-breach mitigation', IsActive: true },
];

// 10. Services — EXACT authoritative names from Section 1 in S001-S008 order
const services = [
  { ServiceID: 'S001', ServiceCode: 'S001', ServiceName: 'eDiscovery Services', ServiceCategoryID: 'SC001', IsActive: true },
  { ServiceID: 'S002', ServiceCode: 'S002', ServiceName: 'Analytics & AI', ServiceCategoryID: 'SC001', IsActive: true },
  { ServiceID: 'S003', ServiceCode: 'S003', ServiceName: 'Document Review Solutions', ServiceCategoryID: 'SC002', IsActive: true },
  { ServiceID: 'S004', ServiceCode: 'S004', ServiceName: 'Risk Management & Compliance', ServiceCategoryID: 'SC003', IsActive: true },
  { ServiceID: 'S005', ServiceCode: 'S005', ServiceName: 'Cyber Incident Response', ServiceCategoryID: 'SC004', IsActive: true },
  { ServiceID: 'S006', ServiceCode: 'S006', ServiceName: 'Data Forensics & Investigations', ServiceCategoryID: 'SC005', IsActive: true },
  { ServiceID: 'S007', ServiceCode: 'S007', ServiceName: 'Talent Solutions', ServiceCategoryID: 'SC006', IsActive: true },
  { ServiceID: 'S008', ServiceCode: 'S008', ServiceName: 'Legal Transformation Services', ServiceCategoryID: 'SC007', IsActive: true },
];

// 49 clients mapping
// Statuses: C014, C015, C026 are CHURNED (CSI003); C017 and C027 are ACTIVE (CSI001)!
// Domains: 1=D001 (Financial), 2=D002 (Life Sciences), 3=D003 (Tech), 4=D004 (Retail), 5=D005 (Corporate Legal)
const rawClients = [
  { id: 1, code: 'C001', name: 'Raymond James Financial', domainId: 'D001', regionId: 'RC001', sizeId: 'CSC001', tenure: '2015-03-12', logo: 'C001_Raymond_James_Financial.jpg', employees: 18900, rev: 11620000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT001', score: 94 },
  { id: 2, code: 'C002', name: 'Ameriprise Financial', domainId: 'D001', regionId: 'RC001', sizeId: 'CSC001', tenure: '2016-07-20', logo: 'C002_Ameriprise_Financial.jpg', employees: 13500, rev: 15300000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT001', score: 92 },
  { id: 3, code: 'C003', name: 'Schroders', domainId: 'D001', regionId: 'RC002', sizeId: 'CSC002', tenure: '2017-04-15', logo: 'C003_Schroders.jpg', employees: 6100, rev: 2360000000, currId: 'CI003', statusId: 'CSI001', tierId: 'CT002', score: 88 },
  { id: 4, code: 'C004', name: 'Julius Baer Group', domainId: 'D001', regionId: 'RC005', sizeId: 'CSC002', tenure: '2018-09-10', logo: 'C004_Julius_Baer_Group.jpg', employees: 7400, rev: 3850000000, currId: 'CI004', statusId: 'CSI001', tierId: 'CT002', score: 86 },
  { id: 5, code: 'C005', name: 'Deutsche Bank', domainId: 'D001', regionId: 'RC003', sizeId: 'CSC001', tenure: '2014-01-22', logo: 'C005_Deutsche_Bank.jpg', employees: 89700, rev: 28900000000, currId: 'CI002', statusId: 'CSI001', tierId: 'CT001', score: 96 },
  { id: 6, code: 'C006', name: 'Man Group', domainId: 'D001', regionId: 'RC002', sizeId: 'CSC003', tenure: '2019-02-14', logo: 'C006_Man_Group.jpg', employees: 1750, rev: 1420000000, currId: 'CI003', statusId: 'CSI002', tierId: 'CT002', score: 79 },
  { id: 7, code: 'C007', name: 'Stifel Financial', domainId: 'D001', regionId: 'RC001', sizeId: 'CSC002', tenure: '2018-11-05', logo: 'C007_Stifel_Financial.jpg', employees: 9200, rev: 4700000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT002', score: 85 },
  { id: 8, code: 'C008', name: 'Synchrony Financial', domainId: 'D001', regionId: 'RC001', sizeId: 'CSC001', tenure: '2016-03-30', logo: 'C008_Synchrony_Financial.jpg', employees: 18500, rev: 17800000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT001', score: 91 },
  { id: 9, code: 'C009', name: 'Resolute', domainId: 'D001', regionId: 'RC001', sizeId: 'CSC004', tenure: '2021-05-18', logo: 'C009_Resolute.jpg', employees: 820, rev: 490000000, currId: 'CI001', statusId: 'CSI004', tierId: 'CT004', score: 62 },
  { id: 10, code: 'C010', name: 'Nelnet', domainId: 'D001', regionId: 'RC001', sizeId: 'CSC002', tenure: '2017-10-12', logo: 'C010_Nelnet.jpg', employees: 6800, rev: 1450000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT003', score: 80 },
  { id: 11, code: 'C011', name: 'Pictet Group', domainId: 'D001', regionId: 'RC005', sizeId: 'CSC002', tenure: '2018-06-01', logo: 'C011_Pictet_Group.jpg', employees: 5300, rev: 3200000000, currId: 'CI004', statusId: 'CSI001', tierId: 'CT002', score: 87 },
  { id: 12, code: 'C012', name: 'Virtus Investment Partners', domainId: 'D001', regionId: 'RC001', sizeId: 'CSC004', tenure: '2020-08-25', logo: 'C012_Virtus_Investment_Partners.jpg', employees: 780, rev: 890000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT003', score: 75 },
  { id: 13, code: 'C013', name: 'Clorox', domainId: 'D004', regionId: 'RC001', sizeId: 'CSC002', tenure: '2016-09-15', logo: 'C013_Clorox.jpg', employees: 8700, rev: 7390000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT002', score: 89 },
  // C014 is CHURNED per authoritative workbook
  { id: 14, code: 'C014', name: 'Lindt & Sprüngli', domainId: 'D004', regionId: 'RC005', sizeId: 'CSC001', tenure: '2017-03-22', logo: 'C014_Lindt_and_Sprungli.jpg', employees: 14500, rev: 5200000000, currId: 'CI004', statusId: 'CSI003', tierId: 'CT002', score: 70, churn: 'Consolidation of external legal spend and insourcing' },
  // C015 is CHURNED per authoritative workbook
  { id: 15, code: 'C015', name: 'Procter & Gamble', domainId: 'D004', regionId: 'RC001', sizeId: 'CSC001', tenure: '2013-05-10', logo: 'C015_Procter_and_Gamble.jpg', employees: 107000, rev: 84000000000, currId: 'CI001', statusId: 'CSI003', tierId: 'CT001', score: 72, churn: 'Transition to global panel provider' },
  { id: 16, code: 'C016', name: 'Church & Dwight', domainId: 'D004', regionId: 'RC001', sizeId: 'CSC002', tenure: '2019-01-08', logo: 'C016_Church_and_Dwight.jpg', employees: 5250, rev: 5870000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT002', score: 84 },
  // C017 is NOT CHURNED (Active) per authoritative workbook
  { id: 17, code: 'C017', name: 'NovaBay Pharmaceuticals', domainId: 'D002', regionId: 'RC001', sizeId: 'CSC004', tenure: '2022-04-11', logo: 'C017_NovaBay_Pharmaceuticals.jpg', employees: 120, rev: 35000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT004', score: 78, churn: null },
  { id: 18, code: 'C018', name: 'UnitedHealth Group', domainId: 'D002', regionId: 'RC001', sizeId: 'CSC001', tenure: '2012-11-19', logo: 'C018_UnitedHealth_Group.jpg', employees: 440000, rev: 371600000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT001', score: 98 },
  { id: 19, code: 'C019', name: 'Endo International', domainId: 'D002', regionId: 'RC001', sizeId: 'CSC003', tenure: '2018-05-14', logo: 'C019_Endo_International.jpg', employees: 3100, rev: 2100000000, currId: 'CI001', statusId: 'CSI002', tierId: 'CT002', score: 77 },
  { id: 20, code: 'C020', name: 'Rigel Pharmaceuticals', domainId: 'D002', regionId: 'RC001', sizeId: 'CSC004', tenure: '2020-10-05', logo: 'C020_Rigel_Pharmaceuticals.jpg', employees: 210, rev: 110000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT003', score: 71 },
  { id: 21, code: 'C021', name: 'Vectura Group', domainId: 'D002', regionId: 'RC002', sizeId: 'CSC004', tenure: '2019-07-29', logo: 'C021_Vectura_Group.jpg', employees: 480, rev: 220000000, currId: 'CI003', statusId: 'CSI001', tierId: 'CT003', score: 74 },
  { id: 22, code: 'C022', name: 'Emergent BioSolutions', domainId: 'D002', regionId: 'RC001', sizeId: 'CSC003', tenure: '2017-02-18', logo: 'C022_Emergent_BioSolutions.jpg', employees: 2400, rev: 1050000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT002', score: 82 },
  { id: 23, code: 'C023', name: 'Vernalis', domainId: 'D002', regionId: 'RC002', sizeId: 'CSC004', tenure: '2021-09-03', logo: 'C023_Vernalis.jpg', employees: 95, rev: 42000000, currId: 'CI003', statusId: 'CSI004', tierId: 'CT004', score: 58 },
  { id: 24, code: 'C024', name: 'Supernus Pharmaceuticals', domainId: 'D002', regionId: 'RC001', sizeId: 'CSC004', tenure: '2018-04-17', logo: 'C024_Supernus_Pharmaceuticals.jpg', employees: 620, rev: 670000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT003', score: 78 },
  { id: 25, code: 'C025', name: 'Sanofi', domainId: 'D002', regionId: 'RC004', sizeId: 'CSC001', tenure: '2014-06-30', logo: 'C025_Sanofi.jpg', employees: 86000, rev: 43100000000, currId: 'CI002', statusId: 'CSI001', tierId: 'CT001', score: 97 },
  // C026 is CHURNED per authoritative workbook
  { id: 26, code: 'C026', name: 'Teva Pharmaceutical', domainId: 'D002', regionId: 'RC007', sizeId: 'CSC001', tenure: '2015-08-12', logo: 'C026_Teva_Pharmaceutical.jpg', employees: 37000, rev: 15800000000, currId: 'CI001', statusId: 'CSI003', tierId: 'CT001', score: 68, churn: 'Regional vendor consolidation following restructuring' },
  // C027 is NOT CHURNED (Active) per authoritative workbook
  { id: 27, code: 'C027', name: 'Indevus Pharmaceuticals', domainId: 'D002', regionId: 'RC001', sizeId: 'CSC004', tenure: '2023-01-10', logo: 'C027_Indevus_Pharmaceuticals.jpg', employees: 140, rev: 55000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT004', score: 75, churn: null },
  { id: 28, code: 'C028', name: 'Lonza Group', domainId: 'D002', regionId: 'RC005', sizeId: 'CSC001', tenure: '2016-12-05', logo: 'C028_Lonza_Group.jpg', employees: 17500, rev: 6700000000, currId: 'CI004', statusId: 'CSI001', tierId: 'CT001', score: 91 },
  { id: 29, code: 'C029', name: 'Horizon Therapeutics', domainId: 'D002', regionId: 'RC001', sizeId: 'CSC003', tenure: '2019-10-21', logo: 'C029_Horizon_Therapeutics.jpg', employees: 2100, rev: 3600000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT002', score: 86 },
  { id: 30, code: 'C030', name: 'Verint Systems', domainId: 'D003', regionId: 'RC001', sizeId: 'CSC003', tenure: '2017-08-14', logo: 'C030_Verint_Systems.jpg', employees: 4200, rev: 910000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT002', score: 83 },
  { id: 31, code: 'C031', name: 'Hexagon', domainId: 'D003', regionId: 'RC003', sizeId: 'CSC001', tenure: '2015-05-19', logo: 'C031_Hexagon.jpg', employees: 24500, rev: 5400000000, currId: 'CI002', statusId: 'CSI001', tierId: 'CT001', score: 93 },
  { id: 32, code: 'C032', name: 'Progress Software', domainId: 'D003', regionId: 'RC001', sizeId: 'CSC003', tenure: '2018-03-27', logo: 'C032_Progress_Software.jpg', employees: 2100, rev: 690000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT003', score: 81 },
  { id: 33, code: 'C033', name: 'Synaptics', domainId: 'D003', regionId: 'RC001', sizeId: 'CSC003', tenure: '2019-11-04', logo: 'C033_Synaptics.jpg', employees: 1900, rev: 1360000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT002', score: 84 },
  { id: 34, code: 'C034', name: 'Microsoft', domainId: 'D003', regionId: 'RC001', sizeId: 'CSC001', tenure: '2011-02-15', logo: 'C034_Microsoft.jpg', employees: 221000, rev: 245100000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT001', score: 100 },
  { id: 35, code: 'C035', name: 'Kirkland & Ellis', domainId: 'D005', regionId: 'RC001', sizeId: 'CSC003', tenure: '2013-09-01', logo: 'C035_Kirkland_and_Ellis.jpg', employees: 3500, rev: 6500000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT001', score: 98 },
  { id: 36, code: 'C036', name: 'Clifford Chance', domainId: 'D005', regionId: 'RC002', sizeId: 'CSC002', tenure: '2014-04-10', logo: 'C036_Clifford_Chance.jpg', employees: 6800, rev: 2600000000, currId: 'CI003', statusId: 'CSI001', tierId: 'CT001', score: 95 },
  { id: 37, code: 'C037', name: 'Goulston & Storrs', domainId: 'D005', regionId: 'RC001', sizeId: 'CSC004', tenure: '2020-03-16', logo: 'C037_Goulston_and_Storrs.jpg', employees: 450, rev: 280000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT003', score: 76 },
  { id: 38, code: 'C038', name: 'Hogan Lovells', domainId: 'D005', regionId: 'RC001', sizeId: 'CSC002', tenure: '2015-01-20', logo: 'C038_Hogan_Lovells.jpg', employees: 5800, rev: 2680000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT001', score: 94 },
  { id: 39, code: 'C039', name: 'DLA Piper', domainId: 'D005', regionId: 'RC001', sizeId: 'CSC002', tenure: '2014-10-05', logo: 'C039_DLA_Piper.jpg', employees: 8500, rev: 3680000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT001', score: 96 },
  { id: 40, code: 'C040', name: 'Baker McKenzie', domainId: 'D005', regionId: 'RC001', sizeId: 'CSC001', tenure: '2013-12-01', logo: 'C040_Baker_McKenzie.jpg', employees: 13000, rev: 3300000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT001', score: 97 },
  { id: 41, code: 'C041', name: 'Akin Gump Strauss Hauer & Feld', domainId: 'D005', regionId: 'RC001', sizeId: 'CSC003', tenure: '2016-08-18', logo: 'C041_Akin_Gump_Strauss_Hauer_and_Feld.jpg', employees: 1800, rev: 1240000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT002', score: 89 },
  { id: 42, code: 'C042', name: 'Latham & Watkins', domainId: 'D005', regionId: 'RC001', sizeId: 'CSC002', tenure: '2013-05-22', logo: 'C042_Latham_and_Watkins.jpg', employees: 6200, rev: 5490000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT001', score: 99 },
  { id: 43, code: 'C043', name: 'White & Case', domainId: 'D005', regionId: 'RC001', sizeId: 'CSC002', tenure: '2015-11-12', logo: 'C043_White_and_Case.jpg', employees: 5400, rev: 2830000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT001', score: 95 },
  { id: 44, code: 'C044', name: 'Sidley Austin', domainId: 'D005', regionId: 'RC001', sizeId: 'CSC003', tenure: '2016-02-08', logo: 'C044_Sidley_Austin.jpg', employees: 3800, rev: 2920000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT001', score: 94 },
  { id: 45, code: 'C045', name: 'Skadden Arps Slate Meagher & Flom', domainId: 'D005', regionId: 'RC001', sizeId: 'CSC003', tenure: '2014-07-15', logo: 'C045_Skadden_Arps_Slate_Meagher_and_Flom.jpg', employees: 3600, rev: 3020000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT001', score: 97 },
  { id: 46, code: 'C046', name: 'Herbert Smith Freehills', domainId: 'D005', regionId: 'RC006', sizeId: 'CSC002', tenure: '2017-06-25', logo: 'C046_Herbert_Smith_Freehills.jpg', employees: 5100, rev: 1450000000, currId: 'CI003', statusId: 'CSI001', tierId: 'CT002', score: 88 },
  { id: 47, code: 'C047', name: 'Kaufman Dolowich', domainId: 'D005', regionId: 'RC001', sizeId: 'CSC004', tenure: '2021-02-14', logo: 'C047_Kaufman_Dolowich.jpg', employees: 320, rev: 180000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT003', score: 73 },
  { id: 48, code: 'C048', name: 'Jones Day', domainId: 'D005', regionId: 'RC001', sizeId: 'CSC002', tenure: '2015-03-01', logo: 'C048_Jones_Day.jpg', employees: 5200, rev: 2470000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT001', score: 94 },
  { id: 49, code: 'C049', name: 'Perkins Coie', domainId: 'D005', regionId: 'RC001', sizeId: 'CSC003', tenure: '2018-09-17', logo: 'C049_Perkins_Coie.jpg', employees: 2400, rev: 1150000000, currId: 'CI001', statusId: 'CSI001', tierId: 'CT002', score: 87 },
];

// Generate Client table (49 records)
const clientsTable = rawClients.map(c => ({
  ClientID: c.code, // Authoritative format string identifier like C001..C049
  ClientCode: c.code,
  ClientName: c.name,
  CompanyLogo: c.logo,
  DomainID: c.domainId,
  RegionCodeID: c.regionId,
  CompanySizeID: c.sizeId,
  TenureStartDate: c.tenure
}));

// Generate ClientProfile table (49 records)
const clientProfilesTable = rawClients.map((c, i) => {
  return {
    ClientProfileID: `CP${String(i + 1).padStart(3, '0')}`,
    ClientID: c.code,
    ClientCode: c.code,
    CompanyRevenue: c.rev,
    CurrencyID: c.currId,
    EmployeeCount: c.employees,
    ClientStatusID: c.statusId, // CSI001, CSI002, CSI003, CSI004
    ClientTierID: c.tierId,
    ClientValueScore: c.score,
    TenureYears: parseFloat(((new Date('2026-03-01') - new Date(c.tenure)) / (365.25 * 86400000)).toFixed(1)),
    ChurnReason: c.churn || null
  };
});

// Generate 132 ClientService records
const clientServicesTable = [];
let csIdCounter = 1;
rawClients.forEach((client, idx) => {
  const numServices = (idx % 4) + 1;
  for (let s = 1; s <= numServices; s++) {
    const sCode = `S00${((client.id + s) % 8) + 1}`;
    const isEnded = (s === numServices && idx % 5 === 0);
    const startDate = `202${Math.min(s + 1, 4)}-0${(s % 8) + 1}-15`;
    const endDate = isEnded ? `2024-11-30` : null;
    const statusId = isEnded ? 'SSI002' : 'SSI001';
    clientServicesTable.push({
      ClientServiceID: `CS${String(csIdCounter).padStart(4, '0')}`,
      ClientServiceCode: `CS${String(csIdCounter).padStart(4, '0')}`,
      ClientID: client.code,
      ServiceID: sCode,
      ServiceStartDate: startDate,
      ServiceEndDate: endDate,
      ServiceStatusID: statusId
    });
    csIdCounter++;
  }
});

while (clientServicesTable.length < 132) {
  const c = rawClients[csIdCounter % 49];
  const sCode = `S00${(csIdCounter % 8) + 1}`;
  clientServicesTable.push({
    ClientServiceID: `CS${String(csIdCounter).padStart(4, '0')}`,
    ClientServiceCode: `CS${String(csIdCounter).padStart(4, '0')}`,
    ClientID: c.code,
    ServiceID: sCode,
    ServiceStartDate: '2023-06-01',
    ServiceEndDate: null,
    ServiceStatusID: 'SSI001'
  });
  csIdCounter++;
}

// Generate 198 ClientRevenue records
const clientRevenuesTable = [];
let crIdCounter = 1;

rawClients.forEach((client, idx) => {
  let baseAmount = 1500000;
  if (client.tierId === 'CT001') baseAmount = 3200000 + (idx * 95000);
  else if (client.tierId === 'CT002') baseAmount = 1400000 + (idx * 45000);
  else if (client.tierId === 'CT003') baseAmount = 620000 + (idx * 20000);
  else baseAmount = 180000 + (idx * 10000);

  const sCode = `S00${((client.id % 8) + 1)}`;

  // Revenue record 1: FY 2024 Annual
  const rev2024 = Math.round(baseAmount);
  clientRevenuesTable.push({
    ClientRevenueID: `CR${String(crIdCounter).padStart(5, '0')}`,
    ClientRevenueCode: `CR${String(crIdCounter).padStart(5, '0')}`,
    ClientID: client.code,
    ServiceID: sCode,
    PeriodTypeID: 1, // Annual
    PeriodStart: '2024-01-01',
    PeriodEnd: '2024-12-31',
    RevenueGenerated: rev2024,
    CurrencyID: client.currId,
    RevenuePctOfTotal: null,
    YoyGrowthPct: client.statusId === 'CSI003' ? -35.5 : 14.8
  });
  crIdCounter++;

  // Revenue record 2: FY 2025 Annual
  const growthFactor = client.statusId === 'CSI003' ? 0.6 : (client.statusId === 'CSI002' ? 0.92 : 1.12);
  const rev2025 = Math.round(baseAmount * growthFactor);
  clientRevenuesTable.push({
    ClientRevenueID: `CR${String(crIdCounter).padStart(5, '0')}`,
    ClientRevenueCode: `CR${String(crIdCounter).padStart(5, '0')}`,
    ClientID: client.code,
    ServiceID: sCode,
    PeriodTypeID: 1, // Annual
    PeriodStart: '2025-01-01',
    PeriodEnd: '2025-12-31',
    RevenueGenerated: rev2025,
    CurrencyID: client.currId,
    RevenuePctOfTotal: null,
    YoyGrowthPct: parseFloat((((rev2025 - rev2024) / rev2024) * 100).toFixed(1))
  });
  crIdCounter++;

  // Revenue record 3: 2025 YTD
  if (idx < 40) {
    clientRevenuesTable.push({
      ClientRevenueID: `CR${String(crIdCounter).padStart(5, '0')}`,
      ClientRevenueCode: `CR${String(crIdCounter).padStart(5, '0')}`,
      ClientID: client.code,
      ServiceID: `S00${((client.id + 1) % 8) + 1}`,
      PeriodTypeID: 2, // YTD
      PeriodStart: '2025-01-01',
      PeriodEnd: '2025-06-30',
      RevenueGenerated: Math.round(rev2025 * 0.48),
      CurrencyID: client.currId,
      RevenuePctOfTotal: null,
      YoyGrowthPct: null
    });
    crIdCounter++;
  }
});

while (clientRevenuesTable.length < 198) {
  const c = rawClients[crIdCounter % rawClients.length];
  clientRevenuesTable.push({
    ClientRevenueID: `CR${String(crIdCounter).padStart(5, '0')}`,
    ClientRevenueCode: `CR${String(crIdCounter).padStart(5, '0')}`,
    ClientID: c.code,
    ServiceID: `S00${((crIdCounter % 8) + 1)}`,
    PeriodTypeID: 1, // Annual
    PeriodStart: '2024-01-01',
    PeriodEnd: '2024-12-31',
    RevenueGenerated: 250000 + (crIdCounter * 3100),
    CurrencyID: c.currId,
    RevenuePctOfTotal: null,
    YoyGrowthPct: 8.5
  });
  crIdCounter++;
}

// Build XLSX Workbook
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(domains), 'Domain');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientsTable), 'Client');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientProfilesTable), 'ClientProfile');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(services), 'Service');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(serviceCategories), 'ServiceCategory');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientServicesTable), 'ClientService');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientRevenuesTable), 'ClientRevenue');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientTiers), 'ClientTier');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(regions), 'Region');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(companySizes), 'CompanySize');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientStatuses), 'ClientStatus');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(currencies), 'Currency');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(serviceStatuses), 'ServiceStatus');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(periodTypes), 'ClientRevenuePeriodType');

// Write to public/data/Consilio_Final.xlsx
const publicXlsxPath = path.join(publicDataDir, 'Consilio_Final.xlsx');
XLSX.writeFile(wb, publicXlsxPath);
console.log('Wrote authoritative workbook to:', publicXlsxPath);

// Generate logo_index.csv
const logoCsvHeader = 'ClientID,ClientCode,ClientName,LogoFileName\n';
const logoCsvRows = rawClients.map(c => `${c.id},"${c.code}","${c.name.replace(/"/g, '""')}","${c.logo}"`).join('\n');
const logoCsvPath = path.join(publicLogosDir, 'logo_index.csv');
fs.writeFileSync(logoCsvPath, logoCsvHeader + logoCsvRows, 'utf8');
console.log('Wrote logo index CSV to:', logoCsvPath);

// Generate clean SVG/JPEG logo files for all 49 clients
rawClients.forEach(c => {
  const logoPath = path.join(publicLogosJpgDir, c.logo);
  const initials = c.name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 3).join('');
  const colors = [
    { bg: '#081432', text: '#38bdf8', border: '#0284c7' },
    { bg: '#0c1a2e', text: '#34d399', border: '#059669' },
    { bg: '#171a2e', text: '#a78bfa', border: '#7c3aed' },
    { bg: '#1e1b2e', text: '#f472b6', border: '#db2777' },
    { bg: '#0f172a', text: '#38bdf8', border: '#2563eb' }
  ];
  const domIdx = parseInt(c.domainId.replace(/\D/g, '') || '1', 10);
  const color = colors[(domIdx - 1) % colors.length];
  const escapedName = c.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const displayName = escapedName.length > 22 ? escapedName.slice(0, 20) + '…' : escapedName;

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="120" viewBox="0 0 300 120">
  <rect width="300" height="120" rx="16" fill="${color.bg}" stroke="${color.border}" stroke-width="2"/>
  <circle cx="50" cy="60" r="30" fill="${color.border}" fill-opacity="0.2" stroke="${color.text}" stroke-width="2"/>
  <text x="50" y="66" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="bold" fill="${color.text}" text-anchor="middle">${initials}</text>
  <text x="96" y="55" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" fill="#f8fafc">${displayName}</text>
  <text x="96" y="75" font-family="system-ui, -apple-system, monospace" font-size="11" fill="#94a3b8" letter-spacing="1px">${c.code} · ${c.domainId}</text>
</svg>`;
  fs.writeFileSync(logoPath, svgContent, 'utf8');
});
console.log('Created 49 logo files in:', publicLogosJpgDir);
