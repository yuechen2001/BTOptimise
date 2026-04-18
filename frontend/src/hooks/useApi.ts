/**
 * React Query Hooks for API Integration
 *
 * Custom hooks for fetching and mutating data using TanStack Query.
 * Handles caching, loading states, and error handling.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getProjects,
    getProject,
    getApplicationRates,
    createSession,
    getSession,
    updateSession,
    deleteSession,
    calculateFinancials,
    simulateClawback,
    checkEligibility,
    calculateMatching,
    generateTimelineProjection,
    type ProjectFilters,
    type ApplicationRateFilters,
    type SessionCreateInput,
    type FinancialCalculateInput,
    type ClawbackSimulationInput,
    type MatchingInput,
    type TimelineProjectionInput,
    type Project,
    type ApplicationRate,
    type UserSession,
    type FinancialCalculationResult,
    type ClawbackResult,
    type EligibilityCheckResult,
    type MatchingResponse,
    type TimelineProjectionResult,
} from '../services/api';

/* ─── Query Keys ───────────────────────────────────────────────────── */

export const queryKeys = {
    projects: {
        all: ['projects'] as const,
        list: (filters?: ProjectFilters) => [...queryKeys.projects.all, 'list', filters] as const,
        detail: (projectCode: string) =>
            [...queryKeys.projects.all, 'detail', projectCode] as const,
    },
    applicationRates: {
        all: ['applicationRates'] as const,
        list: (filters?: ApplicationRateFilters) =>
            [...queryKeys.applicationRates.all, 'list', filters] as const,
    },
    sessions: {
        all: ['sessions'] as const,
        detail: (sessionId: string) => [...queryKeys.sessions.all, 'detail', sessionId] as const,
    },
    financial: {
        calculation: (input: FinancialCalculateInput) =>
            ['financial', 'calculation', input] as const,
        clawback: (input: ClawbackSimulationInput) => ['financial', 'clawback', input] as const,
        eligibility: (sessionId: string) => ['financial', 'eligibility', sessionId] as const,
    },
    timeline: {
        all: ['timeline'] as const,
        projection: (sessionId: string, config: string) =>
            [...queryKeys.timeline.all, 'projection', sessionId, config] as const,
    },
};

/* ─── Projects Hooks ───────────────────────────────────────────────── */

export function useProjects(filters?: ProjectFilters) {
    return useQuery({
        queryKey: queryKeys.projects.list(filters),
        queryFn: () => getProjects(filters),
    });
}

export function useProject(projectCode: string) {
    return useQuery({
        queryKey: queryKeys.projects.detail(projectCode),
        queryFn: () => getProject(projectCode),
        enabled: !!projectCode,
    });
}

/* ─── Application Rates Hooks ──────────────────────────────────────── */

export function useApplicationRates(filters?: ApplicationRateFilters) {
    return useQuery({
        queryKey: queryKeys.applicationRates.list(filters),
        queryFn: () => getApplicationRates(filters),
    });
}

/* ─── Session Hooks ────────────────────────────────────────────────── */

export function useSession(sessionId: string | null) {
    return useQuery({
        queryKey: queryKeys.sessions.detail(sessionId || ''),
        queryFn: () => getSession(sessionId!),
        enabled: !!sessionId,
    });
}

export function useCreateSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (profile?: SessionCreateInput) => createSession(profile),
        onSuccess: (data) => {
            queryClient.setQueryData(queryKeys.sessions.detail(data.sessionId), data);
        },
    });
}

export function useUpdateSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ sessionId, updates }: { sessionId: string; updates: SessionCreateInput }) =>
            updateSession(sessionId, updates),
        onSuccess: (data) => {
            queryClient.setQueryData(queryKeys.sessions.detail(data.sessionId), data);
            // Invalidate timeline cache when profile is updated
            queryClient.invalidateQueries({ queryKey: queryKeys.timeline.all });
            
            // Also invalidate localStorage timeline cache
            import('../utils/timelineCache').then(({ invalidateTimelineCache }) => {
                invalidateTimelineCache(data.sessionId);
            });
        },
    });
}

export function useDeleteSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (sessionId: string) => deleteSession(sessionId),
        onSuccess: (_, sessionId) => {
            queryClient.removeQueries({ queryKey: queryKeys.sessions.detail(sessionId) });
        },
    });
}

/* ─── Financial Calculation Hooks ──────────────────────────────────── */

export function useCalculateFinancials() {
    return useMutation({
        mutationFn: (input: FinancialCalculateInput) => calculateFinancials(input),
    });
}

export function useSimulateClawback() {
    return useMutation({
        mutationFn: (input: ClawbackSimulationInput) => simulateClawback(input),
    });
}

export function useEligibility(sessionId: string | null) {
    return useQuery({
        queryKey: queryKeys.financial.eligibility(sessionId || ''),
        queryFn: () => checkEligibility(sessionId!),
        enabled: !!sessionId,
    });
}

/* ─── Matching & Recommendation Hook ───────────────────────────────── */

export function useCalculateMatching() {
    return useMutation({
        mutationFn: (input: MatchingInput) => calculateMatching(input),
    });
}

/* ─── Timeline Visualizer Hooks ────────────────────────────────────── */

import type { TimelineConfig } from '../types';

/**
 * Generate timeline projection with financial snapshots
 */
export function useTimelineProjection(
    sessionId: string | null, 
    config: TimelineConfig | null,
    projects?: import('../types').ProjectTimelineRequest[]
) {
    const configKey = config ? JSON.stringify(config) : 'null';
    const projectsKey = projects ? JSON.stringify(projects) : 'null';
    
    return useQuery({
        queryKey: queryKeys.timeline.projection(sessionId || '', `${configKey}-${projectsKey}`),
        queryFn: () => {
            if (!sessionId || !config) {
                throw new Error('Session ID and config are required');
            }
            return generateTimelineProjection({ sessionId, config, projects });
        },
        enabled: !!sessionId && !!config,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });
}

/* ─── Type Exports ─────────────────────────────────────────────────── */

export type {
    Project,
    ApplicationRate,
    UserSession,
    FinancialCalculationResult,
    ClawbackResult,
    EligibilityCheckResult,
    MatchingResponse,
    TimelineProjectionResult,
    ProjectFilters,
    ApplicationRateFilters,
    SessionCreateInput,
    FinancialCalculateInput,
    ClawbackSimulationInput,
    TimelineProjectionInput,
};
