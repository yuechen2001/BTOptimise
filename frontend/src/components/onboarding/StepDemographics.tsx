import { useAppState } from '../../context/AppContext';
import type { ApplicantType, CitizenshipStatus } from '../../types';

const CITIZENSHIP_OPTIONS: { value: CitizenshipStatus; label: string }[] = [
    { value: 'SC/SC', label: 'Both Singapore Citizens' },
    { value: 'SC/PR', label: 'SC + Permanent Resident' },
    { value: 'SC', label: 'Singapore Citizen (Single)' },
];

export default function StepDemographics() {
    const { state, dispatch } = useAppState();
    const p = state.onboarding.profile;

    function update(payload: Record<string, unknown>) {
        dispatch({ type: 'UPDATE_PROFILE', payload });
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
                                onChange={() => update({ applicantType: t })}
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
                    min={21}
                    max={80}
                    placeholder="e.g. 28"
                    value={p.age ?? ''}
                    onChange={(e) => update({ age: Number(e.target.value) })}
                />
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
                    {CITIZENSHIP_OPTIONS.map((o) => (
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
