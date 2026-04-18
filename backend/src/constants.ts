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

/** Annual income growth rates by scenario */
export const INCOME_GROWTH_RATES = {
    conservative: 0.02,
    moderate: 0.04,
    aggressive: 0.06,
} as const;

/** CPF Ordinary Account interest rate */
export const CPF_OA_INTEREST_RATE = 0.025;

/** CPF contribution rates by age group (employee + employer combined) */
export const CPF_CONTRIBUTION_RATES = {
    under35: 0.37,
    age35to45: 0.37,
    age45to50: 0.36,
    age50to55: 0.32,
    age55to60: 0.265,
    age60to65: 0.175,
    over65: 0.125,
} as const;

/** Default cash savings rate (% of monthly income saved) */
export const DEFAULT_CASH_SAVINGS_RATE = 0.1;

/** Affordability thresholds (% income buffer after MSR payment) */
export const AFFORDABILITY_THRESHOLDS = {
    comfortable: 0.2, // >20% income buffer after MSR
    stretch: 0.1, // 10-20% buffer
    // <10% is unaffordable
} as const;

/** Default timeline projection settings */
export const DEFAULT_TIMELINE_YEARS = 5;
export const MAX_TIMELINE_YEARS = 10;
export const DEFAULT_INTERVAL_MONTHS = 6;

/** Minimum Occupation Period (MOP) by property type */
export const MOP_YEARS = {
    BTO_Standard: 5,
    BTO_Plus: 10,
    BTO_Prime: 6,
    Resale: 0, // No MOP for buyer
    EC: 5,
} as const;

/** BTO quarterly launch cycle (estimated month numbers) */
export const BTO_LAUNCH_MONTHS = [2, 5, 8, 11] as const;

/** BTO construction + waiting period (months from launch to key collection) */
export const BTO_WAITING_PERIOD_MONTHS = 48;

/** Average monthly loan repayment per $100k borrowed (at 2.6% over 25 years) */
export const MONTHLY_PAYMENT_PER_100K = 455; // Approximate for quick calculations
