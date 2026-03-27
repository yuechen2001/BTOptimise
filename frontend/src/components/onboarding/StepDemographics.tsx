import { useAppState } from '../../context/AppContext';
import type { ApplicantType, CitizenshipStatus } from '../../types';

const COUPLE_CITIZENSHIP_OPTIONS: { value: CitizenshipStatus; label: string }[] = [
    { value: 'SC/SC', label: 'Both Singapore Citizens' },
    { value: 'SC/PR', label: 'SC + Permanent Resident' },
];

const SINGLE_CITIZENSHIP_OPTIONS: { value: CitizenshipStatus; label: string }[] = [
    { value: 'SC', label: 'Singapore Citizen (Single)' },
];

export default function StepDemographics() {
    const { state, dispatch } = useAppState();
    const p = state.onboarding.profile;
    const minimumAge = p.applicantType === 'single' ? 35 : 21;
    const citizenshipOptions =
        p.applicantType === 'single'
            ? SINGLE_CITIZENSHIP_OPTIONS
            : p.applicantType === 'couple'
              ? COUPLE_CITIZENSHIP_OPTIONS
              : [...COUPLE_CITIZENSHIP_OPTIONS, ...SINGLE_CITIZENSHIP_OPTIONS];

    function update(payload: Record<string, unknown>) {
        dispatch({ type: 'UPDATE_PROFILE', payload });
    }

    function handleApplicantTypeChange(applicantType: ApplicantType) {
        if (applicantType === 'single') {
            update({
                applicantType,
                partnerAge: undefined,
                citizenship: 'SC',
            });
            return;
        }

        update({
            applicantType,
            citizenship: p.citizenship === 'SC' ? undefined : p.citizenship,
        });
    }

    return (
        <div>
            <h2 className="section-title">About You</h2>
            <p className="section-subtitle">
                Tell us about your household so we can determine your eligibility and grant
                entitlements.
            </p>

            {/* Applicant type */}
            <div className="form-group">
                <label>Are you applying as a couple or single?</label>
                <div className="check-group">
                    {(['couple', 'single'] as ApplicantType[]).map((t) => (
                        <label
                            key={t}
                            className={`check-chip ${p.applicantType === t ? 'selected' : ''}`}
                        >
                            <input
                                type="radio"
                                name="applicantType"
                                checked={p.applicantType === t}
                                onChange={() => handleApplicantTypeChange(t)}
                            />
                            {t === 'couple' ? 'Couple / Fiancé(e)' : 'Single (35+)'}
                        </label>
                    ))}
                </div>
            </div>

            {/* Age */}
            <div className="form-group">
                <label>Your age</label>
                <input
                    className="form-input"
                    type="number"
                    min={minimumAge}
                    max={80}
                    placeholder={p.applicantType === 'single' ? 'e.g. 35' : 'e.g. 28'}
                    value={p.age ?? ''}
                    onChange={(e) => update({ age: Number(e.target.value) })}
                />
                {p.age !== undefined && p.age < minimumAge && (
                    <span className="hint" style={{ color: 'var(--clr-red)' }}>
                        {p.applicantType === 'single'
                            ? 'Single applicants must be at least 35 years old to apply for a BTO.'
                            : 'You must be at least 21 years old to apply for a BTO.'}
                    </span>
                )}
            </div>

            {/* Partner age */}
            {p.applicantType === 'couple' && (
                <div className="form-group">
                    <label>Partner's age</label>
                    <input
                        className="form-input"
                        type="number"
                        min={21}
                        max={80}
                        placeholder="e.g. 27"
                        value={p.partnerAge ?? ''}
                        onChange={(e) => update({ partnerAge: Number(e.target.value) })}
                    />
                    {p.partnerAge !== undefined && p.partnerAge < 21 && (
                        <span className="hint" style={{ color: 'var(--clr-red)' }}>
                            Partner must be at least 21 years old to apply for a BTO.
                        </span>
                    )}
                </div>
            )}

            {/* Citizenship */}
            <div className="form-group">
                <label>Citizenship status</label>
                <select
                    className="form-select"
                    value={p.citizenship ?? ''}
                    onChange={(e) => update({ citizenship: e.target.value as CitizenshipStatus })}
                >
                    <option value="" disabled>
                        Select...
                    </option>
                    {citizenshipOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* First-timer */}
            <div className="form-group">
                <label>First-time applicant?</label>
                <div className="check-group">
                    {[true, false].map((val) => (
                        <label
                            key={String(val)}
                            className={`check-chip ${p.firstTimer === val ? 'selected' : ''}`}
                        >
                            <input
                                type="radio"
                                name="firstTimer"
                                checked={p.firstTimer === val}
                                onChange={() => update({ firstTimer: val })}
                            />
                            {val ? 'Yes — first time' : 'No — previously applied/owned'}
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}
