/**
 * OnboardingWizard
 *
 * Multi-step form for collecting user profile data.
 * Creates/updates a backend session and calculates affordability.
 */

import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAppState } from '../../context/AppContext';
import type { UserProfile } from '../../types';
import { ApiError } from '../../services/api';
import {
    useCreateSession,
    useUpdateSession,
    useCalculateMatching,
} from '../../hooks/useApi';
import StepDemographics from './StepDemographics';
import StepFinancials from './StepFinancials';
import StepPreferences from './StepPreferences';

const STEPS = [
    { label: 'Demographics', component: StepDemographics },
    { label: 'Financials', component: StepFinancials },
    { label: 'Preferences', component: StepPreferences },
];

const INCOME_CEILING_COUPLE = 14000;

function isMissingSessionError(error: unknown): boolean {
    return (
        error instanceof ApiError &&
        error.status === 404 &&
        /session not found|session not found or expired/i.test(error.message)
    );
}

export default function OnboardingWizard() {
    const { state, dispatch } = useAppState();
    const navigate = useNavigate();
    const step = state.onboarding.currentStep;
    const StepComponent = STEPS[step].component;

    const [isCalculating, setIsCalculating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // API hooks
    const createSessionMutation = useCreateSession();
    const updateSessionMutation = useUpdateSession();
    const calculateMatchingMutation = useCalculateMatching();

    const canProceed = useMemo(() => {
        const p = state.onboarding.profile;
        const isDeferred = p.employmentStatus === 'student' || p.employmentStatus === 'nsf';
        const totalHouseholdIncome = (p.monthlyIncome ?? 0) + (p.partnerMonthlyIncome ?? 0);

        switch (step) {
            case 0: {
                const ageValid = p.age !== undefined && p.age >= 21;
                const partnerAgeValid =
                    p.applicantType !== 'couple' ||
                    (p.partnerAge !== undefined && p.partnerAge >= 21);
                return !!(
                    p.applicantType &&
                    ageValid &&
                    partnerAgeValid &&
                    p.citizenship &&
                    p.firstTimer !== undefined
                );
            }
            case 1:
                return !!(
                    p.employmentStatus &&
                    p.cpfOA !== undefined &&
                    p.cashSavings !== undefined &&
                    !(
                        p.applicantType === 'couple' &&
                        !isDeferred &&
                        totalHouseholdIncome > INCOME_CEILING_COUPLE
                    )
                );
            case 2:
                return true; // preferences are optional
            default:
                return false;
        }
    }, [step, state.onboarding.profile]);

    const handleNext = useCallback(async () => {
        setError(null);

        if (step < STEPS.length - 1) {
            dispatch({ type: 'SET_STEP', step: step + 1 });
        } else {
            // Final step — create session, calculate results, and navigate to dashboard
            setIsCalculating(true);

            try {
                const profile = state.onboarding.profile as UserProfile;
                console.log('Starting onboarding completion with profile:', profile);

                const createFreshSession = async (): Promise<string> => {
                    console.log('Creating new session...');
                    const session = await createSessionMutation.mutateAsync(profile);
                    console.log('Session created:', session.sessionId);
                    dispatch({ type: 'SET_SESSION_ID', sessionId: session.sessionId });
                    return session.sessionId;
                };

                const ensureActiveSession = async (): Promise<string> => {
                    if (!state.sessionId) {
                        return createFreshSession();
                    }

                    try {
                        console.log('Updating existing session:', state.sessionId);
                        await updateSessionMutation.mutateAsync({
                            sessionId: state.sessionId,
                            updates: profile,
                        });
                        return state.sessionId;
                    } catch (error) {
                        if (!isMissingSessionError(error)) {
                            throw error;
                        }

                        console.warn('Stored session expired; creating a fresh session.');
                        dispatch({ type: 'SET_SESSION_ID', sessionId: null });
                        return createFreshSession();
                    }
                };

                let sessionId = await ensureActiveSession();

                const fetchMatching = async (activeSessionId: string) => {
                    console.log('Calculating matching results...');
                    return calculateMatchingMutation.mutateAsync({ sessionId: activeSessionId });
                };

                let matching;
                try {
                    matching = await fetchMatching(sessionId);
                } catch (error) {
                    if (!isMissingSessionError(error)) {
                        throw error;
                    }

                    console.warn('Session expired before matching; recreating and retrying.');
                    dispatch({ type: 'SET_SESSION_ID', sessionId: null });
                    sessionId = await createFreshSession();
                    matching = await fetchMatching(sessionId);
                }

                console.log('Matching results:', matching.recommendations.length);

                dispatch({ type: 'COMPLETE_ONBOARDING' });
                dispatch({ type: 'SET_RESULTS', results: matching.recommendations });
                navigate({ to: '/dashboard' });
            } catch (err) {
                console.error('Failed to complete onboarding:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setIsCalculating(false);
            }
        }
    }, [
        step,
        state.sessionId,
        state.onboarding.profile,
        dispatch,
        navigate,
        createSessionMutation,
        updateSessionMutation,
        calculateMatchingMutation,
    ]);

    const handleBack = useCallback(() => {
        if (step > 0) {
            dispatch({ type: 'SET_STEP', step: step - 1 });
        }
    }, [step, dispatch]);

    const isLoading = isCalculating;

    return (
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
            {/* Stepper */}
            <div className="stepper">
                {STEPS.map((s, i) => (
                    <div
                        key={s.label}
                        className="stepper__step-wrapper"
                        style={{ display: 'flex', alignItems: 'center' }}
                    >
                        <div
                            className={`stepper__step ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}`}
                        >
                            <div className="stepper__circle">{i < step ? '\u2713' : i + 1}</div>
                            <span className="stepper__label">{s.label}</span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`stepper__line ${i < step ? 'completed' : ''}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Error message */}
            {error && (
                <div
                    style={{
                        background: 'var(--clr-red-bg, #fef2f2)',
                        color: 'var(--clr-red)',
                        padding: 'var(--sp-md)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--sp-md)',
                    }}
                >
                    {error}
                </div>
            )}

            {/* Step content */}
            <div className="card" style={{ marginBottom: 'var(--sp-lg)' }}>
                <StepComponent />
            </div>

            {/* Navigation */}
            <div className="flex-between">
                <button
                    className="btn btn--secondary"
                    onClick={handleBack}
                    disabled={step === 0 || isLoading}
                >
                    Back
                </button>
                <button
                    className="btn btn--primary"
                    onClick={handleNext}
                    disabled={!canProceed || isLoading}
                >
                    {isLoading
                        ? 'Loading...'
                        : step === STEPS.length - 1
                          ? 'See My Results'
                          : 'Continue'}
                </button>
            </div>
        </div>
    );
}
