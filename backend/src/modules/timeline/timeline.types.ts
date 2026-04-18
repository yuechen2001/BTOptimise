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

export type IncomeGrowthScenario = 'conservative' | 'moderate' | 'aggressive';

export type PropertyType = 'BTO' | 'Resale' | 'EC';

export type ComparisonStrategy = 'apply_now' | 'wait_6m' | 'wait_12m' | 'wait_24m' | 'custom';

export type ProjectClassification = 'Standard' | 'Plus' | 'Prime';

export interface TimelineProjectionConfig {
    startYear: number;
    endYear: number;
    intervalMonths: number; // 3, 6, or 12
    incomeGrowthScenario: IncomeGrowthScenario;

    /* Deferred Income Assessment handling */
    assumeEmploymentDate?: string; 
    assumedStartingSalary?: number;

    /* Wait-and-see opportunity cost inputs */
    currentMonthlyRent?: number; 
    includeOpportunityCost?: boolean; // Whether to calculate rent vs CPF growth

    /* Optional overrides */
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
    cashRequired: number;
    cpfRequired: number;
    monthlyInstalment: number;
    cashShortfall: number; // 0 if affordable
    bufferPercentage: number; // % income remaining after MSR
}

/** Opportunity cost tracking (Story 6) */
export interface OpportunityCostSnapshot {
    cumulativeRentPaid: number;
    cpfInterestGained: number;
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
    impactOnGrants?: number;
    impactOnEligibility?: string;

    /* Project-specific data */
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
