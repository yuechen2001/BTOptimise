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
    monthlyIncome: number; // applicant's gross monthly income
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

/** Backend project flat type structure */
export interface FlatOption {
    type: string;
    estimatedFloorArea: number | null;
    estimatedInternalFloorArea: number | null;
    minIndicativePrice: number | null;
    maxIndicativePrice: number | null;
    unitCount: number | null;
}

/** Backend project structure from API */
export interface BTOProject {
    _id: string;
    projectCode: string;
    name: string;
    estate: string;
    classification: ProjectClassification;
    launchdate: string | null;
    estimatedCompletion: string | null;
    flatTypes: FlatOption[];
    lastVerifiedAt: string | null;
}

/** Application rate from backend */
export interface ApplicationRate {
    _id: string;
    launchCode: string;
    estate: string;
    projectGroup: string;
    flatType: string;
    noOfApplicants: number;
    noOfUnits: number;
    overallAppRate: number;
    firstTimerFamiliesAppRate: number;
    firstTimerSinglesAppRate: number;
    secondTimerFamiliesAppRate: number;
    seniorsAppRate: number;
    projectCodes: string[];
    sourceAsOf: string;
    lastVerifiedAt: string | null;
}

/* ───────────────────────── Financial Computation Types ───────────────── */

export interface GrantResult {
    ehgAmount: number;
    proximityGrant: number;
    totalGrant: number;
    breakdown: string[];
}

export interface LoanResult {
    maxLoanAmount: number;
    monthlyInstalment: number;
    loanTenureYears: number;
    interestRate: number;
    msrUsed: number;
}

export interface MilestonePayment {
    stage: string;
    amountCash: number;
    amountCPF: number;
    cumulativeCash: number;
    cumulativeCPF: number;
}

export interface CashFlowResult {
    milestones: MilestonePayment[];
    totalCashRequired: number;
    totalCPFRequired: number;
}

export interface AffordabilityCheckResult {
    canAfford: boolean;
    cashShortfall: number;
    monthlyIncomeBuffer: number;
}

export interface EligibilityResult {
    canPurchaseBTO: boolean;
    reasons: string[];
    incomeCeilingCheck: boolean;
    deferredIncomeAssessment: boolean;
}

export interface FinancialCalculationResult {
    eligibility: EligibilityResult;
    grants: GrantResult;
    loan: LoanResult;
    cashFlow: CashFlowResult;
    affordability: AffordabilityCheckResult;
}

export interface ClawbackResult {
    subsidy: number;
    clawbackAmount: number;
    netProceeds: number;
    effectivePrice: number;
}

export interface DemandInfoResult {
    rate: number;
    colour: string;
    totalUnits?: number;
    totalApplicants?: number;
}

export interface AffordabilityClassificationResult {
    status: 'canAfford' | 'stretchRequired' | 'outOfReach';
    colour: 'green' | 'yellow' | 'red';
}

export interface RecommendedFlatResult extends FlatOption {
    financials: FinancialCalculationResult;
    affordability: AffordabilityClassificationResult;
    demandInfo: DemandInfoResult;
}

/* ───────────────────────── Display Types for Dashboard/Compare ───────── */

/**
 * Combined result for displaying affordability on a per-project+flat-type basis.
 * This is used by the Dashboard and Compare components.
 */
export interface ProjectAffordabilityResult {
    project: BTOProject;
    selectedFlat: RecommendedFlatResult;
}

/* ───────────────────────── Onboarding State ──────────────────────────── */

export interface OnboardingState {
    currentStep: number;
    profile: Partial<UserProfile>;
    completed: boolean;
}

/* ───────────────────────── Session State ─────────────────────────────── */

export interface SessionState {
    sessionId: string | null;
    isLoading: boolean;
    error: string | null;
}
