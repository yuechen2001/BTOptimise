/**
 * Financial Rules Service
 *
 * Encapsulates HDB policy logic for:
 *  - Enhanced CPF Housing Grant (EHG)
 *  - Maximum HDB loan via Mortgage Servicing Ratio (MSR)
 *  - Milestone cash flow at each BTO payment stage
 *  - Subsidy clawback projection for Plus and Prime flats
 */

import type {
  UserProfile,
  BTOProject,
  FlatTypePreference,
  GrantResult,
  LoanResult,
  MilestoneCashFlow,
} from '../types';

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

const HDB_LOAN_INTEREST = 0.026; // 2.6 % p.a. concessionary rate
const MAX_MSR = 0.30;            // 30 % of gross monthly income
const MAX_LOAN_TENURE_YEARS = 25;
const HDB_LTV = 0.80;           // max 80 % Loan-to-Value

/** Income ceiling for BTO eligibility (couple) */
const INCOME_CEILING_COUPLE = 14000;
/** Income ceiling for singles (2-Room Flexi only) */
const INCOME_CEILING_SINGLE = 7000;

/**
 * Simplified EHG quantum table (as of 2025 policy).
 * Key = upper bound of average gross monthly household income.
 * Value = grant amount in SGD.
 */
const EHG_TABLE: [number, number][] = [
  [1500, 80000],
  [2000, 75000],
  [2500, 70000],
  [3000, 65000],
  [3500, 60000],
  [4000, 55000],
  [4500, 50000],
  [5000, 45000],
  [5500, 40000],
  [6000, 35000],
  [6500, 30000],
  [7000, 25000],
  [7500, 20000],
  [8000, 15000],
  [8500, 10000],
  [9000, 5000],
];

/**
 * BTO payment milestones as a fraction of purchase price.
 * These are the standard HDB payment stages.
 */
export const PAYMENT_MILESTONES: { stage: string; pct: number }[] = [
  { stage: 'Option Fee', pct: 0.05 },
  { stage: 'Signing of Agreement', pct: 0.15 },      // less option fee already paid – handled in code
  { stage: 'Key Collection', pct: 0.05 },
  { stage: 'HDB Loan Drawdown', pct: 0.00 },          // remaining funded by loan
];

/* ================================================================== */
/*  EHG CALCULATION                                                    */
/* ================================================================== */

export function computeEHG(profile: UserProfile): GrantResult {
  const breakdown: string[] = [];
  const grossIncome = profile.monthlyIncome + (profile.partnerMonthlyIncome ?? 0);

  // Check first-timer eligibility
  if (!profile.firstTimer) {
    breakdown.push('Not a first-timer — EHG not applicable');
    return { ehgAmount: 0, proximityGrant: 0, totalGrant: 0, breakdown };
  }

  // Student / NSF deferred assessment: assume $0 income → max grant
  const assessedIncome =
    profile.employmentStatus === 'student' || profile.employmentStatus === 'nsf'
      ? 0
      : grossIncome;

  let ehg = 0;
  for (const [ceiling, amount] of EHG_TABLE) {
    if (assessedIncome <= ceiling) {
      ehg = amount;
      break;
    }
  }

  if (ehg === 0 && assessedIncome <= 9000) {
    ehg = 5000;
  }

  if (assessedIncome > 9000) {
    breakdown.push(`Household income $${assessedIncome.toLocaleString()} exceeds EHG ceiling`);
  } else {
    breakdown.push(`EHG quantum: $${ehg.toLocaleString()} (assessed income $${assessedIncome.toLocaleString()}/mth)`);
  }

  // Proximity Housing Grant (simplified: $30k if SC/SC couple first-timer)
  let proximity = 0;
  if (profile.citizenship === 'SC/SC' && profile.applicantType === 'couple') {
    proximity = 30000;
    breakdown.push('Proximity Housing Grant: $30,000 (SC/SC couple)');
  } else if (profile.citizenship === 'SC/PR' && profile.applicantType === 'couple') {
    proximity = 20000;
    breakdown.push('Proximity Housing Grant: $20,000 (SC/PR couple)');
  }

  return {
    ehgAmount: ehg,
    proximityGrant: proximity,
    totalGrant: ehg + proximity,
    breakdown,
  };
}

/* ================================================================== */
/*  HDB LOAN (MSR-BASED)                                              */
/* ================================================================== */

export function computeMaxLoan(profile: UserProfile): LoanResult {
  const grossIncome = profile.monthlyIncome + (profile.partnerMonthlyIncome ?? 0);
  const maxMonthlyInstalment = grossIncome * MAX_MSR;

  // Monthly interest rate
  const r = HDB_LOAN_INTEREST / 12;
  const n = MAX_LOAN_TENURE_YEARS * 12;

  // PV of annuity: P = PMT * [(1 - (1+r)^-n) / r]
  const maxLoan = maxMonthlyInstalment * ((1 - Math.pow(1 + r, -n)) / r);

  return {
    maxLoanAmount: Math.round(maxLoan),
    monthlyInstalment: Math.round(maxMonthlyInstalment),
    loanTenureYears: MAX_LOAN_TENURE_YEARS,
    interestRate: HDB_LOAN_INTEREST,
    msrUsed: MAX_MSR,
  };
}

/**
 * Given a specific flat price (after grants), compute the actual loan needed,
 * capped at LTV and MSR limits.
 */
