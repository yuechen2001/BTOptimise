/**
 * Timeline Configuration Component
 *
 * Sidebar-optimized configuration panel with:
 * - Income growth scenario
 * - Timeline range
 * - Opportunity cost tracking (rent input)
 * - Deferred Income Assessment (Story 1) for students/NSF
 * - Save button to apply changes
 */

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
                                📊 Deferred Income Assessment
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

            {/* Save Button - Sticky at bottom, only show when there are changes */}
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
