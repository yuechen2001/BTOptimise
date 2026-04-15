/**
 * Optimal Windows Alert Component
 *
 * Displays grant optimization warnings (Story 2).
 * Alerts users when they're approaching grant disqualification or tier drops.
 */

import type { OptimalWindow } from '../../types';

interface OptimalWindowsAlertProps {
    windows: OptimalWindow[];
}

export default function OptimalWindowsAlert({ windows }: OptimalWindowsAlertProps) {
    if (windows.length === 0) return null;

    // Sort by priority
    const sortedWindows = [...windows].sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Show only the highest priority window
    const primaryWindow = sortedWindows[0];

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return {
                    bg: 'rgba(239, 68, 68, 0.1)',
                    border: '#ef4444',
                    text: '#dc2626',
                };
            case 'medium':
                return {
                    bg: 'rgba(251, 146, 60, 0.1)',
                    border: '#f59e0b',
                    text: '#ea580c',
                };
            default:
                return {
                    bg: 'rgba(59, 130, 246, 0.1)',
                    border: '#3b82f6',
                    text: '#2563eb',
                };
        }
    };

    const colors = getPriorityColor(primaryWindow.priority);
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-SG', { month: 'long', year: 'numeric' });
    };

    return (
        <div
            style={{
                padding: '1.25rem',
                background: colors.bg,
                border: `2px solid ${colors.border}`,
                borderRadius: '8px',
                marginBottom: '1.5rem',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                {/* Icon */}
                <div
                    style={{
                        fontSize: '1.5rem',
                        color: colors.text,
                        flexShrink: 0,
                    }}
                >
                    {primaryWindow.priority === 'high' ? '⚠️' : 'ℹ️'}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: colors.text, marginBottom: '0.5rem' }}>
                        {primaryWindow.priority === 'high'
                            ? 'Urgent: Grant Optimization Window'
                            : 'Grant Optimization Opportunity'}
                    </div>

                    <div style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                        <strong>{primaryWindow.reason}</strong>
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '0.75rem',
                            fontSize: '0.85rem',
                            marginBottom: '0.75rem',
                        }}
                    >
                        <div>
                            <span style={{ color: 'var(--clr-text-muted)' }}>Optimal Period:</span>{' '}
                            <strong>
                                {formatDate(primaryWindow.startDate)} - {formatDate(primaryWindow.endDate)}
                            </strong>
                        </div>
                        <div>
                            <span style={{ color: 'var(--clr-text-muted)' }}>Grant Amount:</span>{' '}
                            <strong style={{ color: '#16a34a' }}>
                                ${primaryWindow.grantAmount.toLocaleString()}
                            </strong>
                        </div>
                    </div>

                    {primaryWindow.expiryWarning && (
                        <div
                            style={{
                                padding: '0.75rem',
                                background: 'rgba(255, 255, 255, 0.6)',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                borderLeft: `3px solid ${colors.border}`,
                            }}
                        >
                            <strong>Warning:</strong> {primaryWindow.expiryWarning}
                        </div>
                    )}
                </div>
            </div>

            {/* Show additional windows if any */}
            {sortedWindows.length > 1 && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                        +{sortedWindows.length - 1} more optimization window
                        {sortedWindows.length > 2 ? 's' : ''} identified
                    </div>
                </div>
            )}
        </div>
    );
}
