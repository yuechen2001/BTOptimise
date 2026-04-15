/**
 * Timeline Visualizer Service
 *
 * Core calculation functions for timeline projections:
 * - Financial snapshot projections over time
 * - Milestone detection (DIA expiry, grant tier changes)
 * - Affordability band calculations
 * - Scenario comparisons with opportunity cost analysis
 *
 * Reuses existing financial calculation functions from financialRules.service.ts
 */

import {
    CPF_OA_INTEREST_RATE,
    CPF_CONTRIBUTION_RATES,
    DEFAULT_CASH_SAVINGS_RATE,
    INCOME_GROWTH_RATES,
    AFFORDABILITY_THRESHOLDS,
    EHG_INCOME_CEILING,
    EHG_TABLE,
    BTO_LAUNCH_MONTHS,
    BTO_WAITING_PERIOD_MONTHS,
    DEFAULT_INTERVAL_MONTHS,
    FLAT_TYPE_PREFERENCES,
} from '../../constants';
import type { IUserSession } from '../userSession/userSession.model';
import {
    checkEligibility,
    calculateEHG,
    calculateMaxLoan,
    calculateFinancials,
} from '../financialRules/financialRules.service';
import type {
    TimelineProjectionConfig,
    TimelineSnapshot,
    TimelineMilestone,
    OptimalWindow,
    AffordabilityBand,
    OpportunityCostSnapshot,
    ProjectedUserSession,
    ProjectionAssumptions,
    IncomeGrowthScenario,
    MilestoneType,
} from './timeline.types';

/* ─── Helper Functions ─────────────────────────────────────────────── */

/**
 * Returns true if employment status qualifies for deferred income assessment
 */
function isDeferredIncome(employmentStatus?: string): boolean {
    return employmentStatus === 'student' || employmentStatus === 'nsf';
}

/**
 * Calculate total household income
 */
function getTotalIncome(monthlyIncome: number, partnerMonthlyIncome?: number): number {
    return monthlyIncome + (partnerMonthlyIncome || 0);
}

/**
 * Get CPF contribution rate based on age
 */
function getCPFContributionRate(age: number): number {
    if (age < 35) return CPF_CONTRIBUTION_RATES.under35;
    if (age < 45) return CPF_CONTRIBUTION_RATES.age35to45;
    if (age < 50) return CPF_CONTRIBUTION_RATES.age45to50;
    if (age < 55) return CPF_CONTRIBUTION_RATES.age50to55;
    if (age < 60) return CPF_CONTRIBUTION_RATES.age55to60;
    if (age < 65) return CPF_CONTRIBUTION_RATES.age60to65;
    return CPF_CONTRIBUTION_RATES.over65;
}

/**
 * Calculate income at a future date with growth
 */
function projectIncome(
    currentIncome: number,
    monthsFromNow: number,
    annualGrowthRate: number
): number {
    const years = monthsFromNow / 12;
    return currentIncome * Math.pow(1 + annualGrowthRate, years);
}

/**
 * Calculate CPF OA balance at a future date
 */
function projectCPFOA(
    currentCPFOA: number,
    monthlyIncome: number,
    partnerMonthlyIncome: number | undefined,
    currentAge: number,
    partnerAge: number | undefined,
    monthsFromNow: number,
    annualGrowthRate: number
): number {
    let balance = currentCPFOA;
    const monthlyInterestRate = CPF_OA_INTEREST_RATE / 12;

    for (let month = 1; month <= monthsFromNow; month++) {
        // Add interest
        balance = balance * (1 + monthlyInterestRate);

        // Calculate age at this month
        const ageAtMonth = currentAge + month / 12;
        const partnerAgeAtMonth = partnerAge ? partnerAge + month / 12 : undefined;

        // Project income for this month
        const projectedIncome = projectIncome(monthlyIncome, month, annualGrowthRate);
        const projectedPartnerIncome = partnerMonthlyIncome
            ? projectIncome(partnerMonthlyIncome, month, annualGrowthRate)
            : 0;

        // Calculate CPF contributions
        const cpfRate = getCPFContributionRate(ageAtMonth);
        const partnerCpfRate = partnerAgeAtMonth ? getCPFContributionRate(partnerAgeAtMonth) : 0;

        const cpfContribution = projectedIncome * cpfRate;
        const partnerCpfContribution = projectedPartnerIncome * partnerCpfRate;

        // Add contributions (assuming ~20% goes to OA)
        balance += (cpfContribution + partnerCpfContribution) * 0.23; // Approximate OA allocation
    }

    return Math.round(balance);
}

