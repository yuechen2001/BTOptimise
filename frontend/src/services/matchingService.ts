/**
 * Matching & Recommendation Service
 *
 * Bridges the user profile and project catalogue.
 * Calls the Financial Rules Service to compute purchasing power,
 * queries the catalogue for eligible projects, and applies
 * the Green / Yellow / Red classification.
 */

import type { UserProfile, FlatTypePreference, AffordabilityResult } from '../types';
import { projectCatalogue } from '../data/projects';
import {
    computeEHG,
    computeMaxLoan,
    computeMilestones,
    computeClawback,
    checkIncomeEligibility,
    checkFlatTypeEligibility,
} from './financialRules';

/* ================================================================== */
/*  CLASSIFICATION LOGIC                                               */
/* ================================================================== */

/**
 * Green  – Fully affordable: user's CPF + cash covers all upfront milestones,
 *          and monthly loan instalment is within MSR.
 * Yellow – Stretch: user can cover the downpayment but has limited buffer
 *          (< 20 % surplus), or MSR usage is between 25–30 %.
 * Red    – Out of reach: insufficient funds for downpayment or MSR exceeded.
 */
function classify(
    totalCashNeeded: number,
    totalCpfNeeded: number,
    cashAvailable: number,
    cpfAvailable: number,
    msrUsed: number
): { classification: 'green' | 'yellow' | 'red'; reason: string } {
    const cashShortfall = totalCashNeeded - cashAvailable;
    const cpfShortfall = totalCpfNeeded - cpfAvailable;

    // Red: can't cover upfront costs
    if (cashShortfall > 0 && cpfShortfall > 0) {
        return {
            classification: 'red',
            reason: `Cash shortfall of $${Math.round(cashShortfall).toLocaleString()} and CPF shortfall of $${Math.round(cpfShortfall).toLocaleString()}.`,
        };
    }
    if (cashShortfall > 0) {
        return {
            classification: 'red',
            reason: `Cash shortfall of $${Math.round(cashShortfall).toLocaleString()} for upfront payments.`,
        };
    }

    // Red: MSR exceeded
    if (msrUsed > 0.3) {
        return {
            classification: 'red',
            reason: `Loan instalment exceeds 30% MSR (${(msrUsed * 100).toFixed(1)}%).`,
        };
    }

    // Yellow: tight but feasible
    const cashBuffer = (cashAvailable - totalCashNeeded) / totalCashNeeded;
    if (cashBuffer < 0.2 || msrUsed > 0.25) {
        const reasons: string[] = [];
        if (cashBuffer < 0.2) reasons.push(`Cash buffer is only ${(cashBuffer * 100).toFixed(0)}%`);
        if (msrUsed > 0.25) reasons.push(`MSR usage at ${(msrUsed * 100).toFixed(1)}%`);
        return {
            classification: 'yellow',
            reason: reasons.join('. ') + '.',
        };
    }

    // Green: comfortably affordable
    return {
        classification: 'green',
        reason: 'Comfortably within budget with healthy cash buffer.',
    };
}

/* ================================================================== */
/*  MAIN MATCHING FUNCTION                                             */
/* ================================================================== */

export interface MatchOptions {
    /** If provided, only evaluate these projects */
    projectIds?: string[];
    /** If provided, only evaluate these flat types */
    flatTypes?: FlatTypePreference[];
}

/**
 * For a given user profile, evaluate every eligible project + flat-type
 * combination and return affordability results sorted by classification
 * (green first, then yellow, then red).
 */
export function matchProjects(profile: UserProfile, options?: MatchOptions): AffordabilityResult[] {
    const results: AffordabilityResult[] = [];

    // Pre-compute user-level financials
    const incomeCheck = checkIncomeEligibility(profile);
    if (!incomeCheck.eligible) {
        // Return empty — user doesn't meet BTO income ceiling
        return results;
    }

    const grant = computeEHG(profile);
    const maxLoan = computeMaxLoan(profile);
    const grossIncome = profile.monthlyIncome + (profile.partnerMonthlyIncome ?? 0);

    // Filter catalogue
    let catalogue = projectCatalogue;
    if (options?.projectIds) {
        catalogue = catalogue.filter((p) => options.projectIds!.includes(p.id));
    }

    for (const project of catalogue) {
        // Region filter
        if (
            profile.preferredRegions.length > 0 &&
            !profile.preferredRegions.includes(project.estate)
        ) {
            continue;
        }

        for (const flatOpt of project.flatOptions) {
            // Flat-type preference filter
            if (
                profile.preferredFlatTypes.length > 0 &&
                !profile.preferredFlatTypes.includes(flatOpt.type)
            ) {
                continue;
            }
            if (options?.flatTypes && !options.flatTypes.includes(flatOpt.type)) {
                continue;
            }

            // Eligibility check
            if (!checkFlatTypeEligibility(profile, flatOpt.type)) {
                continue;
            }

            // Use mid-point price
            const indicativePrice = Math.round((flatOpt.priceMin + flatOpt.priceMax) / 2);
            const effectivePrice = indicativePrice - grant.totalGrant;

            // Milestone cash flow
            const milestones = computeMilestones(indicativePrice, grant.totalGrant, profile.cpfOA);

            // Totals from milestones
            const totalCashNeeded = milestones.reduce((s, m) => s + m.cashRequired, 0);
            const totalCpfNeeded = milestones.reduce((s, m) => s + m.cpfUsable, 0);

            // Loan computation for the remaining 80 %
            const loanAmount = Math.round(effectivePrice * 0.8);
            const cappedLoan = Math.min(loanAmount, maxLoan.maxLoanAmount);
            const r = 0.026 / 12;
            const n = 25 * 12;
            const monthlyPmt =
                cappedLoan > 0
                    ? (cappedLoan * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1)
                    : 0;
            const msrUsed = grossIncome > 0 ? monthlyPmt / grossIncome : 0;

            // Classification
            const { classification, reason } = classify(
                totalCashNeeded,
                totalCpfNeeded,
                profile.cashSavings,
                profile.cpfOA,
                msrUsed
            );

            // Clawback
            const clawbackEstimate = computeClawback(project, indicativePrice);

            results.push({
                project,
                selectedFlatType: flatOpt.type,
                indicativePrice,
                grant,
                loan: {
                    maxLoanAmount: cappedLoan,
                    monthlyInstalment: Math.round(monthlyPmt),
                    loanTenureYears: 25,
                    interestRate: 0.026,
                    msrUsed,
                },
                effectivePrice,
                milestones,
                totalCashNeeded,
                totalCpfNeeded,
                clawbackEstimate,
                classification,
                classificationReason: reason,
            });
        }
    }

    // Sort: green → yellow → red, then by effective price ascending
    const order = { green: 0, yellow: 1, red: 2 };
    results.sort((a, b) => {
        const diff = order[a.classification] - order[b.classification];
        if (diff !== 0) return diff;
        return a.effectivePrice - b.effectivePrice;
    });

    return results;
}
