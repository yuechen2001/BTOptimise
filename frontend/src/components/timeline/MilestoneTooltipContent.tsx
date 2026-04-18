import type { TimelineMilestone } from '../../types';

interface MilestoneTooltipContentProps {
    milestone: TimelineMilestone;
    projectName: string;
}

export default function MilestoneTooltipContent({
    milestone,
    projectName,
}: MilestoneTooltipContentProps) {
    const getMilestoneIcon = (type: string): string => {
        switch (type) {
            case 'bto_launch':
                return '🏗️';
            case 'option_fee_due':
                return '💰';
            case 'signing_payment_due':
                return '📝';
            case 'key_collection_payment_due':
                return '🔑';
            case 'cash_ready_option_fee':
                return '💵';
            case 'downpayment_saved':
                return '🏦';
            case 'monthly_payment_affordable':
                return '📊';
            case 'dia_expires':
                return '⚠️';
            case 'ehg_disqualification':
                return '⛔';
            case 'grant_tier_drop':
                return '📉';
            default:
                return '📍';
        }
    };

    const getMilestoneTitle = (type: string): string => {
        switch (type) {
            case 'bto_launch':
                return 'BTO Launch';
            case 'option_fee_due':
                return 'Option Fee Due';
            case 'signing_payment_due':
                return 'Signing Payment Due';
            case 'key_collection_payment_due':
                return 'Key Collection Payment Due';
            case 'cash_ready_option_fee':
                return 'Cash Ready';
            case 'downpayment_saved':
                return 'Downpayment Saved';
            case 'monthly_payment_affordable':
                return 'Monthly Payments Affordable';
            case 'dia_expires':
                return 'DIA Expires';
            case 'ehg_disqualification':
                return 'EHG Risk';
            case 'grant_tier_drop':
                return 'Grant Tier Drop Risk';
            default:
                return 'Milestone';
        }
    };

    const getMilestoneColor = (type: string): string => {
        if (
            type === 'dia_expires' ||
            type === 'ehg_disqualification' ||
            type === 'grant_tier_drop'
        ) {
            return '#EF4444'; // Red for critical
        }
        if (
            type === 'bto_launch' ||
            type === 'option_fee_due' ||
            type === 'signing_payment_due' ||
            type === 'key_collection_payment_due'
        ) {
            return '#3B82F6'; // Blue for payment milestones
        }
        if (
            type === 'cash_ready_option_fee' ||
            type === 'downpayment_saved' ||
            type === 'monthly_payment_affordable'
        ) {
            return '#10B981'; // Green for savings milestones
        }
        return '#6B7280'; // Gray for informational
    };

    const color = getMilestoneColor(milestone.type);
    const icon = getMilestoneIcon(milestone.type);
    const title = getMilestoneTitle(milestone.type);
    const date = new Date(milestone.date).toLocaleDateString('en-SG', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <div
            style={{
                padding: '0.75rem 1rem',
                background: 'var(--clr-bg-primary)',
                borderRadius: 'var(--radius-md)',
                border: `2px solid ${color}`,
                boxShadow: 'var(--shadow-lg)',
                maxWidth: '320px',
                animation: 'tooltip-fade-in 150ms ease-out',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                }}
            >
                <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color }}>{title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
                        {projectName}
                    </div>
                </div>
            </div>

            {/* Date */}
            <div
                style={{
                    fontSize: '0.8rem',
                    color: 'var(--clr-text-secondary)',
                    marginBottom: '0.5rem',
                }}
            >
                📅 {date}
            </div>

            {/* Payment Amount */}
            {milestone.paymentAmount !== undefined && milestone.paymentAmount > 0 && (
                <div style={{ marginBottom: '0.5rem' }}>
                    <div
                        style={{
                            fontSize: '0.75rem',
                            color: 'var(--clr-text-muted)',
                            marginBottom: '0.25rem',
                        }}
                    >
                        Payment Amount
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color }}>
                        ${milestone.paymentAmount.toLocaleString()}
                    </div>
                    {milestone.cashAmount !== undefined && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-secondary)' }}>
                            Cash: ${milestone.cashAmount.toLocaleString()}
                        </div>
                    )}
                </div>
            )}

            {/* Affordability Badge */}
            {milestone.canAfford !== undefined && (
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        background: milestone.canAfford
                            ? 'rgba(16, 185, 129, 0.1)'
                            : 'rgba(239, 68, 68, 0.1)',
                        color: milestone.canAfford ? 'var(--clr-green)' : 'var(--clr-red)',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                    }}
                >
                    <span>{milestone.canAfford ? '✓' : '✗'}</span>
                    <span>{milestone.canAfford ? 'Can Afford' : 'Cannot Afford'}</span>
                </div>
            )}

            {/* Critical Warning Indicator */}
            {milestone.significance === 'critical' && (
                <div
                    style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        color: 'var(--clr-red)',
                        fontWeight: 600,
                    }}
                >
                    ⚠️ Critical Event
                </div>
            )}

            {/* Hint for full details */}
            <div
                style={{
                    marginTop: '0.75rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid var(--clr-border)',
                    fontSize: '0.7rem',
                    color: 'var(--clr-text-muted)',
                    fontStyle: 'italic',
                }}
            >
                Click for full details
            </div>
        </div>
    );
}
