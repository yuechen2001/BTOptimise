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

/* ───────────────────────── Timeline Visualizer Types ──────────────────── */

export type IncomeGrowthScenario = 'conservative' | 'moderate' | 'aggressive';
export type PropertyType = 'BTO' | 'Resale' | 'EC';
export type ComparisonStrategy = 'apply_now' | 'wait_6m' | 'wait_12m' | 'wait_24m' | 'custom';
export type AffordabilityLevel = 'comfortable' | 'stretch' | 'unaffordable';

export interface TimelineConfig {
    startYear: number;
    endYear: number;
    intervalMonths: number;
    incomeGrowthScenario: IncomeGrowthScenario;
    assumeEmploymentDate?: string;
    assumedStartingSalary?: number;
    cpfContributionRate?: number;
    cashSavingsRate?: number;
}

export interface TimelineSnapshot {
    date: string;
    monthsFromNow: number;
    projectedMonthlyIncome: number;
    projectedPartnerMonthlyIncome?: number;
    projectedCPFOA: number;
    projectedCashSavings: number;
    totalHouseholdIncome: number;
    age: number;
    partnerAge?: number;
    employmentStatus: EmploymentStatus;
    isDeferredIncome: boolean;
    eligibility: EligibilityResult;
    grants: GrantResult;
    maxLoan: LoanResult;
    affordabilityBands: AffordabilityBand[];
    opportunityCost?: OpportunityCostSnapshot;
}

export interface AffordabilityBand {
    flatType: FlatTypePreference;
    classification: ProjectClassification;
    priceRange: { min: number; max: number };
    affordabilityLevel: AffordabilityLevel;
    cashRequired: number;
    cpfRequired: number;
    monthlyInstalment: number;
    cashShortfall: number;
    bufferPercentage: number;
}

export interface OpportunityCostSnapshot {
    cumulativeRentPaid: number;
    cpfInterestGained: number;
    netOpportunityCost: number;
}

export type MilestoneType =
    | 'dia_expires'
    | 'grant_tier_drop'
    | 'grant_disqualified'
    | 'optimal_application_window'
    | 'bto_launch_cycle'
    | 'income_milestone'
    | 'bto_launch'
    | 'option_fee_due'
    | 'signing_payment_due'
    | 'key_collection_payment_due'
    | 'cash_ready_option_fee'
    | 'downpayment_saved'
    | 'monthly_payment_affordable';

export interface TimelineMilestone {
    date: string;
    monthsFromNow: number;
    type: MilestoneType;
    title: string;
    description: string;
    significance: 'critical' | 'important' | 'informational';
    impactOnGrants?: number;
    impactOnEligibility?: string;
    projectId?: string;
    paymentAmount?: number;
    cashAmount?: number;
    cpfAmount?: number;
    canAfford?: boolean;
    // Projected balances at milestone date
    projectedCashSavings?: number;
    projectedCPFOA?: number;
    // Required savings rate to afford this milestone
    requiredMonthlySavingsRate?: number; // e.g., 0.15 = 15% of income
    monthlyIncomeAtMilestone?: number; // Total household income at this milestone
}

export interface ProjectionAssumptions {
    incomeGrowthRate: number;
    cpfOAInterestRate: number;
    cpfContributionRate: number;
    cashSavingsRate: number;
    rentInflationRate?: number;
}

export interface ProjectTimelineRequest {
    projectId: string;
    projectName: string;
    flatType: FlatTypePreference;
    estimatedFloorArea: number | null;
    price: number;
    classification: 'Standard' | 'Plus' | 'Prime';
    estimatedLaunchDate?: string;
}

export interface ProjectTimeline {
    project: ProjectTimelineRequest;
    milestones: TimelineMilestone[];
    affordability: {
        canAffordOptionFee: boolean;
        canAffordSigning: boolean;
        canAffordKeyCollection: boolean;
        cashShortfall: number;
        optionFeeShortfall: number;
        signingShortfall: number;
        keyCollectionShortfall: number;
    };
}

export interface TimelineProjectionResult {
    sessionId: string;
    config: TimelineConfig;
    generatedAt: string;
    snapshots: TimelineSnapshot[];
    milestones: TimelineMilestone[];
    projectTimelines: ProjectTimeline[];
    assumptions: ProjectionAssumptions;
}
