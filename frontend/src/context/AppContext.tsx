/**
 * Application-wide state management via React Context.
 * Holds the onboarding profile, matched results, and comparison selections
 * without requiring account creation (session-only).
 */

import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { UserProfile, AffordabilityResult, OnboardingState } from '../types';

/* ─── State Shape ─────────────────────────────────────────────────── */

interface AppState {
    onboarding: OnboardingState;
    results: AffordabilityResult[];
    comparison: AffordabilityResult[]; // up to 3
}

const initialState: AppState = {
    onboarding: {
        currentStep: 0,
        profile: {},
        completed: false,
    },
    results: [],
    comparison: [],
};

/* ─── Actions ─────────────────────────────────────────────────────── */

type Action =
    | { type: 'SET_STEP'; step: number }
    | { type: 'UPDATE_PROFILE'; payload: Partial<UserProfile> }
    | { type: 'COMPLETE_ONBOARDING' }
    | { type: 'SET_RESULTS'; results: AffordabilityResult[] }
    | { type: 'TOGGLE_COMPARISON'; result: AffordabilityResult }
    | { type: 'CLEAR_COMPARISON' }
    | { type: 'RESET' };

function reducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'SET_STEP':
            return {
                ...state,
                onboarding: { ...state.onboarding, currentStep: action.step },
            };

        case 'UPDATE_PROFILE':
            return {
                ...state,
                onboarding: {
                    ...state.onboarding,
                    profile: { ...state.onboarding.profile, ...action.payload },
                },
            };

        case 'COMPLETE_ONBOARDING':
            return {
                ...state,
                onboarding: { ...state.onboarding, completed: true },
            };

        case 'SET_RESULTS':
            return { ...state, results: action.results };

        case 'TOGGLE_COMPARISON': {
            const exists = state.comparison.some(
                (c) =>
                    c.project.id === action.result.project.id &&
                    c.selectedFlatType === action.result.selectedFlatType
            );
            if (exists) {
                return {
                    ...state,
                    comparison: state.comparison.filter(
                        (c) =>
                            !(
                                c.project.id === action.result.project.id &&
                                c.selectedFlatType === action.result.selectedFlatType
                            )
                    ),
                };
            }
            if (state.comparison.length >= 3) return state; // max 3
            return { ...state, comparison: [...state.comparison, action.result] };
        }

        case 'CLEAR_COMPARISON':
            return { ...state, comparison: [] };

        case 'RESET':
            return initialState;

        default:
            return state;
    }
}

/* ─── Context ─────────────────────────────────────────────────────── */

const AppContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<Action>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppState() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useAppState must be used within AppProvider');
    return ctx;
}
