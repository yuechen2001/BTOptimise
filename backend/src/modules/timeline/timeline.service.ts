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
    AffordabilityBand,
    OpportunityCostSnapshot,
    ProjectedUserSession,
    ProjectionAssumptions,
    IncomeGrowthScenario,
    MilestoneType,
} from './timeline.types';

/* ─── Helper Functions ─────────────────────────────────────────────── */
function isDeferredIncome(employmentStatus?: string): boolean {
    return employmentStatus === 'student' || employmentStatus === 'nsf';
}

function getTotalIncome(monthlyIncome: number, partnerMonthlyIncome?: number): number {
    return monthlyIncome + (partnerMonthlyIncome || 0);
}

function getCPFContributionRate(age: number): number {
    if (age < 35) return CPF_CONTRIBUTION_RATES.under35;
    if (age < 45) return CPF_CONTRIBUTION_RATES.age35to45;
    if (age < 50) return CPF_CONTRIBUTION_RATES.age45to50;
    if (age < 55) return CPF_CONTRIBUTION_RATES.age50to55;
    if (age < 60) return CPF_CONTRIBUTION_RATES.age55to60;
    if (age < 65) return CPF_CONTRIBUTION_RATES.age60to65;
    return CPF_CONTRIBUTION_RATES.over65;
}

function projectIncome(
    currentIncome: number,
    monthsFromNow: number,
    annualGrowthRate: number
): number {
    const years = monthsFromNow / 12;
    return currentIncome * Math.pow(1 + annualGrowthRate, years);
}

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

        const ageAtMonth = currentAge + month / 12;
        const partnerAgeAtMonth = partnerAge ? partnerAge + month / 12 : undefined;

        const projectedIncome = projectIncome(monthlyIncome, month, annualGrowthRate);
        const projectedPartnerIncome = partnerMonthlyIncome
            ? projectIncome(partnerMonthlyIncome, month, annualGrowthRate)
            : 0;

        const cpfRate = getCPFContributionRate(ageAtMonth);
        const partnerCpfRate = partnerAgeAtMonth ? getCPFContributionRate(partnerAgeAtMonth) : 0;

        const cpfContribution = projectedIncome * cpfRate;
        const partnerCpfContribution = projectedPartnerIncome * partnerCpfRate;

        // Add contributions (assuming ~20% goes to OA)
        balance += (cpfContribution + partnerCpfContribution) * 0.23; // Approximate OA allocation
    }

    return Math.round(balance);
}

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

    const employmentStatusAtDate = getEmploymentStatusAtDate(
        session.employmentStatus,
        targetDate,
        config.assumeEmploymentDate
    );
    const wasDeferredNowEmployed =
        isDeferredIncome(session.employmentStatus) && employmentStatusAtDate === 'employed';

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

    const projectedAge = currentAge + monthsFromNow / 12;
    const projectedPartnerAge = currentPartnerAge
        ? currentPartnerAge + monthsFromNow / 12
        : undefined;

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

    const eligibility = checkEligibility(projectedSession);
    const grants = calculateEHG(projectedSession);
    const maxLoan = calculateMaxLoan(projectedSession);

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

            const financials = calculateFinancials(projectedSession, estimatedPrice, flatType);

            const cashRequired = financials.cashFlow.totalCashRequired;
            const cpfRequired = financials.cashFlow.totalCPFRequired;
            const monthlyInstalment = financials.loan.monthlyInstalment;
            const cashShortfall = financials.affordability.cashShortfall;

            // Calculate buffer percentage (income remaining after MSR)
            const msrPayment = monthlyInstalment;
            const remainingIncome = totalIncome - msrPayment;
            const bufferPercentage = totalIncome > 0 ? remainingIncome / totalIncome : 0;

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

function calculateOpportunityCostAtPoint(
    monthsFromNow: number,
    monthlyRent: number,
    initialCPFOA: number,
    projectedCPFOA: number
): OpportunityCostSnapshot {
    const cumulativeRentPaid = monthsFromNow * monthlyRent;

    // CPF interest gained is the difference between projected and just the initial balance with interest
    const cpfWithoutContributions =
        initialCPFOA * Math.pow(1 + CPF_OA_INTEREST_RATE / 12, monthsFromNow);
    const cpfInterestGained = projectedCPFOA - cpfWithoutContributions;

    const netOpportunityCost = cumulativeRentPaid - cpfInterestGained;

    return {
        cumulativeRentPaid: Math.round(cumulativeRentPaid),
        cpfInterestGained: Math.round(cpfInterestGained),
        netOpportunityCost: Math.round(netOpportunityCost),
    };
}

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

