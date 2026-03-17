import { useAppState } from '../../context/AppContext';
import type { EmploymentStatus } from '../../types';

const EMPLOYMENT_OPTIONS: { value: EmploymentStatus; label: string; hint: string }[] = [
    { value: 'employed', label: 'Employed', hint: 'Full-time or part-time' },
    { value: 'self-employed', label: 'Self-Employed', hint: 'Freelance / business owner' },
    { value: 'student', label: 'Student', hint: 'Deferred income assessment' },
    { value: 'nsf', label: 'NSF', hint: 'National Serviceman — deferred assessment' },
];

export default function StepFinancials() {
    const { state, dispatch } = useAppState();
    const p = state.onboarding.profile;

    function update(payload: Record<string, unknown>) {
        dispatch({ type: 'UPDATE_PROFILE', payload });
    }

    const isDeferred = p.employmentStatus === 'student' || p.employmentStatus === 'nsf';

    return (
        <div>
            <h2 className="section-title">Financial Profile</h2>
            <p className="section-subtitle">
                We need your income and savings details to compute grant eligibility, loan capacity,
                and milestone cash flow.
            </p>

            {/* Employment status */}
            <div className="form-group">
                <label>Employment status</label>
                <div className="check-group">
                    {EMPLOYMENT_OPTIONS.map((o) => (
                        <label
                            key={o.value}
                            className={`check-chip ${p.employmentStatus === o.value ? 'selected' : ''}`}
                            title={o.hint}
                        >
                            <input
                                type="radio"
                                name="employmentStatus"
                                checked={p.employmentStatus === o.value}
                                onChange={() => update({ employmentStatus: o.value })}
                            />
                            {o.label}
                        </label>
                    ))}
                </div>
            </div>

            {isDeferred && (
                <div
                    className="card"
                    style={{
                        background: '#fffbeb',
                        borderColor: '#fbbf24',
                        marginBottom: 'var(--sp-lg)',
                    }}
                >
                    <p style={{ fontSize: '0.85rem', color: '#92400e' }}>
                        As a {p.employmentStatus === 'student' ? 'student' : 'national serviceman'},
                        your income assessment will be deferred. We will use $0 assessed income for
                        maximum grant estimation.
                    </p>
                </div>
            )}

            {/* Monthly income */}
            <div className="form-group">
                <label>Your gross monthly income (SGD)</label>
                <span className="hint">Before CPF deductions</span>
                <input
                    className="form-input"
                    type="number"
                    min={0}
                    step={100}
                    placeholder={isDeferred ? '0 (deferred)' : 'e.g. 4500'}
                    value={p.monthlyIncome ?? ''}
                    onChange={(e) => update({ monthlyIncome: Number(e.target.value) })}
                />
            </div>

            {/* Partner income */}
            {p.applicantType === 'couple' && (
                <div className="form-group">
                    <label>Partner's gross monthly income (SGD)</label>
                    <input
                        className="form-input"
                        type="number"
                        min={0}
                        step={100}
                        placeholder="e.g. 3500"
                        value={p.partnerMonthlyIncome ?? ''}
                        onChange={(e) => update({ partnerMonthlyIncome: Number(e.target.value) })}
                    />
                </div>
            )}

            {/* CPF OA */}
            <div className="form-group">
                <label>CPF Ordinary Account balance (SGD)</label>
                <span className="hint">Combined if applying as a couple</span>
                <input
                    className="form-input"
                    type="number"
                    min={0}
                    step={1000}
                    placeholder="e.g. 50000"
                    value={p.cpfOA ?? ''}
                    onChange={(e) => update({ cpfOA: Number(e.target.value) })}
                />
            </div>

            {/* Cash savings */}
            <div className="form-group">
                <label>Cash savings available for housing (SGD)</label>
                <span className="hint">
                    Liquid savings you can allocate to downpayment and fees
                </span>
                <input
                    className="form-input"
                    type="number"
                    min={0}
                    step={1000}
                    placeholder="e.g. 30000"
                    value={p.cashSavings ?? ''}
                    onChange={(e) => update({ cashSavings: Number(e.target.value) })}
                />
            </div>
        </div>
    );
}
