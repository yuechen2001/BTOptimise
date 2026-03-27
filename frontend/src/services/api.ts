/**
 * API Client Service
 *
 * Centralised HTTP client for communicating with the BTOptimise backend.
 * All API calls should go through this module.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

/* ─── Types ────────────────────────────────────────────────────────── */

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
    count?: number;
}

interface LegacyMatchingApiResponse {
    success: boolean;
    recommendations?: LegacyMatchingRecommendation[];
    message?: string;
}

/* ─── Backend Types ────────────────────────────────────────────────── */

export interface FlatType {
    type: string;
    estimatedFloorArea: number | null;
    estimatedInternalFloorArea: number | null;
    minIndicativePrice: number | null;
    maxIndicativePrice: number | null;
    unitCount: number | null;
}

export interface Project {
    _id: string;
    projectCode: string;
    name: string;
    estate: string;
    classification: 'Standard' | 'Plus' | 'Prime';
    launchdate: string | null;
    estimatedCompletion: string | null;
    flatTypes: FlatType[];
    lastVerifiedAt: string | null;
}

export interface ApplicationRate {
    _id: string;
    launchCode: string;
    estate: string;
    projectGroup: string;
    flatType: string;
    noOfApplicants: number;
    noOfUnits: number;
    overallAppRate: number;
    firstTimerFamiliesAppRate: number;
    firstTimerSinglesAppRate: number;
    secondTimerFamiliesAppRate: number;
    seniorsAppRate: number;
    projectCodes: string[];
    sourceAsOf: string;
    lastVerifiedAt: string | null;
}

export interface UserSession {
    _id: string;
    sessionId: string;
    applicantType?: 'single' | 'couple';
    age?: number;
    partnerAge?: number;
    citizenship?: 'SC' | 'SC/SC' | 'SC/PR';
    firstTimer?: boolean;
    employmentStatus?: 'employed' | 'self-employed' | 'student' | 'nsf';
    monthlyIncome?: number;
    partnerMonthlyIncome?: number;
    cpfOA?: number;
    cashSavings?: number;
    preferredFlatTypes?: string[];
    preferredRegions?: string[];
    maxBudget?: number;
    deferredIncomeAssessment: boolean;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
}

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

export interface FinancialCalculationResult {
    eligibility: EligibilityResult;
    grants: GrantResult;
    loan: LoanResult;
    cashFlow: CashFlowResult;
    affordability: AffordabilityResult;
}

export interface ClawbackResult {
    subsidy: number;
    clawbackAmount: number;
    netProceeds: number;
    effectivePrice: number;
}

interface LegacyMatchingDemandInfo {
    rate: number;
    colour: string;
    totalUnits?: number;
    totalApplicants?: number;
}

export interface LegacyAffordabilityClassification {
    status: 'canAfford' | 'stretchRequired' | 'outOfReach';
    colour: 'green' | 'yellow' | 'red';
}

export interface LegacyMatchingSelectedFlat extends FlatType {
    financials: FinancialCalculationResult;
    affordability: LegacyAffordabilityClassification;
    demandInfo: LegacyMatchingDemandInfo;
}

export interface LegacyMatchingRecommendation extends Project {
    selectedFlat: LegacyMatchingSelectedFlat;
}

/* ─── API Error ────────────────────────────────────────────────────── */

export class ApiError extends Error {
    status: number;
    errors?: string[];

    constructor(message: string, status: number, errors?: string[]) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.errors = errors;
    }
}

/* ─── HTTP Client ──────────────────────────────────────────────────── */

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };

    const response = await fetch(url, config);
    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
        throw new ApiError(data.message || 'An error occurred', response.status, data.errors);
    }

    return data.data as T;
}

/* ─── Projects API ─────────────────────────────────────────────────── */

export interface ProjectFilters {
    estate?: string;
    classification?: 'Standard' | 'Plus' | 'Prime';
    flatType?: string;
}

export async function getProjects(filters?: ProjectFilters): Promise<Project[]> {
    const params = new URLSearchParams();
    if (filters?.estate) params.append('estate', filters.estate);
    if (filters?.classification) params.append('classification', filters.classification);
    if (filters?.flatType) params.append('flatType', filters.flatType);

    const queryString = params.toString();
    const endpoint = `/projects${queryString ? `?${queryString}` : ''}`;

    return request<Project[]>(endpoint);
}

