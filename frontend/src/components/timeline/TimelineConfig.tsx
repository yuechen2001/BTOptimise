import { useState } from 'react';
import type { TimelineConfig, UserProfile } from '../../types';

interface TimelineConfigProps {
    config: TimelineConfig;
    onSave: (newConfig: TimelineConfig) => void;
    profile: Partial<UserProfile>;
}

export default function TimelineConfigComponent({ config, onSave, profile }: TimelineConfigProps) {
    const [localConfig, setLocalConfig] = useState<TimelineConfig>(config);
    const isDeferredIncome =
        profile.employmentStatus === 'student' || profile.employmentStatus === 'nsf';
    const hasChanges = JSON.stringify(localConfig) !== JSON.stringify(config);

    const updateConfig = (updates: Partial<TimelineConfig>) => {
        setLocalConfig((prev) => ({ ...prev, ...updates }));
    };

    const handleSave = () => {
        onSave(localConfig);
    };

    const monthlyIncome = profile.monthlyIncome || 0;
    const partnerIncome = profile.partnerMonthlyIncome || 0;
    const totalMonthlyIncome = monthlyIncome + partnerIncome;
    const savingsRate =
        localConfig.cashSavingsRate !== undefined ? localConfig.cashSavingsRate : 0.1;
    const monthlySavings = totalMonthlyIncome * savingsRate;

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    paddingBottom: '1rem',
                }}
            >
                {/* Cash Savings Rate Configuration */}
                <div>
                    <h4
                        style={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: 'var(--clr-accent)',
                        }}
                    >
                        Monthly Cash Savings
                    </h4>
                    <span
                        className="hint"
                        style={{
                            fontSize: '0.75rem',
                            color: 'var(--clr-text-muted)',
                            display: 'block',
                            marginTop: '0.25rem',
                            marginBottom: '0.50rem',
                        }}
                    >
                        Percentage of monthly income saved as cash (excludes CPF contributions)
                    </span>
                    <div className="form-group">
                        <label
                            htmlFor="savings-rate"
                            style={{
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                marginBottom: '0.5rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <span>Savings Rate</span>
                            <span style={{ color: 'var(--clr-accent)' }}>
                                {Math.round(savingsRate * 100)}%
                            </span>
                        </label>
                        <input
                            id="savings-rate"
                            type="range"
                            min="0"
                            max="50"
                            step="5"
                            value={Math.round(savingsRate * 100)}
                            onChange={(e) => {
                                const percentage = parseInt(e.target.value);
                                updateConfig({
                                    cashSavingsRate: percentage / 100,
                                });
                            }}
                            style={{
                                width: '100%',
                                accentColor: 'var(--clr-accent)',
                            }}
                        />
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.7rem',
                                color: 'var(--clr-text-muted)',
                                marginTop: '0.25rem',
                            }}
                        >
                            <span>0%</span>
                            <span>50%</span>
                        </div>
                        {totalMonthlyIncome > 0 && (
                            <div
                                style={{
                                    marginTop: '0.75rem',
                                    padding: '0.75rem',
                                    background: 'var(--clr-bg-tertiary)',
                                    borderRadius: '6px',
                                    border: '1px solid var(--clr-border)',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '1.2rem',
                                        fontWeight: 600,
                                        color: 'var(--clr-accent)',
                                    }}
                                >
                                    $
                                    {monthlySavings.toLocaleString(undefined, {
                                        maximumFractionDigits: 0,
                                    })}
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--clr-text-muted)',
                                        marginTop: '0.25rem',
                                    }}
                                >
                                    {savingsRate * 100}% of ${totalMonthlyIncome.toLocaleString()}{' '}
                                    household income
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Deferred Income Assessment */}
                {isDeferredIncome && (
                    <>
                        <div
                            style={{
                                borderTop: '1px solid var(--clr-border)',
                                paddingTop: '1rem',
                                marginTop: '0.5rem',
                            }}
                        >
                            <h4
                                style={{
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    marginBottom: '0.75rem',
                                    color: 'var(--clr-accent)',
                                }}
                            >
                                Deferred Income Assessment
                            </h4>
                        </div>

                        <div className="form-group">
                            <label
                                htmlFor="employment-date"
                                style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    marginBottom: '0.5rem',
                                    display: 'block',
                                }}
                            >
                                Expected Employment Date
                            </label>
                            <input
                                id="employment-date"
                                type="date"
                                className="form-input"
                                value={localConfig.assumeEmploymentDate || ''}
                                onChange={(e) => {
                                    updateConfig({
                                        assumeEmploymentDate: e.target.value || undefined,
                                    });
                                }}
                                style={{ width: '100%' }}
                            />
                            <span
                                className="hint"
                                style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}
                            >
                                NSF ORD / Graduation
                            </span>
                        </div>

                        <div className="form-group">
                            <label
                                htmlFor="starting-salary"
                                style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    marginBottom: '0.5rem',
                                    display: 'block',
                                }}
                            >
                                Expected Starting Salary
                            </label>
                            <input
                                id="starting-salary"
                                type="number"
                                className="form-input"
                                placeholder="Monthly income ($)"
                                value={localConfig.assumedStartingSalary || ''}
                                onChange={(e) => {
                                    const value = e.target.value
                                        ? parseFloat(e.target.value)
                                        : undefined;
                                    updateConfig({
                                        assumedStartingSalary: value,
                                    });
                                }}
                                style={{ width: '100%' }}
                            />
                            <span
                                className="hint"
                                style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}
                            >
                                First month income after employment
                            </span>
                        </div>
                    </>
                )}
            </div>

            {/* Save Button */}
            {hasChanges && (
                <div
                    style={{
                        position: 'sticky',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '1rem',
                        background: 'var(--clr-bg-secondary)',
                        borderTop: '1px solid var(--clr-border)',
                        marginTop: '1rem',
                        marginLeft: '-1rem',
                        marginRight: '-1rem',
                        marginBottom: '-1rem',
                        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.05)',
                    }}
                >
                    <button
                        onClick={handleSave}
                        className="btn"
                        style={{
                            padding: '0.75rem 1rem',
                            background: 'var(--clr-accent)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            width: '100%',
                            transition: 'all 200ms ease',
                        }}
                    >
                        Save & Update
                    </button>
                </div>
            )}
        </div>
    );
}
