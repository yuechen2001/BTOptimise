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
function isDeferredIncome(employmentStatus?: string): boolean {
    return employmentStatus === 'student' || employmentStatus === 'nsf';
}

function getTotalIncome(session: IUserSession): number {
    return (session.monthlyIncome || 0) + (session.partnerMonthlyIncome || 0);
}

/* ─── Eligibility Check ────────────────────────────────────────────── */

export function checkEligibility(session: IUserSession, flatType?: string): EligibilityResult {
    const reasons: string[] = [];
    let canPurchase = true;
    let incomeCeilingCheck = false;
    const deferredIncomeAssessment = session.deferredIncomeAssessment;

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

export function calculateEHG(session: IUserSession): GrantResult {
    const breakdown: string[] = [];
    const totalIncome = getTotalIncome(session);

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

    const optionFee = OPTION_FEE_BY_FLAT_TYPE[flatType] || 2000;
    cumulativeCash += optionFee;
    milestones.push({
        stage: 'Option Fee',
        amountCash: optionFee,
        amountCPF: 0,
        cumulativeCash,
        cumulativeCPF,
    });

    let signingPercentage = 0.05;
    if (eligibleForSDS && isDeferredIncome(employmentStatus)) {
        signingPercentage = 0.025;
    } else if (eligibleForSDS) {
        signingPercentage = 0.05;
    } else {
        signingPercentage = 0.1;
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
    const downpaymentTotal = 0.25;
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

export function calculateFinancials(
    session: IUserSession,
    flatPrice: number,
    flatType: string
): FinancialCalculationResult {
    const eligibility = checkEligibility(session, flatType);
    const grants = calculateEHG(session);

    const cashFlow = calculateCashFlow(
        flatPrice,
        grants.totalGrant,
        session.cpfOA || 0,
        session.cashSavings || 0,
        flatType,
        session.age,
        session.employmentStatus
    );

    const totalDownpayment = cashFlow.totalCashRequired + cashFlow.totalCPFRequired;
    const loan = calculateActualLoan(session, flatPrice, grants.totalGrant, totalDownpayment);

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