/**
 * Calculate cash savings at a future date
 */
function projectCashSavings(
    currentCashSavings: number,
    monthlyIncome: number,
    partnerMonthlyIncome: number | undefined,
    monthsFromNow: number,
    annualGrowthRate: number,
    savingsRate: number
): number {
    let balance = currentCashSavings;

    for (let month = 1; month <= monthsFromNow; month++) {
        const projectedIncome = projectIncome(monthlyIncome, month, annualGrowthRate);
        const projectedPartnerIncome = partnerMonthlyIncome
            ? projectIncome(partnerMonthlyIncome, month, annualGrowthRate)
            : 0;

        const totalIncome = projectedIncome + projectedPartnerIncome;
        balance += totalIncome * savingsRate;
    }

    return Math.round(balance);
}

/**
 * Get employment status at a future date (Story 1: DIA handling)
 */
function getEmploymentStatusAtDate(
    currentStatus: string | undefined,
    targetDate: Date,
    assumeEmploymentDate?: string
): string {
    if (!isDeferredIncome(currentStatus)) {
        return currentStatus || 'employed';
    }

    if (assumeEmploymentDate) {
        const employmentDate = new Date(assumeEmploymentDate);
        if (targetDate >= employmentDate) {
            return 'employed';
        }
    }

    return currentStatus!;
}

/* ─── Core Projection Functions ───────────────────────────────────── */

/**
 * Project financial snapshot at a specific future date
 * 
 * @param session - Current user session
 * @param targetDate - Date to project to
 * @param config - Timeline configuration
 * @returns Financial snapshot at target date
 */
