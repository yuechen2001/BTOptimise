/* ───────────────────────── User Profile Types ───────────────────────── */

export type ApplicantType = 'single' | 'couple';
export type EmploymentStatus = 'employed' | 'self-employed' | 'student' | 'nsf';
export type CitizenshipStatus = 'SC' | 'SC/SC' | 'SC/PR';
export type FlatTypePreference = '2-Room Flexi' | '3-Room' | '4-Room' | '5-Room' | '3Gen';

export interface UserProfile {
    /* Step 1 – Demographics */
    applicantType: ApplicantType;
    age: number;
    partnerAge?: number;
    citizenship: CitizenshipStatus;
    firstTimer: boolean;

    /* Step 2 – Financials */
    employmentStatus: EmploymentStatus;
    monthlyIncome: number; // gross combined
    partnerMonthlyIncome?: number;
    cpfOA: number; // current CPF-OA balance
    cashSavings: number;

    /* Step 3 – Preferences */
    preferredFlatTypes: FlatTypePreference[];
    preferredRegions: Region[];
    maxBudget?: number; // optional hard ceiling
}

/* ───────────────────────── Project Catalogue Types ───────────────────── */

export type Region =
    | 'Ang Mo Kio'
    | 'Bedok'
    | 'Bishan'
    | 'Bukit Batok'
    | 'Bukit Merah'
    | 'Bukit Panjang'
    | 'Choa Chu Kang'
    | 'Clementi'
    | 'Geylang'
    | 'Hougang'
    | 'Jurong East'
    | 'Jurong West'
    | 'Kallang/Whampoa'
    | 'Marine Parade'
    | 'Pasir Ris'
    | 'Punggol'
    | 'Queenstown'
    | 'Sembawang'
    | 'Sengkang'
    | 'Serangoon'
    | 'Tampines'
    | 'Tengah'
    | 'Toa Payoh'
    | 'Woodlands'
    | 'Yishun';

export type ProjectClassification = 'Standard' | 'Plus' | 'Prime';

export interface FlatOption {
    type: FlatTypePreference;
    units: number;
    priceMin: number; // SGD
    priceMax: number; // SGD
}

export interface OversubscriptionData {
    flatType: FlatTypePreference;
    applicants: number;
    units: number;
    ratio: number; // applicants-to-unit
}

export interface BTOProject {
    id: string;
    name: string;
    estate: Region;
    classification: ProjectClassification;
    launchDate: string; // e.g. "Oct 2025"
    estimatedCompletion: string; // e.g. "Q4 2029"
    flatOptions: FlatOption[];
    clawbackRate: number; // 0 for Standard, e.g. 0.06 for Plus, 0.09 for Prime (fraction of resale)
    subsidyRecoveryYears: number; // MOP + clawback window
    oversubscription: OversubscriptionData[];
    imageUrl?: string;
}

/* ───────────────────────── Financial Computation Types ───────────────── */

export interface GrantResult {
    ehgAmount: number;
    proximityGrant: number;
    totalGrant: number;
    breakdown: string[]; // human-readable line items
}

export interface LoanResult {
    maxLoanAmount: number;
    monthlyInstalment: number;
    loanTenureYears: number;
    interestRate: number;
    msrUsed: number; // fraction of income consumed
}

export interface MilestoneCashFlow {
    stage: string; // e.g. "Option Fee", "Signing", "Key Collection"
    percentageOfPrice: number;
    amountDue: number;
    cpfUsable: number;
    cashRequired: number;
    cumulativePaid: number;
}

export interface AffordabilityResult {
    project: BTOProject;
    selectedFlatType: FlatTypePreference;
    indicativePrice: number; // mid-point of range
    grant: GrantResult;
    loan: LoanResult;
    effectivePrice: number; // price - grants
    milestones: MilestoneCashFlow[];
    totalCashNeeded: number;
    totalCpfNeeded: number;
    clawbackEstimate: number; // if resold after MOP
    classification: 'green' | 'yellow' | 'red';
    classificationReason: string;
}

/* ───────────────────────── Onboarding State ──────────────────────────── */

export interface OnboardingState {
    currentStep: number;
    profile: Partial<UserProfile>;
    completed: boolean;
}
