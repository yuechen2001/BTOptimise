export const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const SESSION_ALLOWED_FIELDS = [
    'applicantType',
    'age',
    'partnerAge',
    'citizenship',
    'firstTimer',
    'employmentStatus',
    'monthlyIncome',
    'partnerMonthlyIncome',
    'cpfOA',
    'cashSavings',
    'preferredFlatTypes',
    'preferredRegions',
    'maxBudget',
] as const;

/* ─── Financial Rules Constants ────────────────────────────────────── */

export const HDB_LOAN_INTEREST_RATE = 0.026;

export const MAX_MSR = 0.3;

export const HDB_LTV_RATIO = 0.75;

export const MAX_LOAN_TENURE_YEARS = 25;

export const EHG_INCOME_CEILING = 9000;

export const INCOME_CEILING_COUPLE = 14000;

export const INCOME_CEILING_SINGLE = 7000;

export const EHG_TABLE: [number, number][] = [
    [1500, 120000],
    [2000, 105000],
    [2500, 95000],
    [3000, 85000],
    [3500, 75000],
    [4000, 65000],
    [4500, 55000],
    [5000, 45000],
    [5500, 40000],
    [6000, 35000],
    [6500, 30000],
    [7000, 25000],
    [7500, 20000],
    [8000, 15000],
    [8500, 10000],
    [9000, 5000],
];

export const OPTION_FEE_BY_FLAT_TYPE: Record<string, number> = {
    '2-Room Flexi': 500,
    '3-Room': 1000,
    '4-Room': 2000,
    '5-Room': 2000,
    '3Gen': 2000,
};

export const PLUS_FLAT_LOCK_IN_YEARS = 10;

export const PRIME_FLAT_LOCK_IN_YEARS = 6;

export const APPLICANT_TYPES = ['single', 'couple'] as const;
export const EMPLOYMENT_STATUSES = ['employed', 'self-employed', 'student', 'nsf'] as const;
export const CITIZENSHIP_STATUSES = ['SC', 'SC/SC', 'SC/PR'] as const;
export const FLAT_TYPE_PREFERENCES = [
    '2-Room Flexi',
    '3-Room',
    '4-Room',
    '5-Room',
    '3Gen',
] as const;
export const REGIONS = [
    'Ang Mo Kio',
    'Bedok',
    'Bishan',
    'Bukit Batok',
    'Bukit Merah',
    'Bukit Panjang',
    'Choa Chu Kang',
    'Clementi',
    'Geylang',
    'Hougang',
    'Jurong East',
    'Jurong West',
    'Kallang/Whampoa',
    'Marine Parade',
    'Pasir Ris',
    'Punggol',
    'Queenstown',
    'Sembawang',
    'Sengkang',
    'Serangoon',
    'Tampines',
    'Tengah',
    'Toa Payoh',
    'Woodlands',
    'Yishun',
] as const;

export type ApplicantType = (typeof APPLICANT_TYPES)[number];
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];
export type CitizenshipStatus = (typeof CITIZENSHIP_STATUSES)[number];
export type FlatTypePreference = (typeof FLAT_TYPE_PREFERENCES)[number];
export type Region = (typeof REGIONS)[number];

export const CLASSIFICATION_COLOURS = ['green', 'red', 'yellow'] as const;
export type DemandColor = (typeof CLASSIFICATION_COLOURS)[number];

export enum AffordabilityStatus {
    CAN_AFFORD = 'canAfford',
    STRETCH_REQUIRED = 'stretchRequired',
    OUT_OF_REACH = 'outOfReach',
}