export function projectFinancialSnapshot(
    session: IUserSession,
    targetDate: Date,
    config: TimelineProjectionConfig
): TimelineSnapshot {
    const now = new Date();
    const monthsFromNow = Math.round(
        (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    );

    // Get growth rate
    const annualGrowthRate = INCOME_GROWTH_RATES[config.incomeGrowthScenario];
    const savingsRate = config.cashSavingsRate || DEFAULT_CASH_SAVINGS_RATE;

    // Current values
    const currentIncome = session.monthlyIncome || 0;
    const currentPartnerIncome = session.partnerMonthlyIncome;
    const currentCPFOA = session.cpfOA || 0;
    const currentCashSavings = session.cashSavings || 0;
    const currentAge = session.age || 25;
    const currentPartnerAge = session.partnerAge;

    // Handle DIA transition (Story 1)
    const employmentStatusAtDate = getEmploymentStatusAtDate(
        session.employmentStatus,
        targetDate,
        config.assumeEmploymentDate
    );
    const wasDeferredNowEmployed =
        isDeferredIncome(session.employmentStatus) && employmentStatusAtDate === 'employed';

    // Project income (handle DIA transition)
    let projectedIncome = currentIncome;
    let projectedPartnerIncome = currentPartnerIncome;

    if (wasDeferredNowEmployed && config.assumedStartingSalary) {
        // Transition from student/NSF to employed
        const employmentDate = new Date(config.assumeEmploymentDate!);
        const monthsSinceEmployment = Math.round(
            (targetDate.getTime() - employmentDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
        );
        if (monthsSinceEmployment >= 0) {
            projectedIncome = projectIncome(
                config.assumedStartingSalary,
                monthsSinceEmployment,
                annualGrowthRate
            );
        } else {
            projectedIncome = 0; // Still in DIA period
        }
    } else if (!isDeferredIncome(session.employmentStatus)) {
        projectedIncome = projectIncome(currentIncome, monthsFromNow, annualGrowthRate);
        projectedPartnerIncome = currentPartnerIncome
            ? projectIncome(currentPartnerIncome, monthsFromNow, annualGrowthRate)
            : undefined;
    } else {
        // Still in DIA period
        projectedIncome = 0;
        projectedPartnerIncome = currentPartnerIncome || 0;
    }

    // Project CPF and cash
    const projectedCPFOA = projectCPFOA(
        currentCPFOA,
        currentIncome,
        currentPartnerIncome,
        currentAge,
        currentPartnerAge,
        monthsFromNow,
        annualGrowthRate
    );

    const projectedCashSavings = projectCashSavings(
        currentCashSavings,
        currentIncome,
        currentPartnerIncome,
        monthsFromNow,
        annualGrowthRate,
        savingsRate
    );

    // Project ages
    const projectedAge = currentAge + monthsFromNow / 12;
    const projectedPartnerAge = currentPartnerAge ? currentPartnerAge + monthsFromNow / 12 : undefined;

    // Create projected session for financial calculations
    const projectedSession: IUserSession = {
        ...session,
        monthlyIncome: projectedIncome,
        partnerMonthlyIncome: projectedPartnerIncome,
        cpfOA: projectedCPFOA,
        cashSavings: projectedCashSavings,
        age: Math.round(projectedAge),
        partnerAge: projectedPartnerAge ? Math.round(projectedPartnerAge) : undefined,
        employmentStatus: employmentStatusAtDate as any,
        deferredIncomeAssessment: isDeferredIncome(employmentStatusAtDate),
    } as IUserSession;

    // Calculate eligibility, grants, and max loan using existing functions
    const eligibility = checkEligibility(projectedSession);
    const grants = calculateEHG(projectedSession);
    const maxLoan = calculateMaxLoan(projectedSession);

    // Calculate affordability bands for different flat types
    const affordabilityBands = calculateAffordabilityBands(projectedSession, config);

    // Calculate opportunity cost if applicable (Story 6)
    let opportunityCost: OpportunityCostSnapshot | undefined;
    if (config.includeOpportunityCost && config.currentMonthlyRent) {
        opportunityCost = calculateOpportunityCostAtPoint(
            monthsFromNow,
            config.currentMonthlyRent,
            currentCPFOA,
            projectedCPFOA
        );
    }

    return {
        date: targetDate.toISOString(),
        monthsFromNow,
        projectedMonthlyIncome: Math.round(projectedIncome),
        projectedPartnerMonthlyIncome: projectedPartnerIncome
            ? Math.round(projectedPartnerIncome)
            : undefined,
        projectedCPFOA,
        projectedCashSavings,
        totalHouseholdIncome: Math.round(getTotalIncome(projectedIncome, projectedPartnerIncome)),
        age: Math.round(projectedAge),
        partnerAge: projectedPartnerAge ? Math.round(projectedPartnerAge) : undefined,
        employmentStatus: employmentStatusAtDate as any,
        isDeferredIncome: isDeferredIncome(employmentStatusAtDate),
        eligibility,
        grants,
        maxLoan,
        affordabilityBands,
        opportunityCost,
    };
}

/**
 * Calculate affordability bands for different flat types at a snapshot
 */
function calculateAffordabilityBands(
    projectedSession: IUserSession,
    config: TimelineProjectionConfig
): AffordabilityBand[] {
    const bands: AffordabilityBand[] = [];
    const totalIncome = getTotalIncome(
        projectedSession.monthlyIncome || 0,
        projectedSession.partnerMonthlyIncome
    );

    // Representative flat prices by type and classification
    const flatPrices: Record<string, { Standard: number; Plus: number; Prime: number }> = {
        '2-Room Flexi': { Standard: 150000, Plus: 180000, Prime: 200000 },
        '3-Room': { Standard: 250000, Plus: 300000, Prime: 350000 },
        '4-Room': { Standard: 400000, Plus: 480000, Prime: 550000 },
        '5-Room': { Standard: 500000, Plus: 600000, Prime: 680000 },
        '3Gen': { Standard: 550000, Plus: 650000, Prime: 720000 },
    };

    for (const flatType of FLAT_TYPE_PREFERENCES) {
        for (const classification of ['Standard', 'Plus', 'Prime'] as const) {
            const estimatedPrice = flatPrices[flatType][classification];

            // Calculate financials for this flat type/price
            const financials = calculateFinancials(projectedSession, estimatedPrice, flatType);

            const cashRequired = financials.cashFlow.totalCashRequired;
            const cpfRequired = financials.cashFlow.totalCPFRequired;
            const monthlyInstalment = financials.loan.monthlyInstalment;
            const cashShortfall = financials.affordability.cashShortfall;

            // Calculate buffer percentage (income remaining after MSR)
            const msrPayment = monthlyInstalment;
            const remainingIncome = totalIncome - msrPayment;
            const bufferPercentage = totalIncome > 0 ? remainingIncome / totalIncome : 0;

            // Determine affordability level
            let affordabilityLevel: 'comfortable' | 'stretch' | 'unaffordable';
            if (cashShortfall > 0 || bufferPercentage < AFFORDABILITY_THRESHOLDS.stretch) {
                affordabilityLevel = 'unaffordable';
            } else if (bufferPercentage >= AFFORDABILITY_THRESHOLDS.comfortable) {
                affordabilityLevel = 'comfortable';
            } else {
                affordabilityLevel = 'stretch';
            }

            bands.push({
                flatType,
                classification,
                priceRange: {
                    min: Math.round(estimatedPrice * 0.9),
                    max: Math.round(estimatedPrice * 1.1),
                },
                affordabilityLevel,
                cashRequired,
                cpfRequired,
                monthlyInstalment,
                cashShortfall,
                bufferPercentage: Math.round(bufferPercentage * 100) / 100,
            });
        }
    }

    return bands;
}

/**
 * Calculate opportunity cost at a specific point (Story 6)
 */
function calculateOpportunityCostAtPoint(
    monthsFromNow: number,
    monthlyRent: number,
    initialCPFOA: number,
    projectedCPFOA: number
): OpportunityCostSnapshot {
    const cumulativeRentPaid = monthsFromNow * monthlyRent;

    // CPF interest gained is the difference between projected and just the initial balance with interest
    const cpfWithoutContributions = initialCPFOA * Math.pow(1 + CPF_OA_INTEREST_RATE / 12, monthsFromNow);
    const cpfInterestGained = projectedCPFOA - cpfWithoutContributions;

    const netOpportunityCost = cumulativeRentPaid - cpfInterestGained;

    return {
        cumulativeRentPaid: Math.round(cumulativeRentPaid),
        cpfInterestGained: Math.round(cpfInterestGained),
        netOpportunityCost: Math.round(netOpportunityCost),
    };
}

/**
 * Detect important milestones in the timeline (Story 2)
 */
export function detectMilestones(
    session: IUserSession,
    snapshots: TimelineSnapshot[],
    config: TimelineProjectionConfig
): TimelineMilestone[] {
    const milestones: TimelineMilestone[] = [];

    // Story 1: DIA expiry milestone
    if (config.assumeEmploymentDate && isDeferredIncome(session.employmentStatus)) {
        const employmentDate = new Date(config.assumeEmploymentDate);
        const now = new Date();
        const monthsUntilEmployment = Math.round(
            (employmentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
        );

        milestones.push({
            date: config.assumeEmploymentDate,
            monthsFromNow: monthsUntilEmployment,
            type: 'dia_expires',
            title: 'Deferred Income Assessment Ends',
            description: `Employment begins. Income will be assessed for eligibility and grants.`,
            significance: 'critical',
            impactOnEligibility: 'Income assessment transitions from $0 to actual salary',
        });
    }

    // Story 2: Grant tier changes
    let previousGrantAmount = snapshots[0]?.grants.totalGrant || 0;
    for (const snapshot of snapshots) {
        const currentGrantAmount = snapshot.grants.totalGrant;

        if (currentGrantAmount < previousGrantAmount && currentGrantAmount > 0) {
            milestones.push({
                date: snapshot.date,
                monthsFromNow: snapshot.monthsFromNow,
                type: 'grant_tier_drop',
                title: 'Grant Amount Decreases',
                description: `EHG drops from $${previousGrantAmount.toLocaleString()} to $${currentGrantAmount.toLocaleString()} due to income increase`,
                significance: 'important',
                impactOnGrants: previousGrantAmount - currentGrantAmount,
            });
        }

        if (previousGrantAmount > 0 && currentGrantAmount === 0) {
            milestones.push({
                date: snapshot.date,
                monthsFromNow: snapshot.monthsFromNow,
                type: 'grant_disqualified',
                title: 'Grant Ceiling Exceeded',
                description: `Income exceeds $${EHG_INCOME_CEILING.toLocaleString()} ceiling. No longer eligible for EHG.`,
                significance: 'critical',
                impactOnGrants: -previousGrantAmount,
            });
        }

        previousGrantAmount = currentGrantAmount;
    }

    // BTO launch cycle milestones
    addBTOLaunchMilestones(milestones, config);

    // Sort by date
    milestones.sort((a, b) => a.monthsFromNow - b.monthsFromNow);

    return milestones;
}

/**
 * Add estimated BTO launch dates as milestones
 */
function addBTOLaunchMilestones(milestones: TimelineMilestone[], config: TimelineProjectionConfig): void {
    const startDate = new Date(config.startYear, 0, 1);
    const endDate = new Date(config.endYear, 11, 31);
    const now = new Date();

    for (let year = config.startYear; year <= config.endYear; year++) {
        for (const month of BTO_LAUNCH_MONTHS) {
            const launchDate = new Date(year, month - 1, 1);
            if (launchDate >= now && launchDate <= endDate) {
                const monthsFromNow = Math.round(
                    (launchDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
                );

                milestones.push({
                    date: launchDate.toISOString(),
                    monthsFromNow,
                    type: 'bto_launch_cycle',
                    title: `BTO Launch (Estimated)`,
                    description: `Estimated BTO launch window - ${launchDate.toLocaleDateString('en-SG', { month: 'short', year: 'numeric' })}`,
                    significance: 'informational',
                });
            }
        }
    }
}

/**
 * Identify optimal application windows (Story 2)
 */
export function identifyOptimalWindows(
    snapshots: TimelineSnapshot[],
    config: TimelineProjectionConfig
): OptimalWindow[] {
    const windows: OptimalWindow[] = [];

    // Find windows where grant is maximized
    const maxGrant = Math.max(...snapshots.map((s) => s.grants.totalGrant));

    for (let i = 0; i < snapshots.length; i++) {
        const snapshot = snapshots[i];
        const nextSnapshot = snapshots[i + 1];

        // High priority: Current grant is max, but will drop soon
        if (
            snapshot.grants.totalGrant === maxGrant &&
            nextSnapshot &&
            nextSnapshot.grants.totalGrant < maxGrant
        ) {
            windows.push({
                startDate: snapshot.date,
                endDate: nextSnapshot.date,
                reason: `Maximum grant of $${maxGrant.toLocaleString()} available. Will decrease after this period.`,
                grantAmount: maxGrant,
                priority: 'high',
                expiryWarning: `Grant will drop to $${nextSnapshot.grants.totalGrant.toLocaleString()} in ${nextSnapshot.monthsFromNow - snapshot.monthsFromNow} months`,
            });
        }

        // Critical: About to lose all grants
        if (snapshot.grants.totalGrant > 0 && nextSnapshot && nextSnapshot.grants.totalGrant === 0) {
            windows.push({
                startDate: snapshot.date,
                endDate: nextSnapshot.date,
                reason: `Last chance to receive grants before income exceeds ceiling`,
                grantAmount: snapshot.grants.totalGrant,
                priority: 'high',
                expiryWarning: `You will exceed the income ceiling and lose all grants after ${nextSnapshot.monthsFromNow} months`,
            });
        }
    }

    return windows;
}

/**
 * Generate projection assumptions used in calculations
 */
export function generateAssumptions(config: TimelineProjectionConfig): ProjectionAssumptions {
    return {
        incomeGrowthRate: INCOME_GROWTH_RATES[config.incomeGrowthScenario],
        cpfOAInterestRate: CPF_OA_INTEREST_RATE,
        cpfContributionRate: config.cpfContributionRate || getCPFContributionRate(30), // Default to under-35 rate
        cashSavingsRate: config.cashSavingsRate || DEFAULT_CASH_SAVINGS_RATE,
        rentInflationRate: 0.02, // 2% p.a. rent inflation
    };
}

/* ─── Scenario Comparison (Story 6) ───────────────────────────────── */

/**
 * Compare different application timing strategies
 * 
 * @param session - Current user session
 * @param config - Timeline configuration
 * @param snapshots - Pre-calculated snapshots
 * @returns Array of scenario comparisons for now, 6m, 12m, 24m
 */
export function compareScenarios(
    session: IUserSession,
    config: TimelineProjectionConfig,
    snapshots: TimelineSnapshot[]
): import('./timeline.types').ScenarioComparison[] {
    const scenarios: import('./timeline.types').ScenarioComparison[] = [];
    const waitPeriods = [0, 6, 12, 24]; // now, 6m, 12m, 24m
    const strategyNames: Record<number, string> = {
        0: 'Apply Now',
        6: 'Wait 6 Months',
        12: 'Wait 12 Months',
        24: 'Wait 24 Months',
    };
    const strategyKeys: Record<number, import('./timeline.types').ComparisonStrategy> = {
        0: 'apply_now',
        6: 'wait_6m',
        12: 'wait_12m',
        24: 'wait_24m',
    };

    // Use representative 4-room flat price for comparison
    const representativePrice = 400000;
    const representativeFlatType = '4-Room';

    for (const waitMonths of waitPeriods) {
        // Find the snapshot closest to this wait period
        const snapshot = snapshots.find((s) => s.monthsFromNow >= waitMonths) || snapshots[0];
        if (!snapshot) continue;

        const applicationDate = new Date(snapshot.date);

        // Calculate key collection date (BTO waiting period)
        const keyCollectionDate = new Date(applicationDate);
        keyCollectionDate.setMonth(keyCollectionDate.getMonth() + BTO_WAITING_PERIOD_MONTHS);

        // Get grants at application time
        const totalGrantsReceived = snapshot.grants.totalGrant;

        // Calculate financials at application time
        const projectedSession: IUserSession = {
            ...session,
            monthlyIncome: snapshot.projectedMonthlyIncome,
            partnerMonthlyIncome: snapshot.projectedPartnerMonthlyIncome,
            cpfOA: snapshot.projectedCPFOA,
            cashSavings: snapshot.projectedCashSavings,
            age: snapshot.age,
            partnerAge: snapshot.partnerAge,
        } as IUserSession;

        const financials = calculateFinancials(projectedSession, representativePrice, representativeFlatType);

        const totalCashRequired = financials.cashFlow.totalCashRequired;
        const monthlyInstalment = financials.loan.monthlyInstalment;

        // Calculate total interest over 25 years
        const totalInterestPaid = monthlyInstalment * 25 * 12 - financials.loan.maxLoanAmount;

        // Opportunity cost calculations (Story 6)
        const rentPaidBeforePurchase = config.currentMonthlyRent
            ? Math.round(waitMonths * config.currentMonthlyRent)
            : 0;

        const cpfInterestGainedFromWaiting = snapshot.opportunityCost?.cpfInterestGained || 0;
        const netOpportunityCost = rentPaidBeforePurchase - cpfInterestGainedFromWaiting;

        // Affordability level
        const affordabilityBand = snapshot.affordabilityBands.find(
            (b) => b.flatType === representativeFlatType && b.classification === 'Standard'
        );
        const affordabilityLevel = affordabilityBand?.affordabilityLevel || 'unaffordable';
        const cashShortfall = financials.affordability.cashShortfall;

        scenarios.push({
            scenarioName: strategyNames[waitMonths],
            strategy: strategyKeys[waitMonths],
            applicationDate: applicationDate.toISOString(),
            totalGrantsReceived,
            totalCashRequired,
            monthlyInstalment,
            totalInterestPaid: Math.round(totalInterestPaid),
            rentPaidBeforePurchase,
            cpfInterestGainedFromWaiting,
            netOpportunityCost,
            keyCollectionDate: keyCollectionDate.toISOString(),
            affordabilityLevel,
            cashShortfall,
        });
    }

    return scenarios;
}

/**
 * Determine the optimal scenario based on grants and affordability
 */
export function recommendOptimalScenario(
    scenarios: import('./timeline.types').ScenarioComparison[]
): { bestScenario: string; reason: string; netAdvantage: number } {
    // Filter to only affordable scenarios
    const affordableScenarios = scenarios.filter((s) => s.affordabilityLevel !== 'unaffordable');

    if (affordableScenarios.length === 0) {
        return {
            bestScenario: 'None - Save more before applying',
            reason: 'Currently cannot afford any scenario. Continue saving.',
            netAdvantage: 0,
        };
    }

    // Find scenario with maximum grants that's still affordable
    const bestByGrants = affordableScenarios.reduce((best, current) => {
        return current.totalGrantsReceived > best.totalGrantsReceived ? current : best;
    });

    // Calculate net advantage (grants - opportunity cost)
    const netAdvantages = affordableScenarios.map((s) => ({
        scenario: s,
        netValue: s.totalGrantsReceived - s.netOpportunityCost,
    }));

    const bestNetValue = netAdvantages.reduce((best, current) => {
        return current.netValue > best.netValue ? current : best;
    });

    const reasons: string[] = [];
    if (bestByGrants.scenarioName === bestNetValue.scenario.scenarioName) {
        reasons.push(`Maximizes grants at $${bestByGrants.totalGrantsReceived.toLocaleString()}`);
        if (bestByGrants.netOpportunityCost > 0) {
            reasons.push(
                `Net opportunity cost of $${bestByGrants.netOpportunityCost.toLocaleString()} (rent exceeds CPF interest gained)`
            );
        }
    } else {
        reasons.push(
            `Best balance between grants ($${bestNetValue.scenario.totalGrantsReceived.toLocaleString()}) and opportunity cost`
        );
    }

    // Compare to worst scenario
    const worstNetValue = netAdvantages.reduce((worst, current) => {
        return current.netValue < worst.netValue ? current : worst;
    });
    const netAdvantage = bestNetValue.netValue - worstNetValue.netValue;

    return {
        bestScenario: bestNetValue.scenario.scenarioName,
        reason: reasons.join('. '),
        netAdvantage: Math.round(netAdvantage),
    };
}