function addBTOLaunchMilestones(
    milestones: TimelineMilestone[],
    config: TimelineProjectionConfig
): void {
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

export function generateAssumptions(config: TimelineProjectionConfig): ProjectionAssumptions {
    return {
        incomeGrowthRate: INCOME_GROWTH_RATES[config.incomeGrowthScenario],
        cpfOAInterestRate: CPF_OA_INTEREST_RATE,
        cpfContributionRate: config.cpfContributionRate || getCPFContributionRate(30), 
        cashSavingsRate: config.cashSavingsRate || DEFAULT_CASH_SAVINGS_RATE,
        rentInflationRate: 0.02,
    };
}

/* ─── Project Timeline Generation ──────────────────────────────────── */
function parseEstimatedLaunchDate(estimatedDate?: string): Date {
    if (!estimatedDate) {
        // Default to 3 months from now
        const defaultDate = new Date();
        defaultDate.setMonth(defaultDate.getMonth() + 3);
        return defaultDate;
    }

    const isoDate = new Date(estimatedDate);
    if (!isNaN(isoDate.getTime())) {
        return isoDate;
    }

    const quarterMatch = estimatedDate.match(/Q([1-4])\s+(\d{4})/i);
    if (quarterMatch) {
        const quarter = parseInt(quarterMatch[1]);
        const year = parseInt(quarterMatch[2]);
        const month = (quarter - 1) * 3; // Q1=0, Q2=3, Q3=6, Q4=9
        return new Date(year, month, 15); // Middle of first month of quarter
    }

    const fallbackDate = new Date();
    fallbackDate.setMonth(fallbackDate.getMonth() + 3);
    return fallbackDate;
}

export function generateProjectTimeline(
    session: IUserSession,
    project: import('./timeline.types').ProjectTimelineRequest,
    config: TimelineProjectionConfig,
    snapshots: TimelineSnapshot[]
): import('./timeline.types').ProjectTimeline {
    const milestones: TimelineMilestone[] = [];
    const now = new Date();

    const launchDate = parseEstimatedLaunchDate(project.estimatedLaunchDate);
    const launchMonthsFromNow = Math.round(
        (launchDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    );

    milestones.push({
        date: launchDate.toISOString(),
        monthsFromNow: launchMonthsFromNow,
        type: 'bto_launch',
        title: `${project.projectName} Launch`,
        description: `Application window opens for ${project.flatType} units`,
        significance: 'important',
        projectId: project.projectId,
    });

    const launchSnapshot = findSnapshotByDate(snapshots, launchDate);

    if (launchSnapshot) {
        const financials = calculateFinancials(
            {
                ...session,
                monthlyIncome: launchSnapshot.projectedMonthlyIncome,
                partnerMonthlyIncome: launchSnapshot.projectedPartnerMonthlyIncome,
                cpfOA: launchSnapshot.projectedCPFOA,
                cashSavings: launchSnapshot.projectedCashSavings,
                age: launchSnapshot.age,
                partnerAge: launchSnapshot.partnerAge,
            } as IUserSession,
            project.price,
            project.flatType
        );

        const optionFeeDate = new Date(launchDate);
        optionFeeDate.setDate(optionFeeDate.getDate() + 7);
        const optionFeeAmount = financials.cashFlow.milestones[0]?.amountCash || 2000;
        const optionFeeMonthsFromNow = Math.round(
            (optionFeeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
        );
        const optionFeeSnapshot = findSnapshotByDate(snapshots, optionFeeDate);
        const canAffordOption = optionFeeSnapshot
            ? optionFeeSnapshot.projectedCashSavings >= optionFeeAmount
            : false;

        milestones.push({
            date: optionFeeDate.toISOString(),
            monthsFromNow: optionFeeMonthsFromNow,
            type: 'option_fee_due',
            title: 'Option Fee Due',
            description: 'Cash payment required after successful ballot',
            significance: 'important',
            projectId: project.projectId,
            paymentAmount: optionFeeAmount,
            cashAmount: optionFeeAmount,
            cpfAmount: 0,
            canAfford: canAffordOption,
        });

        const signingDate = new Date(launchDate);
        signingDate.setMonth(signingDate.getMonth() + 4);
        const signingMonthsFromNow = Math.round(
            (signingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
        );
        const signingSnapshot = findSnapshotByDate(snapshots, signingDate);
        const signingMilestone = financials.cashFlow.milestones[1];
        const canAffordSigning = signingSnapshot
            ? signingSnapshot.projectedCashSavings >= signingMilestone.amountCash &&
              signingSnapshot.projectedCPFOA >= signingMilestone.amountCPF
            : false;

        milestones.push({
            date: signingDate.toISOString(),
            monthsFromNow: signingMonthsFromNow,
            type: 'signing_payment_due',
            title: 'Signing Payment Due',
            description: `${signingMilestone.cumulativeCPF + signingMilestone.cumulativeCash > 0 ? '5-10%' : ''} downpayment at signing`,
            significance: 'important',
            projectId: project.projectId,
            paymentAmount: signingMilestone.amountCash + signingMilestone.amountCPF,
            cashAmount: signingMilestone.amountCash,
            cpfAmount: signingMilestone.amountCPF,
            canAfford: canAffordSigning,
        });

        const keyDate = new Date(launchDate);
        keyDate.setFullYear(keyDate.getFullYear() + 4);
        const keyMonthsFromNow = Math.round(
            (keyDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
        );
        const keySnapshot = findSnapshotByDate(snapshots, keyDate);
        const keyMilestone = financials.cashFlow.milestones[2];
        const canAffordKey = keySnapshot
            ? keySnapshot.projectedCashSavings >= keyMilestone.cumulativeCash &&
              keySnapshot.projectedCPFOA >= keyMilestone.cumulativeCPF
            : false;

        milestones.push({
            date: keyDate.toISOString(),
            monthsFromNow: keyMonthsFromNow,
            type: 'key_collection_payment_due',
            title: 'Key Collection Payment',
            description: 'Final downpayment + stamp duty + legal fees',
            significance: 'important',
            projectId: project.projectId,
            paymentAmount: keyMilestone.amountCash + keyMilestone.amountCPF,
            cashAmount: keyMilestone.amountCash,
            cpfAmount: keyMilestone.amountCPF,
            canAfford: canAffordKey,
        });

        const savingsMilestones = detectSavingsMilestones(
            project,
            snapshots,
            financials.cashFlow.totalCashRequired,
            financials.cashFlow.totalCashRequired + financials.cashFlow.totalCPFRequired,
            financials.loan.monthlyInstalment
        );
        milestones.push(...savingsMilestones);

        return {
            project,
            milestones,
            affordability: {
                canAffordOptionFee: canAffordOption,
                canAffordSigning: canAffordSigning,
                canAffordKeyCollection: canAffordKey,
                cashShortfall: Math.max(
                    0,
                    financials.cashFlow.totalCashRequired -
                        (launchSnapshot.projectedCashSavings || 0)
                ),
                optionFeeShortfall: Math.max(
                    0,
                    optionFeeAmount - (optionFeeSnapshot?.projectedCashSavings || 0)
                ),
                signingShortfall: Math.max(
                    0,
                    signingMilestone.cumulativeCash - (signingSnapshot?.projectedCashSavings || 0)
                ),
                keyCollectionShortfall: Math.max(
                    0,
                    keyMilestone.cumulativeCash - (keySnapshot?.projectedCashSavings || 0)
                ),
            },
        };
    }

    // Fallback if no snapshot found
    return {
        project,
        milestones,
        affordability: {
            canAffordOptionFee: false,
            canAffordSigning: false,
            canAffordKeyCollection: false,
            cashShortfall: 0,
            optionFeeShortfall: 0,
            signingShortfall: 0,
            keyCollectionShortfall: 0,
        },
    };
}

function findSnapshotByDate(
    snapshots: TimelineSnapshot[],
    targetDate: Date
): TimelineSnapshot | null {
    if (snapshots.length === 0) return null;

    return snapshots.reduce((closest, snapshot) => {
        const snapshotDate = new Date(snapshot.date);
        const closestDate = new Date(closest.date);
        const targetTime = targetDate.getTime();

        const snapshotDiff = Math.abs(snapshotDate.getTime() - targetTime);
        const closestDiff = Math.abs(closestDate.getTime() - targetTime);

        return snapshotDiff < closestDiff ? snapshot : closest;
    });
}

/**
 * Detect when user has saved enough for each milestone
 */
function detectSavingsMilestones(
    project: import('./timeline.types').ProjectTimelineRequest,
    snapshots: TimelineSnapshot[],
    optionFeeAmount: number,
    totalDownpayment: number,
    monthlyLoanPayment: number
): TimelineMilestone[] {
    const milestones: TimelineMilestone[] = [];
    const now = new Date();

    const optionFeeReadySnapshot = snapshots.find((s) => s.projectedCashSavings >= optionFeeAmount);
    if (optionFeeReadySnapshot) {
        milestones.push({
            date: optionFeeReadySnapshot.date,
            monthsFromNow: optionFeeReadySnapshot.monthsFromNow,
            type: 'cash_ready_option_fee',
            title: 'Cash Ready for Option Fee',
            description: `Saved enough cash ($${optionFeeAmount.toLocaleString()}) for option fee`,
            significance: 'informational',
            projectId: project.projectId,
            canAfford: true,
        });
    }

    const downpaymentReadySnapshot = snapshots.find(
        (s) => s.projectedCPFOA + s.projectedCashSavings >= totalDownpayment
    );
    if (downpaymentReadySnapshot) {
        milestones.push({
            date: downpaymentReadySnapshot.date,
            monthsFromNow: downpaymentReadySnapshot.monthsFromNow,
            type: 'downpayment_saved',
            title: 'Downpayment Fully Saved',
            description: `Total savings (CPF + cash) cover full downpayment`,
            significance: 'informational',
            projectId: project.projectId,
            canAfford: true,
        });
    }

    // Find when income supports monthly payment (MSR 30%)
    const affordableSnapshot = snapshots.find(
        (s) => s.totalHouseholdIncome * 0.3 >= monthlyLoanPayment
    );
    if (affordableSnapshot) {
        milestones.push({
            date: affordableSnapshot.date,
            monthsFromNow: affordableSnapshot.monthsFromNow,
            type: 'monthly_payment_affordable',
            title: 'Monthly Payments Affordable',
            description: `Income sufficient for loan repayment ($${monthlyLoanPayment.toLocaleString()}/month)`,
            significance: 'informational',
            projectId: project.projectId,
            canAfford: true,
        });
    }

    return milestones;
}
