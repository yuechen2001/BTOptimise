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

    /* Deferred Income Assessment handling */
    assumeEmploymentDate?: string; // ISO date when NSF/student becomes employed
    assumedStartingSalary?: number; // Expected monthly income after employment

    /* Wait-and-see opportunity cost inputs */
    currentMonthlyRent?: number; // Current monthly rent paid while waiting
    includeOpportunityCost?: boolean; // Whether to calculate rent vs CPF growth

    /* Optional overrides */
    cpfContributionRate?: number; // Override default CPF contribution rate
    cashSavingsRate?: number; // % of income saved monthly
}

/* ─── Project Timeline Types ───────────────────────────────────────── */

/** Project information for timeline generation */
export interface ProjectTimelineRequest {
    projectId: string;
    projectName: string;
    flatType: FlatTypePreference;
    price: number;
    classification: ProjectClassification;
    estimatedLaunchDate?: string; // ISO date or 'Q1 2027', 'Q2 2027', etc.
}

/** Project-specific timeline with milestones and affordability */
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
    | 'dia_expires' // Deferred assessment ends
    | 'grant_tier_drop' // Income crosses grant threshold
    | 'grant_disqualified' // Income exceeds ceiling
    | 'optimal_application_window' // Best time to apply
    | 'bto_launch_cycle' // Estimated BTO launch date
    | 'income_milestone' // General income increase
    // Project-specific payment milestones
    | 'bto_launch' // Project launches for application
    | 'option_fee_due' // Option fee payment required
    | 'signing_payment_due' // Downpayment at signing
    | 'key_collection_payment_due' // Final payment at key collection
    // Savings milestones
    | 'cash_ready_option_fee' // Saved enough cash for option fee
    | 'downpayment_saved' // Saved enough for full downpayment
    | 'monthly_payment_affordable'; // Income sufficient for loan

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

    /* Project-specific data */
    projectId?: string; // Links milestone to specific project
    paymentAmount?: number; // Payment required (for payment milestones)
    cashAmount?: number; // Cash portion of payment
    cpfAmount?: number; // CPF portion of payment
    canAfford?: boolean; // Whether user can afford at this time
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

    /* Project-specific timelines */
    projectTimelines: ProjectTimeline[];

    /* Assumptions used in calculations */
    assumptions: ProjectionAssumptions;
}

/* ─── Helper Types ─────────────────────────────────────────────────── */

/** Internal session snapshot for projections */
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
