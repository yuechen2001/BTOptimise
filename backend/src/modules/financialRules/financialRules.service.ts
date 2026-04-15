/**
 * Financial Rules Service
 *
 * Core calculation functions for HDB policy logic:
 * - Enhanced CPF Housing Grant (EHG)
 * - Maximum HDB loan via Mortgage Servicing Ratio (MSR)
 * - Milestone cash flow at each BTO payment stage
 * - Subsidy clawback projection for Plus and Prime flats
 * - Eligibility checks for BTO purchase
 */

import {
    HDB_LOAN_INTEREST_RATE,
    MAX_MSR,
    HDB_LTV_RATIO,
    MAX_LOAN_TENURE_YEARS,
    EHG_INCOME_CEILING,
    INCOME_CEILING_COUPLE,
    INCOME_CEILING_SINGLE,
    EHG_TABLE,
    OPTION_FEE_BY_FLAT_TYPE,
    PLUS_FLAT_LOCK_IN_YEARS,
    PRIME_FLAT_LOCK_IN_YEARS,
} from '../../constants';
import type { IUserSession } from '../userSession/userSession.model';

/* ─── Types ────────────────────────────────────────────────────────── */

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

export interface AffordabilityResult {
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

export interface ClawbackResult {
    subsidy: number;
    clawbackAmount: number;
    netProceeds: number;
    effectivePrice: number;
}

export interface FinancialCalculationResult {
    eligibility: EligibilityResult;
    grants: GrantResult;
    loan: LoanResult;
    cashFlow: CashFlowResult;
    affordability: AffordabilityResult;
}

/* ─── Helper Functions ─────────────────────────────────────────────── */

/**
 * Returns true if the employment status qualifies for deferred income assessment.
 */
function isDeferredIncome(employmentStatus?: string): boolean {
    return employmentStatus === 'student' || employmentStatus === 'nsf';
}

/**
 * Calculate total household income from session.
 */
function getTotalIncome(session: IUserSession): number {
    return (session.monthlyIncome || 0) + (session.partnerMonthlyIncome || 0);
}

/* ─── Eligibility Check ────────────────────────────────────────────── */

/**
 * Checks BTO eligibility based on citizenship, income ceiling, and first-timer status.
 *
 * @param session - User session with profile data
 * @param flatType - Desired flat type (optional)
 * @returns Eligibility result with reasons
 */
export function checkEligibility(session: IUserSession, flatType?: string): EligibilityResult {
    const reasons: string[] = [];
    let canPurchase = true;
    let incomeCeilingCheck = false;
    const deferredIncomeAssessment = session.deferredIncomeAssessment;

    // Citizenship check
    if (!session.citizenship) {
        reasons.push('Citizenship status not provided');
        canPurchase = false;
    } else if (
        session.applicantType === 'couple' &&
        !['SC/SC', 'SC/PR'].includes(session.citizenship)
    ) {
        reasons.push('At least one Singapore Citizen required');
        canPurchase = false;
    }

    // Income ceiling check (skip if deferred assessment)
    if (!deferredIncomeAssessment) {
        const totalIncome = getTotalIncome(session);
        const isCouple = session.applicantType === 'couple';
        const is2Room = flatType === '2-Room Flexi';

        if (isCouple && totalIncome > INCOME_CEILING_COUPLE) {
            reasons.push(
                `Household income $${totalIncome.toLocaleString()} exceeds couple ceiling of $${INCOME_CEILING_COUPLE.toLocaleString()}`
            );
            canPurchase = false;
        } else if (!isCouple && is2Room && totalIncome > INCOME_CEILING_SINGLE) {
            reasons.push(
                `Income $${totalIncome.toLocaleString()} exceeds single ceiling of $${INCOME_CEILING_SINGLE.toLocaleString()}`
            );
            canPurchase = false;
        } else {
            incomeCeilingCheck = true;
        }
    } else {
        reasons.push('Income assessment deferred (student/NSF)');
        incomeCeilingCheck = true; // Will be assessed later
    }

    if (canPurchase && incomeCeilingCheck) {
        reasons.push('Eligible for BTO purchase');
    }

    return {
        canPurchaseBTO: canPurchase,
        reasons,
        incomeCeilingCheck,
        deferredIncomeAssessment,
    };
}

/* ─── EHG Calculation ──────────────────────────────────────────────── */

/**
 * Calculates the Enhanced CPF Housing Grant (EHG) quantum based on household income.
 * For students/NSF, assumes $0 income per deferred assessment policy.
 *
 * @param session - User session with financials
 * @returns Grant calculation result with breakdown
 */
export function calculateEHG(session: IUserSession): GrantResult {
    const breakdown: string[] = [];
    const totalIncome = getTotalIncome(session);

    // Check first-timer eligibility
    if (!session.firstTimer) {
        breakdown.push('Not a first-timer — EHG not applicable');
        return { ehgAmount: 0, proximityGrant: 0, totalGrant: 0, breakdown };
    }

    // Student/NSF deferred assessment: use $0 income → max grant
    const assessedIncome = isDeferredIncome(session.employmentStatus) ? 0 : totalIncome;

    let ehgAmount = 0;
    for (const [ceiling, amount] of EHG_TABLE) {
        if (assessedIncome <= ceiling) {
            ehgAmount = amount;
            break;
        }
    }

    if (ehgAmount === 0 && assessedIncome > EHG_INCOME_CEILING) {
        breakdown.push(
            `Household income $${assessedIncome.toLocaleString()} exceeds EHG ceiling of $${EHG_INCOME_CEILING.toLocaleString()}`
        );
    } else if (ehgAmount > 0) {
        breakdown.push(
            `EHG quantum: $${ehgAmount.toLocaleString()} (assessed income $${assessedIncome.toLocaleString()}/month)`
        );
        if (assessedIncome === 0) {
            breakdown.push('Income assessment deferred - using maximum grant');
        }
    }

    // Proximity Housing Grant (simplified - would need parent location data for real calculation)
    let proximityGrant = 0;
    if (session.citizenship === 'SC/SC' && session.applicantType === 'couple') {
        proximityGrant = 30000;
        breakdown.push('Proximity Housing Grant: $30,000 (SC/SC couple - estimated)');
    } else if (session.citizenship === 'SC/PR' && session.applicantType === 'couple') {
        proximityGrant = 20000;
        breakdown.push('Proximity Housing Grant: $20,000 (SC/PR couple - estimated)');
    }

    return {
        ehgAmount,
        proximityGrant,
        totalGrant: ehgAmount + proximityGrant,
        breakdown,
    };
}

/* ─── Loan Calculation ─────────────────────────────────────────────── */

/**
 * Calculates maximum HDB loan based on Mortgage Servicing Ratio (MSR).
 * Uses present value of annuity formula.
 *
 * @param session - User session with income data
 * @returns Maximum loan calculation with monthly instalment
 */
export function calculateMaxLoan(session: IUserSession): LoanResult {
    const totalIncome = getTotalIncome(session);
    const maxMonthlyInstalment = totalIncome * MAX_MSR;

    // Monthly interest rate
    const r = HDB_LOAN_INTEREST_RATE / 12;
    const n = MAX_LOAN_TENURE_YEARS * 12;

    // Present value of annuity: P = PMT × [(1 - (1+r)^-n) / r]
    const maxLoanAmount = maxMonthlyInstalment * ((1 - Math.pow(1 + r, -n)) / r);

    return {
        maxLoanAmount: Math.round(maxLoanAmount),
        monthlyInstalment: Math.round(maxMonthlyInstalment),
        loanTenureYears: MAX_LOAN_TENURE_YEARS,
        interestRate: HDB_LOAN_INTEREST_RATE,
        msrUsed: MAX_MSR,
    };
}

/**
 * Calculates actual loan amount for a specific flat, considering LTV and MSR limits.
 *
 * @param session - User session with financials
 * @param flatPrice - Price of the flat
 * @param grantAmount - Total grants to deduct
 * @param downpayment - Downpayment amount (cash + CPF)
 * @returns Actual loan calculation
 */
export function calculateActualLoan(
    session: IUserSession,
    flatPrice: number,
    grantAmount: number,
    downpayment: number
): LoanResult {
    const priceAfterGrant = flatPrice - grantAmount;
    const maxLoanByMSR = calculateMaxLoan(session).maxLoanAmount;
    const ltvLimit = priceAfterGrant * HDB_LTV_RATIO;
    const amountToFinance = Math.max(0, priceAfterGrant - downpayment);

    const actualLoanAmount = Math.min(amountToFinance, ltvLimit, maxLoanByMSR);

    // Calculate monthly instalment for actual loan
    const r = HDB_LOAN_INTEREST_RATE / 12;
    const n = MAX_LOAN_TENURE_YEARS * 12;
    const monthlyInstalment =
        actualLoanAmount > 0
            ? (actualLoanAmount * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1)
            : 0;

    const totalIncome = getTotalIncome(session);
    const msrUsed = totalIncome > 0 ? monthlyInstalment / totalIncome : 0;

    return {
        maxLoanAmount: Math.round(actualLoanAmount),
        monthlyInstalment: Math.round(monthlyInstalment),
        loanTenureYears: MAX_LOAN_TENURE_YEARS,
        interestRate: HDB_LOAN_INTEREST_RATE,
        msrUsed: Math.round(msrUsed * 1000) / 1000, // 3 decimal places
    };
}

/* ─── Cash Flow Calculation ────────────────────────────────────────── */

/**
 * Calculates milestone payment requirements for BTO purchase.
 * Includes option fee, signing, and key collection stages.
 *
 * @param flatPrice - Price of the flat
 * @param grantAmount - Total grants to apply
 * @param cpfOA - Available CPF Ordinary Account savings
 * @param cashSavings - Available cash savings
 * @param flatType - Flat type for option fee calculation
 * @param age - Applicant age for SDS eligibility
 * @param employmentStatus - Employment status for deferred assessment check
 * @returns Cash flow breakdown by milestone
 */
export function calculateCashFlow(
    flatPrice: number,
    grantAmount: number,
    cpfOA: number,
    cashSavings: number,
    flatType: string,
    age?: number,
    employmentStatus?: string
): CashFlowResult {
    const milestones: MilestonePayment[] = [];
    const priceAfterGrant = flatPrice - grantAmount;

    // Check Staggered Downpayment Scheme (SDS) eligibility - at least one applicant <= 30
    const eligibleForSDS = age !== undefined && age <= 30;

    let cumulativeCash = 0;
    let cumulativeCPF = 0;
    let remainingCPF = cpfOA;

    // Stage 1: Option Fee (cash only)
    const optionFee = OPTION_FEE_BY_FLAT_TYPE[flatType] || 2000;
    cumulativeCash += optionFee;
    milestones.push({
        stage: 'Option Fee',
        amountCash: optionFee,
        amountCPF: 0,
        cumulativeCash,
        cumulativeCPF,
    });

    // Stage 2: Signing of Agreement for Lease
    let signingPercentage = 0.05; // Standard 5%
    if (eligibleForSDS && isDeferredIncome(employmentStatus)) {
        signingPercentage = 0.025; // 2.5% for student/NSF with SDS
    } else if (eligibleForSDS) {
        signingPercentage = 0.05; // 5% for standard SDS
    } else {
        signingPercentage = 0.1; // 10% for non-SDS
    }

    const signingAmount = Math.round(priceAfterGrant * signingPercentage) - optionFee;
    const signingCPF = Math.min(signingAmount, remainingCPF);
    const signingCash = Math.max(0, signingAmount - signingCPF);

    remainingCPF -= signingCPF;
    cumulativeCash += signingCash;
    cumulativeCPF += signingCPF;

    milestones.push({
        stage: 'Signing of Agreement',
        amountCash: signingCash,
        amountCPF: signingCPF,
        cumulativeCash,
        cumulativeCPF,
    });

    // Stage 3: Key Collection (remaining 15-17.5% + stamp duty + legal fees)
    const downpaymentTotal = 0.25; // Total 25% downpayment
    const alreadyPaid = optionFee + signingAmount;
    const remainingDownpayment = Math.round(priceAfterGrant * downpaymentTotal) - alreadyPaid;

    // Add stamp duty and legal fees
    const stampDuty = Math.round(priceAfterGrant * 0.04); // Simplified BSD 4%
    const legalFees = 3000; // Simplified estimate

    const keyCollectionTotal = remainingDownpayment + stampDuty + legalFees;
    const keyCollectionCPF = Math.min(keyCollectionTotal, remainingCPF);
    const keyCollectionCash = Math.max(0, keyCollectionTotal - keyCollectionCPF);

    remainingCPF -= keyCollectionCPF;
    cumulativeCash += keyCollectionCash;
    cumulativeCPF += keyCollectionCPF;

    milestones.push({
        stage: 'Key Collection',
        amountCash: keyCollectionCash,
        amountCPF: keyCollectionCPF,
        cumulativeCash,
        cumulativeCPF,
    });

    return {
        milestones,
        totalCashRequired: cumulativeCash,
        totalCPFRequired: cumulativeCPF,
    };
}

/* ─── Affordability Check ──────────────────────────────────────────── */

/**
 * Checks if the applicant can afford the flat based on cash and CPF savings.
 *
 * @param cashFlow - Cash flow calculation result
 * @param cashSavings - Available cash savings
 * @param monthlyIncome - Monthly household income
 * @param monthlyInstalment - Monthly loan instalment
 * @returns Affordability result
 */
export function checkAffordability(
    cashFlow: CashFlowResult,
    cashSavings: number,
    monthlyIncome: number,
    monthlyInstalment: number
): AffordabilityResult {
    const cashShortfall = Math.max(0, cashFlow.totalCashRequired - cashSavings);
    const monthlyIncomeBuffer = monthlyIncome - monthlyInstalment;

    return {
        canAfford: cashShortfall === 0 && monthlyIncomeBuffer > 0,
        cashShortfall,
        monthlyIncomeBuffer,
    };
}

/* ─── Subsidy Clawback ─────────────────────────────────────────────── */

/**
 * Calculates subsidy clawback for Plus and Prime flats upon resale.
 * Clawback is proportional to the lock-in period remaining.
 *
 * @param projectType - "Plus" or "Prime"
 * @param purchasePrice - Original purchase price
 * @param marketValue - Estimated market value
 * @param yearsBeforeSale - Years held before selling
 * @returns Clawback calculation result
 */
export function calculateClawback(
    projectType: 'Standard' | 'Plus' | 'Prime',
    purchasePrice: number,
    marketValue: number,
    yearsBeforeSale: number
): ClawbackResult {
    if (projectType === 'Standard') {
        return {
            subsidy: 0,
            clawbackAmount: 0,
            netProceeds: marketValue,
            effectivePrice: purchasePrice,
        };
    }

    const subsidy = marketValue - purchasePrice;
    const lockInYears = projectType === 'Plus' ? PLUS_FLAT_LOCK_IN_YEARS : PRIME_FLAT_LOCK_IN_YEARS;

    let clawbackAmount = 0;
    if (yearsBeforeSale < lockInYears) {
        const remainingLockInRatio = (lockInYears - yearsBeforeSale) / lockInYears;
        clawbackAmount = subsidy * remainingLockInRatio;
    }

    const netProceeds = marketValue - clawbackAmount;
    const effectivePrice = purchasePrice + clawbackAmount;

    return {
        subsidy: Math.round(subsidy),
        clawbackAmount: Math.round(clawbackAmount),
        netProceeds: Math.round(netProceeds),
        effectivePrice: Math.round(effectivePrice),
    };
}

/* ─── Full Financial Calculation ───────────────────────────────────── */

/**
 * Performs complete financial calculation for a BTO purchase.
 *
 * @param session - User session with profile data
 * @param flatPrice - Price of the flat
 * @param flatType - Type of flat
 * @returns Complete financial calculation result
 */
export function calculateFinancials(
    session: IUserSession,
    flatPrice: number,
    flatType: string
): FinancialCalculationResult {
    // 1. Eligibility check
    const eligibility = checkEligibility(session, flatType);

    // 2. Calculate grants
    const grants = calculateEHG(session);

    // 3. Calculate cash flow
    const cashFlow = calculateCashFlow(
        flatPrice,
        grants.totalGrant,
        session.cpfOA || 0,
        session.cashSavings || 0,
        flatType,
        session.age,
        session.employmentStatus
    );

    // 4. Calculate loan (actual)
    const totalDownpayment = cashFlow.totalCashRequired + cashFlow.totalCPFRequired;
    const loan = calculateActualLoan(session, flatPrice, grants.totalGrant, totalDownpayment);

    // 5. Check affordability
    const totalIncome = getTotalIncome(session);
    const affordability = checkAffordability(
        cashFlow,
        session.cashSavings || 0,
        totalIncome,
        loan.monthlyInstalment
    );

    return {
        eligibility,
        grants,
        loan,
        cashFlow,
        affordability,
    };
}
