/**
 * Timeline Visualizer Type Definitions
 * 
 * Supports user stories:
 * - Story 1: Deferred Income Assessment (DIA) strategy
 * - Story 2: Grant Ceiling optimizer
 * - Story 6: Wait-and-See opportunity cost analysis
 */

import type { IUserSession } from '../userSession/userSession.model';
import type {
    GrantResult,
    LoanResult,
    EligibilityResult,
    AffordabilityResult,
} from '../financialRules/financialRules.service';
import type { FlatTypePreference, CitizenshipStatus, EmploymentStatus } from '../../constants';

/* ─── Configuration Types ──────────────────────────────────────────── */

/** Income growth rate scenarios */
export type IncomeGrowthScenario = 'conservative' | 'moderate' | 'aggressive';

/** Property type for future extension (Story 7) */
export type PropertyType = 'BTO' | 'Resale' | 'EC';

/** Comparison strategy for scenarios */
export type ComparisonStrategy = 'apply_now' | 'wait_6m' | 'wait_12m' | 'wait_24m' | 'custom';

/** Project classification */
export type ProjectClassification = 'Standard' | 'Plus' | 'Prime';

/** Timeline projection configuration */
export interface TimelineProjectionConfig {
    startYear: number;
    endYear: number;
    intervalMonths: number; // 3, 6, or 12
    incomeGrowthScenario: IncomeGrowthScenario;

    /* Story 1: Deferred Income Assessment handling */
    assumeEmploymentDate?: string; // ISO date when NSF/student becomes employed
    assumedStartingSalary?: number; // Expected monthly income after employment

    /* Story 6: Opportunity cost tracking */
    currentMonthlyRent?: number; // Current rent being paid
    includeOpportunityCost?: boolean;

    /* Optional overrides */
    cpfContributionRate?: number; // Override default CPF contribution rate
    cashSavingsRate?: number; // % of income saved monthly
}

/* ─── Snapshot Types ───────────────────────────────────────────────── */

/** Financial state at a specific point in time */
export interface TimelineSnapshot {
    date: string; // ISO date string
    monthsFromNow: number;

    /* Projected financial state */
    projectedMonthlyIncome: number;
    projectedPartnerMonthlyIncome?: number;
    projectedCPFOA: number;
    projectedCashSavings: number;
    totalHouseholdIncome: number;

    /* Demographics at this point */
    age: number;
    partnerAge?: number;

    /* Employment status projection (Story 1) */
    employmentStatus: EmploymentStatus;
    isDeferredIncome: boolean;

    /* Recalculated financial metrics using existing service functions */
    eligibility: EligibilityResult;
    grants: GrantResult;
    maxLoan: LoanResult;

    /* Affordability bands for different flat types */
    affordabilityBands: AffordabilityBand[];

    /* Story 6: Opportunity cost accumulation */
    opportunityCost?: OpportunityCostSnapshot;
}

/** Affordability for a specific flat type at a point in time */
export interface AffordabilityBand {
    flatType: FlatTypePreference;
    classification: ProjectClassification;
    priceRange: {
        min: number;
        max: number;
    };

    /* Affordability classification */
    affordabilityLevel: 'comfortable' | 'stretch' | 'unaffordable';
    cashRequired: number; // Total cash at key collection
    cpfRequired: number; // Total CPF used
    monthlyInstalment: number;
    cashShortfall: number; // 0 if affordable
    bufferPercentage: number; // % income remaining after MSR
}

/** Opportunity cost tracking (Story 6) */
export interface OpportunityCostSnapshot {
    cumulativeRentPaid: number;
    cpfInterestGained: number; // CPF OA interest earned during wait
    netOpportunityCost: number; // Rent - CPF interest
}

/* ─── Milestone Types ──────────────────────────────────────────────── */

export type MilestoneType =
    | 'dia_expires' // Story 1: Deferred assessment ends
    | 'grant_tier_drop' // Story 2: Income crosses grant threshold
    | 'grant_disqualified' // Story 2: Income exceeds ceiling
    | 'optimal_application_window' // Story 2: Best time to apply
    | 'bto_launch_cycle' // Estimated BTO launch date
    | 'income_milestone'; // General income increase

/** Critical timeline events */
export interface TimelineMilestone {
    date: string; // ISO date
    monthsFromNow: number;
    type: MilestoneType;
    title: string;
    description: string;
    significance: 'critical' | 'important' | 'informational';

    /* Financial impact */
    impactOnGrants?: number; // Amount of grant change
    impactOnEligibility?: string; // Eligibility status change
}

/** Optimal application window (Story 2) */
export interface OptimalWindow {
    startDate: string;
    endDate: string;
    reason: string;
    grantAmount: number;
    priority: 'high' | 'medium' | 'low';
    expiryWarning?: string; // e.g., "Income exceeds ceiling in 3 months"
}

/* ─── Scenario Comparison (Story 6) ────────────────────────────────── */

/** Comparison of different application timing strategies */
export interface ScenarioComparison {
    scenarioName: string;
    strategy: ComparisonStrategy;
    applicationDate: string; // When to apply

    /* Financial outcomes */
    totalGrantsReceived: number;
    totalCashRequired: number;
    monthlyInstalment: number;
    totalInterestPaid: number; // Over 25-year loan tenure

    /* Opportunity costs (Story 6) */
    rentPaidBeforePurchase: number;
    cpfInterestGainedFromWaiting: number;
    netOpportunityCost: number; // rent - CPF interest

    /* Key dates */
    keyCollectionDate: string; // Estimated completion (~4 years)

    /* Affordability at application time */
    affordabilityLevel: 'comfortable' | 'stretch' | 'unaffordable';
    cashShortfall: number;
}

/* ─── Main Timeline Result ─────────────────────────────────────────── */

/** Projection assumptions used in calculations */
export interface ProjectionAssumptions {
    incomeGrowthRate: number; // Annual % increase
    cpfOAInterestRate: number; // CPF OA interest rate
    cpfContributionRate: number; // Monthly CPF contribution %
    cashSavingsRate: number; // % of income saved monthly
    rentInflationRate?: number; // If tracking rent
}

/** Complete timeline projection result */
export interface TimelineProjectionResult {
    sessionId: string;
    config: TimelineProjectionConfig;
    generatedAt: string; // ISO timestamp

    /* Core timeline data */
    snapshots: TimelineSnapshot[];
    milestones: TimelineMilestone[];

    /* Story 2: Optimal windows */
    optimalApplicationWindows: OptimalWindow[];

    /* Story 6: Scenario comparisons */
    scenarioComparisons: ScenarioComparison[];

    /* Assumptions used in calculations */
    assumptions: ProjectionAssumptions;
}

/* ─── Helper Types ─────────────────────────────────────────────────── */

/** Internal session snapshot for projections */
export interface ProjectedUserSession extends Omit<IUserSession, '_id' | 'sessionId' | 'expiresAt'> {
    projectedIncome: number;
    projectedPartnerIncome?: number;
    projectedCPFOA: number;
    projectedCashSavings: number;
    projectedAge: number;
    projectedPartnerAge?: number;
}