export function computeActualLoan(
  profile: UserProfile,
  priceAfterGrant: number,
  downpaymentCpf: number,
  downpaymentCash: number,
): LoanResult {
  const maxLoan = computeMaxLoan(profile);
  const amountToFinance = priceAfterGrant - downpaymentCpf - downpaymentCash;
  const ltvCap = priceAfterGrant * HDB_LTV;
  const actualLoan = Math.min(amountToFinance, ltvCap, maxLoan.maxLoanAmount);

  const r = HDB_LOAN_INTEREST / 12;
  const n = MAX_LOAN_TENURE_YEARS * 12;
  const monthlyPmt = actualLoan * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  const grossIncome = profile.monthlyIncome + (profile.partnerMonthlyIncome ?? 0);

  return {
    maxLoanAmount: Math.round(actualLoan),
    monthlyInstalment: Math.round(monthlyPmt),
    loanTenureYears: MAX_LOAN_TENURE_YEARS,
    interestRate: HDB_LOAN_INTEREST,
    msrUsed: grossIncome > 0 ? monthlyPmt / grossIncome : 0,
  };
}

/* ================================================================== */
/*  MILESTONE CASH FLOW                                                */
/* ================================================================== */

export function computeMilestones(
  price: number,
  grantTotal: number,
  cpfOA: number,
): MilestoneCashFlow[] {
  const effectivePrice = price - grantTotal;
  const milestones: MilestoneCashFlow[] = [];
  let cumulativePaid = 0;
  let cpfRemaining = cpfOA;

  // Option fee (5 %) — cash only
  const optionAmt = Math.round(effectivePrice * 0.05);
  cumulativePaid += optionAmt;
  milestones.push({
    stage: 'Option Fee',
    percentageOfPrice: 5,
    amountDue: optionAmt,
    cpfUsable: 0,
    cashRequired: optionAmt,
    cumulativePaid,
  });

  // Signing (15 % of effective price, minus option fee already paid → net 10 %)
  const signingAmt = Math.round(effectivePrice * 0.15) - optionAmt;
  const signingCpf = Math.min(cpfRemaining, signingAmt);
  const signingCash = signingAmt - signingCpf;
  cpfRemaining -= signingCpf;
  cumulativePaid += signingAmt;
  milestones.push({
    stage: 'Signing of Agreement',
    percentageOfPrice: 10,
    amountDue: signingAmt,
    cpfUsable: signingCpf,
    cashRequired: signingCash,
    cumulativePaid,
  });

  // Key collection (5 %)
  const keyAmt = Math.round(effectivePrice * 0.05);
  const keyCpf = Math.min(cpfRemaining, keyAmt);
  const keyCash = keyAmt - keyCpf;
  cpfRemaining -= keyCpf;
  cumulativePaid += keyAmt;
  milestones.push({
    stage: 'Key Collection',
    percentageOfPrice: 5,
    amountDue: keyAmt,
    cpfUsable: keyCpf,
    cashRequired: keyCash,
    cumulativePaid,
  });

  // Remaining via HDB loan (80 %)
  const loanAmt = Math.round(effectivePrice * 0.80);
  cumulativePaid += loanAmt;
  milestones.push({
    stage: 'HDB Loan (80%)',
    percentageOfPrice: 80,
    amountDue: loanAmt,
    cpfUsable: 0,
    cashRequired: 0,
    cumulativePaid,
  });

  return milestones;
}

/* ================================================================== */
/*  CLAWBACK PROJECTION                                                */
/* ================================================================== */

/**
 * Estimate subsidy clawback if the flat is resold after MOP.
 * For Plus / Prime flats, a percentage of the resale price is returned to HDB.
 */
export function computeClawback(
  project: BTOProject,
  purchasePrice: number,
  estimatedResalePrice?: number,
): number {
  if (project.clawbackRate === 0) return 0;
  // Default resale assumption: 30 % appreciation over the holding period
  const resale = estimatedResalePrice ?? purchasePrice * 1.3;
  return Math.round(resale * project.clawbackRate);
}

/* ================================================================== */
/*  ELIGIBILITY CHECKS                                                 */
/* ================================================================== */

export function checkIncomeEligibility(
  profile: UserProfile,
): { eligible: boolean; reason: string } {
  const grossIncome = profile.monthlyIncome + (profile.partnerMonthlyIncome ?? 0);

  if (profile.applicantType === 'single') {
    if (grossIncome > INCOME_CEILING_SINGLE) {
      return {
        eligible: false,
        reason: `Single applicant income $${grossIncome.toLocaleString()} exceeds ceiling of $${INCOME_CEILING_SINGLE.toLocaleString()}.`,
      };
    }
  } else {
    if (grossIncome > INCOME_CEILING_COUPLE) {
      return {
        eligible: false,
        reason: `Household income $${grossIncome.toLocaleString()} exceeds ceiling of $${INCOME_CEILING_COUPLE.toLocaleString()}.`,
      };
    }
  }

  return { eligible: true, reason: 'Income within BTO ceiling.' };
}

/**
 * Check flat-type eligibility based on applicant type.
 * Singles can only apply for 2-Room Flexi in non-mature estates (simplified rule).
 */
export function checkFlatTypeEligibility(
  profile: UserProfile,
  flatType: FlatTypePreference,
): boolean {
  if (profile.applicantType === 'single') {
    return flatType === '2-Room Flexi';
  }
  return true;
}
