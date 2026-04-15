/**
 * Timeline Configuration Component
 *
 * Controls for adjusting timeline projection parameters:
 * - Income growth scenario
 * - Timeline range
 * - Opportunity cost tracking (rent input)
 */

import type { TimelineConfig, IncomeGrowthScenario, UserProfile } from '../../types';

interface TimelineConfigProps {
    config: TimelineConfig;
    onConfigChange: (newConfig: Partial<TimelineConfig>) => void;
    profile: Partial<UserProfile>;
}

export default function TimelineConfigComponent({ config, onConfigChange, profile }: TimelineConfigProps) {
    const isDeferredIncome = profile.employmentStatus === 'student' || profile.employmentStatus === 'nsf';

    return (
        <div
            style={{
                padding: '1.5rem',
                background: 'var(--clr-bg-secondary)',
                borderRadius: '8px',
                marginBottom: '1.5rem',
            }}
        >
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Configuration</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                {/* Income Growth Scenario */}
                <div className="form-group">
                    <label htmlFor="growth-scenario">Income Growth Scenario</label>
                    <select
                        id="growth-scenario"
                        className="form-input"
                        value={config.incomeGrowthScenario}
                        onChange={(e) =>
                            onConfigChange({
                                incomeGrowthScenario: e.target.value as IncomeGrowthScenario,
                            })
                        }
                    >
                        <option value="conservative">Conservative (2% p.a.)</option>
                        <option value="moderate">Moderate (4% p.a.)</option>
                        <option value="aggressive">Aggressive (6% p.a.)</option>
                    </select>
                    <span className="hint">Expected annual income increase</span>
                </div>

                {/* Timeline Range */}
                <div className="form-group">
                    <label htmlFor="timeline-years">Timeline Range (Years)</label>
                    <select
                        id="timeline-years"
                        className="form-input"
                        value={config.endYear - config.startYear}
                        onChange={(e) => {
                            const years = parseInt(e.target.value);
                            onConfigChange({
                                endYear: config.startYear + years,
                            });
                        }}
                    >
                        <option value="1">1 Year</option>
                        <option value="2">2 Years</option>
                        <option value="3">3 Years</option>
                        <option value="5">5 Years</option>
                        <option value="7">7 Years</option>
                        <option value="10">10 Years</option>
                    </select>
                    <span className="hint">How far to project into the future</span>
                </div>

                {/* Opportunity Cost Tracking */}
                <div className="form-group">
                    <label htmlFor="include-rent">
                        <input
                            id="include-rent"
                            type="checkbox"
                            checked={config.includeOpportunityCost || false}
                            onChange={(e) => {
                                onConfigChange({
                                    includeOpportunityCost: e.target.checked,
                                });
                            }}
                            style={{ marginRight: '0.5rem' }}
                        />
                        Track Opportunity Cost
                    </label>
                    {config.includeOpportunityCost && (
                        <input
                            type="number"
                            className="form-input"
                            placeholder="Monthly rent ($)"
                            value={config.currentMonthlyRent || ''}
                            onChange={(e) => {
                                const value = e.target.value ? parseFloat(e.target.value) : undefined;
                                onConfigChange({
                                    currentMonthlyRent: value,
                                });
                            }}
                            style={{ marginTop: '0.5rem' }}
                        />
                    )}
                    <span className="hint">Compare rent vs BTO purchase timing</span>
                </div>

                {/* Deferred Income Assessment (Story 1) */}
                {isDeferredIncome && (
                    <>
                        <div className="form-group">
                            <label htmlFor="employment-date">Expected Employment Date</label>
                            <input
                                id="employment-date"
                                type="date"
                                className="form-input"
                                value={config.assumeEmploymentDate || ''}
                                onChange={(e) => {
                                    onConfigChange({
                                        assumeEmploymentDate: e.target.value || undefined,
                                    });
                                }}
                            />
                            <span className="hint">When NSF ORD / graduation (Story 1: DIA)</span>
                        </div>

                        <div className="form-group">
                            <label htmlFor="starting-salary">Expected Starting Salary</label>
                            <input
                                id="starting-salary"
                                type="number"
                                className="form-input"
                                placeholder="Monthly income ($)"
                                value={config.assumedStartingSalary || ''}
                                onChange={(e) => {
                                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                                    onConfigChange({
                                        assumedStartingSalary: value,
                                    });
                                }}
                            />
                            <span className="hint">First month income after employment</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
