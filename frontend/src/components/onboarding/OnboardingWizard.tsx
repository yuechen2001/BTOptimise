import { useCallback, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAppState } from '../../context/AppContext';
import type { UserProfile } from '../../types';
import { matchProjects } from '../../services/matchingService';
import StepDemographics from './StepDemographics';
import StepFinancials from './StepFinancials';
import StepPreferences from './StepPreferences';

const STEPS = [
  { label: 'Demographics', component: StepDemographics },
  { label: 'Financials', component: StepFinancials },
  { label: 'Preferences', component: StepPreferences },
];

export default function OnboardingWizard() {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();
  const step = state.onboarding.currentStep;
  const StepComponent = STEPS[step].component;

  const canProceed = useMemo(() => {
    const p = state.onboarding.profile;
    switch (step) {
      case 0:
        return !!(p.applicantType && p.age && p.citizenship && p.firstTimer !== undefined);
      case 1:
        return !!(p.employmentStatus && p.cpfOA !== undefined && p.cashSavings !== undefined);
      case 2:
        return true; // preferences are optional
      default:
        return false;
    }
  }, [step, state.onboarding.profile]);

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      dispatch({ type: 'SET_STEP', step: step + 1 });
    } else {
      // Final step — compute results and navigate to dashboard
      const profile = state.onboarding.profile as UserProfile;
      const results = matchProjects(profile);
      dispatch({ type: 'COMPLETE_ONBOARDING' });
      dispatch({ type: 'SET_RESULTS', results });
      navigate({ to: '/dashboard' });
    }
  }, [step, state.onboarding.profile, dispatch, navigate]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      dispatch({ type: 'SET_STEP', step: step - 1 });
    }
  }, [step, dispatch]);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Stepper */}
      <div className="stepper">
        {STEPS.map((s, i) => (
          <div key={s.label} className="stepper__step-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
            <div
              className={`stepper__step ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}`}
            >
              <div className="stepper__circle">
                {i < step ? '\u2713' : i + 1}
              </div>
              <span className="stepper__label">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`stepper__line ${i < step ? 'completed' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="card" style={{ marginBottom: 'var(--sp-lg)' }}>
        <StepComponent />
      </div>

      {/* Navigation */}
      <div className="flex-between">
        <button
          className="btn btn--secondary"
          onClick={handleBack}
          disabled={step === 0}
        >
          Back
        </button>
        <button
          className="btn btn--primary"
          onClick={handleNext}
          disabled={!canProceed}
        >
          {step === STEPS.length - 1 ? 'See My Results' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