export async function getProject(projectCode: string): Promise<Project> {
    return request<Project>(`/projects/${encodeURIComponent(projectCode)}`);
}

/* ─── Application Rates API ────────────────────────────────────────── */

export interface ApplicationRateFilters {
    launchCode?: string;
    estate?: string;
    flatType?: string;
    projectCode?: string;
}

export async function getApplicationRates(
    filters?: ApplicationRateFilters
): Promise<ApplicationRate[]> {
    const params = new URLSearchParams();
    if (filters?.launchCode) params.append('launchCode', filters.launchCode);
    if (filters?.estate) params.append('estate', filters.estate);
    if (filters?.flatType) params.append('flatType', filters.flatType);
    if (filters?.projectCode) params.append('projectCode', filters.projectCode);

    const queryString = params.toString();
    const endpoint = `/application-rates${queryString ? `?${queryString}` : ''}`;

    return request<ApplicationRate[]>(endpoint);
}

/* ─── Sessions API ─────────────────────────────────────────────────── */

export type SessionCreateInput = Partial<
    Omit<
        UserSession,
        '_id' | 'sessionId' | 'deferredIncomeAssessment' | 'expiresAt' | 'createdAt' | 'updatedAt'
    >
>;

export async function createSession(profile?: SessionCreateInput): Promise<UserSession> {
    return request<UserSession>('/sessions', {
        method: 'POST',
        body: JSON.stringify(profile || {}),
    });
}

export async function getSession(sessionId: string): Promise<UserSession> {
    return request<UserSession>(`/sessions/${encodeURIComponent(sessionId)}`);
}

export async function updateSession(
    sessionId: string,
    updates: SessionCreateInput
): Promise<UserSession> {
    return request<UserSession>(`/sessions/${encodeURIComponent(sessionId)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });
}

export async function deleteSession(sessionId: string): Promise<void> {
    await request<void>(`/sessions/${encodeURIComponent(sessionId)}`, {
        method: 'DELETE',
    });
}

/* ─── Financial Rules API ──────────────────────────────────────────── */

export interface FinancialCalculateInput {
    sessionId: string;
    projectId?: string;
    flatType?: string;
    flatPrice?: number;
}

export async function calculateFinancials(
    input: FinancialCalculateInput
): Promise<FinancialCalculationResult> {
    return request<FinancialCalculationResult>('/financial-rules/calculate', {
        method: 'POST',
        body: JSON.stringify(input),
    });
}

export interface ClawbackSimulationInput {
    projectType: 'Standard' | 'Plus' | 'Prime';
    purchasePrice: number;
    marketValue: number;
    yearsBeforeSale: number;
}

export async function simulateClawback(input: ClawbackSimulationInput): Promise<ClawbackResult> {
    return request<ClawbackResult>('/financial-rules/simulate-clawback', {
        method: 'POST',
        body: JSON.stringify(input),
    });
}

export interface EligibilityCheckResult {
    eligible: boolean;
    checks: {
        citizenship: boolean;
        incomeCeiling: boolean;
        firstTimer: boolean;
    };
    reasons: string[];
}

export async function checkEligibility(sessionId: string): Promise<EligibilityCheckResult> {
    return request<EligibilityCheckResult>(
        `/financial-rules/eligibility/${encodeURIComponent(sessionId)}`
    );
}

/* ─── Matching & Recommendation API ────────────────────────────────── */

/**
 * Input for the matching service
 */
export interface MatchingInput {
    sessionId: string;
}

/**
 * Result from the matching service for a single project-flat combination
 */
export interface MatchingResultItem {
    project: Project;
    selectedFlat: LegacyMatchingSelectedFlat;
}

/**
 * Response from the matching service
 */
export interface MatchingResponse {
    recommendations: MatchingResultItem[];
}

export async function calculateMatching(input: MatchingInput): Promise<MatchingResponse> {
    const url = `${API_BASE_URL}/matching-recommendation/${encodeURIComponent(input.sessionId)}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    const data: LegacyMatchingApiResponse = await response.json();

    if (!response.ok || !data.success) {
        throw new ApiError(data.message || 'An error occurred', response.status);
    }

    return {
        recommendations: (data.recommendations || []).map(({ selectedFlat, ...project }) => ({
            project,
            selectedFlat,
        })),
    };
}
