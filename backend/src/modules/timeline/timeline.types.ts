import type { IUserSession } from '../userSession/userSession.model';
import type {
    GrantResult,
    LoanResult,
    EligibilityResult,
    AffordabilityResult,
} from '../financialRules/financialRules.service';
import type { FlatTypePreference, CitizenshipStatus, EmploymentStatus } from '../../constants';

/* ─── Configuration Types ──────────────────────────────────────────── */

export type IncomeGrowthScenario = 'conservative' | 'moderate' | 'aggressive';

export type PropertyType = 'BTO' | 'Resale' | 'EC';

export type ComparisonStrategy = 'apply_now' | 'wait_6m' | 'wait_12m' | 'wait_24m' | 'custom';

export type ProjectClassification = 'Standard' | 'Plus' | 'Prime';

export interface TimelineProjectionConfig {
    startYear: number;
    endYear: number;
    intervalMonths: number; // 3, 6, or 12
    incomeGrowthScenario: IncomeGrowthScenario;
    assumeEmploymentDate?: string;
    assumedStartingSalary?: number;
    currentMonthlyRent?: number;
    includeOpportunityCost?: boolean;
    cpfContributionRate?: number;
    cashSavingsRate?: number;
}

/* ─── Project Timeline Types ───────────────────────────────────────── */

export interface ProjectTimelineRequest {
    projectId: string;
    projectName: string;
    flatType: FlatTypePreference;
    price: number;
    classification: ProjectClassification;
    estimatedLaunchDate?: string; // ISO date or 'Q1 2027', 'Q2 2027', etc.
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

/* ─── Snapshot Types ───────────────────────────────────────────────── */

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
    priceRange: {
        min: number;
        max: number;
    };

    /* Affordability classification */
    affordabilityLevel: 'comfortable' | 'stretch' | 'unaffordable';
    cashRequired: number;
    cpfRequired: number;
    monthlyInstalment: number;
    cashShortfall: number; // 0 if affordable
    bufferPercentage: number; // % income remaining after MSR
}

export interface OpportunityCostSnapshot {
    cumulativeRentPaid: number;
    cpfInterestGained: number;
    netOpportunityCost: number; // Rent - CPF interest
}

/* ─── Milestone Types ──────────────────────────────────────────────── */

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
}

/* ─── Main Timeline Result ─────────────────────────────────────────── */

export interface ProjectionAssumptions {
    incomeGrowthRate: number;
    cpfOAInterestRate: number;
    cpfContributionRate: number;
    cashSavingsRate: number;
    rentInflationRate?: number;
}

/** Complete timeline projection result */
export interface TimelineProjectionResult {
    sessionId: string;
    config: TimelineProjectionConfig;
    generatedAt: string; // ISO timestamp
    snapshots: TimelineSnapshot[];
    milestones: TimelineMilestone[];
    projectTimelines: ProjectTimeline[];
    assumptions: ProjectionAssumptions;
}

/* ─── Helper Types ─────────────────────────────────────────────────── */

export interface ProjectedUserSession extends Omit<
    IUserSession,
    '_id' | 'sessionId' | 'expiresAt'
> {
    projectedIncome: number;
    projectedPartnerIncome?: number;
    projectedCPFOA: number;
    projectedCashSavings: number;
    projectedAge: number;
    projectedPartnerAge?: number;
}
