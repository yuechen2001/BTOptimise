import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type {
    UserProfile,
    ProjectAffordabilityResult,
    OnboardingState,
    ProjectTimelineRequest,
} from '../types';
import { getResultIdentity } from '../utils/resultIdentity';

/* ─── Storage Keys ────────────────────────────────────────────────── */

const SESSION_STORAGE_KEY = 'btoptimise_sessionId';

/* ─── State Shape ─────────────────────────────────────────────────── */

interface AppState {
    sessionId: string | null;
    onboarding: OnboardingState;
    results: ProjectAffordabilityResult[];
    comparison: ProjectAffordabilityResult[]; // up to 3
    timeline: ProjectTimelineRequest[]; // up to 3 projects, synced with comparison
    isLoading: boolean;
    error: string | null;
}

const initialState: AppState = {
    sessionId: null,
    onboarding: {
        currentStep: 0,
        profile: {},
        completed: false,
    },
    results: [],
    comparison: [],
    timeline: [],
    isLoading: false,
    error: null,
};

/* ─── Actions ─────────────────────────────────────────────────────── */

type Action =
    | { type: 'SET_SESSION_ID'; sessionId: string | null }
    | { type: 'SET_STEP'; step: number }
    | { type: 'UPDATE_PROFILE'; payload: Partial<UserProfile> }
    | { type: 'COMPLETE_ONBOARDING' }
    | { type: 'SET_RESULTS'; results: ProjectAffordabilityResult[] }
    | { type: 'TOGGLE_COMPARISON'; result: ProjectAffordabilityResult }
    | { type: 'CLEAR_COMPARISON' }
    | { type: 'SET_LOADING'; isLoading: boolean }
    | { type: 'SET_ERROR'; error: string | null }
    | { type: 'RESET' };

function reducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'SET_SESSION_ID':
            return { ...state, sessionId: action.sessionId };

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
                (c) => getResultIdentity(c) === getResultIdentity(action.result)
            );
            if (exists) {
                const projectId = action.result.project.projectCode;
                const flatType = action.result.selectedFlat.type;
                const estimatedFloorArea = action.result.selectedFlat.estimatedFloorArea;
                return {
                    ...state,
                    comparison: state.comparison.filter(
                        (c) => getResultIdentity(c) !== getResultIdentity(action.result)
                    ),
                    timeline: state.timeline.filter(
                        (p) =>
                            !(
                                p.projectId === projectId &&
                                p.flatType === flatType &&
                                p.estimatedFloorArea === estimatedFloorArea
                            )
                    ),
                };
            }
            if (state.comparison.length >= 3) return state;

            const { project, selectedFlat } = action.result;
            const timelineProject: ProjectTimelineRequest = {
                projectId: project.projectCode,
                projectName: project.name,
                flatType: selectedFlat.type as import('../types').FlatTypePreference,
                estimatedFloorArea: selectedFlat.estimatedFloorArea,
                price: selectedFlat.maxIndicativePrice || selectedFlat.minIndicativePrice || 0,
                classification: project.classification,
                estimatedLaunchDate: project.launchdate || undefined,
            };

            return {
                ...state,
                comparison: [...state.comparison, action.result],
                timeline: [...state.timeline, timelineProject],
            };
        }

        case 'CLEAR_COMPARISON':
            return { ...state, comparison: [], timeline: [] };

        case 'SET_LOADING':
            return { ...state, isLoading: action.isLoading };

        case 'SET_ERROR':
            return { ...state, error: action.error };

        case 'RESET':
            localStorage.removeItem(SESSION_STORAGE_KEY);
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

    useEffect(() => {
        const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
        if (storedSessionId) {
            dispatch({ type: 'SET_SESSION_ID', sessionId: storedSessionId });
        }
    }, []);

    useEffect(() => {
        if (state.sessionId) {
            localStorage.setItem(SESSION_STORAGE_KEY, state.sessionId);
        } else {
            localStorage.removeItem(SESSION_STORAGE_KEY);
        }
    }, [state.sessionId]);

    return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppState() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useAppState must be used within AppProvider');
    return ctx;
}
